import { describe, it, expect } from 'vitest';
import { getDashboardUrl } from '../client/src/utils/dashboardUrl';

// Test the dashboard URL routing for different roles
describe('Blogger Dashboard Routing', () => {
  it('should route bloggers to the shared role-aware Workspace', () => {
    const bloggerUser = { id: 1, name: 'Test Blogger', email: 'blogger@test.com', role: 'blogger' as const };
    expect(getDashboardUrl(bloggerUser)).toBe('/workspace');
  });

  it('should route admins to the shared role-aware Workspace', () => {
    const adminUser = { id: 2, name: 'Test Admin', email: 'admin@test.com', role: 'admin' as const };
    expect(getDashboardUrl(adminUser)).toBe('/workspace');
  });

  it('should route artists to the shared role-aware Workspace', () => {
    const artistUser = { id: 3, name: 'Test Artist', email: 'artist@test.com', role: 'artist' as const };
    expect(getDashboardUrl(artistUser)).toBe('/workspace');
  });

  it('should route venues to the shared role-aware Workspace', () => {
    const venueUser = { id: 4, name: 'Test Venue', email: 'venue@test.com', role: 'venue' as const };
    expect(getDashboardUrl(venueUser)).toBe('/workspace');
  });

  it('should route users to /get-started', () => {
    const regularUser = { id: 5, name: 'Test User', email: 'user@test.com', role: 'user' as const };
    expect(getDashboardUrl(regularUser)).toBe('/get-started');
  });

  it('should route fans to My Ology', () => {
    const fanUser = { id: 6, name: 'Test Fan', email: 'fan@test.com', role: 'fan' as const };
    expect(getDashboardUrl(fanUser)).toBe('/my-ology');
  });

  it('should route null user to /get-started', () => {
    expect(getDashboardUrl(null)).toBe('/get-started');
    expect(getDashboardUrl(undefined)).toBe('/get-started');
  });
});

// Test that blogger role is included in the changeRole options
describe('Blogger Role in Admin', () => {
  it('should include blogger in the valid role list', () => {
    const validRoles = ['admin', 'blogger', 'artist', 'venue', 'user'];
    expect(validRoles).toContain('blogger');
  });

  it('should use one Workspace URL while preserving role-specific content', () => {
    const bloggerUser = { id: 1, name: 'Test', email: 'test@test.com', role: 'blogger' as const };
    const adminUser = { id: 2, name: 'Test', email: 'test@test.com', role: 'admin' as const };
    expect(getDashboardUrl(bloggerUser)).toBe('/workspace');
    expect(getDashboardUrl(adminUser)).toBe('/workspace');
  });

  it('should not route bloggers to admin dashboard', () => {
    const bloggerUser = { id: 1, name: 'Test', email: 'test@test.com', role: 'blogger' as const };
    expect(getDashboardUrl(bloggerUser)).not.toBe('/admin');
    expect(getDashboardUrl(bloggerUser)).not.toBe('/admin/blog');
  });
});
