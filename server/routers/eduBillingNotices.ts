import { z } from 'zod';
import { asc, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { adminProcedure, router } from '../_core/trpc';
import { getDb, getPool } from '../db';
import { eduBillingNotices } from '../../drizzle/schema';
import { EduBillingBlocked, resolveEduNoticeDelivery, type EduSqlPool } from '../services/eduBillingService';

export const eduBillingNoticesRouter = router({
  list: adminProcedure.input(z.object({ offset: z.number().int().min(0).max(5000).default(0) }).strict()).query(async ({ input }) => {
    const database = await getDb();
    if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'EDU notice review is temporarily unavailable.' });
    const rows = await database.select().from(eduBillingNotices).where(eq(eduBillingNotices.state, 'attempting'))
      .orderBy(asc(eduBillingNotices.createdAt), asc(eduBillingNotices.noticeKey)).limit(51).offset(input.offset);
    return { notices: rows.slice(0, 50), hasMore: rows.length > 50 };
  }),
  resolve: adminProcedure.input(z.object({
    noticeKey: z.string().regex(/^edu:[0-9]+:[0-9]+:[a-z_]+:[a-z0-9]+$/).max(191),
    decision: z.enum(['accepted', 'not_accepted']), providerEvidence: z.string().trim().min(10).max(500),
    acceptedAt: z.string().datetime({ offset: true }).optional(),
  }).strict()).mutation(async ({ input, ctx }) => {
    await getDb(); const pool = getPool();
    if (!pool) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'EDU notice review is temporarily unavailable.' });
    try {
      return await resolveEduNoticeDelivery({ ...input, actorUserId: ctx.user.id, acceptedAt: input.acceptedAt ? new Date(input.acceptedAt) : undefined }, {
        pool: pool as unknown as EduSqlPool,
        // adminProcedure establishes current server-side authorization; a client cannot supply the actor.
        authorize: async actorId => actorId === ctx.user.id,
      });
    } catch (error) {
      if (error instanceof EduBillingBlocked) throw new TRPCError({ code: error.reason.includes('conflict') || error.reason.includes('in_flight') ? 'CONFLICT' : 'BAD_REQUEST',
        message: error.reason.includes('in_flight') ? 'This attempt may still be sending. Wait two minutes and refresh.' : 'Check provider evidence, acceptance time, and the latest notice state before saving.' });
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'We could not save the notice audit. No retry was authorized.' });
    }
  }),
});
