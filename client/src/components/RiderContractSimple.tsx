import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Save, Download } from 'lucide-react';
import { toast } from 'sonner';

interface RiderItem {
  id: string;
  label: string;
  required: boolean;
}

interface RiderContract {
  artistName: string;
  eventDate: string;
  eventLocation: string;
  performanceFee: string;
  
  // Simple checklist
  items: RiderItem[];
  
  // Notes
  specialRequests: string;
  contactInfo: string;
}

const DEFAULT_ITEMS: RiderItem[] = [
  { id: 'pa', label: 'PA System', required: false },
  { id: 'lights', label: 'Stage Lighting', required: false },
  { id: 'dressing', label: 'Dressing Room', required: false },
  { id: 'catering', label: 'Catering/Food', required: false },
  { id: 'parking', label: 'Parking', required: false },
  { id: 'soundcheck', label: 'Soundcheck Time', required: true },
  { id: 'setup', label: 'Setup Time', required: true },
];

export function RiderContractSimple() {
  const [contract, setContract] = useState<RiderContract>({
    artistName: '',
    eventDate: '',
    eventLocation: '',
    performanceFee: '',
    items: DEFAULT_ITEMS,
    specialRequests: '',
    contactInfo: '',
  });

  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (field: keyof Omit<RiderContract, 'items'>, value: string) => {
    setContract(prev => ({ ...prev, [field]: value }));
  };

  const handleItemToggle = (itemId: string) => {
    setContract(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, required: !item.required } : item
      ),
    }));
  };

  const handleSave = () => {
    if (!contract.artistName.trim()) {
      toast.error('Artist name is required');
      return;
    }
    toast.success('Rider contract saved');
  };

  const handleDownload = () => {
    const text = generateRiderText();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', `rider-${contract.artistName}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Rider downloaded');
  };

  const generateRiderText = () => {
    const requiredItems = contract.items.filter(i => i.required).map(i => i.label).join('\n- ');
    const optionalItems = contract.items.filter(i => !i.required).map(i => i.label).join('\n- ');

    return `RIDER CONTRACT
================

Artist: ${contract.artistName}
Date: ${contract.eventDate}
Location: ${contract.eventLocation}
Fee: ${contract.performanceFee}

REQUIRED ITEMS:
- ${requiredItems || 'None'}

OPTIONAL ITEMS:
- ${optionalItems || 'None'}

SPECIAL REQUESTS:
${contract.specialRequests || 'None'}

CONTACT:
${contract.contactInfo || 'Not provided'}
`;
  };

  if (showPreview) {
    return (
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Rider Preview</CardTitle>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap font-mono overflow-auto max-h-96">
            {generateRiderText()}
          </pre>
          <div className="flex gap-3 mt-6">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download as Text
            </Button>
            <Button onClick={() => setShowPreview(false)} variant="outline" className="flex-1">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Create Rider Contract</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="font-semibold">Event Details</h3>
          
          <div>
            <Label htmlFor="artistName">Artist Name *</Label>
            <Input
              id="artistName"
              value={contract.artistName}
              onChange={(e) => handleInputChange('artistName', e.target.value)}
              placeholder="Your stage name"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eventDate">Event Date</Label>
              <Input
                id="eventDate"
                type="date"
                value={contract.eventDate}
                onChange={(e) => handleInputChange('eventDate', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="performanceFee">Performance Fee</Label>
              <Input
                id="performanceFee"
                placeholder="e.g., $500"
                value={contract.performanceFee}
                onChange={(e) => handleInputChange('performanceFee', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="eventLocation">Event Location</Label>
            <Input
              id="eventLocation"
              placeholder="Venue name and city"
              value={contract.eventLocation}
              onChange={(e) => handleInputChange('eventLocation', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Requirements Checklist */}
        <div className="space-y-3">
          <h3 className="font-semibold">Requirements</h3>
          <p className="text-sm text-gray-600">Check items you require for your performance</p>
          
          <div className="space-y-2">
            {contract.items.map(item => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox
                  id={item.id}
                  checked={item.required}
                  onCheckedChange={() => handleItemToggle(item.id)}
                />
                <Label htmlFor={item.id} className="cursor-pointer flex-1">
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Special Requests */}
        <div className="space-y-4">
          <h3 className="font-semibold">Additional Info</h3>
          
          <div>
            <Label htmlFor="specialRequests">Special Requests</Label>
            <Textarea
              id="specialRequests"
              value={contract.specialRequests}
              onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              placeholder="Any special requirements or notes..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="contactInfo">Contact Information</Label>
            <Input
              id="contactInfo"
              placeholder="Phone number or email"
              value={contract.contactInfo}
              onChange={(e) => handleInputChange('contactInfo', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button onClick={() => setShowPreview(true)} variant="outline" className="flex-1">
            Preview & Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
