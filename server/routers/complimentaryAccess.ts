import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import { hasComplimentaryOwnerAccess } from '../services/ownerSubscriptionAccess';
import { requireGrantOwner, inspectComplimentaryAccess, grantComplimentaryAccess, revokeComplimentaryAccess } from '../services/complimentaryAccessService';
import { COMPLIMENTARY_TIERS } from '../../shared/complimentaryAccess';
import { notifyComplimentaryGrant } from '../services/complimentaryAccessEmailDelivery';

const ownerProcedure=protectedProcedure.use(async({ctx,next})=>{
 requireGrantOwner(ctx.user);
 const result=await next({ctx});
 if(!result.ok&&!(result.error.cause instanceof TRPCError)&&result.error.code==='INTERNAL_SERVER_ERROR'){
  console.error('[ComplimentaryAccess] Operation failed:',result.error.cause?.name??result.error.code);
  throw new TRPCError({code:'INTERNAL_SERVER_ERROR',message:'Complimentary access could not be updated or loaded. Please retry. No successful grant is assumed.'});
 }
 return result;
});
const target={userId:z.number().int().positive(),expectedRevision:z.number().int().min(0),reason:z.string().trim().min(3).max(500)};
export const complimentaryAccessRouter=router({
 capabilities:protectedProcedure.query(({ctx})=>({canManage:hasComplimentaryOwnerAccess(ctx.user)})),
 inspect:ownerProcedure.input(z.object({userId:z.number().int().positive()})).query(({ctx,input})=>inspectComplimentaryAccess(ctx.user,input.userId)),
 grant:ownerProcedure.input(z.object({...target,tier:z.enum(COMPLIMENTARY_TIERS),expiresAt:z.date().nullable(),billingAcknowledged:z.literal(true)})).mutation(async({ctx,input})=>{
  const result=await grantComplimentaryAccess(ctx.user,input);
  // A grant transaction must have committed before any email is reserved or sent.
  // Target the newly committed revision, not a later replacement or revoked grant.
  try {
   const emailNotification=await notifyComplimentaryGrant(ctx.user,input.userId,input.expectedRevision+1);
   return {...result,emailNotification};
  } catch {
   console.error('[ComplimentaryAccess] Post-grant email unavailable',{userId:input.userId});
   return {...result,emailNotification:{outcome:'error' as const}};
  }
 }),
 revoke:ownerProcedure.input(z.object(target)).mutation(({ctx,input})=>revokeComplimentaryAccess(ctx.user,input)),
});
