import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventStatusBadge } from '@/components/EventStatusBadge';
import { toast } from 'sonner';

interface EventStatusManagerProps {
  eventId: number;
  eventTitle: string;
  currentStatus: 'available' | 'booked' | 'completed' | 'cancelled';
  onStatusChange: (eventId: number, newStatus: string) => Promise<void>;
  isLoading?: boolean;
}

export function EventStatusManager({
  eventId,
  eventTitle,
  currentStatus,
  onStatusChange,
  isLoading = false,
}: EventStatusManagerProps) {
  const [newStatus, setNewStatus] = useState<'available' | 'booked' | 'completed' | 'cancelled'>(currentStatus);
  const [isSaving, setIsSaving] = useState(false);

  const statusOptions = [
    { value: 'available', label: 'Available - Open for bookings' },
    { value: 'booked', label: 'Booked - Event is confirmed' },
    { value: 'completed', label: 'Completed - Event finished' },
    { value: 'cancelled', label: 'Cancelled - Event is cancelled' },
  ];

  const handleStatusChange = async () => {
    if (newStatus === currentStatus) {
      toast.info('No changes made');
      return;
    }

    setIsSaving(true);
    try {
      await onStatusChange(eventId, newStatus);
      toast.success(`Event status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update event status');
      setNewStatus(currentStatus);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Event Status</CardTitle>
        <CardDescription>{eventTitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Current Status</label>
          <div className="flex items-center gap-2">
            <EventStatusBadge status={currentStatus} />
            <span className="text-xs text-slate-500">Last updated</span>
          </div>
        </div>

        {/* Status Selector */}
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">Update Status</label>
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as 'available' | 'booked' | 'completed' | 'cancelled')}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Info */}
        <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
          {newStatus === 'available' && 'Event is open for venue bookings'}
          {newStatus === 'booked' && 'Event has been booked by a venue'}
          {newStatus === 'completed' && 'Event has finished'}
          {newStatus === 'cancelled' && 'Event has been cancelled'}
        </div>

        {/* Action Button */}
        <Button
          onClick={handleStatusChange}
          disabled={isSaving || isLoading || newStatus === currentStatus}
          className="w-full"
        >
          {isSaving ? 'Updating...' : 'Update Status'}
        </Button>
      </CardContent>
    </Card>
  );
}
