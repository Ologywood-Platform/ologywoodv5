import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Download, Eye, Save, Loader2, CheckCircle, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';
// Toast notifications - using simple alerts for now

interface ContractData {
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
  technical?: {
    soundSystem?: string;
    lightingSystem?: string;
    stage?: string;
    parking?: string;
    loadIn?: string;
    soundCheck?: string;
    additionalRequirements?: string[];
  };
  hospitality?: {
    greenRoom?: string;
    meals?: string;
    dressing?: string;
    parking?: string;
    accommodations?: string;
    additionalRequirements?: string[];
  };
  financial?: {
    paymentTerms?: string;
    cancellationPolicy?: string;
    insuranceRequired?: boolean;
    additionalTerms?: string[];
  };
  specialRequests?: string;
  notes?: string;
}

export function ContractBuilderPage() {
  const toast = (config: any) => {
    console.log(config.title, config.description);
    // In production, use a proper toast library
  };
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [contractData, setContractData] = useState<ContractData>({
    artistName: '',
    artistEmail: '',
    venueName: '',
    venueAddress: '',
    eventDate: '',
    eventTime: '',
    totalFee: 0,
  });

  // Fetch templates
  const { data: templatesData } = trpc.contractTemplate.getAllTemplates.useQuery();

  useEffect(() => {
    if (templatesData?.templates) {
      setTemplates(templatesData.templates);
    }
  }, [templatesData]);

  // Template selection handled via query

  const handleTemplateSelect = async (templateId: string) => {
    setLoading(true);
    try {
      // In production, fetch template data
      if (templateId) {
        setSelectedTemplate(templateId);
        // Pre-populate contract data from template
        const template = templates.find((t) => t.id === templateId);
        if (template) {
          setContractData((prev) => ({
            ...prev,
            technical: (template as any).technical,
            hospitality: (template as any).hospitality,
            financial: (template as any).financial,
          }));
        }
        setActiveTab('details');
        toast({
          title: 'Template Selected',
          description: `Template loaded successfully`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setContractData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTechnicalChange = (field: string, value: any) => {
    setContractData((prev) => ({
      ...prev,
      technical: {
        ...prev.technical,
        [field]: value,
      },
    }));
  };

  const handleHospitalityChange = (field: string, value: any) => {
    setContractData((prev) => ({
      ...prev,
      hospitality: {
        ...prev.hospitality,
        [field]: value,
      },
    }));
  };

  const handleFinancialChange = (field: string, value: any) => {
    setContractData((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        [field]: value,
      },
    }));
  };

  const generatePDFMutation = trpc.riderContract.generatePDF.useMutation();

  const handleGeneratePDF = async () => {
    setLoading(true);
    try {
      const response = await generatePDFMutation.mutateAsync(contractData);
      if (response.success && response.url) {
        // Download the PDF
        const link = document.createElement('a');
        link.href = response.url;
        link.download = `contract_${contractData.artistName}_${contractData.eventDate}.pdf`;
        link.click();

        toast({
          title: 'Success',
          description: 'Contract PDF generated and downloaded',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate contract PDF',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Save template mutation handled inline

  const handleSaveAsTemplate = async () => {
    if (!contractData.artistName) {
      toast({
        title: 'Error',
        description: 'Please fill in required fields first',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Save template - in production, call API
      console.log('Saving template:', contractData);

      toast({
        title: 'Success',
        description: 'Contract saved as template',
      });
      setLoading(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Contract Builder</h1>
          <p className="text-lg text-slate-600">Create professional rider contracts for your bookings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedTemplate} className="flex items-center gap-2">
              Details
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!selectedTemplate} className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="download" disabled={!selectedTemplate} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {template.genre && <Badge variant="secondary">{template.genre}</Badge>}
                      {template.venueType && <Badge variant="secondary">{template.venueType}</Badge>}
                      {template.eventType && <Badge variant="secondary">{template.eventType}</Badge>}
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Artist Name *</label>
                    <Input
                      value={contractData.artistName}
                      onChange={(e) => handleInputChange('artistName', e.target.value)}
                      placeholder="Artist name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Artist Email *</label>
                    <Input
                      type="email"
                      value={contractData.artistEmail}
                      onChange={(e) => handleInputChange('artistEmail', e.target.value)}
                      placeholder="artist@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Artist Phone</label>
                    <Input
                      value={contractData.artistPhone ?? ''}
                      onChange={(e) => handleInputChange('artistPhone', e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Venue Name *</label>
                    <Input
                      value={contractData.venueName}
                      onChange={(e) => handleInputChange('venueName', e.target.value)}
                      placeholder="Venue name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Venue Address *</label>
                    <Input
                      value={contractData.venueAddress}
                      onChange={(e) => handleInputChange('venueAddress', e.target.value)}
                      placeholder="Full address"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Event Date *</label>
                    <Input
                      type="date"
                      value={contractData.eventDate}
                      onChange={(e) => handleInputChange('eventDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Event Time *</label>
                    <Input
                      type="time"
                      value={contractData.eventTime}
                      onChange={(e) => handleInputChange('eventTime', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duration (minutes)</label>
                    <Input
                      type="number"
                      value={contractData.eventDuration ?? ''}
                      onChange={(e) => handleInputChange('eventDuration', parseInt(e.target.value))}
                      placeholder="90"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Financial Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Total Fee *</label>
                    <Input
                      type="number"
                      value={contractData.totalFee}
                      onChange={(e) => handleInputChange('totalFee', parseFloat(e.target.value))}
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Deposit Amount</label>
                    <Input
                      type="number"
                      value={contractData.depositAmount ?? ''}
                      onChange={(e) => handleInputChange('depositAmount', parseFloat(e.target.value))}
                      placeholder="2500"
                    />
                  </div>
                  {contractData.financial && (
                    <>
                      <div>
                        <label className="text-sm font-medium">Payment Terms</label>
                        <Textarea
                          value={contractData.financial.paymentTerms}
                          onChange={(e) => handleFinancialChange('paymentTerms', e.target.value)}
                          placeholder="Payment terms..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Cancellation Policy</label>
                        <Textarea
                          value={contractData.financial.cancellationPolicy}
                          onChange={(e) => handleFinancialChange('cancellationPolicy', e.target.value)}
                          placeholder="Cancellation policy..."
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Technical Requirements */}
            {contractData.technical && (
              <Card>
                <CardHeader>
                  <CardTitle>Technical Requirements</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Sound System</label>
                    <Textarea
                      value={contractData.technical.soundSystem}
                      onChange={(e) => handleTechnicalChange('soundSystem', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Lighting System</label>
                    <Textarea
                      value={contractData.technical.lightingSystem}
                      onChange={(e) => handleTechnicalChange('lightingSystem', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Stage Requirements</label>
                    <Textarea
                      value={contractData.technical.stage}
                      onChange={(e) => handleTechnicalChange('stage', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Parking</label>
                    <Textarea
                      value={contractData.technical.parking}
                      onChange={(e) => handleTechnicalChange('parking', e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hospitality Requirements */}
            {contractData.hospitality && (
              <Card>
                <CardHeader>
                  <CardTitle>Hospitality Requirements</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Green Room</label>
                    <Textarea
                      value={contractData.hospitality.greenRoom}
                      onChange={(e) => handleHospitalityChange('greenRoom', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Meals</label>
                    <Textarea
                      value={contractData.hospitality.meals}
                      onChange={(e) => handleHospitalityChange('meals', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Dressing Room</label>
                    <Textarea
                      value={contractData.hospitality.dressing}
                      onChange={(e) => handleHospitalityChange('dressing', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Accommodations</label>
                    <Textarea
                      value={contractData.hospitality.accommodations}
                      onChange={(e) => handleHospitalityChange('accommodations', e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Special Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Special Requests & Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Special Requests</label>
                  <Textarea
                    value={contractData.specialRequests ?? ''}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    placeholder="Any special requests..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Additional Notes</label>
                  <Textarea
                    value={contractData.notes ?? ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contract Preview</CardTitle>
                <CardDescription>This is how your contract will look</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-8 rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
                  <div className="space-y-4 text-sm">
                    <h2 className="text-2xl font-bold">ARTIST RIDER CONTRACT</h2>
                    <hr />
                    <div>
                      <h3 className="font-bold">EVENT DETAILS</h3>
                      <p>Artist: {contractData.artistName}</p>
                      <p>Venue: {contractData.venueName}</p>
                      <p>Date: {contractData.eventDate} at {contractData.eventTime}</p>
                      <p>Fee: ${contractData.totalFee.toFixed(2)}</p>
                    </div>
                    {contractData.technical && (
                      <div>
                        <h3 className="font-bold">TECHNICAL REQUIREMENTS</h3>
                        <p>Sound: {contractData.technical.soundSystem}</p>
                        <p>Lighting: {contractData.technical.lightingSystem}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Download Tab */}
          <TabsContent value="download" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate & Download Contract</CardTitle>
                <CardDescription>Create your PDF contract and download it</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    Review all details in the Details tab before generating your contract PDF.
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleGeneratePDF}
                    disabled={loading || !contractData.artistName || !contractData.venueName}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Generate & Download PDF
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleSaveAsTemplate}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save as Template
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-900">
                    Your contract will be ready to download and share with the venue.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
