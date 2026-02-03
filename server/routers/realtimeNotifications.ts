import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { realtimeNotificationService } from '../services/realtimeNotificationService';

export const realtimeNotificationsRouter = router({
  /**
   * Get notification history for current user
   */
  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(({ ctx, input }) => {
      const history = realtimeNotificationService.getHistory(ctx.user.id, input.limit);
      return {
        success: true,
        notifications: history,
        unreadCount: realtimeNotificationService.getUnreadCount(ctx.user.id),
      };
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(({ ctx }) => {
    return {
      success: true,
      unreadCount: realtimeNotificationService.getUnreadCount(ctx.user.id),
    };
  }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(({ ctx, input }) => {
      const success = realtimeNotificationService.markAsRead(ctx.user.id, input.notificationId);
      return {
        success,
        message: success ? 'Notification marked as read' : 'Notification not found',
      };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(({ ctx }) => {
    const history = realtimeNotificationService.getHistory(ctx.user.id, 1000);
    history.forEach(notification => {
      if (!notification.read) {
        realtimeNotificationService.markAsRead(ctx.user.id, notification.id);
      }
    });
    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }),

  /**
   * Clear all notifications
   */
  clearAll: protectedProcedure.mutation(({ ctx }) => {
    realtimeNotificationService.clearHistory(ctx.user.id);
    return {
      success: true,
      message: 'All notifications cleared',
    };
  }),

  /**
   * Subscribe to real-time notifications (for WebSocket)
   * This endpoint would be called when establishing a WebSocket connection
   */
  subscribe: protectedProcedure.query(({ ctx }) => {
    return {
      success: true,
      userId: ctx.user.id,
      message: 'Ready to receive real-time notifications',
      unreadCount: realtimeNotificationService.getUnreadCount(ctx.user.id),
    };
  }),
});
