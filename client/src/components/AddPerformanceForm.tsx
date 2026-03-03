import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useToast } from './ErrorToast';

interface AddPerformanceFormProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  // Pre-fill from a completed booking
  prefill?: {
    eventName?: string;
    eventDate?: string;
    venueName?: string;
    location?: string;
    attendeeCount?: number;
    eventId?: number;
    bookingId?: number;
    venueId?: number;
  };
}

export function AddPerformanceForm({ onSuccess, trigger, prefill }: AddPerformanceFormProps) {
  const [open, setOpen] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    eventName: prefill?.eventName || '',
    eventDate: prefill?.eventDate || '',
    venueName: prefill?.venueName || '',
    location: prefill?.location || '',
    attendeeCount: prefill?.attendeeCount?.toString() || '',
    notes: '',
  });

  const createHistory = trpc.events.createHistory.useMutation({
    onSuccess: () => {
      toast.addSuccess('Performance Added', 'Your performance has been added to your portfolio.');
      setOpen(false);
      setFormData({
        eventName: '',
        eventDate: '',
        venueName: '',
        location: '',
        attendeeCount: '',
        notes: '',
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast.addError('Error', error.message || 'Failed to add performance.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventName.trim() || !formData.eventDate) {
      toast.addError('Missing Fields', 'Event name and date are required.');
      return;
    }

    createHistory.mutate({
      eventName: formData.eventName.trim(),
      eventDate: formData.eventDate,
      venueName: formData.venueName.trim() || undefined,
      location: formData.location.trim() || undefined,
      attendeeCount: formData.attendeeCount ? parseInt(formData.attendeeCount) : undefined,
      notes: formData.notes.trim() || undefined,
      eventId: prefill?.eventId,
      bookingId: prefill?.bookingId,
      venueId: prefill?.venueId,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Performance
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Past Performance</DialogTitle>
            <DialogDescription>
              Log a past event to build your portfolio. You can add photos after creating the entry.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="eventName">Event Name *</Label>
              <Input
                id="eventName"
                placeholder="e.g., Summer Music Festival 2025"
                value={formData.eventName}
                onChange={(e) => handleChange('eventName', e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="eventDate">Event Date *</Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) => handleChange('eventDate', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="venueName">Venue Name</Label>
                <Input
                  id="venueName"
                  placeholder="e.g., The Roxy Theatre"
                  value={formData.venueName}
                  onChange={(e) => handleChange('venueName', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Atlanta, GA"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="attendeeCount">Estimated Attendance</Label>
              <Input
                id="attendeeCount"
                type="number"
                placeholder="e.g., 500"
                value={formData.attendeeCount}
                onChange={(e) => handleChange('attendeeCount', e.target.value)}
                min="0"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes / Recap</Label>
              <Textarea
                id="notes"
                placeholder="Share highlights from this performance..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createHistory.isPending}>
              {createHistory.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add to Portfolio'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
