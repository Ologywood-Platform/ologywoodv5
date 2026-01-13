import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function BookingTemplatesTab() {
  const utils = trpc.useUtils();
  const { data: templates, isLoading } = trpc.bookingTemplate.getMyTemplates.useQuery();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    templateName: '',
    venueName: '',
    venueAddress: '',
    venueCapacity: '',
    eventType: '',
    budgetMin: '',
    budgetMax: '',
    standardRequirements: '',
    additionalNotes: '',
  });
  
  const createMutation = trpc.bookingTemplate.create.useMutation({
    onSuccess: () => {
      toast.success('Template created successfully');
      utils.bookingTemplate.getMyTemplates.invalidate();
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create template');
    },
  });
  
  const updateMutation = trpc.bookingTemplate.update.useMutation({
    onSuccess: () => {
      toast.success('Template updated successfully');
      utils.bookingTemplate.getMyTemplates.invalidate();
      setEditingTemplate(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update template');
    },
  });
  
  const deleteMutation = trpc.bookingTemplate.delete.useMutation({
    onSuccess: () => {
      toast.success('Template deleted successfully');
      utils.bookingTemplate.getMyTemplates.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete template');
    },
  });
  
  const resetForm = () => {
    setFormData({
      templateName: '',
      venueName: '',
      venueAddress: '',
      venueCapacity: '',
      eventType: '',
      budgetMin: '',
      budgetMax: '',
      standardRequirements: '',
      additionalNotes: '',
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      templateName: formData.templateName,
      venueName: formData.venueName || undefined,
      venueAddress: formData.venueAddress || undefined,
      venueCapacity: formData.venueCapacity ? parseInt(formData.venueCapacity) : undefined,
      eventType: formData.eventType || undefined,
      budgetMin: formData.budgetMin ? parseInt(formData.budgetMin) : undefined,
      budgetMax: formData.budgetMax ? parseInt(formData.budgetMax) : undefined,
      standardRequirements: formData.standardRequirements || undefined,
      additionalNotes: formData.additionalNotes || undefined,
    };
    
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate, ...data });
    } else {
      createMutation.mutate(data);
    }
  };
  
  const handleEdit = (template: any) => {
    setFormData({
      templateName: template.templateName,
      venueName: template.venueName || '',
      venueAddress: template.venueAddress || '',
      venueCapacity: template.venueCapacity?.toString() || '',
      eventType: template.eventType || '',
      budgetMin: template.budgetMin?.toString() || '',
      budgetMax: template.budgetMax?.toString() || '',
      standardRequirements: template.standardRequirements || '',
      additionalNotes: template.additionalNotes || '',
    });
    setEditingTemplate(template.id);
  };
  
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate({ id });
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading templates...
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Booking Request Templates</CardTitle>
              <CardDescription>
                Save common event details for faster booking requests
              </CardDescription>
            </div>
            <Dialog open={isCreateOpen || editingTemplate !== null} onOpenChange={(open) => {
              if (!open) {
                setIsCreateOpen(false);
                setEditingTemplate(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Edit Template' : 'Create New Template'}
                  </DialogTitle>
                  <DialogDescription>
                    Fill in the common details you want to reuse for booking requests
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="templateName">Template Name *</Label>
                    <Input
                      id="templateName"
                      value={formData.templateName}
                      onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                      placeholder="e.g., Weekend Concert, Corporate Event"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="venueName">Venue Name</Label>
                      <Input
                        id="venueName"
                        value={formData.venueName}
                        onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                        placeholder="Your venue name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventType">Event Type</Label>
                      <Input
                        id="eventType"
                        value={formData.eventType}
                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                        placeholder="e.g., Concert, Wedding, Festival"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="venueAddress">Venue Address</Label>
                    <Input
                      id="venueAddress"
                      value={formData.venueAddress}
                      onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
                      placeholder="Full venue address"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="venueCapacity">Venue Capacity</Label>
                      <Input
                        id="venueCapacity"
                        type="number"
                        value={formData.venueCapacity}
                        onChange={(e) => setFormData({ ...formData, venueCapacity: e.target.value })}
                        placeholder="Number of guests"
                      />
                    </div>
                    <div>
                      <Label htmlFor="budgetMin">Budget Min ($)</Label>
                      <Input
                        id="budgetMin"
                        type="number"
                        value={formData.budgetMin}
                        onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                        placeholder="Minimum budget"
                      />
                    </div>
                    <div>
                      <Label htmlFor="budgetMax">Budget Max ($)</Label>
                      <Input
                        id="budgetMax"
                        type="number"
                        value={formData.budgetMax}
                        onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                        placeholder="Maximum budget"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="standardRequirements">Standard Requirements</Label>
                    <Textarea
                      id="standardRequirements"
                      value={formData.standardRequirements}
                      onChange={(e) => setFormData({ ...formData, standardRequirements: e.target.value })}
                      placeholder="Sound system, lighting, stage setup, etc."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="additionalNotes">Additional Notes</Label>
                    <Textarea
                      id="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      placeholder="Any other standard information"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateOpen(false);
                        setEditingTemplate(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingTemplate ? 'Update' : 'Create'} Template
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>
      
      {!templates || templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No templates yet. Create one to speed up your booking requests!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{template.templateName}</CardTitle>
                    {template.eventType && (
                      <CardDescription>{template.eventType}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(template.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {template.venueName && (
                  <div>
                    <span className="font-medium">Venue:</span> {template.venueName}
                  </div>
                )}
                {template.venueCapacity && (
                  <div>
                    <span className="font-medium">Capacity:</span> {template.venueCapacity} guests
                  </div>
                )}
                {(template.budgetMin || template.budgetMax) && (
                  <div>
                    <span className="font-medium">Budget:</span> $
                    {template.budgetMin || '?'} - ${template.budgetMax || '?'}
                  </div>
                )}
                {template.standardRequirements && (
                  <div>
                    <span className="font-medium">Requirements:</span>
                    <p className="text-muted-foreground line-clamp-2">
                      {template.standardRequirements}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
