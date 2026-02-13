import { getDb } from '../db';
import { footerAnalytics } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface FooterAnalyticsEvent {
  eventType: 'social_click' | 'newsletter_signup' | 'legal_page_visit' | 'contact_click';
  platform?: string; // facebook, twitter, instagram, linkedin, youtube
  userId?: string;
  userAgent?: string;
  referrer?: string;
  timestamp?: Date;
}

export class FooterAnalyticsService {
  static async trackEvent(event: FooterAnalyticsEvent) {
    try {
      const db = await getDb();
      if (!db) return;
      
      await db.insert(footerAnalytics).values({
        eventType: event.eventType,
        platform: event.platform || null,
        userId: event.userId || null,
        userAgent: event.userAgent || null,
        referrer: event.referrer || null,
        timestamp: event.timestamp || new Date(),
      });

      console.log(`[Footer Analytics] Event tracked: ${event.eventType} - ${event.platform || 'N/A'}`);
    } catch (error) {
      console.error('[Footer Analytics] Error tracking event:', error);
    }
  }

  static async getSocialClickStats(platform?: string) {
    try {
      const db = await getDb();
      if (!db) return [];
      
      const query = db
        .select()
        .from(footerAnalytics)
        .where(eq(footerAnalytics.eventType, 'social_click'));

      const results = platform 
        ? await query.where(eq(footerAnalytics.platform, platform))
        : await query;

      return results;
    } catch (error) {
      console.error('[Footer Analytics] Error fetching social click stats:', error);
      return [];
    }
  }

  static async getNewsletterSignupStats() {
    try {
      const db = await getDb();
      if (!db) return [];
      
      const results = await db
        .select()
        .from(footerAnalytics)
        .where(eq(footerAnalytics.eventType, 'newsletter_signup'));

      return results;
    } catch (error) {
      console.error('[Footer Analytics] Error fetching newsletter stats:', error);
      return [];
    }
  }

  static async getAnalyticsSummary(days: number = 30) {
    try {
      const db = await getDb();
      if (!db) return { totalEvents: 0, socialClicks: 0, newsletterSignups: 0 };
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const results = await db
        .select()
        .from(footerAnalytics);

      const filtered = results.filter(r => r.timestamp && new Date(r.timestamp) >= startDate);

      const summary = {
        totalEvents: filtered.length,
        socialClicks: filtered.filter(r => r.eventType === 'social_click').length,
        newsletterSignups: filtered.filter(r => r.eventType === 'newsletter_signup').length,
        legalPageVisits: filtered.filter(r => r.eventType === 'legal_page_visit').length,
        contactClicks: filtered.filter(r => r.eventType === 'contact_click').length,
        socialBreakdown: {
          facebook: filtered.filter(r => r.platform === 'facebook').length,
          twitter: filtered.filter(r => r.platform === 'twitter').length,
          instagram: filtered.filter(r => r.platform === 'instagram').length,
          linkedin: filtered.filter(r => r.platform === 'linkedin').length,
          youtube: filtered.filter(r => r.platform === 'youtube').length,
        },
      };

      return summary;
    } catch (error) {
      console.error('[Footer Analytics] Error generating summary:', error);
      return null;
    }
  }
}
