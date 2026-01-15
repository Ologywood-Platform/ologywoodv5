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

interface RiderTemplate {
  id: number;
  name: string;
  description: string;
  stageRequirements: string;
  soundRequirements: string;
  lightingRequirements: string;
  backlineRequirements: string;
  dressingRoomRequirements: string;
  cateringRequirements: string;
  transportationRequirements: string;
  accommodationRequirements: string;
  additionalNotes: string;
  createdAt: string;
  updatedAt: string;
}

export default function Riders() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [templates, setTemplates] = useState<RiderTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RiderTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [stageRequirements, setStageRequirements] = useState("");
  const [soundRequirements, setSoundRequirements] = useState("");
  const [lightingRequirements, setLightingRequirements] = useState("");
  const [backlineRequirements, setBacklineRequirements] = useState("");
  const [dressingRoomRequirements, setDressingRoomRequirements] = useState("");
  const [cateringRequirements, setCateringRequirements] = useState("");
  const [transportationRequirements, setTransportationRequirements] = useState("");
  const [accommodationRequirements, setAccommodationRequirements] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    // Mock data for rider templates
    const mockTemplates: RiderTemplate[] = [
      {
        id: 1,
        name: "Standard Jazz Ensemble",
        description: "Professional jazz performance setup",
        stageRequirements: "Minimum 20x15 ft stage, non-slip surface",
        soundRequirements: "Professional PA system, wireless microphone, monitor mix",
        lightingRequirements: "Basic stage lighting with color capability",
        backlineRequirements: "Piano or keyboard, drum kit, bass amp",
        dressingRoomRequirements: "Private dressing room with mirrors and seating",
        cateringRequirements: "Beverages and light snacks for 4 performers",
        transportationRequirements: "Parking for 2 vehicles",
        accommodationRequirements: "Not required",
        additionalNotes: "Sound check required 1 hour before performance",
        createdAt: "2026-01-10",
        updatedAt: "2026-01-10",
      },
      {
        id: 2,
        name: "Rock Band Setup",
        description: "Full rock band performance requirements",
        stageRequirements: "Minimum 25x20 ft stage with power outlets",
        soundRequirements: "Professional PA system, wireless mics, in-ear monitors",
        lightingRequirements: "Advanced lighting rig with effects",
        backlineRequirements: "Full drum kit, amplifiers for guitar and bass",
        dressingRoomRequirements: "Private dressing room for 5 people",
        cateringRequirements: "Full catering for 5 band members",
        transportationRequirements: "Parking for 3 vehicles, loading dock access",
        accommodationRequirements: "Hotel accommodations if out of town",
        additionalNotes: "Requires 2-hour sound check and technical support",
        createdAt: "2026-01-08",
        updatedAt: "2026-01-08",
      },
      {
        id: 3,
        name: "Acoustic Solo",
        description: "Solo acoustic performance setup",
        stageRequirements: "Minimum 10x10 ft stage",
        soundRequirements: "Basic PA system with acoustic guitar pickup",
        lightingRequirements: "Basic stage lighting",
        backlineRequirements: "Acoustic guitar stand and stool",
        dressingRoomRequirements: "Accessible restroom",
        cateringRequirements: "Water and light refreshments",
        transportationRequirements: "Parking for 1 vehicle",
        accommodationRequirements: "Not required",
        additionalNotes: "Minimal setup required",
        createdAt: "2026-01-05",
        updatedAt: "2026-01-05",
      },
    ];

    setTemplates(mockTemplates);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const resetForm = () => {
    setTemplateName("");
    setDescription("");
    setStageRequirements("");
    setSoundRequirements("");
    setLightingRequirements("");
    setBacklineRequirements("");
    setDressingRoomRequirements("");
    setCateringRequirements("");
    setTransportationRequirements("");
    setAccommodationRequirements("");
    setAdditionalNotes("");
    setIsEditing(false);
    setSelectedTemplate(null);
  };

  const handleOpenDialog = (template?: RiderTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setTemplateName(template.name);
      setDescription(template.description);
      setStageRequirements(template.stageRequirements);
      setSoundRequirements(template.soundRequirements);
      setLightingRequirements(template.lightingRequirements);
      setBacklineRequirements(template.backlineRequirements);
      setDressingRoomRequirements(template.dressingRoomRequirements);
      setCateringRequirements(template.cateringRequirements);
      setTransportationRequirements(template.transportationRequirements);
      setAccommodationRequirements(template.accommodationRequirements);
      setAdditionalNotes(template.additionalNotes);
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

    if (isEditing && selectedTemplate) {
      // Update existing template
      setTemplates(
        templates.map((t) =>
          t.id === selectedTemplate.id
            ? {
                ...t,
                name: templateName,
                description,
                stageRequirements,
                soundRequirements,
                lightingRequirements,
                backlineRequirements,
                dressingRoomRequirements,
                cateringRequirements,
                transportationRequirements,
                accommodationRequirements,
                additionalNotes,
                updatedAt: new Date().toISOString().split("T")[0],
              }
            : t
        )
      );
      toast.success("Rider template updated");
    } else {
      // Create new template
      const newTemplate: RiderTemplate = {
        id: Math.max(...templates.map((t) => t.id), 0) + 1,
        name: templateName,
        description,
        stageRequirements,
        soundRequirements,
        lightingRequirements,
        backlineRequirements,
        dressingRoomRequirements,
        cateringRequirements,
        transportationRequirements,
        accommodationRequirements,
        additionalNotes,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      };
      setTemplates([...templates, newTemplate]);
      toast.success("Rider template created");
    }

    resetForm();
    setDialogOpen(false);
  };

  const handleDeleteTemplate = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setTemplates(templates.filter((t) => t.id !== deleteId));
      toast.success("Rider template deleted");
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleViewTemplate = (template: RiderTemplate) => {
    setSelectedTemplate(template);
    setViewDialogOpen(true);
  };

  const handleDownloadPDF = (template: RiderTemplate) => {
    toast.success("Downloading rider as PDF...");
    // In a real app, this would generate and download a PDF
  };

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

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this rider template"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stage">Stage Requirements</Label>
                    <Textarea
                      id="stage"
                      value={stageRequirements}
                      onChange={(e) => setStageRequirements(e.target.value)}
                      placeholder="Stage size, setup, etc."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sound">Sound Requirements</Label>
                    <Textarea
                      id="sound"
                      value={soundRequirements}
                      onChange={(e) => setSoundRequirements(e.target.value)}
                      placeholder="PA system, microphones, etc."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lighting">Lighting Requirements</Label>
                    <Textarea
                      id="lighting"
                      value={lightingRequirements}
                      onChange={(e) => setLightingRequirements(e.target.value)}
                      placeholder="Lighting rig, effects, etc."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="backline">Backline Requirements</Label>
                    <Textarea
                      id="backline"
                      value={backlineRequirements}
                      onChange={(e) => setBacklineRequirements(e.target.value)}
                      placeholder="Instruments, amplifiers, etc."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dressing">Dressing Room Requirements</Label>
                    <Textarea
                      id="dressing"
                      value={dressingRoomRequirements}
                      onChange={(e) => setDressingRoomRequirements(e.target.value)}
                      placeholder="Dressing room setup, facilities, etc."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="catering">Catering Requirements</Label>
                    <Textarea
                      id="catering"
                      value={cateringRequirements}
                      onChange={(e) => setCateringRequirements(e.target.value)}
                      placeholder="Food, beverages, dietary needs, etc."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transportation">Transportation Requirements</Label>
                    <Textarea
                      id="transportation"
                      value={transportationRequirements}
                      onChange={(e) => setTransportationRequirements(e.target.value)}
                      placeholder="Parking, loading dock, etc."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accommodation">Accommodation Requirements</Label>
                    <Textarea
                      id="accommodation"
                      value={accommodationRequirements}
                      onChange={(e) => setAccommodationRequirements(e.target.value)}
                      placeholder="Hotel, meals, etc."
                      rows={3}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Any additional requirements or notes"
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
                <Button onClick={handleSaveTemplate}>
                  {isEditing ? "Update Template" : "Create Template"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length > 0 ? (
            templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">{template.description}</CardDescription>
                    </div>
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="text-sm">
                      <p className="text-slate-600 font-medium mb-1">Stage:</p>
                      <p className="text-slate-700 line-clamp-2">{template.stageRequirements}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-600 font-medium mb-1">Sound:</p>
                      <p className="text-slate-700 line-clamp-2">{template.soundRequirements}</p>
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
              <DialogTitle>{selectedTemplate?.name}</DialogTitle>
              <DialogDescription>{selectedTemplate?.description}</DialogDescription>
            </DialogHeader>

            {selectedTemplate && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Stage Requirements</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {selectedTemplate.stageRequirements}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Sound Requirements</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {selectedTemplate.soundRequirements}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Lighting Requirements</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {selectedTemplate.lightingRequirements}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Backline Requirements</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {selectedTemplate.backlineRequirements}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Dressing Room Requirements</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {selectedTemplate.dressingRoomRequirements}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Catering Requirements</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {selectedTemplate.cateringRequirements}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Transportation Requirements</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {selectedTemplate.transportationRequirements}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Accommodation Requirements</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {selectedTemplate.accommodationRequirements}
                  </p>
                </div>

                {selectedTemplate.additionalNotes && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Additional Notes</h3>
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {selectedTemplate.additionalNotes}
                    </p>
                  </div>
                )}
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
