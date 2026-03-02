import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Save, X, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';

interface SimpleRyderData {
  // Basic Info
  templateName: string;
  performanceType: 'concert' | 'dj_set' | 'acoustic' | 'workshop' | 'other';
  performanceDuration: number; // minutes
  setupTimeRequired: number; // minutes

  // Technical Requirements (Essential Only)
  paSystemRequired: boolean;
  lightingRequired: boolean;
  monitorMixRequired: boolean;
  bringingOwnEquipment: boolean;
  equipmentList?: string;
  powerRequirements?: string;

  // Hospitality (Essential Only)
  dressingRoomRequired: boolean;
  cateringProvided: boolean;
  dietaryRestrictions?: string;
  parkingRequired: boolean;
  numberOfPerformers?: number;

  // Special Requests
  specialRequests?: string;
  cancellationPolicy?: string;
  emergencyContact?: string;
}

interface SimpleRyderTemplateProps {
  onSave?: (data: SimpleRyderData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  initialData?: SimpleRyderData;
  showPreview?: boolean;
}

export function SimpleRyderTemplate({
  onSave,
  onCancel,
  isLoading = false,
  initialData,
  showPreview = true,
}: SimpleRyderTemplateProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [showPreviewMode, setShowPreviewMode] = useState(false);
  const [formData, setFormData] = useState<SimpleRyderData>(
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
      numberOfPerformers: 1,
    }
  );

  const handleInputChange = (field: keyof SimpleRyderData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.templateName.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (formData.performanceDuration <= 0) {
      toast.error('Performance duration must be greater than 0');
      return;
    }
    if (formData.setupTimeRequired < 0) {
      toast.error('Setup time cannot be negative');
      return;
    }
    onSave?.(formData);
    toast.success('Ryder template saved successfully');
  };

  const performanceTypeLabels = {
    concert: 'Concert',
    dj_set: 'DJ Set',
    acoustic: 'Acoustic Performance',
    workshop: 'Workshop',
    other: 'Other',
  };

  if (showPreviewMode && showPreview) {
    return <RyderPreview data={formData} onEdit={() => setShowPreviewMode(false)} />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create Ryder Template</CardTitle>
              <CardDescription>
                Set up your performance requirements for venues
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {showPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreviewMode(true)}
                  disabled={!formData.templateName.trim()}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              )}
              {onCancel && (
                <Button variant="ghost" size="icon" onClick={onCancel}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="hospitality">Hospitality</TabsTrigger>
              <TabsTrigger value="special">Special Requests</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="templateName" className="text-base font-semibold">
                    Template Name *
                  </Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Give this template a memorable name (e.g., "Standard Setup", "Festival Rig")
                  </p>
                  <Input
                    id="templateName"
                    value={formData.templateName}
                    onChange={(e) => handleInputChange('templateName', e.target.value)}
                    placeholder="e.g., Standard Concert Setup"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="performanceType" className="text-base font-semibold">
                      Performance Type *
                    </Label>
                    <p className="text-sm text-gray-500 mb-2">
                      What kind of performance is this for?
                    </p>
                    <select
                      id="performanceType"
                      value={formData.performanceType}
                      onChange={(e) =>
                        handleInputChange(
                          'performanceType',
                          e.target.value as SimpleRyderData['performanceType']
                        )
                      }
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {Object.entries(performanceTypeLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="numberOfPerformers" className="text-base font-semibold">
                      Number of Performers
                    </Label>
                    <p className="text-sm text-gray-500 mb-2">
                      How many people will be performing?
                    </p>
                    <Input
                      id="numberOfPerformers"
                      type="number"
                      min="1"
                      value={formData.numberOfPerformers || 1}
                      onChange={(e) =>
                        handleInputChange('numberOfPerformers', parseInt(e.target.value) || 1)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="performanceDuration" className="text-base font-semibold">
                      Performance Duration (minutes) *
                    </Label>
                    <p className="text-sm text-gray-500 mb-2">
                      How long will the performance last?
                    </p>
                    <Input
                      id="performanceDuration"
                      type="number"
                      min="1"
                      value={formData.performanceDuration}
                      onChange={(e) =>
                        handleInputChange('performanceDuration', parseInt(e.target.value) || 60)
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="setupTimeRequired" className="text-base font-semibold">
                      Setup Time (minutes)
                    </Label>
                    <p className="text-sm text-gray-500 mb-2">
                      Time needed before the performance starts
                    </p>
                    <Input
                      id="setupTimeRequired"
                      type="number"
                      min="0"
                      value={formData.setupTimeRequired}
                      onChange={(e) =>
                        handleInputChange('setupTimeRequired', parseInt(e.target.value) || 30)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Technical Requirements Tab */}
            <TabsContent value="technical" className="space-y-6 mt-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Select the technical requirements your performance needs
                </p>

                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="paSystemRequired"
                      checked={formData.paSystemRequired}
                      onCheckedChange={(checked) =>
                        handleInputChange('paSystemRequired', checked)
                      }
                    />
                    <Label
                      htmlFor="paSystemRequired"
                      className="font-semibold cursor-pointer flex-1"
                    >
                      PA System Required
                      <p className="text-sm text-gray-500 font-normal mt-1">
                        Does the venue need to provide sound amplification?
                      </p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="lightingRequired"
                      checked={formData.lightingRequired}
                      onCheckedChange={(checked) =>
                        handleInputChange('lightingRequired', checked)
                      }
                    />
                    <Label
                      htmlFor="lightingRequired"
                      className="font-semibold cursor-pointer flex-1"
                    >
                      Lighting Required
                      <p className="text-sm text-gray-500 font-normal mt-1">
                        Do you need special stage lighting?
                      </p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="monitorMixRequired"
                      checked={formData.monitorMixRequired}
                      onCheckedChange={(checked) =>
                        handleInputChange('monitorMixRequired', checked)
                      }
                    />
                    <Label
                      htmlFor="monitorMixRequired"
                      className="font-semibold cursor-pointer flex-1"
                    >
                      Monitor Mix Required
                      <p className="text-sm text-gray-500 font-normal mt-1">
                        Do you need stage monitors to hear yourself?
                      </p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="bringingOwnEquipment"
                      checked={formData.bringingOwnEquipment}
                      onCheckedChange={(checked) =>
                        handleInputChange('bringingOwnEquipment', checked)
                      }
                    />
                    <Label
                      htmlFor="bringingOwnEquipment"
                      className="font-semibold cursor-pointer flex-1"
                    >
                      Bringing Own Equipment
                      <p className="text-sm text-gray-500 font-normal mt-1">
                        Will you bring your own gear?
                      </p>
                    </Label>
                  </div>
                </div>

                {formData.bringingOwnEquipment && (
                  <div>
                    <Label htmlFor="equipmentList" className="text-base font-semibold">
                      Equipment List
                    </Label>
                    <p className="text-sm text-gray-500 mb-2">
                      List the equipment you'll bring (e.g., "Drums, Amplifier, Cables")
                    </p>
                    <Textarea
                      id="equipmentList"
                      value={formData.equipmentList || ''}
                      onChange={(e) => handleInputChange('equipmentList', e.target.value)}
                      placeholder="Drums, Bass Amplifier, Microphone, Cables, Pedal Board"
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="powerRequirements" className="text-base font-semibold">
                    Power Requirements
                  </Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Any special power needs (e.g., "2 x 20A circuits")
                  </p>
                  <Input
                    id="powerRequirements"
                    value={formData.powerRequirements || ''}
                    onChange={(e) => handleInputChange('powerRequirements', e.target.value)}
                    placeholder="e.g., 2 x 20A circuits, 110V outlet"
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Hospitality Tab */}
            <TabsContent value="hospitality" className="space-y-6 mt-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Tell venues what you need to be comfortable
                </p>

                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="dressingRoomRequired"
                      checked={formData.dressingRoomRequired}
                      onCheckedChange={(checked) =>
                        handleInputChange('dressingRoomRequired', checked)
                      }
                    />
                    <Label
                      htmlFor="dressingRoomRequired"
                      className="font-semibold cursor-pointer flex-1"
                    >
                      Dressing Room Required
                      <p className="text-sm text-gray-500 font-normal mt-1">
                        Do you need a private space to prepare?
                      </p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="parkingRequired"
                      checked={formData.parkingRequired}
                      onCheckedChange={(checked) =>
                        handleInputChange('parkingRequired', checked)
                      }
                    />
                    <Label
                      htmlFor="parkingRequired"
                      className="font-semibold cursor-pointer flex-1"
                    >
                      Parking Required
                      <p className="text-sm text-gray-500 font-normal mt-1">
                        Do you need parking for your vehicle/equipment?
                      </p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="cateringProvided"
                      checked={formData.cateringProvided}
                      onCheckedChange={(checked) =>
                        handleInputChange('cateringProvided', checked)
                      }
                    />
                    <Label
                      htmlFor="cateringProvided"
                      className="font-semibold cursor-pointer flex-1"
                    >
                      Catering Provided
                      <p className="text-sm text-gray-500 font-normal mt-1">
                        Should the venue provide food and drinks?
                      </p>
                    </Label>
                  </div>
                </div>

                {formData.cateringProvided && (
                  <div>
                    <Label htmlFor="dietaryRestrictions" className="text-base font-semibold">
                      Dietary Restrictions
                    </Label>
                    <p className="text-sm text-gray-500 mb-2">
                      Any allergies or dietary preferences (e.g., "Vegetarian, Gluten-free")
                    </p>
                    <Input
                      id="dietaryRestrictions"
                      value={formData.dietaryRestrictions || ''}
                      onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
                      placeholder="e.g., Vegetarian, Vegan, Nut allergy, Gluten-free"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Special Requests Tab */}
            <TabsContent value="special" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="specialRequests" className="text-base font-semibold">
                    Special Requests
                  </Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Any additional requirements or preferences
                  </p>
                  <Textarea
                    id="specialRequests"
                    value={formData.specialRequests || ''}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    placeholder="e.g., Need a specific microphone type, prefer morning soundcheck, need WiFi access"
                    className="mt-1"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="cancellationPolicy" className="text-base font-semibold">
                    Cancellation Policy
                  </Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Your cancellation terms (e.g., "50% deposit non-refundable if cancelled within 7 days")
                  </p>
                  <Textarea
                    id="cancellationPolicy"
                    value={formData.cancellationPolicy || ''}
                    onChange={(e) => handleInputChange('cancellationPolicy', e.target.value)}
                    placeholder="e.g., 50% deposit non-refundable if cancelled within 7 days of event"
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyContact" className="text-base font-semibold">
                    Emergency Contact
                  </Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Contact number for day-of emergencies
                  </p>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact || ''}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Preview Component
interface RyderPreviewProps {
  data: SimpleRyderData;
  onEdit: () => void;
}

function RyderPreview({ data, onEdit }: RyderPreviewProps) {
  const performanceTypeLabels = {
    concert: 'Concert',
    dj_set: 'DJ Set',
    acoustic: 'Acoustic Performance',
    workshop: 'Workshop',
    other: 'Other',
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{data.templateName}</CardTitle>
            <CardDescription>Ryder Template Preview</CardDescription>
          </div>
          <Button variant="outline" onClick={onEdit}>
            Edit
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Performance Details */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-3">Performance Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-semibold">
                {performanceTypeLabels[data.performanceType]}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="font-semibold">{data.performanceDuration} min</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Setup Time</p>
              <p className="font-semibold">{data.setupTimeRequired} min</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Performers</p>
              <p className="font-semibold">{data.numberOfPerformers || 1}</p>
            </div>
          </div>
        </div>

        {/* Technical Requirements */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Technical Requirements</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className={`${data.paSystemRequired ? '✓' : '○'} mr-2 font-bold`}>
                {data.paSystemRequired ? '✓' : '○'}
              </span>
              <span>PA System Required</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2 font-bold">{data.lightingRequired ? '✓' : '○'}</span>
              <span>Lighting Required</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2 font-bold">{data.monitorMixRequired ? '✓' : '○'}</span>
              <span>Monitor Mix Required</span>
            </div>
            {data.bringingOwnEquipment && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <p className="font-semibold text-sm mb-1">Equipment:</p>
                <p className="text-sm whitespace-pre-wrap">{data.equipmentList}</p>
              </div>
            )}
            {data.powerRequirements && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <p className="font-semibold text-sm mb-1">Power Needs:</p>
                <p className="text-sm">{data.powerRequirements}</p>
              </div>
            )}
          </div>
        </div>

        {/* Hospitality */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Hospitality Requirements</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="mr-2 font-bold">{data.dressingRoomRequired ? '✓' : '○'}</span>
              <span>Dressing Room Required</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2 font-bold">{data.parkingRequired ? '✓' : '○'}</span>
              <span>Parking Required</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2 font-bold">{data.cateringProvided ? '✓' : '○'}</span>
              <span>Catering Provided</span>
            </div>
            {data.dietaryRestrictions && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <p className="font-semibold text-sm mb-1">Dietary Restrictions:</p>
                <p className="text-sm">{data.dietaryRestrictions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Special Requests */}
        {(data.specialRequests || data.cancellationPolicy || data.emergencyContact) && (
          <div>
            <h3 className="font-semibold text-lg mb-3">Additional Information</h3>
            {data.specialRequests && (
              <div className="mb-3 p-3 bg-gray-50 rounded">
                <p className="font-semibold text-sm mb-1">Special Requests:</p>
                <p className="text-sm whitespace-pre-wrap">{data.specialRequests}</p>
              </div>
            )}
            {data.cancellationPolicy && (
              <div className="mb-3 p-3 bg-gray-50 rounded">
                <p className="font-semibold text-sm mb-1">Cancellation Policy:</p>
                <p className="text-sm whitespace-pre-wrap">{data.cancellationPolicy}</p>
              </div>
            )}
            {data.emergencyContact && (
              <div className="p-3 bg-gray-50 rounded">
                <p className="font-semibold text-sm mb-1">Emergency Contact:</p>
                <p className="text-sm">{data.emergencyContact}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8 pt-6 border-t">
          <Button variant="outline" onClick={onEdit} className="flex-1">
            Edit Template
          </Button>
          <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
