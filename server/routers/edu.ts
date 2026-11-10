import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { adminProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { eduVerificationEvents, eduVerifications, users } from '../../drizzle/schema';

const verificationMethod = z.enum(['school_email', 'school_code', 'manual']);
const institution = z.string().trim().min(2).max(200);

function activeUntil(row: typeof eduVerifications.$inferSelect, now = new Date()) {
  if (row.status !== 'approved') return false;
  const end = row.graceUntil || row.verifiedUntil;
  return !!end && end.getTime() >= now.getTime();
}

export const eduRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    const [row] = await db.select().from(eduVerifications).where(eq(eduVerifications.userId, ctx.user.id)).limit(1);
    if (!row) return { verification: null, eligible: false };
    return {
      verification: {
        id: row.id,
        status: row.status,
        verificationMethod: row.verificationMethod,
        institution: row.institution,
        program: row.program,
        verifiedUntil: row.verifiedUntil,
        graceUntil: row.graceUntil,
        reviewedAt: row.reviewedAt,
        rejectionReason: row.rejectionReason,
      },
      eligible: activeUntil(row),
    };
  }),

  submitVerification: protectedProcedure
    .input(z.object({
      institution,
      program: z.string().trim().max(200).optional(),
      verificationMethod,
      schoolEmail: z.string().trim().email().max(320).optional(),
      schoolCode: z.string().trim().min(4).max(64).optional(),
      verificationNote: z.string().trim().min(10).max(1000),
    }).strict())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      if (input.verificationMethod === 'school_email' && !input.schoolEmail) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Enter the school email used for verification.' });
      }
      if (input.verificationMethod === 'school_code' && !input.schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Enter the school code provided by your institution.' });
      }
      const now = new Date();
      const schoolCodeLast4 = input.schoolCode ? input.schoolCode.slice(-4) : null;
      const [existing] = await db.select({ id: eduVerifications.id }).from(eduVerifications).where(eq(eduVerifications.userId, ctx.user.id)).limit(1);
      let verificationId: number;
      if (existing) {
        await db.update(eduVerifications).set({
          status: 'pending',
          verificationMethod: input.verificationMethod,
          institution: input.institution,
          program: input.program || null,
          schoolEmail: input.schoolEmail || null,
          schoolCodeLast4,
          verificationNote: input.verificationNote,
          verifiedUntil: null,
          graceUntil: null,
          reviewedAt: null,
          reviewedByUserId: null,
          rejectionReason: null,
          updatedAt: now,
        }).where(eq(eduVerifications.id, existing.id));
        verificationId = existing.id;
      } else {
        const [created] = await db.insert(eduVerifications).values({
          userId: ctx.user.id,
          status: 'pending',
          verificationMethod: input.verificationMethod,
          institution: input.institution,
          program: input.program || null,
          schoolEmail: input.schoolEmail || null,
          schoolCodeLast4,
          verificationNote: input.verificationNote,
        }).$returningId();
        verificationId = created.id;
      }
      await db.insert(eduVerificationEvents).values({
        verificationId,
        userId: ctx.user.id,
        actorUserId: ctx.user.id,
        action: 'submitted',
        note: input.verificationNote,
      });
      return { success: true, status: 'pending' as const };
    }),

  adminList: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    return db.select({
      verification: eduVerifications,
      user: { id: users.id, name: users.name, email: users.email },
    }).from(eduVerifications)
      .leftJoin(users, eq(users.id, eduVerifications.userId))
      .orderBy(desc(eduVerifications.createdAt))
      .limit(200);
  }),

  adminReview: adminProcedure
    .input(z.object({
      verificationId: z.number().int().safe().positive(),
      decision: z.enum(['approve', 'reject', 'revoke']),
      note: z.string().trim().min(3).max(1000),
    }).strict())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const [row] = await db.select().from(eduVerifications).where(eq(eduVerifications.id, input.verificationId)).limit(1);
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'EDU verification not found' });
      const now = new Date();
      const status = input.decision === 'approve' ? 'approved' : input.decision === 'revoke' ? 'revoked' : 'rejected';
      const verifiedUntil = input.decision === 'approve' ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) : null;
      const graceUntil = input.decision === 'approve' ? new Date(now.getTime() + (365 + 30) * 24 * 60 * 60 * 1000) : null;
      await db.update(eduVerifications).set({
        status,
        verifiedUntil,
        graceUntil,
        reviewedAt: now,
        reviewedByUserId: ctx.user.id,
        rejectionReason: input.decision === 'approve' ? null : input.note,
        updatedAt: now,
      }).where(eq(eduVerifications.id, row.id));
      await db.insert(eduVerificationEvents).values({
        verificationId: row.id,
        userId: row.userId,
        actorUserId: ctx.user.id,
        action: status,
        note: input.note,
      });
      return { success: true, status, verifiedUntil, graceUntil };
    }),
});
