/**
 * Rider Contract Template Definitions
 * Pre-built templates for different artist types on Ologywood
 */

export interface RiderSection {
  id: string;
  title: string;
  icon: string;
  fields: RiderField[];
}

export interface RiderField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'date' | 'time';
  placeholder?: string;
  defaultValue?: string | number | boolean;
  required?: boolean;
  options?: string[];
  description?: string;
  unit?: string;
}

export interface RiderContractTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  sections: RiderSection[];
  editableFields: string[];
  requiredFields: string[];
}

// ============= SHARED SECTIONS =============

const COMMON_EVENT_SECTION: RiderSection = {
  id: 'event_details',
  title: 'Event Details',
  icon: 'calendar',
  fields: [
    { id: 'event_name', label: 'Event Name', type: 'text', required: true, placeholder: 'e.g., Summer Music Festival 2026' },
    { id: 'event_date', label: 'Event Date', type: 'date', required: true },
    { id: 'event_time', label: 'Performance Start Time', type: 'time', required: true },
    { id: 'venue_name', label: 'Venue Name', type: 'text', required: true, placeholder: 'e.g., The Grand Theater' },
    { id: 'venue_address', label: 'Venue Address', type: 'textarea', placeholder: 'Full street address including city, state, zip' },
    { id: 'venue_capacity', label: 'Venue Capacity', type: 'number', placeholder: '500', description: 'Expected audience size' },
  ],
};

const COMMON_CONTACT_SECTION: RiderSection = {
  id: 'contact_info',
  title: 'Contact Information',
  icon: 'phone',
  fields: [
    { id: 'artist_contact_name', label: 'Artist/Manager Contact', type: 'text', required: true, placeholder: 'Primary contact name' },
    { id: 'artist_contact_phone', label: 'Contact Phone', type: 'text', required: true, placeholder: '+1 (555) 123-4567' },
    { id: 'artist_contact_email', label: 'Contact Email', type: 'text', required: true, placeholder: 'booking@example.com' },
    { id: 'venue_contact_name', label: 'Venue Contact Person', type: 'text', placeholder: 'Venue manager or event coordinator' },
    { id: 'venue_contact_phone', label: 'Venue Contact Phone', type: 'text', placeholder: '+1 (555) 987-6543' },
  ],
};

const COMMON_PAYMENT_SECTION: RiderSection = {
  id: 'payment_terms',
  title: 'Payment & Financial Terms',
  icon: 'dollar-sign',
  fields: [
    { id: 'performance_fee', label: 'Performance Fee', type: 'number', required: true, placeholder: '5000', unit: 'USD', description: 'Total agreed performance fee' },
    { id: 'deposit_percentage', label: 'Deposit Required', type: 'select', defaultValue: '50%', options: ['25%', '50%', '75%', '100% upfront'], description: 'Percentage of fee required as deposit to confirm booking' },
    { id: 'deposit_due_date', label: 'Deposit Due', type: 'select', defaultValue: 'Upon signing', options: ['Upon signing', '7 days after signing', '14 days after signing', '30 days before event'] },
    { id: 'balance_due_date', label: 'Balance Due', type: 'select', defaultValue: '7 days before event', options: ['Day of event', '7 days before event', '14 days before event', '30 days before event'] },
    { id: 'payment_method', label: 'Accepted Payment Methods', type: 'select', defaultValue: 'Stripe (via Ologywood)', options: ['Stripe (via Ologywood)', 'Bank transfer', 'Check', 'Any method'] },
    { id: 'cancellation_policy', label: 'Cancellation Policy', type: 'textarea', defaultValue: 'Full refund if cancelled 30+ days before event. 50% refund if cancelled 14-29 days before. No refund within 14 days of event. Force majeure events exempt.', description: 'Define refund terms for cancellations' },
    { id: 'travel_expenses', label: 'Travel Expense Coverage', type: 'textarea', placeholder: 'e.g., Mileage at $0.67/mile for distances over 50 miles, or flights for 200+ miles', description: 'Specify who covers travel costs' },
  ],
};

// ============= SOLO ARTIST RIDER =============

export const SOLO_ARTIST_RIDER: RiderContractTemplate = {
  id: 'solo_artist',
  title: 'Solo Artist Rider',
  description: 'Streamlined rider for solo performers, singer-songwriters, and acoustic acts. Covers essential technical needs and basic hospitality.',
  icon: 'mic',
  category: 'Solo',
  sections: [
    COMMON_EVENT_SECTION,
    {
      id: 'artist_info',
      title: 'Artist Information',
      icon: 'user',
      fields: [
        { id: 'artist_name', label: 'Artist/Stage Name', type: 'text', required: true, placeholder: 'Your performing name' },
        { id: 'genre', label: 'Genre(s)', type: 'text', required: true, placeholder: 'e.g., Acoustic, Folk, R&B' },
        { id: 'performance_duration', label: 'Set Duration', type: 'number', required: true, defaultValue: 60, unit: 'minutes' },
        { id: 'num_sets', label: 'Number of Sets', type: 'select', defaultValue: '1', options: ['1', '2', '3'] },
        { id: 'set_break_duration', label: 'Break Between Sets', type: 'number', defaultValue: 15, unit: 'minutes' },
      ],
    },
    {
      id: 'technical_requirements',
      title: 'Technical Requirements',
      icon: 'settings',
      fields: [
        { id: 'sound_system', label: 'PA System', type: 'select', defaultValue: 'Venue provides full PA', options: ['Venue provides full PA', 'Artist brings own PA', 'Shared system', 'Acoustic (no PA needed)'] },
        { id: 'microphones', label: 'Microphones Needed', type: 'textarea', defaultValue: '1x vocal microphone (SM58 or equivalent) with boom stand', placeholder: 'List all microphone requirements' },
        { id: 'monitors', label: 'Stage Monitors', type: 'textarea', defaultValue: '1x floor wedge monitor with separate mix', placeholder: 'Monitor requirements' },
        { id: 'di_boxes', label: 'DI Boxes Required', type: 'number', defaultValue: 1, description: 'For acoustic instruments' },
        { id: 'power_outlets', label: 'Power Outlets Needed', type: 'number', defaultValue: 2, description: 'On or near stage' },
        { id: 'lighting', label: 'Lighting Requirements', type: 'textarea', defaultValue: 'Basic stage wash lighting. No strobe effects.', placeholder: 'Describe lighting needs' },
        { id: 'soundcheck_duration', label: 'Soundcheck Duration', type: 'number', defaultValue: 30, unit: 'minutes' },
        { id: 'load_in_time', label: 'Load-In Time Before Show', type: 'number', defaultValue: 2, unit: 'hours' },
      ],
    },
    {
      id: 'stage_setup',
      title: 'Stage Setup',
      icon: 'layout',
      fields: [
        { id: 'stage_size_min', label: 'Minimum Stage Area', type: 'text', defaultValue: '8 x 8 ft', placeholder: 'Width x Depth' },
        { id: 'stage_surface', label: 'Stage Surface', type: 'select', defaultValue: 'Any flat, stable surface', options: ['Any flat, stable surface', 'Hardwood preferred', 'Carpeted', 'No preference'] },
        { id: 'stool_required', label: 'Stool/Chair Required', type: 'checkbox', defaultValue: true },
        { id: 'music_stand', label: 'Music Stand Required', type: 'checkbox', defaultValue: false },
        { id: 'small_table', label: 'Small Side Table', type: 'checkbox', defaultValue: true, description: 'For water, setlist, etc.' },
        { id: 'stage_plot_notes', label: 'Stage Plot Notes', type: 'textarea', placeholder: 'Additional stage setup instructions or diagram description' },
      ],
    },
    {
      id: 'hospitality',
      title: 'Hospitality',
      icon: 'coffee',
      fields: [
        { id: 'green_room', label: 'Green Room / Private Space', type: 'select', defaultValue: 'Private room preferred', options: ['Private room required', 'Private room preferred', 'Shared space acceptable', 'Not needed'] },
        { id: 'meals', label: 'Meal Requirements', type: 'textarea', defaultValue: '1 hot meal before or after performance', placeholder: 'Specify meal needs and dietary restrictions' },
        { id: 'beverages', label: 'Beverages', type: 'textarea', defaultValue: 'Bottled water (room temperature), hot tea with honey', placeholder: 'List beverage requirements' },
        { id: 'dietary_restrictions', label: 'Dietary Restrictions', type: 'text', placeholder: 'e.g., Vegetarian, Gluten-free, Nut allergy' },
        { id: 'parking', label: 'Parking', type: 'select', defaultValue: '1 dedicated parking spot near load-in', options: ['1 dedicated parking spot near load-in', '2 parking spots', 'Street parking acceptable', 'Not needed'] },
        { id: 'wifi_required', label: 'WiFi Access Required', type: 'checkbox', defaultValue: true },
        { id: 'towels', label: 'Towels Provided', type: 'checkbox', defaultValue: true },
      ],
    },
    COMMON_PAYMENT_SECTION,
    {
      id: 'additional_terms',
      title: 'Additional Terms',
      icon: 'file-text',
      fields: [
        { id: 'merch_sales', label: 'Merchandise Sales', type: 'textarea', defaultValue: 'Artist retains 100% of merchandise revenue. Venue provides table and adequate lighting near exit.', description: 'Terms for selling merchandise at venue' },
        { id: 'recording_policy', label: 'Recording & Photography', type: 'select', defaultValue: 'No professional recording without written permission', options: ['No recording allowed', 'No professional recording without written permission', 'Recording allowed with credit', 'Full recording rights granted'] },
        { id: 'promotion', label: 'Promotional Requirements', type: 'textarea', placeholder: 'e.g., Social media posts, poster display, newsletter mention' },
        { id: 'special_requests', label: 'Special Requests', type: 'textarea', placeholder: 'Any other requirements or notes' },
      ],
    },
    COMMON_CONTACT_SECTION,
  ],
  editableFields: ['sound_system', 'microphones', 'monitors', 'lighting', 'green_room', 'meals', 'beverages', 'parking', 'performance_fee', 'cancellation_policy', 'merch_sales', 'recording_policy'],
  requiredFields: ['event_name', 'event_date', 'event_time', 'venue_name', 'artist_name', 'genre', 'performance_duration', 'performance_fee', 'artist_contact_name', 'artist_contact_phone', 'artist_contact_email'],
};

// ============= BAND RIDER =============

export const BAND_RIDER: RiderContractTemplate = {
  id: 'band',
  title: 'Band / Ensemble Rider',
  description: 'Comprehensive rider for full bands and ensembles. Includes detailed backline, input list, and expanded hospitality for multiple members.',
  icon: 'users',
  category: 'Band',
  sections: [
    COMMON_EVENT_SECTION,
    {
      id: 'band_info',
      title: 'Band Information',
      icon: 'users',
      fields: [
        { id: 'artist_name', label: 'Band Name', type: 'text', required: true, placeholder: 'Your band name' },
        { id: 'genre', label: 'Genre(s)', type: 'text', required: true, placeholder: 'e.g., Rock, Funk, Jazz' },
        { id: 'band_members', label: 'Number of Band Members', type: 'number', required: true, defaultValue: 5, description: 'Total performers on stage' },
        { id: 'crew_members', label: 'Crew/Roadies', type: 'number', defaultValue: 1, description: 'Non-performing support staff' },
        { id: 'performance_duration', label: 'Set Duration', type: 'number', required: true, defaultValue: 90, unit: 'minutes' },
        { id: 'num_sets', label: 'Number of Sets', type: 'select', defaultValue: '2', options: ['1', '2', '3'] },
        { id: 'set_break_duration', label: 'Break Between Sets', type: 'number', defaultValue: 20, unit: 'minutes' },
      ],
    },
    {
      id: 'technical_requirements',
      title: 'Technical & Sound Requirements',
      icon: 'settings',
      fields: [
        { id: 'pa_system', label: 'PA System Requirements', type: 'textarea', defaultValue: 'Full FOH PA system capable of covering venue capacity. Minimum 2000W. Separate monitor system required.', placeholder: 'Describe PA system needs' },
        { id: 'mixing_console', label: 'Mixing Console', type: 'textarea', defaultValue: 'Minimum 24-channel mixing desk (digital preferred). Separate monitor desk or aux sends from FOH.', placeholder: 'Console requirements' },
        { id: 'microphones', label: 'Microphone Requirements', type: 'textarea', defaultValue: '3x SM58 (vocals)\n2x SM57 (guitar amps)\n1x Beta 52A (kick drum)\n2x SM81 (overheads)\n3x e604 (toms/snare)', placeholder: 'List all microphones needed' },
        { id: 'monitors', label: 'Stage Monitors', type: 'textarea', defaultValue: '5x floor wedge monitors with individual mixes\n1x drum fill monitor\nSide fills if stage width exceeds 30ft', placeholder: 'Monitor requirements per position' },
        { id: 'di_boxes', label: 'DI Boxes', type: 'number', defaultValue: 4, description: 'Active DI boxes preferred' },
        { id: 'lighting', label: 'Lighting Requirements', type: 'textarea', defaultValue: 'Full stage wash with color capability. Front spots for vocalists. Back lighting for atmosphere. Lighting operator required for shows over 200 capacity.', placeholder: 'Lighting specifications' },
        { id: 'soundcheck_duration', label: 'Soundcheck Duration', type: 'number', defaultValue: 60, unit: 'minutes' },
        { id: 'load_in_time', label: 'Load-In Time Before Show', type: 'number', defaultValue: 4, unit: 'hours' },
        { id: 'sound_engineer', label: 'Sound Engineer', type: 'select', defaultValue: 'Band provides own FOH engineer', options: ['Band provides own FOH engineer', 'Venue provides FOH engineer', 'Band provides both FOH and monitor engineers', 'No preference'] },
      ],
    },
    {
      id: 'stage_setup',
      title: 'Stage Setup & Backline',
      icon: 'layout',
      fields: [
        { id: 'stage_size_min', label: 'Minimum Stage Size', type: 'text', defaultValue: '24 x 16 ft', placeholder: 'Width x Depth' },
        { id: 'stage_height', label: 'Stage Height', type: 'text', defaultValue: '3-4 ft preferred', placeholder: 'Height requirement' },
        { id: 'drum_riser', label: 'Drum Riser Required', type: 'checkbox', defaultValue: true, description: 'Minimum 8x8 ft, 1ft elevated' },
        { id: 'backline_provided', label: 'Backline Provided by Venue', type: 'textarea', defaultValue: 'Full drum kit (5-piece with hardware and cymbals)\n2x guitar amplifiers (tube preferred)\n1x bass amplifier\nKeyboard stand', placeholder: 'List all backline equipment venue must provide' },
        { id: 'backline_artist', label: 'Backline Provided by Artist', type: 'textarea', placeholder: 'List equipment the band will bring', defaultValue: 'All guitars, basses, and pedal boards\nDrum cymbals and snare drum\nKeyboards' },
        { id: 'power_requirements', label: 'Power Requirements', type: 'textarea', defaultValue: '6x grounded power outlets on stage\n2x power strips\nDedicated circuit for backline (20A minimum)', placeholder: 'Electrical needs' },
        { id: 'stage_plot_notes', label: 'Stage Plot Notes', type: 'textarea', placeholder: 'Describe stage layout or reference attached stage plot diagram' },
      ],
    },
    {
      id: 'hospitality',
      title: 'Hospitality & Accommodations',
      icon: 'coffee',
      fields: [
        { id: 'green_room', label: 'Green Room', type: 'textarea', defaultValue: 'Private room with seating for 6, mirror, adequate lighting, and climate control. Must be lockable.', placeholder: 'Green room requirements' },
        { id: 'meals', label: 'Meal Requirements', type: 'textarea', defaultValue: 'Hot catered dinner for 6 people (5 band + 1 crew). Served minimum 2 hours before performance. Include vegetarian option.', placeholder: 'Specify meals for all members' },
        { id: 'beverages', label: 'Beverages', type: 'textarea', defaultValue: '12x bottled water (room temp)\n6x assorted soft drinks\n1x case of beer (domestic)\nHot coffee and tea service', placeholder: 'List all beverage requirements' },
        { id: 'dietary_restrictions', label: 'Dietary Restrictions', type: 'textarea', placeholder: 'List any allergies or dietary needs for band members' },
        { id: 'parking', label: 'Parking', type: 'textarea', defaultValue: '2x dedicated parking spots near load-in door\nVan/trailer accessible', placeholder: 'Parking requirements for vehicles and equipment' },
        { id: 'accommodation', label: 'Hotel Accommodation', type: 'textarea', placeholder: 'e.g., 3 hotel rooms (double occupancy) within 15 min of venue, 3-star minimum', description: 'Required for out-of-town shows' },
        { id: 'guest_list', label: 'Guest List', type: 'number', defaultValue: 10, description: 'Complimentary guest list spots' },
        { id: 'towels', label: 'Towels', type: 'number', defaultValue: 6, description: 'Clean towels for band members' },
      ],
    },
    COMMON_PAYMENT_SECTION,
    {
      id: 'additional_terms',
      title: 'Additional Terms',
      icon: 'file-text',
      fields: [
        { id: 'merch_sales', label: 'Merchandise Sales', type: 'textarea', defaultValue: 'Band retains 100% of merchandise revenue. Venue provides 6ft table, chair, and adequate lighting near venue exit. No venue commission on merch.', description: 'Merchandise terms' },
        { id: 'recording_policy', label: 'Recording & Photography', type: 'select', defaultValue: 'No professional recording without written permission', options: ['No recording allowed', 'No professional recording without written permission', 'Recording allowed with credit', 'Full recording rights granted'] },
        { id: 'insurance', label: 'Insurance Requirements', type: 'textarea', placeholder: 'e.g., Venue must carry general liability insurance of $1M minimum', description: 'Liability and insurance terms' },
        { id: 'promotion', label: 'Promotional Requirements', type: 'textarea', defaultValue: 'Venue to promote event via social media (minimum 3 posts), website listing, and email newsletter. Artist name and approved photos must be used.', placeholder: 'Marketing and promotion expectations' },
        { id: 'special_requests', label: 'Special Requests', type: 'textarea', placeholder: 'Any other requirements, restrictions, or notes' },
      ],
    },
    COMMON_CONTACT_SECTION,
  ],
  editableFields: ['pa_system', 'mixing_console', 'microphones', 'monitors', 'lighting', 'backline_provided', 'green_room', 'meals', 'beverages', 'accommodation', 'performance_fee', 'cancellation_policy', 'merch_sales', 'promotion'],
  requiredFields: ['event_name', 'event_date', 'event_time', 'venue_name', 'artist_name', 'genre', 'band_members', 'performance_duration', 'performance_fee', 'artist_contact_name', 'artist_contact_phone', 'artist_contact_email'],
};

// ============= DJ RIDER =============

export const DJ_RIDER: RiderContractTemplate = {
  id: 'dj',
  title: 'DJ / Electronic Artist Rider',
  description: 'Tailored rider for DJs and electronic music performers. Focuses on booth setup, CDJ/controller requirements, and club-style hospitality.',
  icon: 'headphones',
  category: 'DJ',
  sections: [
    COMMON_EVENT_SECTION,
    {
      id: 'dj_info',
      title: 'DJ Information',
      icon: 'headphones',
      fields: [
        { id: 'artist_name', label: 'DJ / Artist Name', type: 'text', required: true, placeholder: 'Your DJ name' },
        { id: 'genre', label: 'Genre(s)', type: 'text', required: true, placeholder: 'e.g., House, Techno, Hip-Hop, EDM' },
        { id: 'performance_duration', label: 'Set Duration', type: 'number', required: true, defaultValue: 120, unit: 'minutes' },
        { id: 'set_type', label: 'Set Type', type: 'select', defaultValue: 'DJ Set', options: ['DJ Set', 'Live Set (with production)', 'Hybrid Set', 'Back-to-Back'] },
        { id: 'support_dj', label: 'Support DJ / Opener', type: 'select', defaultValue: 'Venue provides', options: ['Venue provides', 'Artist provides', 'Not needed', 'To be discussed'] },
      ],
    },
    {
      id: 'technical_requirements',
      title: 'DJ Booth & Technical Setup',
      icon: 'settings',
      fields: [
        { id: 'dj_equipment', label: 'DJ Equipment Required', type: 'textarea', defaultValue: '2x Pioneer CDJ-3000 (or CDJ-2000NXS2)\n1x Pioneer DJM-900NXS2 mixer\nAll cables and power supplies', placeholder: 'List all DJ equipment needed' },
        { id: 'dj_brings_own', label: 'Equipment DJ Brings', type: 'textarea', defaultValue: 'USB drives with music\nHeadphones\nLaptop (if using controller)', placeholder: 'What the DJ will bring' },
        { id: 'booth_setup', label: 'DJ Booth Requirements', type: 'textarea', defaultValue: 'Sturdy table/booth at comfortable standing height\nBooth monitor speakers\nDedicated booth lighting (dim, not blinding)\nPower strip with 4+ outlets', placeholder: 'Booth setup details' },
        { id: 'sound_system', label: 'Sound System', type: 'textarea', defaultValue: 'Professional club-grade sound system appropriate for venue size. Subwoofers required. System must be capable of 110dB+ at FOH position.', placeholder: 'PA/sound system requirements' },
        { id: 'lighting', label: 'Lighting & Visuals', type: 'textarea', defaultValue: 'Moving head lights, laser effects, and haze machine. Lighting operator or pre-programmed show preferred. No house lights during performance.', placeholder: 'Lighting and visual requirements' },
        { id: 'soundcheck_duration', label: 'Soundcheck / Line Check', type: 'number', defaultValue: 30, unit: 'minutes' },
        { id: 'load_in_time', label: 'Arrival Time Before Set', type: 'number', defaultValue: 1, unit: 'hours' },
      ],
    },
    {
      id: 'stage_setup',
      title: 'Booth & Stage Layout',
      icon: 'layout',
      fields: [
        { id: 'booth_position', label: 'Booth Position', type: 'select', defaultValue: 'Elevated booth facing dance floor', options: ['Elevated booth facing dance floor', 'Stage level center', 'Corner booth', 'Flexible / venue standard'] },
        { id: 'booth_visibility', label: 'Booth Visibility', type: 'select', defaultValue: 'Visible to audience', options: ['Visible to audience', 'Partially enclosed', 'Fully enclosed booth', 'No preference'] },
        { id: 'booth_size', label: 'Minimum Booth Size', type: 'text', defaultValue: '6 x 4 ft', placeholder: 'Width x Depth' },
        { id: 'crowd_barrier', label: 'Crowd Barrier Required', type: 'checkbox', defaultValue: true, description: 'Barrier between DJ booth and audience' },
      ],
    },
    {
      id: 'hospitality',
      title: 'Hospitality',
      icon: 'coffee',
      fields: [
        { id: 'green_room', label: 'Green Room / VIP Area', type: 'select', defaultValue: 'Private area with seating', options: ['Private room required', 'Private area with seating', 'VIP table acceptable', 'Not needed'] },
        { id: 'beverages', label: 'Beverages', type: 'textarea', defaultValue: '6x bottled water at booth\n1x bottle of premium spirits (artist choice)\nMixers and ice\nEnergy drinks', placeholder: 'Beverage requirements' },
        { id: 'meals', label: 'Meal Requirements', type: 'textarea', defaultValue: 'Light meal or substantial snacks before performance', placeholder: 'Food requirements' },
        { id: 'parking', label: 'Parking', type: 'select', defaultValue: '1 dedicated spot near entrance', options: ['1 dedicated spot near entrance', '2 parking spots', 'Valet parking', 'Not needed'] },
        { id: 'guest_list', label: 'Guest List', type: 'number', defaultValue: 5, description: 'Complimentary guest list spots' },
        { id: 'plus_one', label: 'Plus-One / Tour Manager', type: 'checkbox', defaultValue: true, description: 'Complimentary entry for 1 additional person' },
      ],
    },
    COMMON_PAYMENT_SECTION,
    {
      id: 'additional_terms',
      title: 'Additional Terms',
      icon: 'file-text',
      fields: [
        { id: 'recording_policy', label: 'Recording Policy', type: 'select', defaultValue: 'No professional recording without written permission', options: ['No recording allowed', 'No professional recording without written permission', 'Recording allowed with credit', 'Full recording rights granted'] },
        { id: 'social_media', label: 'Social Media / Content', type: 'textarea', defaultValue: 'Venue may capture short clips (under 60 seconds) for social media with artist tag. No full set recordings.', placeholder: 'Social media and content terms' },
        { id: 'curfew', label: 'Curfew / End Time', type: 'text', placeholder: 'e.g., 2:00 AM local time', description: 'Latest performance end time' },
        { id: 'special_requests', label: 'Special Requests', type: 'textarea', placeholder: 'Any other requirements or notes' },
      ],
    },
    COMMON_CONTACT_SECTION,
  ],
  editableFields: ['dj_equipment', 'booth_setup', 'sound_system', 'lighting', 'beverages', 'meals', 'performance_fee', 'cancellation_policy', 'social_media'],
  requiredFields: ['event_name', 'event_date', 'event_time', 'venue_name', 'artist_name', 'genre', 'performance_duration', 'performance_fee', 'artist_contact_name', 'artist_contact_phone', 'artist_contact_email'],
};

// ============= SPEAKER / MC RIDER =============

export const SPEAKER_RIDER: RiderContractTemplate = {
  id: 'speaker',
  title: 'Speaker / MC / Host Rider',
  description: 'Professional rider for speakers, MCs, hosts, and comedians. Emphasizes audio clarity, presentation setup, and professional accommodations.',
  icon: 'mic-2',
  category: 'Speaker',
  sections: [
    COMMON_EVENT_SECTION,
    {
      id: 'speaker_info',
      title: 'Speaker / Performer Information',
      icon: 'mic-2',
      fields: [
        { id: 'artist_name', label: 'Speaker / Performer Name', type: 'text', required: true, placeholder: 'Your name or stage name' },
        { id: 'genre', label: 'Type of Performance', type: 'select', required: true, defaultValue: 'Keynote Speaker', options: ['Keynote Speaker', 'MC / Host', 'Comedian', 'Spoken Word', 'Panel Moderator', 'Workshop Facilitator', 'Other'] },
        { id: 'performance_duration', label: 'Presentation Duration', type: 'number', required: true, defaultValue: 45, unit: 'minutes' },
        { id: 'topic', label: 'Presentation Topic', type: 'text', placeholder: 'Brief description of talk/performance topic' },
        { id: 'audience_interaction', label: 'Audience Interaction', type: 'select', defaultValue: 'Q&A session after', options: ['No interaction', 'Q&A session after', 'Interactive throughout', 'Meet & greet after'] },
      ],
    },
    {
      id: 'technical_requirements',
      title: 'Audio & Visual Setup',
      icon: 'settings',
      fields: [
        { id: 'microphone_type', label: 'Microphone Preference', type: 'select', defaultValue: 'Wireless lavalier (lapel)', options: ['Wireless lavalier (lapel)', 'Wireless handheld', 'Headset microphone', 'Podium microphone', 'Wired handheld'] },
        { id: 'backup_mic', label: 'Backup Microphone Required', type: 'checkbox', defaultValue: true, description: 'Second microphone as backup' },
        { id: 'presentation_display', label: 'Presentation Display', type: 'select', defaultValue: 'Projector with screen', options: ['Projector with screen', 'Large LED screen/TV', 'Multiple monitors', 'No visual display needed'] },
        { id: 'laptop_connection', label: 'Laptop Connection', type: 'textarea', defaultValue: 'HDMI connection to display. Confidence monitor (speaker-facing screen showing slides). Clicker/remote for advancing slides.', placeholder: 'A/V connection requirements' },
        { id: 'recording', label: 'Event Recording', type: 'select', defaultValue: 'Audio recording only', options: ['No recording', 'Audio recording only', 'Video recording allowed', 'Professional videography provided by venue'] },
        { id: 'lighting', label: 'Lighting', type: 'textarea', defaultValue: 'Well-lit stage area. Audience lighting dimmed during presentation. No spotlight directly in eyes.', placeholder: 'Lighting requirements' },
        { id: 'soundcheck_duration', label: 'Tech Check Duration', type: 'number', defaultValue: 15, unit: 'minutes' },
      ],
    },
    {
      id: 'stage_setup',
      title: 'Stage & Presentation Setup',
      icon: 'layout',
      fields: [
        { id: 'stage_setup_type', label: 'Stage Setup', type: 'select', defaultValue: 'Open stage with freedom to move', options: ['Podium/lectern', 'Open stage with freedom to move', 'Seated (panel style)', 'Theater-in-the-round'] },
        { id: 'podium', label: 'Podium/Lectern Required', type: 'checkbox', defaultValue: false },
        { id: 'water_on_stage', label: 'Water on Stage', type: 'checkbox', defaultValue: true, description: 'Glass of water and bottle at podium/table' },
        { id: 'confidence_monitor', label: 'Confidence Monitor', type: 'checkbox', defaultValue: true, description: 'Screen facing speaker showing current slide' },
        { id: 'timer_visible', label: 'Visible Timer/Clock', type: 'checkbox', defaultValue: true, description: 'Timer visible to speaker showing remaining time' },
        { id: 'stage_notes', label: 'Additional Stage Notes', type: 'textarea', placeholder: 'Any other stage setup requirements' },
      ],
    },
    {
      id: 'hospitality',
      title: 'Hospitality',
      icon: 'coffee',
      fields: [
        { id: 'green_room', label: 'Green Room / Quiet Space', type: 'select', defaultValue: 'Private quiet room for preparation', options: ['Private quiet room for preparation', 'Shared speaker room', 'VIP area', 'Not needed'] },
        { id: 'meals', label: 'Meal Requirements', type: 'textarea', defaultValue: 'Light meal or substantial snacks. No heavy meals immediately before speaking.', placeholder: 'Food requirements' },
        { id: 'beverages', label: 'Beverages', type: 'textarea', defaultValue: 'Room temperature water, hot tea, coffee. Throat lozenges appreciated.', placeholder: 'Beverage requirements' },
        { id: 'parking', label: 'Parking', type: 'select', defaultValue: '1 dedicated spot', options: ['1 dedicated spot', 'Valet parking', 'Not needed'] },
        { id: 'travel_arrangements', label: 'Travel Arrangements', type: 'textarea', placeholder: 'e.g., Round-trip flight, airport transfer, hotel for 1 night', description: 'For out-of-town engagements' },
      ],
    },
    COMMON_PAYMENT_SECTION,
    {
      id: 'additional_terms',
      title: 'Additional Terms',
      icon: 'file-text',
      fields: [
        { id: 'content_ownership', label: 'Content Ownership', type: 'textarea', defaultValue: 'Speaker retains all intellectual property rights to presentation content, slides, and materials.', description: 'Who owns the presentation content' },
        { id: 'recording_rights', label: 'Recording Distribution Rights', type: 'textarea', defaultValue: 'Event organizer may use recordings for internal purposes only. Public distribution requires written permission and speaker approval of final edit.', placeholder: 'Terms for using recorded content' },
        { id: 'promotion', label: 'Promotional Requirements', type: 'textarea', placeholder: 'e.g., Speaker bio and headshot on event website, social media promotion' },
        { id: 'special_requests', label: 'Special Requests', type: 'textarea', placeholder: 'Any other requirements or notes' },
      ],
    },
    COMMON_CONTACT_SECTION,
  ],
  editableFields: ['microphone_type', 'presentation_display', 'laptop_connection', 'lighting', 'green_room', 'meals', 'beverages', 'performance_fee', 'cancellation_policy', 'content_ownership', 'recording_rights'],
  requiredFields: ['event_name', 'event_date', 'event_time', 'venue_name', 'artist_name', 'genre', 'performance_duration', 'performance_fee', 'artist_contact_name', 'artist_contact_phone', 'artist_contact_email'],
};

// ============= TEMPLATE REGISTRY =============

export const ALL_TEMPLATES: Record<string, RiderContractTemplate> = {
  solo_artist: SOLO_ARTIST_RIDER,
  band: BAND_RIDER,
  dj: DJ_RIDER,
  speaker: SPEAKER_RIDER,
};

export function getAllRiderTemplates(): Record<string, RiderContractTemplate> {
  return ALL_TEMPLATES;
}

export function getRiderTemplateById(templateId: string): RiderContractTemplate | null {
  return ALL_TEMPLATES[templateId] || null;
}

export function validateRiderData(
  templateId: string,
  data: Record<string, any>
): { valid: boolean; errors: string[] } {
  const template = getRiderTemplateById(templateId);
  if (!template) {
    return { valid: false, errors: ['Template not found'] };
  }

  const errors: string[] = [];
  for (const fieldId of template.requiredFields) {
    if (!data[fieldId] && data[fieldId] !== 0 && data[fieldId] !== false) {
      // Find the field label for a better error message
      let label = fieldId;
      for (const section of template.sections) {
        const field = section.fields.find(f => f.id === fieldId);
        if (field) { label = field.label; break; }
      }
      errors.push(`${label} is required`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function generateRiderHTML(
  templateId: string,
  data: Record<string, any>
): string {
  const template = getRiderTemplateById(templateId);
  if (!template) {
    return '<p>Template not found</p>';
  }

  let html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1a1a2e;">
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #6c5ce7; padding-bottom: 20px;">
        <h1 style="margin: 0 0 8px 0; color: #6c5ce7; font-size: 28px; letter-spacing: -0.5px;">${data.artist_name || template.title}</h1>
        <p style="margin: 0; color: #636e72; font-size: 16px;">Performance Rider Contract</p>
        <p style="margin: 8px 0 0 0; color: #b2bec3; font-size: 13px;">Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
  `;

  for (const section of template.sections) {
    const sectionHasData = section.fields.some(f => data[f.id] !== undefined && data[f.id] !== '' && data[f.id] !== null);
    if (!sectionHasData) continue;

    html += `
      <div style="margin-bottom: 30px; page-break-inside: avoid;">
        <h2 style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: white; padding: 10px 16px; margin: 0 0 16px 0; font-size: 15px; font-weight: 600; border-radius: 6px; letter-spacing: 0.5px;">${section.title}</h2>
        <div style="padding: 0 8px;">
    `;

    for (const field of section.fields) {
      const value = data[field.id];
      if (value === undefined || value === '' || value === null) continue;

      let displayValue = value;
      if (typeof value === 'boolean') {
        displayValue = value ? 'Yes' : 'No';
      }
      if (field.unit) {
        displayValue = `${value} ${field.unit}`;
      }

      html += `
        <div style="margin-bottom: 12px; display: flex; gap: 12px;">
          <span style="font-weight: 600; color: #6c5ce7; font-size: 13px; min-width: 180px; text-transform: uppercase; letter-spacing: 0.3px; padding-top: 2px;">${field.label}</span>
          <span style="color: #2d3436; font-size: 14px; white-space: pre-line; flex: 1; border-left: 2px solid #dfe6e9; padding-left: 12px;">${displayValue}</span>
        </div>
      `;
    }

    html += '</div></div>';
  }

  html += `
    <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #dfe6e9;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="width: 45%;">
          <p style="font-weight: 600; color: #6c5ce7; font-size: 13px; text-transform: uppercase; margin-bottom: 30px;">Artist / Representative Signature</p>
          <div style="border-bottom: 1px solid #2d3436; margin-bottom: 8px;"></div>
          <p style="font-size: 12px; color: #636e72;">Date: _______________</p>
        </div>
        <div style="width: 45%;">
          <p style="font-weight: 600; color: #6c5ce7; font-size: 13px; text-transform: uppercase; margin-bottom: 30px;">Venue / Promoter Signature</p>
          <div style="border-bottom: 1px solid #2d3436; margin-bottom: 8px;"></div>
          <p style="font-size: 12px; color: #636e72;">Date: _______________</p>
        </div>
      </div>
      <p style="text-align: center; color: #b2bec3; font-size: 11px; margin-top: 30px;">This rider is a binding addendum to the performance agreement. Generated by Ologywood - Artist Booking Platform</p>
    </div>
  </div>`;

  return html;
}
