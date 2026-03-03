import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EventFormProps {
  initialData?: {
    id?: number;
    eventTitle?: string;
    eventType?: string;
    eventDate?: string;
    eventTime?: string;
    eventEndTime?: string;
    location?: string;
    capacity?: number;
    audienceType?: string;
    rate?: string;
    description?: string;
    isPublic?: boolean;
  };
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  isEditing?: boolean;
}

const EVENT_TYPES = [
  { value: 'concert', label: 'Concert' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'private_party', label: 'Private Party' },
  { value: 'festival', label: 'Festival' },
  { value: 'bar_gig', label: 'Bar / Club Gig' },
  { value: 'other', label: 'Other' },
];

const AUDIENCE_TYPES = [
  { value: 'general_public', label: 'General Public' },
  { value: 'adults_only', label: 'Adults Only' },
  { value: 'all_ages', label: 'All Ages' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'private', label: 'Private' },
];

export function EventForm({
  initialData,
  onSubmit,
  isLoading = false,
  isEditing = false,
}: EventFormProps) {
  const [formData, setFormData] = useState({
    eventTitle: initialData?.eventTitle || '',
    eventType: initialData?.eventType || '',
    eventDate: initialData?.eventDate ? new Date(initialData.eventDate).toISOString().split('T')[0] : '',
    eventTime: initialData?.eventTime || '',
    eventEndTime: initialData?.eventEndTime || '',
    location: initialData?.location || '',
    capacity: initialData?.capacity?.toString() || '',
    audienceType: initialData?.audienceType || '',
    rate: initialData?.rate || '',
    description: initialData?.description || '',
    isPublic: initialData?.isPublic ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.eventTitle.trim()) {
      newErrors.eventTitle = 'Event title is required';
    }
    if (!formData.eventType) {
      newErrors.eventType = 'Event type is required';
    }
    if (!formData.eventDate) {
      newErrors.eventDate = 'Event date is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.eventDate && formData.eventTime) {
      const eventDateTime = new Date(`${formData.eventDate}T${formData.eventTime}`);
      if (eventDateTime < new Date()) {
        newErrors.eventDate = 'Event date and time must be in the future';
      }
    }

    if (formData.capacity && isNaN(parseInt(formData.capacity))) {
      newErrors.capacity = 'Capacity must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        eventDate: new Date(formData.eventDate),
      });
      toast.success(isEditing ? 'Event updated successfully' : 'Event created successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save event');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Event' : 'Create New Event'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Update your event details'
            : 'Post a new event to attract venues and bookings'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Title */}
          <div className="space-y-2">
            <Label htmlFor="eventTitle">Event Title *</Label>
            <Input
              id="eventTitle"
              name="eventTitle"
              placeholder="e.g., Summer Concert 2026"
              value={formData.eventTitle}
              onChange={handleChange}
              className={errors.eventTitle ? 'border-red-500' : ''}
            />
            {errors.eventTitle && (
              <p className="text-sm text-red-500">{errors.eventTitle}</p>
            )}
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type *</Label>
            <Select value={formData.eventType} onValueChange={(value) => handleSelectChange('eventType', value)}>
              <SelectTrigger className={errors.eventType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.eventType && (
              <p className="text-sm text-red-500">{errors.eventType}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date *</Label>
              <Input
                id="eventDate"
                name="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={handleChange}
                className={errors.eventDate ? 'border-red-500' : ''}
              />
              {errors.eventDate && (
                <p className="text-sm text-red-500">{errors.eventDate}</p>
              )}
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
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g., 123 Main St, New York, NY"
              value={formData.location}
              onChange={handleChange}
              className={errors.location ? 'border-red-500' : ''}
            />
            {errors.location && (
              <p className="text-sm text-red-500">{errors.location}</p>
            )}
          </div>

          {/* Capacity and Audience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                placeholder="e.g., 500"
                value={formData.capacity}
                onChange={handleChange}
                className={errors.capacity ? 'border-red-500' : ''}
              />
              {errors.capacity && (
                <p className="text-sm text-red-500">{errors.capacity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="audienceType">Audience Type</Label>
              <Select value={formData.audienceType} onValueChange={(value) => handleSelectChange('audienceType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select audience type" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rate */}
          <div className="space-y-2">
            <Label htmlFor="rate">Performance Rate</Label>
            <Input
              id="rate"
              name="rate"
              placeholder="e.g., $500 or $50/hour"
              value={formData.rate}
              onChange={handleChange}
            />
            <p className="text-xs text-slate-500">
              Enter your performance rate or fee for this event
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the event, venue details, special requirements, etc."
              value={formData.description}
              onChange={handleChange}
              rows={4}
            />
          </div>

          {/* Public Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, isPublic: checked as boolean }))
              }
            />
            <Label htmlFor="isPublic" className="font-normal cursor-pointer">
              Make this event public (discoverable by venues)
            </Label>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Update Event' : 'Create Event'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
