import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const rootDir = resolve(__dirname, '..');

describe('Fan Notification Service', () => {
  const fanNotifService = readFileSync(resolve(rootDir, 'server/services/fanNotificationService.ts'), 'utf-8');

  it('exports notifyFansNewEvent function', () => {
    expect(fanNotifService).toContain('export async function notifyFansNewEvent');
  });

  it('exports notifyFansProfileUpdate function', () => {
    expect(fanNotifService).toContain('export async function notifyFansProfileUpdate');
  });

  it('includes email consent and unsubscribe link in templates', () => {
    expect(fanNotifService).toContain('Unsubscribe');
    expect(fanNotifService).toContain('email preferences');
  });

  it('fetches followers for the artist before sending', () => {
    expect(fanNotifService).toContain('getArtistFans');
  });

  it('handles case where artist has no followers gracefully', () => {
    expect(fanNotifService).toContain('fans.length === 0');
  });

  it('uses fire-and-forget pattern (does not block caller)', () => {
    // The event creation endpoint calls it without await
    const eventsRouter = readFileSync(resolve(rootDir, 'server/routers/events.ts'), 'utf-8');
    expect(eventsRouter).toContain('notifyFansNewEvent');
    expect(eventsRouter).toContain('.catch(err =>');
  });

  it('sends notifications only for public events', () => {
    const eventsRouter = readFileSync(resolve(rootDir, 'server/routers/events.ts'), 'utf-8');
    expect(eventsRouter).toContain('if (input.isPublic)');
  });
});

describe('Fan Notification Integration in Routers', () => {
  const routersTs = readFileSync(resolve(rootDir, 'server/routers.ts'), 'utf-8');

  it('imports fan notification service in main routers', () => {
    expect(routersTs).toContain('notifyFansProfileUpdate');
    expect(routersTs).toContain('fanNotificationService');
  });

  it('triggers fan notification on artist profile update', () => {
    const updateIdx = routersTs.indexOf('updateProfile: artistProcedure');
    expect(updateIdx).toBeGreaterThan(-1);
    const updateBlock = routersTs.slice(updateIdx, updateIdx + 3000);
    expect(updateBlock).toContain('notifyFansProfileUpdate');
  });
});

describe('Following Page', () => {
  const followingPage = readFileSync(resolve(rootDir, 'client/src/pages/Following.tsx'), 'utf-8');

  it('exists and exports a default component', () => {
    expect(followingPage).toContain('export default function Following');
  });

  it('shows sign-up prompt for unauthenticated users', () => {
    expect(followingPage).toContain('Follow Your Favorite Artists');
    expect(followingPage).toContain('Sign In');
    expect(followingPage).toContain('Create Account');
  });

  it('uses trpc to fetch followed artists', () => {
    expect(followingPage).toContain('follows.getFollowing');
  });

  it('supports unfollow functionality', () => {
    expect(followingPage).toContain('follows.unfollow');
    expect(followingPage).toContain('handleUnfollow');
  });

  it('shows separate sections for artists and venues', () => {
    expect(followingPage).toContain("followingType === 'artist'");
    expect(followingPage).toContain("followingType === 'venue'");
  });

  it('shows empty state with browse link when no artists followed', () => {
    expect(followingPage).toContain('No artists followed yet');
    expect(followingPage).toContain('Browse Artists');
  });

  it('shows followed date for each artist', () => {
    expect(followingPage).toContain('followedAt');
  });

  it('provides navigation to artist profiles', () => {
    expect(followingPage).toContain('/artist/');
  });
});

describe('Following Route Registration', () => {
  const appTsx = readFileSync(resolve(rootDir, 'client/src/App.tsx'), 'utf-8');

  it('imports Following page', () => {
    // Lazy imports use import() syntax
    expect(appTsx).toContain('./pages/Following');
  });

  it('registers /following route', () => {
    expect(appTsx).toContain('path="/following"');
    expect(appTsx).toContain('component={Following}');
  });
});

describe('Fan Role in Schema', () => {
  const schema = readFileSync(resolve(rootDir, 'drizzle/schema.ts'), 'utf-8');

  it('includes fan in the user role enum', () => {
    expect(schema).toMatch(/['"]fan['"]/);
  });
});

describe('Follow Endpoints - Tier Gate Removed', () => {
  const followsRouter = readFileSync(resolve(rootDir, 'server/routers/follows.ts'), 'utf-8');

  it('follow endpoint uses protectedProcedure (not tier-gated)', () => {
    const followIdx = followsRouter.indexOf('follow: protectedProcedure');
    expect(followIdx).toBeGreaterThan(-1);
  });

  it('unfollow endpoint uses protectedProcedure (not tier-gated)', () => {
    expect(followsRouter).toContain('unfollow: protectedProcedure');
  });

  it('getFanEmails endpoint exists for paid tier access', () => {
    expect(followsRouter).toContain('getFanEmails');
  });
});
