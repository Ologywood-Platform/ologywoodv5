import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { WebhookService, type WebhookEventType, type WebhookSubscription } from '../services/webhookService';

// In-memory storage for demo (replace with DB in production)
const webhookSubscriptions = new Map<string, WebhookSubscription>();
const webhookDeliveries: any[] = [];

export const webhookRouter = router({
  /**
   * Create a new webhook subscription
   */
  createSubscription: protectedProcedure
    .input(z.object({
      url: z.string().url('Invalid webhook URL'),
      events: z.array(z.enum(['contract.signed', 'contract.archived', 'contract.expired', 'contract.created', 'contract.updated'])),
      maxRetries: z.number().min(1).max(10).optional().default(5),
    }))
    .mutation(({ ctx, input }) => {
      try {
        // Validate webhook URL
        if (!WebhookService.isValidWebhookUrl(input.url)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid webhook URL',
          });
        }

        // Create subscription
        const subscription = WebhookService.createSubscription(
          ctx.user.id,
          input.url,
          input.events as WebhookEventType[],
          input.maxRetries
        );

        // Store subscription
        webhookSubscriptions.set(subscription.id, subscription);

        return {
          success: true,
          subscription: {
            id: subscription.id,
            url: subscription.url,
            events: subscription.events,
            active: subscription.active,
            createdAt: subscription.createdAt,
          },
        };
      } catch (error) {
        console.error('Error creating webhook subscription:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create webhook subscription',
        });
      }
    }),

  /**
   * Get all webhooks for current user
   */
  getSubscriptions: protectedProcedure.query(({ ctx }) => {
    try {
      const userSubscriptions = Array.from(webhookSubscriptions.values()).filter(
        (sub) => sub.userId === ctx.user.id
      );

      return {
        success: true,
        subscriptions: userSubscriptions.map((sub) => ({
          id: sub.id,
          url: sub.url,
          events: sub.events,
          active: sub.active,
          createdAt: sub.createdAt,
          failureCount: sub.failureCount,
          lastTriggered: sub.lastTriggered,
        })),
        total: userSubscriptions.length,
      };
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch webhooks',
      });
    }
  }),

  /**
   * Get a specific webhook subscription
   */
  getSubscription: protectedProcedure
    .input(z.object({
      webhookId: z.string(),
    }))
    .query(({ ctx, input }) => {
      try {
        const subscription = webhookSubscriptions.get(input.webhookId);

        if (!subscription || subscription.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Webhook not found',
          });
        }

        return {
          success: true,
          subscription,
        };
      } catch (error) {
        console.error('Error fetching webhook:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch webhook',
        });
      }
    }),

  /**
   * Update webhook subscription
   */
  updateSubscription: protectedProcedure
    .input(z.object({
      webhookId: z.string(),
      url: z.string().url().optional(),
      events: z.array(z.enum(['contract.signed', 'contract.archived', 'contract.expired', 'contract.created', 'contract.updated'])).optional(),
      active: z.boolean().optional(),
    }))
    .mutation(({ ctx, input }) => {
      try {
        const subscription = webhookSubscriptions.get(input.webhookId);

        if (!subscription || subscription.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Webhook not found',
          });
        }

        // Update subscription
        if (input.url) {
          if (!WebhookService.isValidWebhookUrl(input.url)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid webhook URL',
            });
          }
          subscription.url = input.url;
        }

        if (input.events) {
          subscription.events = input.events as WebhookEventType[];
        }

        if (input.active !== undefined) {
          subscription.active = input.active;
        }

        subscription.updatedAt = new Date();
        webhookSubscriptions.set(input.webhookId, subscription);

        return {
          success: true,
          subscription,
        };
      } catch (error) {
        console.error('Error updating webhook:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update webhook',
        });
      }
    }),

  /**
   * Delete webhook subscription
   */
  deleteSubscription: protectedProcedure
    .input(z.object({
      webhookId: z.string(),
    }))
    .mutation(({ ctx, input }) => {
      try {
        const subscription = webhookSubscriptions.get(input.webhookId);

        if (!subscription || subscription.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Webhook not found',
          });
        }

        webhookSubscriptions.delete(input.webhookId);

        return {
          success: true,
          message: 'Webhook deleted',
        };
      } catch (error) {
        console.error('Error deleting webhook:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete webhook',
        });
      }
    }),

  /**
   * Send test webhook event
   */
  sendTestEvent: protectedProcedure
    .input(z.object({
      webhookId: z.string(),
    }))
    .mutation(({ ctx, input }) => {
      try {
        const subscription = webhookSubscriptions.get(input.webhookId);

        if (!subscription || subscription.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Webhook not found',
          });
        }

        // Generate test event
        const testEvent = WebhookService.generateTestEvent(ctx.user.id);

        // Create delivery record
        const delivery = WebhookService.createDelivery(input.webhookId, testEvent.id);
        delivery.status = 'delivered';
        delivery.attempts = 1;
        delivery.lastAttemptAt = new Date();
        delivery.response = {
          statusCode: 200,
          body: 'Test event received',
        };

        webhookDeliveries.push(delivery);

        return {
          success: true,
          event: testEvent,
          delivery: {
            id: delivery.id,
            status: delivery.status,
            attempts: delivery.attempts,
          },
        };
      } catch (error) {
        console.error('Error sending test webhook:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send test webhook',
        });
      }
    }),

  /**
   * Get webhook delivery history
   */
  getDeliveryHistory: protectedProcedure
    .input(z.object({
      webhookId: z.string(),
      limit: z.number().min(1).max(100).optional().default(50),
    }))
    .query(({ ctx, input }) => {
      try {
        const subscription = webhookSubscriptions.get(input.webhookId);

        if (!subscription || subscription.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Webhook not found',
          });
        }

        // Get deliveries for this webhook
        const deliveries = webhookDeliveries
          .filter((d) => d.webhookId === input.webhookId)
          .sort((a, b) => b.lastAttemptAt?.getTime() - a.lastAttemptAt?.getTime())
          .slice(0, input.limit);

        // Calculate statistics
        const stats = WebhookService.getStatistics(deliveries);

        return {
          success: true,
          deliveries: deliveries.map((d) => ({
            id: d.id,
            status: d.status,
            attempts: d.attempts,
            lastAttemptAt: d.lastAttemptAt,
            response: d.response,
          })),
          statistics: stats,
        };
      } catch (error) {
        console.error('Error fetching delivery history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch delivery history',
        });
      }
    }),

  /**
   * Retry failed webhook delivery
   */
  retryDelivery: protectedProcedure
    .input(z.object({
      deliveryId: z.string(),
    }))
    .mutation(({ ctx, input }) => {
      try {
        const delivery = webhookDeliveries.find((d) => d.id === input.deliveryId);

        if (!delivery) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Delivery not found',
          });
        }

        // Check if webhook belongs to user
        const subscription = webhookSubscriptions.get(delivery.webhookId);
        if (!subscription || subscription.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to retry this delivery',
          });
        }

        // Reset delivery for retry
        delivery.status = 'pending';
        delivery.attempts = 0;
        delivery.lastAttemptAt = undefined;
        delivery.nextRetryAt = undefined;

        return {
          success: true,
          delivery: {
            id: delivery.id,
            status: delivery.status,
            attempts: delivery.attempts,
          },
        };
      } catch (error) {
        console.error('Error retrying delivery:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retry delivery',
        });
      }
    }),

  /**
   * Get webhook statistics
   */
  getStatistics: protectedProcedure
    .input(z.object({
      webhookId: z.string(),
    }))
    .query(({ ctx, input }) => {
      try {
        const subscription = webhookSubscriptions.get(input.webhookId);

        if (!subscription || subscription.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Webhook not found',
          });
        }

        // Get deliveries for this webhook
        const deliveries = webhookDeliveries.filter((d) => d.webhookId === input.webhookId);
        const stats = WebhookService.getStatistics(deliveries);

        return {
          success: true,
          statistics: stats,
        };
      } catch (error) {
        console.error('Error fetching statistics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch statistics',
        });
      }
    }),
});
