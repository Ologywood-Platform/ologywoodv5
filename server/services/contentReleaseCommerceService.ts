import { TRPCError } from '@trpc/server';
import type Stripe from 'stripe';
import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { contentReleases as releases, contentReleasePurchases as purchases, stripeConnectAccounts, artistProfiles, users } from '../../drizzle/schema';
import { ensureContentReleaseSchema } from './contentReleaseSchemaService';
import { getStripeClientForWebhookMode } from './stripeWebhookMode';
import { contentReleasePriceCents, isVerifiedContentPurchase, CONTENT_RELEASE_PLATFORM_FEE_PERCENT } from '../../shared/contentReleaseCommerce';
import { sendReleasePurchaseConfirmationEmail } from '../email';
import { RateLimiter } from '../utils/rateLimiter';

export const contentReleaseCheckoutLimiter=new RateLimiter({maxRequests:10,windowMs:60_000});
export const getContentReleaseCheckoutMode=()=>process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')?'live' as const:'test' as const;
async function database(){const db=await getDb();if(!db)throw new Error('Database unavailable');await ensureContentReleaseSchema(db);return db;}
function parseAmount(amount:number){
 const cents=Math.round(amount*100);
 if(!Number.isFinite(amount)||!Number.isSafeInteger(cents)||cents<0||cents>99_999_999||Math.abs(amount*100-cents)>1e-7)throw new TRPCError({code:'BAD_REQUEST',message:'Enter a valid price with no more than two decimal places.'});
 return cents;
}
export async function createContentReleaseCheckout(user:{id:number;email?:string|null;name?:string|null}, input:{releaseId:number;amount:number}){
 if(!contentReleaseCheckoutLimiter.check(String(user.id)).allowed)throw new TRPCError({code:'TOO_MANY_REQUESTS',message:'Too many checkout attempts. Please wait a minute.'});
 const db=await database();
 const [release]=await db.select().from(releases).where(and(eq(releases.id,input.releaseId),eq(releases.isPublished,true))).limit(1);
 if(!release)throw new TRPCError({code:'NOT_FOUND',message:'Release not available.'});
 if(release.userId===user.id)throw new TRPCError({code:'BAD_REQUEST',message:'This is your release. Use the creator preview; fans see the purchase controls.'});
 if(!['ticketed','unlock_after_purchase','pay_what_you_want'].includes(release.accessModel))throw new TRPCError({code:'BAD_REQUEST',message:release.accessModel==='fan_club_only'?'Join this creator’s Fan Club to access this release.':'This release is free; use its Watch / Listen button.'});
 const [existing]=await db.select().from(purchases).where(and(eq(purchases.releaseId,release.id),eq(purchases.userId,user.id))).limit(1);
 if(isVerifiedContentPurchase(existing))return {success:true,alreadyPurchased:true};
 const minimum=contentReleasePriceCents(release);
 const amount=release.accessModel==='pay_what_you_want'?parseAmount(input.amount):minimum;
 if(amount<minimum)throw new TRPCError({code:'BAD_REQUEST',message:`Minimum price is $${(minimum/100).toFixed(2)}.`});
 if(amount===0){
   await grantContentReleaseAccess({releaseId:release.id,userId:user.id,amount:0,paymentIntentId:null,creatorUserId:release.userId});
   return {success:true,alreadyPurchased:false};
 }
 if(amount<50)throw new TRPCError({code:'BAD_REQUEST',message:'Card checkout requires at least $0.50. Choose $0.50 or more.'});
 const [account]=await db.select().from(stripeConnectAccounts).where(eq(stripeConnectAccounts.artistId,release.userId)).limit(1);
 if(!account||account.status!=='active'||!account.chargesEnabled)throw new TRPCError({code:'PRECONDITION_FAILED',message:'This creator needs to finish payment setup before purchases are available. No payment was taken.'});
 const client=getStripeClientForWebhookMode(getContentReleaseCheckoutMode());
 const remote=await client.accounts.retrieve(account.stripeAccountId);
 if(!remote.charges_enabled)throw new TRPCError({code:'PRECONDITION_FAILED',message:'This creator’s payment account is not ready. No payment was taken.'});
 const fee=Math.max(1,Math.round(amount*CONTENT_RELEASE_PLATFORM_FEE_PERCENT/100));
 const origin=process.env.NODE_ENV==='production'?'https://www.ologywood.com':`http://localhost:${process.env.PORT||3000}`;
 const metadata={type:'content_release_purchase',contentReleaseId:String(release.id),buyerUserId:String(user.id),creatorUserId:String(release.userId),expectedAmountCents:String(amount),platformFeeCents:String(fee)};
 const session=await client.checkout.sessions.create({
   mode:'payment',payment_method_types:['card'],
   line_items:[{price_data:{currency:'usd',unit_amount:amount,product_data:{name:release.title,description:'Access to externally hosted content through OlogyWood'}},quantity:1}],
   metadata,client_reference_id:String(user.id),customer_email:user.email||undefined,
   payment_intent_data:{application_fee_amount:fee,transfer_data:{destination:account.stripeAccountId},metadata},
   success_url:`${origin}/my-ology?content_release_checkout=complete`,
   cancel_url:`${origin}/artist/${release.artistProfileId}?content_release_checkout=cancelled`,
 });
 if(!session.url)throw new Error('Missing Checkout URL');
 return {success:false,alreadyPurchased:false,checkoutUrl:session.url};
}

/** Called only for a validated zero-price claim or a verified paid Stripe session. */
async function grantContentReleaseAccess(input:{releaseId:number;userId:number;amount:number;paymentIntentId:string|null;creatorUserId:number}){
 const db=await database();
 const granted=await db.transaction(async tx=>{
  const [release]=await tx.select().from(releases).where(eq(releases.id,input.releaseId)).limit(1).for('update');
  if(!release||release.userId!==input.creatorUserId)throw new Error('Content Release owner mismatch');
  const [existing]=await tx.select().from(purchases).where(and(eq(purchases.releaseId,input.releaseId),eq(purchases.userId,input.userId))).limit(1);
  if(isVerifiedContentPurchase(existing)||(existing?.paymentStatus==='refunded'&&existing.stripePaymentIntentId===input.paymentIntentId))return null;
  // Never create a paid entitlement without payment proof.
  if(input.amount>0&&!input.paymentIntentId)throw new Error('Missing verified payment proof');
  if(input.amount===0&&(!release.isPublished||contentReleasePriceCents(release)>0))throw new Error('Release is not eligible for zero-price access');
  const value={amountPaid:(input.amount/100).toFixed(2),stripePaymentIntentId:input.paymentIntentId,accessGrantedAt:new Date(),paymentStatus:'completed'};
  if(existing)await tx.update(purchases).set(value).where(eq(purchases.id,existing.id));
  else await tx.insert(purchases).values({releaseId:input.releaseId,userId:input.userId,...value});
  await tx.update(releases).set({purchaseCount:sql`${releases.purchaseCount} + 1`,revenue:sql`${releases.revenue} + ${value.amountPaid}`}).where(eq(releases.id,release.id));
  return release;
 });
 if(!granted)return;
 try{
  const [buyer]=await db.select().from(users).where(eq(users.id,input.userId)).limit(1);
  const [artist]=await db.select().from(artistProfiles).where(eq(artistProfiles.id,granted.artistProfileId)).limit(1);
  if(buyer?.email)await sendReleasePurchaseConfirmationEmail({buyerEmail:buyer.email,buyerName:buyer.name||'',releaseTitle:granted.title,releaseType:granted.releaseType,creatorName:artist?.artistName||'Creator',amountPaid:input.amount/100,contentUrl:granted.contentUrl,hostingPlatform:granted.hostingPlatform,premiereDate:granted.premiereDate});
 }catch{console.warn('[ContentRelease] Optional purchase email failed');}
}

/** Only reached after the shared Stripe signature verifier succeeds. */
export async function fulfillContentReleaseCheckout(session:Stripe.Checkout.Session){
 if(session.metadata?.type!=='content_release_purchase')return;
 if(session.mode!=='payment'||session.payment_status!=='paid'||session.livemode!==(getContentReleaseCheckoutMode()==='live'))return;
 const releaseId=Number(session.metadata.contentReleaseId),userId=Number(session.metadata.buyerUserId),creatorUserId=Number(session.metadata.creatorUserId),expected=Number(session.metadata.expectedAmountCents);
 const paymentIntentId=typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id;
 if(![releaseId,userId,creatorUserId,expected].every(x=>Number.isSafeInteger(x)&&x>0)||!paymentIntentId||session.currency!=='usd'||session.amount_total!==expected)throw new Error('Invalid Content Release payment proof');
 const current=await getStripeClientForWebhookMode(getContentReleaseCheckoutMode()).paymentIntents.retrieve(paymentIntentId,{expand:['latest_charge']});
 if(current.status!=='succeeded'||current.amount_received!==expected||current.currency!=='usd'||current.metadata?.contentReleaseId!==String(releaseId)||current.metadata?.buyerUserId!==String(userId)||current.metadata?.creatorUserId!==String(creatorUserId))throw new Error('Invalid current Content Release payment state');
 const charge=typeof current.latest_charge==='object'?current.latest_charge:null;
 if(charge&&(charge.refunded||charge.amount_refunded>=charge.amount))return;
 await grantContentReleaseAccess({releaseId,userId,creatorUserId,amount:expected,paymentIntentId});
}

export async function fulfillContentReleasePaymentIntent(intent:Stripe.PaymentIntent){
 if(intent.metadata?.type!=='content_release_purchase'||intent.status!=='succeeded')return;
 await fulfillContentReleaseCheckout({id:`payment_intent:${intent.id}`,mode:'payment',payment_status:'paid',livemode:intent.livemode,currency:intent.currency,amount_total:intent.amount_received,payment_intent:intent.id,metadata:intent.metadata} as Stripe.Checkout.Session);
}

export async function refundContentReleaseCharge(charge:Stripe.Charge){
 if(charge.metadata?.type!=='content_release_purchase'||charge.livemode!==(getContentReleaseCheckoutMode()==='live')||charge.amount_refunded<charge.amount)return;
 const intent=typeof charge.payment_intent==='string'?charge.payment_intent:charge.payment_intent?.id;
 if(!intent)return;
 const client=getStripeClientForWebhookMode(getContentReleaseCheckoutMode());
 const remote=await client.paymentIntents.retrieve(intent);
 if(remote.metadata.type!=='content_release_purchase')return;
 const db=await database();
 await db.update(purchases).set({paymentStatus:'refunded'}).where(and(eq(purchases.stripePaymentIntentId,intent),eq(purchases.paymentStatus,'completed')));
}
