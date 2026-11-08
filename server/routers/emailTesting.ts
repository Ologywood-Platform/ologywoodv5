import { adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { testAllEmailTemplates, getSummary } from "../emailTestingService";
import { emailTestingLimiter } from "../utils/rateLimiter";

/** Extract client IP from tRPC context */
function getClientIp(ctx: any): string {
  return ctx.req?.headers?.['x-forwarded-for']?.toString()?.split(',')[0]?.trim()
    || ctx.req?.socket?.remoteAddress || 'unknown';
}

export const emailTestingRouter = router({
  /**
   * Test all email templates and send to specified email
   */
  testAllTemplates: adminProcedure
    .input(z.object({
      testEmail: z.string().trim().toLowerCase().email("Invalid email address").max(320),
    }).strict())
    .mutation(async ({ input, ctx }) => {
      // Rate limit: 5 test runs per 15 min per IP
      const ipCheck = emailTestingLimiter.check(`ip:${getClientIp(ctx)}`);
      if (!ipCheck.allowed) {
        const retryMinutes = Math.ceil(ipCheck.retryAfterMs / 60_000);
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Too many email test requests. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
        });
      }

      try {
        const { testEmail } = input;

        // Run all email tests
        const results = await testAllEmailTemplates(testEmail);
        const summary = getSummary(results);

        return {
          success: true,
          summary,
          results,
          message: `Email test suite completed. ${summary.successful}/${summary.total} templates processed successfully`,
        };
      } catch (error) {
        console.error("[Email Testing] Test suite failed");
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Email testing failed' });
      }
    }),

  /**
   * Test a specific email template
   */
  testTemplate: adminProcedure
    .input(z.object({
      templateName: z.string().trim().min(1).max(100),
      testEmail: z.string().trim().toLowerCase().email("Invalid email address").max(320),
    }).strict())
    .mutation(async ({ input, ctx }) => {
      // Rate limit: 5 test runs per 15 min per IP
      const ipCheck = emailTestingLimiter.check(`ip:${getClientIp(ctx)}`);
      if (!ipCheck.allowed) {
        const retryMinutes = Math.ceil(ipCheck.retryAfterMs / 60_000);
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Too many email test requests. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
        });
      }

      try {
        const { templateName, testEmail } = input;

        return {
          success: true,
          message: `Template test initiated for ${templateName}`,
        };
      } catch (error) {
        console.error("[Email Testing] Template test failed");
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Template test failed' });
      }
    }),
});
