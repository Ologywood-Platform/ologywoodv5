/**
 * Profile Completeness Calculator
 * Calculates a percentage score based on which profile fields are filled.
 * Used to encourage artists and venues to complete their profiles for better discovery.
 */

interface ProfileField {
  key: string;
  label: string;
  weight: number; // Higher weight = more important
  check: (profile: any) => boolean;
}

const ARTIST_FIELDS: ProfileField[] = [
  { key: 'artistName', label: 'Stage Name', weight: 3, check: (p) => !!(p.artistName?.trim() || p.stageName?.trim()) },
  { key: 'bio', label: 'Bio', weight: 3, check: (p) => !!p.bio?.trim() && p.bio.trim().length >= 50 },
  { key: 'genre', label: 'Genre', weight: 2, check: (p) => {
    if (!p.genre) return false;
    if (typeof p.genre === 'string') return !!p.genre.trim();
    if (Array.isArray(p.genre)) return p.genre.length > 0;
    return false;
  }},
  { key: 'profilePhotoUrl', label: 'Profile Photo', weight: 3, check: (p) => !!(p.profilePhotoUrl?.trim() || p.profileImage?.trim()) },
  { key: 'performanceVideoUrl', label: 'Performance Video', weight: 2, check: (p) => !!p.performanceVideoUrl?.trim() },
  { key: 'location', label: 'Location', weight: 2, check: (p) => !!p.location?.trim() },
  { key: 'feeRangeMin', label: 'Fee Range', weight: 2, check: (p) => (p.feeRangeMin != null && p.feeRangeMin > 0) || (p.baseFee != null && p.baseFee > 0) },
  { key: 'socialLinks', label: 'Social Media Links', weight: 1, check: (p) => {
    if (!p.socialLinks) return false;
    const links = typeof p.socialLinks === 'string' ? JSON.parse(p.socialLinks) : p.socialLinks;
    return Object.values(links).some((v: any) => !!v?.trim());
  }},
  { key: 'mediaGallery', label: 'Media Gallery', weight: 1, check: (p) => {
    if (!p.mediaGallery) return false;
    const gallery = typeof p.mediaGallery === 'string' ? JSON.parse(p.mediaGallery) : p.mediaGallery;
    return (gallery?.photos?.length > 0) || (gallery?.videos?.length > 0);
  }},
  { key: 'websiteUrl', label: 'Website', weight: 1, check: (p) => !!p.websiteUrl?.trim() },
];

const VENUE_FIELDS: ProfileField[] = [
  { key: 'organizationName', label: 'Venue Name', weight: 3, check: (p) => !!p.organizationName?.trim() || !!p.name?.trim() },
  { key: 'bio', label: 'Description', weight: 3, check: (p) => !!p.bio?.trim() && p.bio.trim().length >= 50 },
  { key: 'venueType', label: 'Venue Type', weight: 2, check: (p) => !!p.venueType?.trim() },
  { key: 'profilePhotoUrl', label: 'Profile Photo', weight: 3, check: (p) => !!p.profilePhotoUrl?.trim() },
  { key: 'location', label: 'Location', weight: 2, check: (p) => !!p.location?.trim() || !!p.address?.trim() },
  { key: 'capacity', label: 'Capacity', weight: 2, check: (p) => p.capacity != null && p.capacity > 0 },
  { key: 'email', label: 'Contact Email', weight: 2, check: (p) => !!p.email?.trim() || !!p.contactEmail?.trim() },
  { key: 'contactPhone', label: 'Contact Phone', weight: 1, check: (p) => !!p.contactPhone?.trim() },
  { key: 'amenities', label: 'Amenities', weight: 1, check: (p) => {
    if (!p.amenities) return false;
    if (typeof p.amenities === 'string') return !!p.amenities.trim();
    if (Array.isArray(p.amenities)) return p.amenities.length > 0;
    if (typeof p.amenities === 'object') return Object.keys(p.amenities).length > 0;
    return false;
  }},
  { key: 'operatingHours', label: 'Operating Hours', weight: 1, check: (p) => !!p.operatingHours?.trim() },
];

export interface CompletenessResult {
  score: number; // 0-100
  totalWeight: number;
  earnedWeight: number;
  completedFields: string[];
  missingFields: { key: string; label: string; weight: number }[];
  tier: 'incomplete' | 'basic' | 'good' | 'excellent';
}

function calculateCompleteness(profile: any, fields: ProfileField[]): CompletenessResult {
  const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0);
  let earnedWeight = 0;
  const completedFields: string[] = [];
  const missingFields: { key: string; label: string; weight: number }[] = [];

  for (const field of fields) {
    try {
      if (field.check(profile)) {
        earnedWeight += field.weight;
        completedFields.push(field.key);
      } else {
        missingFields.push({ key: field.key, label: field.label, weight: field.weight });
      }
    } catch {
      missingFields.push({ key: field.key, label: field.label, weight: field.weight });
    }
  }

  const score = Math.round((earnedWeight / totalWeight) * 100);

  // Sort missing fields by weight (most important first)
  missingFields.sort((a, b) => b.weight - a.weight);

  let tier: CompletenessResult['tier'];
  if (score < 40) tier = 'incomplete';
  else if (score < 65) tier = 'basic';
  else if (score < 85) tier = 'good';
  else tier = 'excellent';

  return { score, totalWeight, earnedWeight, completedFields, missingFields, tier };
}

export function getArtistCompleteness(profile: any): CompletenessResult {
  return calculateCompleteness(profile, ARTIST_FIELDS);
}

export function getVenueCompleteness(profile: any): CompletenessResult {
  return calculateCompleteness(profile, VENUE_FIELDS);
}

/**
 * Minimum score required for a profile to appear in search results.
 * Profiles below this threshold will be hidden from Browse/Search.
 */
export const MINIMUM_SEARCH_VISIBILITY_SCORE = 40;

/**
 * Returns the top N most impactful missing fields to complete next.
 */
export function getNextSteps(result: CompletenessResult, count: number = 3): { key: string; label: string; weight: number }[] {
  return result.missingFields.slice(0, count);
}
