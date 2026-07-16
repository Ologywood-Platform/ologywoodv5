/**
 * Rider Contract Template Definitions
 * Simplified universal template for artist bookings on Ologywood.
 * Follows checklist model: essential fields only, no nested complexity.
 */

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

export interface RiderSection {
  id: string;
  title: string;
  icon: string;
  fields: RiderField[];
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

// ============= SIMPLE BOOKING RIDER =============
// One universal template that works for all artist types.
// Artists fill in only what matters for their gig.

export const SIMPLE_BOOKING_RIDER: RiderContractTemplate = {
  id: 'simple_booking',
  title: 'Booking Rider',
  description: 'Simple rider contract for any artist booking. Covers the essentials: who, when, where, how much, and what you need.',
  icon: 'file-text',
  category: 'Universal',
  sections: [
    {
      id: 'booking_info',
      title: 'Booking Details',
      icon: 'calendar',
      fields: [
        { id: 'artist_name', label: 'Artist / Act Name', type: 'text', required: true, placeholder: 'Your performing name or band name' },
        { id: 'event_name', label: 'Event Name', type: 'text', required: true, placeholder: 'e.g., Friday Night Live' },
        { id: 'event_date', label: 'Event Date', type: 'date', required: true },
        { id: 'event_time', label: 'Start Time', type: 'time', required: true },
        { id: 'venue_name', label: 'Venue', type: 'text', required: true, placeholder: 'Venue name' },
        { id: 'set_duration', label: 'Set Length', type: 'number', required: true, defaultValue: 60, unit: 'minutes' },
      ],
    },
    {
      id: 'payment',
      title: 'Payment',
      icon: 'dollar-sign',
      fields: [
        { id: 'performance_fee', label: 'Performance Fee', type: 'number', required: true, placeholder: '500', unit: 'USD' },
        { id: 'deposit_required', label: 'Deposit Required', type: 'select', defaultValue: '50% upon signing', options: ['No deposit', '25% upon signing', '50% upon signing', '100% upfront'] },
        { id: 'payment_method', label: 'Payment Method', type: 'select', defaultValue: 'Stripe (via Ologywood)', options: ['Stripe (via Ologywood)', 'Bank transfer', 'Cash day-of', 'Other'] },
      ],
    },
    {
      id: 'technical',
      title: 'What I Need',
      icon: 'settings',
      fields: [
        { id: 'sound_system', label: 'Sound / PA', type: 'select', defaultValue: 'Venue provides', options: ['Venue provides', 'I bring my own', 'Not needed'] },
        { id: 'microphones', label: 'Microphones Needed', type: 'text', placeholder: 'e.g., 2 vocal mics, 1 instrument mic' },
        { id: 'backline', label: 'Backline / Equipment', type: 'textarea', placeholder: 'List any gear the venue needs to provide (amps, drums, stands, etc.)' },
        { id: 'soundcheck', label: 'Soundcheck Time Needed', type: 'select', defaultValue: '30 min before', options: ['15 min before', '30 min before', '1 hour before', '2 hours before'] },
      ],
    },
    {
      id: 'hospitality',
      title: 'Hospitality',
      icon: 'coffee',
      fields: [
        { id: 'green_room', label: 'Private Space / Green Room', type: 'checkbox', defaultValue: false, description: 'Need a private area before/after the show' },
        { id: 'meals_provided', label: 'Meal Provided', type: 'checkbox', defaultValue: false, description: 'Hot meal for artist/band' },
        { id: 'parking', label: 'Parking Provided', type: 'checkbox', defaultValue: true, description: 'Dedicated parking near load-in' },
        { id: 'guest_list', label: 'Guest List Spots', type: 'number', defaultValue: 2, description: 'Complimentary entries' },
      ],
    },
    {
      id: 'terms',
      title: 'Terms',
      icon: 'file-text',
      fields: [
        { id: 'cancellation_policy', label: 'Cancellation Policy', type: 'select', defaultValue: 'Full refund 14+ days out, 50% within 14 days', options: ['Full refund 14+ days out, 50% within 14 days', 'Full refund 30+ days out, no refund within 30 days', 'Non-refundable', 'Custom (see notes)'] },
        { id: 'recording_allowed', label: 'Recording Allowed', type: 'select', defaultValue: 'Short clips for social media only', options: ['No recording', 'Short clips for social media only', 'Full recording with credit', 'Any recording allowed'] },
        { id: 'additional_notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Anything else the venue should know (dietary needs, merch table, special requests, etc.)' },
      ],
    },
  ],
  editableFields: ['sound_system', 'microphones', 'backline', 'green_room', 'meals_provided', 'parking', 'guest_list', 'performance_fee', 'cancellation_policy', 'additional_notes'],
  requiredFields: ['artist_name', 'event_name', 'event_date', 'event_time', 'venue_name', 'set_duration', 'performance_fee'],
};

// ============= ATHLETE RIDER TEMPLATES =============

/**
 * Appearance Rider — for athlete meet & greets, event appearances, signings
 */
export const ATHLETE_APPEARANCE_RIDER: RiderContractTemplate = {
  id: 'athlete_appearance',
  title: 'Appearance Rider',
  description: 'For athlete appearances, meet & greets, and public events. Covers travel, security, timing, and compensation.',
  icon: 'star',
  category: 'Athlete',
  sections: [
    {
      id: 'appearance_info',
      title: 'Appearance Details',
      icon: 'calendar',
      fields: [
        { id: 'athlete_name', label: 'Athlete Name', type: 'text', required: true, placeholder: 'Your full name or brand name' },
        { id: 'event_name', label: 'Event / Occasion', type: 'text', required: true, placeholder: 'e.g., Grand Opening, Charity Gala' },
        { id: 'event_date', label: 'Event Date', type: 'date', required: true },
        { id: 'event_time', label: 'Arrival Time', type: 'time', required: true },
        { id: 'venue_name', label: 'Venue / Location', type: 'text', required: true, placeholder: 'Event location' },
        { id: 'appearance_duration', label: 'Appearance Duration', type: 'select', required: true, defaultValue: '2 hours', options: ['30 minutes', '1 hour', '2 hours', '3 hours', '4 hours', 'Full day'] },
        { id: 'appearance_type', label: 'Type of Appearance', type: 'select', required: true, defaultValue: 'Meet & Greet', options: ['Meet & Greet', 'Photo Op', 'Autograph Signing', 'Panel / Q&A', 'Keynote', 'Celebrity Host', 'Brand Activation', 'Charity Event', 'Other'] },
      ],
    },
    {
      id: 'compensation',
      title: 'Compensation',
      icon: 'dollar-sign',
      fields: [
        { id: 'appearance_fee', label: 'Appearance Fee', type: 'number', required: true, placeholder: '5000', unit: 'USD' },
        { id: 'deposit_required', label: 'Deposit Required', type: 'select', defaultValue: '50% upon signing', options: ['No deposit', '25% upon signing', '50% upon signing', '100% upfront'] },
        { id: 'overtime_rate', label: 'Overtime Rate (per hour)', type: 'number', placeholder: '2500', unit: 'USD', description: 'Rate if appearance extends beyond agreed duration' },
        { id: 'payment_method', label: 'Payment Method', type: 'select', defaultValue: 'Stripe (via Ologywood)', options: ['Stripe (via Ologywood)', 'Wire transfer', 'Check', 'Other'] },
      ],
    },
    {
      id: 'travel',
      title: 'Travel & Accommodation',
      icon: 'map-pin',
      fields: [
        { id: 'travel_provided', label: 'Travel Arranged By', type: 'select', defaultValue: 'Event organizer', options: ['Event organizer', 'Athlete (reimbursed)', 'Not needed (local)'] },
        { id: 'flight_class', label: 'Flight Class', type: 'select', defaultValue: 'Business', options: ['Economy', 'Business', 'First Class', 'Private'] },
        { id: 'hotel_rating', label: 'Hotel Minimum', type: 'select', defaultValue: '4-star', options: ['3-star', '4-star', '5-star', 'Suite required'] },
        { id: 'ground_transport', label: 'Ground Transportation', type: 'select', defaultValue: 'SUV / Black car', options: ['Standard car', 'SUV / Black car', 'Limo', 'Provided by athlete'] },
        { id: 'travel_party_size', label: 'Travel Party Size', type: 'number', defaultValue: 2, description: 'Total people traveling (athlete + entourage)' },
      ],
    },
    {
      id: 'security',
      title: 'Security & Access',
      icon: 'shield',
      fields: [
        { id: 'security_required', label: 'Security Required', type: 'select', defaultValue: 'Event provides', options: ['Not needed', 'Event provides', 'Athlete brings own', 'Both (event + personal)'] },
        { id: 'security_detail_size', label: 'Security Detail Size', type: 'number', defaultValue: 1, description: 'Number of security personnel needed' },
        { id: 'private_entrance', label: 'Private Entrance Required', type: 'checkbox', defaultValue: true, description: 'Separate entry/exit away from public' },
        { id: 'vip_holding_area', label: 'VIP Holding Area', type: 'checkbox', defaultValue: true, description: 'Private area for athlete before/during event' },
        { id: 'crowd_barrier', label: 'Crowd Barrier / Rope Line', type: 'checkbox', defaultValue: false, description: 'Physical barrier between athlete and crowd' },
      ],
    },
    {
      id: 'terms',
      title: 'Terms & Restrictions',
      icon: 'file-text',
      fields: [
        { id: 'photo_policy', label: 'Photo / Video Policy', type: 'select', defaultValue: 'Photos allowed, no video', options: ['No photos or video', 'Photos allowed, no video', 'Photos and short clips OK', 'Full media coverage allowed'] },
        { id: 'social_media_tag', label: 'Social Media Tag Required', type: 'text', placeholder: '@handle or #hashtag for posts' },
        { id: 'exclusivity', label: 'Exclusivity Clause', type: 'select', defaultValue: 'None', options: ['None', '24-hour exclusivity (same market)', '7-day exclusivity (same market)', '30-day exclusivity (same market)'] },
        { id: 'cancellation_policy', label: 'Cancellation Policy', type: 'select', defaultValue: 'Full refund 14+ days out, 50% within 14 days', options: ['Full refund 14+ days out, 50% within 14 days', 'Full refund 30+ days out, no refund within 30 days', 'Non-refundable', 'Custom (see notes)'] },
        { id: 'additional_notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Dietary needs, branding restrictions, prohibited topics, etc.' },
      ],
    },
  ],
  editableFields: ['appearance_fee', 'overtime_rate', 'travel_provided', 'flight_class', 'hotel_rating', 'ground_transport', 'security_required', 'photo_policy', 'exclusivity', 'cancellation_policy', 'additional_notes'],
  requiredFields: ['athlete_name', 'event_name', 'event_date', 'event_time', 'venue_name', 'appearance_duration', 'appearance_type', 'appearance_fee'],
};

/**
 * Autograph Signing Rider — for dedicated signing sessions
 */
export const ATHLETE_SIGNING_RIDER: RiderContractTemplate = {
  id: 'athlete_signing',
  title: 'Autograph Signing Rider',
  description: 'For dedicated autograph signing sessions. Covers items, timing, pricing, and logistics.',
  icon: 'pen-tool',
  category: 'Athlete',
  sections: [
    {
      id: 'signing_info',
      title: 'Signing Details',
      icon: 'calendar',
      fields: [
        { id: 'athlete_name', label: 'Athlete Name', type: 'text', required: true, placeholder: 'Your full name' },
        { id: 'event_name', label: 'Event / Store Name', type: 'text', required: true, placeholder: 'e.g., Sports Memorabilia Expo' },
        { id: 'event_date', label: 'Signing Date', type: 'date', required: true },
        { id: 'event_time', label: 'Start Time', type: 'time', required: true },
        { id: 'venue_name', label: 'Location', type: 'text', required: true, placeholder: 'Venue or store address' },
        { id: 'signing_duration', label: 'Signing Duration', type: 'select', required: true, defaultValue: '2 hours', options: ['1 hour', '2 hours', '3 hours', '4 hours'] },
      ],
    },
    {
      id: 'signing_details',
      title: 'Items & Pricing',
      icon: 'tag',
      fields: [
        { id: 'items_per_person', label: 'Max Items Per Person', type: 'number', defaultValue: 3, description: 'Maximum items each person can get signed' },
        { id: 'item_types', label: 'Accepted Items', type: 'select', defaultValue: 'Standard memorabilia', options: ['Standard memorabilia', 'Flat items only (photos, cards)', 'Any items', 'Pre-purchased items only'] },
        { id: 'inscription_available', label: 'Personalized Inscriptions', type: 'select', defaultValue: 'Available (limited)', options: ['Not available', 'Available (limited)', 'Available for all', 'VIP ticket holders only'] },
        { id: 'photo_with_athlete', label: 'Photo Op Included', type: 'select', defaultValue: 'Yes, with each signing', options: ['No', 'Yes, with each signing', 'VIP only', 'Separate line / additional fee'] },
        { id: 'max_attendees', label: 'Max Attendees', type: 'number', placeholder: '200', description: 'Cap on total number of people in signing line' },
      ],
    },
    {
      id: 'compensation',
      title: 'Compensation',
      icon: 'dollar-sign',
      fields: [
        { id: 'signing_fee', label: 'Signing Fee (Flat Rate)', type: 'number', required: true, placeholder: '3000', unit: 'USD' },
        { id: 'per_item_bonus', label: 'Per-Item Bonus (if applicable)', type: 'number', placeholder: '0', unit: 'USD', description: 'Additional per item signed beyond minimum' },
        { id: 'deposit_required', label: 'Deposit Required', type: 'select', defaultValue: '50% upon signing', options: ['No deposit', '25% upon signing', '50% upon signing', '100% upfront'] },
        { id: 'payment_method', label: 'Payment Method', type: 'select', defaultValue: 'Stripe (via Ologywood)', options: ['Stripe (via Ologywood)', 'Wire transfer', 'Check', 'Other'] },
      ],
    },
    {
      id: 'logistics',
      title: 'Logistics',
      icon: 'settings',
      fields: [
        { id: 'table_setup', label: 'Table / Setup Provided', type: 'checkbox', defaultValue: true, description: 'Organizer provides signing table, chair, markers' },
        { id: 'security_required', label: 'Security Required', type: 'select', defaultValue: 'Event provides', options: ['Not needed', 'Event provides', 'Athlete brings own'] },
        { id: 'private_area', label: 'Private Break Area', type: 'checkbox', defaultValue: true, description: 'Private space for breaks between sessions' },
        { id: 'breaks', label: 'Break Schedule', type: 'select', defaultValue: '15 min every hour', options: ['No breaks', '10 min every hour', '15 min every hour', '30 min every 2 hours'] },
        { id: 'parking', label: 'Parking Provided', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      id: 'terms',
      title: 'Terms',
      icon: 'file-text',
      fields: [
        { id: 'cancellation_policy', label: 'Cancellation Policy', type: 'select', defaultValue: 'Full refund 14+ days out, 50% within 14 days', options: ['Full refund 14+ days out, 50% within 14 days', 'Full refund 30+ days out, no refund within 30 days', 'Non-refundable', 'Custom (see notes)'] },
        { id: 'additional_notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Specific marker preferences, items you won\'t sign, etc.' },
      ],
    },
  ],
  editableFields: ['signing_fee', 'per_item_bonus', 'items_per_person', 'item_types', 'inscription_available', 'photo_with_athlete', 'max_attendees', 'security_required', 'breaks', 'cancellation_policy', 'additional_notes'],
  requiredFields: ['athlete_name', 'event_name', 'event_date', 'event_time', 'venue_name', 'signing_duration', 'signing_fee'],
};

/**
 * Speaking Engagement Rider — for keynotes, panels, motivational talks
 */
export const ATHLETE_SPEAKING_RIDER: RiderContractTemplate = {
  id: 'athlete_speaking',
  title: 'Speaking Engagement Rider',
  description: 'For keynotes, panels, motivational speaking, and corporate events. Covers AV, travel, and content terms.',
  icon: 'mic',
  category: 'Athlete',
  sections: [
    {
      id: 'speaking_info',
      title: 'Engagement Details',
      icon: 'calendar',
      fields: [
        { id: 'athlete_name', label: 'Speaker Name', type: 'text', required: true, placeholder: 'Your full name' },
        { id: 'event_name', label: 'Event Name', type: 'text', required: true, placeholder: 'e.g., Leadership Summit 2026' },
        { id: 'event_date', label: 'Event Date', type: 'date', required: true },
        { id: 'event_time', label: 'Speaking Time', type: 'time', required: true },
        { id: 'venue_name', label: 'Venue', type: 'text', required: true, placeholder: 'Event venue' },
        { id: 'speaking_format', label: 'Format', type: 'select', required: true, defaultValue: 'Keynote', options: ['Keynote', 'Panel Discussion', 'Fireside Chat', 'Workshop', 'Motivational Talk', 'Q&A Session', 'Commencement Address'] },
        { id: 'speaking_duration', label: 'Speaking Duration', type: 'select', required: true, defaultValue: '45 minutes', options: ['15 minutes', '30 minutes', '45 minutes', '1 hour', '90 minutes', '2 hours'] },
        { id: 'audience_size', label: 'Expected Audience Size', type: 'number', placeholder: '500' },
      ],
    },
    {
      id: 'compensation',
      title: 'Compensation',
      icon: 'dollar-sign',
      fields: [
        { id: 'speaking_fee', label: 'Speaking Fee', type: 'number', required: true, placeholder: '10000', unit: 'USD' },
        { id: 'deposit_required', label: 'Deposit Required', type: 'select', defaultValue: '50% upon signing', options: ['No deposit', '25% upon signing', '50% upon signing', '100% upfront'] },
        { id: 'payment_method', label: 'Payment Method', type: 'select', defaultValue: 'Stripe (via Ologywood)', options: ['Stripe (via Ologywood)', 'Wire transfer', 'Check', 'Other'] },
      ],
    },
    {
      id: 'technical',
      title: 'AV & Technical',
      icon: 'settings',
      fields: [
        { id: 'av_requirements', label: 'AV Setup', type: 'select', defaultValue: 'Venue provides full AV', options: ['Venue provides full AV', 'Speaker provides presentation, venue provides screen/projector', 'Minimal (handheld mic only)'] },
        { id: 'microphone_type', label: 'Microphone Preference', type: 'select', defaultValue: 'Lapel / lavalier', options: ['Handheld', 'Lapel / lavalier', 'Headset', 'No preference'] },
        { id: 'presentation_format', label: 'Presentation Format', type: 'select', defaultValue: 'PowerPoint / Keynote', options: ['No slides', 'PowerPoint / Keynote', 'Video clips included', 'Interactive / audience participation'] },
        { id: 'recording_allowed', label: 'Recording Allowed', type: 'select', defaultValue: 'Audio only', options: ['No recording', 'Audio only', 'Video for internal use only', 'Full recording with distribution rights'] },
        { id: 'teleprompter', label: 'Teleprompter Needed', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      id: 'travel',
      title: 'Travel & Accommodation',
      icon: 'map-pin',
      fields: [
        { id: 'travel_provided', label: 'Travel Arranged By', type: 'select', defaultValue: 'Event organizer', options: ['Event organizer', 'Speaker (reimbursed)', 'Not needed (local)'] },
        { id: 'flight_class', label: 'Flight Class', type: 'select', defaultValue: 'Business', options: ['Economy', 'Business', 'First Class', 'Private'] },
        { id: 'hotel_rating', label: 'Hotel Minimum', type: 'select', defaultValue: '4-star', options: ['3-star', '4-star', '5-star'] },
        { id: 'ground_transport', label: 'Ground Transportation', type: 'select', defaultValue: 'SUV / Black car', options: ['Standard car', 'SUV / Black car', 'Not needed'] },
        { id: 'travel_party_size', label: 'Travel Party Size', type: 'number', defaultValue: 1 },
      ],
    },
    {
      id: 'terms',
      title: 'Terms & Content',
      icon: 'file-text',
      fields: [
        { id: 'topic_approval', label: 'Topic Pre-Approval Required', type: 'checkbox', defaultValue: false, description: 'Speaker must approve final topic/title before promotion' },
        { id: 'meet_greet', label: 'Post-Talk Meet & Greet', type: 'select', defaultValue: '15 minutes', options: ['None', '15 minutes', '30 minutes', '1 hour'] },
        { id: 'exclusivity', label: 'Exclusivity Clause', type: 'select', defaultValue: 'None', options: ['None', '30-day same-market exclusivity', '90-day same-industry exclusivity'] },
        { id: 'cancellation_policy', label: 'Cancellation Policy', type: 'select', defaultValue: 'Full refund 30+ days out, no refund within 30 days', options: ['Full refund 14+ days out, 50% within 14 days', 'Full refund 30+ days out, no refund within 30 days', 'Non-refundable', 'Custom (see notes)'] },
        { id: 'additional_notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Topics to avoid, preferred introduction, special requirements, etc.' },
      ],
    },
  ],
  editableFields: ['speaking_fee', 'speaking_format', 'speaking_duration', 'av_requirements', 'microphone_type', 'recording_allowed', 'travel_provided', 'flight_class', 'meet_greet', 'exclusivity', 'cancellation_policy', 'additional_notes'],
  requiredFields: ['athlete_name', 'event_name', 'event_date', 'event_time', 'venue_name', 'speaking_format', 'speaking_duration', 'speaking_fee'],
};

/**
 * Camp / Clinic Rider — for sports camps, training clinics, youth programs
 */
export const ATHLETE_CAMP_RIDER: RiderContractTemplate = {
  id: 'athlete_camp',
  title: 'Camp / Clinic Rider',
  description: 'For sports camps, training clinics, and youth programs. Covers equipment, facilities, liability, and scheduling.',
  icon: 'trophy',
  category: 'Athlete',
  sections: [
    {
      id: 'camp_info',
      title: 'Camp / Clinic Details',
      icon: 'calendar',
      fields: [
        { id: 'athlete_name', label: 'Athlete / Coach Name', type: 'text', required: true, placeholder: 'Your full name' },
        { id: 'event_name', label: 'Camp / Clinic Name', type: 'text', required: true, placeholder: 'e.g., Elite Basketball Skills Camp' },
        { id: 'event_date', label: 'Start Date', type: 'date', required: true },
        { id: 'event_time', label: 'Start Time', type: 'time', required: true },
        { id: 'venue_name', label: 'Facility / Location', type: 'text', required: true, placeholder: 'Training facility name and address' },
        { id: 'camp_duration', label: 'Camp Duration', type: 'select', required: true, defaultValue: 'Full day (6-8 hours)', options: ['Half day (3-4 hours)', 'Full day (6-8 hours)', '2 days', '3 days', 'Week-long (5 days)'] },
        { id: 'sport', label: 'Sport', type: 'text', required: true, placeholder: 'e.g., Basketball, Football, Soccer' },
        { id: 'age_group', label: 'Age Group', type: 'select', defaultValue: 'Youth (8-14)', options: ['Youth (8-14)', 'High School (14-18)', 'College / Adult (18+)', 'All ages', 'Elite / Invite-only'] },
        { id: 'max_participants', label: 'Max Participants', type: 'number', defaultValue: 50, description: 'Maximum campers allowed' },
      ],
    },
    {
      id: 'compensation',
      title: 'Compensation',
      icon: 'dollar-sign',
      fields: [
        { id: 'camp_fee', label: 'Athlete Fee', type: 'number', required: true, placeholder: '8000', unit: 'USD', description: 'Total fee for athlete participation' },
        { id: 'deposit_required', label: 'Deposit Required', type: 'select', defaultValue: '50% upon signing', options: ['No deposit', '25% upon signing', '50% upon signing', '100% upfront'] },
        { id: 'payment_method', label: 'Payment Method', type: 'select', defaultValue: 'Stripe (via Ologywood)', options: ['Stripe (via Ologywood)', 'Wire transfer', 'Check', 'Other'] },
      ],
    },
    {
      id: 'equipment',
      title: 'Equipment & Facilities',
      icon: 'settings',
      fields: [
        { id: 'facility_type', label: 'Facility Type Required', type: 'select', defaultValue: 'Indoor gym / court', options: ['Indoor gym / court', 'Outdoor field', 'Indoor + Outdoor', 'Pool / aquatic center', 'Track / stadium'] },
        { id: 'equipment_provided_by', label: 'Equipment Provided By', type: 'select', defaultValue: 'Organizer provides all', options: ['Organizer provides all', 'Athlete brings specialized equipment', 'Participants bring own', 'Split (organizer + athlete)'] },
        { id: 'equipment_list', label: 'Equipment Needed', type: 'textarea', placeholder: 'List specific equipment: cones, balls, agility ladders, etc.' },
        { id: 'training_aids', label: 'Training Aids / Technology', type: 'textarea', placeholder: 'Video review setup, timing systems, etc.' },
        { id: 'athletic_trainer', label: 'Athletic Trainer On-Site', type: 'checkbox', defaultValue: true, description: 'Certified athletic trainer present for injuries' },
        { id: 'water_station', label: 'Hydration Station', type: 'checkbox', defaultValue: true, description: 'Water/sports drinks available for all participants' },
      ],
    },
    {
      id: 'staff',
      title: 'Staff & Support',
      icon: 'users',
      fields: [
        { id: 'assistant_coaches', label: 'Assistant Coaches Needed', type: 'number', defaultValue: 2, description: 'Additional coaches provided by organizer' },
        { id: 'athlete_brings_staff', label: 'Athlete Brings Own Staff', type: 'number', defaultValue: 1, description: 'Staff traveling with athlete (covered by organizer)' },
        { id: 'photographer', label: 'Photographer / Videographer', type: 'select', defaultValue: 'Organizer provides', options: ['Not needed', 'Organizer provides', 'Athlete brings own'] },
      ],
    },
    {
      id: 'terms',
      title: 'Terms & Liability',
      icon: 'file-text',
      fields: [
        { id: 'liability_waiver', label: 'Participant Liability Waivers', type: 'select', defaultValue: 'Required (organizer handles)', options: ['Required (organizer handles)', 'Required (athlete provides template)', 'Not required'] },
        { id: 'insurance', label: 'Event Insurance', type: 'select', defaultValue: 'Organizer provides', options: ['Organizer provides', 'Athlete provides', 'Both parties carry'] },
        { id: 'media_rights', label: 'Media / Content Rights', type: 'select', defaultValue: 'Shared usage rights', options: ['Organizer owns all', 'Athlete owns all', 'Shared usage rights', 'No media capture'] },
        { id: 'cancellation_policy', label: 'Cancellation Policy', type: 'select', defaultValue: 'Full refund 30+ days out, no refund within 30 days', options: ['Full refund 14+ days out, 50% within 14 days', 'Full refund 30+ days out, no refund within 30 days', 'Non-refundable', 'Custom (see notes)'] },
        { id: 'weather_policy', label: 'Weather / Force Majeure', type: 'select', defaultValue: 'Reschedule within 30 days', options: ['Reschedule within 30 days', 'Move indoors if available', 'Full refund if cancelled', 'Custom (see notes)'] },
        { id: 'additional_notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Dietary needs for catering, specific drill requirements, branding guidelines, etc.' },
      ],
    },
  ],
  editableFields: ['camp_fee', 'camp_duration', 'max_participants', 'facility_type', 'equipment_provided_by', 'equipment_list', 'assistant_coaches', 'liability_waiver', 'insurance', 'media_rights', 'cancellation_policy', 'weather_policy', 'additional_notes'],
  requiredFields: ['athlete_name', 'event_name', 'event_date', 'event_time', 'venue_name', 'camp_duration', 'sport', 'camp_fee'],
};

// ============= TEMPLATE REGISTRY =============
// Keep backward compatibility: old template IDs map to the simplified template

export const ALL_TEMPLATES: Record<string, RiderContractTemplate> = {
  simple_booking: SIMPLE_BOOKING_RIDER,
  // Athlete templates
  athlete_appearance: ATHLETE_APPEARANCE_RIDER,
  athlete_signing: ATHLETE_SIGNING_RIDER,
  athlete_speaking: ATHLETE_SPEAKING_RIDER,
  athlete_camp: ATHLETE_CAMP_RIDER,
  // Legacy aliases — all point to the same simple template
  solo_artist: SIMPLE_BOOKING_RIDER,
  band: SIMPLE_BOOKING_RIDER,
  dj: SIMPLE_BOOKING_RIDER,
  speaker: SIMPLE_BOOKING_RIDER,
};

export function getAllRiderTemplates(): Record<string, RiderContractTemplate> {
  return {
    simple_booking: SIMPLE_BOOKING_RIDER,
    athlete_appearance: ATHLETE_APPEARANCE_RIDER,
    athlete_signing: ATHLETE_SIGNING_RIDER,
    athlete_speaking: ATHLETE_SPEAKING_RIDER,
    athlete_camp: ATHLETE_CAMP_RIDER,
  };
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
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; padding: 32px 20px; color: #1a1a2e;">
      <div style="text-align: center; margin-bottom: 32px; border-bottom: 2px solid #6c5ce7; padding-bottom: 16px;">
        <h1 style="margin: 0 0 6px 0; color: #6c5ce7; font-size: 24px;">${data.artist_name || 'Artist'} — Booking Rider</h1>
        <p style="margin: 0; color: #636e72; font-size: 14px;">${data.event_name || 'Performance'} · ${data.event_date || 'TBD'}</p>
      </div>
  `;

  for (const section of template.sections) {
    const sectionHasData = section.fields.some(f => data[f.id] !== undefined && data[f.id] !== '' && data[f.id] !== null);
    if (!sectionHasData) continue;

    html += `
      <div style="margin-bottom: 24px;">
        <h2 style="background: #6c5ce7; color: white; padding: 8px 14px; margin: 0 0 12px 0; font-size: 14px; font-weight: 600; border-radius: 4px;">${section.title}</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
    `;

    for (const field of section.fields) {
      const value = data[field.id];
      if (value === undefined || value === '' || value === null) continue;

      let displayValue = value;
      if (typeof value === 'boolean') {
        displayValue = value ? '✓ Yes' : '✗ No';
      }
      if (field.unit) {
        displayValue = `${value} ${field.unit}`;
      }

      html += `
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 6px 8px; font-weight: 600; color: #555; width: 40%; vertical-align: top;">${field.label}</td>
          <td style="padding: 6px 8px; color: #1a1a2e; white-space: pre-line;">${displayValue}</td>
        </tr>
      `;
    }

    html += '</table></div>';
  }

  html += `
    <div style="margin-top: 40px; padding-top: 16px; border-top: 2px solid #eee;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="width: 45%;">
          <p style="font-weight: 600; color: #6c5ce7; font-size: 12px; text-transform: uppercase; margin-bottom: 24px;">Artist Signature</p>
          <div style="border-bottom: 1px solid #333; margin-bottom: 6px;"></div>
          <p style="font-size: 11px; color: #999;">Date: _______________</p>
        </div>
        <div style="width: 45%;">
          <p style="font-weight: 600; color: #6c5ce7; font-size: 12px; text-transform: uppercase; margin-bottom: 24px;">Venue Signature</p>
          <div style="border-bottom: 1px solid #333; margin-bottom: 6px;"></div>
          <p style="font-size: 11px; color: #999;">Date: _______________</p>
        </div>
      </div>
      <p style="text-align: center; color: #bbb; font-size: 10px;">Generated by Ologywood · Artist Booking Platform</p>
    </div>
  </div>`;

  return html;
}
