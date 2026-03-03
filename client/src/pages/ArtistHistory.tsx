import { useRoute, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, Calendar, MapPin, Music, Camera } from "lucide-react";
import { setMetaTags, pageMetaTags } from "../utils/seoMeta";
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { useEffect } from "react";

export default function ArtistHistory() {
  const [, params] = useRoute("/artists/:id/history");
  const [, navigate] = useLocation();
  const artistId = params?.id ? parseInt(params.id) : 0;

  const { data: artist } = trpc.artist.getProfile.useQuery(
    { id: artistId },
    { enabled: artistId > 0 }
  );

  const { data: history = [], isLoading } = trpc.events.getHistory.useQuery(
    { artistId },
    { enabled: artistId > 0 }
  );

  useEffect(() => {
    const artistName = artist?.artistName || "Artist";
    setMetaTags({
      title: `${artistName} - Performance History | Ologywood`,
      description: `View past performances and event portfolio for ${artistName} on Ologywood.`,
    });
  }, [artist]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <SiteHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="space-y-4 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <PageBreadcrumb
          className="mb-6"
          segments={[
            { label: 'Browse', href: '/browse' },
            { label: artist?.artistName || 'Artist', href: `/artist/${artistId}` },
            { label: 'Performance History' },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Performance History
          </h1>
          <p className="text-slate-600 dark:text-gray-400 mt-2">
            Past events and performances by{" "}
            <span className="font-semibold">{artist?.artistName || "this artist"}</span>
          </p>
        </div>

        {/* History list */}
        {history.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Music className="h-12 w-12 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-gray-300 mb-2">
                No Performance History Yet
              </h3>
              <p className="text-slate-500 dark:text-gray-400 max-w-md mx-auto">
                This artist hasn't logged any past performances yet. Check back later for their event portfolio.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((event: any) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {event.eventName || event.eventDetails || "Performance"}
                      </CardTitle>
                      {event.venueName && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {event.venueName}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {event.eventDate
                        ? new Date(event.eventDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Date not specified"}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {event.description && (
                    <p className="text-sm text-slate-600 dark:text-gray-400 mb-3">
                      {event.description}
                    </p>
                  )}
                  {event.highlights && (
                    <p className="text-sm text-slate-500 dark:text-gray-500 italic">
                      {event.highlights}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
