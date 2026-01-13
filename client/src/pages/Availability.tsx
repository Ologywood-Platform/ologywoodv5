import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
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

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
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
    setSelectedDate(date);
    setSelectedStatus(currentStatus || 'available');
    setDialogOpen(true);
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

  const availabilityData = availability?.map(a => ({
    date: typeof a.date === 'string' ? a.date : new Date(a.date).toISOString().split('T')[0],
    status: a.status as AvailabilityStatus,
  })) || [];

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Manage Availability</h1>
          <p className="text-muted-foreground">
            Click on dates to mark your availability. This helps venues know when you're free to perform.
          </p>
        </div>

        <AvailabilityCalendar
          availability={availabilityData}
          onDateClick={handleDateClick}
        />

        {/* Status Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Availability</DialogTitle>
              <DialogDescription>
                {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
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

              <div className="flex gap-2 justify-end pt-4">
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
      </div>
    </div>
  );
}
