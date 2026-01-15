import React, { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface RiderTemplate {
  id: number;
  templateName: string;
  technicalRequirements?: {
    stageWidth?: string;
    stageDepth?: string;
    soundSystem?: string;
    lighting?: string;
    backline?: string;
    other?: string;
  };
  hospitalityRequirements?: {
    dressingRooms?: string;
    catering?: string;
    beverages?: string;
    accommodation?: string;
    other?: string;
  };
  financialTerms?: {
    depositAmount?: string;
    paymentMethod?: string;
    cancellationPolicy?: string;
    other?: string;
  };
}

export function RiderTemplateBuilder() {
  const [templates, setTemplates] = useState<RiderTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<RiderTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: myTemplates } = trpc.riderTemplate.list.useQuery();
  const createMutation = trpc.riderTemplate.create.useMutation();
  const updateMutation = trpc.riderTemplate.update.useMutation();
  const deleteMutation = trpc.riderTemplate.delete.useMutation();

  useEffect(() => {
    if (myTemplates) {
      setTemplates(myTemplates);
      if (myTemplates.length > 0 && !selectedTemplate) {
        setSelectedTemplate(myTemplates[0]);
      }
    }
  }, [myTemplates]);

  const [formData, setFormData] = useState<RiderTemplate>({
    id: 0,
    templateName: '',
    technicalRequirements: {},
    hospitalityRequirements: {},
    financialTerms: {},
  });

  const handleNewTemplate = () => {
    setFormData({
      id: 0,
      templateName: '',
      technicalRequirements: {},
      hospitalityRequirements: {},
      financialTerms: {},
    });
    setSelectedTemplate(null);
    setIsCreating(true);
  };

  const handleSelectTemplate = (template: RiderTemplate) => {
    setFormData(template);
    setSelectedTemplate(template);
    setIsCreating(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTechnicalChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      technicalRequirements: {
        ...prev.technicalRequirements,
        [field]: value,
      },
    }));
  };

  const handleHospitalityChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      hospitalityRequirements: {
        ...prev.hospitalityRequirements,
        [field]: value,
      },
    }));
  };

  const handleFinancialChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      financialTerms: {
        ...prev.financialTerms,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!formData.templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setLoading(true);
    try {
      if (isCreating || formData.id === 0) {
        await createMutation.mutateAsync({
          templateName: formData.templateName,
          technicalRequirements: formData.technicalRequirements,
          hospitalityRequirements: formData.hospitalityRequirements,
          financialTerms: formData.financialTerms,
        });
        toast.success('Template created successfully');
      } else {
        await updateMutation.mutateAsync({
          id: formData.id,
          templateName: formData.templateName,
          technicalRequirements: formData.technicalRequirements,
          hospitalityRequirements: formData.hospitalityRequirements,
          financialTerms: formData.financialTerms,
        });
        toast.success('Template updated successfully');
      }
      setIsCreating(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    setLoading(true);
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success('Template deleted successfully');
      setSelectedTemplate(null);
      setIsCreating(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Templates List */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Your Templates</h3>
          <div className="space-y-2 mb-4">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={`w-full text-left p-3 rounded border-2 transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-sm">{template.templateName}</p>
              </button>
            ))}
          </div>
          <Button
            onClick={handleNewTemplate}
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </Card>

        {/* Template Editor */}
        <div className="col-span-2">
          {selectedTemplate || isCreating ? (
            <Card className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Template Name *</label>
                <Input
                  type="text"
                  name="templateName"
                  value={formData.templateName}
                  onChange={handleInputChange}
                  placeholder="e.g., Standard Rock Show, Festival Setup"
                  disabled={loading}
                />
              </div>

              <Tabs defaultValue="technical" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                  <TabsTrigger value="hospitality">Hospitality</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                </TabsList>

                <TabsContent value="technical" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Stage Width</label>
                    <Input
                      type="text"
                      placeholder="e.g., 40 feet"
                      value={formData.technicalRequirements?.stageWidth || ''}
                      onChange={(e) => handleTechnicalChange('stageWidth', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Stage Depth</label>
                    <Input
                      type="text"
                      placeholder="e.g., 25 feet"
                      value={formData.technicalRequirements?.stageDepth || ''}
                      onChange={(e) => handleTechnicalChange('stageDepth', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Sound System</label>
                    <Textarea
                      placeholder="Describe required sound system..."
                      value={formData.technicalRequirements?.soundSystem || ''}
                      onChange={(e) => handleTechnicalChange('soundSystem', e.target.value)}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Lighting</label>
                    <Textarea
                      placeholder="Describe required lighting setup..."
                      value={formData.technicalRequirements?.lighting || ''}
                      onChange={(e) => handleTechnicalChange('lighting', e.target.value)}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Backline</label>
                    <Textarea
                      placeholder="List required instruments and equipment..."
                      value={formData.technicalRequirements?.backline || ''}
                      onChange={(e) => handleTechnicalChange('backline', e.target.value)}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Other Technical Requirements</label>
                    <Textarea
                      placeholder="Any other technical requirements..."
                      value={formData.technicalRequirements?.other || ''}
                      onChange={(e) => handleTechnicalChange('other', e.target.value)}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="hospitality" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Dressing Rooms</label>
                    <Textarea
                      placeholder="Describe dressing room requirements..."
                      value={formData.hospitalityRequirements?.dressingRooms || ''}
                      onChange={(e) => handleHospitalityChange('dressingRooms', e.target.value)}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Catering</label>
                    <Textarea
                      placeholder="Describe catering requirements..."
                      value={formData.hospitalityRequirements?.catering || ''}
                      onChange={(e) => handleHospitalityChange('catering', e.target.value)}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Beverages</label>
                    <Textarea
                      placeholder="Describe beverage requirements..."
                      value={formData.hospitalityRequirements?.beverages || ''}
                      onChange={(e) => handleHospitalityChange('beverages', e.target.value)}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Accommodation</label>
                    <Textarea
                      placeholder="Describe accommodation requirements..."
                      value={formData.hospitalityRequirements?.accommodation || ''}
                      onChange={(e) => handleHospitalityChange('accommodation', e.target.value)}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Other Hospitality Requirements</label>
                    <Textarea
                      placeholder="Any other hospitality requirements..."
                      value={formData.hospitalityRequirements?.other || ''}
                      onChange={(e) => handleHospitalityChange('other', e.target.value)}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Deposit Amount</label>
                    <Input
                      type="text"
                      placeholder="e.g., 50% of total fee"
                      value={formData.financialTerms?.depositAmount || ''}
                      onChange={(e) => handleFinancialChange('depositAmount', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Method</label>
                    <Textarea
                      placeholder="Describe accepted payment methods..."
                      value={formData.financialTerms?.paymentMethod || ''}
                      onChange={(e) => handleFinancialChange('paymentMethod', e.target.value)}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Cancellation Policy</label>
                    <Textarea
                      placeholder="Describe cancellation policy..."
                      value={formData.financialTerms?.cancellationPolicy || ''}
                      onChange={(e) => handleFinancialChange('cancellationPolicy', e.target.value)}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Other Financial Terms</label>
                    <Textarea
                      placeholder="Any other financial terms..."
                      value={formData.financialTerms?.other || ''}
                      onChange={(e) => handleFinancialChange('other', e.target.value)}
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-3 mt-6 pt-6 border-t">
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? 'Create Template' : 'Update Template'}
                </Button>
                {!isCreating && selectedTemplate && (
                  <Button
                    onClick={() => handleDelete(selectedTemplate.id)}
                    variant="destructive"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center text-gray-500">
              <p>Select a template or create a new one to get started</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
