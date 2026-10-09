import { TRPCError } from '@trpc/server';
import { hasComplimentaryOwnerAccess, type EffectiveSubscription } from './ownerSubscriptionAccess';
import { resolveComplimentarySubscription } from './complimentaryAccessResolution';
import { ensureComplimentaryAccessSchema } from './complimentaryAccessSchemaService';
import { getGrantStatus, hasPotentiallyBillingSubscription, COMPLIMENTARY_TIERS, type GrantState, type ComplimentaryTier } from '../../shared/complimentaryAccess';
import type { User, UserSubscription } from '../../drizzle/schema';

export type GrantEvent = {id:number;userId:number;actorUserId:number;action:'grant'|'revoke';tier:ComplimentaryTier;reason:string;expiresAt:Date|null;revision:number;createdAt:Date};
const normalizeUser = (row: any): User | null => row ? { ...row, emailVerified: !!row.emailVerified } : null;
export type GrantTransaction = {
  getUserForUpdate(userId:number):Promise<User|null>;
  getBillingForUpdate(userId:number):Promise<UserSubscription|null>;
  getGrant(userId:number):Promise<GrantState|null>;
  saveGrant(grant:GrantState):Promise<void>;
  appendEvent(event:Omit<GrantEvent,'id'>):Promise<void>;
};
export type GrantRepository = {
  transaction<T>(work:(tx:GrantTransaction)=>Promise<T>):Promise<T>;
  inspect(userId:number):Promise<{user:User|null;billing:UserSubscription|null;grant:GrantState|null;events:GrantEvent[]}>;
};
export const requireGrantOwner=(actor:User|null|undefined)=>{
  if(!hasComplimentaryOwnerAccess(actor))throw new TRPCError({code:'FORBIDDEN',message:'Only the verified platform owner can manage complimentary access.'});
};

async function getGrantPool(){
  const db=await import('../db'); await db.getDb(); const pool=db.getPool();
  if(!pool)throw new TRPCError({code:'INTERNAL_SERVER_ERROR',message:'Complimentary access is temporarily unavailable. Please retry.'});
  await ensureComplimentaryAccessSchema(pool);return pool;
}
export async function getComplimentaryGrant(userId:number):Promise<GrantState|null>{
  const pool=await getGrantPool();const [rows]:any=await pool.execute('SELECT * FROM complimentary_access_grants WHERE userId=? LIMIT 1',[userId]);return rows[0]??null;
}
export async function applyComplimentaryGrant(userId:number,billing:EffectiveSubscription|null){
  if(billing?.accessSource==='platform_owner')return billing;
  const grant=await getComplimentaryGrant(userId);
  return resolveComplimentarySubscription(userId,billing,grant);
}

export const grantRepository:GrantRepository={
 async inspect(userId){
  const pool=await getGrantPool();
  const [users]:any=await pool.execute('SELECT id,openId,email,emailVerified,name,role FROM users WHERE id=? LIMIT 1',[userId]);
  const [billing]:any=await pool.execute('SELECT * FROM user_subscriptions WHERE userId=? LIMIT 1',[userId]);
  const [grants]:any=await pool.execute('SELECT * FROM complimentary_access_grants WHERE userId=? LIMIT 1',[userId]);
  const [events]:any=await pool.execute('SELECT * FROM complimentary_access_events WHERE userId=? ORDER BY id DESC LIMIT 50',[userId]);
  return {user:normalizeUser(users[0]),billing:billing[0]??null,grant:grants[0]??null,events};
 },
 async transaction(work){
  const pool=await getGrantPool();const conn=await pool.getConnection();
  try {
   await conn.beginTransaction();
   const tx:GrantTransaction={
    async getUserForUpdate(id){const [rows]:any=await conn.execute('SELECT id,openId,email,emailVerified,name,role FROM users WHERE id=? FOR UPDATE',[id]);return normalizeUser(rows[0]);},
    async getBillingForUpdate(id){const [rows]:any=await conn.execute('SELECT * FROM user_subscriptions WHERE userId=? FOR UPDATE',[id]);return rows[0]??null;},
    async getGrant(id){const [rows]:any=await conn.execute('SELECT * FROM complimentary_access_grants WHERE userId=? FOR UPDATE',[id]);return rows[0]??null;},
    async saveGrant(g){await conn.execute('INSERT INTO complimentary_access_grants (userId,tier,status,expiresAt,reason,grantedByUserId,grantedAt,revision,revokedAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE tier=VALUES(tier),status=VALUES(status),expiresAt=VALUES(expiresAt),reason=VALUES(reason),grantedByUserId=VALUES(grantedByUserId),grantedAt=VALUES(grantedAt),revision=VALUES(revision),revokedAt=VALUES(revokedAt),updatedAt=VALUES(updatedAt)',[g.userId,g.tier,g.status,g.expiresAt,g.reason,g.grantedByUserId,g.grantedAt,g.revision,g.revokedAt,g.updatedAt]);},
    async appendEvent(e){await conn.execute('INSERT INTO complimentary_access_events (userId,actorUserId,action,tier,reason,expiresAt,revision,createdAt) VALUES (?,?,?,?,?,?,?,?)',[e.userId,e.actorUserId,e.action,e.tier,e.reason,e.expiresAt,e.revision,e.createdAt]);},
   };
   const result=await work(tx);await conn.commit();return result;
  }catch(error){await conn.rollback();throw error;}finally{conn.release();}
 },
};

export async function inspectComplimentaryAccess(actor:User,userId:number,repo=grantRepository){
 requireGrantOwner(actor);
 const result=await repo.inspect(userId);
 if(!result.user)throw new TRPCError({code:'NOT_FOUND',message:'User not found.'});
 const {user,billing,grant,events}=result;
 return {user:{id:user.id,name:user.name,email:user.email},isOwner:hasComplimentaryOwnerAccess(user),billing:{tier:billing?.tier??'free',status:billing?.status??'none',hasStripeSubscription:!!billing?.stripeSubscriptionId,blocksComplimentary:hasPotentiallyBillingSubscription(billing),currentPeriodEnd:billing?.currentPeriodEnd??null},grant:grant?{userId:grant.userId,tier:grant.tier,status:grant.status,effectiveStatus:getGrantStatus(grant),expiresAt:grant.expiresAt,grantedAt:grant.grantedAt,revision:grant.revision,reason:grant.reason}:null,events:events.map(({id,action,tier,reason,expiresAt,createdAt,actorUserId})=>({id,action,tier,reason,expiresAt,createdAt,actorUserId}))};
}
export type GrantInput={userId:number;tier:ComplimentaryTier;expiresAt:Date|null;reason:string;expectedRevision:number;billingAcknowledged:true};
function assertCommonInput(input:{userId:number;reason:string;expectedRevision:number}){
 if(!Number.isInteger(input.userId)||input.userId<1||!Number.isInteger(input.expectedRevision)||input.expectedRevision<0||input.reason.trim().length<3||input.reason.trim().length>500)throw new TRPCError({code:'BAD_REQUEST',message:'Choose a valid account and add a reason (3–500 characters).'});
}
async function lockTarget(tx:GrantTransaction,actor:User,userId:number,expectedRevision:number){
 const user=await tx.getUserForUpdate(userId);
 if(!user)throw new TRPCError({code:'NOT_FOUND',message:'User not found.'});
 if(hasComplimentaryOwnerAccess(user)||actor.id===userId)throw new TRPCError({code:'BAD_REQUEST',message:'The owner already has protected complimentary Enterprise access.'});
 const existing=await tx.getGrant(userId);
 if((existing?.revision??0)!==expectedRevision)throw new TRPCError({code:'CONFLICT',message:'Access changed since you opened this account. Refresh and review the latest state before trying again.'});
 return existing;
}
export async function grantComplimentaryAccess(actor:User,input:GrantInput,repo=grantRepository,now=new Date()){
 requireGrantOwner(actor);assertCommonInput(input);
 if(!COMPLIMENTARY_TIERS.includes(input.tier)||input.billingAcknowledged!==true)throw new TRPCError({code:'BAD_REQUEST',message:'Confirm the billing notice and select a valid plan.'});
 if(input.expiresAt&&(!Number.isFinite(input.expiresAt.getTime())||input.expiresAt.getTime()<=now.getTime()||input.expiresAt.getTime()>Date.UTC(2038,0,1)))throw new TRPCError({code:'BAD_REQUEST',message:'Expiry must be in the future and before January 1, 2038.'});
 return repo.transaction(async tx=>{
  const existing=await lockTarget(tx,actor,input.userId,input.expectedRevision);
  const billing=await tx.getBillingForUpdate(input.userId);
  if(hasPotentiallyBillingSubscription(billing, now))throw new TRPCError({code:'PRECONDITION_FAILED',message:'This account has active, trialing, past-due, paused, period-end or unverified cancelled Stripe billing. Resolve its paid billing separately before granting complimentary access. No Stripe billing was changed.'});
  const state:GrantState={userId:input.userId,tier:input.tier,status:'active',expiresAt:input.expiresAt,reason:input.reason.trim(),grantedByUserId:actor.id,grantedAt:now,revision:(existing?.revision??0)+1,revokedAt:null,updatedAt:now};
  await tx.saveGrant(state);await tx.appendEvent({userId:input.userId,actorUserId:actor.id,action:'grant',tier:state.tier,reason:state.reason,expiresAt:state.expiresAt,revision:state.revision,createdAt:now});
  return {success:true as const};
 });
}
export async function revokeComplimentaryAccess(actor:User,input:{userId:number;expectedRevision:number;reason:string},repo=grantRepository,now=new Date()){
 requireGrantOwner(actor);assertCommonInput(input);
 return repo.transaction(async tx=>{
  const existing=await lockTarget(tx,actor,input.userId,input.expectedRevision);
  if(!existing||getGrantStatus(existing,now)!=='active')throw new TRPCError({code:'BAD_REQUEST',message:'There is no active complimentary grant to revoke.'});
  const state:GrantState={...existing,status:'revoked',revokedAt:now,updatedAt:now,revision:existing.revision+1};
  await tx.saveGrant(state);await tx.appendEvent({userId:input.userId,actorUserId:actor.id,action:'revoke',tier:state.tier,reason:input.reason.trim(),expiresAt:state.expiresAt,revision:state.revision,createdAt:now});
  return {success:true as const};
 });
}
