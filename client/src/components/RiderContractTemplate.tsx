import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Eye } from "lucide-react";
import { toast } from "sonner";

export interface RiderContractData {
  // Event Details
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  venueAddress: string;
  
  // Artist Requirements
  artistName: string;
  artistFee: number;
  performanceDuration: number; // in minutes
  soundCheckTime: string;
  
  // Technical Requirements
  stageSize: string;
  lightingRequired: boolean;
  soundSystemProvided: boolean;
  backlineEquipment: string[];
  
  // Hospitality Requirements
  dressingRoomRequired: boolean;
  mealProvision: string;
  parkingProvided: boolean;
  securityRequired: boolean;
  guestListAllowed: number;
  
  // Additional Terms
  cancellationPolicy: string;
  additionalNotes: string;
}

interface RiderContractTemplateProps {
  initialData?: Partial<RiderContractData>;
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
    venueAddress: initialData?.venueAddress || "",
    artistName: initialData?.artistName || "",
    artistFee: initialData?.artistFee || 0,
    performanceDuration: initialData?.performanceDuration || 60,
    soundCheckTime: initialData?.soundCheckTime || "1 hour before",
    stageSize: initialData?.stageSize || "Medium (20x20ft)",
    lightingRequired: initialData?.lightingRequired || false,
    soundSystemProvided: initialData?.soundSystemProvided || true,
    backlineEquipment: initialData?.backlineEquipment || [],
    dressingRoomRequired: initialData?.dressingRoomRequired || true,
    mealProvision: initialData?.mealProvision || "Catered meals for band",
    parkingProvided: initialData?.parkingProvided || true,
    securityRequired: initialData?.securityRequired || false,
    guestListAllowed: initialData?.guestListAllowed || 5,
    cancellationPolicy: initialData?.cancellationPolicy || "50% refund if cancelled within 2 weeks",
    additionalNotes: initialData?.additionalNotes || "",
  });

  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (field: keyof RiderContractData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field: keyof RiderContractData) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  const handleSave = () => {
    if (!formData.eventName || !formData.artistName || !formData.venue) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSave?.(formData);
    toast.success("Rider contract saved successfully");
  };

  const downloadPDF = () => {
    // Generate PDF content
    const pdfContent = generatePDFContent(formData);
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(pdfContent));
    element.setAttribute("download", `rider-${formData.artistName}-${formData.eventDate}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Rider contract downloaded");
  };

  const generatePDFContent = (data: RiderContractData): string => {
    return `
ARTIST RIDER CONTRACT
=====================

EVENT DETAILS
Event Name: ${data.eventName}
Date: ${data.eventDate}
Time: ${data.eventTime}
Venue: ${data.venue}
Address: ${data.venueAddress}

ARTIST INFORMATION
Artist Name: ${data.artistName}
Performance Fee: $${data.artistFee}
Performance Duration: ${data.performanceDuration} minutes
Sound Check Time: ${data.soundCheckTime}

TECHNICAL REQUIREMENTS
Stage Size: ${data.stageSize}
Lighting Required: ${data.lightingRequired ? "Yes" : "No"}
Sound System Provided: ${data.soundSystemProvided ? "Yes" : "No"}
Backline Equipment: ${data.backlineEquipment.join(", ") || "None specified"}

HOSPITALITY REQUIREMENTS
Dressing Room Required: ${data.dressingRoomRequired ? "Yes" : "No"}
Meal Provision: ${data.mealProvision}
Parking Provided: ${data.parkingProvided ? "Yes" : "No"}
Security Required: ${data.securityRequired ? "Yes" : "No"}
Guest List Allowed: ${data.guestListAllowed} guests

ADDITIONAL TERMS
Cancellation Policy: ${data.cancellationPolicy}
Additional Notes: ${data.additionalNotes}

---
Generated on ${new Date().toLocaleDateString()}
    `;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Artist Rider Contract
          </CardTitle>
          <CardDescription>
            Create and manage essential booking requirements and terms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="space-y-6">
              {/* Event Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Event Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventName">Event Name *</Label>
                    <Input
                      id="eventName"
                      value={formData.eventName}
                      onChange={(e) => handleInputChange("eventName", e.target.value)}
                      placeholder="e.g., Summer Music Festival"
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventDate">Event Date *</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => handleInputChange("eventDate", e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventTime">Event Time</Label>
                    <Input
                      id="eventTime"
                      type="time"
                      value={formData.eventTime}
                      onChange={(e) => handleInputChange("eventTime", e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="venue">Venue Name *</Label>
                    <Input
                      id="venue"
                      value={formData.venue}
                      onChange={(e) => handleInputChange("venue", e.target.value)}
                      placeholder="e.g., The Grand Theater"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="venueAddress">Venue Address</Label>
                    <Input
                      id="venueAddress"
                      value={formData.venueAddress}
                      onChange={(e) => handleInputChange("venueAddress", e.target.value)}
                      placeholder="Full venue address"
                      disabled={readOnly}
                    />
                  </div>
                </div>
              </div>

              {/* Artist Requirements Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Artist Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="artistName">Artist Name *</Label>
                    <Input
                      id="artistName"
                      value={formData.artistName}
                      onChange={(e) => handleInputChange("artistName", e.target.value)}
                      placeholder="Artist or band name"
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="artistFee">Performance Fee ($)</Label>
                    <Input
                      id="artistFee"
                      type="number"
                      value={formData.artistFee}
                      onChange={(e) => handleInputChange("artistFee", parseFloat(e.target.value))}
                      placeholder="0"
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="performanceDuration">Performance Duration (minutes)</Label>
                    <Input
                      id="performanceDuration"
                      type="number"
                      value={formData.performanceDuration}
                      onChange={(e) => handleInputChange("performanceDuration", parseInt(e.target.value))}
                      placeholder="60"
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="soundCheckTime">Sound Check Time</Label>
                    <Input
                      id="soundCheckTime"
                      value={formData.soundCheckTime}
                      onChange={(e) => handleInputChange("soundCheckTime", e.target.value)}
                      placeholder="e.g., 1 hour before"
                      disabled={readOnly}
                    />
                  </div>
                </div>
              </div>

              {/* Technical Requirements Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Technical Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stageSize">Stage Size</Label>
                    <Input
                      id="stageSize"
                      value={formData.stageSize}
                      onChange={(e) => handleInputChange("stageSize", e.target.value)}
                      placeholder="e.g., Medium (20x20ft)"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Equipment Needs</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="lightingRequired"
                          checked={formData.lightingRequired}
                          onCheckedChange={() => handleCheckboxChange("lightingRequired")}
                          disabled={readOnly}
                        />
                        <Label htmlFor="lightingRequired" className="font-normal cursor-pointer">
                          Professional Lighting Required
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="soundSystemProvided"
                          checked={formData.soundSystemProvided}
                          onCheckedChange={() => handleCheckboxChange("soundSystemProvided")}
                          disabled={readOnly}
                        />
                        <Label htmlFor="soundSystemProvided" className="font-normal cursor-pointer">
                          Sound System Provided by Venue
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="backlineEquipment">Backline Equipment (comma-separated)</Label>
                    <Input
                      id="backlineEquipment"
                      value={formData.backlineEquipment.join(", ")}
                      onChange={(e) => handleInputChange("backlineEquipment", e.target.value.split(",").map(s => s.trim()))}
                      placeholder="e.g., Drum kit, Bass amp, Guitar amp"
                      disabled={readOnly}
                    />
                  </div>
                </div>
              </div>

              {/* Hospitality Requirements Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Hospitality Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Accommodations</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="dressingRoomRequired"
                          checked={formData.dressingRoomRequired}
                          onCheckedChange={() => handleCheckboxChange("dressingRoomRequired")}
                          disabled={readOnly}
                        />
                        <Label htmlFor="dressingRoomRequired" className="font-normal cursor-pointer">
                          Dressing Room Required
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="parkingProvided"
                          checked={formData.parkingProvided}
                          onCheckedChange={() => handleCheckboxChange("parkingProvided")}
                          disabled={readOnly}
                        />
                        <Label htmlFor="parkingProvided" className="font-normal cursor-pointer">
                          Parking Provided
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="securityRequired"
                          checked={formData.securityRequired}
                          onCheckedChange={() => handleCheckboxChange("securityRequired")}
                          disabled={readOnly}
                        />
                        <Label htmlFor="securityRequired" className="font-normal cursor-pointer">
                          Security Required
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="mealProvision">Meal Provision</Label>
                    <Input
                      id="mealProvision"
                      value={formData.mealProvision}
                      onChange={(e) => handleInputChange("mealProvision", e.target.value)}
                      placeholder="e.g., Catered meals for band"
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="guestListAllowed">Guest List Allowed (number of guests)</Label>
                    <Input
                      id="guestListAllowed"
                      type="number"
                      value={formData.guestListAllowed}
                      onChange={(e) => handleInputChange("guestListAllowed", parseInt(e.target.value))}
                      placeholder="5"
                      disabled={readOnly}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Terms Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Additional Terms</h3>
                <div>
                  <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                  <Textarea
                    id="cancellationPolicy"
                    value={formData.cancellationPolicy}
                    onChange={(e) => handleInputChange("cancellationPolicy", e.target.value)}
                    placeholder="Describe cancellation terms and refund policy"
                    rows={3}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="additionalNotes">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                    placeholder="Any other special requirements or notes"
                    rows={3}
                    disabled={readOnly}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {!readOnly && (
                <div className="flex gap-2 justify-end border-t pt-4">
                  <Button variant="outline" onClick={() => setShowPreview(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button onClick={downloadPDF} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={handleSave}>Save Rider</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="bg-muted p-6 rounded-lg whitespace-pre-wrap font-mono text-sm overflow-auto max-h-96">
                {generatePDFContent(formData)}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => downloadPDF()}>
                  <Download className="h-4 w-4 mr-2" />
                  Download as Text
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
