import { useState } from 'react';
import { Upload, Plus, X, Music, Image as ImageIcon, Video, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface PortfolioMedia {
  id: number;
  type: 'photo' | 'video' | 'audio';
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
}

export interface PortfolioHighlight {
  id: number;
  title: string;
  description: string;
  date: string;
  location?: string;
  attendees?: number;
  rating?: number;
}

export interface ArtistPortfolio {
  bio: string;
  highlights: PortfolioHighlight[];
  media: PortfolioMedia[];
  testimonials: Array<{
    id: number;
    venueName: string;
    rating: number;
    comment: string;
  }>;
}

interface ArtistPortfolioBuilderProps {
  portfolio: ArtistPortfolio;
  onUpdateBio: (bio: string) => Promise<void>;
  onAddMedia: (media: Omit<PortfolioMedia, 'id' | 'uploadedAt'>) => Promise<void>;
  onRemoveMedia: (mediaId: number) => Promise<void>;
  onAddHighlight: (highlight: Omit<PortfolioHighlight, 'id'>) => Promise<void>;
  onRemoveHighlight: (highlightId: number) => Promise<void>;
  isLoading?: boolean;
}

export function ArtistPortfolioBuilder({
  portfolio,
  onUpdateBio,
  onAddMedia,
  onRemoveMedia,
  onAddHighlight,
  onRemoveHighlight,
  isLoading = false,
}: ArtistPortfolioBuilderProps) {
  const [bio, setBio] = useState(portfolio.bio);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [showHighlightForm, setShowHighlightForm] = useState(false);
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaDescription, setNewMediaDescription] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'photo' | 'video' | 'audio'>('photo');
  const [newHighlightTitle, setNewHighlightTitle] = useState('');
  const [newHighlightDescription, setNewHighlightDescription] = useState('');
  const [newHighlightDate, setNewHighlightDate] = useState('');
  const [newHighlightLocation, setNewHighlightLocation] = useState('');
  const [newHighlightAttendees, setNewHighlightAttendees] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);

  const handleSaveBio = async () => {
    setIsSavingBio(true);
    try {
      await onUpdateBio(bio);
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleAddMedia = async () => {
    if (!newMediaTitle || !newMediaUrl) {
      alert('Please fill in title and URL');
      return;
    }

    try {
      await onAddMedia({
        type: newMediaType,
        title: newMediaTitle,
        description: newMediaDescription,
        url: newMediaUrl,
      });

      setNewMediaTitle('');
      setNewMediaDescription('');
      setNewMediaUrl('');
      setNewMediaType('photo');
      setShowMediaForm(false);
    } catch (error) {
      console.error('Error adding media:', error);
    }
  };

  const handleAddHighlight = async () => {
    if (!newHighlightTitle || !newHighlightDate) {
      alert('Please fill in title and date');
      return;
    }

    try {
      await onAddHighlight({
        title: newHighlightTitle,
        description: newHighlightDescription,
        date: newHighlightDate,
        location: newHighlightLocation || undefined,
        attendees: newHighlightAttendees ? parseInt(newHighlightAttendees) : undefined,
      });

      setNewHighlightTitle('');
      setNewHighlightDescription('');
      setNewHighlightDate('');
      setNewHighlightLocation('');
      setNewHighlightAttendees('');
      setShowHighlightForm(false);
    } catch (error) {
      console.error('Error adding highlight:', error);
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Bio Section */}
      <Card>
        <CardHeader>
          <CardTitle>Artist Bio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell venues about yourself, your style, experience, and what makes you unique..."
            maxLength={1000}
            className="min-h-32"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{bio.length}/1000 characters</p>
            <Button
              onClick={handleSaveBio}
              disabled={isSavingBio || isLoading}
            >
              {isSavingBio ? 'Saving...' : 'Save Bio'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media Gallery */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Media Gallery</CardTitle>
          <Button
            onClick={() => setShowMediaForm(!showMediaForm)}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Media
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showMediaForm && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <div>
                <label className="text-sm font-medium mb-2 block">Media Type</label>
                <select
                  value={newMediaType}
                  onChange={(e) => setNewMediaType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="photo">Photo</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={newMediaTitle}
                  onChange={(e) => setNewMediaTitle(e.target.value)}
                  placeholder="e.g., Live Performance at Grand Hall"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                <Textarea
                  value={newMediaDescription}
                  onChange={(e) => setNewMediaDescription(e.target.value)}
                  placeholder="Describe this media..."
                  maxLength={300}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">URL</label>
                <Input
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  placeholder="https://example.com/media"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddMedia}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Media
                </Button>
                <Button
                  onClick={() => setShowMediaForm(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {portfolio.media.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No media yet. Add photos, videos, or audio clips to showcase your talent.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolio.media.map((media) => (
                <div key={media.id} className="border rounded-lg overflow-hidden">
                  {media.type === 'photo' && media.url && (
                    <img
                      src={media.url}
                      alt={media.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  {media.type === 'video' && (
                    <div className="w-full h-40 bg-gray-900 flex items-center justify-center">
                      <Video className="h-8 w-8 text-white" />
                    </div>
                  )}
                  {media.type === 'audio' && (
                    <div className="w-full h-40 bg-purple-900 flex items-center justify-center">
                      <Music className="h-8 w-8 text-white" />
                    </div>
                  )}

                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{media.title}</h4>
                        {media.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {media.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveMedia(media.id)}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Highlights */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Performance Highlights</CardTitle>
          <Button
            onClick={() => setShowHighlightForm(!showHighlightForm)}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Highlight
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showHighlightForm && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <div>
                <label className="text-sm font-medium mb-2 block">Event Title</label>
                <Input
                  value={newHighlightTitle}
                  onChange={(e) => setNewHighlightTitle(e.target.value)}
                  placeholder="e.g., Headliner at Summer Festival"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={newHighlightDescription}
                  onChange={(e) => setNewHighlightDescription(e.target.value)}
                  placeholder="Describe the performance..."
                  maxLength={300}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <Input
                    type="date"
                    value={newHighlightDate}
                    onChange={(e) => setNewHighlightDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Location (Optional)</label>
                  <Input
                    value={newHighlightLocation}
                    onChange={(e) => setNewHighlightLocation(e.target.value)}
                    placeholder="City, Venue"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Attendees (Optional)</label>
                <Input
                  type="number"
                  value={newHighlightAttendees}
                  onChange={(e) => setNewHighlightAttendees(e.target.value)}
                  placeholder="Number of attendees"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddHighlight}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Add Highlight
                </Button>
                <Button
                  onClick={() => setShowHighlightForm(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {portfolio.highlights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No highlights yet. Add your best performances and achievements.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {portfolio.highlights.map((highlight) => (
                <div key={highlight.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{highlight.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(highlight.date).toLocaleDateString()}
                        {highlight.location && ` • ${highlight.location}`}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveHighlight(highlight.id)}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>

                  <p className="text-sm">{highlight.description}</p>

                  {highlight.attendees && (
                    <p className="text-xs text-muted-foreground">
                      Attendees: {highlight.attendees.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testimonials */}
      {portfolio.testimonials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Venue Testimonials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {portfolio.testimonials.map((testimonial) => (
                <div key={testimonial.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{testimonial.venueName}</h4>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= testimonial.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{testimonial.comment}"</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
