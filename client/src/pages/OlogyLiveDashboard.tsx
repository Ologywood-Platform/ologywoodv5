import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Video, Plus, Calendar, Users, DollarSign, Clock, Trash2, Edit2,
  ToggleLeft, ToggleRight, Zap, Gamepad2, Music, Dumbbell, MessageCircle,
  Camera, Film, Palette, Briefcase, Star
} from "lucide-react";

const CATEGORIES = [
  { value: "gaming", label: "Gaming", icon: Gamepad2 },
  { value: "music", label: "Music / Listening Party", icon: Music },
  { value: "fitness", label: "Fitness / Workout", icon: Dumbbell },
  { value: "qa", label: "Q&A / AMA", icon: MessageCircle },
  { value: "workshop", label: "Workshop / Tutorial", icon: Briefcase },
  { value: "photography", label: "Photography", icon: Camera },
  { value: "film_breakdown", label: "Film / Content Review", icon: Film },
  { value: "creative", label: "Creative Session", icon: Palette },
  { value: "brand_building", label: "Brand Building", icon: Zap },
  { value: "other", label: "Other", icon: Star },
];

const PLATFORMS = [
  { value: "twitch", label: "Twitch" },
  { value: "discord", label: "Discord" },
  { value: "zoom", label: "Zoom" },
  { value: "facetime", label: "FaceTime" },
  { value: "google_meet", label: "Google Meet" },
  { value: "youtube_live", label: "YouTube Live" },
  { value: "other", label: "Other" },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

export default function OlogyLiveDashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState("");
  const [capacityType, setCapacityType] = useState<"one_on_one" | "small_group" | "broadcast">("one_on_one");
  const [maxAttendees, setMaxAttendees] = useState(1);
  const [platform, setPlatform] = useState("discord");
  const [platformLink, setPlatformLink] = useState("");
  const [linkSentAfterBooking, setLinkSentAfterBooking] = useState(false);
  const [category, setCategory] = useState("gaming");
  const [tags, setTags] = useState("");

  const utils = trpc.useUtils();
  const experiences = trpc.ologyLive.getMyExperiences.useQuery();
  const bookings = trpc.ologyLive.getMyBookingsAsTalent.useQuery();

  const createExperience = trpc.ologyLive.createExperience.useMutation({
    onSuccess: () => {
      utils.ologyLive.getMyExperiences.invalidate();
      resetForm();
    },
  });

  const updateExperience = trpc.ologyLive.updateExperience.useMutation({
    onSuccess: () => {
      utils.ologyLive.getMyExperiences.invalidate();
      resetForm();
    },
  });

  const toggleActive = trpc.ologyLive.toggleActive.useMutation({
    onSuccess: () => utils.ologyLive.getMyExperiences.invalidate(),
  });

  const deleteExperience = trpc.ologyLive.deleteExperience.useMutation({
    onSuccess: () => utils.ologyLive.getMyExperiences.invalidate(),
  });

  const confirmBooking = trpc.ologyLive.confirmBooking.useMutation({
    onSuccess: () => utils.ologyLive.getMyBookingsAsTalent.invalidate(),
  });

  function resetForm() {
    setTitle("");
    setDescription("");
    setDuration(30);
    setPrice("");
    setCapacityType("one_on_one");
    setMaxAttendees(1);
    setPlatform("discord");
    setPlatformLink("");
    setLinkSentAfterBooking(false);
    setCategory("gaming");
    setTags("");
    setShowCreateForm(false);
    setEditingId(null);
  }

  function handleEdit(exp: any) {
    setEditingId(exp.id);
    setTitle(exp.title);
    setDescription(exp.description || "");
    setDuration(exp.duration);
    setPrice(String(exp.price));
    setCapacityType(exp.capacityType);
    setMaxAttendees(exp.maxAttendees || 1);
    setPlatform(exp.platform);
    setPlatformLink(exp.platformLink || "");
    setLinkSentAfterBooking(exp.linkSentAfterBooking || false);
    setCategory(exp.category);
    setTags((exp.tags || []).join(", "));
    setShowCreateForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      title,
      description: description || undefined,
      duration,
      price: parseFloat(price),
      capacityType,
      maxAttendees: capacityType === "one_on_one" ? 1 : maxAttendees,
      platform,
      platformLink: platformLink || undefined,
      linkSentAfterBooking,
      category,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
    };

    if (editingId) {
      updateExperience.mutate({ id: editingId, ...data });
    } else {
      createExperience.mutate(data);
    }
  }

  const pendingBookings = bookings.data?.filter(b => b.status === "pending") || [];
  const confirmedBookings = bookings.data?.filter(b => b.status === "confirmed") || [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Video className="h-8 w-8 text-primary" />
            Ology Live
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage virtual experiences for your fans
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateForm(true); }} size="lg">
          <Plus className="h-5 w-5 mr-2" /> New Experience
        </Button>
      </div>

      {/* Pending Bookings Alert */}
      {pendingBookings.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-700 dark:text-amber-400">
              {pendingBookings.length} Pending Booking{pendingBookings.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingBookings.slice(0, 3).map(booking => (
                <div key={booking.id} className="flex items-center justify-between bg-white dark:bg-background rounded-lg p-3 border">
                  <div>
                    <p className="font-medium text-sm">Booking #{booking.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.scheduledAt).toLocaleDateString()} at{" "}
                      {new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {" · "}{booking.duration} min · ${booking.amount}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => confirmBooking.mutate({ bookingId: booking.id })}
                    disabled={confirmBooking.isPending}
                  >
                    Confirm
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Form */}
      {showCreateForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Experience" : "Create New Experience"}</CardTitle>
            <CardDescription>
              Set up a virtual experience that fans can book and pay for. You host it on your preferred platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Experience Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Play COD With Me, Songwriting Session, 1-on-1 Workout"
                  className="mt-1"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what fans can expect from this experience..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Category */}
              <div>
                <Label>Category *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-2">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                          category === cat.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-muted hover:border-primary/50"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Duration *</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DURATIONS.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-all ${
                          duration === d
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted hover:border-primary/50"
                        }`}
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="price">Price per Person (USD) *</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="25.00"
                      className="pl-9"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Set to $0 for free experiences</p>
                </div>
              </div>

              {/* Capacity Type */}
              <div>
                <Label>Session Type *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => { setCapacityType("one_on_one"); setMaxAttendees(1); }}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      capacityType === "one_on_one"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <Users className="h-5 w-5 mb-1" />
                    <p className="font-medium text-sm">1-on-1</p>
                    <p className="text-xs text-muted-foreground">Private session with one fan</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCapacityType("small_group"); setMaxAttendees(5); }}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      capacityType === "small_group"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <Users className="h-5 w-5 mb-1" />
                    <p className="font-medium text-sm">Small Group</p>
                    <p className="text-xs text-muted-foreground">2-10 fans per session</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCapacityType("broadcast"); setMaxAttendees(100); }}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      capacityType === "broadcast"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <Zap className="h-5 w-5 mb-1" />
                    <p className="font-medium text-sm">Broadcast</p>
                    <p className="text-xs text-muted-foreground">Ticketed access, unlimited fans</p>
                  </button>
                </div>
              </div>

              {/* Max Attendees (for small group / broadcast) */}
              {capacityType !== "one_on_one" && (
                <div>
                  <Label htmlFor="maxAttendees">
                    Max Attendees {capacityType === "small_group" ? "(2-10)" : "(up to 1000)"}
                  </Label>
                  <Input
                    id="maxAttendees"
                    type="number"
                    min={capacityType === "small_group" ? 2 : 1}
                    max={capacityType === "small_group" ? 10 : 1000}
                    value={maxAttendees}
                    onChange={e => setMaxAttendees(parseInt(e.target.value) || 1)}
                    className="mt-1 w-32"
                  />
                </div>
              )}

              {/* Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Platform *</Label>
                  <select
                    value={platform}
                    onChange={e => setPlatform(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm"
                  >
                    {PLATFORMS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="platformLink">Platform Link</Label>
                  <Input
                    id="platformLink"
                    value={platformLink}
                    onChange={e => setPlatformLink(e.target.value)}
                    placeholder="https://discord.gg/... or leave blank"
                    className="mt-1"
                    disabled={linkSentAfterBooking}
                  />
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linkSentAfterBooking}
                      onChange={e => setLinkSentAfterBooking(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-muted-foreground">I'll send the link after booking is confirmed</span>
                  </label>
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="e.g., call of duty, warzone, competitive"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Help fans find your experience</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={createExperience.isPending || updateExperience.isPending}>
                  {editingId ? "Save Changes" : "Create Experience"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>

              {(createExperience.error || updateExperience.error) && (
                <p className="text-sm text-destructive">
                  {createExperience.error?.message || updateExperience.error?.message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* My Experiences List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">My Experiences</h2>
        {experiences.isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : !experiences.data?.length ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Video className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg">No experiences yet</h3>
              <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                Create your first Ology Live experience and start earning from virtual sessions with your fans.
              </p>
              <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Your First Experience
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {experiences.data.map(exp => {
              const catInfo = CATEGORIES.find(c => c.value === exp.category);
              const CatIcon = catInfo?.icon || Star;
              return (
                <Card key={exp.id} className={`relative ${!exp.isActive ? "opacity-60" : ""}`}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CatIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm leading-tight">{exp.title}</h3>
                          <p className="text-xs text-muted-foreground">{catInfo?.label || exp.category}</p>
                        </div>
                      </div>
                      <Badge variant={exp.isActive ? "default" : "secondary"} className="text-xs">
                        {exp.isActive ? "Active" : "Paused"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {exp.duration} min
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        ${exp.price}/person
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {exp.capacityType === "one_on_one" ? "1-on-1" :
                         exp.capacityType === "small_group" ? `Up to ${exp.maxAttendees}` : "Broadcast"}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {exp.totalBookings || 0} bookings
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(exp)}>
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive.mutate({ id: exp.id, isActive: !exp.isActive })}
                      >
                        {exp.isActive ? (
                          <><ToggleRight className="h-3.5 w-3.5 mr-1" /> Pause</>
                        ) : (
                          <><ToggleLeft className="h-3.5 w-3.5 mr-1" /> Activate</>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Delete this experience? This cannot be undone.")) {
                            deleteExperience.mutate({ id: exp.id });
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Confirmed Sessions */}
      {confirmedBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
          <div className="space-y-3">
            {confirmedBookings.slice(0, 5).map(booking => (
              <Card key={booking.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Session #{booking.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.scheduledAt).toLocaleDateString()} at{" "}
                        {new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {" · "}{booking.duration} min
                      </p>
                      {booking.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">Fan note: {booking.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-green-600 border-green-600">Confirmed</Badge>
                      <p className="text-sm font-medium mt-1">${booking.amount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
