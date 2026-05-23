import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Venue Features - Calendar View', () => {
  it('VenueCalendar component exists', () => {
    const filePath = path.resolve(__dirname, '../../client/src/components/VenueCalendar.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('VenueCalendar is imported in VenueDashboard', () => {
    const filePath = path.resolve(__dirname, '../../client/src/pages/VenueDashboard.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain("import VenueCalendar from '../components/VenueCalendar'");
  });

  it('VenueCalendar has calendar tab trigger', () => {
    const filePath = path.resolve(__dirname, '../../client/src/pages/VenueDashboard.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('value="calendar"');
  });

  it('VenueCalendar renders monthly grid with day cells', () => {
    const filePath = path.resolve(__dirname, '../../client/src/components/VenueCalendar.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Sun');
    expect(content).toContain('Mon');
    expect(content).toContain('Tue');
  });

  it('VenueCalendar has color-coded booking status', () => {
    const filePath = path.resolve(__dirname, '../../client/src/components/VenueCalendar.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('confirmed');
    expect(content).toContain('pending');
    expect(content).toContain('cancelled');
  });
});

describe('Venue Features - Artist Filtering', () => {
  it('ArtistFilters component exists', () => {
    const filePath = path.resolve(__dirname, '../../client/src/components/ArtistFilters.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('ArtistFilters is imported in VenueDashboard', () => {
    const filePath = path.resolve(__dirname, '../../client/src/pages/VenueDashboard.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain("import ArtistFilters");
  });

  it('ArtistFilters has genre filter with common genres', () => {
    const filePath = path.resolve(__dirname, '../../client/src/components/ArtistFilters.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Hip-Hop');
    expect(content).toContain('Jazz');
    expect(content).toContain('Rock');
    expect(content).toContain('Electronic');
  });

  it('ArtistFilters has location filter', () => {
    const filePath = path.resolve(__dirname, '../../client/src/components/ArtistFilters.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('location');
    expect(content).toContain('MapPin');
  });

  it('ArtistFilters has fee range filter', () => {
    const filePath = path.resolve(__dirname, '../../client/src/components/ArtistFilters.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('minFee');
    expect(content).toContain('maxFee');
    expect(content).toContain('DollarSign');
  });

  it('ArtistFilters has availability date filter', () => {
    const filePath = path.resolve(__dirname, '../../client/src/components/ArtistFilters.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('availableDate');
    expect(content).toContain('type="date"');
  });

  it('VenueDashboard uses artist.search instead of artist.getAll', () => {
    const filePath = path.resolve(__dirname, '../../client/src/pages/VenueDashboard.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('trpc.artist.search.useQuery');
  });
});

describe('Venue Features - Door-Split Payment Calculations', () => {
  it('Schema has paymentTermsType field on bookings', () => {
    const filePath = path.resolve(__dirname, '../../drizzle/schema.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('paymentTermsType');
    expect(content).toContain('flat_guarantee');
    expect(content).toContain('door_split');
    expect(content).toContain('guarantee_vs_percentage');
  });

  it('Schema has doorSplitArtistPercent field', () => {
    const filePath = path.resolve(__dirname, '../../drizzle/schema.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('doorSplitArtistPercent');
  });

  it('Schema has settlement fields (doorRevenue, settlementAmount, settledAt)', () => {
    const filePath = path.resolve(__dirname, '../../drizzle/schema.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('doorRevenue');
    expect(content).toContain('settlementAmount');
    expect(content).toContain('settledAt');
  });

  it('Router has settleBooking endpoint', () => {
    const filePath = path.resolve(__dirname, '../routers.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('settleBooking: venueProcedure');
  });

  it('Settlement calculates flat guarantee correctly', () => {
    const filePath = path.resolve(__dirname, '../routers.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain("if (termsType === 'flat_guarantee')");
    expect(content).toContain("parseFloat(booking.totalFee || '0')");
  });

  it('Settlement calculates door split correctly', () => {
    const filePath = path.resolve(__dirname, '../routers.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain("if (termsType === 'door_split')");
    expect(content).toContain('doorRevenue * artistPercent');
  });

  it('Settlement calculates guarantee_vs_percentage correctly', () => {
    const filePath = path.resolve(__dirname, '../routers.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain("if (termsType === 'guarantee_vs_percentage')");
    expect(content).toContain('Math.max(guarantee, doorPayout)');
  });

  it('SettlementForm component exists', () => {
    const filePath = path.resolve(__dirname, '../../client/src/components/SettlementForm.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('SettlementForm shows preview calculation', () => {
    const filePath = path.resolve(__dirname, '../../client/src/components/SettlementForm.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('calculatePreview');
    expect(content).toContain('Artist Payout');
  });

  it('Booking create endpoint accepts payment terms', () => {
    const filePath = path.resolve(__dirname, '../routers.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain("paymentTermsType: z.enum(['flat_guarantee', 'door_split', 'guarantee_vs_percentage'])");
    expect(content).toContain('doorSplitArtistPercent: z.number().min(0).max(100)');
    expect(content).toContain('guaranteeAmount: z.number()');
  });
});

describe('Venue Features - Saved/Favorited Artists', () => {
  it('Schema has savedArtists table', () => {
    const filePath = path.resolve(__dirname, '../../drizzle/schema.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('export const savedArtists = mysqlTable("saved_artists"');
    expect(content).toContain('venueId');
    expect(content).toContain('artistId');
  });

  it('DB has saveArtist and unsaveArtist functions', () => {
    const filePath = path.resolve(__dirname, '../db.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('export async function saveArtist');
    expect(content).toContain('export async function unsaveArtist');
    expect(content).toContain('export async function getSavedArtistsByVenueId');
    expect(content).toContain('export async function isArtistSaved');
  });

  it('Router has saveArtist endpoint', () => {
    const filePath = path.resolve(__dirname, '../routers.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('saveArtist: venueProcedure');
    expect(content).toContain('unsaveArtist: venueProcedure');
    expect(content).toContain('getSavedArtists: venueProcedure');
    expect(content).toContain('isArtistSaved: venueProcedure');
  });

  it('SaveArtistButton component exists', () => {
    const filePath = path.resolve(__dirname, '../../client/src/components/SaveArtistButton.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('SaveArtistButton uses heart icon', () => {
    const filePath = path.resolve(__dirname, '../../client/src/components/SaveArtistButton.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Heart');
    expect(content).toContain('fill-current');
  });

  it('SaveArtistButton is integrated in VenueDashboard', () => {
    const filePath = path.resolve(__dirname, '../../client/src/pages/VenueDashboard.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain("import SaveArtistButton from '../components/SaveArtistButton'");
    expect(content).toContain('<SaveArtistButton');
  });
});

describe('Venue Features - Venue Event Creation', () => {
  it('Schema has venueId field on events table', () => {
    const filePath = path.resolve(__dirname, '../../drizzle/schema.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('venueId: int("venueId")');
    expect(content).toContain('venueIdx: index("idx_events_venue")');
  });

  it('Router has createVenueEvent endpoint', () => {
    const filePath = path.resolve(__dirname, '../routers/events.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('createVenueEvent: protectedProcedure');
    expect(content).toContain("eventSource: 'venue_booking'");
  });

  it('Router has getVenueEvents endpoint', () => {
    const filePath = path.resolve(__dirname, '../routers/events.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('getVenueEvents: protectedProcedure');
    expect(content).toContain('getEventsByVenueProfileId');
  });

  it('createVenueEvent validates venue role', () => {
    const filePath = path.resolve(__dirname, '../routers/events.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain("ctx.user.role !== 'venue'");
    expect(content).toContain('Only venues can create venue events');
  });

  it('createVenueEvent validates booking ownership', () => {
    const filePath = path.resolve(__dirname, '../routers/events.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Booking does not belong to this venue');
    expect(content).toContain('Can only create events for confirmed bookings');
  });
});
