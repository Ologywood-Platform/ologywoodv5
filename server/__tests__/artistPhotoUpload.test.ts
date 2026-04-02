import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Artist Profile Photo Upload Fix', () => {
  const routersPath = resolve(__dirname, '../routers.ts');
  let routersContent: string;

  beforeEach(() => {
    routersContent = readFileSync(routersPath, 'utf-8');
  });

  describe('uploadPhoto endpoint', () => {
    it('should save photo URL to database after upload', () => {
      // The uploadPhoto endpoint must call db.updateArtistProfile to save the URL
      const uploadPhotoSection = routersContent.slice(
        routersContent.indexOf('uploadPhoto: artistProcedure'),
        routersContent.indexOf('uploadPhoto: artistProcedure') + 1000
      );
      
      expect(uploadPhotoSection).toContain('handlePhotoUpload');
      expect(uploadPhotoSection).toContain('getArtistProfileByUserId');
      expect(uploadPhotoSection).toContain('updateArtistProfile');
      expect(uploadPhotoSection).toContain('profilePhotoUrl');
    });

    it('should not have duplicate S3 upload (removed raw storagePut call)', () => {
      // The old code had both a raw storagePut AND handlePhotoUpload, causing double upload
      const uploadPhotoSection = routersContent.slice(
        routersContent.indexOf('uploadPhoto: artistProcedure'),
        routersContent.indexOf('uploadPhoto: artistProcedure') + 800
      );
      
      // Should only use handlePhotoUpload, not raw storagePut
      const storagePutCount = (uploadPhotoSection.match(/storagePut/g) || []).length;
      expect(storagePutCount).toBe(0); // handlePhotoUpload calls storagePut internally
    });
  });

  describe('uploadProfilePhoto endpoint', () => {
    it('should save photo URL to database after upload', () => {
      const startIdx = routersContent.indexOf('uploadProfilePhoto: artistProcedure');
      const uploadProfilePhotoSection = routersContent.slice(startIdx, startIdx + 1200);
      
      expect(uploadProfilePhotoSection).toContain('storagePut');
      expect(uploadProfilePhotoSection).toContain('updateArtistProfile');
      expect(uploadProfilePhotoSection).toContain('profilePhotoUrl');
    });
  });

  describe('ArtistOnboarding component', () => {
    const onboardingPath = resolve(__dirname, '../../client/src/pages/ArtistOnboarding.tsx');
    let onboardingContent: string;

    beforeEach(() => {
      onboardingContent = readFileSync(onboardingPath, 'utf-8');
    });

    it('should use uploadProfilePhoto endpoint (not uploadPhoto)', () => {
      // Onboarding must use the endpoint that saves to DB
      expect(onboardingContent).toContain('artist.uploadProfilePhoto');
    });

    it('should use mutateAsync for proper await in handleUploadPhoto', () => {
      // Must use mutateAsync to properly await the upload before creating profile
      expect(onboardingContent).toContain('mutateAsync');
    });

    it('should not have the old setTimeout race condition', () => {
      // The old code used setTimeout(resolve, 1000) which caused a race condition
      expect(onboardingContent).not.toContain('setTimeout(resolve, 1000)');
    });

    it('should pass photoUrl from upload result to createProfile', () => {
      // The handleSubmit should use the returned URL, not rely on stale state
      expect(onboardingContent).toContain('photoUrl = await handleUploadPhoto()');
      expect(onboardingContent).toContain('profilePhotoUrl: photoUrl');
    });
  });
});
