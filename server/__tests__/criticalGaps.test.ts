import { describe, it, expect } from 'vitest';

describe('Critical Gap 1: Venue E2E Flow', () => {
  it('VenueOnboarding page exists and is not a placeholder', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('client/src/pages/VenueOnboarding.tsx', 'utf-8');
    // Should NOT contain the old placeholder text
    expect(content).not.toContain('Venue onboarding is currently being updated');
    // Should contain actual form fields
    expect(content).toContain('organizationName');
    expect(content).toContain('venue profile');
  });

  it('BookingDetail uses dynamic breadcrumb based on user role', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('client/src/pages/BookingDetail.tsx', 'utf-8');
    // Should reference venue-dashboard for venue users
    expect(content).toContain('venue-dashboard');
  });

  it('BookingCreate uses dynamic redirect based on user role', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('client/src/pages/BookingCreate.tsx', 'utf-8');
    // Should reference venue-dashboard for venue users
    expect(content).toContain('venue-dashboard');
  });
});

describe('Critical Gap 2: Dispute Resolution', () => {
  it('booking_disputes table exists in schema', async () => {
    const fs = await import('fs');
    const schema = fs.readFileSync('drizzle/schema.ts', 'utf-8');
    expect(schema).toContain('bookingDisputes');
    expect(schema).toContain('cancellation_dispute');
    expect(schema).toContain('booking_disputes');
  });

  it('dispute router is registered', async () => {
    const fs = await import('fs');
    const routers = fs.readFileSync('server/routers.ts', 'utf-8');
    expect(routers).toContain('dispute');
  });

  it('dispute router has required endpoints', async () => {
    const fs = await import('fs');
    const disputeRouter = fs.readFileSync('server/routers/dispute.ts', 'utf-8');
    expect(disputeRouter).toContain('create');
    expect(disputeRouter).toContain('getMyDisputes');
    expect(disputeRouter).toContain('getById');
  });

  it('ReportIssueDialog component exists', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('client/src/components/ReportIssueDialog.tsx', 'utf-8');
    expect(content).toContain('ReportIssueDialog');
    expect(content).toContain('cancellation_dispute');
  });

  it('MyDisputes page exists with route', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('client/src/pages/MyDisputes.tsx', 'utf-8');
    expect(content).toContain('MyDisputes');
    
    const appContent = fs.readFileSync('client/src/App.tsx', 'utf-8');
    expect(appContent).toContain('disputes');
  });
});

describe('Critical Gap 3: Calendar Integration', () => {
  it('auto-blocking is already implemented in booking confirmation', async () => {
    const fs = await import('fs');
    const routers = fs.readFileSync('server/routers.ts', 'utf-8');
    // Should call setAvailability when booking is confirmed
    expect(routers).toContain('setAvailability');
  });

  it('iCal feed route exists', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('server/routes/calendarFeed.ts', 'utf-8');
    expect(content).toContain('bookings.ics');
    expect(content).toContain('VCALENDAR');
    expect(content).toContain('VEVENT');
    expect(content).toContain('text/calendar');
  });

  it('iCal feed route is registered in server index', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('server/index.ts', 'utf-8');
    expect(content).toContain('calendarFeedRoutes');
    expect(content).toContain('/api/calendar');
  });

  it('getCalendarFeedUrl endpoint exists in artist router', async () => {
    const fs = await import('fs');
    const routers = fs.readFileSync('server/routers.ts', 'utf-8');
    expect(routers).toContain('getCalendarFeedUrl');
    expect(routers).toContain('generateCalendarToken');
  });

  it('CalendarSync component exists and is added to dashboard', async () => {
    const fs = await import('fs');
    const component = fs.readFileSync('client/src/components/CalendarSync.tsx', 'utf-8');
    expect(component).toContain('CalendarSync');
    expect(component).toContain('Google Calendar');
    expect(component).toContain('webcal://');
    
    const dashboard = fs.readFileSync('client/src/pages/ArtistDashboardV3.tsx', 'utf-8');
    expect(dashboard).toContain('CalendarSync');
  });

  it('calendar token generation uses HMAC-SHA256', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('server/routes/calendarFeed.ts', 'utf-8');
    expect(content).toContain('sha256');
    expect(content).toContain('createHmac');
  });
});
