import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Users, X } from 'lucide-react';
import { toast } from 'sonner';

interface EventPhoto {
  id: number;
  photoUrl: string;
  caption?: string;
  uploadedBy: number;
}

interface EventHistoryItem {
  id: number;
  eventTitle: string;
  eventDate: Date | string;
  attendeeCount?: number;
  notes?: string;
  photos: EventPhoto[];
}

interface EventHistoryGalleryProps {
  events: EventHistoryItem[];
  onDeletePhoto?: (photoId: number) => Promise<void>;
  isLoading?: boolean;
}

export function EventHistoryGallery({
  events,
  onDeletePhoto,
  isLoading = false,
}: EventHistoryGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<EventPhoto | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventHistoryItem | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!onDeletePhoto) return;

    setDeletingPhotoId(photoId);
    try {
      await onDeletePhoto(photoId);
      toast.success('Photo deleted');
    } catch (error) {
      toast.error('Failed to delete photo');
    } finally {
      setDeletingPhotoId(null);
    }
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event History</CardTitle>
          <CardDescription>No past events yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Your completed events and photos will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {events.map(event => (
          <Card key={event.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{event.eventTitle}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(event.eventDate)}
                    {event.attendeeCount && (
                      <>
                        <span>•</span>
                        <Users className="h-4 w-4" />
                        {event.attendeeCount} attendees
                      </>
                    )}
                  </CardDescription>
                </div>
                <Badge variant="outline">Completed</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Event Notes */}
              {event.notes && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Notes</p>
                  <p className="text-sm text-slate-600">{event.notes}</p>
                </div>
              )}

              {/* Photos Gallery */}
              {event.photos.length > 0 ? (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">
                    Photos ({event.photos.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {event.photos.map(photo => (
                      <div
                        key={photo.id}
                        className="relative group cursor-pointer rounded-lg overflow-hidden bg-slate-100"
                      >
                        <img
                          src={photo.photoUrl}
                          alt={photo.caption || 'Event photo'}
                          className="w-full h-32 object-cover group-hover:opacity-75 transition-opacity"
                          onClick={() => {
                            setSelectedPhoto(photo);
                            setSelectedEvent(event);
                          }}
                        />

                        {/* Delete Button */}
                        {onDeletePhoto && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhoto(photo.id);
                            }}
                            disabled={deletingPhotoId === photo.id}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                            title="Delete photo"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}

                        {/* Caption Tooltip */}
                        {photo.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {photo.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-500">No photos added yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && selectedEvent && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedEvent.eventTitle}</DialogTitle>
              {selectedPhoto.caption && (
                <DialogDescription>{selectedPhoto.caption}</DialogDescription>
              )}
            </DialogHeader>

            <div className="relative bg-slate-100 rounded-lg overflow-hidden">
              <img
                src={selectedPhoto.photoUrl}
                alt={selectedPhoto.caption || 'Event photo'}
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>

            <div className="flex gap-2">
              {onDeletePhoto && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeletePhoto(selectedPhoto.id);
                    setSelectedPhoto(null);
                  }}
                  disabled={deletingPhotoId === selectedPhoto.id}
                >
                  Delete Photo
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setSelectedPhoto(null)}
                className="ml-auto"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
