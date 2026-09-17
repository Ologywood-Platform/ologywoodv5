import PageBreadcrumb, { type BreadcrumbSegment } from '@/components/PageBreadcrumb';

type EntityType = 'artist' | 'venue' | 'event';

interface EntityBreadcrumbProps {
  type: EntityType;
  currentLabel: string;
  className?: string;
}

const ENTITY_TRAILS: Record<EntityType, BreadcrumbSegment[]> = {
  artist: [
    { label: 'Discover', href: '/discover' },
    { label: 'Talent', href: '/browse' },
  ],
  venue: [
    { label: 'Discover', href: '/discover' },
    { label: 'Venues', href: '/venues' },
  ],
  event: [
    { label: 'Experiences', href: '/experiences' },
    { label: 'Events', href: '/events' },
  ],
};

export default function EntityBreadcrumb({ type, currentLabel, className }: EntityBreadcrumbProps) {
  return (
    <PageBreadcrumb
      className={className}
      segments={[...ENTITY_TRAILS[type], { label: currentLabel }]}
    />
  );
}
