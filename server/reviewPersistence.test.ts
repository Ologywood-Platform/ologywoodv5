import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Review Persistence Feature', () => {
  const routersPath = path.join(__dirname, 'routers.ts');
  const routersContent = fs.readFileSync(routersPath, 'utf-8');
  
  const reviewSystemPath = path.join(__dirname, '..', 'client', 'src', 'components', 'ReviewSystem.tsx');
  const reviewSystemContent = fs.readFileSync(reviewSystemPath, 'utf-8');

  const schemaPath = path.join(__dirname, '..', 'drizzle', 'schema.ts');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  describe('Backend: createFromProfile endpoint', () => {
    it('should have a createFromProfile endpoint in the review router', () => {
      expect(routersContent).toContain('createFromProfile');
    });

    it('should accept artistId, rating, title, and reviewText inputs', () => {
      expect(routersContent).toContain("artistId: z.number()");
      expect(routersContent).toContain("rating: z.number().min(1).max(5)");
      expect(routersContent).toContain("title: z.string().min(1).max(200)");
      expect(routersContent).toContain("reviewText: z.string().min(1).max(2000)");
    });

    it('should be a venue-only procedure', () => {
      const createFromProfileSection = routersContent.slice(
        routersContent.indexOf('createFromProfile'),
        routersContent.indexOf('createFromProfile') + 500
      );
      expect(createFromProfileSection).toContain('venueProcedure');
    });

    it('should check if artist exists before creating review', () => {
      expect(routersContent).toContain('getArtistProfileById(input.artistId)');
      expect(routersContent).toContain("'Artist not found'");
    });

    it('should prevent duplicate reviews from the same user', () => {
      expect(routersContent).toContain('You have already reviewed this artist');
      expect(routersContent).toContain('r.reviewerUserId === ctx.user.id');
    });

    it('should use reviewerUserId instead of requiring venue profile', () => {
      const startIdx = routersContent.indexOf('createFromProfile');
      const createFromProfileSection = routersContent.slice(startIdx, startIdx + 1500);
      expect(createFromProfileSection).toContain('reviewerUserId');
      expect(createFromProfileSection).toContain('ctx.user.id');
    });

    it('should store title and review text as combined comment', () => {
      expect(routersContent).toContain('${input.title}');
      expect(routersContent).toContain('${input.reviewText}');
    });
  });

  describe('Schema: bookingId and venueId are optional', () => {
    it('should have bookingId without notNull constraint for profile-based reviews', () => {
      const reviewsTableSection = schemaContent.slice(
        schemaContent.indexOf('export const reviews = mysqlTable'),
        schemaContent.indexOf('export const reviews = mysqlTable') + 500
      );
      expect(reviewsTableSection).toContain('bookingId');
      expect(reviewsTableSection).not.toMatch(/bookingId.*\.notNull\(\)/);
    });

    it('should have venueId without notNull constraint', () => {
      const reviewsTableSection = schemaContent.slice(
        schemaContent.indexOf('export const reviews = mysqlTable'),
        schemaContent.indexOf('export const reviews = mysqlTable') + 500
      );
      expect(reviewsTableSection).toContain('venueId');
      expect(reviewsTableSection).not.toMatch(/venueId.*\.notNull\(\)/);
    });

    it('should have reviewerUserId column for profile-based reviews', () => {
      const reviewsTableSection = schemaContent.slice(
        schemaContent.indexOf('export const reviews = mysqlTable'),
        schemaContent.indexOf('export const reviews = mysqlTable') + 500
      );
      expect(reviewsTableSection).toContain('reviewerUserId');
    });
  });

  describe('Frontend: ReviewSystem component', () => {
    it('should import trpc for API calls', () => {
      expect(reviewSystemContent).toContain("import { trpc }");
    });

    it('should use trpc.review.getByArtist.useQuery to fetch reviews', () => {
      expect(reviewSystemContent).toContain('trpc.review.getByArtist.useQuery');
    });

    it('should use trpc.review.getAverageRating.useQuery to fetch rating', () => {
      expect(reviewSystemContent).toContain('trpc.review.getAverageRating.useQuery');
    });

    it('should use trpc.review.createFromProfile.useMutation to submit reviews', () => {
      expect(reviewSystemContent).toContain('trpc.review.createFromProfile.useMutation');
    });

    it('should refetch reviews after successful submission', () => {
      expect(reviewSystemContent).toContain('reviewsQuery.refetch()');
      expect(reviewSystemContent).toContain('ratingQuery.refetch()');
    });

    it('should show loading skeletons while fetching reviews', () => {
      expect(reviewSystemContent).toContain('reviewsQuery.isLoading');
      expect(reviewSystemContent).toContain('animate-pulse');
    });

    it('should display Verified Booking badge for booking-based reviews', () => {
      expect(reviewSystemContent).toContain('Verified Booking');
    });

    it('should display artist responses when present', () => {
      expect(reviewSystemContent).toContain('artistResponse');
      expect(reviewSystemContent).toContain('Artist Response');
    });

    it('should show character count for review text', () => {
      expect(reviewSystemContent).toContain('/2000 characters');
    });

    it('should disable submit button when title or content is empty', () => {
      expect(reviewSystemContent).toContain("!title.trim() || !content.trim()");
    });

    it('should not have photo upload functionality (removed for lean approach)', () => {
      expect(reviewSystemContent).not.toContain('photo-upload');
      expect(reviewSystemContent).not.toContain('handlePhotoUpload');
    });

    it('should show auth-aware prompts for non-logged-in users', () => {
      expect(reviewSystemContent).toContain('Have you worked with this');
      expect(reviewSystemContent).toContain('Sign In');
      expect(reviewSystemContent).toContain('Create Account');
    });

    it('should show Leave a Review button for authorized users', () => {
      expect(reviewSystemContent).toContain('Leave a Review');
    });
  });
});
