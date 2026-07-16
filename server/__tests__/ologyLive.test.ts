import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Ology Live - Phase 1', () => {
  describe('Database Schema', () => {
    const schemaPath = path.join(__dirname, '../../drizzle/schema.ts');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    it('should have ology_live_experiences table defined', () => {
      expect(schema).toContain('ology_live_experiences');
      expect(schema).toContain('ologyLiveExperiences');
    });

    it('should have ology_live_bookings table defined', () => {
      expect(schema).toContain('ology_live_bookings');
      expect(schema).toContain('ologyLiveBookings');
    });

    it('should have ology_live_time_slots table defined', () => {
      expect(schema).toContain('ology_live_time_slots');
      expect(schema).toContain('ologyLiveTimeSlots');
    });

    it('should have required experience fields', () => {
      expect(schema).toContain('talentId');
      expect(schema).toContain('capacityType');
      expect(schema).toContain('one_on_one');
      expect(schema).toContain('small_group');
      expect(schema).toContain('broadcast');
      expect(schema).toContain('maxAttendees');
      expect(schema).toContain('platform');
      expect(schema).toContain('platformLink');
      expect(schema).toContain('linkSentAfterBooking');
      expect(schema).toContain('recurringSchedule');
      expect(schema).toContain('coverImageUrl');
    });

    it('should have required booking fields', () => {
      expect(schema).toContain('experienceId');
      expect(schema).toContain('fanId');
      expect(schema).toContain('stripePaymentIntentId');
      expect(schema).toContain('joinLink');
      expect(schema).toContain('scheduledAt');
    });

    it('should have required time slot fields', () => {
      expect(schema).toContain('startTime');
      expect(schema).toContain('endTime');
      expect(schema).toContain('spotsTotal');
      expect(schema).toContain('spotsTaken');
    });
  });

  describe('Server Router', () => {
    const routerPath = path.join(__dirname, '../routers/ologyLive.ts');
    const router = fs.readFileSync(routerPath, 'utf-8');

    it('should have createExperience procedure', () => {
      expect(router).toContain('createExperience');
    });

    it('should have getMyExperiences procedure', () => {
      expect(router).toContain('getMyExperiences');
    });

    it('should have browseExperiences procedure', () => {
      expect(router).toContain('browseExperiences');
    });

    it('should have getExperienceById procedure', () => {
      expect(router).toContain('getExperienceById');
    });

    it('should have bookExperience procedure', () => {
      expect(router).toContain('bookExperience');
    });

    it('should have addTimeSlot procedure', () => {
      expect(router).toContain('addTimeSlot');
    });

    it('should have getAvailableSlots procedure', () => {
      expect(router).toContain('getAvailableSlots');
    });

    it('should have updateExperience procedure', () => {
      expect(router).toContain('updateExperience');
    });

    it('should have deleteExperience procedure', () => {
      expect(router).toContain('deleteExperience');
    });

    it('should have getMyBookings procedure for fans', () => {
      expect(router).toContain('getMyBookings');
    });

    it('should validate experience creation input', () => {
      expect(router).toContain('z.object');
      expect(router).toContain('title:');
      expect(router).toContain('duration:');
      expect(router).toContain('price:');
      expect(router).toContain('capacityType:');
      expect(router).toContain('platform:');
      expect(router).toContain('category:');
    });

    it('should support all capacity types', () => {
      expect(router).toContain('one_on_one');
      expect(router).toContain('small_group');
      expect(router).toContain('broadcast');
    });

    it('should support platform field in experience creation', () => {
      expect(router).toContain('platform:');
      expect(router).toContain('platformLink');
    });

    it('should support category field in experience creation', () => {
      expect(router).toContain('category:');
    });
  });

  describe('Router Integration', () => {
    const routersPath = path.join(__dirname, '../routers.ts');
    const routers = fs.readFileSync(routersPath, 'utf-8');

    it('should import the ologyLive router', () => {
      expect(routers).toContain('ologyLiveRouter');
    });

    it('should mount ologyLive in the appRouter', () => {
      expect(routers).toContain('ologyLive:');
    });
  });

  describe('Client Pages', () => {
    const clientPagesDir = path.join(__dirname, '../../client/src/pages');

    it('should have OlogyLiveDashboard page (talent management)', () => {
      const filePath = path.join(clientPagesDir, 'OlogyLiveDashboard.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('ologyLive');
      expect(content).toContain('createExperience');
    });

    it('should have OlogyLiveBrowse page (fan discovery)', () => {
      const filePath = path.join(clientPagesDir, 'OlogyLiveBrowse.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('browseExperiences');
      expect(content).toContain('CATEGORIES');
    });

    it('should have OlogyLiveExperience page (detail & booking)', () => {
      const filePath = path.join(clientPagesDir, 'OlogyLiveExperience.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('bookExperience');
      expect(content).toContain('getExperienceById');
    });
  });

  describe('Navigation & Routing', () => {
    const appPath = path.join(__dirname, '../../client/src/App.tsx');
    const app = fs.readFileSync(appPath, 'utf-8');

    it('should have /ology-live route for browsing', () => {
      expect(app).toContain('/ology-live');
      expect(app).toContain('OlogyLiveBrowse');
    });

    it('should have /ology-live/dashboard route for talent', () => {
      expect(app).toContain('/ology-live/dashboard');
      expect(app).toContain('OlogyLiveDashboard');
    });

    it('should have /ology-live/:id route for experience detail', () => {
      expect(app).toContain('/ology-live/:id');
      expect(app).toContain('OlogyLiveExperience');
    });

    it('should have Ology Live in the site header navigation', () => {
      const headerPath = path.join(__dirname, '../../client/src/components/SiteHeader.tsx');
      const header = fs.readFileSync(headerPath, 'utf-8');
      expect(header).toContain('Ology Live');
      expect(header).toContain('/ology-live');
    });

    it('should have Ology Live in the artist dashboard quick actions', () => {
      const dashPath = path.join(__dirname, '../../client/src/pages/ArtistDashboardV3.tsx');
      const dash = fs.readFileSync(dashPath, 'utf-8');
      expect(dash).toContain('Ology Live');
      expect(dash).toContain('/ology-live/dashboard');
    });
  });

  describe('Experience Categories', () => {
    const browsePath = path.join(__dirname, '../../client/src/pages/OlogyLiveBrowse.tsx');
    const browse = fs.readFileSync(browsePath, 'utf-8');

    it('should support gaming category', () => {
      expect(browse).toContain('gaming');
      expect(browse).toContain('Gaming');
    });

    it('should support music category', () => {
      expect(browse).toContain('music');
      expect(browse).toContain('Music');
    });

    it('should support fitness category', () => {
      expect(browse).toContain('fitness');
      expect(browse).toContain('Fitness');
    });

    it('should support Q&A category', () => {
      expect(browse).toContain('qa');
      expect(browse).toContain('Q&A');
    });

    it('should support workshop category', () => {
      expect(browse).toContain('workshop');
      expect(browse).toContain('Workshop');
    });
  });

  describe('Talent Dashboard Features', () => {
    const dashPath = path.join(__dirname, '../../client/src/pages/OlogyLiveDashboard.tsx');
    const dash = fs.readFileSync(dashPath, 'utf-8');

    it('should allow creating new experiences', () => {
      expect(dash).toContain('createExperience');
      expect(dash).toContain('Create');
    });

    it('should show experience management list', () => {
      expect(dash).toContain('getMyExperiences');
    });

    it('should support experience management', () => {
      expect(dash).toContain('getMyExperiences');
    });

    it('should support toggling experience active status', () => {
      expect(dash).toContain('updateExperience');
      expect(dash).toContain('isActive');
    });

    it('should support deleting experiences', () => {
      expect(dash).toContain('deleteExperience');
    });
  });

  describe('Booking Flow', () => {
    const expPath = path.join(__dirname, '../../client/src/pages/OlogyLiveExperience.tsx');
    const exp = fs.readFileSync(expPath, 'utf-8');

    it('should show available time slots', () => {
      expect(exp).toContain('getAvailableSlots');
    });

    it('should allow selecting a time slot', () => {
      expect(exp).toContain('selectedSlotId');
    });

    it('should support booking with notes', () => {
      expect(exp).toContain('notes');
      expect(exp).toContain('bookExperience');
    });

    it('should handle Stripe checkout redirect', () => {
      expect(exp).toContain('checkoutUrl');
      expect(exp).toContain('window.location.href');
    });

    it('should show booking success state', () => {
      expect(exp).toContain('bookingSuccess');
    });

    it('should show booking error state', () => {
      expect(exp).toContain('bookingError');
    });
  });
});
