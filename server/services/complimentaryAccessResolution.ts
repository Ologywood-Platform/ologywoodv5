import type { UserSubscription } from '../../drizzle/schema';
import type { EffectiveSubscription } from './ownerSubscriptionAccess';
import { getGrantStatus, hasPotentiallyBillingSubscription, type GrantState } from '../../shared/complimentaryAccess';
export function resolveComplimentarySubscription(userId:number,billing:EffectiveSubscription|null,grant:GrantState|null,now=new Date()):EffectiveSubscription|null {
  if(billing?.accessSource==='platform_owner'||!grant)return billing;
  // Never label an existing paid/paused/past-due Stripe subscription as free or silently replace its billing.
  if(hasPotentiallyBillingSubscription(billing, now))return billing;
  const status=getGrantStatus(grant,now);
  const base:UserSubscription=billing??{id:0,userId,tier:'free',status:'active',stripeCustomerId:null,stripeSubscriptionId:null,stripePriceId:null,trialEndsAt:null,currentPeriodStart:null,currentPeriodEnd:null,cancelledAt:null,pausedAt:null,pauseExpiresAt:null,createdAt:now,updatedAt:now};
  if(status!=='active') {
    if(billing&&(billing.status==='active'||billing.status==='trialing'))return billing;
    return {...base,tier:'free',status:'active',isComplimentary:false,accessSource:status==='expired'?'expired_grant':'revoked_grant',subscriptionPrice:0,complimentaryExpiresAt:grant.expiresAt,billingStatus:billing?.status??null,billingTier:billing?.tier??null};
  }
  return {...base,tier:grant.tier,status:'active',stripeCustomerId:null,stripeSubscriptionId:null,stripePriceId:null,trialEndsAt:null,currentPeriodStart:null,currentPeriodEnd:null,cancelledAt:null,pausedAt:null,pauseExpiresAt:null,isComplimentary:true,accessSource:'complimentary_grant',subscriptionPrice:0,complimentaryExpiresAt:grant.expiresAt,billingStatus:billing?.status??null,billingTier:billing?.tier??null,hasExistingStripeSubscription:!!billing?.stripeSubscriptionId};
}
