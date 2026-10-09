import { describe, expect, it } from 'vitest';
import { hasPotentiallyBillingSubscription } from '../shared/complimentaryAccess';
import { resolveComplimentarySubscription } from './services/complimentaryAccessResolution';
const now=new Date('2030-06-15T12:00:00Z');
describe('Complimentary cancelled Stripe billing boundary',()=>{
 it.each([null,new Date('2030-06-16T00:00:00Z')])('blocks unknown or future cancelled billing period %s',currentPeriodEnd=>{
  expect(hasPotentiallyBillingSubscription({status:'cancelled',stripeSubscriptionId:'sub_existing',currentPeriodEnd},now)).toBe(true);
  const billing:any={userId:2,tier:'professional',status:'cancelled',stripeSubscriptionId:'sub_existing',currentPeriodEnd};
  const grant:any={userId:2,tier:'enterprise',status:'active',expiresAt:null};
  expect(resolveComplimentarySubscription(2,billing,grant,now)).toBe(billing);
 });
 it('allows ended cancelled billing only after the recorded period end',()=>{
  expect(hasPotentiallyBillingSubscription({status:'cancelled',stripeSubscriptionId:'sub_existing',currentPeriodEnd:new Date('2030-06-14T00:00:00Z')},now)).toBe(false);
 });
 it('does not block an account with no Stripe subscription reference',()=>{
  expect(hasPotentiallyBillingSubscription({status:'active',stripeSubscriptionId:null},now)).toBe(false);
 });
});
