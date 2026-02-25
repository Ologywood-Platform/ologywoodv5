import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const clientSrc = join(__dirname, '..', 'client', 'src');

describe('ReviewSystem - Auth-Aware Prompts', () => {
  const reviewSystemPath = join(clientSrc, 'components', 'ReviewSystem.tsx');
  const content = readFileSync(reviewSystemPath, 'utf-8');

  it('imports useAuth hook for authentication state', () => {
    expect(content).toContain("import { useAuth }");
    expect(content).toContain("useAuth()");
  });

  it('imports getLoginUrl for sign-in redirect', () => {
    expect(content).toContain("import { getLoginUrl }");
  });

  it('checks isAuthenticated state to determine review prompt', () => {
    expect(content).toContain('isAuthenticated');
  });

  it('shows sign-up prompt for unauthenticated users', () => {
    expect(content).toContain('Sign up as a');
    expect(content).toContain('to share your experience');
    expect(content).toContain('Sign In');
    expect(content).toContain('Create Account');
  });

  it('shows role-specific message for wrong-role users', () => {
    expect(content).toContain('canReview');
    expect(content).toContain('Only registered');
    expect(content).toContain('can leave reviews');
  });

  it('shows Write a Review button only for authorized users', () => {
    expect(content).toContain('Write a Review');
    // The button should be gated behind canReview
    expect(content).toContain('canReview');
  });

  it('determines reviewer role based on target type', () => {
    // If reviewing an artist, only venues can review
    expect(content).toContain("targetType === 'artist' && user.role === 'venue'");
    // If reviewing a venue, only artists can review
    expect(content).toContain("targetType === 'venue' && user.role === 'artist'");
  });

  it('renders review form only when canReview and showForm are true', () => {
    expect(content).toContain('showForm && canReview');
  });

  it('reviews list is always visible regardless of auth state', () => {
    // The "Recent Reviews" section should not be gated behind auth
    expect(content).toContain('Recent Reviews');
    expect(content).toContain('No reviews yet');
  });

  it('uses LogIn and UserPlus icons for the auth prompt', () => {
    expect(content).toContain('LogIn');
    expect(content).toContain('UserPlus');
  });

  it('redirects to login with current path as return URL', () => {
    expect(content).toContain('getLoginUrl(window.location.pathname)');
  });
});
