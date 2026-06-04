import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Download,
  Save,
  Eye,
  FileText,
  Loader2,
  Trash2,
  Plus,
  Edit2,
  Star,
} from "lucide-react";
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { HelperNote } from '@/components/HelperNote';
import { HelperNotesToggle } from '@/components/HelperNotesToggle';

// ============= TYPE DEFINITIONS =============

interface RiderField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "select" | "date" | "time";
  placeholder?: string;
  defaultValue?: string | number | boolean;
  required?: boolean;
  options?: string[];
  description?: string;
  unit?: string;
}

interface RiderSection {
  id: string;
  title: string;
  icon: string;
  fields: RiderField[];
}

interface RiderContractTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  sections: RiderSection[];
  editableFields: string[];
  requiredFields: string[];
}

// ============= MAIN COMPONENT =============

export default function RiderBuilder() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();

  // State
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [templateStructure, setTemplateStructure] = useState<RiderContractTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [riderName, setRiderName] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);

  // tRPC
  const { data: myTemplates, refetch: refetchTemplates, isLoading: templatesLoading } =
    trpc.rider.getMyTemplates.useQuery(undefined, { enabled: !!user });

  const { data: defaultTemplate } = trpc.rider.getDefaultTemplate.useQuery(
    { templateType: "simple_booking" },
    { enabled: mode === "edit" && !templateStructure }
  );

  const createMutation = trpc.rider.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Rider saved!");
      refetchTemplates();
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || "Failed to save"),
  });

  const updateMutation = trpc.rider.updateTemplate.useMutation({
    onSuccess: () => {
      toast.success("Rider updated!");
      refetchTemplates();
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || "Failed to update"),
  });

  const deleteMutation = trpc.rider.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Rider deleted");
      refetchTemplates();
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete"),
  });

  const setDefaultMutation = trpc.rider.setDefault.useMutation({
    onSuccess: () => {
      toast.success("Default rider set — auto-attaches to new bookings");
      refetchTemplates();
    },
    onError: (err: any) => toast.error(err.message || "Failed to set default"),
  });

  const clearDefaultMutation = trpc.rider.clearDefault.useMutation({
    onSuccess: () => {
      toast.success("Default rider cleared");
      refetchTemplates();
    },
    onError: (err: any) => toast.error(err.message || "Failed to clear default"),
  });

  // Populate form from template structure
  const populateDefaults = (template: RiderContractTemplate, existingData?: Record<string, any>) => {
    setTemplateStructure(template);
    if (existingData) {
      setFormData(existingData);
    } else {
      const defaults: Record<string, any> = {};
      for (const section of template.sections) {
        for (const field of section.fields) {
          if (field.defaultValue !== undefined) {
            defaults[field.id] = field.defaultValue;
          }
        }
      }
      setFormData(defaults);
    }
  };

  // Start creating a new rider
  const startNew = () => {
    resetForm();
    if (defaultTemplate) {
      populateDefaults(defaultTemplate);
    }
    setMode("edit");
  };

  // Start editing existing
  const startEditing = (template: any) => {
    setEditingTemplateId(template.id);
    setRiderName(template.templateName || "");
    if (defaultTemplate) {
      populateDefaults(defaultTemplate, template.templateData?.formData || template.templateData || {});
    }
    setMode("edit");
  };

  // When defaultTemplate loads and we're in edit mode without structure
  if (defaultTemplate && mode === "edit" && !templateStructure) {
    populateDefaults(defaultTemplate, editingTemplateId ? undefined : undefined);
  }

  const resetForm = () => {
    setMode("list");
    setTemplateStructure(null);
    setFormData({});
    setRiderName("");
    setEditingTemplateId(null);
    setShowPreview(false);
  };

  // Handle field changes
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  // Save
  const handleSave = () => {
    if (!riderName.trim()) {
      toast.error("Give your rider a name (e.g., 'My Standard Rider')");
      return;
    }

    const templateData = {
      baseTemplate: "simple_booking",
      formData,
    };

    if (editingTemplateId) {
      updateMutation.mutate({ templateId: editingTemplateId, templateName: riderName, templateData });
    } else {
      createMutation.mutate({ templateName: riderName, templateData, templateType: "simple_booking" });
    }
  };

  // Delete
  const confirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate({ templateId: templateToDelete });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  // Generate preview HTML
  const previewHTML = useMemo(() => {
    if (!templateStructure) return "";
    let html = `<div style="font-family: system-ui, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; color: #1a1a2e;">
      <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #6c5ce7; padding-bottom: 12px;">
        <h1 style="margin: 0 0 4px 0; color: #6c5ce7; font-size: 22px;">${formData.artist_name || 'Artist'} — Booking Rider</h1>
        <p style="margin: 0; color: #666; font-size: 13px;">${formData.event_name || ''} · ${formData.event_date || 'TBD'}</p>
      </div>`;

    for (const section of templateStructure.sections) {
      const hasData = section.fields.some(f => formData[f.id] !== undefined && formData[f.id] !== '' && formData[f.id] !== null);
      if (!hasData) continue;

      html += `<div style="margin-bottom: 20px;">
        <h3 style="background: #6c5ce7; color: white; padding: 6px 12px; margin: 0 0 10px 0; font-size: 13px; border-radius: 4px;">${section.title}</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">`;

      for (const field of section.fields) {
        const value = formData[field.id];
        if (value === undefined || value === '' || value === null) continue;
        let display = typeof value === 'boolean' ? (value ? '✓ Yes' : '✗ No') : field.unit ? `${value} ${field.unit}` : value;
        html += `<tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 5px 8px; font-weight: 600; color: #555; width: 40%;">${field.label}</td><td style="padding: 5px 8px; white-space: pre-line;">${display}</td></tr>`;
      }
      html += '</table></div>';
    }

    html += `<div style="margin-top: 32px; padding-top: 12px; border-top: 2px solid #eee; display: flex; justify-content: space-between;">
      <div style="width: 45%;"><p style="font-size: 11px; font-weight: 600; color: #6c5ce7; text-transform: uppercase; margin-bottom: 20px;">Artist Signature</p><div style="border-bottom: 1px solid #333;"></div></div>
      <div style="width: 45%;"><p style="font-size: 11px; font-weight: 600; color: #6c5ce7; text-transform: uppercase; margin-bottom: 20px;">Venue Signature</p><div style="border-bottom: 1px solid #333;"></div></div>
    </div><p style="text-align: center; color: #ccc; font-size: 10px; margin-top: 24px;">Generated by Ologywood</p></div>`;
    return html;
  }, [templateStructure, formData]);

  // Download as text
  const handleDownload = () => {
    if (!templateStructure) return;
    let text = `BOOKING RIDER CONTRACT\n${'='.repeat(40)}\n\n`;
    for (const section of templateStructure.sections) {
      text += `${section.title.toUpperCase()}\n${'-'.repeat(30)}\n`;
      for (const field of section.fields) {
        const value = formData[field.id];
        if (value === undefined || value === '' || value === null) continue;
        let display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : field.unit ? `${value} ${field.unit}` : value;
        text += `${field.label}: ${display}\n`;
      }
      text += '\n';
    }
    text += `\nGenerated ${new Date().toLocaleDateString()}\n`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${riderName || 'Booking_Rider'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Rider downloaded");
  };

  // ============= RENDER FIELD =============

  const renderField = (field: RiderField) => {
    const value = formData[field.id];

    if (field.type === "checkbox") {
      return (
        <div key={field.id} className="flex items-start gap-3 py-1">
          <Checkbox
            id={field.id}
            checked={!!value}
            onCheckedChange={(checked) => handleFieldChange(field.id, !!checked)}
          />
          <div>
            <Label htmlFor={field.id} className="text-sm font-medium cursor-pointer">
              {field.label}
            </Label>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
          </div>
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={field.id} className="space-y-1">
          <Label htmlFor={field.id} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </Label>
          <select
            id={field.id}
            value={value || field.defaultValue || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={field.id} className="space-y-1 col-span-full">
          <Label htmlFor={field.id} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </Label>
          <Textarea
            id={field.id}
            value={value || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={2}
            className="resize-y"
          />
        </div>
      );
    }

    // text, number, date, time
    return (
      <div key={field.id} className="space-y-1">
        <Label htmlFor={field.id} className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
          {field.unit && <span className="text-muted-foreground ml-1 text-xs">({field.unit})</span>}
        </Label>
        <Input
          id={field.id}
          type={field.type === "number" ? "number" : field.type}
          value={value ?? ""}
          onChange={(e) => handleFieldChange(field.id, field.type === "number" ? (e.target.value ? parseFloat(e.target.value) : "") : e.target.value)}
          placeholder={field.placeholder}
        />
      </div>
    );
  };

  // ============= LOADING =============

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // ============= EDIT MODE =============

  if (mode === "edit" && templateStructure) {
    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-bold">
                {editingTemplateId ? "Edit Rider" : "New Rider"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Download</span>
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
          {/* Rider Name */}
          <div className="space-y-1">
            <Label htmlFor="riderName" className="text-sm font-semibold">Rider Name *</Label>
            <Input
              id="riderName"
              value={riderName}
              onChange={(e) => setRiderName(e.target.value)}
              placeholder="e.g., My Standard Rider"
              className="text-base"
            />
            <HelperNote>Give it a clear name like "Club Shows" or "Festival Rider" so you can quickly pick the right one for each booking.</HelperNote>
          </div>

          <HelperNote size="sm" className="-mt-2">
            A rider is your list of requirements for a show — sound, stage, hospitality, and payment terms. Fill in what matters to you; leave the rest blank. Venues see this when they confirm your booking.
          </HelperNote>

          {/* All sections in one flow */}
          {templateStructure.sections.map((section) => (
            <Card key={section.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{section.title}</CardTitle>
                {section.id === 'hospitality' && (
                  <HelperNote>What you need in the green room — drinks, meals, towels. Be specific so venues can prepare.</HelperNote>
                )}
                {section.id === 'technical' && (
                  <HelperNote>Sound and lighting specs. If you bring your own engineer, mention it here.</HelperNote>
                )}
                {section.id === 'stage' && (
                  <HelperNote>Minimum stage size, backline needs, and any setup requirements.</HelperNote>
                )}
                {section.id === 'payment' && (
                  <HelperNote>Your fee, deposit terms, and payment method. This becomes part of the booking agreement.</HelperNote>
                )}
                {section.id === 'logistics' && (
                  <HelperNote>Travel, parking, load-in times, and guest list details.</HelperNote>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {section.fields.map((field) => renderField(field))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rider Preview</DialogTitle>
              <DialogDescription>How your rider looks when shared with venues</DialogDescription>
            </DialogHeader>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewHTML }} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============= LIST MODE (DEFAULT) =============

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="shrink-0">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">My Riders</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Your booking requirements, ready to attach</p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-center">
            <HelperNotesToggle />
            <Button onClick={startNew} className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4" />
              New Rider
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <PageBreadcrumb
          className="mb-4"
          segments={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'My Riders' },
          ]}
        />

        {/* Empty State */}
        {templatesLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : !myTemplates || myTemplates.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No riders yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                A rider tells venues what you need for your performance — sound, stage, hospitality, and payment terms. Create one to attach to bookings.
              </p>
              <Button onClick={startNew} className="gap-2 bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4" />
                Create Your First Rider
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myTemplates.map((template: any) => (
              <Card key={template.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm truncate">{template.templateName || "Unnamed Rider"}</h3>
                        {template.isDefault && (
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200 shrink-0">
                            <Star className="h-3 w-3 mr-0.5 fill-amber-500" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Updated {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : "recently"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <Button variant="outline" size="sm" onClick={() => startEditing(template)}>
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (template.isDefault) {
                          clearDefaultMutation.mutate();
                        } else {
                          setDefaultMutation.mutate({ templateId: template.id });
                        }
                      }}
                      title={template.isDefault ? "Remove as default" : "Set as default"}
                      className={template.isDefault ? "text-amber-600 border-amber-300" : ""}
                    >
                      <Star className={`h-3.5 w-3.5 ${template.isDefault ? "fill-amber-500" : ""}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setTemplateToDelete(template.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this rider?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The rider template will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
