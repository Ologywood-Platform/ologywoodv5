/**
 * Profile Completion Scoring System
 * Calculates venue profile completion percentage based on filled fields
 */

import { VenueProfile } from '@/drizzle/schema';

export interface ProfileCompletionBreakdown {
  basicInfo: number; // organizationName, contactName, location
  contact: number; // email, contactPhone
  website: number; // website URL
  directoryListing: number; // venueType, capacity, amenities, bio
  photos: number; // profilePhotoUrl
  total: number; // Overall score 0-100
  completedFields: string[];
  missingFields: string[];
}

/**
 * Calculate profile completion score
 * Returns a score from 0-100 based on how many fields are filled
 */
export function calculateProfileCompletion(profile: VenueProfile): ProfileCompletionBreakdown {
  const completedFields: string[] = [];
  const missingFields: string[] = [];

  // Basic Info (25 points total)
  let basicInfoScore = 0;
  if (profile.organizationName) {
    basicInfoScore += 10;
    completedFields.push('Organization Name');
  } else {
    missingFields.push('Organization Name');
  }
  if (profile.contactName) {
    basicInfoScore += 8;
    completedFields.push('Contact Name');
  } else {
    missingFields.push('Contact Name');
  }
  if (profile.location) {
    basicInfoScore += 7;
    completedFields.push('Location');
  } else {
    missingFields.push('Location');
  }

  // Contact Info (15 points total)
  let contactScore = 0;
  if (profile.email) {
    contactScore += 8;
    completedFields.push('Email Address');
  } else {
    missingFields.push('Email Address');
  }
  if (profile.contactPhone) {
    contactScore += 7;
    completedFields.push('Phone Number');
  } else {
    missingFields.push('Phone Number');
  }

  // Website (10 points)
  let websiteScore = 0;
  if (profile.website) {
    websiteScore = 10;
    completedFields.push('Website URL');
  } else {
    missingFields.push('Website URL');
  }

  // Directory Listing (30 points total)
  let directoryScore = 0;
  if (profile.venueType) {
    directoryScore += 10;
    completedFields.push('Venue Type');
  } else {
    missingFields.push('Venue Type');
  }
  if (profile.capacity) {
    directoryScore += 8;
    completedFields.push('Venue Capacity');
  } else {
    missingFields.push('Venue Capacity');
  }
  if (profile.amenities && profile.amenities.length > 0) {
    directoryScore += 7;
    completedFields.push('Amenities');
  } else {
    missingFields.push('Amenities');
  }
  if (profile.bio) {
    directoryScore += 5;
    completedFields.push('Venue Description');
  } else {
    missingFields.push('Venue Description');
  }

  // Photos (20 points)
  let photosScore = 0;
  if (profile.profilePhotoUrl) {
    photosScore = 20;
    completedFields.push('Profile Photo');
  } else {
    missingFields.push('Profile Photo');
  }

  // Calculate total
  const basicInfo = Math.min(basicInfoScore, 25);
  const contact = Math.min(contactScore, 15);
  const website = Math.min(websiteScore, 10);
  const directoryListing = Math.min(directoryScore, 30);
  const photos = Math.min(photosScore, 20);

  const total = basicInfo + contact + website + directoryListing + photos;

  return {
    basicInfo,
    contact,
    website,
    directoryListing,
    photos,
    total,
    completedFields,
    missingFields,
  };
}

/**
 * Get profile completion recommendations
 * Returns actionable suggestions to improve profile score
 */
export function getProfileCompletionRecommendations(
  breakdown: ProfileCompletionBreakdown
): string[] {
  const recommendations: string[] = [];

  if (breakdown.total === 100) {
    return ['Your profile is complete! Keep it updated to attract more artists.'];
  }

  // Prioritize recommendations by impact
  if (breakdown.missingFields.includes('Profile Photo')) {
    recommendations.push(
      '📸 Add a high-quality photo of your venue to increase visibility by 20%'
    );
  }

  if (breakdown.missingFields.includes('Venue Type')) {
    recommendations.push(
      '🏢 Select your venue type to help artists find the right fit'
    );
  }

  if (breakdown.missingFields.includes('Venue Capacity')) {
    recommendations.push(
      '👥 Enter your venue capacity so artists can plan their performances'
    );
  }

  if (breakdown.missingFields.includes('Amenities')) {
    recommendations.push(
      '⚡ Select your amenities (PA System, Stage, Lighting, etc.) to attract more inquiries'
    );
  }

  if (breakdown.missingFields.includes('Venue Description')) {
    recommendations.push(
      '✍️ Write a compelling description of your venue to showcase its unique atmosphere'
    );
  }

  if (breakdown.missingFields.includes('Website URL')) {
    recommendations.push(
      '🌐 Add your website URL so artists can learn more about your venue'
    );
  }

  if (breakdown.missingFields.includes('Email Address')) {
    recommendations.push(
      '📧 Add your email address so artists can reach you directly'
    );
  }

  if (breakdown.missingFields.includes('Phone Number')) {
    recommendations.push(
      '📞 Add your phone number for quick artist inquiries'
    );
  }

  if (breakdown.missingFields.includes('Contact Name')) {
    recommendations.push(
      '👤 Add your contact name to personalize your venue profile'
    );
  }

  return recommendations;
}

/**
 * Get profile completion level description
 */
export function getProfileCompletionLevel(score: number): string {
  if (score === 100) return 'Complete';
  if (score >= 80) return 'Nearly Complete';
  if (score >= 60) return 'Good Progress';
  if (score >= 40) return 'Partially Complete';
  if (score >= 20) return 'Just Started';
  return 'Incomplete';
}

/**
 * Get profile completion color for UI
 */
export function getProfileCompletionColor(score: number): string {
  if (score === 100) return 'bg-green-500';
  if (score >= 80) return 'bg-green-400';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}
