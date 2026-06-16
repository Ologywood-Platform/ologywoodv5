import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { ExternalLink, Crown } from 'lucide-react';

interface SponsorShowcaseProps {
  artistId: number;
}

export function SponsorShowcase({ artistId }: SponsorShowcaseProps) {
  const { data: sponsors } = (trpc.sponsor as any).getPublicSponsors.useQuery(
    { artistId },
    { retry: false, enabled: !!artistId }
  );

  const trackMutation = (trpc.sponsor as any).trackEvent.useMutation();

  // Track impressions when sponsors are loaded and visible
  useEffect(() => {
    if (sponsors && sponsors.length > 0) {
      sponsors.forEach((sponsor: any) => {
        trackMutation.mutate({
          sponsorSlotId: sponsor.id,
          artistId,
          eventType: 'impression',
          source: 'profile',
        });
      });
    }
  }, [sponsors?.length]);

  const handleClick = (sponsor: any) => {
    trackMutation.mutate({
      sponsorSlotId: sponsor.id,
      artistId,
      eventType: 'click',
      source: 'profile',
    });
    if (sponsor.sponsorWebsite) {
      window.open(sponsor.sponsorWebsite, '_blank', 'noopener,noreferrer');
    }
  };

  if (!sponsors || sponsors.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Crown className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Sponsored By</h3>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        {sponsors.map((sponsor: any) => (
          <div
            key={sponsor.id}
            onClick={() => handleClick(sponsor)}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-amber-300 hover:shadow-sm transition-all ${
              sponsor.sponsorWebsite ? 'cursor-pointer' : ''
            }`}
            title={sponsor.sponsorDescription || sponsor.sponsorName}
          >
            <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-gray-50">
              <img
                src={sponsor.sponsorLogoUrl}
                alt={sponsor.sponsorName}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-sm font-medium text-gray-800">{sponsor.sponsorName}</span>
            {sponsor.sponsorWebsite && (
              <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-amber-500 transition-colors" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
