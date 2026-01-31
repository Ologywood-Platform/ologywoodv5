import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, Download, FileText } from 'lucide-react';

interface RiderData {
  eventName: string;
  eventDate: string;
  eventTime: string;
  performanceDuration: string;
  venueName: string;
  venueAddress: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  loadInTime: string;
  soundCheckTime: string;
  performanceFee: string;
  depositRequired: boolean;
  depositAmount: string;
  paymentMethod: string;
  technicalRequirements: string;
  hospitalityRequirements: string;
  specialRequests: string;
  cancellationPolicy: string;
}

interface RiderContractFormProps {
  onSave?: (data: RiderData) => void;
  initialData?: Partial<RiderData>;
  isLoading?: boolean;
}

export function RiderContractForm({ onSave, initialData, isLoading }: RiderContractFormProps) {
  const [formData, setFormData] = useState<RiderData>({
    eventName: initialData?.eventName || '',
    eventDate: initialData?.eventDate || '',
    eventTime: initialData?.eventTime || '',
    performanceDuration: initialData?.performanceDuration || '',
    venueName: initialData?.venueName || '',
    venueAddress: initialData?.venueAddress || '',
    contactPerson: initialData?.contactPerson || '',
    contactPhone: initialData?.contactPhone || '',
    contactEmail: initialData?.contactEmail || '',
    loadInTime: initialData?.loadInTime || '',
    soundCheckTime: initialData?.soundCheckTime || '',
    performanceFee: initialData?.performanceFee || '',
    depositRequired: initialData?.depositRequired || false,
    depositAmount: initialData?.depositAmount || '',
    paymentMethod: initialData?.paymentMethod || 'bank-transfer',
    technicalRequirements: initialData?.technicalRequirements || '',
    hospitalityRequirements: initialData?.hospitalityRequirements || '',
    specialRequests: initialData?.specialRequests || '',
    cancellationPolicy: initialData?.cancellationPolicy || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSave = () => {
    if (!formData.eventName || !formData.eventDate || !formData.performanceFee) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSave?.(formData);
    toast.success('Rider contract saved successfully');
  };

  const handleDownloadPDF = () => {
    // Generate PDF content
    const content = generatePDFContent(formData);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `rider-contract-${formData.eventName}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Rider contract downloaded');
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="event" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="event">Event</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="hospitality">Hospitality</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        {/* Event Details Tab */}
        <TabsContent value="event" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventName">Event Name *</Label>
                  <Input
                    id="eventName"
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleInputChange}
                    placeholder="e.g., Summer Concert Series"
                  />
                </div>
                <div>
                  <Label htmlFor="eventDate">Event Date *</Label>
                  <Input
                    id="eventDate"
                    name="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventTime">Event Time</Label>
                  <Input
                    id="eventTime"
                    name="eventTime"
                    type="time"
                    value={formData.eventTime}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="performanceDuration">Performance Duration (minutes)</Label>
                  <Input
                    id="performanceDuration"
                    name="performanceDuration"
                    type="number"
                    value={formData.performanceDuration}
                    onChange={handleInputChange}
                    placeholder="e.g., 60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="venueName">Venue Name</Label>
                  <Input
                    id="venueName"
                    name="venueName"
                    value={formData.venueName}
                    onChange={handleInputChange}
                    placeholder="Venue name"
                  />
                </div>
                <div>
                  <Label htmlFor="venueAddress">Venue Address</Label>
                  <Input
                    id="venueAddress"
                    name="venueAddress"
                    value={formData.venueAddress}
                    onChange={handleInputChange}
                    placeholder="Full address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="Name"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="loadInTime">Load-in Time</Label>
                  <Input
                    id="loadInTime"
                    name="loadInTime"
                    type="time"
                    value={formData.loadInTime}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="soundCheckTime">Sound Check Time</Label>
                  <Input
                    id="soundCheckTime"
                    name="soundCheckTime"
                    type="time"
                    value={formData.soundCheckTime}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Requirements Tab */}
        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="technicalRequirements">Technical Specifications</Label>
                <Textarea
                  id="technicalRequirements"
                  name="technicalRequirements"
                  value={formData.technicalRequirements}
                  onChange={handleInputChange}
                  placeholder="List all technical requirements (audio equipment, lighting, stage setup, etc.)"
                  rows={6}
                />
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Common Requirements</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="soundSystem" defaultChecked />
                    <Label htmlFor="soundSystem">PA System Required</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="lighting" defaultChecked />
                    <Label htmlFor="lighting">Stage Lighting Required</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="monitors" />
                    <Label htmlFor="monitors">Monitor Speakers Required</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="wireless" />
                    <Label htmlFor="wireless">Wireless Microphone System</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hospitality Requirements Tab */}
        <TabsContent value="hospitality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hospitality Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hospitalityRequirements">Hospitality Details</Label>
                <Textarea
                  id="hospitalityRequirements"
                  name="hospitalityRequirements"
                  value={formData.hospitalityRequirements}
                  onChange={handleInputChange}
                  placeholder="List all hospitality requirements (meals, dressing room, parking, accommodations, etc.)"
                  rows={6}
                />
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Common Hospitality Items</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="meals" defaultChecked />
                    <Label htmlFor="meals">Meals Provided</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="dressingRoom" defaultChecked />
                    <Label htmlFor="dressingRoom">Private Dressing Room</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="parking" defaultChecked />
                    <Label htmlFor="parking">Complimentary Parking</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="hotel" />
                    <Label htmlFor="hotel">Hotel Accommodation</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Terms Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="performanceFee">Performance Fee (USD) *</Label>
                  <Input
                    id="performanceFee"
                    name="performanceFee"
                    type="number"
                    value={formData.performanceFee}
                    onChange={handleInputChange}
                    placeholder="e.g., 500"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="bank-transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="cash">Cash</option>
                    <option value="credit-card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="depositRequired"
                    checked={formData.depositRequired}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('depositRequired', checked as boolean)
                    }
                  />
                  <Label htmlFor="depositRequired">Deposit Required</Label>
                </div>

                {formData.depositRequired && (
                  <div>
                    <Label htmlFor="depositAmount">Deposit Amount (USD)</Label>
                    <Input
                      id="depositAmount"
                      name="depositAmount"
                      type="number"
                      value={formData.depositAmount}
                      onChange={handleInputChange}
                      placeholder="e.g., 125 (25% of total)"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                <Textarea
                  id="cancellationPolicy"
                  name="cancellationPolicy"
                  value={formData.cancellationPolicy}
                  onChange={handleInputChange}
                  placeholder="Describe cancellation terms for both artist and venue"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Special Requests Section */}
      <Card>
        <CardHeader>
          <CardTitle>Special Requests & Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleInputChange}
            placeholder="Any additional requirements, preferences, or special instructions"
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={handleDownloadPDF}
          disabled={isLoading}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Rider Contract'}
        </Button>
      </div>
    </div>
  );
}

function generatePDFContent(data: RiderData): string {
  return `
ARTIST RIDER CONTRACT
Generated by Ologywood

EVENT DETAILS
Event Name: ${data.eventName}
Date: ${data.eventDate}
Time: ${data.eventTime}
Duration: ${data.performanceDuration} minutes

VENUE INFORMATION
Venue: ${data.venueName}
Address: ${data.venueAddress}
Contact: ${data.contactPerson}
Phone: ${data.contactPhone}
Email: ${data.contactEmail}

TIMING
Load-in Time: ${data.loadInTime}
Sound Check Time: ${data.soundCheckTime}

FINANCIAL TERMS
Performance Fee: $${data.performanceFee}
Payment Method: ${data.paymentMethod}
Deposit Required: ${data.depositRequired ? `Yes - $${data.depositAmount}` : 'No'}

CANCELLATION POLICY
${data.cancellationPolicy}

TECHNICAL REQUIREMENTS
${data.technicalRequirements}

HOSPITALITY REQUIREMENTS
${data.hospitalityRequirements}

SPECIAL REQUESTS & NOTES
${data.specialRequests}

---
This contract was generated by Ologywood Artist Booking Platform
Date Generated: ${new Date().toLocaleDateString()}
  `;
}
