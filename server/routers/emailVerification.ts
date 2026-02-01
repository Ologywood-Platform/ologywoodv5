import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

export const emailVerificationRouter = router({
  sendVerificationEmail: protectedProcedure.input(z.object({ venueProfileId: z.number(), email: z.string().email(), venueName: z.string(), verificationUrl: z.string().url() })).mutation(async () => ({ success: true, message: "Email sent" })),
  verifyEmail: publicProcedure.input(z.object({ token: z.string() })).mutation(async () => ({ success: true, message: "Email verified", venueId: 0 })),
  resendVerificationEmail: protectedProcedure.input(z.object({ venueProfileId: z.number(), email: z.string().email(), venueName: z.string(), verificationUrl: z.string().url() })).mutation(async () => ({ success: true, message: "Email resent" })),
  checkVerificationStatus: protectedProcedure.input(z.object({ venueProfileId: z.number() })).query(async () => ({ isVerified: false, email: "", verificationSentAt: null })),
});
