import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onEventCreate: (event: EventData) => void;
  isLoading?: boolean;
}

export interface EventData {
  title: string;
  description?: string;
  type: "booking" | "available" | "unavailable";
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export default function EventCreationModal({
  isOpen,
  onClose,
  selectedDate,
  onEventCreate,
  isLoading = false,
}: EventCreationModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<"available" | "unavailable" | "booking">("available");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Event title is required");
      return;
    }

    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    // Validate times
    if (startTime >= endTime) {
      toast.error("End time must be after start time");
      return;
    }

    const eventData: EventData = {
      title: title.trim(),
      description: description.trim() || undefined,
      type: eventType,
      date: selectedDate.toISOString().split("T")[0],
      startTime,
      endTime,
      notes: notes.trim() || undefined,
    };

    onEventCreate(eventData);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventType("available");
    setStartTime("09:00");
    setEndTime("17:00");
    setNotes("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "booking":
        return "Booking";
      case "available":
        return "Available for Bookings";
      case "unavailable":
        return "Unavailable";
      default:
        return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            {selectedDate
              ? `Create an event for ${selectedDate.toLocaleDateString("default", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}`
              : "Select a date to create an event"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type *</Label>
            <Select value={eventType} onValueChange={(value: any) => setEventType(value)}>
              <SelectTrigger id="eventType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available for Bookings</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
                <SelectItem value="booking">Booking Confirmed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Event Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Wedding Reception, Studio Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details about this event"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Start Time *
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                End Time *
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any special requirements or notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={2}
            />
          </div>

          {/* Info Box */}
          <div className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              {eventType === "available"
                ? "Mark yourself as available for bookings on this date"
                : eventType === "unavailable"
                ? "Block this time so you cannot be booked"
                : "Confirm a booking for this date"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedDate}
              className="gap-2"
            >
              {isLoading ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
