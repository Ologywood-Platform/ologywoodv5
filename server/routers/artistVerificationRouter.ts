import { router, protectedProcedure } from "../_core/trpc";
import { artistVerificationService } from "../services/artistVerificationService";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const artistVerificationRouter = router({
  /**
   * Submit verification request
   */
  submitRequest: protectedProcedure
    .input(
      z.object({
        idDocumentUrl: z.string().url(),
        idDocumentType: z.enum(["passport", "drivers_license", "national_id"]),
        fullName: z.string(),
        dateOfBirth: z.date(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        country: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "artist") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only artists can submit verification" });
      }

      const status = await artistVerificationService.submitVerificationRequest({
        userId: ctx.user.id,
        ...input,
        submittedAt: new Date(),
      });

      return status;
    }),

  /**
   * Get verification status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const status = await artistVerificationService.getVerificationStatus(ctx.user.id);
    return status;
  }),

  /**
   * Get verification badge
   */
  getBadge: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await artistVerificationService.getVerificationBadge(input.userId);
    }),

  /**
   * Check if user is verified
   */
  isVerified: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await artistVerificationService.isUserVerified(input.userId);
    }),

  /**
   * Get background check result
   */
  getBackgroundCheckResult: protectedProcedure.query(async ({ ctx }) => {
    return await artistVerificationService.getBackgroundCheckResult(ctx.user.id);
  }),

  /**
   * Appeal verification rejection
   */
  appealRejection: protectedProcedure
    .input(z.object({ appealReason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const status = await artistVerificationService.getVerificationStatus(ctx.user.id);

      if (!status || status.status !== "rejected") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only appeal rejected verifications" });
      }

      return await artistVerificationService.appealVerificationRejection(ctx.user.id, input.appealReason);
    }),

  /**
   * Admin: Get pending verifications
   */
  getPendingVerifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      return await artistVerificationService.getPendingVerifications(input.limit, input.offset);
    }),

  /**
   * Admin: Approve verification
   */
  approveVerification: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      return await artistVerificationService.approveVerification(input.userId, ctx.user.id);
    }),

  /**
   * Admin: Reject verification
   */
  rejectVerification: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      return await artistVerificationService.rejectVerification(input.userId, input.reason, ctx.user.id);
    }),

  /**
   * Admin: Get verification statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }

    return await artistVerificationService.getVerificationStats();
  }),

  /**
   * Admin: Get verified artists count
   */
  getVerifiedCount: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }

    return await artistVerificationService.getVerifiedArtistsCount();
  }),
});
