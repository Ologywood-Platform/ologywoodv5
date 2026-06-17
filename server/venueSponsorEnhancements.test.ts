import { describe, it, expect } from 'vitest';
import { venueSponsorApplications } from '../drizzle/schema';
import * as notificationService from './services/notificationService';

describe('Venue Sponsor Enhancements', () => {
  it('should have promoMaterialUrls column in venueSponsorApplications schema', () => {
    expect(venueSponsorApplications.promoMaterialUrls).toBeDefined();
  });

  it('should export sponsor notification functions', () => {
    expect(notificationService.notifySponsorApplicationReceived).toBeDefined();
    expect(typeof notificationService.notifySponsorApplicationReceived).toBe('function');
    expect(notificationService.notifySponsorApplicationApproved).toBeDefined();
    expect(typeof notificationService.notifySponsorApplicationApproved).toBe('function');
    expect(notificationService.notifySponsorApplicationRejected).toBeDefined();
    expect(typeof notificationService.notifySponsorApplicationRejected).toBe('function');
  });

  it('should have companyLogoUrl column in venueSponsorApplications schema', () => {
    expect(venueSponsorApplications.companyLogoUrl).toBeDefined();
  });
});
