import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { VIDEO_PORTFOLIO_MANAGEMENT_MAX_IDS } from '../../shared/videoPortfolioManagement';
import {
  editVideoPortfolioTitleForUser,
  getVideoPortfolioManagementContextForUser,
  getVideoPortfolioManagementStateForUser,
  saveVideoPortfolioOrderForUser,
} from '../services/videoPortfolioManagementService';

const positiveSafeId = z.number().int().safe().positive();

export const videoPortfolioManagementRouter = router({
  context: protectedProcedure.query(({ ctx }) =>
    getVideoPortfolioManagementContextForUser(ctx.user.id)),

  getState: protectedProcedure.query(({ ctx }) =>
    getVideoPortfolioManagementStateForUser(ctx.user.id)),

  editTitle: protectedProcedure
    .input(z.object({
      id: positiveSafeId,
      title: z.string().transform(value => value.trim()).pipe(z.string().min(1).max(255)),
      expectedTitle: z.string(),
    }).strict())
    .mutation(({ ctx, input }) => editVideoPortfolioTitleForUser(ctx.user.id, input)),

  saveOrder: protectedProcedure
    .input(z.object({
      ids: z.array(positiveSafeId).max(VIDEO_PORTFOLIO_MANAGEMENT_MAX_IDS)
        .refine(ids => new Set(ids).size === ids.length, 'Video IDs must be unique'),
      expectedRevision: z.string().regex(/^[a-f0-9]{64}$/),
    }).strict())
    .mutation(({ ctx, input }) => saveVideoPortfolioOrderForUser(ctx.user.id, input)),
});
