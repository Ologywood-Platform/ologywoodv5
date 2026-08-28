export const EVENT_TYPE_OPTIONS = [
  { value: 'arts_culture', label: 'Arts & Culture' },
  { value: 'bar_gig', label: 'Bar / Club Gig' },
  { value: 'concert', label: 'Concert' },
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'festival', label: 'Festival' },
  { value: 'other', label: 'Other' },
  { value: 'private_party', label: 'Private Party' },
  { value: 'wedding', label: 'Wedding' },
] as const;

export const EVENT_TYPE_VALUES = EVENT_TYPE_OPTIONS.map((option) => option.value) as [
  'arts_culture',
  'bar_gig',
  'concert',
  'corporate',
  'festival',
  'other',
  'private_party',
  'wedding',
];

export type EventTypeValue = (typeof EVENT_TYPE_OPTIONS)[number]['value'];

/**
 * Suggest an event category only when a new artist event is still untouched.
 * Other talent types keep the existing no-selection default so the creator
 * must choose the category that best describes the event.
 */
export function getDefaultArtistEventType(talentType: string | null | undefined): EventTypeValue | '' {
  return talentType === 'visual_artist' ? 'arts_culture' : '';
}

const EVENT_TYPE_LABELS = Object.fromEntries(
  EVENT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<EventTypeValue, string>;

export function formatEventTypeLabel(value: string | null | undefined): string {
  if (!value) return 'Other';
  return EVENT_TYPE_LABELS[value as EventTypeValue]
    || value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
