import { useState, useRef, useCallback } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Upload, X, Image, Calendar, MapPin, Ticket, FileText, ArrowLeft, Music, Users } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

export default function VenueEventCreate() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user } = useAuth();

  // Parse query params for pre-fill from calendar "Post Event" button
  const params = new URLSearchParams(search);
  const prefillBookingId = params.get('bookingId') ? parseInt(params.get('bookingId')!) : undefined;
  const prefillArtistId = params.get('artistId') ? parseInt(params.get('artistId')!) : undefined;
  const prefillArtistName = params.get('artistName') || '';
  const prefillDate = params.get('date') || '';
  const prefillTime = params.get('time') || '';

  const [formData, setFormData] = useState({
    eventTitle: prefillArtistName ? `${prefillArtistName} Live` : '',
    eventDate: prefillDate,
    eventTime: prefillTime,
    eventEndTime: '',
    location: '',
    description: '',
    ticketLink: '',
    ticketPrice: '',
    capacity: '',
    eventType: 'concert' as const,
  });
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createVenueEventMutation = trpc.events.createVenueEvent.useMutation();
  const uploadMediaMutation = trpc.artist.uploadMedia.useMutation();

  // Verify user is a venue
  if (user?.role !== 'venue' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only venues can post events from this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.eventTitle.trim()) newErrors.eventTitle = 'Event name is required';
    if (!formData.eventDate) newErrors.eventDate = 'Event date is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!prefillArtistId) newErrors.artistId = 'Artist is required — use Post Event from a confirmed booking';

    if (formData.eventDate && formData.eventTime) {
      const eventDateTime = new Date(`${formData.eventDate}T${formData.eventTime}`);
      if (eventDateTime < new Date()) {
        newErrors.eventDate = 'Event must be in the future';
      }
    }

    if (formData.ticketLink && formData.ticketLink.trim()) {
      try {
        new URL(formData.ticketLink);
      } catch {
        newErrors.ticketLink = 'Please enter a valid URL (e.g., https://...)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    setCoverImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setCoverImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const removeCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsUploading(true);
    try {
      // Upload cover image first if selected
      let coverImageUrl: string | undefined;
      if (coverImageFile) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(coverImageFile);
        });

        const uploadResult = await uploadMediaMutation.mutateAsync({
          fileName: `event-flyer-${Date.now()}.${coverImageFile.name.split('.').pop()}`,
          fileData: base64,
          fileType: coverImageFile.type,
        });
        coverImageUrl = uploadResult.url;
      }

      const result = await createVenueEventMutation.mutateAsync({
        eventTitle: formData.eventTitle,
        eventDate: new Date(formData.eventDate),
        eventTime: formData.eventTime || undefined,
        eventEndTime: formData.eventEndTime || undefined,
        location: formData.location,
        description: formData.description || undefined,
        ticketLink: formData.ticketLink || '',
        coverImageUrl,
        eventType: formData.eventType,
        artistId: prefillArtistId!,
        bookingId: prefillBookingId,
        ticketPrice: formData.ticketPrice || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      });

      toast.success('Event posted! It\'s now visible on the events page.');
      navigate(`/events/${result.event.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to post event';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const submitting = isUploading || createVenueEventMutation.isPending || uploadMediaMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Post an Event</h1>
            <p className="text-sm text-slate-600">Promote a show at your venue</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Event Details
            </CardTitle>
            <CardDescription>
              {prefillArtistName
                ? `Creating event for ${prefillArtistName}'s confirmed booking`
                : 'Fill in the details to promote this show'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Pre-fill info banner */}
            {prefillArtistName && (
              <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-3">
                <Music className="h-5 w-5 text-purple-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-purple-900">Artist: {prefillArtistName}</p>
                  {prefillDate && <p className="text-xs text-purple-700">Date: {new Date(prefillDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                </div>
              </div>
            )}

            {errors.artistId && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errors.artistId}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cover Image / Flyer Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Event Flyer / Promo Image
                </Label>
                {coverImagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={coverImagePreview}
                      alt="Event flyer preview"
                      className={`w-full h-48 object-cover transition-opacity ${uploadMediaMutation.isPending ? 'opacity-40' : ''}`}
                    />
                    {uploadMediaMutation.isPending && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                        <span className="text-sm text-white font-medium mt-2">Uploading flyer...</span>
                      </div>
                    )}
                    {!uploadMediaMutation.isPending && (
                      <button
                        type="button"
                        onClick={removeCoverImage}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition"
                  >
                    <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600 font-medium">Click to upload your event flyer</p>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG, or WebP — max 10MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              {/* Event Name */}
              <div className="space-y-2">
                <Label htmlFor="eventTitle">Event Name *</Label>
                <Input
                  id="eventTitle"
                  name="eventTitle"
                  placeholder='e.g., "Friday Night Live" or "Jazz at The EARL"'
                  value={formData.eventTitle}
                  onChange={handleChange}
                  className={errors.eventTitle ? 'border-red-500' : ''}
                />
                {errors.eventTitle && <p className="text-sm text-red-500">{errors.eventTitle}</p>}
              </div>

              {/* Event Type */}
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <select
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="concert">Concert / Live Music</option>
                  <option value="bar_gig">Bar Gig</option>
                  <option value="festival">Festival</option>
                  <option value="private_party">Private Party</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate" className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Date *
                  </Label>
                  <Input
                    id="eventDate"
                    name="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={handleChange}
                    className={errors.eventDate ? 'border-red-500' : ''}
                  />
                  {errors.eventDate && <p className="text-sm text-red-500">{errors.eventDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventTime">Doors Open</Label>
                  <Input
                    id="eventTime"
                    name="eventTime"
                    type="time"
                    value={formData.eventTime}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventEndTime">End Time</Label>
                  <Input
                    id="eventEndTime"
                    name="eventEndTime"
                    type="time"
                    value={formData.eventEndTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Location *
                </Label>
                <Input
                  id="location"
                  name="location"
                  placeholder='e.g., "The EARL, 488 Flat Shoals Ave SE, Atlanta, GA"'
                  value={formData.location}
                  onChange={handleChange}
                  className={errors.location ? 'border-red-500' : ''}
                />
                {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
              </div>

              {/* Capacity and Ticket Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity" className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    Capacity
                  </Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    placeholder="e.g., 200"
                    value={formData.capacity}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketPrice" className="flex items-center gap-1">
                    <Ticket className="h-3.5 w-3.5" />
                    Ticket Price
                  </Label>
                  <Input
                    id="ticketPrice"
                    name="ticketPrice"
                    placeholder='e.g., "$15" or "Free"'
                    value={formData.ticketPrice}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Tell people what to expect — lineup, set times, special guests, age restrictions..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              {/* Ticket Link */}
              <div className="space-y-2">
                <Label htmlFor="ticketLink" className="flex items-center gap-1">
                  <Ticket className="h-3.5 w-3.5" />
                  Ticket Link
                  <span className="text-xs text-slate-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="ticketLink"
                  name="ticketLink"
                  placeholder="https://tickets.example.com/your-event"
                  value={formData.ticketLink}
                  onChange={handleChange}
                  className={errors.ticketLink ? 'border-red-500' : ''}
                />
                {errors.ticketLink && <p className="text-sm text-red-500">{errors.ticketLink}</p>}
                <p className="text-xs text-slate-500">
                  Link to where fans can buy tickets (Eventbrite, Freshtix, your website, etc.)
                </p>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {submitting ? 'Posting Event...' : 'Post Event'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
