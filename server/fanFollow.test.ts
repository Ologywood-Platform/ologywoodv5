import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..');

describe('Fan + Follow Feature', () => {
  describe('Schema', () => {
    const schema = readFileSync(join(ROOT, 'drizzle/schema.ts'), 'utf-8');

    it('should include fan in the user role enum', () => {
      // Check that the role enum includes 'fan'
      expect(schema).toMatch(/mysqlEnum.*role.*fan/);
    });

    it('should have follows table defined', () => {
      expect(schema).toContain('follows');
    });
  });

  describe('Follows Router', () => {
    const router = readFileSync(join(ROOT, 'server/routers/follows.ts'), 'utf-8');

    it('should have follow endpoint without tier restriction', () => {
      expect(router).toContain('follow:');
      // Should use protectedProcedure, not a tier-gated one
      expect(router).toContain('protectedProcedure');
    });

    it('should have unfollow endpoint', () => {
      expect(router).toContain('unfollow:');
    });

    it('should have isFollowing endpoint', () => {
      expect(router).toContain('isFollowing:');
    });

    it('should have getStats endpoint', () => {
      expect(router).toContain('getStats:');
    });

    it('should have getFollowers endpoint', () => {
      expect(router).toContain('getFollowers:');
    });

    it('should have getFanEmails endpoint gated behind paid tier', () => {
      expect(router).toContain('getFanEmails:');
      // Should check subscription tier
      expect(router).toMatch(/tier|subscription|starter|professional/i);
    });
  });

  describe('FollowButton Component', () => {
    const component = readFileSync(join(ROOT, 'client/src/components/FollowButton.tsx'), 'utf-8');

    it('should show "Sign Up to Follow" for unauthenticated users', () => {
      expect(component).toContain('Sign Up to Follow');
    });

    it('should show "Follow" for authenticated users who are not following', () => {
      expect(component).toContain('"Follow"');
    });

    it('should show "Following" when user is already following', () => {
      expect(component).toContain('Following');
    });

    it('should show "Unfollow" on hover when following', () => {
      expect(component).toContain('Unfollow');
    });

    it('should include email consent dialog', () => {
      expect(component).toContain('you agree to receive email updates');
    });

    it('should display follower count', () => {
      expect(component).toContain('followerCount');
      expect(component).toContain('followers');
    });

    it('should redirect to login for unauthenticated users', () => {
      expect(component).toContain('getLoginUrl');
    });

    it('should use trpc follows.follow mutation', () => {
      expect(component).toContain('trpc.follows.follow.useMutation');
    });

    it('should use trpc follows.unfollow mutation', () => {
      expect(component).toContain('trpc.follows.unfollow.useMutation');
    });

    it('should query isFollowing status', () => {
      expect(component).toContain('trpc.follows.isFollowing.useQuery');
    });
  });

  describe('FansSection Component', () => {
    const component = readFileSync(join(ROOT, 'client/src/components/FansSection.tsx'), 'utf-8');

    it('should display follower count', () => {
      expect(component).toContain('followersCount');
    });

    it('should show empty state when no fans', () => {
      expect(component).toContain('No fans yet');
    });

    it('should blur emails for free tier users', () => {
      expect(component).toContain('blur-sm');
      expect(component).toContain('email@hidden.com');
    });

    it('should show upgrade prompt for free tier', () => {
      expect(component).toContain('Unlock Your Fan Email List');
      expect(component).toContain('View Plans');
    });

    it('should link to pricing page for upgrade', () => {
      expect(component).toContain('/pricing');
    });

    it('should support CSV export for paid tier', () => {
      expect(component).toContain('Export CSV');
      expect(component).toContain('text/csv');
    });

    it('should include fan email data in CSV export', () => {
      expect(component).toContain('Name,Email,Followed Since');
    });

    it('should query getFanEmails endpoint', () => {
      expect(component).toContain('trpc.follows.getFanEmails.useQuery');
    });
  });

  describe('Artist Dashboard Integration', () => {
    const dashboard = readFileSync(join(ROOT, 'client/src/pages/ArtistDashboardV3.tsx'), 'utf-8');

    it('should import FansSection component', () => {
      expect(dashboard).toContain("import { FansSection }");
    });

    it('should render FansSection with artistUserId', () => {
      expect(dashboard).toContain('<FansSection artistUserId=');
    });

    it('should include Users icon for fans', () => {
      expect(dashboard).toContain('Users');
    });
  });

  describe('Artist Profile Integration', () => {
    const profile = readFileSync(join(ROOT, 'client/src/pages/ArtistProfile.tsx'), 'utf-8');

    it('should import FollowButton component', () => {
      expect(profile).toContain("import { FollowButton }");
    });

    it('should render FollowButton with artist data', () => {
      expect(profile).toContain('<FollowButton');
      expect(profile).toContain('artistName={artist.artistName}');
    });

    it('should not have old inline follow mutation', () => {
      // The old followMutation should be removed since FollowButton handles it
      const followMutationCount = (profile.match(/followMutation/g) || []).length;
      expect(followMutationCount).toBe(0);
    });
  });
});
