/**
 * Contract Template Library
 * Pre-built templates for different genres and venue types
 */

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: 'genre' | 'venue_type' | 'event_type';
  genre?: string;
  venueType?: string;
  eventType?: string;
  technical: {
    soundSystem: string;
    lightingSystem: string;
    stage: string;
    parking: string;
    loadIn: string;
    soundCheck: string;
    additionalRequirements: string[];
  };
  hospitality: {
    greenRoom: string;
    meals: string;
    dressing: string;
    parking: string;
    accommodations: string;
    additionalRequirements: string[];
  };
  financial: {
    paymentTerms: string;
    cancellationPolicy: string;
    insuranceRequired: boolean;
    additionalTerms: string[];
  };
}

export const GENRE_TEMPLATES: Record<string, ContractTemplate> = {
  rock: {
    id: 'template_rock',
    name: 'Rock Band Rider',
    description: 'Standard rider for rock bands and live rock performances',
    category: 'genre',
    genre: 'rock',
    technical: {
      soundSystem: 'Full PA system with 2x15" subwoofers, 4x12" monitors, wireless microphones',
      lightingSystem: 'Professional stage lighting with color capability, follow spot',
      stage: '20x16 ft stage minimum, 3 ft height, non-slip surface',
      parking: 'Dedicated parking for tour bus and 2 vehicles',
      loadIn: '3 hours before performance',
      soundCheck: '90 minutes before performance',
      additionalRequirements: [
        'Drum riser (4x4 ft)',
        'Guitar amp stands',
        'Bass amp stands',
        'Keyboard stand',
        'Microphone stands (5)',
        'XLR cables (20)',
        'Power distribution',
      ],
    },
    hospitality: {
      greenRoom: 'Private green room with seating for 6, temperature controlled',
      meals: 'Hot catered dinner for 5 people, vegetarian options available',
      dressing: 'Private dressing room with mirror and lighting',
      parking: 'Secure parking for band members',
      accommodations: 'Hotel accommodations for 3 nights (if travel required)',
      additionalRequirements: [
        'Bottled water (2 cases)',
        'Soft drinks (1 case)',
        'Beer (1 case)',
        'Snacks (chips, fruit, nuts)',
        'WiFi access',
      ],
    },
    financial: {
      paymentTerms: '50% deposit upon booking, balance due 7 days before event',
      cancellationPolicy: 'Full refund if cancelled 30 days in advance, 50% if cancelled 14 days in advance',
      insuranceRequired: true,
      additionalTerms: [
        'Payment via bank transfer or check',
        'Invoice provided upon request',
        'Travel expenses reimbursed if over 100 miles',
      ],
    },
  },

  jazz: {
    id: 'template_jazz',
    name: 'Jazz Ensemble Rider',
    description: 'Rider for jazz groups and ensembles',
    category: 'genre',
    genre: 'jazz',
    technical: {
      soundSystem: 'Quality PA system with monitors, wireless microphone for vocals',
      lightingSystem: 'Ambient stage lighting, no harsh spotlights',
      stage: '16x12 ft stage, 2 ft height',
      parking: 'Street parking or lot parking',
      loadIn: '2 hours before performance',
      soundCheck: '60 minutes before performance',
      additionalRequirements: [
        'Drum riser (3x3 ft)',
        'Piano or keyboard (if not provided)',
        'Bass amp stand',
        'Microphone stands (3)',
      ],
    },
    hospitality: {
      greenRoom: 'Comfortable seating area',
      meals: 'Light catered refreshments for 4 people',
      dressing: 'Access to restroom facilities',
      parking: 'Convenient parking',
      accommodations: 'Not required for local performances',
      additionalRequirements: [
        'Water and soft drinks',
        'Coffee/tea service',
        'WiFi access',
      ],
    },
    financial: {
      paymentTerms: '100% payment due upon booking or 50% deposit with balance due day of event',
      cancellationPolicy: 'Full refund if cancelled 14 days in advance',
      insuranceRequired: false,
      additionalTerms: [
        'Payment via check, cash, or transfer',
        'Gratuity appreciated but not required',
      ],
    },
  },

  classical: {
    id: 'template_classical',
    name: 'Classical/Orchestra Rider',
    description: 'Rider for classical musicians and orchestras',
    category: 'genre',
    genre: 'classical',
    technical: {
      soundSystem: 'Minimal amplification, high-quality acoustic support',
      lightingSystem: 'Soft, warm stage lighting',
      stage: '24x20 ft stage for full orchestra, 2 ft height',
      parking: 'Dedicated parking for musicians and equipment',
      loadIn: '4 hours before performance',
      soundCheck: '2 hours before performance',
      additionalRequirements: [
        'Music stands (15+)',
        'Conductor stand',
        'Piano tuning (if applicable)',
        'Acoustic shell (if available)',
      ],
    },
    hospitality: {
      greenRoom: 'Quiet, comfortable green room for musicians',
      meals: 'Pre-performance light meal, post-performance reception',
      dressing: 'Private dressing facilities',
      parking: 'Secure parking',
      accommodations: 'Hotel accommodations for out-of-town musicians',
      additionalRequirements: [
        'Water and refreshments',
        'Quiet space for warm-up',
        'Climate control',
      ],
    },
    financial: {
      paymentTerms: 'Full payment due 2 weeks before performance',
      cancellationPolicy: 'Full refund if cancelled 60 days in advance, 50% if cancelled 30 days in advance',
      insuranceRequired: true,
      additionalTerms: [
        'Payment via check or bank transfer',
        'Travel and accommodation expenses covered',
        'Musician fees per union scale',
      ],
    },
  },

  hiphop: {
    id: 'template_hiphop',
    name: 'Hip-Hop Artist Rider',
    description: 'Rider for hip-hop artists and rappers',
    category: 'genre',
    genre: 'hip-hop',
    technical: {
      soundSystem: 'High-power PA system with subwoofers, in-ear monitors for artist',
      lightingSystem: 'Dynamic stage lighting with color effects',
      stage: '20x16 ft stage, 3 ft height',
      parking: 'Dedicated parking for tour vehicles',
      loadIn: '2 hours before performance',
      soundCheck: '60 minutes before performance',
      additionalRequirements: [
        'DJ booth setup',
        'Turntables or CDJ setup',
        'Microphone stands (2)',
        'Wireless microphone',
        'In-ear monitor system',
      ],
    },
    hospitality: {
      greenRoom: 'Private green room with lounge seating',
      meals: 'Hot catered meal for 4 people',
      dressing: 'Private dressing room',
      parking: 'Secure parking',
      accommodations: 'Hotel accommodations if travel required',
      additionalRequirements: [
        'Bottled water and sports drinks',
        'Snacks',
        'WiFi access',
        'Phone charging stations',
      ],
    },
    financial: {
      paymentTerms: '50% deposit to secure date, balance 3 days before event',
      cancellationPolicy: 'Deposit non-refundable, full refund if cancelled 14 days in advance',
      insuranceRequired: true,
      additionalTerms: [
        'Payment via wire transfer or certified check',
        'Additional fees for late-night performances',
        'Travel expenses reimbursed',
      ],
    },
  },
};

export const VENUE_TYPE_TEMPLATES: Record<string, ContractTemplate> = {
  festival: {
    id: 'template_festival',
    name: 'Music Festival Rider',
    description: 'Rider for outdoor and multi-stage festivals',
    category: 'venue_type',
    venueType: 'festival',
    technical: {
      soundSystem: 'Professional festival-grade PA system with multiple stages',
      lightingSystem: 'Large-scale stage lighting with LED screens',
      stage: '30x20 ft stage, 4 ft height',
      parking: 'Artist parking area with security',
      loadIn: 'Per festival schedule',
      soundCheck: '30 minutes per artist',
      additionalRequirements: [
        'Dedicated stage crew',
        'Technical support staff',
        'Backup power generators',
        'Weather protection',
      ],
    },
    hospitality: {
      greenRoom: 'VIP artist lounge with premium seating',
      meals: 'All-day catering, multiple meal options',
      dressing: 'Private artist tents with facilities',
      parking: 'Premium artist parking',
      accommodations: 'Festival accommodation provided',
      additionalRequirements: [
        'Premium beverages',
        'Gourmet snacks',
        'WiFi access',
        'Security personnel',
        'Medical staff on-site',
      ],
    },
    financial: {
      paymentTerms: 'Per festival agreement',
      cancellationPolicy: 'Per festival terms',
      insuranceRequired: true,
      additionalTerms: [
        'Performance time strictly enforced',
        'Sound check time allocated',
        'Travel and accommodation included',
      ],
    },
  },

  nightclub: {
    id: 'template_nightclub',
    name: 'Nightclub/Bar Rider',
    description: 'Rider for nightclubs, bars, and small venues',
    category: 'venue_type',
    venueType: 'nightclub',
    technical: {
      soundSystem: 'Club-quality PA system with monitors',
      lightingSystem: 'Club lighting and effects',
      stage: '12x10 ft stage or dance floor area',
      parking: 'Street parking or nearby lot',
      loadIn: '1 hour before performance',
      soundCheck: '30 minutes before performance',
      additionalRequirements: [
        'DJ booth access',
        'Microphone and stand',
        'Basic lighting control',
      ],
    },
    hospitality: {
      greenRoom: 'Comfortable lounge area',
      meals: 'Food and beverage service available',
      dressing: 'Access to facilities',
      parking: 'Convenient parking',
      accommodations: 'Not required',
      additionalRequirements: [
        'Complimentary drinks during performance',
        'WiFi access',
      ],
    },
    financial: {
      paymentTerms: '100% payment upon booking or at door',
      cancellationPolicy: 'Full refund if cancelled 7 days in advance',
      insuranceRequired: false,
      additionalTerms: [
        'Payment via cash or card',
        'Tip jar appreciated',
      ],
    },
  },

  theater: {
    id: 'template_theater',
    name: 'Theater/Concert Hall Rider',
    description: 'Rider for theaters and concert halls',
    category: 'venue_type',
    venueType: 'theater',
    technical: {
      soundSystem: 'Professional theater sound system',
      lightingSystem: 'Full theatrical lighting rig',
      stage: 'Full theater stage with wings',
      parking: 'Dedicated artist parking',
      loadIn: '3 hours before performance',
      soundCheck: '2 hours before performance',
      additionalRequirements: [
        'Stage crew provided',
        'Technical director on-site',
        'Backup systems available',
      ],
    },
    hospitality: {
      greenRoom: 'Dedicated green room with amenities',
      meals: 'Catered meal for performers',
      dressing: 'Private dressing rooms',
      parking: 'Secure parking',
      accommodations: 'Hotel accommodations for touring artists',
      additionalRequirements: [
        'Premium refreshments',
        'WiFi access',
        'Phone charging',
      ],
    },
    financial: {
      paymentTerms: 'Full payment 2 weeks before performance',
      cancellationPolicy: 'Full refund if cancelled 30 days in advance',
      insuranceRequired: true,
      additionalTerms: [
        'Payment via check or wire transfer',
        'Travel and accommodation covered',
      ],
    },
  },

  corporate: {
    id: 'template_corporate',
    name: 'Corporate Event Rider',
    description: 'Rider for corporate events and private functions',
    category: 'venue_type',
    venueType: 'corporate',
    technical: {
      soundSystem: 'Professional audio system suitable for speech and music',
      lightingSystem: 'Ambient and accent lighting',
      stage: '16x12 ft stage or performance area',
      parking: 'Dedicated parking',
      loadIn: '2 hours before event',
      soundCheck: '60 minutes before event',
      additionalRequirements: [
        'Microphone for MC/host',
        'Backup audio equipment',
      ],
    },
    hospitality: {
      greenRoom: 'Private waiting area',
      meals: 'Premium catering included',
      dressing: 'Private facilities',
      parking: 'Premium parking',
      accommodations: 'Not required for local events',
      additionalRequirements: [
        'Premium beverages',
        'Gourmet refreshments',
        'WiFi access',
      ],
    },
    financial: {
      paymentTerms: 'Full payment upon booking',
      cancellationPolicy: 'Full refund if cancelled 14 days in advance',
      insuranceRequired: true,
      additionalTerms: [
        'Payment via check or wire transfer',
        'Gratuity included in fee',
        'Exclusive performance (no recording)',
      ],
    },
  },
};

export const EVENT_TYPE_TEMPLATES: Record<string, ContractTemplate> = {
  wedding: {
    id: 'template_wedding',
    name: 'Wedding Entertainment Rider',
    description: 'Rider for wedding ceremonies and receptions',
    category: 'event_type',
    eventType: 'wedding',
    technical: {
      soundSystem: 'Quality audio system for ceremony and reception',
      lightingSystem: 'Ambient and romantic lighting',
      stage: 'Dance floor or performance area',
      parking: 'Guest parking available',
      loadIn: '3 hours before ceremony',
      soundCheck: '2 hours before ceremony',
      additionalRequirements: [
        'Wireless microphone for vows/toasts',
        'Backup power',
      ],
    },
    hospitality: {
      greenRoom: 'Comfortable waiting area',
      meals: 'Dinner included with guests',
      dressing: 'Private facilities',
      parking: 'Convenient parking',
      accommodations: 'Hotel accommodations if travel required',
      additionalRequirements: [
        'Complimentary beverages',
        'Snacks',
        'WiFi access',
      ],
    },
    financial: {
      paymentTerms: '50% deposit to secure date, balance 1 week before wedding',
      cancellationPolicy: 'Deposit non-refundable, full refund if cancelled 60 days in advance',
      insuranceRequired: false,
      additionalTerms: [
        'Payment via check or wire transfer',
        'Travel expenses covered',
        'Overtime rates for extended performances',
      ],
    },
  },

  private_party: {
    id: 'template_private_party',
    name: 'Private Party Rider',
    description: 'Rider for private parties and celebrations',
    category: 'event_type',
    eventType: 'private_party',
    technical: {
      soundSystem: 'Portable PA system',
      lightingSystem: 'Basic lighting setup',
      stage: 'Performance area or corner space',
      parking: 'Street or lot parking',
      loadIn: '1 hour before party',
      soundCheck: '30 minutes before party',
      additionalRequirements: [
        'Microphone for announcements',
        'Power outlets available',
      ],
    },
    hospitality: {
      greenRoom: 'Lounge area',
      meals: 'Food and beverages available',
      dressing: 'Access to facilities',
      parking: 'Convenient parking',
      accommodations: 'Not required',
      additionalRequirements: [
        'Complimentary food and drinks',
        'WiFi access',
      ],
    },
    financial: {
      paymentTerms: '100% payment upon booking',
      cancellationPolicy: 'Full refund if cancelled 14 days in advance',
      insuranceRequired: false,
      additionalTerms: [
        'Payment via cash or card',
        'Tip jar appreciated',
        'Travel expenses reimbursed',
      ],
    },
  },
};

export class ContractTemplateLibrary {
  /**
   * Get all available templates
   */
  static getAllTemplates(): ContractTemplate[] {
    return [
      ...Object.values(GENRE_TEMPLATES),
      ...Object.values(VENUE_TYPE_TEMPLATES),
      ...Object.values(EVENT_TYPE_TEMPLATES),
    ];
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: 'genre' | 'venue_type' | 'event_type'): ContractTemplate[] {
    const allTemplates = this.getAllTemplates();
    return allTemplates.filter((t) => t.category === category);
  }

  /**
   * Get a specific template by ID
   */
  static getTemplateById(id: string): ContractTemplate | undefined {
    return this.getAllTemplates().find((t) => t.id === id);
  }

  /**
   * Search templates by name or description
   */
  static searchTemplates(query: string): ContractTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTemplates().filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get templates for a specific genre
   */
  static getGenreTemplate(genre: string): ContractTemplate | undefined {
    return Object.values(GENRE_TEMPLATES).find((t) => t.genre?.toLowerCase() === genre.toLowerCase());
  }

  /**
   * Get templates for a specific venue type
   */
  static getVenueTypeTemplate(venueType: string): ContractTemplate | undefined {
    return Object.values(VENUE_TYPE_TEMPLATES).find(
      (t) => t.venueType?.toLowerCase() === venueType.toLowerCase()
    );
  }

  /**
   * Get templates for a specific event type
   */
  static getEventTypeTemplate(eventType: string): ContractTemplate | undefined {
    return Object.values(EVENT_TYPE_TEMPLATES).find(
      (t) => t.eventType?.toLowerCase() === eventType.toLowerCase()
    );
  }
}
