import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface SimpleRiderData {
  templateName: string;
  performanceType: string;
  duration: number;
  setupTime: number;
  
  // Technical - Essential only
  paSystem: boolean;
  lighting: boolean;
  ownEquipment: boolean;
  equipmentList?: string;
  
  // Hospitality - Essential only
  dressingRoom: boolean;
  catering: boolean;
  parking: boolean;
  
  // Special requests
  specialRequests?: string;
  emergencyContact?: string;
}

interface SimpleRiderTemplateProps {
  onSave?: (data: SimpleRiderData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function SimpleRiderTemplate({
  onSave,
  onCancel,
  isLoading = false,
}: SimpleRiderTemplateProps) {
  const [formData, setFormData] = useState<SimpleRiderData>({
    templateName: '',
    performanceType: 'concert',
    duration: 60,
    setupTime: 30,
    paSystem: false,
    lighting: false,
    ownEquipment: false,
    dressingRoom: false,
    catering: false,
    parking: false,
  });

  const handleInputChange = (field: keyof SimpleRiderData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.templateName.trim()) {
      toast.error('Template name is required');
      return;
    }
    onSave?.(formData);
    toast.success('Rider template saved');
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Create Rider Template</CardTitle>
            <CardDescription>Simple requirements for your performances</CardDescription>
          </div>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Basic Information</h3>
          
          <div>
            <Label htmlFor="templateName">Template Name *</Label>
            <Input
              id="templateName"
              value={formData.templateName}
              onChange={(e) => handleInputChange('templateName', e.target.value)}
              placeholder="e.g., Standard Setup"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="performanceType">Performance Type</Label>
              <select
                id="performanceType"
                value={formData.performanceType}
                onChange={(e) => handleInputChange('performanceType', e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="concert">Concert</option>
                <option value="dj_set">DJ Set</option>
                <option value="workshop">Workshop</option>
                <option value="private_event">Private Event</option>
              </select>
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="setupTime">Setup Time (minutes)</Label>
            <Input
              id="setupTime"
              type="number"
              value={formData.setupTime}
              onChange={(e) => handleInputChange('setupTime', parseInt(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>

        {/* Technical Requirements */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Technical Requirements</h3>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="paSystem"
                checked={formData.paSystem}
                onCheckedChange={(checked) => handleInputChange('paSystem', checked)}
              />
              <Label htmlFor="paSystem" className="cursor-pointer">PA System Required</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="lighting"
                checked={formData.lighting}
                onCheckedChange={(checked) => handleInputChange('lighting', checked)}
              />
              <Label htmlFor="lighting" className="cursor-pointer">Lighting Required</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ownEquipment"
                checked={formData.ownEquipment}
                onCheckedChange={(checked) => handleInputChange('ownEquipment', checked)}
              />
              <Label htmlFor="ownEquipment" className="cursor-pointer">Bringing Own Equipment</Label>
            </div>
          </div>

          {formData.ownEquipment && (
            <div>
              <Label htmlFor="equipmentList">Equipment List</Label>
              <Textarea
                id="equipmentList"
                value={formData.equipmentList || ''}
                onChange={(e) => handleInputChange('equipmentList', e.target.value)}
                placeholder="List your equipment..."
                className="mt-1"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Hospitality */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Hospitality</h3>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dressingRoom"
                checked={formData.dressingRoom}
                onCheckedChange={(checked) => handleInputChange('dressingRoom', checked)}
              />
              <Label htmlFor="dressingRoom" className="cursor-pointer">Dressing Room Required</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="catering"
                checked={formData.catering}
                onCheckedChange={(checked) => handleInputChange('catering', checked)}
              />
              <Label htmlFor="catering" className="cursor-pointer">Catering/Food Required</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="parking"
                checked={formData.parking}
                onCheckedChange={(checked) => handleInputChange('parking', checked)}
              />
              <Label htmlFor="parking" className="cursor-pointer">Parking Required</Label>
            </div>
          </div>
        </div>

        {/* Special Requests */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Additional Info</h3>
          
          <div>
            <Label htmlFor="specialRequests">Special Requests</Label>
            <Textarea
              id="specialRequests"
              value={formData.specialRequests || ''}
              onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              placeholder="Any special requirements or notes..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="emergencyContact">Emergency Contact</Label>
            <Input
              id="emergencyContact"
              value={formData.emergencyContact || ''}
              onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
              placeholder="Phone number or email"
              className="mt-1"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
