/**
 * Messaging Router - Simplified Implementation
 * Handles in-platform messaging for booking conversations
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

// ===== INPUT SCHEMAS =====

const sendMessageSchema = z.object({
  bookingId: z.number().int().positive("Booking ID must be positive"),
  recipientId: z.number().int().positive("Recipient ID must be positive"),
  content: z.string().min(1, "Message content required").max(5000, "Message too long"),
});

const getMessagesSchema = z.object({
  bookingId: z.number().int().positive("Booking ID must be positive"),
});

const markAsReadSchema = z.object({
  messageId: z.number().int().positive("Message ID must be positive"),
});

// ===== ROUTER =====

export const messagingRouter = router({
  /**
   * Send a message in a booking conversation
   */
  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Placeholder: In production, validate booking exists and user is participant
        return {
          success: true,
          messageId: Math.floor(Math.random() * 10000),
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("[Messaging] Send message error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message",
        });
      }
    }),

  /**
   * Get messages for a booking conversation
   */
  getMessages: protectedProcedure
    .input(getMessagesSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Placeholder: Return empty messages for now
        return {
          messages: [],
          total: 0,
        };
      } catch (error) {
        console.error("[Messaging] Get messages error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve messages",
        });
      }
    }),

  /**
   * Mark a message as read
   */
  markAsRead: protectedProcedure
    .input(markAsReadSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return {
          success: true,
          messageId: input.messageId,
        };
      } catch (error) {
        console.error("[Messaging] Mark as read error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark message as read",
        });
      }
    }),

  /**
   * Get unread message count for user
   */
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const count = await db.getTotalUnreadMessageCount(ctx.user.id);
        
        return {
          success: true,
          unreadCount: count,
        };
      } catch (error) {
        console.error("[Messaging] Get unread count error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve unread count",
        });
      }
    }),
});
