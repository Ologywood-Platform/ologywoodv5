import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, Settings, Calendar, Users, Plus, Trash2 } from 'lucide-react';

interface RyderFormData {
  templateName: string;
  performanceType: 'solo' | 'duo' | 'band' | 'dj' | 'other';
  performanceDuration: string;
  setupTime: string;
  breakdownTime: string;
  numPerformers: number;
  touringPartySize: number;
  
  // Technical Requirements
  paSystemRequired: boolean;
  microphoneType: string;
  instrumentInputs: number;
  monitorMixRequired: boolean;
  monitorChannels: number;
  lightingRequired: boolean;
  stageSize: string;
  
  // Hospitality
  cateringRequired: boolean;
  cateringPeople: number;
  beverages: string[];
  dietaryRestrictions: string;
  dressingRoomRequired: boolean;
  hotelRequired: boolean;
  parkingRequired: boolean;
  transportationRequired: boolean;
  
  // Equipment
  equipmentProvided: string[];
  equipmentNeeded: string[];
  
  // Special Requests
  specialRequests: string;
}

interface RyderContractFormProps {
  onSubmit: (data: RyderFormData) => Promise<void>;
  initialData?: Partial<RyderFormData>;
  isLoading?: boolean;
  isEditing?: boolean;
}

export function RyderContractForm({
  onSubmit,
  initialData,
  isLoading = false,
  isEditing = false,
}: RyderContractFormProps) {
  const [formData, setFormData] = useState<RyderFormData>({
    templateName: initialData?.templateName || '',
    performanceType: initialData?.performanceType || 'band',
    performanceDuration: initialData?.performanceDuration || '60 minutes',
    setupTime: initialData?.setupTime || '30 minutes',
    breakdownTime: initialData?.breakdownTime || '20 minutes',
    numPerformers: initialData?.numPerformers || 1,
    touringPartySize: initialData?.touringPartySize || 1,
    
    paSystemRequired: initialData?.paSystemRequired ?? true,
    microphoneType: initialData?.microphoneType || '2x Dynamic Vocal Mics',
    instrumentInputs: initialData?.instrumentInputs || 4,
    monitorMixRequired: initialData?.monitorMixRequired ?? true,
    monitorChannels: initialData?.monitorChannels || 3,
    lightingRequired: initialData?.lightingRequired ?? true,
    stageSize: initialData?.stageSize || '20ft x 15ft',
    
    cateringRequired: initialData?.cateringRequired ?? true,
    cateringPeople: initialData?.cateringPeople || 4,
    beverages: initialData?.beverages || ['water', 'juice', 'coffee'],
    dietaryRestrictions: initialData?.dietaryRestrictions || '',
    dressingRoomRequired: initialData?.dressingRoomRequired ?? true,
    hotelRequired: initialData?.hotelRequired ?? false,
    parkingRequired: initialData?.parkingRequired ?? true,
    transportationRequired: initialData?.transportationRequired ?? false,
    
    equipmentProvided: initialData?.equipmentProvided || [],
    equipmentNeeded: initialData?.equipmentNeeded || [],
    
    specialRequests: initialData?.specialRequests || '',
  });

  const [newEquipmentProvided, setNewEquipmentProvided] = useState('');
  const [newEquipmentNeeded, setNewEquipmentNeeded] = useState('');
  const [newBeverage, setNewBeverage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.templateName.trim()) {
      newErrors.templateName = 'Rider template name is required';
    }
    if (formData.numPerformers < 1) {
      newErrors.numPerformers = 'Must have at least 1 performer';
    }
    if (formData.touringPartySize < formData.numPerformers) {
      newErrors.touringPartySize = 'Touring party must be at least the number of performers';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting rider form:', error);
    }
  };

  const handleInputChange = (field: keyof RyderFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const addEquipmentProvided = () => {
    if (newEquipmentProvided.trim()) {
      handleInputChange('equipmentProvided', [
        ...formData.equipmentProvided,
        newEquipmentProvided.trim(),
      ]);
      setNewEquipmentProvided('');
    }
  };

  const removeEquipmentProvided = (index: number) => {
    handleInputChange('equipmentProvided', 
      formData.equipmentProvided.filter((_, i) => i !== index)
    );
  };

  const addEquipmentNeeded = () => {
    if (newEquipmentNeeded.trim()) {
      handleInputChange('equipmentNeeded', [
        ...formData.equipmentNeeded,
        newEquipmentNeeded.trim(),
      ]);
      setNewEquipmentNeeded('');
    }
  };

  const removeEquipmentNeeded = (index: number) => {
    handleInputChange('equipmentNeeded', 
      formData.equipmentNeeded.filter((_, i) => i !== index)
    );
  };

  const addBeverage = () => {
    if (newBeverage.trim()) {
      handleInputChange('beverages', [
        ...formData.beverages,
        newBeverage.trim(),
      ]);
      setNewBeverage('');
    }
  };

  const removeBeverage = (index: number) => {
    handleInputChange('beverages', 
      formData.beverages.filter((_, i) => i !== index)
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Edit Rider Template' : 'Create New Rider Template'}
          </CardTitle>
          <CardDescription>
            Define your performance requirements and hospitality needs
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Rider Template Name *
            </label>
            <input
              type="text"
              value={formData.templateName}
              onChange={(e) => handleInputChange('templateName', e.target.value)}
              placeholder="e.g., Full Band Performance Rider"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.templateName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.templateName && (
              <p className="text-red-500 text-sm mt-1">{errors.templateName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Performance Type
              </label>
              <select
                value={formData.performanceType}
                onChange={(e) => handleInputChange('performanceType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="solo">Solo</option>
                <option value="duo">Duo/Trio</option>
                <option value="band">Full Band</option>
                <option value="dj">DJ/Electronic</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Performance Duration
              </label>
              <input
                type="text"
                value={formData.performanceDuration}
                onChange={(e) => handleInputChange('performanceDuration', e.target.value)}
                placeholder="e.g., 60 minutes"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Setup Time
              </label>
              <input
                type="text"
                value={formData.setupTime}
                onChange={(e) => handleInputChange('setupTime', e.target.value)}
                placeholder="e.g., 30 minutes"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Breakdown Time
              </label>
              <input
                type="text"
                value={formData.breakdownTime}
                onChange={(e) => handleInputChange('breakdownTime', e.target.value)}
                placeholder="e.g., 20 minutes"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Number of Performers
              </label>
              <input
                type="number"
                min="1"
                value={formData.numPerformers}
                onChange={(e) => handleInputChange('numPerformers', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.numPerformers ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.numPerformers && (
                <p className="text-red-500 text-sm mt-1">{errors.numPerformers}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Touring Party Size
            </label>
            <input
              type="number"
              min="1"
              value={formData.touringPartySize}
              onChange={(e) => handleInputChange('touringPartySize', parseInt(e.target.value))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.touringPartySize ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.touringPartySize && (
              <p className="text-red-500 text-sm mt-1">{errors.touringPartySize}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Total number of people traveling with the artist (including performers and crew)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Technical Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Technical Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.paSystemRequired}
                onChange={(e) => handleInputChange('paSystemRequired', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">PA System Required</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.monitorMixRequired}
                onChange={(e) => handleInputChange('monitorMixRequired', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Monitor Mix Required</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.lightingRequired}
                onChange={(e) => handleInputChange('lightingRequired', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Professional Lighting Required</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Microphone Type
              </label>
              <input
                type="text"
                value={formData.microphoneType}
                onChange={(e) => handleInputChange('microphoneType', e.target.value)}
                placeholder="e.g., 2x Dynamic Vocal Mics"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Instrument Inputs Required
              </label>
              <input
                type="number"
                min="1"
                value={formData.instrumentInputs}
                onChange={(e) => handleInputChange('instrumentInputs', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {formData.monitorMixRequired && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Monitor Channels Required
              </label>
              <input
                type="number"
                min="1"
                value={formData.monitorChannels}
                onChange={(e) => handleInputChange('monitorChannels', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Stage Size Required
            </label>
            <input
              type="text"
              value={formData.stageSize}
              onChange={(e) => handleInputChange('stageSize', e.target.value)}
              placeholder="e.g., 20ft x 15ft"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Hospitality Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hospitality Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.cateringRequired}
                onChange={(e) => handleInputChange('cateringRequired', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Catering Required</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.dressingRoomRequired}
                onChange={(e) => handleInputChange('dressingRoomRequired', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Private Dressing Room Required</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hotelRequired}
                onChange={(e) => handleInputChange('hotelRequired', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Hotel Accommodation Required</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.parkingRequired}
                onChange={(e) => handleInputChange('parkingRequired', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Parking Required</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.transportationRequired}
                onChange={(e) => handleInputChange('transportationRequired', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Ground Transportation Required</span>
            </label>
          </div>

          {formData.cateringRequired && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Catering for Number of People
              </label>
              <input
                type="number"
                min="1"
                value={formData.cateringPeople}
                onChange={(e) => handleInputChange('cateringPeople', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Beverages Required
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newBeverage}
                onChange={(e) => setNewBeverage(e.target.value)}
                placeholder="Add beverage (e.g., Water, Coffee)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addBeverage();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addBeverage}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.beverages.map((beverage, index) => (
                <div
                  key={index}
                  className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {beverage}
                  <button
                    type="button"
                    onClick={() => removeBeverage(index)}
                    className="hover:text-purple-900"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Dietary Restrictions
            </label>
            <textarea
              value={formData.dietaryRestrictions}
              onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
              placeholder="e.g., Vegetarian options required, nut allergies"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Equipment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Equipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Equipment Provided by Artist
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newEquipmentProvided}
                onChange={(e) => setNewEquipmentProvided(e.target.value)}
                placeholder="Add equipment (e.g., Guitar, Amplifier)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEquipmentProvided();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addEquipmentProvided}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {formData.equipmentProvided.map((equipment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <span className="text-sm">{equipment}</span>
                  <button
                    type="button"
                    onClick={() => removeEquipmentProvided(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Equipment Needed from Venue
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newEquipmentNeeded}
                onChange={(e) => setNewEquipmentNeeded(e.target.value)}
                placeholder="Add equipment (e.g., PA System, Mixer)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEquipmentNeeded();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addEquipmentNeeded}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {formData.equipmentNeeded.map((equipment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <span className="text-sm">{equipment}</span>
                  <button
                    type="button"
                    onClick={() => removeEquipmentNeeded(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Special Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Special Requests & Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => handleInputChange('specialRequests', e.target.value)}
            placeholder="Any additional requirements, preferences, or special notes..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isLoading ? 'Saving...' : isEditing ? 'Update Rider Template' : 'Create Rider Template'}
        </Button>
      </div>
    </form>
  );
}
