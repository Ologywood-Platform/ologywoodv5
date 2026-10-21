import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import {
  archiveRiderDocument,
  clearDefaultRiderDocument,
  getRiderDocumentLibrary,
  getRiderDocumentLibraryContext,
  replaceRiderDocument,
  setDefaultRiderDocument,
  uploadRiderDocument,
} from '../services/riderDocumentService';

const positiveId = z.number().int().positive().safe();
const revision = z.number().int().positive().safe();
const ownerInput = z.object({ ownerUserId: positiveId.optional() }).strict();
const uploadInput = ownerInput.extend({
  title: z.string().trim().min(1).max(255),
  fileName: z.string().trim().min(5).max(255).regex(/\.pdf$/i),
  pdfBase64: z.string().min(4).max(14_000_000),
}).strict();
const replaceInput = ownerInput.extend({
  documentId: positiveId,
  expectedRevision: revision,
  fileName: z.string().trim().min(5).max(255).regex(/\.pdf$/i),
  pdfBase64: z.string().min(4).max(14_000_000),
}).strict();

// Expensive parsing/encryption/upload attempts are bounded in-memory with no
// cron. Keys include both actor and effective owner so a single manager cannot
// fan out load across libraries and many actors cannot flood one owner.
const ATTEMPT_WINDOW_MS = 60_000;
const MAX_ATTEMPTS_PER_WINDOW = 4;
const attempts = new Map<string, { count: number; resetAt: number }>();

function checkExpensiveAttempt(actorId: number, ownerUserId: number): void {
  const now = Date.now();
  for (const [key, record] of attempts) if (record.resetAt <= now) attempts.delete(key);
  for (const key of [`actor:${actorId}`, `owner:${ownerUserId}`, `actor-owner:${actorId}:${ownerUserId}`]) {
    const prior = attempts.get(key);
    const record = !prior || prior.resetAt <= now ? { count: 0, resetAt: now + ATTEMPT_WINDOW_MS } : prior;
    record.count += 1;
    attempts.set(key, record);
    if (record.count > MAX_ATTEMPTS_PER_WINDOW) {
      throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many rider PDF upload attempts. Please wait a minute and try again.' });
    }
  }
}

export const riderDocumentsRouter = router({
  context: protectedProcedure.input(ownerInput.optional()).query(async ({ ctx, input }) =>
    getRiderDocumentLibraryContext(ctx.user.id, input?.ownerUserId),
  ),
  list: protectedProcedure.input(ownerInput.optional()).query(async ({ ctx, input }) =>
    getRiderDocumentLibrary(ctx.user.id, input?.ownerUserId),
  ),
  upload: protectedProcedure.input(uploadInput).mutation(async ({ ctx, input }) => {
    // Resolve before charging the limiter: an omitted owner for a manager must
    // still consume the actual talent owner's shared upload budget.
    const context = await getRiderDocumentLibraryContext(ctx.user.id, input.ownerUserId);
    checkExpensiveAttempt(ctx.user.id, context.ownerUserId);
    return uploadRiderDocument(ctx.user.id, { ...input, ownerUserId: context.ownerUserId });
  }),
  replace: protectedProcedure.input(replaceInput).mutation(async ({ ctx, input }) => {
    const context = await getRiderDocumentLibraryContext(ctx.user.id, input.ownerUserId);
    checkExpensiveAttempt(ctx.user.id, context.ownerUserId);
    return replaceRiderDocument(ctx.user.id, { ...input, ownerUserId: context.ownerUserId });
  }),
  setDefault: protectedProcedure.input(ownerInput.extend({ documentId: positiveId, expectedRevision: revision }).strict()).mutation(async ({ ctx, input }) =>
    setDefaultRiderDocument(ctx.user.id, input),
  ),
  clearDefault: protectedProcedure.input(ownerInput.optional()).mutation(async ({ ctx, input }) =>
    clearDefaultRiderDocument(ctx.user.id, { ownerUserId: input?.ownerUserId }),
  ),
  archive: protectedProcedure.input(ownerInput.extend({ documentId: positiveId, expectedRevision: revision }).strict()).mutation(async ({ ctx, input }) =>
    archiveRiderDocument(ctx.user.id, input),
  ),
});

export function __resetRiderDocumentAttemptRateLimitForTests(): void {
  attempts.clear();
}
