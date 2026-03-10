import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const notificationsRouter = router({
  /**
   * Get notifications for the current user (paginated)
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit || 30;
      const offset = input?.offset || 0;
      const items = await db.getNotificationsByUserId(ctx.user.id, { limit, offset });
      const unreadCount = await db.getUnreadNotificationCount(ctx.user.id);
      return { items, unreadCount };
    }),

  /**
   * Get unread notification count (lightweight poll)
   */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUnreadNotificationCount(ctx.user.id);
  }),

  /**
   * Mark a single notification as read
   */
  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.markNotificationRead(input.id, ctx.user.id);
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markAllNotificationsRead(ctx.user.id);
    return { success: true };
  }),

  /**
   * Delete a notification
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteNotification(input.id, ctx.user.id);
      return { success: true };
    }),

  /**
   * Get notification preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await db.getNotificationPreferences(ctx.user.id);
    return prefs || {
      bookingNotifications: true,
      messageNotifications: true,
      reviewNotifications: true,
      riderNotifications: true,
      emailNotifications: true,
      pushNotifications: true,
      reminderNotifications: true,
    };
  }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        bookingNotifications: z.boolean().optional(),
        messageNotifications: z.boolean().optional(),
        reviewNotifications: z.boolean().optional(),
        riderNotifications: z.boolean().optional(),
        emailNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        reminderNotifications: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prefs = await db.upsertNotificationPreferences(ctx.user.id, input);
      return prefs;
    }),
});
