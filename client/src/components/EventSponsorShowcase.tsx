import { trpc } from '@/lib/trpc';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

interface EventSponsorShowcaseProps {
  artistProfileId: number;
  eventId: number;
}

/**
 * Displays sponsor logos on event detail pages.
 * Fetches sponsors by artist profile ID and tracks impressions/clicks with source='event'.
 */
export function EventSponsorShowcase({ artistProfileId, eventId }: EventSponsorShowcaseProps) {
  const { data: sponsors, isLoading } = (trpc.sponsor as any).getPublicSponsorsByProfileId.useQuery(
    { profileId: artistProfileId },
    { enabled: artistProfileId > 0 }
  );

  const trackMutation = (trpc.sponsor as any).trackEvent.useMutation();

  // Track impressions when sponsors are displayed
  useEffect(() => {
    if (sponsors && sponsors.length > 0) {
      sponsors.forEach((sponsor: any) => {
        trackMutation.mutate({
          sponsorId: sponsor.id,
          eventType: 'impression',
          source: 'event',
        });
      });
    }
  }, [sponsors?.length]);

  const handleSponsorClick = (sponsor: any) => {
    trackMutation.mutate({
      sponsorId: sponsor.id,
      eventType: 'click',
      source: 'event',
    });
    if (sponsor.sponsorWebsite) {
      window.open(sponsor.sponsorWebsite, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading || !sponsors || sponsors.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">
          Sponsored By
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 justify-center">
          {sponsors.map((sponsor: any) => (
            <button
              key={sponsor.id}
              onClick={() => handleSponsorClick(sponsor)}
              className="group flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 hover:border-purple-300 hover:shadow-sm transition-all bg-white"
              title={sponsor.sponsorDescription || sponsor.sponsorName}
            >
              {sponsor.sponsorLogoUrl && (
                <img
                  src={sponsor.sponsorLogoUrl}
                  alt={sponsor.sponsorName}
                  className="h-8 w-auto max-w-[100px] object-contain"
                />
              )}
              <span className="text-sm font-medium text-slate-700 group-hover:text-purple-700">
                {sponsor.sponsorName}
              </span>
              {sponsor.sponsorWebsite && (
                <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-purple-500" />
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
