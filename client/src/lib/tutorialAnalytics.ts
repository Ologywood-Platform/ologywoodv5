/**
 * Tutorial Analytics Tracking
 * Tracks user interactions with tutorials to measure effectiveness and identify areas for improvement
 */

export interface TutorialAnalyticsEvent {
  tutorialId: string;
  eventType: 'started' | 'completed' | 'skipped' | 'step_viewed' | 'step_skipped';
  stepId?: string;
  timestamp: number;
  sessionId: string;
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export interface TutorialAnalyticsData {
  tutorialId: string;
  totalStarts: number;
  totalCompletions: number;
  totalSkips: number;
  completionRate: number; // percentage
  averageStepsCompleted: number;
  averageTimeSpent: number; // in seconds
  lastAccessed: number; // timestamp
  stepMetrics: Record<string, {
    viewCount: number;
    skipCount: number;
    timeSpent: number; // average in seconds
  }>;
}

class TutorialAnalyticsService {
  private sessionId: string;
  private events: TutorialAnalyticsEvent[] = [];
  private tutorialStartTimes: Map<string, number> = new Map();
  private stepStartTimes: Map<string, number> = new Map();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadStoredEvents();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get device type
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Track tutorial started
   */
  trackTutorialStarted(tutorialId: string): void {
    const event: TutorialAnalyticsEvent = {
      tutorialId,
      eventType: 'started',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      deviceType: this.getDeviceType(),
    };

    this.events.push(event);
    this.tutorialStartTimes.set(tutorialId, Date.now());
    this.sendEvent(event);
  }

  /**
   * Track tutorial completed
   */
  trackTutorialCompleted(tutorialId: string): void {
    const startTime = this.tutorialStartTimes.get(tutorialId) || Date.now();
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    const event: TutorialAnalyticsEvent = {
      tutorialId,
      eventType: 'completed',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      deviceType: this.getDeviceType(),
    };

    this.events.push(event);
    this.tutorialStartTimes.delete(tutorialId);
    this.sendEvent(event, { timeSpent });

    console.log(`[Tutorial Analytics] Tutorial "${tutorialId}" completed in ${timeSpent}s`);
  }

  /**
   * Track tutorial skipped
   */
  trackTutorialSkipped(tutorialId: string): void {
    const startTime = this.tutorialStartTimes.get(tutorialId) || Date.now();
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    const event: TutorialAnalyticsEvent = {
      tutorialId,
      eventType: 'skipped',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      deviceType: this.getDeviceType(),
    };

    this.events.push(event);
    this.tutorialStartTimes.delete(tutorialId);
    this.sendEvent(event, { timeSpent });

    console.log(`[Tutorial Analytics] Tutorial "${tutorialId}" skipped after ${timeSpent}s`);
  }

  /**
   * Track step viewed
   */
  trackStepViewed(tutorialId: string, stepId: string): void {
    const event: TutorialAnalyticsEvent = {
      tutorialId,
      eventType: 'step_viewed',
      stepId,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      deviceType: this.getDeviceType(),
    };

    this.events.push(event);
    this.stepStartTimes.set(`${tutorialId}_${stepId}`, Date.now());
    this.sendEvent(event);
  }

  /**
   * Track step skipped
   */
  trackStepSkipped(tutorialId: string, stepId: string): void {
    const startTime = this.stepStartTimes.get(`${tutorialId}_${stepId}`) || Date.now();
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    const event: TutorialAnalyticsEvent = {
      tutorialId,
      eventType: 'step_skipped',
      stepId,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      deviceType: this.getDeviceType(),
    };

    this.events.push(event);
    this.stepStartTimes.delete(`${tutorialId}_${stepId}`);
    this.sendEvent(event, { timeSpent });
  }

  /**
   * Send event to analytics backend
   */
  private async sendEvent(event: TutorialAnalyticsEvent, metadata?: Record<string, any>): Promise<void> {
    try {
      // In production, this would send to your analytics backend
      // For now, we'll just log it and store locally
      console.log('[Tutorial Analytics] Event:', event, metadata);

      // Store locally for offline support
      this.storeEvent(event);

      // Send to backend if available
      // await fetch('/api/analytics/tutorial', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ event, metadata }),
      // });
    } catch (error) {
      console.error('[Tutorial Analytics] Failed to send event:', error);
    }
  }

  /**
   * Store event locally
   */
  private storeEvent(event: TutorialAnalyticsEvent): void {
    try {
      const stored = localStorage.getItem('tutorial_analytics_events') || '[]';
      const events = JSON.parse(stored);
      events.push(event);
      // Keep only last 100 events
      if (events.length > 100) {
        events.shift();
      }
      localStorage.setItem('tutorial_analytics_events', JSON.stringify(events));
    } catch (error) {
      console.error('[Tutorial Analytics] Failed to store event:', error);
    }
  }

  /**
   * Load stored events from localStorage
   */
  private loadStoredEvents(): void {
    try {
      const stored = localStorage.getItem('tutorial_analytics_events') || '[]';
      this.events = JSON.parse(stored);
    } catch (error) {
      console.error('[Tutorial Analytics] Failed to load stored events:', error);
    }
  }

  /**
   * Get analytics for a specific tutorial
   */
  getTutorialAnalytics(tutorialId: string): TutorialAnalyticsData {
    const tutorialEvents = this.events.filter(e => e.tutorialId === tutorialId);

    const starts = tutorialEvents.filter(e => e.eventType === 'started').length;
    const completions = tutorialEvents.filter(e => e.eventType === 'completed').length;
    const skips = tutorialEvents.filter(e => e.eventType === 'skipped').length;

    const completionRate = starts > 0 ? (completions / starts) * 100 : 0;

    // Calculate step metrics
    const stepMetrics: Record<string, any> = {};
    const stepEvents = tutorialEvents.filter(e => e.stepId);

    stepEvents.forEach(event => {
      if (!stepMetrics[event.stepId!]) {
        stepMetrics[event.stepId!] = {
          viewCount: 0,
          skipCount: 0,
          timeSpent: 0,
        };
      }

      if (event.eventType === 'step_viewed') {
        stepMetrics[event.stepId!].viewCount++;
      } else if (event.eventType === 'step_skipped') {
        stepMetrics[event.stepId!].skipCount++;
      }
    });

    return {
      tutorialId,
      totalStarts: starts,
      totalCompletions: completions,
      totalSkips: skips,
      completionRate: Math.round(completionRate),
      averageStepsCompleted: completions > 0 ? Math.round(tutorialEvents.length / completions) : 0,
      averageTimeSpent: 0, // Would be calculated from timestamps
      lastAccessed: tutorialEvents.length > 0 ? tutorialEvents[tutorialEvents.length - 1].timestamp : 0,
      stepMetrics,
    };
  }

  /**
   * Get all analytics
   */
  getAllAnalytics(): Record<string, TutorialAnalyticsData> {
    const tutorialIds = new Set(this.events.map(e => e.tutorialId));
    const analytics: Record<string, TutorialAnalyticsData> = {};

    tutorialIds.forEach(id => {
      analytics[id] = this.getTutorialAnalytics(id);
    });

    return analytics;
  }

  /**
   * Get completion rate by device type
   */
  getCompletionRateByDevice(tutorialId: string): Record<string, number> {
    const tutorialEvents = this.events.filter(e => e.tutorialId === tutorialId);
    const devices = new Set(tutorialEvents.map(e => e.deviceType));

    const rates: Record<string, number> = {};

    devices.forEach(device => {
      const deviceEvents = tutorialEvents.filter(e => e.deviceType === device);
      const starts = deviceEvents.filter(e => e.eventType === 'started').length;
      const completions = deviceEvents.filter(e => e.eventType === 'completed').length;
      rates[device] = starts > 0 ? Math.round((completions / starts) * 100) : 0;
    });

    return rates;
  }

  /**
   * Clear all analytics (for testing)
   */
  clearAnalytics(): void {
    this.events = [];
    localStorage.removeItem('tutorial_analytics_events');
    console.log('[Tutorial Analytics] All analytics cleared');
  }

  /**
   * Export analytics as JSON
   */
  exportAnalytics(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      events: this.events,
      analytics: this.getAllAnalytics(),
    }, null, 2);
  }
}

// Create singleton instance
export const tutorialAnalytics = new TutorialAnalyticsService();

// Log analytics summary periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    const analytics = tutorialAnalytics.getAllAnalytics();
    const summary = Object.entries(analytics)
      .map(([id, data]) => `${id}: ${data.totalCompletions}/${data.totalStarts} completed`)
      .join(', ');

    if (summary) {
      console.log('[Tutorial Analytics Summary]', summary);
    }
  }, 60000); // Every minute
}
