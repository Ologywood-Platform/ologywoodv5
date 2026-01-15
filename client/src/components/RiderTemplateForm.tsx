import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface RiderFormData {
  templateName: string;
  description?: string;
  genre?: string;
  performanceType?: string;
  performanceDuration?: number;
  setupTimeRequired?: number;
  soundcheckTimeRequired?: number;
  teardownTimeRequired?: number;
  numberOfPerformers?: number;
  
  // Technical
  paSystemRequired?: boolean;
  microphoneType?: string;
  monitorMixRequired?: boolean;
  diBoxesNeeded?: number;
  audioInterface?: string;
  lightingRequired?: boolean;
  lightingType?: string;
  specialEffects?: string;
  stageDimensions?: string;
  stageHeight?: number;
  backdropRequired?: boolean;
  backdropDetails?: string;
  bringingOwnEquipment?: boolean;
  equipmentList?: string;
  powerRequirements?: string;
  backupEquipment?: string;
  
  // Hospitality
  dressingRoomRequired?: boolean;
  roomTemperature?: string;
  furnitureNeeded?: string[];
  amenities?: string[];
  cateringProvided?: boolean;
  dietaryRestrictions?: string[];
  specificDietaryNeeds?: string;
  beverages?: string[];
  mealTiming?: string;
  parkingRequired?: boolean;
  parkingType?: string;
  loadInAccess?: string;
  accessibleEntrance?: boolean;
  
  // Travel & Accommodation
  travelProvided?: boolean;
  travelMethod?: string;
  accommodationProvided?: boolean;
  hotelRequirements?: string;
  numberOfRooms?: number;
  checkInCheckOut?: string;
  groundTransportation?: string;
  
  // Merchandise & Promotion
  merchandiseSales?: boolean;
  merchandiseCut?: number;
  photographyAllowed?: boolean;
  videoRecordingAllowed?: boolean;
  socialMediaPermission?: boolean;
  broadcastingRights?: boolean;
  promotionalMaterials?: string;
  
  // Additional
  specialRequests?: string;
  emergencyContact?: string;
  additionalNotes?: string;
  isPublished?: boolean;
}

interface RiderTemplateFormProps {
  initialData?: RiderFormData;
  onSave?: (data: RiderFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function RiderTemplateForm({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
}: RiderTemplateFormProps) {
  const [formData, setFormData] = useState<RiderFormData>(
    initialData || {
      templateName: '',
      performanceDuration: 60,
      numberOfPerformers: 1,
      setupTimeRequired: 30,
      soundcheckTimeRequired: 20,
      teardownTimeRequired: 15,
      paSystemRequired: false,
      monitorMixRequired: false,
      lightingRequired: false,
      backdropRequired: false,
      bringingOwnEquipment: false,
      dressingRoomRequired: false,
      cateringProvided: false,
      parkingRequired: false,
      accessibleEntrance: false,
      travelProvided: false,
      accommodationProvided: false,
      merchandiseSales: false,
      photographyAllowed: true,
      videoRecordingAllowed: false,
      socialMediaPermission: true,
      broadcastingRights: false,
      isPublished: false,
      furnitureNeeded: [],
      amenities: [],
      dietaryRestrictions: [],
      beverages: [],
    }
  );

  const handleInputChange = (field: keyof RiderFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: keyof RiderFormData, item: string) => {
    setFormData(prev => {
      const current = (prev[field] as string[]) || [];
      if (current.includes(item)) {
        return { ...prev, [field]: current.filter(i => i !== item) };
      } else {
        return { ...prev, [field]: [...current, item] };
      }
    });
  };

  const handleSave = () => {
    if (!formData.templateName.trim()) {
      toast.error('Template name is required');
      return;
    }
    onSave?.(formData);
  };

  const furnitureOptions = ['Chairs', 'Table', 'Mirrors', 'Couch', 'Desk', 'Refrigerator'];
  const amenitiesOptions = ['Towels', 'Water', 'Snacks', 'Coffee', 'Tea', 'Juice'];
  const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Nut-free'];
  const beverageOptions = ['Water', 'Coffee', 'Tea', 'Juice', 'Soda', 'Beer', 'Wine', 'Spirits'];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Rider Template</CardTitle>
            <CardDescription>Create and customize your performance requirements</CardDescription>
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
            <TabsTrigger value="travel">Travel</TabsTrigger>
            <TabsTrigger value="additional">Additional</TabsTrigger>
          </TabsList>

          {/* BASIC INFORMATION TAB */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  value={formData.templateName}
                  onChange={(e) => handleInputChange('templateName', e.target.value)}
                  placeholder="e.g., Standard Concert Setup"
                  className="mt-1"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe this rider template..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  value={formData.genre || ''}
                  onChange={(e) => handleInputChange('genre', e.target.value)}
                  placeholder="e.g., Rock, Jazz, Electronic"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="performanceType">Performance Type</Label>
                <Select value={formData.performanceType || ''} onValueChange={(v) => handleInputChange('performanceType', v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concert">Concert</SelectItem>
                    <SelectItem value="dj_set">DJ Set</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="private_event">Private Event</SelectItem>
                    <SelectItem value="festival">Festival</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Performance Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.performanceDuration || 60}
                  onChange={(e) => handleInputChange('performanceDuration', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="performers">Number of Performers</Label>
                <Input
                  id="performers"
                  type="number"
                  value={formData.numberOfPerformers || 1}
                  onChange={(e) => handleInputChange('numberOfPerformers', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="setupTime">Setup Time (minutes)</Label>
                <Input
                  id="setupTime"
                  type="number"
                  value={formData.setupTimeRequired || 30}
                  onChange={(e) => handleInputChange('setupTimeRequired', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="soundcheckTime">Soundcheck Time (minutes)</Label>
                <Input
                  id="soundcheckTime"
                  type="number"
                  value={formData.soundcheckTimeRequired || 20}
                  onChange={(e) => handleInputChange('soundcheckTimeRequired', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="teardownTime">Teardown Time (minutes)</Label>
                <Input
                  id="teardownTime"
                  type="number"
                  value={formData.teardownTimeRequired || 15}
                  onChange={(e) => handleInputChange('teardownTimeRequired', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>

          {/* TECHNICAL REQUIREMENTS TAB */}
          <TabsContent value="technical" className="space-y-4">
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Sound System</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="paSystemRequired"
                    checked={formData.paSystemRequired || false}
                    onCheckedChange={(checked) => handleInputChange('paSystemRequired', checked)}
                  />
                  <Label htmlFor="paSystemRequired" className="font-normal">PA System Required</Label>
                </div>

                <div>
                  <Label htmlFor="microphoneType">Microphone Type</Label>
                  <Input
                    id="microphoneType"
                    value={formData.microphoneType || ''}
                    onChange={(e) => handleInputChange('microphoneType', e.target.value)}
                    placeholder="e.g., Neumann U87, Shure SM7B"
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="monitorMixRequired"
                    checked={formData.monitorMixRequired || false}
                    onCheckedChange={(checked) => handleInputChange('monitorMixRequired', checked)}
                  />
                  <Label htmlFor="monitorMixRequired" className="font-normal">Monitor Mix Required</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="diBoxes">DI Boxes Needed</Label>
                    <Input
                      id="diBoxes"
                      type="number"
                      value={formData.diBoxesNeeded || 0}
                      onChange={(e) => handleInputChange('diBoxesNeeded', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="audioInterface">Audio Interface</Label>
                    <Input
                      id="audioInterface"
                      value={formData.audioInterface || ''}
                      onChange={(e) => handleInputChange('audioInterface', e.target.value)}
                      placeholder="e.g., RME Fireface"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Lighting & Stage</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lightingRequired"
                    checked={formData.lightingRequired || false}
                    onCheckedChange={(checked) => handleInputChange('lightingRequired', checked)}
                  />
                  <Label htmlFor="lightingRequired" className="font-normal">Special Lighting Required</Label>
                </div>

                {formData.lightingRequired && (
                  <>
                    <div>
                      <Label htmlFor="lightingType">Lighting Type</Label>
                      <Select value={formData.lightingType || ''} onValueChange={(v) => handleInputChange('lightingType', v)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="specialEffects">Special Effects</Label>
                      <Input
                        id="specialEffects"
                        value={formData.specialEffects || ''}
                        onChange={(e) => handleInputChange('specialEffects', e.target.value)}
                        placeholder="e.g., Lasers, Projections, Strobes"
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stageDimensions">Stage Dimensions</Label>
                    <Input
                      id="stageDimensions"
                      value={formData.stageDimensions || ''}
                      onChange={(e) => handleInputChange('stageDimensions', e.target.value)}
                      placeholder="e.g., 20x15 ft"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stageHeight">Stage Height (feet)</Label>
                    <Input
                      id="stageHeight"
                      type="number"
                      step="0.5"
                      value={formData.stageHeight || ''}
                      onChange={(e) => handleInputChange('stageHeight', parseFloat(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="backdropRequired"
                    checked={formData.backdropRequired || false}
                    onCheckedChange={(checked) => handleInputChange('backdropRequired', checked)}
                  />
                  <Label htmlFor="backdropRequired" className="font-normal">Backdrop Required</Label>
                </div>

                {formData.backdropRequired && (
                  <div>
                    <Label htmlFor="backdropDetails">Backdrop Details</Label>
                    <Textarea
                      id="backdropDetails"
                      value={formData.backdropDetails || ''}
                      onChange={(e) => handleInputChange('backdropDetails', e.target.value)}
                      placeholder="Describe backdrop requirements..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Equipment</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bringingOwnEquipment"
                    checked={formData.bringingOwnEquipment || false}
                    onCheckedChange={(checked) => handleInputChange('bringingOwnEquipment', checked)}
                  />
                  <Label htmlFor="bringingOwnEquipment" className="font-normal">Bringing Own Equipment</Label>
                </div>

                {formData.bringingOwnEquipment && (
                  <div>
                    <Label htmlFor="equipmentList">Equipment List</Label>
                    <Textarea
                      id="equipmentList"
                      value={formData.equipmentList || ''}
                      onChange={(e) => handleInputChange('equipmentList', e.target.value)}
                      placeholder="List all equipment being brought..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="powerRequirements">Power Requirements</Label>
                  <Input
                    id="powerRequirements"
                    value={formData.powerRequirements || ''}
                    onChange={(e) => handleInputChange('powerRequirements', e.target.value)}
                    placeholder="e.g., 20A 110V, 30A 220V"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="backupEquipment">Backup Equipment Needed</Label>
                  <Textarea
                    id="backupEquipment"
                    value={formData.backupEquipment || ''}
                    onChange={(e) => handleInputChange('backupEquipment', e.target.value)}
                    placeholder="List backup equipment needed from venue..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* HOSPITALITY REQUIREMENTS TAB */}
          <TabsContent value="hospitality" className="space-y-4">
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Dressing Room</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dressingRoomRequired"
                    checked={formData.dressingRoomRequired || false}
                    onCheckedChange={(checked) => handleInputChange('dressingRoomRequired', checked)}
                  />
                  <Label htmlFor="dressingRoomRequired" className="font-normal">Dressing Room Required</Label>
                </div>

                {formData.dressingRoomRequired && (
                  <>
                    <div>
                      <Label htmlFor="roomTemperature">Room Temperature</Label>
                      <Input
                        id="roomTemperature"
                        value={formData.roomTemperature || ''}
                        onChange={(e) => handleInputChange('roomTemperature', e.target.value)}
                        placeholder="e.g., 68-72°F"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Furniture Needed</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {furnitureOptions.map(item => (
                          <div key={item} className="flex items-center space-x-2">
                            <Checkbox
                              id={`furniture-${item}`}
                              checked={(formData.furnitureNeeded || []).includes(item)}
                              onCheckedChange={() => handleArrayToggle('furnitureNeeded', item)}
                            />
                            <Label htmlFor={`furniture-${item}`} className="font-normal text-sm">{item}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Amenities</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {amenitiesOptions.map(item => (
                          <div key={item} className="flex items-center space-x-2">
                            <Checkbox
                              id={`amenity-${item}`}
                              checked={(formData.amenities || []).includes(item)}
                              onCheckedChange={() => handleArrayToggle('amenities', item)}
                            />
                            <Label htmlFor={`amenity-${item}`} className="font-normal text-sm">{item}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Catering</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cateringProvided"
                    checked={formData.cateringProvided || false}
                    onCheckedChange={(checked) => handleInputChange('cateringProvided', checked)}
                  />
                  <Label htmlFor="cateringProvided" className="font-normal">Catering Provided</Label>
                </div>

                {formData.cateringProvided && (
                  <>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Dietary Restrictions</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {dietaryOptions.map(item => (
                          <div key={item} className="flex items-center space-x-2">
                            <Checkbox
                              id={`dietary-${item}`}
                              checked={(formData.dietaryRestrictions || []).includes(item)}
                              onCheckedChange={() => handleArrayToggle('dietaryRestrictions', item)}
                            />
                            <Label htmlFor={`dietary-${item}`} className="font-normal text-sm">{item}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="specificDietaryNeeds">Specific Dietary Needs</Label>
                      <Textarea
                        id="specificDietaryNeeds"
                        value={formData.specificDietaryNeeds || ''}
                        onChange={(e) => handleInputChange('specificDietaryNeeds', e.target.value)}
                        placeholder="Any specific allergies or dietary requirements..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Beverages</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {beverageOptions.map(item => (
                          <div key={item} className="flex items-center space-x-2">
                            <Checkbox
                              id={`beverage-${item}`}
                              checked={(formData.beverages || []).includes(item)}
                              onCheckedChange={() => handleArrayToggle('beverages', item)}
                            />
                            <Label htmlFor={`beverage-${item}`} className="font-normal text-sm">{item}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="mealTiming">Meal Timing</Label>
                      <Input
                        id="mealTiming"
                        value={formData.mealTiming || ''}
                        onChange={(e) => handleInputChange('mealTiming', e.target.value)}
                        placeholder="e.g., 2 hours before performance"
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Access & Parking</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="parkingRequired"
                    checked={formData.parkingRequired || false}
                    onCheckedChange={(checked) => handleInputChange('parkingRequired', checked)}
                  />
                  <Label htmlFor="parkingRequired" className="font-normal">Parking Required</Label>
                </div>

                {formData.parkingRequired && (
                  <div>
                    <Label htmlFor="parkingType">Parking Type</Label>
                    <Select value={formData.parkingType || ''} onValueChange={(v) => handleInputChange('parkingType', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="covered">Covered</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="loadInAccess">Load-in Access</Label>
                  <Textarea
                    id="loadInAccess"
                    value={formData.loadInAccess || ''}
                    onChange={(e) => handleInputChange('loadInAccess', e.target.value)}
                    placeholder="Special access requirements for loading equipment..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="accessibleEntrance"
                    checked={formData.accessibleEntrance || false}
                    onCheckedChange={(checked) => handleInputChange('accessibleEntrance', checked)}
                  />
                  <Label htmlFor="accessibleEntrance" className="font-normal">Accessible Entrance Required</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TRAVEL & ACCOMMODATION TAB */}
          <TabsContent value="travel" className="space-y-4">
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Travel</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="travelProvided"
                    checked={formData.travelProvided || false}
                    onCheckedChange={(checked) => handleInputChange('travelProvided', checked)}
                  />
                  <Label htmlFor="travelProvided" className="font-normal">Venue Provides Transportation</Label>
                </div>

                {formData.travelProvided && (
                  <div>
                    <Label htmlFor="travelMethod">Travel Method</Label>
                    <Select value={formData.travelMethod || ''} onValueChange={(v) => handleInputChange('travelMethod', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="car">Car</SelectItem>
                        <SelectItem value="bus">Bus</SelectItem>
                        <SelectItem value="flight">Flight</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Accommodation</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="accommodationProvided"
                    checked={formData.accommodationProvided || false}
                    onCheckedChange={(checked) => handleInputChange('accommodationProvided', checked)}
                  />
                  <Label htmlFor="accommodationProvided" className="font-normal">Venue Provides Hotel</Label>
                </div>

                {formData.accommodationProvided && (
                  <>
                    <div>
                      <Label htmlFor="hotelRequirements">Hotel Requirements</Label>
                      <Textarea
                        id="hotelRequirements"
                        value={formData.hotelRequirements || ''}
                        onChange={(e) => handleInputChange('hotelRequirements', e.target.value)}
                        placeholder="e.g., 4-star, close to venue, breakfast included..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="numberOfRooms">Number of Rooms</Label>
                        <Input
                          id="numberOfRooms"
                          type="number"
                          value={formData.numberOfRooms || 1}
                          onChange={(e) => handleInputChange('numberOfRooms', parseInt(e.target.value))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="checkInCheckOut">Check-in/Check-out</Label>
                        <Input
                          id="checkInCheckOut"
                          value={formData.checkInCheckOut || ''}
                          onChange={(e) => handleInputChange('checkInCheckOut', e.target.value)}
                          placeholder="e.g., Early check-in available"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="groundTransportation">Ground Transportation</Label>
                  <Input
                    id="groundTransportation"
                    value={formData.groundTransportation || ''}
                    onChange={(e) => handleInputChange('groundTransportation', e.target.value)}
                    placeholder="e.g., Airport pickup, shuttle service"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ADDITIONAL TAB */}
          <TabsContent value="additional" className="space-y-4">
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Merchandise & Promotion</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="merchandiseSales"
                    checked={formData.merchandiseSales || false}
                    onCheckedChange={(checked) => handleInputChange('merchandiseSales', checked)}
                  />
                  <Label htmlFor="merchandiseSales" className="font-normal">Selling Merchandise</Label>
                </div>

                {formData.merchandiseSales && (
                  <div>
                    <Label htmlFor="merchandiseCut">Venue Commission (%)</Label>
                    <Input
                      id="merchandiseCut"
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.merchandiseCut || 0}
                      onChange={(e) => handleInputChange('merchandiseCut', parseFloat(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="photographyAllowed"
                      checked={formData.photographyAllowed !== false}
                      onCheckedChange={(checked) => handleInputChange('photographyAllowed', checked)}
                    />
                    <Label htmlFor="photographyAllowed" className="font-normal">Photography Allowed</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="videoRecordingAllowed"
                      checked={formData.videoRecordingAllowed || false}
                      onCheckedChange={(checked) => handleInputChange('videoRecordingAllowed', checked)}
                    />
                    <Label htmlFor="videoRecordingAllowed" className="font-normal">Video Recording Allowed</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="socialMediaPermission"
                      checked={formData.socialMediaPermission !== false}
                      onCheckedChange={(checked) => handleInputChange('socialMediaPermission', checked)}
                    />
                    <Label htmlFor="socialMediaPermission" className="font-normal">Social Media Permission</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="broadcastingRights"
                      checked={formData.broadcastingRights || false}
                      onCheckedChange={(checked) => handleInputChange('broadcastingRights', checked)}
                    />
                    <Label htmlFor="broadcastingRights" className="font-normal">Broadcasting Rights</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="promotionalMaterials">Promotional Materials</Label>
                  <Textarea
                    id="promotionalMaterials"
                    value={formData.promotionalMaterials || ''}
                    onChange={(e) => handleInputChange('promotionalMaterials', e.target.value)}
                    placeholder="Logos, bios, promotional content links..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Additional Information</h3>
                <div>
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Textarea
                    id="specialRequests"
                    value={formData.specialRequests || ''}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    placeholder="Any additional requirements or preferences..."
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
                    placeholder="Name and phone number"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="additionalNotes">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    value={formData.additionalNotes || ''}
                    onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                    placeholder="Any other important information..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="isPublished"
                    checked={formData.isPublished || false}
                    onCheckedChange={(checked) => handleInputChange('isPublished', checked)}
                  />
                  <Label htmlFor="isPublished" className="font-normal">Publish Template</Label>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={isLoading} className="gap-2">
            <Save className="h-4 w-4" />
            Save Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
