import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { RELEASE_ORDER_KINDS } from '../../shared/releaseOrder';
import { getReleaseOrderStateForUser, saveReleaseOrderForUser } from '../services/releaseOrderService';

const kind = z.enum(RELEASE_ORDER_KINDS);

export const releaseOrderRouter = router({
  get: protectedProcedure
    .input(z.object({ kind }))
    .query(({ ctx, input }) => getReleaseOrderStateForUser(ctx.user.id, input.kind)),

  save: protectedProcedure
    .input(z.object({
      kind,
      expectedRevision: z.number().int().nonnegative().safe(),
      ids: z.array(z.number().int().positive().safe()).max(10_000),
      reset: z.boolean().optional(),
    }))
    .mutation(({ ctx, input }) => saveReleaseOrderForUser(ctx.user.id, input)),
});
