import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import {
  Video, Clock, DollarSign, Users, Calendar, ArrowLeft,
  Gamepad2, Music, Dumbbell, MessageCircle, Camera, Film, Palette, Briefcase, Star, Zap,
  CheckCircle2, AlertCircle
} from "lucide-react";

const CATEGORIES: Record<string, { label: string; icon: any }> = {
  gaming: { label: "Gaming", icon: Gamepad2 },
  music: { label: "Music / Listening Party", icon: Music },
  fitness: { label: "Fitness / Workout", icon: Dumbbell },
  qa: { label: "Q&A / AMA", icon: MessageCircle },
  workshop: { label: "Workshop / Tutorial", icon: Briefcase },
  photography: { label: "Photography", icon: Camera },
  film_breakdown: { label: "Film / Content Review", icon: Film },
  creative: { label: "Creative Session", icon: Palette },
  brand_building: { label: "Brand Building", icon: Zap },
  other: { label: "Other", icon: Star },
};

interface LiveExperience {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  price: string;
  capacityType: string;
  maxAttendees: number | null;
  platform: string;
  platformLink: string | null;
  linkSentAfterBooking: boolean | null;
  category: string;
  tags: string[] | null;
  coverImageUrl: string | null;
  isActive: boolean;
  totalBookings: number | null;
  averageRating: string | null;
  createdAt: Date;
  updatedAt: Date;
  talentId: number;
  recurringSchedule: unknown;
}

export default function OlogyLiveExperience() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const experienceId = parseInt(id || "0");
  const experience = trpc.ologyLive.getExperienceById.useQuery(
    { id: experienceId },
    { enabled: experienceId > 0 }
  );
  const slots = trpc.ologyLive.getAvailableSlots.useQuery(
    { experienceId },
    { enabled: experienceId > 0 }
  );

  const bookExperience = trpc.ologyLive.bookExperience.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        // Free experience — show success
        setBookingSuccess(true);
      }
    },
    onError: (error) => {
      setBookingError(error.message);
    },
  });

  if (!experienceId) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center py-20">
      <SiteHeader />
        <p className="text-muted-foreground">Experience not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/ology-live")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Ology Live
        </Button>
      </div>
    );
  }

  if (experience.isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center py-20">
        <p className="text-muted-foreground">Loading experience...</p>
      </div>
    );
  }

  if (!experience.data) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center py-20">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="font-semibold text-lg">Experience not found</h3>
        <p className="text-muted-foreground mt-1">This experience may have been removed or is no longer active.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/ology-live")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Ology Live
        </Button>
      </div>
    );
  }

  const exp = experience.data as LiveExperience;
  const catInfo = CATEGORIES[exp.category] || { label: exp.category, icon: Star };
  const CatIcon = catInfo.icon;
  const price = parseFloat(exp.price);

  if (bookingSuccess) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center py-20">
        <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
        <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Your session has been booked. You'll receive a confirmation email with the join link and details.
        </p>
        {exp.platformLink && !exp.linkSentAfterBooking && (
          <Card className="max-w-sm mx-auto mt-6">
            <CardContent className="py-4">
              <p className="text-sm font-medium">Join Link:</p>
              <a href={exp.platformLink} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm break-all">
                {exp.platformLink}
              </a>
            </CardContent>
          </Card>
        )}
        <div className="flex gap-3 justify-center mt-6">
          <Button onClick={() => navigate("/ology-live")}>
            Browse More Experiences
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            My Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/ology-live")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Ology Live
      </Button>

      {/* Experience Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-1">
            <CatIcon className="h-3.5 w-3.5" />
            {catInfo.label}
          </Badge>
          <Badge variant="outline">
            {exp.capacityType === "one_on_one" ? "1-on-1 Private" :
             exp.capacityType === "small_group" ? "Small Group" : "Broadcast"}
          </Badge>
        </div>

        <h1 className="text-3xl font-bold">{exp.title}</h1>

        {exp.description ? (
          <p className="text-lg text-muted-foreground">{String(exp.description)}</p>
        ) : null}

        {/* Key Details */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{exp.duration} minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-semibold">{price === 0 ? "Free" : `$${exp.price} per person`}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {exp.capacityType === "one_on_one" ? "Private 1-on-1" :
               `Up to ${exp.maxAttendees} attendees`}
            </span>
          </div>
          <div className="flex items-center gap-2 capitalize">
            <Video className="h-4 w-4 text-muted-foreground" />
            <span>{exp.platform.replace("_", " ")}</span>
          </div>
        </div>

        {/* Tags */}
        {exp.tags && (exp.tags as string[]).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(exp.tags as string[]).map((tag: string, i: number) => (
              <span key={i} className="text-sm bg-muted px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Rating */}
        {exp.averageRating ? (
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold">{String(exp.averageRating)}</span>
            <span className="text-muted-foreground">({String(exp.totalBookings || 0)} sessions completed)</span>
          </div>
        ) : null}
      </div>

      {/* Booking Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book This Experience
          </CardTitle>
          <CardDescription>
            Select an available time slot and complete your booking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Available Slots */}
          <div>
            <Label className="text-base font-medium">Available Time Slots</Label>
            {slots.isLoading ? (
              <p className="text-sm text-muted-foreground mt-2">Loading available times...</p>
            ) : !slots.data?.length ? (
              <div className="mt-3 p-4 rounded-lg border border-dashed text-center">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No available time slots right now. Check back later or contact the talent directly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {slots.data.map(slot => {
                  const start = new Date(slot.startTime);
                  const spotsLeft = slot.spotsTotal - slot.spotsTaken;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedSlotId === slot.id
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <p className="font-medium text-sm">
                        {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {" — "}
                        {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {exp.capacityType !== "one_on_one" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="booking-notes">Notes for the talent (optional)</Label>
            <Textarea
              id="booking-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g., I'd love to play Warzone, or I have questions about songwriting..."
              rows={3}
              className="mt-1"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{notes.length}/500</p>
          </div>

          {/* Price Summary */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Session price</span>
              <span className="font-semibold">{price === 0 ? "Free" : `$${exp.price}`}</span>
            </div>
            {price > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Payment processed securely via Stripe. 85% goes directly to the talent.
              </p>
            )}
          </div>

          {/* Error */}
          {bookingError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {bookingError}
              </p>
            </div>
          )}

          {/* Book Button */}
          <Button
            className="w-full"
            size="lg"
            disabled={!selectedSlotId || bookExperience.isPending}
            onClick={() => {
              if (!selectedSlotId) return;
              setBookingError("");
              bookExperience.mutate({
                experienceId: exp.id,
                slotId: selectedSlotId,
                notes: notes || undefined,
              });
            }}
          >
            {bookExperience.isPending
              ? "Processing..."
              : price === 0
                ? "Book Free Session"
                : `Book & Pay $${exp.price}`}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Session content is provided by the host and does not constitute professional advice. OlogyWood is not responsible for session content or outcomes.{' '}
            <a href="/disclaimer" className="text-purple-600 hover:underline">View Disclaimer</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
