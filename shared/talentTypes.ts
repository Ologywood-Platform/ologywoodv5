export const TALENT_TYPE_VALUES = [
  'artist',
  'visual_artist',
  'author_writer',
  'athlete',
  'creator',
  'entertainer',
  'filmmaker',
  'influencer',
] as const;

export type TalentType = (typeof TALENT_TYPE_VALUES)[number];

export const TALENT_TYPE_OPTIONS: ReadonlyArray<{
  value: TalentType;
  label: string;
  pluralLabel: string;
  description: string;
}> = [
  { value: 'artist', label: 'Music Artist', pluralLabel: 'Music Artists', description: 'Musicians & Bands' },
  { value: 'visual_artist', label: 'Visual Artist', pluralLabel: 'Visual Artists', description: 'Illustration, Fine Art & Design' },
  { value: 'author_writer', label: 'Author / Writer', pluralLabel: 'Authors & Writers', description: 'Books, Poetry & Publishing' },
  { value: 'athlete', label: 'Athlete', pluralLabel: 'Athletes', description: 'Sports & NIL' },
  { value: 'creator', label: 'Creator', pluralLabel: 'Creators', description: 'Content & Digital' },
  { value: 'entertainer', label: 'Entertainer', pluralLabel: 'Entertainers', description: 'Comedy, DJ & MC' },
  { value: 'filmmaker', label: 'Filmmaker', pluralLabel: 'Filmmakers', description: 'Film & Video Production' },
  { value: 'influencer', label: 'Influencer', pluralLabel: 'Influencers', description: 'Social & Brand' },
];

export const VISUAL_ART_DISCIPLINES = [
  'Illustration',
  'Painting',
  'Drawing',
  'Graphic Design',
  'Animation',
  'Comics & Sequential Art',
  'Photography',
  'Sculpture',
  'Mixed Media',
  'Digital Art',
  'Mural Art',
  'Printmaking',
  'Fashion Design',
  'Other',
] as const;

export const AUTHOR_GENRES = [
  'Fiction',
  'Literary Fiction',
  'Mystery & Thriller',
  'Romance',
  'Science Fiction',
  'Fantasy',
  'Historical Fiction',
  'Horror',
  'Young Adult',
  "Children's",
  'Comics & Graphic Novels',
  'Poetry',
  'Drama & Plays',
  'Biography & Memoir',
  'History',
  'Business & Entrepreneurship',
  'Self-Help & Personal Development',
  'Health & Wellness',
  'Faith & Spirituality',
  'Education',
  'Art & Photography',
  'Cookbooks & Food',
  'Essays & Journalism',
  'Politics & Social Issues',
  'Travel',
  'True Crime',
  'Other',
] as const;

export function getTalentTypeOption(value: string | null | undefined) {
  return TALENT_TYPE_OPTIONS.find((option) => option.value === value)
    ?? TALENT_TYPE_OPTIONS[0];
}

export function getTalentTypeLabel(value: string | null | undefined): string {
  return getTalentTypeOption(value).label;
}

export function getTalentTypePluralLabel(value: string | null | undefined): string {
  return getTalentTypeOption(value).pluralLabel;
}
