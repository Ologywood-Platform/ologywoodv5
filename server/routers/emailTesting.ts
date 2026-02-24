import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { testAllEmailTemplates, getSummary } from "../emailTestingService";

export const emailTestingRouter = router({
  /**
   * Test all email templates and send to specified email
   */
  testAllTemplates: publicProcedure
    .input(z.object({
      testEmail: z.string().email("Invalid email address"),
    }))
    .mutation(async ({ input }) => {
      try {
        const { testEmail } = input;


        // Run all email tests
        const results = await testAllEmailTemplates(testEmail);
        const summary = getSummary(results);


        return {
          success: true,
          summary,
          results,
          message: `Email test suite completed. ${summary.successful}/${summary.total} templates sent successfully to ${testEmail}`,
        };
      } catch (error) {
        console.error("[Email Testing] Error:", error);
        throw new Error(`Email testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  /**
   * Test a specific email template
   */
  testTemplate: publicProcedure
    .input(z.object({
      templateName: z.string(),
      testEmail: z.string().email("Invalid email address"),
    }))
    .mutation(async ({ input }) => {
      try {
        const { templateName, testEmail } = input;


        // This would be expanded to test individual templates
        return {
          success: true,
          message: `Template test initiated for ${templateName}`,
          testEmail,
        };
      } catch (error) {
        console.error("[Email Testing] Error:", error);
        throw new Error(`Template test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});
