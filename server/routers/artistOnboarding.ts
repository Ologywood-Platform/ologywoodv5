import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  getOnboardingProgress,
  getOnboardingSteps,
  completeOnboardingStep,
  getOnboardingReward,
} from "../services/artistOnboardingService";

export const artistOnboardingRouter = router({
  // Get onboarding progress
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    try {
      const progress = await getOnboardingProgress(ctx.user.id);
      return progress;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch onboarding progress");
    }
  }),

  // Get all onboarding steps
  getSteps: protectedProcedure.query(async ({ ctx }) => {
    try {
      const steps = await getOnboardingSteps(ctx.user.id);
      return steps;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch onboarding steps");
    }
  }),

  // Complete a step
  completeStep: protectedProcedure
    .input(z.object({ stepId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const progress = await completeOnboardingStep(ctx.user.id, input.stepId);
        return { success: true, progress };
      } catch (error: any) {
        throw new Error(error.message || "Failed to complete step");
      }
    }),

  // Get onboarding reward
  getReward: protectedProcedure.query(async ({ ctx }) => {
    try {
      const reward = await getOnboardingReward(ctx.user.id);
      return reward;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch reward");
    }
  }),
});
