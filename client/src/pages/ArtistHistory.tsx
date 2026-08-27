import { toSlug } from '@/lib/slugify';
import { useRoute, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import SiteHeader from "../components/SiteHeader";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
  Calendar,
  MapPin,
  Users,
  Trash2,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { setMetaTags } from "../utils/seoMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { AddPerformanceForm } from "@/components/AddPerformanceForm";
import { PhotoUploadGallery } from "@/components/PhotoUploadGallery";
import { useEffect, useState } from "react";

export default function ArtistHistory() {
  const [, params] = useRoute("/artists/:id/history");
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const artistId = params?.id ? parseInt(params.id) : 0;

  const { data: artist } = trpc.artist.getProfile.useQuery(
    { id: artistId },
    { enabled: artistId > 0 }
  );

  const {
    data: history = [],
    isLoading,
    refetch: refetchHistory,
  } = trpc.events.getHistory.useQuery(
    { artistId },
    { enabled: artistId > 0 }
  );

  const deleteHistory = trpc.events.deleteHistory.useMutation({
    onSuccess: () => {
      refetchHistory();
    },
  });

  // Determine if the logged-in user owns this portfolio
  const isOwner = isAuthenticated && user && artist?.userId === user.id;

  // Track which entries have expanded photo galleries
  const [expandedPhotos, setExpandedPhotos] = useState<Set<number>>(new Set());

  const togglePhotos = (historyId: number) => {
    setExpandedPhotos((prev) => {
      const next = new Set(prev);
      if (next.has(historyId)) {
        next.delete(historyId);
      } else {
        next.add(historyId);
      }
      return next;
    });
  };

  useEffect(() => {
    const artistName = artist?.artistName || "Artist";
    setMetaTags({
      title: `${artistName} - Portfolio | Ologywood`,
      description: `Explore selected work, projects, appearances, and creative highlights from ${artistName} on Ologywood.`,
    });
  }, [artist]);

  // Parse the notes field to extract event name, venue, location, and body
  const parseNotes = (notes: string | null) => {
    if (!notes) return { eventName: "Portfolio Entry", venueName: "", location: "", body: "" };
    // Format: **EventName** at VenueName — Location\n\nBody
    const nameMatch = notes.match(/^\*\*(.+?)\*\*/);
    const eventName = nameMatch ? nameMatch[1] : notes.split("\n")[0] || "Portfolio Entry";
    const afterName = notes.replace(/^\*\*(.+?)\*\*/, "").trim();
    const venueMatch = afterName.match(/^at\s+(.+?)(?:\s+—\s+|$|\n)/);
    const venueName = venueMatch ? venueMatch[1] : "";
    const locationMatch = afterName.match(/—\s+(.+?)(?:\n|$)/);
    const location = locationMatch ? locationMatch[1].trim() : "";
    const bodyMatch = notes.split("\n\n");
    const body = bodyMatch.length > 1 ? bodyMatch.slice(1).join("\n\n") : "";
    return { eventName, venueName, location, body };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <SiteHeader />
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="space-y-4 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-slate-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <SiteHeader />
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <PageBreadcrumb
          className="mb-6"
          segments={[
            { label: "Browse", href: "/browse" },
            {
              label: artist?.artistName || "Artist",
              href: `/artist/${toSlug(artist?.artistName || '')}`,
            },
            { label: "Portfolio" },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Portfolio
            </h1>
            <p className="text-slate-600 dark:text-gray-400 mt-1">
              {isOwner
                ? "Showcase your work, projects, appearances, and creative highlights"
                : `Selected work and professional highlights from ${artist?.artistName || "this creator"}`}
            </p>
          </div>
          {isOwner && history.length > 0 && (
            <AddPerformanceForm onSuccess={() => refetchHistory()} />
          )}
        </div>

        {/* Stats bar */}
        {history.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-slate-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {history.length}
              </div>
              <div className="text-sm text-slate-500 dark:text-gray-400">
                Portfolio Entries
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-slate-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {history.reduce(
                  (sum: number, e: any) => sum + (e.attendeeCount || 0),
                  0
                ).toLocaleString()}
              </div>
              <div className="text-sm text-slate-500 dark:text-gray-400">
                Total Audience
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-slate-200 dark:border-gray-700 col-span-2 sm:col-span-1">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {history[0]?.eventDate
                  ? new Date(history[0].eventDate).getFullYear()
                  : "—"}
                {" – "}
                {history[history.length - 1]?.eventDate
                  ? new Date(
                      history[history.length - 1].eventDate
                    ).getFullYear()
                  : "Present"}
              </div>
              <div className="text-sm text-slate-500 dark:text-gray-400">
                Active Years
              </div>
            </div>
          </div>
        )}

        {/* History entries */}
        {history.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ImageIcon className="h-14 w-14 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 dark:text-gray-300 mb-2">
                {isOwner
                  ? "Start Building Your Portfolio"
                  : "Portfolio Coming Soon"}
              </h3>
              <p className="text-slate-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                {isOwner
                  ? "Add past work, projects, appearances, or creative highlights to show what you do."
                  : "This creator hasn't added portfolio entries yet. Check back later to explore their work."}
              </p>
              {isOwner && (
                <AddPerformanceForm
                  onSuccess={() => refetchHistory()}
                  trigger={
                    <Button size="lg" className="gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Add Your First Portfolio Entry
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {history.map((event: any) => {
              const parsed = parseNotes(event.notes);
              const isPhotoExpanded = expandedPhotos.has(event.id);

              return (
                <Card
                  key={event.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    {/* Event header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                          {parsed.eventName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500 dark:text-gray-400">
                          {parsed.venueName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {parsed.venueName}
                            </span>
                          )}
                          {parsed.location && !parsed.venueName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {parsed.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {event.eventDate
                              ? new Date(event.eventDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )
                              : "Date not specified"}
                          </span>
                          {event.attendeeCount && event.attendeeCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {event.attendeeCount.toLocaleString()} attendees
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Owner actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-slate-500 hover:text-slate-700"
                          onClick={() => togglePhotos(event.id)}
                        >
                          <ImageIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">Photos</span>
                        </Button>
                        {isOwner && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Portfolio Entry
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove "
                                  {parsed.eventName}" from your portfolio? All
                                  associated photos will also be deleted. This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteHistory.mutate({
                                      historyId: event.id,
                                    })
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteHistory.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Delete"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>

                    {/* Event body / notes */}
                    {parsed.body && (
                      <p className="text-sm text-slate-600 dark:text-gray-400 mt-3 leading-relaxed">
                        {parsed.body}
                      </p>
                    )}

                    {/* Photo gallery (expandable) */}
                    {isPhotoExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-700">
                        <PhotoUploadGallery
                          eventHistoryId={event.id}
                          isOwner={!!isOwner}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
