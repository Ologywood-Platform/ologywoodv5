import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { notifications, notificationPreferences } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

export const notificationRouter = router({
  // Get all notifications for the current user
  getAll: protectedProcedure.query(async ({ ctx }: any) => {
    try {
      const db = await getDb();
      if (!db) return [];
      
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt));
      return userNotifications || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }),

  // Get unread notifications count
  getUnreadCount: protectedProcedure.query(async ({ ctx }: any) => {
    try {
      const db = await getDb();
      if (!db) return 0;
      
      const result = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id) && eq(notifications.isRead, false));
      return result?.length || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      try {
        const db = await getDb();
        if (!db) return { success: false };
        
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(eq(notifications.id, input.id));
        return { success: true };
      } catch (error) {
        console.error('Error marking notification as read:', error);
        return { success: false };
      }
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }: any) => {
    try {
      const db = await getDb();
      if (!db) return { success: false };
      
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, ctx.user.id));
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false };
    }
  }),

  // Delete notification
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      try {
        const db = await getDb();
        if (!db) return { success: false };
        
        await db
          .delete(notifications)
          .where(eq(notifications.id, input.id));
        return { success: true };
      } catch (error) {
        console.error('Error deleting notification:', error);
        return { success: false };
      }
    }),

  // Create notification (for system use)
  create: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        type: z.enum(['booking', 'message', 'payment', 'contract', 'review']),
        title: z.string(),
        description: z.string().optional(),
        actionUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const db = await getDb();
        if (!db) return { success: false };
        
        const result = await db.insert(notifications).values({
          userId: input.userId,
          type: input.type,
          title: input.title,
          description: input.description,
          actionUrl: input.actionUrl,
          isRead: false,
        });
        return { success: true };
      } catch (error) {
        console.error('Error creating notification:', error);
        return { success: false };
      }
    }),
});

export const notificationPreferenceRouter = router({
  // Get user's notification preferences
  get: protectedProcedure.query(async ({ ctx }: any) => {
    try {
      const db = await getDb();
      if (!db) return null;
      
      const prefs = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, ctx.user.id));
      
      if (prefs && prefs.length > 0) {
        return prefs[0];
      }

      // Create default preferences if they don't exist
      await db.insert(notificationPreferences).values({
        userId: ctx.user.id,
        bookingInApp: true,
        bookingEmail: true,
        bookingPush: true,
        messageInApp: true,
        messageEmail: true,
        messagePush: true,
        contractInApp: true,
        contractEmail: true,
        contractPush: false,
        paymentInApp: true,
        paymentEmail: true,
        paymentPush: true,
        reviewInApp: true,
        reviewEmail: false,
        reviewPush: false,
      });

      const newPrefs = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, ctx.user.id));
      
      return newPrefs?.[0] || null;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }),

  // Update notification preferences
  update: protectedProcedure
    .input(
      z.object({
        bookingInApp: z.boolean().optional(),
        bookingEmail: z.boolean().optional(),
        bookingPush: z.boolean().optional(),
        messageInApp: z.boolean().optional(),
        messageEmail: z.boolean().optional(),
        messagePush: z.boolean().optional(),
        contractInApp: z.boolean().optional(),
        contractEmail: z.boolean().optional(),
        contractPush: z.boolean().optional(),
        paymentInApp: z.boolean().optional(),
        paymentEmail: z.boolean().optional(),
        paymentPush: z.boolean().optional(),
        reviewInApp: z.boolean().optional(),
        reviewEmail: z.boolean().optional(),
        reviewPush: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      try {
        const db = await getDb();
        if (!db) return { success: false };
        
        await db
          .update(notificationPreferences)
          .set(input)
          .where(eq(notificationPreferences.userId, ctx.user.id));
        return { success: true };
      } catch (error) {
        console.error('Error updating notification preferences:', error);
        return { success: false };
      }
    }),
});
