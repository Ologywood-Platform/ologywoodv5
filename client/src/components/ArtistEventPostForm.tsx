import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Upload, X, Image, Calendar, MapPin, Ticket, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface ArtistEventPostFormProps {
  onSuccess?: (eventId: number) => void;
  isLoading?: boolean;
}

export function ArtistEventPostForm({ onSuccess, isLoading = false }: ArtistEventPostFormProps) {
  const [formData, setFormData] = useState({
    eventTitle: '',
    eventDate: '',
    eventTime: '',
    eventEndTime: '',
    location: '',
    description: '',
    ticketLink: '',
  });
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPostMutation = trpc.events.createArtistPost.useMutation();
  const uploadMediaMutation = trpc.artist.uploadMedia.useMutation();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.eventTitle.trim()) newErrors.eventTitle = 'Event name is required';
    if (!formData.eventDate) newErrors.eventDate = 'Event date is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';

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
    setCoverImage(null);
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
            // Strip the data:image/...;base64, prefix
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

      const result = await createPostMutation.mutateAsync({
        eventTitle: formData.eventTitle,
        eventDate: new Date(formData.eventDate),
        eventTime: formData.eventTime || undefined,
        eventEndTime: formData.eventEndTime || undefined,
        location: formData.location,
        description: formData.description || undefined,
        ticketLink: formData.ticketLink || '',
        coverImageUrl,
      });

      toast.success('Event posted! Your fans can now see it on your profile.');
      onSuccess?.(result.event.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to post event';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const submitting = isLoading || isUploading || createPostMutation.isPending || uploadMediaMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-600" />
          Post an Event
        </CardTitle>
        <CardDescription>
          Let your fans know about your upcoming performance. Keep it simple — just the essentials.
        </CardDescription>
      </CardHeader>

      <CardContent>
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
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={removeCoverImage}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition"
                >
                  <X className="h-4 w-4" />
                </button>
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
              placeholder='e.g., "Live at The Blue Note" or "Summer Jam 2026"'
              value={formData.eventTitle}
              onChange={handleChange}
              className={errors.eventTitle ? 'border-red-500' : ''}
            />
            {errors.eventTitle && <p className="text-sm text-red-500">{errors.eventTitle}</p>}
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
              <Label htmlFor="eventTime">Start Time</Label>
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
              placeholder='e.g., "The Blue Note, 131 W 3rd St, New York, NY"'
              value={formData.location}
              onChange={handleChange}
              className={errors.location ? 'border-red-500' : ''}
            />
            {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
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
              placeholder="Tell your fans what to expect — set list, special guests, dress code, anything they should know..."
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
              Link to where fans can buy tickets (Eventbrite, Ticketmaster, your website, etc.)
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
  );
}
