import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

export const artistVerificationRouter = router({
  submitRequest: protectedProcedure.input(z.object({ idDocumentUrl: z.string().url(), idDocumentType: z.enum(["passport", "drivers_license", "national_id"]), fullName: z.string(), dateOfBirth: z.date(), address: z.string(), city: z.string(), state: z.string(), zipCode: z.string(), country: z.string() })).mutation(async () => ({ status: "pending" })),
  getStatus: protectedProcedure.query(async () => ({ status: "pending" })),
  getBadge: protectedProcedure.input(z.object({ userId: z.string() })).query(async () => ({ verified: false })),
  isVerified: protectedProcedure.input(z.object({ userId: z.string() })).query(async () => false),
  getBackgroundCheckResult: protectedProcedure.query(async () => ({})),
  appealRejection: protectedProcedure.input(z.object({ appealReason: z.string() })).mutation(async () => ({ success: true })),
  getPendingVerifications: protectedProcedure.input(z.object({ limit: z.number().default(20), offset: z.number().default(0) })).query(async () => []),
  approveVerification: protectedProcedure.input(z.object({ userId: z.string() })).mutation(async () => ({ success: true })),
  rejectVerification: protectedProcedure.input(z.object({ userId: z.string(), reason: z.string() })).mutation(async () => ({ success: true })),
  getStats: protectedProcedure.query(async () => ({})),
  getVerifiedCount: protectedProcedure.query(async () => 0),
});
