import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { hasComplimentaryOwnerAccess, resolveOwnerSubscription } from './services/ownerSubscriptionAccess';
import type { UserSubscription } from '../drizzle/schema';

const config = {openId:'platform-owner',legacyOpenId:'legacy-owner',email:'owner@example.test'};
const owner = {id:7,openId:'platform-owner',email:'owner@example.test',emailVerified:true};
const billing = {id:5,userId:7,tier:'starter',status:'cancelled',stripeCustomerId:'cus_prior',stripeSubscriptionId:'sub_prior',stripePriceId:'price_prior',trialEndsAt:null,currentPeriodStart:new Date(0),currentPeriodEnd:new Date(1),cancelledAt:new Date(1),pausedAt:null,pauseExpiresAt:null,createdAt:new Date(0),updatedAt:new Date(0)} as UserSubscription;
const src=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
describe('Owner complimentary Enterprise entitlement',()=>{
 it('allows exact configured owner identity and verified owner email',()=>{
  expect(hasComplimentaryOwnerAccess(owner,config)).toBe(true);
  expect(hasComplimentaryOwnerAccess({...owner,openId:'different',email:' OWNER@example.test '},config)).toBe(true);
  expect(hasComplimentaryOwnerAccess({...owner,openId:'legacy-owner'},config)).toBe(true);
 });
 it('never grants access by name, user ID, ordinary admin role, or unverified email',()=>{
  expect(hasComplimentaryOwnerAccess({id:7,openId:'other',email:'other@example.test'},config)).toBe(false);
  expect(hasComplimentaryOwnerAccess({id:8,openId:'admin',email:'admin@example.test',emailVerified:true},config)).toBe(false);
  expect(hasComplimentaryOwnerAccess({...owner,openId:'other',emailVerified:false},config)).toBe(false);
  expect(hasComplimentaryOwnerAccess(null,config)).toBe(false);
 });
 it('produces active non-expiring Enterprise at zero subscription cost without Stripe credentials',()=>{
  expect(resolveOwnerSubscription(owner,billing,config)).toMatchObject({userId:7,tier:'enterprise',status:'active',isComplimentary:true,accessSource:'platform_owner',subscriptionPrice:0,stripeSubscriptionId:null,stripeCustomerId:null,currentPeriodEnd:null,trialEndsAt:null,billingStatus:'cancelled',billingTier:'starter'});
 });
 it('does not mutate prior subscription or invent Stripe payments',()=>{
  const before=structuredClone(billing);resolveOwnerSubscription(owner,billing,config);
  expect(billing).toEqual(before);expect(billing.stripeSubscriptionId).toBe('sub_prior');
 });
 it('works without creating a missing billing record',()=>{
  expect(resolveOwnerSubscription(owner,null,config)).toMatchObject({id:0,tier:'enterprise',status:'active',billingStatus:null});
 });
 it.each(['active','cancelled','past_due','trialing','paused'] as const)('remains Enterprise when raw Stripe status becomes %s',status=>{
  expect(resolveOwnerSubscription(owner,{...billing,status},config)).toMatchObject({tier:'enterprise',status:'active',billingStatus:status});
 });
 it('returns exact original objects and limits for every non-owner',()=>{
  for(const tier of ['free','starter','professional','enterprise'] as const){const sub={...billing,tier,userId:99};expect(resolveOwnerSubscription({id:99,openId:'other',email:'other@example.test'},sub,config)).toBe(sub);}
  expect(resolveOwnerSubscription({id:99},null,config)).toBeNull();
 });
 it('uses effective entitlement at both central feature read paths and raw billing for upserts',()=>{
  const db=src('server/db.ts');const pricing=src('server/services/pricingTierService.ts');
  expect(db).toContain('const ownerSubscription = resolveOwnerSubscription(user, subscription)');
  expect(db).toContain("if (ownerSubscription?.accessSource === 'platform_owner') return ownerSubscription");
  expect(db).toContain('return applyComplimentaryGrant(userId, ownerSubscription)');
  expect(db).toContain('const existing = await getBillingSubscriptionByUserId(data.userId)');
  expect(pricing).toContain('const subscription = await getSubscriptionByUserId(userId)');
 });
 it('blocks owner checkout/reactivation and does not bypass role or athlete gates',()=>{
  const routers=src('server/routers.ts');
  expect(routers).toContain('createCheckoutSession: paidSubscriptionProcedure');
  expect(routers).toContain('reactivate: paidSubscriptionProcedure');
  expect(routers).toContain('resume: paidSubscriptionProcedure');
  expect(routers).toContain("ctx.user.role !== 'artist'");
  expect(src('server/routers/rider.ts')).toContain('requireOwnedAthleteProfile');
 });
});
