import { describe, it, expect } from 'vitest';

/**
 * Venue Sponsor feature tests
 * Tests the schema structure and router availability
 */

describe('Venue Sponsor Schema', () => {
  it('should have venue_sponsor_packages table with correct fields', async () => {
    const { venueSponsorPackages } = await import('../drizzle/schema');
    expect(venueSponsorPackages).toBeDefined();
    // Verify key columns exist
    expect(venueSponsorPackages.venueId).toBeDefined();
    expect(venueSponsorPackages.name).toBeDefined();
    expect(venueSponsorPackages.packageType).toBeDefined();
    expect(venueSponsorPackages.price).toBeDefined();
    expect(venueSponsorPackages.duration).toBeDefined();
    expect(venueSponsorPackages.maxSlots).toBeDefined();
    expect(venueSponsorPackages.filledSlots).toBeDefined();
    expect(venueSponsorPackages.benefits).toBeDefined();
    expect(venueSponsorPackages.isActive).toBeDefined();
  });

  it('should have venue_sponsor_applications table with correct fields', async () => {
    const { venueSponsorApplications } = await import('../drizzle/schema');
    expect(venueSponsorApplications).toBeDefined();
    expect(venueSponsorApplications.packageId).toBeDefined();
    expect(venueSponsorApplications.venueId).toBeDefined();
    expect(venueSponsorApplications.companyName).toBeDefined();
    expect(venueSponsorApplications.contactEmail).toBeDefined();
    expect(venueSponsorApplications.status).toBeDefined();
  });

  it('should have venue_active_sponsors table with correct fields', async () => {
    const { venueActiveSponsors } = await import('../drizzle/schema');
    expect(venueActiveSponsors).toBeDefined();
    expect(venueActiveSponsors.venueId).toBeDefined();
    expect(venueActiveSponsors.applicationId).toBeDefined();
    expect(venueActiveSponsors.companyName).toBeDefined();
    expect(venueActiveSponsors.companyLogoUrl).toBeDefined();
    expect(venueActiveSponsors.companyWebsite).toBeDefined();
    expect(venueActiveSponsors.isActive).toBeDefined();
  });
});

describe('Venue Sponsor Router', () => {
  it('should export the venueSponsorRouter', async () => {
    const { venueSponsorRouter } = await import('./routers/venueSponsor');
    expect(venueSponsorRouter).toBeDefined();
  });

  it('should have all required procedures', async () => {
    const { venueSponsorRouter } = await import('./routers/venueSponsor');
    const procedures = Object.keys(venueSponsorRouter._def.procedures);
    expect(procedures).toContain('getMyPackages');
    expect(procedures).toContain('createPackage');
    expect(procedures).toContain('updatePackage');
    expect(procedures).toContain('deletePackage');
    expect(procedures).toContain('getMyApplications');
    expect(procedures).toContain('approveApplication');
    expect(procedures).toContain('rejectApplication');
    expect(procedures).toContain('submitApplication');
    expect(procedures).toContain('browseOpportunities');
    expect(procedures).toContain('getPublicSponsors');
  });
});
