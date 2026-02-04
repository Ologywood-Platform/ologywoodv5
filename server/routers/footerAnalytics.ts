import { router, publicProcedure } from '../_core/trpc';
import { FooterAnalyticsService } from '../services/footerAnalyticsService';
import { z } from 'zod';

export const footerAnalyticsRouter = router({
  trackSocialClick: publicProcedure
    .input(z.object({
      platform: z.enum(['facebook', 'twitter', 'instagram', 'linkedin', 'youtube']),
      userAgent: z.string().optional(),
      referrer: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await FooterAnalyticsService.trackEvent({
        eventType: 'social_click',
        platform: input.platform,
        userAgent: input.userAgent,
        referrer: input.referrer,
      });
      return { success: true };
    }),

  trackNewsletterSignup: publicProcedure
    .input(z.object({
      email: z.string().email(),
      userAgent: z.string().optional(),
      referrer: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await FooterAnalyticsService.trackEvent({
        eventType: 'newsletter_signup',
        userAgent: input.userAgent,
        referrer: input.referrer,
      });
      return { success: true };
    }),

  trackLegalPageVisit: publicProcedure
    .input(z.object({
      page: z.enum(['terms', 'privacy', 'cookies', 'accessibility']),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await FooterAnalyticsService.trackEvent({
        eventType: 'legal_page_visit',
        platform: input.page,
        userAgent: input.userAgent,
      });
      return { success: true };
    }),

  trackContactClick: publicProcedure
    .input(z.object({
      method: z.enum(['email', 'phone', 'form']),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await FooterAnalyticsService.trackEvent({
        eventType: 'contact_click',
        platform: input.method,
        userAgent: input.userAgent,
      });
      return { success: true };
    }),

  getSocialClickStats: publicProcedure
    .input(z.object({
      platform: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return await FooterAnalyticsService.getSocialClickStats(input.platform);
    }),

  getNewsletterStats: publicProcedure
    .query(async () => {
      return await FooterAnalyticsService.getNewsletterSignupStats();
    }),

  getAnalyticsSummary: publicProcedure
    .input(z.object({
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      return await FooterAnalyticsService.getAnalyticsSummary(input.days);
    }),
});
