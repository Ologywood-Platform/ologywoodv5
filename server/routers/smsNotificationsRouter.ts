import { router, protectedProcedure } from "../_core/trpc";
import { smsNotificationService } from "../services/smsNotificationService";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const smsNotificationsRouter = router({
  /**
   * Send booking confirmation SMS
   */
  sendBookingConfirmationSMS: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(10),
        bookingId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await smsNotificationService.sendBookingConfirmationSMS({
          recipientPhone: input.phoneNumber,
          message: "",
          type: "booking_confirmation",
        });
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send SMS",
        });
      }
    }),

  /**
   * Send contract signed SMS
   */
  sendContractSignedSMS: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(10),
        contractId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await smsNotificationService.sendContractSignedSMS({
          recipientPhone: input.phoneNumber,
          message: "",
          type: "contract_signed",
        });
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send SMS",
        });
      }
    }),

  /**
   * Send booking reminder SMS
   */
  sendBookingReminderSMS: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(10),
        bookingId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await smsNotificationService.sendBookingReminderSMS({
          recipientPhone: input.phoneNumber,
          message: "",
          type: "booking_reminder",
        });
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send SMS",
        });
      }
    }),

  /**
   * Send payment received SMS
   */
  sendPaymentReceivedSMS: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(10),
        amount: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await smsNotificationService.sendPaymentReceivedSMS({
          recipientPhone: input.phoneNumber,
          message: `Payment of $${(input.amount / 100).toFixed(2)} received!`,
          type: "payment_received",
        });
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send SMS",
        });
      }
    }),

  /**
   * Send custom SMS
   */
  sendCustomSMS: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(10),
        message: z.string().min(1).max(160),
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
        await smsNotificationService.sendCustomSMS({
          recipientPhone: input.phoneNumber,
          message: input.message,
          type: "booking_confirmation",
        });
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send SMS",
        });
      }
    }),

  /**
   * Check SMS service status
   */
  getStatus: protectedProcedure.query(() => {
    return {
      configured: smsNotificationService.isConfigured(),
      message: smsNotificationService.isConfigured()
        ? "SMS service is configured and ready"
        : "SMS service is not configured. Please set Twilio credentials.",
    };
  }),
});
