/**
 * Artist Rider Contract Template
 * Professional template for artist booking platform
 * Used by STARTER and PROFESSIONAL tier users
 */

export interface RiderContractTemplate {
  id: string;
  title: string;
  description: string;
  sections: RiderSection[];
  editableFields: string[];
  requiredFields: string[];
}

export interface RiderSection {
  id: string;
  title: string;
  fields: RiderField[];
}

export interface RiderField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'date';
  placeholder?: string;
  defaultValue?: string | number | boolean;
  required?: boolean;
  options?: string[];
  description?: string;
}

/**
 * Standard Artist Rider Template
 * Simplified for easy customization by artists
 */
export const STANDARD_ARTIST_RIDER: RiderContractTemplate = {
  id: 'standard_artist_rider',
  title: 'Standard Artist Rider',
  description: 'Professional rider template for booking performances',
  sections: [
    {
      id: 'artist_info',
      title: 'Artist Information',
      fields: [
        {
          id: 'artist_name',
          label: 'Artist/Band Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your artist or band name',
        },
        {
          id: 'genre',
          label: 'Genre(s)',
          type: 'text',
          required: true,
          placeholder: 'e.g., Rock, Jazz, Hip-Hop',
        },
        {
          id: 'ensemble_size',
          label: 'Ensemble Size',
          type: 'number',
          required: true,
          placeholder: 'Number of performers',
        },
        {
          id: 'performance_duration',
          label: 'Performance Duration (minutes)',
          type: 'number',
          required: true,
          placeholder: '60',
        },
      ],
    },
    {
      id: 'technical_requirements',
      title: 'Technical Requirements',
      fields: [
        {
          id: 'sound_system',
          label: 'Sound System Requirements',
          type: 'textarea',
          placeholder: 'Describe PA system, monitors, microphones needed',
          description: 'Specify all audio equipment requirements',
        },
        {
          id: 'lighting',
          label: 'Lighting Requirements',
          type: 'textarea',
          placeholder: 'e.g., Stage lighting, spotlights, color capability',
          description: 'Describe lighting setup needed for performance',
        },
        {
          id: 'stage_setup',
          label: 'Stage Setup & Dimensions',
          type: 'textarea',
          placeholder: 'e.g., 20x16 ft stage, 3 ft height, non-slip surface',
          description: 'Specify stage size, height, and surface requirements',
        },
        {
          id: 'equipment_provided',
          label: 'Equipment Provided by Venue',
          type: 'textarea',
          placeholder: 'e.g., Drum kit, amplifiers, keyboards',
          description: 'List equipment that must be provided by venue',
        },
        {
          id: 'load_in_time',
          label: 'Load-In Time (hours before performance)',
          type: 'number',
          placeholder: '3',
          defaultValue: 3,
        },
        {
          id: 'soundcheck_time',
          label: 'Soundcheck Duration (minutes)',
          type: 'number',
          placeholder: '90',
          defaultValue: 90,
        },
      ],
    },
    {
      id: 'hospitality',
      title: 'Hospitality & Accommodations',
      fields: [
        {
          id: 'green_room',
          label: 'Green Room Requirements',
          type: 'textarea',
          placeholder: 'e.g., Private room, seating for 5, temperature controlled',
          description: 'Describe green room setup needed',
        },
        {
          id: 'meals',
          label: 'Meal Requirements',
          type: 'textarea',
          placeholder: 'e.g., Hot catered dinner for 5, vegetarian options',
          description: 'Specify meals and dietary requirements',
        },
        {
          id: 'beverages',
          label: 'Beverage Requirements',
          type: 'textarea',
          placeholder: 'e.g., Water, soft drinks, coffee, alcoholic beverages',
          description: 'List beverages needed',
        },
        {
          id: 'parking',
          label: 'Parking Requirements',
          type: 'textarea',
          placeholder: 'e.g., Dedicated parking for 2 vehicles, tour bus parking',
          description: 'Specify parking needs',
        },
        {
          id: 'accommodations',
          label: 'Hotel Accommodations',
          type: 'textarea',
          placeholder: 'e.g., 3 nights hotel, 4-star minimum, near venue',
          description: 'Specify hotel requirements if travel required',
        },
        {
          id: 'wifi_required',
          label: 'WiFi Access Required',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
    {
      id: 'financial_terms',
      title: 'Financial Terms',
      fields: [
        {
          id: 'performance_fee',
          label: 'Performance Fee ($)',
          type: 'number',
          required: true,
          placeholder: 'Total performance fee',
        },
        {
          id: 'deposit_percentage',
          label: 'Deposit Required (%)',
          type: 'number',
          placeholder: '50',
          defaultValue: 50,
          description: 'Percentage of total fee required as deposit',
        },
        {
          id: 'payment_terms',
          label: 'Payment Terms',
          type: 'textarea',
          placeholder: 'e.g., 50% deposit upon booking, balance due 7 days before event',
          description: 'Specify payment schedule and conditions',
        },
        {
          id: 'cancellation_policy',
          label: 'Cancellation Policy',
          type: 'textarea',
          placeholder: 'e.g., Full refund if cancelled 30+ days in advance, 50% if 14+ days',
          description: 'Specify refund terms for different cancellation scenarios',
        },
        {
          id: 'travel_reimbursement',
          label: 'Travel Reimbursement',
          type: 'textarea',
          placeholder: 'e.g., Mileage reimbursement at $0.58/mile over 50 miles',
          description: 'Specify travel expense coverage',
        },
        {
          id: 'insurance_required',
          label: 'Insurance Required',
          type: 'checkbox',
          defaultValue: false,
          description: 'Check if venue liability insurance is required',
        },
      ],
    },
    {
      id: 'special_requests',
      title: 'Special Requests & Additional Terms',
      fields: [
        {
          id: 'promotional_requirements',
          label: 'Promotional Requirements',
          type: 'textarea',
          placeholder: 'e.g., Social media promotion, press releases, radio spots',
          description: 'Specify promotional support needed',
        },
        {
          id: 'merchandise',
          label: 'Merchandise Sales',
          type: 'textarea',
          placeholder: 'e.g., Artist retains 100% of merchandise sales',
          description: 'Specify merchandise sales terms',
        },
        {
          id: 'recording_rights',
          label: 'Recording & Streaming Rights',
          type: 'textarea',
          placeholder: 'e.g., No recording without written permission',
          description: 'Specify rights regarding audio/video recording',
        },
        {
          id: 'additional_terms',
          label: 'Additional Terms & Conditions',
          type: 'textarea',
          placeholder: 'Any other important terms or conditions',
          description: 'Add any other requirements or special conditions',
        },
      ],
    },
    {
      id: 'contact_info',
      title: 'Contact Information',
      fields: [
        {
          id: 'primary_contact',
          label: 'Primary Contact Name',
          type: 'text',
          required: true,
          placeholder: 'Manager, agent, or artist name',
        },
        {
          id: 'contact_phone',
          label: 'Contact Phone',
          type: 'text',
          required: true,
          placeholder: '+1 (555) 123-4567',
        },
        {
          id: 'contact_email',
          label: 'Contact Email',
          type: 'text',
          required: true,
          placeholder: 'contact@example.com',
        },
        {
          id: 'contact_notes',
          label: 'Additional Contact Notes',
          type: 'textarea',
          placeholder: 'Best time to reach, timezone, etc.',
        },
      ],
    },
  ],
  editableFields: [
    'sound_system',
    'lighting',
    'stage_setup',
    'equipment_provided',
    'green_room',
    'meals',
    'beverages',
    'parking',
    'accommodations',
    'performance_fee',
    'payment_terms',
    'cancellation_policy',
    'travel_reimbursement',
    'promotional_requirements',
    'merchandise',
    'recording_rights',
    'additional_terms',
  ],
  requiredFields: [
    'artist_name',
    'genre',
    'ensemble_size',
    'performance_duration',
    'performance_fee',
    'primary_contact',
    'contact_phone',
    'contact_email',
  ],
};

/**
 * Minimal Rider Template
 * Simplified version for solo performers or acoustic acts
 */
export const MINIMAL_RIDER: RiderContractTemplate = {
  id: 'minimal_rider',
  title: 'Minimal Rider (Solo/Acoustic)',
  description: 'Simplified rider for solo performers and acoustic acts',
  sections: [
    {
      id: 'artist_info',
      title: 'Artist Information',
      fields: [
        {
          id: 'artist_name',
          label: 'Artist Name',
          type: 'text',
          required: true,
        },
        {
          id: 'performance_duration',
          label: 'Performance Duration (minutes)',
          type: 'number',
          required: true,
          defaultValue: 60,
        },
      ],
    },
    {
      id: 'technical',
      title: 'Technical Setup',
      fields: [
        {
          id: 'microphone_required',
          label: 'Microphone Required',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          id: 'amplification',
          label: 'Amplification Needed',
          type: 'textarea',
          placeholder: 'e.g., Small PA system, acoustic guitar amp',
        },
      ],
    },
    {
      id: 'financial',
      title: 'Financial Terms',
      fields: [
        {
          id: 'performance_fee',
          label: 'Performance Fee ($)',
          type: 'number',
          required: true,
        },
        {
          id: 'payment_terms',
          label: 'Payment Terms',
          type: 'textarea',
          placeholder: 'e.g., Payment due upon completion of performance',
        },
      ],
    },
  ],
  editableFields: ['amplification', 'payment_terms'],
  requiredFields: ['artist_name', 'performance_duration', 'performance_fee'],
};

/**
 * Band Rider Template
 * Comprehensive template for full bands and ensembles
 */
export const BAND_RIDER: RiderContractTemplate = {
  id: 'band_rider',
  title: 'Band Rider (Full Ensemble)',
  description: 'Comprehensive rider for bands and ensembles',
  sections: [
    {
      id: 'band_info',
      title: 'Band Information',
      fields: [
        {
          id: 'band_name',
          label: 'Band Name',
          type: 'text',
          required: true,
        },
        {
          id: 'band_members',
          label: 'Band Members',
          type: 'number',
          required: true,
          placeholder: 'Total number of performers',
        },
        {
          id: 'genres',
          label: 'Genres',
          type: 'text',
          required: true,
        },
        {
          id: 'set_duration',
          label: 'Set Duration (minutes)',
          type: 'number',
          required: true,
          defaultValue: 90,
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Requirements',
      fields: [
        {
          id: 'stage_size',
          label: 'Minimum Stage Size',
          type: 'text',
          placeholder: 'e.g., 20x16 ft',
        },
        {
          id: 'pa_system',
          label: 'PA System Specifications',
          type: 'textarea',
          placeholder: 'Detailed PA requirements',
        },
        {
          id: 'monitors',
          label: 'Monitor System',
          type: 'textarea',
          placeholder: 'Number of monitors, specifications',
        },
        {
          id: 'lighting',
          label: 'Lighting Specifications',
          type: 'textarea',
          placeholder: 'Lighting requirements',
        },
        {
          id: 'load_in',
          label: 'Load-In Time (hours)',
          type: 'number',
          defaultValue: 4,
        },
        {
          id: 'soundcheck',
          label: 'Soundcheck Duration (minutes)',
          type: 'number',
          defaultValue: 120,
        },
      ],
    },
    {
      id: 'hospitality',
      title: 'Hospitality',
      fields: [
        {
          id: 'green_room',
          label: 'Green Room',
          type: 'textarea',
          placeholder: 'Green room requirements',
        },
        {
          id: 'catering',
          label: 'Catering',
          type: 'textarea',
          placeholder: 'Meals and beverages',
        },
        {
          id: 'parking',
          label: 'Parking',
          type: 'textarea',
          placeholder: 'Parking requirements',
        },
      ],
    },
    {
      id: 'financial',
      title: 'Financial Terms',
      fields: [
        {
          id: 'fee',
          label: 'Performance Fee ($)',
          type: 'number',
          required: true,
        },
        {
          id: 'deposit',
          label: 'Deposit (%)',
          type: 'number',
          defaultValue: 50,
        },
        {
          id: 'payment_schedule',
          label: 'Payment Schedule',
          type: 'textarea',
        },
        {
          id: 'cancellation',
          label: 'Cancellation Policy',
          type: 'textarea',
        },
      ],
    },
  ],
  editableFields: [
    'pa_system',
    'monitors',
    'lighting',
    'green_room',
    'catering',
    'parking',
    'payment_schedule',
    'cancellation',
  ],
  requiredFields: ['band_name', 'band_members', 'genres', 'set_duration', 'fee'],
};

/**
 * Get all available rider templates
 */
export function getAllRiderTemplates(): Record<string, RiderContractTemplate> {
  return {
    standard: STANDARD_ARTIST_RIDER,
    minimal: MINIMAL_RIDER,
    band: BAND_RIDER,
  };
}

/**
 * Get template by ID
 */
export function getRiderTemplate(templateId: string): RiderContractTemplate | null {
  const templates = getAllRiderTemplates();
  return templates[templateId] || null;
}

/**
 * Validate rider data against template
 */
export function validateRiderData(
  templateId: string,
  data: Record<string, any>
): { valid: boolean; errors: string[] } {
  const template = getRiderTemplate(templateId);
  if (!template) {
    return { valid: false, errors: ['Template not found'] };
  }

  const errors: string[] = [];

  // Check required fields
  for (const fieldId of template.requiredFields) {
    if (!data[fieldId]) {
      errors.push(`Required field missing: ${fieldId}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate HTML preview of rider
 */
export function generateRiderHTML(
  templateId: string,
  data: Record<string, any>
): string {
  const template = getRiderTemplate(templateId);
  if (!template) {
    return '<p>Template not found</p>';
  }

  let html = `
    <div class="rider-contract">
      <h1>${template.title}</h1>
      <p class="description">${template.description}</p>
  `;

  for (const section of template.sections) {
    html += `
      <section class="rider-section">
        <h2>${section.title}</h2>
    `;

    for (const field of section.fields) {
      const value = data[field.id] || '';
      html += `
        <div class="rider-field">
          <label><strong>${field.label}</strong></label>
          <p>${value || '(Not specified)'}</p>
        </div>
      `;
    }

    html += '</section>';
  }

  html += '</div>';
  return html;
}
