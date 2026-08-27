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

const EVENT_TYPE_LABELS = Object.fromEntries(
  EVENT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<EventTypeValue, string>;

export function formatEventTypeLabel(value: string | null | undefined): string {
  if (!value) return 'Other';
  return EVENT_TYPE_LABELS[value as EventTypeValue]
    || value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
