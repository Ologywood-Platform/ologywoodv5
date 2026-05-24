import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Eye } from "lucide-react";
import { toast } from "sonner";

export interface RiderContractData {
  // Booking Details
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;

  // Artist Info
  artistName: string;
  artistFee: number;
  performanceDuration: number;
  soundCheckTime: string;

  // Technical
  soundSystem: string;
  backlineEquipment: string;

  // Hospitality
  dressingRoomRequired: boolean;
  mealProvision: boolean;
  parkingProvided: boolean;
  guestListAllowed: number;

  // Terms
  cancellationPolicy: string;
  additionalNotes: string;
}

interface RiderContractTemplateProps {
  initialData?: Partial<RiderContractData> & { venueAddress?: string; stageSize?: string; lightingRequired?: boolean; soundSystemProvided?: boolean; backlineEquipment?: string[] | string; securityRequired?: boolean; mealProvision?: string | boolean };
  onSave?: (data: RiderContractData) => void;
  readOnly?: boolean;
}

export function RiderContractTemplate({
  initialData,
  onSave,
  readOnly = false
}: RiderContractTemplateProps) {
  const [formData, setFormData] = useState<RiderContractData>({
    eventName: initialData?.eventName || "",
    eventDate: initialData?.eventDate || "",
    eventTime: initialData?.eventTime || "",
    venue: initialData?.venue || "",
    artistName: initialData?.artistName || "",
    artistFee: initialData?.artistFee || 0,
    performanceDuration: initialData?.performanceDuration || 60,
    soundCheckTime: initialData?.soundCheckTime || "30 min before",
    soundSystem: "Venue provides",
    backlineEquipment: Array.isArray(initialData?.backlineEquipment)
      ? initialData.backlineEquipment.join(", ")
      : (initialData?.backlineEquipment as string) || "",
    dressingRoomRequired: initialData?.dressingRoomRequired || false,
    mealProvision: typeof initialData?.mealProvision === 'boolean' ? initialData.mealProvision : !!initialData?.mealProvision,
    parkingProvided: initialData?.parkingProvided ?? true,
    guestListAllowed: initialData?.guestListAllowed || 2,
    cancellationPolicy: initialData?.cancellationPolicy || "Full refund 14+ days out, 50% within 14 days",
    additionalNotes: initialData?.additionalNotes || "",
  });

  const handleChange = (field: keyof RiderContractData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.eventName || !formData.artistName) {
      toast.error("Please fill in event name and artist name");
      return;
    }
    onSave?.(formData);
    toast.success("Rider saved");
  };

  const generateText = (): string => {
    return `BOOKING RIDER CONTRACT
========================================

BOOKING DETAILS
Event: ${formData.eventName}
Date: ${formData.eventDate}
Time: ${formData.eventTime}
Venue: ${formData.venue}

ARTIST
Name: ${formData.artistName}
Fee: $${formData.artistFee}
Set Length: ${formData.performanceDuration} minutes
Soundcheck: ${formData.soundCheckTime}

TECHNICAL
Sound/PA: ${formData.soundSystem}
Backline: ${formData.backlineEquipment || 'None specified'}

HOSPITALITY
Green Room: ${formData.dressingRoomRequired ? 'Yes' : 'No'}
Meal: ${formData.mealProvision ? 'Yes' : 'No'}
Parking: ${formData.parkingProvided ? 'Yes' : 'No'}
Guest List: ${formData.guestListAllowed} spots

TERMS
Cancellation: ${formData.cancellationPolicy}
Notes: ${formData.additionalNotes || 'None'}

Generated ${new Date().toLocaleDateString()}
`;
  };

  const downloadRider = () => {
    const blob = new Blob([generateText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rider-${formData.artistName || 'contract'}-${formData.eventDate || 'draft'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Rider downloaded");
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Booking Rider
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Booking Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Booking Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Event Name *</Label>
              <Input value={formData.eventName} onChange={(e) => handleChange("eventName", e.target.value)} placeholder="Event name" disabled={readOnly} />
            </div>
            <div>
              <Label className="text-xs">Venue</Label>
              <Input value={formData.venue} onChange={(e) => handleChange("venue", e.target.value)} placeholder="Venue name" disabled={readOnly} />
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <input type="date" value={formData.eventDate} onChange={(e) => handleChange("eventDate", e.target.value)} disabled={readOnly} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50" />
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <input type="time" value={formData.eventTime} onChange={(e) => handleChange("eventTime", e.target.value)} disabled={readOnly} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50" />
            </div>
          </div>
        </div>

        {/* Artist */}
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Artist</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Artist Name *</Label>
              <Input value={formData.artistName} onChange={(e) => handleChange("artistName", e.target.value)} placeholder="Artist or band name" disabled={readOnly} />
            </div>
            <div>
              <Label className="text-xs">Fee ($)</Label>
              <Input type="number" value={formData.artistFee} onChange={(e) => handleChange("artistFee", parseFloat(e.target.value) || 0)} disabled={readOnly} />
            </div>
            <div>
              <Label className="text-xs">Set Length (min)</Label>
              <Input type="number" value={formData.performanceDuration} onChange={(e) => handleChange("performanceDuration", parseInt(e.target.value) || 60)} disabled={readOnly} />
            </div>
            <div>
              <Label className="text-xs">Soundcheck</Label>
              <Input value={formData.soundCheckTime} onChange={(e) => handleChange("soundCheckTime", e.target.value)} placeholder="30 min before" disabled={readOnly} />
            </div>
          </div>
        </div>

        {/* Technical */}
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Technical</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Sound / PA</Label>
              <select value={formData.soundSystem} onChange={(e) => handleChange("soundSystem", e.target.value)} disabled={readOnly} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                <option>Venue provides</option>
                <option>I bring my own</option>
                <option>Not needed</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Backline / Equipment Needed</Label>
              <Textarea value={formData.backlineEquipment} onChange={(e) => handleChange("backlineEquipment", e.target.value)} placeholder="List any gear venue needs to provide" rows={2} disabled={readOnly} />
            </div>
          </div>
        </div>

        {/* Hospitality */}
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Hospitality</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Checkbox id="greenRoom" checked={formData.dressingRoomRequired} onCheckedChange={(c) => handleChange("dressingRoomRequired", !!c)} disabled={readOnly} />
              <Label htmlFor="greenRoom" className="text-sm cursor-pointer">Green Room</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="meal" checked={formData.mealProvision} onCheckedChange={(c) => handleChange("mealProvision", !!c)} disabled={readOnly} />
              <Label htmlFor="meal" className="text-sm cursor-pointer">Meal Provided</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="parking" checked={formData.parkingProvided} onCheckedChange={(c) => handleChange("parkingProvided", !!c)} disabled={readOnly} />
              <Label htmlFor="parking" className="text-sm cursor-pointer">Parking</Label>
            </div>
            <div>
              <Label className="text-xs">Guest List</Label>
              <Input type="number" value={formData.guestListAllowed} onChange={(e) => handleChange("guestListAllowed", parseInt(e.target.value) || 0)} disabled={readOnly} className="w-20" />
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Terms</h4>
          <div>
            <Label className="text-xs">Cancellation Policy</Label>
            <select value={formData.cancellationPolicy} onChange={(e) => handleChange("cancellationPolicy", e.target.value)} disabled={readOnly} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
              <option>Full refund 14+ days out, 50% within 14 days</option>
              <option>Full refund 30+ days out, no refund within 30 days</option>
              <option>Non-refundable</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Additional Notes</Label>
            <Textarea value={formData.additionalNotes} onChange={(e) => handleChange("additionalNotes", e.target.value)} placeholder="Anything else" rows={2} disabled={readOnly} />
          </div>
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="flex gap-2 justify-end border-t pt-4">
            <Button variant="outline" size="sm" onClick={downloadRider}>
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </Button>
            <Button size="sm" onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
              Save Rider
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
