/**
 * TouringSection - Artist touring availability management component.
 * Allows artists to toggle touring availability, set target regions,
 * date windows, travel radius, and tour type preferences.
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Calendar, Plane, X, Plus } from "lucide-react";
import { toast } from "sonner";

const US_REGIONS = [
  "Northeast", "Southeast", "Midwest", "Southwest", "West Coast",
  "Pacific Northwest", "Mountain West", "Mid-Atlantic", "New England",
  "Deep South", "Great Plains", "Texas", "Florida", "California",
  "New York", "Chicago", "Atlanta", "Nashville", "Los Angeles",
  "Miami", "Denver", "Portland", "Seattle", "Austin",
  "International"
];

const TOUR_TYPES = [
  { value: "headline", label: "Headline" },
  { value: "support", label: "Support Act" },
  { value: "festival", label: "Festival" },
  { value: "private", label: "Private Event" },
  { value: "corporate", label: "Corporate" },
  { value: "residency", label: "Residency" },
];

const TRAVEL_RADIUS_LABELS: Record<string, string> = {
  local: "Local (within 50 miles)",
  regional: "Regional (within 300 miles)",
  national: "National (anywhere in the US)",
  international: "International (worldwide)",
};

interface DateWindow {
  start: string;
  end: string;
}

export default function TouringSection() {
  const { data: touring, isLoading, refetch } = trpc.touring.getMyTouring.useQuery();
  const updateTouring = trpc.touring.updateMyTouring.useMutation({
    onSuccess: () => {
      toast.success("Touring availability updated!");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update touring availability");
    },
  });

  // Form state
  const [isAvailable, setIsAvailable] = useState(false);
  const [targetRegions, setTargetRegions] = useState<string[]>([]);
  const [homeBase, setHomeBase] = useState("");
  const [travelRadius, setTravelRadius] = useState<string>("regional");
  const [tourTypes, setTourTypes] = useState<string[]>([]);
  const [dateWindows, setDateWindows] = useState<DateWindow[]>([]);
  const [notes, setNotes] = useState("");
  const [customRegion, setCustomRegion] = useState("");

  // Populate form when data loads
  useEffect(() => {
    if (touring) {
      setIsAvailable(touring.isAvailable ?? false);
      setTargetRegions(Array.isArray(touring.targetRegions) ? touring.targetRegions : []);
      setHomeBase(touring.homeBase || "");
      setTravelRadius(touring.travelRadius || "regional");
      setTourTypes(Array.isArray(touring.tourTypes) ? touring.tourTypes : []);
      setDateWindows(Array.isArray(touring.dateWindows) ? touring.dateWindows : []);
      setNotes(touring.notes || "");
    }
  }, [touring]);

  const toggleRegion = (region: string) => {
    setTargetRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const addCustomRegion = () => {
    const trimmed = customRegion.trim();
    if (trimmed && !targetRegions.includes(trimmed)) {
      setTargetRegions((prev) => [...prev, trimmed]);
      setCustomRegion("");
    }
  };

  const toggleTourType = (type: string) => {
    setTourTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const addDateWindow = () => {
    setDateWindows((prev) => [...prev, { start: "", end: "" }]);
  };

  const updateDateWindow = (index: number, field: "start" | "end", value: string) => {
    setDateWindows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeDateWindow = (index: number) => {
    setDateWindows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Filter out incomplete date windows
    const validWindows = dateWindows.filter((w) => w.start && w.end);

    updateTouring.mutate({
      isAvailable,
      targetRegions,
      homeBase: homeBase.trim() || null,
      travelRadius: travelRadius as any,
      tourTypes,
      dateWindows: validWindows,
      notes: notes.trim() || null,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading touring settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-purple-600" />
          Touring Availability
        </CardTitle>
        <CardDescription>
          Let venues know you're available for touring. When enabled, your profile will show an "On Tour" badge and appear in touring filters.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Available for Touring</Label>
            <p className="text-sm text-muted-foreground">Show venues you're actively looking for tour dates</p>
          </div>
          <Switch
            checked={isAvailable}
            onCheckedChange={setIsAvailable}
          />
        </div>

        {isAvailable && (
          <>
            {/* Home Base */}
            <div>
              <Label htmlFor="homeBase">Home Base</Label>
              <Input
                id="homeBase"
                value={homeBase}
                onChange={(e) => setHomeBase(e.target.value)}
                placeholder="e.g., Nashville, TN"
              />
              <p className="text-xs text-muted-foreground mt-1">Your starting city for tour routing</p>
            </div>

            {/* Travel Radius */}
            <div>
              <Label>Travel Radius</Label>
              <Select value={travelRadius} onValueChange={setTravelRadius}>
                <SelectTrigger>
                  <SelectValue placeholder="Select travel radius" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRAVEL_RADIUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Regions */}
            <div>
              <Label>Target Regions</Label>
              <p className="text-xs text-muted-foreground mb-2">Select regions where you'd like to perform</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {US_REGIONS.map((region) => (
                  <Badge
                    key={region}
                    variant={targetRegions.includes(region) ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => toggleRegion(region)}
                  >
                    {region}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={customRegion}
                  onChange={(e) => setCustomRegion(e.target.value)}
                  placeholder="Add custom region..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomRegion())}
                />
                <Button variant="outline" size="sm" onClick={addCustomRegion}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {targetRegions.filter((r) => !US_REGIONS.includes(r)).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {targetRegions.filter((r) => !US_REGIONS.includes(r)).map((r) => (
                    <Badge key={r} variant="secondary" className="gap-1">
                      {r}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => toggleRegion(r)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Tour Types */}
            <div>
              <Label>Tour Types</Label>
              <p className="text-xs text-muted-foreground mb-2">What types of shows are you open to?</p>
              <div className="flex flex-wrap gap-2">
                {TOUR_TYPES.map(({ value, label }) => (
                  <Badge
                    key={value}
                    variant={tourTypes.includes(value) ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => toggleTourType(value)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Date Windows */}
            <div>
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Available Date Windows
              </Label>
              <p className="text-xs text-muted-foreground mb-2">When are you available to tour? (optional)</p>
              {dateWindows.map((window, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <Input
                    type="date"
                    value={window.start}
                    onChange={(e) => updateDateWindow(index, "start", e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    type="date"
                    value={window.end}
                    onChange={(e) => updateDateWindow(index, "end", e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeDateWindow(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addDateWindow} className="gap-1">
                <Plus className="h-4 w-4" /> Add Date Window
              </Button>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="touringNotes">Notes</Label>
              <Textarea
                id="touringNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional info for venues (e.g., 'Looking for 500+ cap rooms', 'Available for co-headline tours')"
                rows={3}
              />
            </div>
          </>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={updateTouring.isPending}
          className="w-full"
        >
          {updateTouring.isPending ? "Saving..." : "Save Touring Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}
