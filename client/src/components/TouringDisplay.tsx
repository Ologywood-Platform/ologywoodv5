/**
 * TouringDisplay - Public-facing touring availability display for artist profiles.
 * Shows touring status, target regions, date windows, and preferences.
 * Only renders if the artist has touring enabled.
 */
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, MapPin, Calendar } from "lucide-react";

const TRAVEL_RADIUS_LABELS: Record<string, string> = {
  local: "Local (50mi)",
  regional: "Regional (300mi)",
  national: "National",
  international: "International",
};

const TOUR_TYPE_LABELS: Record<string, string> = {
  headline: "Headline",
  support: "Support Act",
  festival: "Festival",
  private: "Private Event",
  corporate: "Corporate",
  residency: "Residency",
};

interface TouringDisplayProps {
  artistProfileId: number;
}

export function TouringDisplay({ artistProfileId }: TouringDisplayProps) {
  const { data: touring, isLoading } = trpc.touring.getArtistTouring.useQuery(
    { artistProfileId },
    { enabled: artistProfileId > 0 }
  );

  // Don't render anything if not touring or loading
  if (isLoading || !touring) return null;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const regions = Array.isArray(touring.targetRegions) ? touring.targetRegions : [];
  const tourTypes = Array.isArray(touring.tourTypes) ? touring.tourTypes : [];
  const dateWindows = Array.isArray(touring.dateWindows) ? touring.dateWindows : [];

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plane className="h-5 w-5 text-purple-600" />
          On Tour
          <Badge variant="default" className="bg-purple-600 text-white text-xs ml-auto">
            Available
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Travel Radius */}
        {touring.travelRadius && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Radius:</span>
            <span className="font-medium">{TRAVEL_RADIUS_LABELS[touring.travelRadius] || touring.travelRadius}</span>
            {touring.homeBase && (
              <span className="text-muted-foreground">from {touring.homeBase}</span>
            )}
          </div>
        )}

        {/* Target Regions */}
        {regions.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-1.5">Target Regions</p>
            <div className="flex flex-wrap gap-1.5">
              {regions.map((region) => (
                <Badge key={region} variant="secondary" className="text-xs">
                  {region}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tour Types */}
        {tourTypes.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-1.5">Open To</p>
            <div className="flex flex-wrap gap-1.5">
              {tourTypes.map((type) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {TOUR_TYPE_LABELS[type] || type}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Date Windows */}
        {dateWindows.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-1.5 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Available Dates
            </p>
            <div className="space-y-1">
              {dateWindows.map((window: any, i: number) => (
                <p key={i} className="text-sm font-medium">
                  {formatDate(window.start)} — {formatDate(window.end)}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {touring.notes && (
          <p className="text-sm text-muted-foreground italic border-t pt-3">
            "{touring.notes}"
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * TouringBadge - Small inline badge for artist cards in browse/search.
 */
export function TouringBadge() {
  return (
    <Badge variant="default" className="bg-purple-600 text-white text-[10px] px-1.5 py-0 gap-0.5">
      <Plane className="h-2.5 w-2.5" />
      On Tour
    </Badge>
  );
}
