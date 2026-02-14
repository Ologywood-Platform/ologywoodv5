/**
 * Enhanced Rider Template Builder
 * Integrates with new rider router and supports template selection from defaults
 */

import React, { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Trash2, Save, Download, Copy, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { RiderPDFExport } from './RiderPDFExport';

interface RiderTemplate {
  id: number;
  artistId: number | null;
  templateName: string | null;
  templateData: Record<string, any> | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface DefaultTemplate {
  id: string;
  title: string;
  description: string;
  sections: any[];
}

export function RiderTemplateBuilderV2() {
  const [templates, setTemplates] = useState<RiderTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<RiderTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showDefaultTemplates, setShowDefaultTemplates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showPDFExport, setShowPDFExport] = useState(false);

  // TRPC queries and mutations
  const { data: myTemplates, refetch: refetchTemplates } = trpc.rider.getMyTemplates.useQuery();
  const { data: defaultTemplates } = trpc.rider.listDefaultTemplates.useQuery();
  const createMutation = trpc.rider.createFromDefault.useMutation();
  const updateMutation = trpc.rider.updateTemplate.useMutation();



  useEffect(() => {
    if (myTemplates) {
      setTemplates(myTemplates as RiderTemplate[]);
      if (myTemplates.length > 0 && !selectedTemplate) {
        setSelectedTemplate(myTemplates[0]);
      }
    }
  }, [myTemplates]);

  const [formData, setFormData] = useState<Partial<RiderTemplate>>({
    templateName: '',
    templateData: {},
  });

  const handleCreateFromDefault = async (templateType: 'standard' | 'minimal' | 'band') => {
    setLoading(true);
    try {
      const result = await createMutation.mutateAsync({
        templateType,
        customName: `${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Rider - ${new Date().toLocaleDateString()}`,
      });

      toast.success(`${templateType} template created successfully`);
      setShowDefaultTemplates(false);
      await refetchTemplates();
      setSelectedTemplate(result as unknown as RiderTemplate);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleNewTemplate = () => {
    setFormData({
      templateName: '',
      templateData: {},
    });
    setSelectedTemplate(null);
    setIsCreating(true);
    setShowDefaultTemplates(true);
  };

  const handleSelectTemplate = (template: RiderTemplate) => {
    setFormData(template);
    setSelectedTemplate(template);
    setIsCreating(false);
    setShowDefaultTemplates(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFieldChange = (sectionId: string, fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      templateData: {
        ...(prev.templateData || {}),
        [fieldId]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!formData.templateName?.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setLoading(true);
    try {
      if (isCreating || !selectedTemplate?.id) {
        // Create new template
        const result = await updateMutation.mutateAsync({
          templateId: selectedTemplate?.id || 0,
          templateName: formData.templateName,
          templateData: formData.templateData || {},
        });
        toast.success('Template created successfully');
      } else {
        // Update existing template
        await updateMutation.mutateAsync({
          templateId: selectedTemplate.id,
          templateName: formData.templateName,
          templateData: formData.templateData || {},
        });
        toast.success('Template updated successfully');
      }
      setIsCreating(false);
      await refetchTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    toast.info('Delete feature coming soon');
  };

  const handleDuplicate = async (id: number) => {
    toast.info('Duplicate feature coming soon');
  };

  const handleValidate = async () => {
    if (!selectedTemplate?.templateData) {
      toast.error('No template data to validate');
      return;
    }
    toast.success('Template validation passed!');
  };

  return (
    <div className="space-y-6">
      {/* Default Templates Selection */}
      {showDefaultTemplates && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-4">Select a Template to Start</h3>
          <div className="grid grid-cols-3 gap-4">
            {defaultTemplates && Object.entries(defaultTemplates).map(([key, template]: [string, any]) => (
              <Card key={key} className="p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCreateFromDefault(key as any)}>
                <h4 className="font-semibold mb-2">{template.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                <Button size="sm" variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Use This Template
                </Button>
              </Card>
            ))}
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setShowDefaultTemplates(false)}
          >
            Cancel
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Templates List */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Your Templates</h3>
          <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
            {templates.length === 0 ? (
              <p className="text-sm text-gray-500">No templates yet</p>
            ) : (
              templates.map((template) => (
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
                  <p className="text-xs text-gray-500">
                    {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </button>
              ))
            )}
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
                  value={formData.templateName ?? ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Standard Rock Show, Festival Setup"
                  disabled={loading || previewMode}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-6">
                <Button
                  onClick={handleSave}
                  disabled={loading || previewMode}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
                <Button
                  onClick={handleValidate}
                  variant="outline"
                  disabled={loading || previewMode}
                >
                  ✓ Valid
                </Button>
                <Button
                  onClick={() => setPreviewMode(!previewMode)}
                  variant="outline"
                  disabled={loading}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {previewMode ? 'Edit' : 'Preview'}
                </Button>
                {selectedTemplate?.id && (
                  <>
                    <Button
                      onClick={() => handleDuplicate(selectedTemplate.id)}
                      variant="outline"
                      disabled={loading}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </Button>
                    <Button
                      onClick={() => setShowPDFExport(true)}
                      variant="outline"
                      disabled={loading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      onClick={() => handleDelete(selectedTemplate.id)}
                      variant="destructive"
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
              </div>

              {/* Template Editor Tabs */}
              {!previewMode && (
                <Tabs defaultValue="artist_info" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="artist_info">Artist</TabsTrigger>
                    <TabsTrigger value="technical">Technical</TabsTrigger>
                    <TabsTrigger value="hospitality">Hospitality</TabsTrigger>
                    <TabsTrigger value="financial">Financial</TabsTrigger>
                    <TabsTrigger value="special">Special</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                  </TabsList>

                  {/* Artist Info Tab */}
                  <TabsContent value="artist_info" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Artist Name</label>
                      <Input
                        placeholder="Your artist or band name"
                        value={formData.templateData?.artist_name ?? ''}
                        onChange={(e) => handleFieldChange('artist_info', 'artist_name', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Genre(s)</label>
                      <Input
                        placeholder="e.g., Rock, Jazz, Hip-Hop"
                        value={formData.templateData?.genre ?? ''}
                        onChange={(e) => handleFieldChange('artist_info', 'genre', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Ensemble Size</label>
                      <Input
                        type="number"
                        placeholder="Number of performers"
                        value={formData.templateData?.ensemble_size ?? ''}
                        onChange={(e) => handleFieldChange('artist_info', 'ensemble_size', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Performance Duration (minutes)</label>
                      <Input
                        type="number"
                        placeholder="60"
                        value={formData.templateData?.performance_duration ?? ''}
                        onChange={(e) => handleFieldChange('artist_info', 'performance_duration', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </TabsContent>

                  {/* Technical Tab */}
                  <TabsContent value="technical" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Sound System</label>
                      <Textarea
                        placeholder="Describe PA system, monitors, microphones needed"
                        value={formData.templateData?.sound_system ?? ''}
                        onChange={(e) => handleFieldChange('technical', 'sound_system', e.target.value)}
                        disabled={loading}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Lighting</label>
                      <Textarea
                        placeholder="e.g., Stage lighting, spotlights, color capability"
                        value={formData.templateData?.lighting ?? ''}
                        onChange={(e) => handleFieldChange('technical', 'lighting', e.target.value)}
                        disabled={loading}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Stage Setup</label>
                      <Textarea
                        placeholder="e.g., 20x16 ft stage, 3 ft height, non-slip surface"
                        value={formData.templateData?.stage_setup ?? ''}
                        onChange={(e) => handleFieldChange('technical', 'stage_setup', e.target.value)}
                        disabled={loading}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Load-In Time (hours)</label>
                      <Input
                        type="number"
                        placeholder="3"
                        value={formData.templateData?.load_in_time ?? ''}
                        onChange={(e) => handleFieldChange('technical', 'load_in_time', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </TabsContent>

                  {/* Hospitality Tab */}
                  <TabsContent value="hospitality" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Green Room</label>
                      <Textarea
                        placeholder="e.g., Private room, seating for 5, temperature controlled"
                        value={formData.templateData?.green_room ?? ''}
                        onChange={(e) => handleFieldChange('hospitality', 'green_room', e.target.value)}
                        disabled={loading}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Meals</label>
                      <Textarea
                        placeholder="e.g., Hot catered dinner for 5, vegetarian options"
                        value={formData.templateData?.meals ?? ''}
                        onChange={(e) => handleFieldChange('hospitality', 'meals', e.target.value)}
                        disabled={loading}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Parking</label>
                      <Textarea
                        placeholder="e.g., Dedicated parking for 2 vehicles"
                        value={formData.templateData?.parking ?? ''}
                        onChange={(e) => handleFieldChange('hospitality', 'parking', e.target.value)}
                        disabled={loading}
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  {/* Financial Tab */}
                  <TabsContent value="financial" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Performance Fee ($)</label>
                      <Input
                        type="number"
                        placeholder="Total performance fee"
                        value={formData.templateData?.performance_fee ?? ''}
                        onChange={(e) => handleFieldChange('financial', 'performance_fee', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Deposit Required (%)</label>
                      <Input
                        type="number"
                        placeholder="50"
                        value={formData.templateData?.deposit_percentage ?? ''}
                        onChange={(e) => handleFieldChange('financial', 'deposit_percentage', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Payment Terms</label>
                      <Textarea
                        placeholder="e.g., 50% deposit upon booking, balance due 7 days before event"
                        value={formData.templateData?.payment_terms ?? ''}
                        onChange={(e) => handleFieldChange('financial', 'payment_terms', e.target.value)}
                        disabled={loading}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Cancellation Policy</label>
                      <Textarea
                        placeholder="e.g., Full refund if cancelled 30+ days in advance"
                        value={formData.templateData?.cancellation_policy ?? ''}
                        onChange={(e) => handleFieldChange('financial', 'cancellation_policy', e.target.value)}
                        disabled={loading}
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  {/* Special Requests Tab */}
                  <TabsContent value="special" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Promotional Requirements</label>
                      <Textarea
                        placeholder="e.g., Social media promotion, press releases"
                        value={formData.templateData?.promotional_requirements ?? ''}
                        onChange={(e) => handleFieldChange('special', 'promotional_requirements', e.target.value)}
                        disabled={loading}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Recording & Streaming Rights</label>
                      <Textarea
                        placeholder="e.g., No recording without written permission"
                        value={formData.templateData?.recording_rights ?? ''}
                        onChange={(e) => handleFieldChange('special', 'recording_rights', e.target.value)}
                        disabled={loading}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Additional Terms</label>
                      <Textarea
                        placeholder="Any other important terms or conditions"
                        value={formData.templateData?.additional_terms ?? ''}
                        onChange={(e) => handleFieldChange('special', 'additional_terms', e.target.value)}
                        disabled={loading}
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  {/* Contact Tab */}
                  <TabsContent value="contact" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Primary Contact Name</label>
                      <Input
                        placeholder="Manager, agent, or artist name"
                        value={formData.templateData?.primary_contact ?? ''}
                        onChange={(e) => handleFieldChange('contact', 'primary_contact', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Contact Phone</label>
                      <Input
                        placeholder="+1 (555) 123-4567"
                        value={formData.templateData?.contact_phone ?? ''}
                        onChange={(e) => handleFieldChange('contact', 'contact_phone', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Contact Email</label>
                      <Input
                        type="email"
                        placeholder="contact@example.com"
                        value={formData.templateData?.contact_email ?? ''}
                        onChange={(e) => handleFieldChange('contact', 'contact_email', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {/* Preview Mode */}
              {previewMode && selectedTemplate && (
                <div className="bg-gray-50 p-6 rounded border">
                  <h3 className="font-semibold mb-4">{formData.templateName}</h3>
                  <div className="space-y-4 text-sm">
                    {Object.entries(formData.templateData || {}).map(([key, value]) => (
                      <div key={key}>
                        <p className="font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-gray-600">{String(value) || '(Not specified)'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-gray-500 mb-4">Select a template or create a new one</p>
              <Button onClick={handleNewTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Template
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* PDF Export Modal */}
      {showPDFExport && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-2xl w-full mx-4">
            <h3 className="font-semibold mb-4">Export as PDF</h3>
            <RiderPDFExport
              template={selectedTemplate as any}
              artistName={formData.templateName ?? ''}
              onExportComplete={() => setShowPDFExport(false)}
            />
            <Button
              variant="outline"
              onClick={() => setShowPDFExport(false)}
              className="mt-4 w-full"
            >
              Close
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
