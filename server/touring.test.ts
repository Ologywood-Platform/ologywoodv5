import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Touring Feature - Database Schema', () => {
  const schemaPath = path.resolve(__dirname, '../drizzle/schema.ts');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  it('should define tour_availability table', () => {
    expect(schemaContent).toContain('export const tourAvailability = mysqlTable("tour_availability"');
  });

  it('should have artistProfileId column', () => {
    expect(schemaContent).toContain('artistProfileId: int("artistProfileId")');
  });

  it('should have isAvailable boolean column', () => {
    expect(schemaContent).toContain('isAvailable: boolean("isAvailable")');
  });

  it('should have targetRegions JSON column', () => {
    expect(schemaContent).toContain('targetRegions: json("targetRegions")');
  });

  it('should have homeBase varchar column', () => {
    expect(schemaContent).toContain('homeBase: varchar("homeBase"');
  });

  it('should have travelRadius enum column with correct values', () => {
    expect(schemaContent).toContain('travelRadius');
    expect(schemaContent).toContain('"local"');
    expect(schemaContent).toContain('"regional"');
    expect(schemaContent).toContain('"national"');
    expect(schemaContent).toContain('"international"');
  });

  it('should have tourTypes JSON column', () => {
    expect(schemaContent).toContain('tourTypes: json("tourTypes")');
  });

  it('should have dateWindows JSON column', () => {
    expect(schemaContent).toContain('dateWindows: json("dateWindows")');
  });

  it('should have notes text column', () => {
    expect(schemaContent).toContain('notes: text("notes")');
  });

  it('should export TourAvailability and InsertTourAvailability types', () => {
    expect(schemaContent).toContain('export type TourAvailability = typeof tourAvailability.$inferSelect');
    expect(schemaContent).toContain('export type InsertTourAvailability = typeof tourAvailability.$inferInsert');
  });

  it('should have index on artistProfileId', () => {
    expect(schemaContent).toContain('idx_tour_avail_artist');
  });
});

describe('Touring Feature - Database Functions', () => {
  const dbPath = path.resolve(__dirname, './db.ts');
  const dbContent = fs.readFileSync(dbPath, 'utf-8');

  it('should import tourAvailability from schema', () => {
    expect(dbContent).toContain('tourAvailability');
    expect(dbContent).toContain('TourAvailability');
    expect(dbContent).toContain('InsertTourAvailability');
  });

  it('should export getTourAvailability function', () => {
    expect(dbContent).toContain('export async function getTourAvailability');
  });

  it('should export upsertTourAvailability function', () => {
    expect(dbContent).toContain('export async function upsertTourAvailability');
  });

  it('should export getAvailableTouringArtists function', () => {
    expect(dbContent).toContain('export async function getAvailableTouringArtists');
  });

  it('should export getTouringStatusForArtists function', () => {
    expect(dbContent).toContain('export async function getTouringStatusForArtists');
  });

  it('should filter by region in getAvailableTouringArtists', () => {
    expect(dbContent).toContain('filters?.region');
  });

  it('should filter by travelRadius in getAvailableTouringArtists', () => {
    expect(dbContent).toContain('filters?.travelRadius');
  });

  it('should filter by tourType in getAvailableTouringArtists', () => {
    expect(dbContent).toContain('filters?.tourType');
  });
});

describe('Touring Feature - tRPC Router', () => {
  const routerPath = path.resolve(__dirname, './routers/touring.ts');
  const routerContent = fs.readFileSync(routerPath, 'utf-8');

  it('should exist as a router file', () => {
    expect(fs.existsSync(routerPath)).toBe(true);
  });

  it('should export touringRouter', () => {
    expect(routerContent).toContain('export const touringRouter');
  });

  it('should have getMyTouring procedure (protected)', () => {
    expect(routerContent).toContain('getMyTouring: protectedProcedure');
  });

  it('should have updateMyTouring mutation (protected)', () => {
    expect(routerContent).toContain('updateMyTouring: protectedProcedure');
  });

  it('should have getArtistTouring query (public)', () => {
    expect(routerContent).toContain('getArtistTouring: publicProcedure');
  });

  it('should have getAvailableArtists query (public)', () => {
    expect(routerContent).toContain('getAvailableArtists: publicProcedure');
  });

  it('should have getTouringStatus query (public)', () => {
    expect(routerContent).toContain('getTouringStatus: publicProcedure');
  });

  it('should validate date windows (end after start)', () => {
    expect(routerContent).toContain('end date must be after its start date');
  });

  it('should restrict updateMyTouring to artist role', () => {
    expect(routerContent).toContain('Artist access required');
  });

  it('should validate travelRadius enum values', () => {
    expect(routerContent).toContain('z.enum(["local", "regional", "national", "international"])');
  });
});

describe('Touring Feature - Router Registration', () => {
  const routersPath = path.resolve(__dirname, './routers.ts');
  const routersContent = fs.readFileSync(routersPath, 'utf-8');

  it('should import touringRouter', () => {
    expect(routersContent).toContain('import { touringRouter } from "./routers/touring"');
  });

  it('should register touring router in appRouter', () => {
    expect(routersContent).toContain('touring: touringRouter');
  });
});

describe('Touring Feature - Frontend Components', () => {
  it('should have TouringSection component for artist edit page', () => {
    const componentPath = path.resolve(__dirname, '../client/src/components/TouringSection.tsx');
    expect(fs.existsSync(componentPath)).toBe(true);
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('TouringSection');
    expect(content).toContain('touring.getMyTouring');
    expect(content).toContain('touring.updateMyTouring');
    expect(content).toContain('isAvailable');
    expect(content).toContain('targetRegions');
    expect(content).toContain('travelRadius');
    expect(content).toContain('tourTypes');
    expect(content).toContain('dateWindows');
  });

  it('should have TouringDisplay component for public profile', () => {
    const componentPath = path.resolve(__dirname, '../client/src/components/TouringDisplay.tsx');
    expect(fs.existsSync(componentPath)).toBe(true);
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('TouringDisplay');
    expect(content).toContain('TouringBadge');
    expect(content).toContain('touring.getArtistTouring');
    expect(content).toContain('On Tour');
  });

  it('should integrate TouringSection in ArtistEditProfile page', () => {
    const pagePath = path.resolve(__dirname, '../client/src/pages/ArtistEditProfile.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain("import TouringSection from '@/components/TouringSection'");
    expect(content).toContain('<TouringSection />');
  });

  it('should integrate TouringDisplay in ArtistProfile page', () => {
    const pagePath = path.resolve(__dirname, '../client/src/pages/ArtistProfile.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain("import { TouringDisplay } from '@/components/TouringDisplay'");
    expect(content).toContain('<TouringDisplay');
  });

  it('should integrate TouringBadge in Browse page', () => {
    const pagePath = path.resolve(__dirname, '../client/src/pages/Browse.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain("import { TouringBadge } from '@/components/TouringDisplay'");
    expect(content).toContain('<TouringBadge');
    expect(content).toContain('touringStatus');
  });

  it('should have touring filter in SearchFilters component', () => {
    const filterPath = path.resolve(__dirname, '../client/src/components/SearchFilters.tsx');
    const content = fs.readFileSync(filterPath, 'utf-8');
    expect(content).toContain('touringOnly');
    expect(content).toContain('On Tour Only');
    expect(content).toContain('touring-toggle');
  });
});
