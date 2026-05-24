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

// ============= TEMPLATE REGISTRY =============
// Keep backward compatibility: old template IDs map to the simplified template

export const ALL_TEMPLATES: Record<string, RiderContractTemplate> = {
  simple_booking: SIMPLE_BOOKING_RIDER,
  // Legacy aliases — all point to the same simple template
  solo_artist: SIMPLE_BOOKING_RIDER,
  band: SIMPLE_BOOKING_RIDER,
  dj: SIMPLE_BOOKING_RIDER,
  speaker: SIMPLE_BOOKING_RIDER,
};

export function getAllRiderTemplates(): Record<string, RiderContractTemplate> {
  // Only expose the single simple template
  return { simple_booking: SIMPLE_BOOKING_RIDER };
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
