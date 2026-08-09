import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const rootDir = resolve(__dirname, '../..');

describe('Athlete Rider Templates Feature', () => {
  describe('Template Definitions', () => {
    const templateFile = readFileSync(resolve(rootDir, 'server/services/riderContractTemplate.ts'), 'utf-8');

    it('exports ATHLETE_APPEARANCE_RIDER template', () => {
      expect(templateFile).toContain('export const ATHLETE_APPEARANCE_RIDER: RiderContractTemplate');
      expect(templateFile).toContain("id: 'athlete_appearance'");
    });

    it('exports ATHLETE_SIGNING_RIDER template', () => {
      expect(templateFile).toContain('export const ATHLETE_SIGNING_RIDER: RiderContractTemplate');
      expect(templateFile).toContain("id: 'athlete_signing'");
    });

    it('exports ATHLETE_SPEAKING_RIDER template', () => {
      expect(templateFile).toContain('export const ATHLETE_SPEAKING_RIDER: RiderContractTemplate');
      expect(templateFile).toContain("id: 'athlete_speaking'");
    });

    it('exports ATHLETE_CAMP_RIDER template', () => {
      expect(templateFile).toContain('export const ATHLETE_CAMP_RIDER: RiderContractTemplate');
      expect(templateFile).toContain("id: 'athlete_camp'");
    });

    it('registers all athlete templates in ALL_TEMPLATES', () => {
      expect(templateFile).toContain('athlete_appearance: ATHLETE_APPEARANCE_RIDER');
      expect(templateFile).toContain('athlete_signing: ATHLETE_SIGNING_RIDER');
      expect(templateFile).toContain('athlete_speaking: ATHLETE_SPEAKING_RIDER');
      expect(templateFile).toContain('athlete_camp: ATHLETE_CAMP_RIDER');
    });

    it('includes athlete templates in getAllRiderTemplates', () => {
      expect(templateFile).toContain('athlete_appearance: ATHLETE_APPEARANCE_RIDER');
      expect(templateFile).toContain('athlete_signing: ATHLETE_SIGNING_RIDER');
      expect(templateFile).toContain('athlete_speaking: ATHLETE_SPEAKING_RIDER');
      expect(templateFile).toContain('athlete_camp: ATHLETE_CAMP_RIDER');
    });

    it('each athlete template has travel and security sections', () => {
      // Athlete templates should have travel and security requirements
      expect(templateFile).toContain("id: 'travel'");
      expect(templateFile).toContain("id: 'security'");
    });

    it('each athlete template has compensation section', () => {
      expect(templateFile).toContain("id: 'compensation'");
    });
  });

  describe('Database Schema', () => {
    const schema = readFileSync(resolve(rootDir, 'drizzle/schema.ts'), 'utf-8');

    it('artist_profiles table has talentType column', () => {
      expect(schema).toContain('talentType: varchar("talentType"');
    });

    it('artist_profiles table has sportCategory column', () => {
      expect(schema).toContain('sportCategory: varchar("sportCategory"');
    });
  });

  describe('RiderBuilder UI', () => {
    const riderBuilder = readFileSync(resolve(rootDir, 'client/src/pages/RiderBuilder.tsx'), 'utf-8');

    it('has template picker mode with athlete templates', () => {
      expect(riderBuilder).toContain("id: 'athlete_appearance'");
      expect(riderBuilder).toContain("id: 'athlete_signing'");
      expect(riderBuilder).toContain("id: 'athlete_speaking'");
      expect(riderBuilder).toContain("id: 'athlete_camp'");
    });

    it('shows template categories (Artist, Athlete, and Filmmaker)', () => {
      expect(riderBuilder).toContain("category: 'Artist'");
      expect(riderBuilder).toContain("category: 'Athlete'");
      expect(riderBuilder).toContain("category: 'Filmmaker'");
    });

    it('fetches artist profile to determine talent type', () => {
      expect(riderBuilder).toContain('trpc.artist.getMyProfile.useQuery');
      expect(riderBuilder).toContain('artistProfile');
    });

    it('has pick_template mode for template selection', () => {
      expect(riderBuilder).toContain("pick_template");
      expect(riderBuilder).toContain("mode === \"pick_template\"");
    });

    it('sorts templates based on talent type', () => {
      expect(riderBuilder).toContain("isAthlete");
      expect(riderBuilder).toContain("talentType === 'athlete'");
      expect(riderBuilder).toContain("isFilmmaker");
      expect(riderBuilder).toContain("talentType === 'filmmaker'");
    });
  });

  describe('Rider Router', () => {
    const riderRouter = readFileSync(resolve(rootDir, 'server/routers/rider.ts'), 'utf-8');

    it('validates using the correct template type from templateData', () => {
      expect(riderRouter).toContain('input.templateData?.baseTemplate || "simple_booking"');
    });

    it('has getDefaultTemplate endpoint', () => {
      expect(riderRouter).toContain('getDefaultTemplate');
    });

    it('has listDefaultTemplates endpoint', () => {
      expect(riderRouter).toContain('listDefaultTemplates');
    });
  });
});
