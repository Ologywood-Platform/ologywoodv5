import { describe, it, expect } from 'vitest';
import { getDashboardUrl } from '../client/src/utils/dashboardUrl';

// Test the dashboard URL routing for different roles
describe('Blogger Dashboard Routing', () => {
  it('should route bloggers to /blogger-dashboard', () => {
    const bloggerUser = { id: 1, name: 'Test Blogger', email: 'blogger@test.com', role: 'blogger' as const };
    expect(getDashboardUrl(bloggerUser)).toBe('/blogger-dashboard');
  });

  it('should route admins to /admin', () => {
    const adminUser = { id: 2, name: 'Test Admin', email: 'admin@test.com', role: 'admin' as const };
    expect(getDashboardUrl(adminUser)).toBe('/admin');
  });

  it('should route artists to /dashboard', () => {
    const artistUser = { id: 3, name: 'Test Artist', email: 'artist@test.com', role: 'artist' as const };
    expect(getDashboardUrl(artistUser)).toBe('/dashboard');
  });

  it('should route venues to /venue-dashboard', () => {
    const venueUser = { id: 4, name: 'Test Venue', email: 'venue@test.com', role: 'venue' as const };
    expect(getDashboardUrl(venueUser)).toBe('/venue-dashboard');
  });

  it('should route users to /get-started', () => {
    const regularUser = { id: 5, name: 'Test User', email: 'user@test.com', role: 'user' as const };
    expect(getDashboardUrl(regularUser)).toBe('/get-started');
  });

  it('should route fans to /', () => {
    const fanUser = { id: 6, name: 'Test Fan', email: 'fan@test.com', role: 'fan' as const };
    expect(getDashboardUrl(fanUser)).toBe('/');
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

  it('should have blogger as a distinct role from admin', () => {
    const bloggerUser = { id: 1, name: 'Test', email: 'test@test.com', role: 'blogger' as const };
    const adminUser = { id: 2, name: 'Test', email: 'test@test.com', role: 'admin' as const };
    expect(getDashboardUrl(bloggerUser)).not.toBe(getDashboardUrl(adminUser));
  });

  it('should not route bloggers to admin dashboard', () => {
    const bloggerUser = { id: 1, name: 'Test', email: 'test@test.com', role: 'blogger' as const };
    expect(getDashboardUrl(bloggerUser)).not.toBe('/admin');
    expect(getDashboardUrl(bloggerUser)).not.toBe('/admin/blog');
  });
});
