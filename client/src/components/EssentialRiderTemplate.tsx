import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface EssentialRiderData {
  templateName: string;
  description?: string;

  // Event Details
  performanceType: string; // concert, dj, acoustic, band, etc.
  performanceDuration: number; // in minutes
  setupTimeRequired: number; // in minutes
  soundcheckTimeRequired?: number; // in minutes

  // Technical Requirements - Essential Only
  paSystemRequired: boolean;
  lightingRequired: boolean;
  microphoneCount?: number;
  monitorMixRequired: boolean;
  stageDimensions?: string;
  powerRequirements?: string;
  bringingOwnEquipment: boolean;
  equipmentList?: string;

  // Hospitality - Essential Only
  dressingRoomRequired: boolean;
  cateringProvided: boolean;
  dietaryRestrictions?: string;
  parkingRequired: boolean;
  numberOfPerformers?: number;

  // Financial
  performanceFee: number;
  feeType: 'fixed' | 'percentage'; // fixed fee or percentage of ticket sales
  paymentMethod: 'bank_transfer' | 'check' | 'cash' | 'paypal';
  paymentTiming: 'upon_booking' | 'before_event' | 'after_event';
  depositRequired: boolean;
  depositAmount?: number;

  // Special Requests
  specialRequests?: string;
  cancellationPolicy?: string;
  emergencyContact?: string;
}

interface EssentialRiderTemplateProps {
  onSave?: (data: EssentialRiderData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  initialData?: EssentialRiderData;
}

export function EssentialRiderTemplate({
  onSave,
  onCancel,
  isLoading = false,
  initialData,
}: EssentialRiderTemplateProps) {
  const [formData, setFormData] = useState<EssentialRiderData>(
    initialData || {
      templateName: '',
      performanceType: 'concert',
      performanceDuration: 60,
      setupTimeRequired: 30,
      paSystemRequired: true,
      lightingRequired: false,
      monitorMixRequired: false,
      bringingOwnEquipment: false,
      dressingRoomRequired: false,
      cateringProvided: false,
      parkingRequired: true,
      performanceFee: 500,
      feeType: 'fixed',
      paymentMethod: 'bank_transfer',
      paymentTiming: 'before_event',
      depositRequired: false,
    }
  );

  const handleInputChange = (field: keyof EssentialRiderData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.templateName.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (formData.performanceFee <= 0) {
      toast.error('Performance fee must be greater than 0');
      return;
    }
    onSave?.(formData);
  };

  return (
    <Card className="w-full">
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

      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="hospitality">Hospitality</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="special">Special</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label htmlFor="templateName">Template Name *</Label>
              <Input
                id="templateName"
                value={formData.templateName}
                onChange={(e) => handleInputChange('templateName', e.target.value)}
                placeholder="e.g., Standard Concert Setup"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of this rider template"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="performanceType">Performance Type *</Label>
                <Select value={formData.performanceType} onValueChange={(value) => handleInputChange('performanceType', value)}>
                  <SelectTrigger id="performanceType" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concert">Concert</SelectItem>
                    <SelectItem value="dj">DJ</SelectItem>
                    <SelectItem value="acoustic">Acoustic</SelectItem>
                    <SelectItem value="band">Band</SelectItem>
                    <SelectItem value="solo">Solo</SelectItem>
                    <SelectItem value="corporate">Corporate Event</SelectItem>
                    <SelectItem value="festival">Festival</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="performanceDuration">Performance Duration (minutes) *</Label>
                <Input
                  id="performanceDuration"
                  type="number"
                  value={formData.performanceDuration}
                  onChange={(e) => handleInputChange('performanceDuration', parseInt(e.target.value))}
                  min="15"
                  max="480"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="setupTimeRequired">Setup Time (minutes)</Label>
                <Input
                  id="setupTimeRequired"
                  type="number"
                  value={formData.setupTimeRequired}
                  onChange={(e) => handleInputChange('setupTimeRequired', parseInt(e.target.value))}
                  min="15"
                  max="240"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="soundcheckTimeRequired">Soundcheck Time (minutes)</Label>
                <Input
                  id="soundcheckTimeRequired"
                  type="number"
                  value={formData.soundcheckTimeRequired || 0}
                  onChange={(e) => handleInputChange('soundcheckTimeRequired', parseInt(e.target.value))}
                  min="0"
                  max="120"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="numberOfPerformers">Number of Performers</Label>
              <Input
                id="numberOfPerformers"
                type="number"
                value={formData.numberOfPerformers || 1}
                onChange={(e) => handleInputChange('numberOfPerformers', parseInt(e.target.value))}
                min="1"
                max="50"
                className="mt-1"
              />
            </div>
          </TabsContent>

          {/* Technical Requirements Tab */}
          <TabsContent value="technical" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="paSystemRequired"
                  checked={formData.paSystemRequired}
                  onCheckedChange={(checked) => handleInputChange('paSystemRequired', checked)}
                />
                <Label htmlFor="paSystemRequired">PA System Required</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lightingRequired"
                  checked={formData.lightingRequired}
                  onCheckedChange={(checked) => handleInputChange('lightingRequired', checked)}
                />
                <Label htmlFor="lightingRequired">Lighting Required</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="monitorMixRequired"
                  checked={formData.monitorMixRequired}
                  onCheckedChange={(checked) => handleInputChange('monitorMixRequired', checked)}
                />
                <Label htmlFor="monitorMixRequired">Monitor Mix Required</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bringingOwnEquipment"
                  checked={formData.bringingOwnEquipment}
                  onCheckedChange={(checked) => handleInputChange('bringingOwnEquipment', checked)}
                />
                <Label htmlFor="bringingOwnEquipment">Bringing Own Equipment</Label>
              </div>
            </div>

            {formData.bringingOwnEquipment && (
              <div>
                <Label htmlFor="equipmentList">Equipment List</Label>
                <Textarea
                  id="equipmentList"
                  value={formData.equipmentList || ''}
                  onChange={(e) => handleInputChange('equipmentList', e.target.value)}
                  placeholder="List equipment you'll be bringing (e.g., turntables, mixer, cables, etc.)"
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="microphoneCount">Number of Microphones Needed</Label>
              <Input
                id="microphoneCount"
                type="number"
                value={formData.microphoneCount || 1}
                onChange={(e) => handleInputChange('microphoneCount', parseInt(e.target.value))}
                min="0"
                max="10"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="stageDimensions">Stage Dimensions (e.g., 20x15 ft)</Label>
              <Input
                id="stageDimensions"
                value={formData.stageDimensions || ''}
                onChange={(e) => handleInputChange('stageDimensions', e.target.value)}
                placeholder="Width x Depth"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="powerRequirements">Power Requirements</Label>
              <Input
                id="powerRequirements"
                value={formData.powerRequirements || ''}
                onChange={(e) => handleInputChange('powerRequirements', e.target.value)}
                placeholder="e.g., 120V, 20A circuits"
                className="mt-1"
              />
            </div>
          </TabsContent>

          {/* Hospitality Tab */}
          <TabsContent value="hospitality" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dressingRoomRequired"
                  checked={formData.dressingRoomRequired}
                  onCheckedChange={(checked) => handleInputChange('dressingRoomRequired', checked)}
                />
                <Label htmlFor="dressingRoomRequired">Dressing Room Required</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cateringProvided"
                  checked={formData.cateringProvided}
                  onCheckedChange={(checked) => handleInputChange('cateringProvided', checked)}
                />
                <Label htmlFor="cateringProvided">Catering Provided</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="parkingRequired"
                  checked={formData.parkingRequired}
                  onCheckedChange={(checked) => handleInputChange('parkingRequired', checked)}
                />
                <Label htmlFor="parkingRequired">Parking Required</Label>
              </div>
            </div>

            {formData.cateringProvided && (
              <div>
                <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
                <Textarea
                  id="dietaryRestrictions"
                  value={formData.dietaryRestrictions || ''}
                  onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
                  placeholder="e.g., vegetarian, vegan, gluten-free, allergies, etc."
                  className="mt-1"
                />
              </div>
            )}
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="performanceFee">Performance Fee *</Label>
                <Input
                  id="performanceFee"
                  type="number"
                  value={formData.performanceFee}
                  onChange={(e) => handleInputChange('performanceFee', parseFloat(e.target.value))}
                  min="0"
                  step="50"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="feeType">Fee Type *</Label>
                <Select value={formData.feeType} onValueChange={(value) => handleInputChange('feeType', value as 'fixed' | 'percentage')}>
                  <SelectTrigger id="feeType" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Fee</SelectItem>
                    <SelectItem value="percentage">Percentage of Ticket Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value as any)}>
                  <SelectTrigger id="paymentMethod" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentTiming">Payment Timing *</Label>
                <Select value={formData.paymentTiming} onValueChange={(value) => handleInputChange('paymentTiming', value as any)}>
                  <SelectTrigger id="paymentTiming" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upon_booking">Upon Booking</SelectItem>
                    <SelectItem value="before_event">Before Event</SelectItem>
                    <SelectItem value="after_event">After Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="depositRequired"
                checked={formData.depositRequired}
                onCheckedChange={(checked) => handleInputChange('depositRequired', checked)}
              />
              <Label htmlFor="depositRequired">Deposit Required</Label>
            </div>

            {formData.depositRequired && (
              <div>
                <Label htmlFor="depositAmount">Deposit Amount</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  value={formData.depositAmount || 0}
                  onChange={(e) => handleInputChange('depositAmount', parseFloat(e.target.value))}
                  min="0"
                  step="50"
                  className="mt-1"
                />
              </div>
            )}
          </TabsContent>

          {/* Special Requests Tab */}
          <TabsContent value="special" className="space-y-4">
            <div>
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={formData.specialRequests || ''}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                placeholder="Any special requests or requirements..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
              <Textarea
                id="cancellationPolicy"
                value={formData.cancellationPolicy || ''}
                onChange={(e) => handleInputChange('cancellationPolicy', e.target.value)}
                placeholder="e.g., Full refund if cancelled more than 30 days before event"
                className="mt-1"
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
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-6 justify-end">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
