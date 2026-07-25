/**
 * Shared location data for structured venue location fields.
 */

export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
] as const;

export type USStateCode = typeof US_STATES[number]['code'];

/**
 * US Regions - groups states into searchable regions for promoters.
 */
export const US_REGIONS = [
  { code: 'southeast', name: 'Southeast', states: ['AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'] },
  { code: 'northeast', name: 'Northeast', states: ['CT', 'DE', 'DC', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'] },
  { code: 'midwest', name: 'Midwest', states: ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'] },
  { code: 'southwest', name: 'Southwest', states: ['AZ', 'NM', 'OK', 'TX'] },
  { code: 'west', name: 'West', states: ['AK', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY'] },
] as const;

export type USRegionCode = typeof US_REGIONS[number]['code'];

/**
 * Get the region for a given state code.
 */
export function getRegionForState(stateCode: string): string | null {
  for (const region of US_REGIONS) {
    if ((region.states as readonly string[]).includes(stateCode)) return region.code;
  }
  return null;
}

/**
 * Get all state codes for a given region.
 */
export function getStatesForRegion(regionCode: string): string[] {
  const region = US_REGIONS.find(r => r.code === regionCode);
  return region ? [...region.states] : [];
}

/**
 * Get state name from code.
 */
export function getStateName(code: string): string {
  const state = US_STATES.find(s => s.code === code);
  return state ? state.name : code;
}

/**
 * Format a structured location into a display string.
 */
export function formatLocation(city?: string | null, state?: string | null, country?: string | null): string {
  const parts: string[] = [];
  if (city) parts.push(city);
  if (state) {
    // Show state name if it's a code
    const stateName = getStateName(state);
    parts.push(stateName);
  }
  if (country && country !== 'US') parts.push(country);
  return parts.join(', ');
}
