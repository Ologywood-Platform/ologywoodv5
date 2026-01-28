import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Download, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface TechnicalRequirements {
  soundSystem?: string;
  lightingSystem?: string;
  stage?: string;
  parking?: string;
  loadIn?: string;
  soundCheck?: string;
  additionalRequirements?: string[];
}

interface HospitalityRequirements {
  greenRoom?: string;
  meals?: string;
  dressing?: string;
  parking?: string;
  accommodations?: string;
  additionalRequirements?: string[];
}

interface FinancialTerms {
  paymentTerms?: string;
  cancellationPolicy?: string;
  insuranceRequired?: boolean;
  taxId?: string;
  additionalTerms?: string[];
}

interface ContractFormData {
  artistName: string;
  artistEmail: string;
  artistPhone?: string;
  venueName: string;
  venueAddress: string;
  eventDate: string;
  eventTime: string;
  eventDuration?: number;
  totalFee: number;
  depositAmount?: number;
  technical?: TechnicalRequirements;
  hospitality?: HospitalityRequirements;
  financial?: FinancialTerms;
  specialRequests?: string;
  notes?: string;
}

export function RiderContractBuilder() {
  const [formData, setFormData] = useState<ContractFormData>({
    artistName: '',
    artistEmail: '',
    venueName: '',
    venueAddress: '',
    eventDate: '',
    eventTime: '',
    totalFee: 0,
    technical: {
      soundSystem: '',
      lightingSystem: '',
      stage: '',
      parking: '',
      loadIn: '',
      soundCheck: '',
      additionalRequirements: [],
    },
    hospitality: {
      greenRoom: '',
      meals: '',
      dressing: '',
      parking: '',
      accommodations: '',
      additionalRequirements: [],
    },
    financial: {
      paymentTerms: '',
      cancellationPolicy: '',
      insuranceRequired: false,
      taxId: '',
      additionalTerms: [],
    },
    specialRequests: '',
    notes: '',
  });

  const [newTechReq, setNewTechReq] = useState('');
  const [newHospReq, setNewHospReq] = useState('');
  const [newFinTerm, setNewFinTerm] = useState('');

  const generatePDF = trpc.riderContract.generatePDF.useMutation();
  const generateText = trpc.riderContract.generateText.useQuery(
    { ...formData, totalFee: Number(formData.totalFee) },
    { enabled: false }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'totalFee' || name === 'depositAmount' || name === 'eventDuration' ? Number(value) : value,
    }));
  };

  const handleTechnicalChange = (field: keyof TechnicalRequirements, value: string) => {
    setFormData((prev) => ({
      ...prev,
      technical: {
        ...prev.technical,
        [field]: value,
      },
    }));
  };

  const handleHospitalityChange = (field: keyof HospitalityRequirements, value: string) => {
    setFormData((prev) => ({
      ...prev,
      hospitality: {
        ...prev.hospitality,
        [field]: value,
      },
    }));
  };

  const handleFinancialChange = (field: keyof FinancialTerms, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        [field]: value,
      },
    }));
  };

  const addTechnicalRequirement = () => {
    if (newTechReq.trim()) {
      setFormData((prev) => ({
        ...prev,
        technical: {
          ...prev.technical,
          additionalRequirements: [...(prev.technical?.additionalRequirements || []), newTechReq],
        },
      }));
      setNewTechReq('');
    }
  };

  const removeTechnicalRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      technical: {
        ...prev.technical,
        additionalRequirements: prev.technical?.additionalRequirements?.filter((_, i) => i !== index),
      },
    }));
  };

  const addHospitalityRequirement = () => {
    if (newHospReq.trim()) {
      setFormData((prev) => ({
        ...prev,
        hospitality: {
          ...prev.hospitality,
          additionalRequirements: [...(prev.hospitality?.additionalRequirements || []), newHospReq],
        },
      }));
      setNewHospReq('');
    }
  };

  const removeHospitalityRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      hospitality: {
        ...prev.hospitality,
        additionalRequirements: prev.hospitality?.additionalRequirements?.filter((_, i) => i !== index),
      },
    }));
  };

  const addFinancialTerm = () => {
    if (newFinTerm.trim()) {
      setFormData((prev) => ({
        ...prev,
        financial: {
          ...prev.financial,
          additionalTerms: [...(prev.financial?.additionalTerms || []), newFinTerm],
        },
      }));
      setNewFinTerm('');
    }
  };

  const removeFinancialTerm = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        additionalTerms: prev.financial?.additionalTerms?.filter((_, i) => i !== index),
      },
    }));
  };

  const handleGeneratePDF = async () => {
    try {
      await generatePDF.mutateAsync({
        ...formData,
        totalFee: Number(formData.totalFee),
        depositAmount: formData.depositAmount ? Number(formData.depositAmount) : undefined,
        eventDuration: formData.eventDuration ? Number(formData.eventDuration) : undefined,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Rider Contract Builder</CardTitle>
          <CardDescription>Create professional rider contracts for your bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="event" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="event">Event Details</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="hospitality">Hospitality</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
            </TabsList>

            {/* Event Details Tab */}
            <TabsContent value="event" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Artist Name *</label>
                  <Input
                    name="artistName"
                    value={formData.artistName}
                    onChange={handleInputChange}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Artist Email *</label>
                  <Input
                    name="artistEmail"
                    type="email"
                    value={formData.artistEmail}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    name="artistPhone"
                    value={formData.artistPhone || ''}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Venue Name *</label>
                  <Input
                    name="venueName"
                    value={formData.venueName}
                    onChange={handleInputChange}
                    placeholder="Venue name"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Venue Address *</label>
                  <Input
                    name="venueAddress"
                    value={formData.venueAddress}
                    onChange={handleInputChange}
                    placeholder="123 Main St, City, State"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Event Date *</label>
                  <Input
                    name="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Event Time *</label>
                  <Input
                    name="eventTime"
                    type="time"
                    value={formData.eventTime}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Input
                    name="eventDuration"
                    type="number"
                    value={formData.eventDuration || ''}
                    onChange={handleInputChange}
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Total Fee *</label>
                  <Input
                    name="totalFee"
                    type="number"
                    value={formData.totalFee}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Deposit Amount</label>
                  <Input
                    name="depositAmount"
                    type="number"
                    value={formData.depositAmount || ''}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Special Requests</label>
                <Textarea
                  name="specialRequests"
                  value={formData.specialRequests || ''}
                  onChange={handleInputChange}
                  placeholder="Any special requests for this event..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Technical Requirements Tab */}
            <TabsContent value="technical" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Sound System</label>
                  <Input
                    value={formData.technical?.soundSystem || ''}
                    onChange={(e) => handleTechnicalChange('soundSystem', e.target.value)}
                    placeholder="e.g., Full PA system with monitors"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Lighting System</label>
                  <Input
                    value={formData.technical?.lightingSystem || ''}
                    onChange={(e) => handleTechnicalChange('lightingSystem', e.target.value)}
                    placeholder="e.g., Stage lighting with color capability"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Stage Requirements</label>
                  <Input
                    value={formData.technical?.stage || ''}
                    onChange={(e) => handleTechnicalChange('stage', e.target.value)}
                    placeholder="e.g., 20x16 ft stage, 3 ft height"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Parking</label>
                  <Input
                    value={formData.technical?.parking || ''}
                    onChange={(e) => handleTechnicalChange('parking', e.target.value)}
                    placeholder="e.g., Dedicated parking for 2 vehicles"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Load-In Time</label>
                  <Input
                    value={formData.technical?.loadIn || ''}
                    onChange={(e) => handleTechnicalChange('loadIn', e.target.value)}
                    placeholder="e.g., 2 hours before event"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Sound Check</label>
                  <Input
                    value={formData.technical?.soundCheck || ''}
                    onChange={(e) => handleTechnicalChange('soundCheck', e.target.value)}
                    placeholder="e.g., 1 hour before performance"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Additional Requirements</label>
                  <div className="flex gap-2">
                    <Input
                      value={newTechReq}
                      onChange={(e) => setNewTechReq(e.target.value)}
                      placeholder="Add a requirement"
                      onKeyPress={(e) => e.key === 'Enter' && addTechnicalRequirement()}
                    />
                    <Button onClick={addTechnicalRequirement} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {formData.technical?.additionalRequirements?.map((req, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                        <span className="text-sm">{req}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTechnicalRequirement(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Hospitality Requirements Tab */}
            <TabsContent value="hospitality" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Green Room</label>
                  <Input
                    value={formData.hospitality?.greenRoom || ''}
                    onChange={(e) => handleHospitalityChange('greenRoom', e.target.value)}
                    placeholder="e.g., Private green room with seating"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Meals</label>
                  <Input
                    value={formData.hospitality?.meals || ''}
                    onChange={(e) => handleHospitalityChange('meals', e.target.value)}
                    placeholder="e.g., Catered dinner for 3 people"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Dressing Room</label>
                  <Input
                    value={formData.hospitality?.dressing || ''}
                    onChange={(e) => handleHospitalityChange('dressing', e.target.value)}
                    placeholder="e.g., Private dressing room with mirror"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Parking</label>
                  <Input
                    value={formData.hospitality?.parking || ''}
                    onChange={(e) => handleHospitalityChange('parking', e.target.value)}
                    placeholder="e.g., Complimentary parking"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Accommodations</label>
                  <Input
                    value={formData.hospitality?.accommodations || ''}
                    onChange={(e) => handleHospitalityChange('accommodations', e.target.value)}
                    placeholder="e.g., Hotel accommodations for 2 nights"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Additional Requirements</label>
                  <div className="flex gap-2">
                    <Input
                      value={newHospReq}
                      onChange={(e) => setNewHospReq(e.target.value)}
                      placeholder="Add a requirement"
                      onKeyPress={(e) => e.key === 'Enter' && addHospitalityRequirement()}
                    />
                    <Button onClick={addHospitalityRequirement} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {formData.hospitality?.additionalRequirements?.map((req, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                        <span className="text-sm">{req}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeHospitalityRequirement(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Financial Terms Tab */}
            <TabsContent value="financial" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Payment Terms</label>
                  <Input
                    value={formData.financial?.paymentTerms || ''}
                    onChange={(e) => handleFinancialChange('paymentTerms', e.target.value)}
                    placeholder="e.g., 50% deposit upon booking, balance due 7 days before event"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Cancellation Policy</label>
                  <Input
                    value={formData.financial?.cancellationPolicy || ''}
                    onChange={(e) => handleFinancialChange('cancellationPolicy', e.target.value)}
                    placeholder="e.g., Full refund if cancelled 30 days in advance"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.financial?.insuranceRequired || false}
                    onChange={(e) => handleFinancialChange('insuranceRequired', e.target.checked)}
                    id="insurance"
                  />
                  <label htmlFor="insurance" className="text-sm font-medium">
                    Insurance Required
                  </label>
                </div>

                <div>
                  <label className="text-sm font-medium">Tax ID</label>
                  <Input
                    value={formData.financial?.taxId || ''}
                    onChange={(e) => handleFinancialChange('taxId', e.target.value)}
                    placeholder="e.g., 12-3456789"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Additional Terms</label>
                  <div className="flex gap-2">
                    <Input
                      value={newFinTerm}
                      onChange={(e) => setNewFinTerm(e.target.value)}
                      placeholder="Add a term"
                      onKeyPress={(e) => e.key === 'Enter' && addFinancialTerm()}
                    />
                    <Button onClick={addFinancialTerm} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {formData.financial?.additionalTerms?.map((term, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                        <span className="text-sm">{term}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFinancialTerm(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <Button
              onClick={handleGeneratePDF}
              disabled={generatePDF.isPending}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {generatePDF.isPending ? 'Generating...' : 'Generate PDF'}
            </Button>

            {generatePDF.data && (
              <a
                href={generatePDF.data.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <FileText className="w-4 h-4" />
                Download Contract
              </a>
            )}
          </div>

          {generatePDF.error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              Error generating PDF: {generatePDF.error.message}
            </div>
          )}

          {generatePDF.data && (
            <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
              Contract generated successfully! Your PDF is ready to download.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
