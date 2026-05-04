import { useEffect } from 'react';

interface JsonLdProps {
  data: object | object[];
  id?: string;
}

/**
 * Injects JSON-LD structured data into the document head.
 * Automatically cleans up when the component unmounts or data changes.
 */
export function JsonLd({ data, id }: JsonLdProps) {
  useEffect(() => {
    const items = Array.isArray(data) ? data : [data];
    const scripts: HTMLScriptElement[] = [];

    items.forEach((item, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(item);
      if (id) {
        script.id = `jsonld-${id}-${index}`;
      }
      document.head.appendChild(script);
      scripts.push(script);
    });

    return () => {
      scripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [data, id]);

  return null;
}

/**
 * Client-side JSON-LD generators matching the server-side utils/jsonLd.ts
 */

const SITE_NAME = 'Ologywood';
const SITE_LOGO = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/yZNBAlaBsVCCLvfC.jpg';

function getSiteUrl(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'https://www.ologywood.com';
}

export function buildArtistJsonLd(artist: {
  id: number;
  artistName: string;
  bio?: string | null;
  genre?: string[] | any | null;
  location?: string | null;
  profilePhotoUrl?: string | null;
  averageRating?: string | number | null;
  reviewCount?: number | null;
}): object {
  const baseUrl = getSiteUrl();
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: artist.artistName,
    url: `${baseUrl}/artist/${artist.id}`,
  };

  if (artist.bio) jsonLd.description = artist.bio.substring(0, 500);
  if (artist.profilePhotoUrl) jsonLd.image = artist.profilePhotoUrl;

  const genres = Array.isArray(artist.genre) ? artist.genre : [];
  if (genres.length > 0) jsonLd.genre = genres;

  if (artist.location) {
    jsonLd.location = { '@type': 'Place', name: artist.location };
  }

  const rating = artist.averageRating ? parseFloat(String(artist.averageRating)) : 0;
  if (rating > 0 && artist.reviewCount && artist.reviewCount > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.toFixed(1),
      bestRating: '5',
      worstRating: '1',
      ratingCount: artist.reviewCount,
    };
  }

  jsonLd.memberOf = { '@type': 'Organization', name: SITE_NAME, url: baseUrl };
  return jsonLd;
}

export function buildMusicRecordingJsonLd(release: {
  id: number;
  title: string;
  artistName: string;
  artistId: number;
  genre?: string | null;
  description?: string | null;
  coverArtUrl?: string | null;
  priceInCents: number;
  currency?: string;
  durationSeconds: number;
  publishedAt?: string | Date | null;
}): object {
  const baseUrl = getSiteUrl();
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: release.title,
    url: `${baseUrl}/artist/${release.artistId}`,
    byArtist: {
      '@type': 'MusicGroup',
      name: release.artistName,
      url: `${baseUrl}/artist/${release.artistId}`,
    },
    duration: `PT${Math.floor(release.durationSeconds / 60)}M${release.durationSeconds % 60}S`,
  };

  if (release.description) jsonLd.description = release.description.substring(0, 500);
  if (release.coverArtUrl) jsonLd.image = release.coverArtUrl;
  if (release.genre) jsonLd.genre = release.genre;

  if (release.publishedAt) {
    jsonLd.datePublished = new Date(release.publishedAt).toISOString().split('T')[0];
  }

  // Add Offer for the purchase price
  const price = (release.priceInCents / 100).toFixed(2);
  jsonLd.offers = {
    '@type': 'Offer',
    price,
    priceCurrency: (release.currency || 'usd').toUpperCase(),
    availability: 'https://schema.org/InStock',
    seller: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: baseUrl,
    },
  };

  // inAlbum not applicable — singles only
  jsonLd.isrcCode = undefined; // Not available yet

  return jsonLd;
}

export function buildVenueJsonLd(venue: {
  id: number;
  organizationName: string;
  bio?: string | null;
  location?: string | null;
  profilePhotoUrl?: string | null;
  venueType?: string | null;
  capacity?: number | null;
  averageRating?: string | number | null;
  reviewCount?: number | null;
}): object {
  const baseUrl = getSiteUrl();
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'EventVenue',
    name: venue.organizationName,
    url: `${baseUrl}/venue/${venue.id}`,
  };

  if (venue.bio) jsonLd.description = venue.bio.substring(0, 500);
  if (venue.profilePhotoUrl) jsonLd.image = venue.profilePhotoUrl;
  if (venue.location) {
    jsonLd.address = { '@type': 'PostalAddress', addressLocality: venue.location };
  }
  if (venue.capacity) jsonLd.maximumAttendeeCapacity = venue.capacity;
  if (venue.venueType) jsonLd.additionalType = venue.venueType;

  const rating = venue.averageRating ? parseFloat(String(venue.averageRating)) : 0;
  if (rating > 0 && venue.reviewCount && venue.reviewCount > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.toFixed(1),
      bestRating: '5',
      worstRating: '1',
      ratingCount: venue.reviewCount,
    };
  }

  return jsonLd;
}

export function buildEventJsonLd(event: {
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
}): object {
  const baseUrl = getSiteUrl();
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.eventTitle,
    url: `${baseUrl}/events/${event.id}`,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
  };

  if (event.description) jsonLd.description = event.description.substring(0, 500);

  if (event.eventDate) {
    jsonLd.startDate = event.eventTime ? `${event.eventDate}T${event.eventTime}` : event.eventDate;
  }
  if (event.eventDate && event.eventEndTime) {
    jsonLd.endDate = `${event.eventDate}T${event.eventEndTime}`;
  }

  if (event.location) {
    jsonLd.location = {
      '@type': 'Place',
      name: event.location,
      address: { '@type': 'PostalAddress', addressLocality: event.location },
    };
  }

  if (event.artistName) {
    jsonLd.performer = { '@type': 'MusicGroup', name: event.artistName };
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

  if (event.capacity) jsonLd.maximumAttendeeCapacity = event.capacity;
  jsonLd.organizer = { '@type': 'Organization', name: SITE_NAME, url: baseUrl };
  jsonLd.image = SITE_LOGO;

  return jsonLd;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): object {
  const baseUrl = getSiteUrl();
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

export interface FaqItem {
  question: string;
  answer: string;
}

export function buildFaqPageJsonLd(faqs: FaqItem[]): object {
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

export function buildHomepageJsonLd(): object[] {
  const baseUrl = getSiteUrl();
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: baseUrl,
      logo: SITE_LOGO,
      description: 'Connect with performing artists, manage bookings, and streamline your event planning all in one place.',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        url: `${baseUrl}/contact`,
      },
    },
    {
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
    },
  ];
}
