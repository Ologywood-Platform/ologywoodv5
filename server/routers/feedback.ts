import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';

export const feedbackRouter = router({
  submitFeedback: publicProcedure
    .input(z.object({
      type: z.enum(['suggestion', 'bug', 'general']),
      message: z.string().min(10).max(5000),
      email: z.string().email().optional(),
      rating: z.number().min(1).max(5).optional(),
      timestamp: z.string().optional(),
      userAgent: z.string().optional(),
      url: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Log feedback (in production, save to database)
        console.log('[Feedback] New submission:', {
          type: input.type,
          rating: input.rating,
          email: input.email,
          message: input.message.substring(0, 100) + '...',
          timestamp: input.timestamp,
          url: input.url,
        });

        // Send email notification to support team
        // This would integrate with SendGrid or similar service
        // await sendFeedbackNotificationEmail(input);

        return {
          success: true,
          message: 'Thank you for your feedback!',
        };
      } catch (error) {
        console.error('[Feedback] Error processing feedback:', error);
        throw new Error('Failed to submit feedback');
      }
    }),

  getFeedbackStats: publicProcedure
    .query(async () => {
      // Return feedback statistics for dashboard
      return {
        totalFeedback: 0,
        averageRating: 0,
        feedbackByType: {
          general: 0,
          suggestion: 0,
          bug: 0,
        },
      };
    }),
});
