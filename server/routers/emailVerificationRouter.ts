import { router, protectedProcedure } from "../_core/trpc";
import { emailVerificationService } from "../services/emailVerificationService";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const emailVerificationRouter = router({
  /**
   * Send verification submitted email
   */
  sendSubmittedEmail: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
        recipientName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await emailVerificationService.sendVerificationSubmittedEmail({
          recipientEmail: input.recipientEmail,
          recipientName: input.recipientName,
          verificationStatus: "submitted",
        });
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send email",
        });
      }
    }),

  /**
   * Send verification approved email
   */
  sendApprovedEmail: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
        recipientName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await emailVerificationService.sendVerificationApprovedEmail({
          recipientEmail: input.recipientEmail,
          recipientName: input.recipientName,
          verificationStatus: "approved",
        });
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send email",
        });
      }
    }),

  /**
   * Send verification rejected email
   */
  sendRejectedEmail: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
        recipientName: z.string(),
        rejectionReason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      try {
        await emailVerificationService.sendVerificationRejectedEmail({
          recipientEmail: input.recipientEmail,
          recipientName: input.recipientName,
          verificationStatus: "rejected",
          rejectionReason: input.rejectionReason,
        });
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send email",
        });
      }
    }),

  /**
   * Send verification appeal email
   */
  sendAppealEmail: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
        recipientName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await emailVerificationService.sendVerificationAppealEmail({
          recipientEmail: input.recipientEmail,
          recipientName: input.recipientName,
          verificationStatus: "appeal",
          appealDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        });
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send email",
        });
      }
    }),

  /**
   * Send verification reminder email
   */
  sendReminderEmail: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
        recipientName: z.string(),
        verificationLink: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await emailVerificationService.sendVerificationReminderEmail({
          recipientEmail: input.recipientEmail,
          recipientName: input.recipientName,
          verificationStatus: "submitted",
          verificationLink: input.verificationLink,
        });
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send email",
        });
      }
    }),

  /**
   * Send batch verification emails (admin only)
   */
  sendBatchEmails: protectedProcedure
    .input(
      z.object({
        recipients: z.array(
          z.object({
            email: z.string().email(),
            name: z.string(),
            rejectionReason: z.string().optional(),
          })
        ),
        emailType: z.enum(["submitted", "approved", "rejected", "appeal", "reminder"]),
        verificationLink: z.string().url().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      try {
        const emailData = input.recipients.map((r) => ({
          recipientEmail: r.email,
          recipientName: r.name,
          verificationStatus: input.emailType as any,
          rejectionReason: r.rejectionReason,
          verificationLink: input.verificationLink,
          appealDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        }));

        await emailVerificationService.sendBatchVerificationEmails(emailData, input.emailType);
        return { success: true, sent: input.recipients.length };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send batch emails",
        });
      }
    }),
});
