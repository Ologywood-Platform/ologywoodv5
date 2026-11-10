import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { adminProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { eduVerificationEvents, eduVerifications, users } from '../../drizzle/schema';
import { getEduApprovalWindow, getEffectiveEduStatus, getPermittedEduReviewActions, isEduVerificationEligible } from '../../shared/eduPolicy';
import { eduBillingNoticesRouter } from './eduBillingNotices';

export { isEduVerificationEligible } from '../../shared/eduPolicy';

const verificationMethod = z.enum(['school_email', 'school_code', 'manual']);
const institution = z.string().trim().min(2).max(200);
const clearRenewal = {
  renewalVerificationMethod: null, renewalInstitution: null, renewalProgram: null,
  renewalSchoolEmail: null, renewalSchoolCodeLast4: null, renewalVerificationNote: null,
  renewalEvidenceAcknowledged: null, renewalSubmittedAt: null,
};
const conflict = () => new TRPCError({ code: 'CONFLICT', message: 'This EDU request changed. Refresh it and review the latest evidence.' });

export const eduRouter = router({
  billingNotices: eduBillingNoticesRouter,
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    const [row] = await db.select().from(eduVerifications).where(eq(eduVerifications.userId, ctx.user.id)).limit(1);
    if (!row) return { verification: null, eligible: false, effectiveStatus: getEffectiveEduStatus(null) };
    return {
      verification: {
        id: row.id, status: row.status, revision: row.revision,
        verificationMethod: row.verificationMethod, institution: row.institution, program: row.program,
        verifiedUntil: row.verifiedUntil, graceUntil: row.graceUntil, reviewedAt: row.reviewedAt,
        rejectionReason: row.rejectionReason, renewalSubmittedAt: row.renewalSubmittedAt,
        renewalRejectionReason: row.renewalRejectionReason,
      },
      eligible: isEduVerificationEligible(row), effectiveStatus: getEffectiveEduStatus(row),
    };
  }),

  submitVerification: protectedProcedure
    .input(z.object({
      institution, program: z.string().trim().max(200).optional(), verificationMethod,
      schoolEmail: z.string().trim().email().max(320).optional(),
      schoolCode: z.string().trim().min(4).max(64).optional(),
      verificationNote: z.string().trim().min(10).max(1000),
      evidenceAcknowledged: z.literal(true),
    }).strict())
    .mutation(async ({ ctx, input }) => {
      if (input.verificationMethod === 'school_email' && !input.schoolEmail) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Enter a school email for manual evidence review; email ownership is not verified automatically.' });
      }
      if (input.verificationMethod === 'school_code' && !input.schoolCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Enter a school code for manual evidence review; code validity is not verified automatically.' });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const now = new Date();
      const evidence = {
        verificationMethod: input.verificationMethod, institution: input.institution, program: input.program || null,
        schoolEmail: input.verificationMethod === 'school_email' ? input.schoolEmail! : null,
        schoolCodeLast4: input.verificationMethod === 'school_code' ? input.schoolCode!.slice(-4) : null,
        // Do not persist a complete code accidentally pasted into the narrative/audit.
        verificationNote: (input.schoolCode ? input.verificationNote.split(input.schoolCode).join('[code redacted]') : input.verificationNote).slice(0, 1000),
        evidenceAcknowledged: true,
      };
      return db.transaction(async tx => {
        // Serialize even the first submission (there is no verification row to lock yet).
        const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, ctx.user.id)).limit(1).for('update');
        if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Account not found' });
        const [existing] = await tx.select().from(eduVerifications).where(eq(eduVerifications.userId, ctx.user.id)).limit(1).for('update');
        const isRenewal = existing?.status === 'approved';
        let verificationId: number;
        const revision = existing ? existing.revision + 1 : 1;
        if (existing) {
          const changes = isRenewal ? {
            renewalVerificationMethod: evidence.verificationMethod, renewalInstitution: evidence.institution,
            renewalProgram: evidence.program, renewalSchoolEmail: evidence.schoolEmail,
            renewalSchoolCodeLast4: evidence.schoolCodeLast4, renewalVerificationNote: evidence.verificationNote,
            renewalEvidenceAcknowledged: true, renewalSubmittedAt: now, renewalRejectionReason: null,
          } : {
            ...evidence, ...clearRenewal, renewalRejectionReason: null, status: 'pending' as const,
            verifiedUntil: null, graceUntil: null, reviewedAt: null, reviewedByUserId: null, rejectionReason: null,
          };
          const [result] = await tx.update(eduVerifications).set({ ...changes, revision, updatedAt: now })
            .where(and(eq(eduVerifications.id, existing.id), eq(eduVerifications.revision, existing.revision)));
          if (result.affectedRows !== 1) throw conflict();
          verificationId = existing.id;
        } else {
          const [created] = await tx.insert(eduVerifications).values({ userId: ctx.user.id, status: 'pending', revision, ...evidence }).$returningId();
          if (!created) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Could not save EDU evidence' });
          verificationId = created.id;
        }
        await tx.insert(eduVerificationEvents).values({
          verificationId, userId: ctx.user.id, actorUserId: ctx.user.id,
          action: 'submitted', revision, note: evidence.verificationNote,
        });
        return { success: true, status: isRenewal ? 'approved' as const : 'pending' as const, renewalPending: !!isRenewal, revision };
      });
    }),

  adminList: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    return db.select({ verification: eduVerifications, user: { id: users.id, name: users.name, email: users.email } })
      .from(eduVerifications).leftJoin(users, eq(users.id, eduVerifications.userId))
      .orderBy(desc(eduVerifications.updatedAt)).limit(200);
  }),

  adminReview: adminProcedure
    .input(z.object({
      verificationId: z.number().int().safe().positive(), expectedRevision: z.number().int().safe().nonnegative(),
      decision: z.enum(['approve', 'reject', 'revoke', 'renew']),
      note: z.string().trim().min(3).max(500), manualProofConfirmed: z.boolean().default(false),
    }).strict())
    .mutation(async ({ ctx, input }) => {
      if ((input.decision === 'approve' || input.decision === 'renew') && !input.manualProofConfirmed) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Confirm you manually reviewed documented enrollment proof. Email/code entry alone is not proof.' });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      return db.transaction(async tx => {
        const [row] = await tx.select().from(eduVerifications).where(eq(eduVerifications.id, input.verificationId)).limit(1).for('update');
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'EDU verification not found' });
        if (row.revision !== input.expectedRevision) throw conflict();
        if (!getPermittedEduReviewActions(row).includes(input.decision)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'This review action is not permitted. Renewal requires newly submitted evidence.' });
        }
        if (input.decision === 'renew' && (!row.renewalInstitution || !row.renewalVerificationMethod || !row.renewalVerificationNote || !row.renewalEvidenceAcknowledged)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Complete renewal evidence is required.' });
        }
        const now = new Date();
        const revision = row.revision + 1;
        const approved = input.decision === 'approve' || input.decision === 'renew';
        const rejectRenewal = row.status === 'approved' && input.decision === 'reject';
        const status = approved || rejectRenewal ? 'approved' as const : input.decision === 'revoke' ? 'revoked' as const : 'rejected' as const;
        const window: Partial<ReturnType<typeof getEduApprovalWindow>> = approved ? getEduApprovalWindow(now, input.decision === 'renew' ? row.verifiedUntil : null) : {};
        const changes = rejectRenewal ? { ...clearRenewal, renewalRejectionReason: input.note } : {
          ...clearRenewal, status, ...window,
          reviewedAt: now, reviewedByUserId: ctx.user.id, rejectionReason: approved ? null : input.note,
          renewalRejectionReason: null,
          // Queue local reconciliation only; this route never calls a billing API or cancels a plan.
          billingReconcileAfter: now,
          ...(approved ? { renewalNoticeSentAt: null, expiryNoticeSentAt: null } : {}),
          ...(input.decision === 'renew' ? {
            verificationMethod: row.renewalVerificationMethod!, institution: row.renewalInstitution!,
            program: row.renewalProgram, schoolEmail: row.renewalSchoolEmail,
            schoolCodeLast4: row.renewalSchoolCodeLast4, verificationNote: row.renewalVerificationNote,
            evidenceAcknowledged: true,
          } : {}),
        };
        const [result] = await tx.update(eduVerifications).set({ ...changes, revision, updatedAt: now })
          .where(and(eq(eduVerifications.id, row.id), eq(eduVerifications.revision, input.expectedRevision)));
        if (result.affectedRows !== 1) throw conflict();
        await tx.insert(eduVerificationEvents).values({
          verificationId: row.id, userId: row.userId, actorUserId: ctx.user.id,
          action: input.decision === 'reject' ? 'rejected' : status,
          revision, reviewDecision: input.decision, manualProofConfirmed: input.manualProofConfirmed, note: input.note,
        });
        return { success: true, status, revision, verifiedUntil: window.verifiedUntil || row.verifiedUntil, graceUntil: window.graceUntil || row.graceUntil };
      });
    }),
});
