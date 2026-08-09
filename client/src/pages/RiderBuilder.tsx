import { useState, useMemo, useEffect } from "react";
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
  Trophy,
  Mic,
  PenTool,
  MapPin,
  Film,
  Video,
} from "lucide-react";
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { HelperNote } from '@/components/HelperNote';
import { HelperNotesToggle } from '@/components/HelperNotesToggle';
import { ContractFormProgress, FieldValidationMessage, NILComplianceChecklist } from '@/components/ContractFormValidation';
import { useContractValidation } from '@/hooks/useContractValidation';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';
import { SiteHeader } from "@/components/SiteHeader";

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

// ============= TEMPLATE PICKER CONFIG =============

const TEMPLATE_OPTIONS = [
  {
    id: 'simple_booking',
    title: 'Booking Rider',
    description: 'Standard performance rider for any artist booking',
    icon: 'file-text',
    category: 'Artist',
  },
  {
    id: 'athlete_appearance',
    title: 'Appearance Rider',
    description: 'Meet & greets, event appearances, and public events',
    icon: 'star',
    category: 'Athlete',
  },
  {
    id: 'athlete_signing',
    title: 'Autograph Signing',
    description: 'Dedicated autograph signing sessions',
    icon: 'pen-tool',
    category: 'Athlete',
  },
  {
    id: 'athlete_speaking',
    title: 'Speaking Engagement',
    description: 'Keynotes, panels, and motivational talks',
    icon: 'mic',
    category: 'Athlete',
  },
  {
    id: 'athlete_camp',
    title: 'Camp / Clinic',
    description: 'Sports camps, training clinics, and youth programs',
    icon: 'trophy',
    category: 'Athlete',
  },
  {
    id: 'filmmaker_production',
    title: 'Production Rider',
    description: 'Film and video production bookings with deliverables',
    icon: 'film',
    category: 'Filmmaker',
  },
  {
    id: 'filmmaker_event',
    title: 'Event Coverage',
    description: 'Live event videography and photography coverage',
    icon: 'video',
    category: 'Filmmaker',
  },
];

function getTemplateIcon(iconName: string) {
  switch (iconName) {
    case 'star': return <Star className="h-5 w-5" />;
    case 'pen-tool': return <PenTool className="h-5 w-5" />;
    case 'mic': return <Mic className="h-5 w-5" />;
    case 'trophy': return <Trophy className="h-5 w-5" />;
    case 'map-pin': return <MapPin className="h-5 w-5" />;
    case 'film': return <Film className="h-5 w-5" />;
    case 'video': return <Video className="h-5 w-5" />;
    default: return <FileText className="h-5 w-5" />;
  }
}

// ============= MAIN COMPONENT =============

export default function RiderBuilder() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();

  // State
  const [mode, setMode] = useState<"list" | "pick_template" | "edit">("list");
  const [templateStructure, setTemplateStructure] = useState<RiderContractTemplate | null>(null);
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>("simple_booking");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [riderName, setRiderName] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [attempted, setAttempted] = useState(false);
  const contractValidation = useContractValidation(selectedTemplateType);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  // Auto-save draft hook
  const autoSave = useAutoSaveDraft(user?.id);

  // Check for existing draft on mount
  useEffect(() => {
    if (user?.id && mode === 'list' && autoSave.hasDraft()) {
      setShowDraftBanner(true);
    }
  }, [user?.id, mode]);

  // Auto-save on form changes (only in edit mode)
  useEffect(() => {
    if (mode === 'edit' && !editingTemplateId) {
      autoSave.saveDraft(formData, riderName, selectedTemplateType);
    }
  }, [formData, riderName, selectedTemplateType, mode, editingTemplateId]);

  // Fetch artist profile to determine talent type
  const { data: artistProfile } = trpc.artist.getMyProfile.useQuery(undefined, {
    enabled: !!user,
  });

  // tRPC
  const { data: myTemplates, refetch: refetchTemplates, isLoading: templatesLoading } =
    trpc.rider.getMyTemplates.useQuery(undefined, { enabled: !!user });

  const { data: defaultTemplate } = trpc.rider.getDefaultTemplate.useQuery(
    { templateType: selectedTemplateType },
    { enabled: mode === "edit" && !templateStructure }
  );

  const createMutation = trpc.rider.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Rider saved!");
      autoSave.clearDraft();
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

  // Start creating a new rider — show template picker
  const startNew = () => {
    resetForm();
    setMode("pick_template");
  };

  // Select a template type and proceed to edit
  const selectTemplate = (templateType: string) => {
    setSelectedTemplateType(templateType);
    setMode("edit");
  };

  // Start editing existing
  const startEditing = (template: any) => {
    setEditingTemplateId(template.id);
    setRiderName(template.templateName || "");
    const baseType = template.templateType || template.templateData?.baseTemplate || "simple_booking";
    setSelectedTemplateType(baseType);
    setMode("edit");
  };

  // When defaultTemplate loads and we're in edit mode without structure
  if (defaultTemplate && mode === "edit" && !templateStructure) {
    const existingTemplate = editingTemplateId
      ? myTemplates?.find((t: any) => t.id === editingTemplateId)
      : null;
    const existingData = existingTemplate?.templateData?.formData || existingTemplate?.templateData;
    populateDefaults(defaultTemplate, existingData || undefined);
  }

  const resetForm = () => {
    setMode("list");
    setTemplateStructure(null);
    setSelectedTemplateType("simple_booking");
    setFormData({});
    setRiderName("");
    setEditingTemplateId(null);
    setShowPreview(false);
    setFieldErrors({});
    setAttempted(false);
  };

  // Restore a saved draft
  const restoreDraft = () => {
    const draft = autoSave.loadDraft();
    if (draft) {
      setSelectedTemplateType(draft.templateType);
      setFormData(draft.formData);
      setRiderName(draft.riderName);
      setMode('edit');
      setShowDraftBanner(false);
      toast.success('Draft restored! Continue where you left off.');
    }
  };

  // Discard saved draft
  const handleDiscardDraft = () => {
    autoSave.discardDraft();
    setShowDraftBanner(false);
    toast('Draft discarded');
  };

  // Handle field changes
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    // Update contract validation state
    contractValidation.updateField(fieldId, value);
    contractValidation.touchField(fieldId);
    // Clear error for this field when user types
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  // Validate all required fields
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!riderName.trim()) {
      errors['riderName'] = 'Rider Name is required';
    }

    if (templateStructure) {
      for (const section of templateStructure.sections) {
        for (const field of section.fields) {
          if (field.required) {
            const value = formData[field.id];
            if (value === undefined || value === '' || value === null) {
              errors[field.id] = `${field.label} is required`;
            }
          }
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save
  const handleSave = () => {
    setAttempted(true);

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const templateData = {
      baseTemplate: selectedTemplateType,
      formData,
    };

    if (editingTemplateId) {
      updateMutation.mutate({ templateId: editingTemplateId, templateName: riderName, templateData });
    } else {
      createMutation.mutate({ templateName: riderName, templateData, templateType: selectedTemplateType });
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
    const nameField = formData.artist_name || formData.athlete_name || 'Talent';
    const eventField = formData.event_name || '';
    const dateField = formData.event_date || 'TBD';

    let html = `<div style="font-family: system-ui, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; color: #1a1a2e;">
      <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #6c5ce7; padding-bottom: 12px;">
        <h1 style="margin: 0 0 4px 0; color: #6c5ce7; font-size: 22px;">${nameField} — ${templateStructure.title}</h1>
        <p style="margin: 0; color: #666; font-size: 13px;">${eventField} · ${dateField}</p>
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
      <div style="width: 45%;"><p style="font-size: 11px; font-weight: 600; color: #6c5ce7; text-transform: uppercase; margin-bottom: 20px;">Talent Signature</p><div style="border-bottom: 1px solid #333;"></div></div>
      <div style="width: 45%;"><p style="font-size: 11px; font-weight: 600; color: #6c5ce7; text-transform: uppercase; margin-bottom: 20px;">Client / Venue Signature</p><div style="border-bottom: 1px solid #333;"></div></div>
    </div><p style="text-align: center; color: #ccc; font-size: 10px; margin-top: 24px;">Generated by Ologywood</p></div>`;
    return html;
  }, [templateStructure, formData]);

  // Download as text
  const handleDownload = () => {
    if (!templateStructure) return;
    const nameField = formData.artist_name || formData.athlete_name || 'Talent';
    let text = `${templateStructure.title.toUpperCase()} CONTRACT\n${'='.repeat(40)}\n${nameField}\n\n`;
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
    a.download = `${riderName || 'Rider'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Rider downloaded");
  };

  // ============= RENDER FIELD =============

  const renderField = (field: RiderField) => {
    const value = formData[field.id];
    const error = fieldErrors[field.id];

    if (field.type === "checkbox") {
      return (
        <div key={field.id} className="flex items-start gap-3 py-1">
      <SiteHeader />
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
            className={`w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${error ? 'border-red-500' : ''}`}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
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
            className={`resize-y ${error ? 'border-red-500' : ''}`}
          />
          {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
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
          className={error ? 'border-red-500' : ''}
        />
                {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        <FieldValidationMessage
          error={!error ? contractValidation.getFieldError(field.id) : undefined}
          warning={contractValidation.getFieldWarning(field.id)}
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

  // ============= TEMPLATE PICKER MODE =============

  if (mode === "pick_template") {
    // Determine which templates to show based on talent type
    const talentType = (artistProfile as any)?.talentType;
    const isAthlete = talentType === 'athlete';
    const isCreator = talentType === 'creator';
    const isFilmmaker = talentType === 'filmmaker';

    // Show all templates — prioritize the user's own category first
    const sortedTemplates = [...TEMPLATE_OPTIONS].sort((a, b) => {
      const myCategory = isAthlete ? 'Athlete' : isFilmmaker ? 'Filmmaker' : 'Artist';
      if (a.category === myCategory && b.category !== myCategory) return -1;
      if (a.category !== myCategory && b.category === myCategory) return 1;
      return 0;
    });

    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Choose a Rider Template</h1>
              <p className="text-xs text-muted-foreground">Select the type that matches your booking</p>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 max-w-3xl">
          {/* Recommended templates for user's talent type */}
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recommended for You
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {sortedTemplates
              .filter(t => t.category === (isAthlete ? 'Athlete' : isFilmmaker ? 'Filmmaker' : 'Artist'))
              .map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-md hover:border-purple-300 transition-all"
                  onClick={() => selectTemplate(template.id)}
                >
                  <CardContent className="py-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      {getTemplateIcon(template.icon)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm">{template.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Other templates */}
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Other Templates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sortedTemplates
              .filter(t => t.category !== (isAthlete ? 'Athlete' : isFilmmaker ? 'Filmmaker' : 'Artist'))
              .map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-md hover:border-purple-300 transition-all"
                  onClick={() => selectTemplate(template.id)}
                >
                  <CardContent className="py-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      template.category === 'Athlete' ? 'bg-purple-100 text-purple-600' :
                      template.category === 'Filmmaker' ? 'bg-amber-100 text-amber-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {getTemplateIcon(template.icon)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm">{template.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                      <span className="text-[10px] text-muted-foreground">{template.category}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
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
              <div>
                <h1 className="text-lg font-bold">
                  {editingTemplateId ? "Edit Rider" : `New ${templateStructure.title}`}
                </h1>
                {!editingTemplateId && (
                  <Badge variant="secondary" className="text-xs mt-0.5">
                    {templateStructure.category}
                  </Badge>
                )}
                {autoSave.showSavedIndicator && !editingTemplateId && (
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-0.5">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Draft saved
                  </span>
                )}
              </div>
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
              onChange={(e) => {
                setRiderName(e.target.value);
                if (fieldErrors['riderName'] && e.target.value.trim()) {
                  setFieldErrors((prev) => { const next = { ...prev }; delete next['riderName']; return next; });
                }
              }}
              placeholder={`e.g., My ${templateStructure.title}`}
              className={`text-base ${fieldErrors['riderName'] ? 'border-red-500' : ''}`}
            />
            {fieldErrors['riderName'] && <p className="text-xs text-red-500 mt-0.5">{fieldErrors['riderName']}</p>}
            <HelperNote>Give it a clear name so you can quickly pick the right one for each booking.</HelperNote>
          </div>

          <HelperNote size="sm" className="-mt-2">
            {templateStructure.description}
          </HelperNote>

          {/* Form Progress & NIL Compliance */}
          <ContractFormProgress validationState={contractValidation.validationState} />
          {selectedTemplateType.startsWith('athlete_') && (
            <NILComplianceChecklist formData={formData} />
          )}

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
                {section.id === 'payment' && (
                  <HelperNote>Your fee, deposit terms, and payment method. This becomes part of the booking agreement.</HelperNote>
                )}
                {section.id === 'compensation' && (
                  <HelperNote>Your fee, deposit terms, and payment method. This becomes part of the booking agreement.</HelperNote>
                )}
                {section.id === 'travel' && (
                  <HelperNote>Travel and accommodation requirements. The organizer will arrange based on these preferences.</HelperNote>
                )}
                {section.id === 'security' && (
                  <HelperNote>Security and access needs for the event. Specify what the organizer should provide vs. what you bring.</HelperNote>
                )}
                {section.id === 'equipment' && (
                  <HelperNote>Equipment and facility requirements. Be specific about what the organizer needs to provide.</HelperNote>
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
              <DialogDescription>How your rider looks when shared</DialogDescription>
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

        {/* Draft Restore Banner */}
        {showDraftBanner && (
          <Card className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200 truncate">
                  You have an unsaved draft. Would you like to continue?
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={handleDiscardDraft} className="text-xs h-7">
                  Discard
                </Button>
                <Button size="sm" onClick={restoreDraft} className="text-xs h-7 bg-amber-600 hover:bg-amber-700 text-white">
                  Restore Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                A rider tells clients what you need for your booking — logistics, compensation, requirements, and terms. Create one to attach to bookings.
              </p>
              <Button onClick={startNew} className="gap-2 bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4" />
                Create Your First Rider
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myTemplates.map((template: any) => {
              const baseType = template.templateType || template.templateData?.baseTemplate || "simple_booking";
              const templateMeta = TEMPLATE_OPTIONS.find(t => t.id === baseType);
              return (
                <Card key={template.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        templateMeta?.category === 'Athlete' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {templateMeta ? getTemplateIcon(templateMeta.icon) : <FileText className="h-5 w-5" />}
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
                          {templateMeta && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {templateMeta.title}
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
              );
            })}
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
