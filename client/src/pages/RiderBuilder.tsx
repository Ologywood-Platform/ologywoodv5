import { useState, useRef, useCallback, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Music,
  Users,
  Headphones,
  Mic2,
  ChevronRight,
  Check,
  Settings,
  Coffee,
  DollarSign,
  Phone,
  Layout,
  Loader2,
  Copy,
  Trash2,
  Plus,
  Edit2,
  RotateCcw,
} from "lucide-react";
import PageBreadcrumb from '@/components/PageBreadcrumb';

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

// ============= ICON MAPPING =============

const SECTION_ICONS: Record<string, React.ReactNode> = {
  calendar: <FileText className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  "dollar-sign": <DollarSign className="h-4 w-4" />,
  user: <Music className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  headphones: <Headphones className="h-4 w-4" />,
  "mic-2": <Mic2 className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  layout: <Layout className="h-4 w-4" />,
  coffee: <Coffee className="h-4 w-4" />,
  "file-text": <FileText className="h-4 w-4" />,
  mic: <Music className="h-4 w-4" />,
};

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  mic: <Music className="h-8 w-8" />,
  users: <Users className="h-8 w-8" />,
  headphones: <Headphones className="h-8 w-8" />,
  "mic-2": <Mic2 className="h-8 w-8" />,
};

const TEMPLATE_COLORS: Record<string, string> = {
  solo_artist: "from-violet-500 to-purple-600",
  band: "from-blue-500 to-indigo-600",
  dj: "from-pink-500 to-rose-600",
  speaker: "from-amber-500 to-orange-600",
};

const TEMPLATE_BG: Record<string, string> = {
  solo_artist: "bg-violet-50 border-violet-200 hover:border-violet-400",
  band: "bg-blue-50 border-blue-200 hover:border-blue-400",
  dj: "bg-pink-50 border-pink-200 hover:border-pink-400",
  speaker: "bg-amber-50 border-amber-200 hover:border-amber-400",
};

// ============= MAIN COMPONENT =============

export default function RiderBuilder() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const previewRef = useRef<HTMLDivElement>(null);

  // State
  const [step, setStep] = useState<"select" | "edit" | "manage">("manage");
  const [selectedTemplateType, setSelectedTemplateType] = useState<string | null>(null);
  const [templateStructure, setTemplateStructure] = useState<RiderContractTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [riderName, setRiderName] = useState("");
  const [activeSection, setActiveSection] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);

  // tRPC queries and mutations
  const { data: defaultTemplates } = trpc.rider.listDefaultTemplates.useQuery();
  const { data: myTemplates, refetch: refetchTemplates, isLoading: templatesLoading } =
    trpc.rider.getMyTemplates.useQuery(undefined, {
      enabled: !!user,
    });

  const getDefaultTemplate = trpc.rider.getDefaultTemplate.useQuery(
    { templateType: selectedTemplateType || "" },
    { enabled: !!selectedTemplateType && step === "edit" }
  );

  const createMutation = trpc.rider.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Rider template saved successfully!");
      refetchTemplates();
      resetForm();
      setStep("manage");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save template");
    },
  });

  const updateMutation = trpc.rider.updateTemplate.useMutation({
    onSuccess: () => {
      toast.success("Rider template updated!");
      refetchTemplates();
      resetForm();
      setStep("manage");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update template");
    },
  });

  const deleteMutation = trpc.rider.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template deleted");
      refetchTemplates();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete template");
    },
  });

  const duplicateMutation = trpc.rider.duplicateTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template duplicated!");
      refetchTemplates();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to duplicate template");
    },
  });

  // Populate form when template structure loads
  const populateFormFromTemplate = useCallback(
    (template: RiderContractTemplate, existingData?: Record<string, any>) => {
      setTemplateStructure(template);
      if (template.sections.length > 0) {
        setActiveSection(template.sections[0].id);
      }

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
    },
    []
  );

  // When default template data arrives, populate form
  const prevTemplateRef = useRef<string | null>(null);
  if (
    getDefaultTemplate.data &&
    selectedTemplateType &&
    prevTemplateRef.current !== selectedTemplateType &&
    step === "edit" &&
    !editingTemplateId
  ) {
    prevTemplateRef.current = selectedTemplateType;
    populateFormFromTemplate(getDefaultTemplate.data);
  }

  const resetForm = () => {
    setSelectedTemplateType(null);
    setTemplateStructure(null);
    setFormData({});
    setRiderName("");
    setActiveSection("");
    setShowPreview(false);
    setEditingTemplateId(null);
    prevTemplateRef.current = null;
  };

  // Start creating from a template type
  const startFromTemplate = (templateType: string) => {
    resetForm();
    setSelectedTemplateType(templateType);
    setStep("edit");
  };

  // Start editing an existing saved template
  const startEditing = (template: any) => {
    setEditingTemplateId(template.id);
    setRiderName(template.templateName || "");
    const baseType = template.templateType || template.templateData?.baseTemplate || "solo_artist";
    setSelectedTemplateType(baseType);

    // Fetch the default template structure for this type
    const defaultTpl = getDefaultTemplate.data;
    if (defaultTpl) {
      populateFormFromTemplate(defaultTpl, template.templateData?.formData || template.templateData || {});
    }
    setStep("edit");
  };

  // Handle field changes
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  // Save template
  const handleSave = () => {
    if (!riderName.trim()) {
      toast.error("Please enter a name for this rider template");
      return;
    }

    const templateData = {
      baseTemplate: selectedTemplateType,
      formData: formData,
    };

    if (editingTemplateId) {
      updateMutation.mutate({
        templateId: editingTemplateId,
        templateName: riderName,
        templateData,
      });
    } else {
      createMutation.mutate({
        templateName: riderName,
        templateData,
        templateType: selectedTemplateType || "custom",
      });
    }
  };

  // Delete template
  const confirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate({ templateId: templateToDelete });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  // Download as PDF
  const handleDownloadPDF = async () => {
    if (!templateStructure) return;

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const htmlContent = generatePDFHTML();
      const container = document.createElement("div");
      container.innerHTML = htmlContent;

      const options = {
        margin: 10,
        filename: `${riderName || "Rider_Contract"}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait" as const, unit: "mm" as const, format: "a4" as const },
      };

      html2pdf().set(options).from(container).save();
      toast.success("PDF download started");
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  // Generate PDF HTML
  const generatePDFHTML = (): string => {
    if (!templateStructure) return "";

    let html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1a1a2e;">
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #6c5ce7; padding-bottom: 20px;">
          <h1 style="margin: 0 0 8px 0; color: #6c5ce7; font-size: 28px;">${riderName || "Artist Rider"}</h1>
          <p style="margin: 0; color: #636e72; font-size: 16px;">Performance Rider Contract</p>
          <p style="margin: 8px 0 0 0; color: #b2bec3; font-size: 13px;">Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>`;

    for (const section of templateStructure.sections) {
      const hasData = section.fields.some(
        (f) => formData[f.id] !== undefined && formData[f.id] !== "" && formData[f.id] !== null
      );
      if (!hasData) continue;

      html += `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: white; padding: 10px 16px; margin: 0 0 16px 0; font-size: 15px; font-weight: 600; border-radius: 6px;">${section.title}</h2>
          <div style="padding: 0 8px;">`;

      for (const field of section.fields) {
        const value = formData[field.id];
        if (value === undefined || value === "" || value === null) continue;

        let displayValue = value;
        if (typeof value === "boolean") displayValue = value ? "Yes" : "No";
        if (field.unit) displayValue = `${value} ${field.unit}`;

        html += `
          <div style="margin-bottom: 12px; display: flex; gap: 12px;">
            <span style="font-weight: 600; color: #6c5ce7; font-size: 13px; min-width: 180px; text-transform: uppercase; letter-spacing: 0.3px; padding-top: 2px;">${field.label}</span>
            <span style="color: #2d3436; font-size: 14px; white-space: pre-line; flex: 1; border-left: 2px solid #dfe6e9; padding-left: 12px;">${displayValue}</span>
          </div>`;
      }

      html += "</div></div>";
    }

    html += `
      <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #dfe6e9;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div style="width: 45%;">
            <p style="font-weight: 600; color: #6c5ce7; font-size: 13px; text-transform: uppercase; margin-bottom: 30px;">Artist / Representative Signature</p>
            <div style="border-bottom: 1px solid #2d3436; margin-bottom: 8px;"></div>
            <p style="font-size: 12px; color: #636e72;">Date: _______________</p>
          </div>
          <div style="width: 45%;">
            <p style="font-weight: 600; color: #6c5ce7; font-size: 13px; text-transform: uppercase; margin-bottom: 30px;">Venue / Promoter Signature</p>
            <div style="border-bottom: 1px solid #2d3436; margin-bottom: 8px;"></div>
            <p style="font-size: 12px; color: #636e72;">Date: _______________</p>
          </div>
        </div>
        <p style="text-align: center; color: #b2bec3; font-size: 11px;">Generated by Ologywood - Artist Booking Platform</p>
      </div>
    </div>`;

    return html;
  };

  // Compute filled field count per section
  const sectionProgress = useMemo(() => {
    if (!templateStructure) return {};
    const progress: Record<string, { filled: number; total: number }> = {};
    for (const section of templateStructure.sections) {
      let filled = 0;
      for (const field of section.fields) {
        const val = formData[field.id];
        if (val !== undefined && val !== "" && val !== null) filled++;
      }
      progress[section.id] = { filled, total: section.fields.length };
    }
    return progress;
  }, [templateStructure, formData]);

  // ============= RENDER FIELD =============

  const renderField = (field: RiderField) => {
    const value = formData[field.id];

    switch (field.type) {
      case "text":
      case "date":
      case "time":
        return (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-sm font-medium text-slate-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
              {field.unit && <span className="text-slate-400 ml-1 text-xs">({field.unit})</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-slate-500">{field.description}</p>
            )}
            <Input
              id={field.id}
              type={field.type}
              value={value || ""}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="bg-white"
            />
          </div>
        );

      case "number":
        return (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-sm font-medium text-slate-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
              {field.unit && <span className="text-slate-400 ml-1 text-xs">({field.unit})</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-slate-500">{field.description}</p>
            )}
            <Input
              id={field.id}
              type="number"
              value={value ?? ""}
              onChange={(e) => handleFieldChange(field.id, e.target.value ? parseFloat(e.target.value) : "")}
              placeholder={field.placeholder}
              className="bg-white"
            />
          </div>
        );

      case "textarea":
        return (
          <div key={field.id} className="space-y-1.5 col-span-full">
            <Label htmlFor={field.id} className="text-sm font-medium text-slate-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-slate-500">{field.description}</p>
            )}
            <Textarea
              id={field.id}
              value={value || ""}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="bg-white resize-y"
            />
          </div>
        );

      case "checkbox":
        return (
          <div key={field.id} className="flex items-start gap-3 py-2">
            <Checkbox
              id={field.id}
              checked={!!value}
              onCheckedChange={(checked) => handleFieldChange(field.id, !!checked)}
              className="mt-0.5"
            />
            <div>
              <Label htmlFor={field.id} className="text-sm font-medium text-slate-700 cursor-pointer">
                {field.label}
              </Label>
              {field.description && (
                <p className="text-xs text-slate-500 mt-0.5">{field.description}</p>
              )}
            </div>
          </div>
        );

      case "select":
        return (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-sm font-medium text-slate-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-slate-500">{field.description}</p>
            )}
            <select
              id={field.id}
              value={value || field.defaultValue || ""}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select...</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  // ============= RENDER: LOADING =============

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // ============= RENDER: TEMPLATE SELECTION =============

  if (step === "select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
        <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setStep("manage")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Choose a Template</h1>
              <p className="text-sm text-slate-500">Select a pre-built rider template to get started</p>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <PageBreadcrumb
            className="mb-4"
            segments={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Rider Builder', href: '/riders/builder' },
              { label: 'Choose Template' },
            ]}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(defaultTemplates || []).map((tpl: any) => (
              <button
                key={tpl.id}
                onClick={() => startFromTemplate(tpl.id)}
                className={`text-left p-6 rounded-xl border-2 transition-all duration-200 ${TEMPLATE_BG[tpl.id] || "bg-slate-50 border-slate-200 hover:border-slate-400"}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${TEMPLATE_COLORS[tpl.id] || "from-slate-500 to-slate-600"} flex items-center justify-center text-white shadow-lg`}
                  >
                    {TEMPLATE_ICONS[tpl.icon] || <FileText className="h-8 w-8" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900">{tpl.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{tpl.description}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="secondary" className="text-xs">
                        {tpl.sectionCount} sections
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {tpl.fieldCount} fields
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 mt-1 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 mb-3">Or start with a blank template</p>
            <Button variant="outline" onClick={() => startFromTemplate("solo_artist")} className="gap-2">
              <Plus className="h-4 w-4" />
              Start from Scratch
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============= RENDER: EDIT FORM =============

  if (step === "edit" && templateStructure) {
    const currentSection = templateStructure.sections.find((s) => s.id === activeSection);
    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetForm();
                  setStep("manage");
                }}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  {editingTemplateId ? "Edit Rider" : "New Rider"}
                </h1>
                <p className="text-xs text-slate-500">{templateStructure.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="gap-2">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2 bg-purple-600 hover:bg-purple-700">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          {/* Rider Name */}
          <Card className="mb-6 border-purple-200 bg-purple-50/50">
            <CardContent className="pt-5 pb-4">
              <Label htmlFor="riderName" className="text-sm font-semibold text-purple-900">
                Rider Template Name *
              </Label>
              <Input
                id="riderName"
                value={riderName}
                onChange={(e) => setRiderName(e.target.value)}
                placeholder="e.g., My Standard Performance Rider"
                className="mt-2 bg-white border-purple-200 focus:ring-purple-500"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Section Navigation */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-700">Sections</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <nav className="space-y-1">
                    {templateStructure.sections.map((section) => {
                      const progress = sectionProgress[section.id];
                      const isActive = activeSection === section.id;
                      return (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                            isActive
                              ? "bg-purple-100 text-purple-900 font-medium"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span className="flex-shrink-0">
                            {SECTION_ICONS[section.icon] || <FileText className="h-4 w-4" />}
                          </span>
                          <span className="flex-1 truncate">{section.title}</span>
                          {progress && (
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded-full ${
                                progress.filled === progress.total
                                  ? "bg-green-100 text-green-700"
                                  : progress.filled > 0
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {progress.filled}/{progress.total}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Form Fields */}
            <div className="lg:col-span-3">
              {currentSection && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                        {SECTION_ICONS[currentSection.icon] || <FileText className="h-5 w-5" />}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{currentSection.title}</CardTitle>
                        <CardDescription>
                          {sectionProgress[currentSection.id]?.filled || 0} of{" "}
                          {sectionProgress[currentSection.id]?.total || 0} fields completed
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentSection.fields.map((field) => renderField(field))}
                    </div>

                    {/* Section Navigation */}
                    <div className="flex justify-between mt-8 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const idx = templateStructure.sections.findIndex((s) => s.id === activeSection);
                          if (idx > 0) setActiveSection(templateStructure.sections[idx - 1].id);
                        }}
                        disabled={templateStructure.sections[0]?.id === activeSection}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const idx = templateStructure.sections.findIndex((s) => s.id === activeSection);
                          if (idx < templateStructure.sections.length - 1) {
                            setActiveSection(templateStructure.sections[idx + 1].id);
                          }
                        }}
                        disabled={
                          templateStructure.sections[templateStructure.sections.length - 1]?.id === activeSection
                        }
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rider Preview</DialogTitle>
              <DialogDescription>
                This is how your rider contract will look when exported
              </DialogDescription>
            </DialogHeader>
            <div
              ref={previewRef}
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: generatePDFHTML() }}
            />
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              <Button onClick={handleDownloadPDF} className="gap-2 bg-purple-600 hover:bg-purple-700">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============= RENDER: MANAGE (DEFAULT VIEW) =============

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Rider Templates</h1>
              <p className="text-sm text-slate-500">Create and manage your performance riders</p>
            </div>
          </div>
          <Button onClick={() => setStep("select")} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4" />
            New Rider
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <PageBreadcrumb
          className="mb-4"
          segments={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Rider Builder' },
          ]}
        />
        {/* Info Banner */}
        <Card className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900 mb-1">What is a Rider Contract?</h3>
                <p className="text-sm text-purple-700 leading-relaxed">
                  A rider is a professional document that outlines your technical requirements, stage setup,
                  hospitality needs, and payment terms for performances. Create templates to quickly share your
                  requirements with venues and streamline the booking process.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template Quick Start */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Start Templates</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(defaultTemplates || []).map((tpl: any) => (
              <button
                key={tpl.id}
                onClick={() => startFromTemplate(tpl.id)}
                className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${TEMPLATE_BG[tpl.id] || "bg-slate-50 border-slate-200 hover:border-slate-400"}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${TEMPLATE_COLORS[tpl.id] || "from-slate-500 to-slate-600"} flex items-center justify-center text-white mx-auto mb-3 shadow-lg`}
                >
                  {TEMPLATE_ICONS[tpl.icon] || <FileText className="h-6 w-6" />}
                </div>
                <p className="font-semibold text-sm text-slate-900">{tpl.category}</p>
                <p className="text-xs text-slate-500 mt-1">{tpl.sectionCount} sections</p>
              </button>
            ))}
          </div>
        </div>

        {/* Saved Templates */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            My Saved Riders
            {myTemplates && myTemplates.length > 0 && (
              <span className="text-sm font-normal text-slate-500 ml-2">({myTemplates.length})</span>
            )}
          </h2>

          {templatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : !myTemplates || myTemplates.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-300">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-700 mb-2">No riders yet</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Create your first rider template to share your requirements with venues
                </p>
                <Button onClick={() => setStep("select")} className="gap-2 bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4" />
                  Create Your First Rider
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTemplates.map((template: any) => {
                const baseType = template.templateType || template.templateData?.baseTemplate || "custom";
                return (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${TEMPLATE_COLORS[baseType] || "from-slate-500 to-slate-600"} flex items-center justify-center text-white shadow`}
                          >
                            {TEMPLATE_ICONS[
                              baseType === "solo_artist"
                                ? "mic"
                                : baseType === "band"
                                ? "users"
                                : baseType === "dj"
                                ? "headphones"
                                : "mic-2"
                            ] || <FileText className="h-5 w-5" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {template.templateName || "Unnamed Rider"}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {baseType === "solo_artist"
                                ? "Solo Artist"
                                : baseType === "band"
                                ? "Band"
                                : baseType === "dj"
                                ? "DJ"
                                : baseType === "speaker"
                                ? "Speaker"
                                : "Custom"}{" "}
                              &middot;{" "}
                              {template.updatedAt
                                ? new Date(template.updatedAt).toLocaleDateString()
                                : "Recently created"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1.5"
                          onClick={() => startEditing(template)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => duplicateMutation.mutate({ templateId: template.id })}
                        >
                          <Copy className="h-3.5 w-3.5" />
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
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rider Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The rider template will be permanently deleted.
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
