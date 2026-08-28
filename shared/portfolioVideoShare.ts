export function toPortfolioVideoSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80) || 'video';
}

export function portfolioVideoPath(title: string, id: number): string {
  return `/portfolio-video/${toPortfolioVideoSlug(title)}-${id}`;
}

export function portfolioVideoUrl(origin: string, title: string, id: number): string {
  return `${origin.replace(/\/$/, '')}${portfolioVideoPath(title, id)}`;
}

export function portfolioVideoDescription(title: string, artistName: string, category?: string | null): string {
  const categoryLabel = category
    ? category.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
    : 'Portfolio';
  return `Watch “${title},” a ${categoryLabel} video from ${artistName} on OlogyWood.`;
}
