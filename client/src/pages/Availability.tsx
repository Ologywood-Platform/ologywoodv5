import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Music, CalendarRange, CalendarDays } from "lucide-react";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

type AvailabilityStatus = 'available' | 'booked' | 'unavailable';

export default function Availability() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus>('available');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Date range mode
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeFrom, setRangeFrom] = useState<string>('');
  const [rangeTo, setRangeTo] = useState<string>('');
  const [rangeDialogOpen, setRangeDialogOpen] = useState(false);
  const [rangeStatus, setRangeStatus] = useState<AvailabilityStatus>('available');

  // For editing existing range
  const [editingRange, setEditingRange] = useState(false);

  const { data: artistProfile } = trpc.artist.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'artist',
  });

  const { data: availability, refetch } = trpc.availability.getForArtist.useQuery(
    { artistId: artistProfile?.id || 0 },
    { enabled: !!artistProfile?.id }
  );

  const setAvailabilityMutation = trpc.availability.set.useMutation({
    onSuccess: () => {
      toast.success("Availability updated");
      refetch();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update availability");
    },
  });

  const deleteAvailabilityMutation = trpc.availability.delete.useMutation({
    onSuccess: () => {
      toast.success("Availability removed");
      refetch();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove availability");
    },
  });

  const setRangeMutation = trpc.availability.setRange.useMutation({
    onSuccess: (data) => {
      toast.success(`Availability set for ${data.datesSet} days`);
      refetch();
      setRangeDialogOpen(false);
      setRangeFrom('');
      setRangeTo('');
    },
    onError: (error) => {
      toast.error(error.message || "Failed to set availability range");
    },
  });

  const deleteRangeMutation = trpc.availability.deleteRange.useMutation({
    onSuccess: (data) => {
      toast.success(`Removed availability for ${data.datesRemoved} days`);
      refetch();
      setDialogOpen(false);
      setRangeDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove availability range");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = '/';
    } else if (!loading && isAuthenticated && user?.role !== 'artist') {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'artist') {
    if (user && (!user.role || user.role === 'user')) {
      window.location.href = '/get-started';
    }
    return null;
  }

  if (!artistProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Please complete your artist profile first</p>
        <Link href="/onboarding/artist">
          <Button>Complete Profile</Button>
        </Link>
      </div>
    );
  }

  const handleDateClick = (date: string, currentStatus?: AvailabilityStatus) => {
    if (rangeMode) {
      // In range mode, clicking dates fills From/To
      if (!rangeFrom || (rangeFrom && rangeTo)) {
        // Start new range
        setRangeFrom(date);
        setRangeTo('');
      } else {
        // Set end date (ensure it's after start)
        if (date >= rangeFrom) {
          setRangeTo(date);
          setRangeDialogOpen(true);
        } else {
          // Clicked date before start, reset start
          setRangeFrom(date);
          setRangeTo('');
        }
      }
    } else {
      // Single date mode (existing behavior)
      setSelectedDate(date);
      setSelectedStatus(currentStatus || 'available');
      setEditingRange(false);
      setDialogOpen(true);
    }
  };

  const handleSave = () => {
    if (!selectedDate || !artistProfile?.id) return;

    setAvailabilityMutation.mutate({
      date: selectedDate,
      status: selectedStatus,
    });
  };

  const handleRemove = () => {
    if (!selectedDate || !artistProfile?.id) return;

    const avail = availability?.find(a => {
      const aDate = typeof a.date === 'string' ? a.date : new Date(a.date).toISOString().split('T')[0];
      return aDate === selectedDate;
    });

    if (avail) {
      deleteAvailabilityMutation.mutate({ id: avail.id });
    }
  };

  const handleRangeSave = () => {
    if (!rangeFrom || !rangeTo) return;
    setRangeMutation.mutate({
      fromDate: rangeFrom,
      toDate: rangeTo,
      status: rangeStatus,
    });
  };

  const handleRemoveAll = () => {
    if (!rangeFrom || !rangeTo) return;
    deleteRangeMutation.mutate({
      fromDate: rangeFrom,
      toDate: rangeTo,
    });
  };

  // Check if selected date is part of a consecutive range with same status
  const getDateRange = (date: string): { from: string; to: string } | null => {
    if (!availability) return null;
    const avail = availability.find(a => {
      const aDate = typeof a.date === 'string' ? a.date : new Date(a.date).toISOString().split('T')[0];
      return aDate === date;
    });
    if (!avail) return null;

    const status = avail.status;
    const sortedDates = availability
      .filter(a => a.status === status)
      .map(a => typeof a.date === 'string' ? a.date : new Date(a.date).toISOString().split('T')[0])
      .sort();

    const idx = sortedDates.indexOf(date);
    if (idx === -1) return null;

    // Find consecutive range containing this date
    let from = date;
    let to = date;

    // Expand backward
    for (let i = idx - 1; i >= 0; i--) {
      const prev = new Date(sortedDates[i] + 'T00:00:00');
      const curr = new Date(sortedDates[i + 1] + 'T00:00:00');
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        from = sortedDates[i];
      } else break;
    }

    // Expand forward
    for (let i = idx + 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1] + 'T00:00:00');
      const curr = new Date(sortedDates[i] + 'T00:00:00');
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        to = sortedDates[i];
      } else break;
    }

    if (from === to) return null; // Single date, not a range
    return { from, to };
  };

  const availabilityData = availability?.map(a => ({
    date: typeof a.date === 'string' ? a.date : new Date(a.date).toISOString().split('T')[0],
    status: a.status as AvailabilityStatus,
  })) || [];

  const formatDateDisplay = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Detect if selected date belongs to a range
  const selectedDateRange = selectedDate ? getDateRange(selectedDate) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Music className="h-8 w-8" />
            Ologywood
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PageBreadcrumb
          className="mb-4"
          segments={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Availability' },
          ]}
        />
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-3xl md:text-4xl font-bold mb-2">Manage Availability</h1>
          <p className="text-muted-foreground">
            Click on dates to mark your availability. This helps venues know when you're free to perform.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Tip: Use "Date Range" mode to set availability for multiple days at once.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={!rangeMode ? "default" : "outline"}
            size="sm"
            onClick={() => { setRangeMode(false); setRangeFrom(''); setRangeTo(''); }}
            className="gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            Single Date
          </Button>
          <Button
            variant={rangeMode ? "default" : "outline"}
            size="sm"
            onClick={() => setRangeMode(true)}
            className="gap-2"
          >
            <CalendarRange className="h-4 w-4" />
            Date Range
          </Button>
        </div>

        {/* Range Mode Instructions & From/To display */}
        {rangeMode && (
          <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium text-primary mb-2">Date Range Mode</p>
            <p className="text-xs text-muted-foreground mb-3">
              Click a start date, then click an end date on the calendar. Or enter dates manually below.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium w-12">From:</Label>
                <input
                  type="date"
                  value={rangeFrom}
                  onChange={(e) => setRangeFrom(e.target.value)}
                  className="border rounded px-3 py-1.5 text-sm"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium w-12">To:</Label>
                <input
                  type="date"
                  value={rangeTo}
                  onChange={(e) => setRangeTo(e.target.value)}
                  className="border rounded px-3 py-1.5 text-sm"
                  min={rangeFrom || new Date().toISOString().split('T')[0]}
                />
              </div>
              <Button
                size="sm"
                disabled={!rangeFrom || !rangeTo || rangeTo < rangeFrom}
                onClick={() => setRangeDialogOpen(true)}
              >
                Set
              </Button>
            </div>
            {rangeFrom && rangeTo && (
              <p className="text-xs text-muted-foreground mt-2">
                Selected: {formatDateDisplay(rangeFrom)} — {formatDateDisplay(rangeTo)} 
                ({Math.ceil((new Date(rangeTo + 'T00:00:00').getTime() - new Date(rangeFrom + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
              </p>
            )}
          </div>
        )}

        <AvailabilityCalendar
          availability={availabilityData}
          onDateClick={handleDateClick}
          rangeFrom={rangeMode ? rangeFrom : undefined}
          rangeTo={rangeMode ? rangeTo : undefined}
        />

        {/* Single Date Status Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Availability</DialogTitle>
              <DialogDescription>
                {selectedDate && formatDateDisplay(selectedDate)}
                {selectedDateRange && (
                  <span className="block text-xs mt-1 text-primary">
                    Part of a range: {formatDateDisplay(selectedDateRange.from)} — {formatDateDisplay(selectedDateRange.to)}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <RadioGroup value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as AvailabilityStatus)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="available" id="available" />
                  <Label htmlFor="available" className="flex items-center gap-2 cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-green-600" />
                    Available for bookings
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="booked" id="booked" />
                  <Label htmlFor="booked" className="flex items-center gap-2 cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-red-600" />
                    Already booked
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unavailable" id="unavailable" />
                  <Label htmlFor="unavailable" className="flex items-center gap-2 cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-gray-600" />
                    Unavailable
                  </Label>
                </div>
              </RadioGroup>

              <div className="flex flex-wrap gap-2 justify-end pt-4">
                {/* Remove All button - shown when date is part of a range */}
                {selectedDateRange && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setRangeFrom(selectedDateRange.from);
                      setRangeTo(selectedDateRange.to);
                      deleteRangeMutation.mutate({
                        fromDate: selectedDateRange.from,
                        toDate: selectedDateRange.to,
                      });
                    }}
                    disabled={deleteRangeMutation.isPending}
                  >
                    {deleteRangeMutation.isPending ? "Removing..." : "Remove All"}
                  </Button>
                )}
                {/* Remove single date button */}
                {availability?.some(a => {
                  const aDate = typeof a.date === 'string' ? a.date : new Date(a.date).toISOString().split('T')[0];
                  return aDate === selectedDate;
                }) && (
                  <Button
                    variant="destructive"
                    onClick={handleRemove}
                    disabled={deleteAvailabilityMutation.isPending}
                  >
                    Remove
                  </Button>
                )}
                {/* Change All button - shown when date is part of a range */}
                {selectedDateRange && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setRangeMutation.mutate({
                        fromDate: selectedDateRange.from,
                        toDate: selectedDateRange.to,
                        status: selectedStatus,
                      });
                    }}
                    disabled={setRangeMutation.isPending}
                  >
                    {setRangeMutation.isPending ? "Updating..." : "Change All"}
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={setAvailabilityMutation.isPending}
                >
                  {setAvailabilityMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Date Range Dialog */}
        <Dialog open={rangeDialogOpen} onOpenChange={setRangeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Availability for Date Range</DialogTitle>
              <DialogDescription>
                {rangeFrom && rangeTo && (
                  <>
                    {formatDateDisplay(rangeFrom)} — {formatDateDisplay(rangeTo)}
                    <span className="block text-xs mt-1">
                      ({Math.ceil((new Date(rangeTo + 'T00:00:00').getTime() - new Date(rangeFrom + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
                    </span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <RadioGroup value={rangeStatus} onValueChange={(v) => setRangeStatus(v as AvailabilityStatus)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="available" id="range-available" />
                  <Label htmlFor="range-available" className="flex items-center gap-2 cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-green-600" />
                    Available for bookings
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="booked" id="range-booked" />
                  <Label htmlFor="range-booked" className="flex items-center gap-2 cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-red-600" />
                    Already booked
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unavailable" id="range-unavailable" />
                  <Label htmlFor="range-unavailable" className="flex items-center gap-2 cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-gray-600" />
                    Unavailable
                  </Label>
                </div>
              </RadioGroup>

              <div className="flex flex-wrap gap-2 justify-end pt-4">
                {/* Remove All button for range - only show if dates in range already have availability set */}
                {rangeFrom && rangeTo && availability?.some(a => {
                  const aDate = typeof a.date === 'string' ? a.date : new Date(a.date).toISOString().split('T')[0];
                  return aDate >= rangeFrom && aDate <= rangeTo;
                }) && (
                  <Button
                    variant="destructive"
                    onClick={handleRemoveAll}
                    disabled={deleteRangeMutation.isPending}
                  >
                    {deleteRangeMutation.isPending ? "Removing..." : "Remove All"}
                  </Button>
                )}
                <Button
                  onClick={handleRangeSave}
                  disabled={setRangeMutation.isPending || !rangeFrom || !rangeTo}
                >
                  {setRangeMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
