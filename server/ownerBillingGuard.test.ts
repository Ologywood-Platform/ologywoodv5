import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({subscription:vi.fn(),billing:vi.fn()}));
vi.mock('./db',async importOriginal=>({...await importOriginal<typeof import('./db')>(),getSubscriptionByUserId:mocks.subscription,getBillingSubscriptionByUserId:mocks.billing}));
import { appRouter } from './routers';
const user={id:7,openId:'owner',email:'owner@example.test',role:'artist',name:'Owner'};
const ctx=(u:any=user)=>({user:u,req:{headers:{},protocol:'https'},res:{}} as any);
describe('Complimentary owner paid-subscription guard',()=>{
 beforeEach(()=>{vi.clearAllMocks();mocks.subscription.mockResolvedValue({userId:7,tier:'enterprise',status:'active',isComplimentary:true,subscriptionPrice:0,accessSource:'platform_owner'});});
 it('returns owner access through the authenticated subscription endpoint',async()=>{
  const result=await appRouter.createCaller(ctx()).subscription.getMy();
  expect(result).toMatchObject({tier:'enterprise',status:'active',isComplimentary:true,subscriptionPrice:0});
  expect(mocks.subscription).toHaveBeenCalledWith(7);
 });
 it.each(['reactivate','resume'] as const)('blocks %s without reading raw billing or contacting Stripe',async action=>{
  await expect(appRouter.createCaller(ctx()).subscription[action]()).rejects.toMatchObject({code:'BAD_REQUEST'});
  expect(mocks.billing).not.toHaveBeenCalled();
 });
 it('blocks a paid checkout before Stripe customer creation',async()=>{
  await expect(appRouter.createCaller(ctx()).subscription.createCheckoutSession({plan:'enterprise',successUrl:'https://example.test/success',cancelUrl:'https://example.test/cancel'})).rejects.toMatchObject({code:'BAD_REQUEST'});
  expect(mocks.billing).not.toHaveBeenCalled();
 });
 it('rejects anonymous entitlement reads before any lookup',async()=>{
  await expect(appRouter.createCaller(ctx(null)).subscription.getMy()).rejects.toMatchObject({code:'UNAUTHORIZED'});
  expect(mocks.subscription).not.toHaveBeenCalled();
 });
 it('does not convert another user to complimentary access',async()=>{
  mocks.subscription.mockResolvedValue({userId:99,tier:'starter',status:'active'});
  const result=await appRouter.createCaller(ctx({...user,id:99,openId:'other',email:'other@example.test'})).subscription.getMy();
  expect(result).toEqual({userId:99,tier:'starter',status:'active'});
 });
});
