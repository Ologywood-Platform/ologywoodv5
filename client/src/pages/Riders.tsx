import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Download,
  FileText,
  Music,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { generateRiderPDF } from "@/utils/pdfExport";

interface RiderTemplate {
  id: number;
  artistId?: number;
  templateName: string;
  technicalRequirements?: {
    stageWidth?: string;
    stageDepth?: string;
    soundSystem?: string;
    lighting?: string;
    backline?: string;
    other?: string;
  } | null;
  hospitalityRequirements?: {
    dressingRooms?: string;
    catering?: string;
    beverages?: string;
    accommodation?: string;
    other?: string;
  } | null;
  financialTerms?: {
    depositAmount?: string;
    paymentMethod?: string;
    cancellationPolicy?: string;
    other?: string;
  } | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export default function Riders() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RiderTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [templateName, setTemplateName] = useState("");
  const [stageWidth, setStageWidth] = useState("");
  const [stageDepth, setStageDepth] = useState("");
  const [soundSystem, setSoundSystem] = useState("");
  const [lighting, setLighting] = useState("");
  const [backline, setBackline] = useState("");
  const [dressingRooms, setDressingRooms] = useState("");
  const [catering, setCatering] = useState("");
  const [beverages, setBeverages] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");

  // Fetch rider templates
  const { data: templates, refetch } = trpc.rider.getMyTemplates.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'artist',
  });

  // Create template mutation
  const createMutation = trpc.rider.create.useMutation({
    onSuccess: () => {
      toast.success("Rider template created");
      refetch();
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create template");
    },
  });

  // Update template mutation
  const updateMutation = trpc.rider.update.useMutation({
    onSuccess: () => {
      toast.success("Rider template updated");
      refetch();
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update template");
    },
  });

  // Delete template mutation
  const deleteMutation = trpc.rider.delete.useMutation({
    onSuccess: () => {
      toast.success("Rider template deleted");
      refetch();
      setDeleteDialogOpen(false);
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete template");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    } else if (!loading && isAuthenticated && user?.role !== 'artist') {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'artist') {
    return null;
  }

  const resetForm = () => {
    setTemplateName("");
    setStageWidth("");
    setStageDepth("");
    setSoundSystem("");
    setLighting("");
    setBackline("");
    setDressingRooms("");
    setCatering("");
    setBeverages("");
    setAccommodation("");
    setDepositAmount("");
    setPaymentMethod("");
    setCancellationPolicy("");
    setIsEditing(false);
    setSelectedTemplate(null);
  };

  const handleOpenDialog = (template?: RiderTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setTemplateName(template.templateName);
      setStageWidth(template.technicalRequirements?.stageWidth || "");
      setStageDepth(template.technicalRequirements?.stageDepth || "");
      setSoundSystem(template.technicalRequirements?.soundSystem || "");
      setLighting(template.technicalRequirements?.lighting || "");
      setBackline(template.technicalRequirements?.backline || "");
      setDressingRooms(template.hospitalityRequirements?.dressingRooms || "");
      setCatering(template.hospitalityRequirements?.catering || "");
      setBeverages(template.hospitalityRequirements?.beverages || "");
      setAccommodation(template.hospitalityRequirements?.accommodation || "");
      setDepositAmount(template.financialTerms?.depositAmount || "");
      setPaymentMethod(template.financialTerms?.paymentMethod || "");
      setCancellationPolicy(template.financialTerms?.cancellationPolicy || "");
      setIsEditing(true);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    const templateData = {
      templateName,
      technicalRequirements: {
        stageWidth,
        stageDepth,
        soundSystem,
        lighting,
        backline,
      },
      hospitalityRequirements: {
        dressingRooms,
        catering,
        beverages,
        accommodation,
      },
      financialTerms: {
        depositAmount,
        paymentMethod,
        cancellationPolicy,
      },
    };

    if (isEditing && selectedTemplate) {
      updateMutation.mutate({
        id: selectedTemplate.id,
        ...templateData,
      });
    } else {
      createMutation.mutate(templateData);
    }
  };

  const handleDeleteTemplate = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate({ id: deleteId });
    }
  };

  const handleViewTemplate = (template: RiderTemplate) => {
    setSelectedTemplate(template);
    setViewDialogOpen(true);
  };

  const handleDownloadPDF = (template: RiderTemplate) => {
    try {
      generateRiderPDF(template);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      toast.error("Failed to generate PDF");
      console.error(error);
    }
  };

  const riderTemplates = templates || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <a className="inline-flex">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </a>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Rider Templates</h1>
              <p className="text-slate-600">Manage your performance requirements and specifications</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Edit Rider Template" : "Create New Rider Template"}
                </DialogTitle>
                <DialogDescription>
                  Define your performance requirements and technical specifications
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Standard Jazz Ensemble"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stageWidth">Stage Width</Label>
                    <Input
                      id="stageWidth"
                      value={stageWidth}
                      onChange={(e) => setStageWidth(e.target.value)}
                      placeholder="e.g., 20 ft"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stageDepth">Stage Depth</Label>
                    <Input
                      id="stageDepth"
                      value={stageDepth}
                      onChange={(e) => setStageDepth(e.target.value)}
                      placeholder="e.g., 15 ft"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="soundSystem">Sound System</Label>
                    <Textarea
                      id="soundSystem"
                      value={soundSystem}
                      onChange={(e) => setSoundSystem(e.target.value)}
                      placeholder="PA system, microphones, etc."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lighting">Lighting</Label>
                    <Textarea
                      id="lighting"
                      value={lighting}
                      onChange={(e) => setLighting(e.target.value)}
                      placeholder="Lighting rig, effects, etc."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="backline">Backline</Label>
                    <Textarea
                      id="backline"
                      value={backline}
                      onChange={(e) => setBackline(e.target.value)}
                      placeholder="Instruments, amplifiers, etc."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dressing">Dressing Rooms</Label>
                    <Textarea
                      id="dressing"
                      value={dressingRooms}
                      onChange={(e) => setDressingRooms(e.target.value)}
                      placeholder="Dressing room setup, facilities, etc."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="catering">Catering</Label>
                    <Textarea
                      id="catering"
                      value={catering}
                      onChange={(e) => setCatering(e.target.value)}
                      placeholder="Food, beverages, dietary needs, etc."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accommodation">Accommodation</Label>
                    <Textarea
                      id="accommodation"
                      value={accommodation}
                      onChange={(e) => setAccommodation(e.target.value)}
                      placeholder="Hotel, meals, etc."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deposit">Deposit Amount</Label>
                    <Input
                      id="deposit"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="e.g., 50% of total fee"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment">Payment Method</Label>
                    <Input
                      id="payment"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      placeholder="e.g., Bank transfer"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cancellation">Cancellation Policy</Label>
                  <Textarea
                    id="cancellation"
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    placeholder="Cancellation terms and conditions"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate} disabled={createMutation.isPending || updateMutation.isPending}>
                  {isEditing ? "Update Template" : "Create Template"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {riderTemplates.length > 0 ? (
            riderTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.templateName}</CardTitle>
                    </div>
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="text-sm">
                      <p className="text-slate-600 font-medium mb-1">Stage:</p>
                      <p className="text-slate-700 line-clamp-2">
                        {template.technicalRequirements?.stageWidth} x {template.technicalRequirements?.stageDepth}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-600 font-medium mb-1">Sound:</p>
                      <p className="text-slate-700 line-clamp-2">
                        {template.technicalRequirements?.soundSystem || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleViewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleOpenDialog(template)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleDownloadPDF(template)}
                      title="Download as PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="text-center py-12">
                <Music className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No rider templates yet</p>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog()} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Your First Template
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </Card>
            </div>
          )}
        </div>

        {/* View Template Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate?.templateName}</DialogTitle>
            </DialogHeader>

            {selectedTemplate && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Technical Requirements</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Stage Size:</p>
                      <p className="text-slate-700">
                        {selectedTemplate.technicalRequirements?.stageWidth} x{" "}
                        {selectedTemplate.technicalRequirements?.stageDepth}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Sound System:</p>
                      <p className="text-slate-700">
                        {selectedTemplate.technicalRequirements?.soundSystem || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Lighting:</p>
                      <p className="text-slate-700">
                        {selectedTemplate.technicalRequirements?.lighting || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Backline:</p>
                      <p className="text-slate-700">
                        {selectedTemplate.technicalRequirements?.backline || "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Hospitality Requirements</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Dressing Rooms:</p>
                      <p className="text-slate-700">
                        {selectedTemplate.hospitalityRequirements?.dressingRooms || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Catering:</p>
                      <p className="text-slate-700">
                        {selectedTemplate.hospitalityRequirements?.catering || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Beverages:</p>
                      <p className="text-slate-700">
                        {selectedTemplate.hospitalityRequirements?.beverages || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Accommodation:</p>
                      <p className="text-slate-700">
                        {selectedTemplate.hospitalityRequirements?.accommodation || "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Financial Terms</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Deposit:</p>
                      <p className="text-slate-700">
                        {selectedTemplate.financialTerms?.depositAmount || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Payment Method:</p>
                      <p className="text-slate-700">
                        {selectedTemplate.financialTerms?.paymentMethod || "Not specified"}
                      </p>
                    </div>
                  </div>
                  {selectedTemplate.financialTerms?.cancellationPolicy && (
                    <div className="mt-2">
                      <p className="text-slate-600">Cancellation Policy:</p>
                      <p className="text-slate-700 whitespace-pre-wrap">
                        {selectedTemplate.financialTerms.cancellationPolicy}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setViewDialogOpen(false)}
              >
                Close
              </Button>
              {selectedTemplate && (
                <Button
                  className="gap-2"
                  onClick={() => {
                    handleDownloadPDF(selectedTemplate);
                    setViewDialogOpen(false);
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
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
    </div>
  );
}
