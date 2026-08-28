import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  TALENT_TYPE_OPTIONS,
  TALENT_TYPE_VALUES,
  VISUAL_ART_DISCIPLINES,
  getTalentTypeLabel,
  getTalentTypePluralLabel,
} from '../shared/talentTypes';

const root = resolve(process.cwd());
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

describe('Visual Artist profile type', () => {
  it('defines one shared Visual Artist identity without conflating it with event categories', () => {
    expect(TALENT_TYPE_VALUES).toContain('visual_artist');
    expect(TALENT_TYPE_VALUES).not.toContain('arts_culture');
    expect(TALENT_TYPE_OPTIONS).toContainEqual({
      value: 'visual_artist',
      label: 'Visual Artist',
      pluralLabel: 'Visual Artists',
      description: 'Illustration, Fine Art & Design',
    });
    expect(getTalentTypeLabel('visual_artist')).toBe('Visual Artist');
    expect(getTalentTypePluralLabel('visual_artist')).toBe('Visual Artists');
  });

  it('provides relevant visual-art disciplines for onboarding, editing, and filtering', () => {
    expect(VISUAL_ART_DISCIPLINES).toEqual(expect.arrayContaining([
      'Illustration',
      'Painting',
      'Graphic Design',
      'Comics & Sequential Art',
      'Digital Art',
      'Sculpture',
    ]));
  });

  it('accepts only shared talent values in profile creation and editing', () => {
    const router = read('server/routers.ts');
    expect(router).toContain("import { TALENT_TYPE_VALUES } from '../shared/talentTypes'");
    expect(router.match(/talentType: z\.enum\(TALENT_TYPE_VALUES\)\.optional\(\)/g)).toHaveLength(2);
  });

  it('offers Visual Artist with creator-appropriate onboarding and edit copy', () => {
    const onboarding = read('client/src/pages/ArtistOnboarding.tsx');
    const editing = read('client/src/pages/ArtistEditProfile.tsx');

    expect(onboarding).toContain('TALENT_TYPE_OPTIONS.map');
    expect(onboarding).toContain("talentType === 'visual_artist'");
    expect(onboarding).toContain("'Artist / Studio Name'");
    expect(onboarding).toContain("'Creative Practice'");
    expect(onboarding).toContain("'Disciplines'");
    expect(editing).toContain('TALENT_TYPE_OPTIONS.map');
    expect(editing).toContain('VISUAL_ART_DISCIPLINES');
    expect(editing).toContain("'Artist / Studio Name'");
  });

  it('makes Visual Artists filterable and clearly labeled in discovery and profiles', () => {
    const browse = read('client/src/pages/Browse.tsx');
    const filters = read('client/src/components/SearchFilters.tsx');
    const profile = read('client/src/pages/ArtistProfile.tsx');
    const portfolio = read('client/src/components/VideoPortfolioManager.tsx');

    expect(browse).toContain('TALENT_TYPE_OPTIONS.map');
    expect(browse).toContain("talentTypeFilter === 'visual_artist'");
    expect(filters).toContain("talentType === 'visual_artist'");
    expect(filters).toContain('VISUAL_ART_DISCIPLINES');
    expect(profile).toContain('getTalentTypeLabel');
    expect(profile).toContain("talentType === 'visual_artist'");
    expect(portfolio).toContain('VISUAL_ART_VIDEO_CATEGORIES');
    expect(portfolio).toContain("label: 'Creative Process'");
  });

  it('explains that Visual Artist is a profile identity and Arts & Culture is an event category', () => {
    const help = read('client/src/pages/Help.tsx');
    const aiChat = read('server/routers/aiChat.ts');
    const onboardingTour = read('client/src/components/OnboardingTour.tsx');

    expect(help).toContain('Choose Visual Artist as your profile type');
    expect(help).toContain('choose Arts & Culture as the event category');
    expect(aiChat).toContain('- Visual Artist: Illustration, Fine Art & Design');
    expect(onboardingTour).toContain('VISUAL_ARTIST_TOUR_STEPS');
    expect(onboardingTour).toContain("profile.talentType === 'visual_artist'");
    expect(onboardingTour).toContain('Promote Arts & Culture Events');
    expect(onboardingTour).toContain('Sell artwork or merchandise through OlogyWood or an external store');
  });
});
