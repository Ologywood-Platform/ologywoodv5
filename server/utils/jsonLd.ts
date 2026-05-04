/**
 * JSON-LD Structured Data Generators
 * Schema.org markup for rich Google search results
 * Used by both server-side OG middleware and client-side React components
 */

const SITE_NAME = 'Ologywood';
const SITE_URL = 'https://www.ologywood.com';
const SITE_LOGO = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/XByJYRufALCMxsjM.jpg';

export interface ArtistJsonLdData {
  id: number;
  artistName: string;
  bio?: string | null;
  genre?: string[] | null;
  location?: string | null;
  profilePhotoUrl?: string | null;
  averageRating?: string | null;
  reviewCount?: number | null;
  performanceRate?: string | null;
}

export interface VenueJsonLdData {
  id: number;
  organizationName: string;
  bio?: string | null;
  location?: string | null;
  profilePhotoUrl?: string | null;
  venueType?: string | null;
  capacity?: number | null;
  averageRating?: string | null;
  reviewCount?: number | null;
}

export interface EventJsonLdData {
  id: number;
  eventTitle: string;
  description?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
  eventEndTime?: string | null;
  location?: string | null;
  eventType?: string | null;
  capacity?: number | null;
  rate?: string | null;
  artistName?: string | null;
}

/**
 * Generate JSON-LD for an artist profile using MusicGroup schema
 */
export function generateArtistJsonLd(artist: ArtistJsonLdData, baseUrl: string = SITE_URL): object {
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: artist.artistName,
    url: `${baseUrl}/artist/${artist.id}`,
  };

  if (artist.bio) {
    jsonLd.description = artist.bio.substring(0, 500);
  }

  if (artist.profilePhotoUrl) {
    jsonLd.image = artist.profilePhotoUrl;
  }

  if (artist.genre && Array.isArray(artist.genre) && artist.genre.length > 0) {
    jsonLd.genre = artist.genre;
  }

  if (artist.location) {
    jsonLd.location = {
      '@type': 'Place',
      name: artist.location,
    };
  }

  if (artist.averageRating && parseFloat(artist.averageRating) > 0 && artist.reviewCount && artist.reviewCount > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: parseFloat(artist.averageRating).toFixed(1),
      bestRating: '5',
      worstRating: '1',
      ratingCount: artist.reviewCount,
    };
  }

  if (artist.performanceRate) {
    jsonLd.makesOffer = {
      '@type': 'Offer',
      description: 'Live Performance Booking',
      price: artist.performanceRate,
      priceCurrency: 'USD',
    };
  }

  jsonLd.memberOf = {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
  };

  return jsonLd;
}

/**
 * Generate JSON-LD for a venue using EventVenue schema
 */
export function generateVenueJsonLd(venue: VenueJsonLdData, baseUrl: string = SITE_URL): object {
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'EventVenue',
    name: venue.organizationName,
    url: `${baseUrl}/venue/${venue.id}`,
  };

  if (venue.bio) {
    jsonLd.description = venue.bio.substring(0, 500);
  }

  if (venue.profilePhotoUrl) {
    jsonLd.image = venue.profilePhotoUrl;
  }

  if (venue.location) {
    jsonLd.address = {
      '@type': 'PostalAddress',
      addressLocality: venue.location,
    };
  }

  if (venue.capacity) {
    jsonLd.maximumAttendeeCapacity = venue.capacity;
  }

  if (venue.venueType) {
    jsonLd.additionalType = venue.venueType;
  }

  if (venue.averageRating && parseFloat(venue.averageRating) > 0 && venue.reviewCount && venue.reviewCount > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: parseFloat(venue.averageRating).toFixed(1),
      bestRating: '5',
      worstRating: '1',
      ratingCount: venue.reviewCount,
    };
  }

  return jsonLd;
}

/**
 * Generate JSON-LD for an event using Event schema
 */
export function generateEventJsonLd(event: EventJsonLdData, baseUrl: string = SITE_URL): object {
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.eventTitle,
    url: `${baseUrl}/events/${event.id}`,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
  };

  if (event.description) {
    jsonLd.description = event.description.substring(0, 500);
  }

  if (event.eventDate) {
    jsonLd.startDate = event.eventDate;
    if (event.eventTime) {
      jsonLd.startDate = `${event.eventDate}T${event.eventTime}`;
    }
  }

  if (event.eventDate && event.eventEndTime) {
    jsonLd.endDate = `${event.eventDate}T${event.eventEndTime}`;
  }

  if (event.location) {
    jsonLd.location = {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.location,
      },
    };
  }

  if (event.artistName) {
    jsonLd.performer = {
      '@type': 'MusicGroup',
      name: event.artistName,
    };
  }

  if (event.rate) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: event.rate,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${baseUrl}/events/${event.id}`,
    };
  }

  if (event.capacity) {
    jsonLd.maximumAttendeeCapacity = event.capacity;
  }

  jsonLd.organizer = {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
  };

  jsonLd.image = SITE_LOGO;

  return jsonLd;
}

/**
 * Generate JSON-LD for the Ologywood organization (homepage)
 */
export function generateOrganizationJsonLd(baseUrl: string = SITE_URL): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: baseUrl,
    logo: SITE_LOGO,
    description: 'Connect with performing artists, manage bookings, and streamline your event planning all in one place.',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${baseUrl}/contact`,
    },
  };
}

/**
 * Generate JSON-LD for the website (homepage)
 */
export function generateWebSiteJsonLd(baseUrl: string = SITE_URL): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/browse?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate JSON-LD for a BreadcrumbList
 * @param items Array of breadcrumb items with name and url
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbJsonLd(items: BreadcrumbItem[], baseUrl: string = SITE_URL): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}

/**
 * Generate JSON-LD for a FAQPage
 * @param faqs Array of question/answer pairs
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export function generateFaqPageJsonLd(faqs: FaqItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Serialize JSON-LD to a script tag string for HTML injection
 */
export function jsonLdToScriptTag(jsonLd: object | object[]): string {
  const data = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
  return data
    .map(item => `<script type="application/ld+json">${JSON.stringify(item)}</script>`)
    .join('\n  ');
}
