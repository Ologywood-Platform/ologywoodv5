import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, Clock, MapPin, Music } from 'lucide-react';

export default function EventCreate() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    eventTitle: '',
    description: '',
    eventType: 'concert',
    location: '',
    eventDate: '',
    eventTime: '19:00',
    eventEndTime: '21:00',
    capacity: '',
    audienceType: '',
    rate: '',
    isPublic: true,
  });

  const createEvent = trpc.events.create.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        navigate(`/events/${data.event.id}`);
      }
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    } as any));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventTitle || !formData.eventDate) {
      alert('Please fill in required fields');
      return;
    }

    createEvent.mutate({
      eventTitle: formData.eventTitle,
      description: formData.description,
      eventType: formData.eventType as 'concert' | 'wedding' | 'corporate' | 'festival' | 'other' | 'bar_gig' | 'private_party',
      location: formData.location,
      eventDate: new Date(formData.eventDate),
      eventTime: formData.eventTime,
      eventEndTime: formData.eventEndTime,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      audienceType: formData.audienceType,
      rate: formData.rate || undefined,
      isPublic: formData.isPublic,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Post a New Event</h1>
          <p className="text-gray-600">Create an event to attract musicians and performers</p>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Fill in the details about your event</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <Input
                  type="text"
                  name="eventTitle"
                  value={formData.eventTitle}
                  onChange={handleChange}
                  placeholder="e.g., Summer Wedding Reception"
                  required
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type *
                </label>
                <Select value={formData.eventType} onValueChange={(value) => handleSelectChange('eventType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concert">Concert</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="corporate">Corporate Event</SelectItem>
                    <SelectItem value="festival">Festival</SelectItem>
                    <SelectItem value="bar_gig">Bar/Club Gig</SelectItem>
                    <SelectItem value="private_party">Private Party</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <Input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., New York, NY"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Event Date *
                  </label>
                  <Input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Start Time
                  </label>
                  <Input
                    type="time"
                    name="eventTime"
                    value={formData.eventTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <Input
                  type="time"
                  name="eventEndTime"
                  value={formData.eventEndTime}
                  onChange={handleChange}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your event, atmosphere, and what you're looking for..."
                  rows={4}
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Capacity
                </label>
                <Input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="e.g., 200"
                />
              </div>

              {/* Audience Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audience Type
                </label>
                <Input
                  type="text"
                  name="audienceType"
                  value={formData.audienceType}
                  onChange={handleChange}
                  placeholder="e.g., Adults 21+, Family-friendly"
                />
              </div>

              {/* Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Performance Rate (Optional)
                </label>
                <Input
                  type="text"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  placeholder="e.g., $500 or Negotiable"
                />
              </div>

              {/* Public Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  id="isPublic"
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                  Make this event visible to all artists
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={createEvent.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {createEvent.isPending ? 'Creating...' : 'Post Event'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
              </div>

              {createEvent.isError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
                  {createEvent.error?.message || 'Failed to create event'}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
