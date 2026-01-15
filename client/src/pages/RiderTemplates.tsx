import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Plus, Edit, Trash2, FileText } from "lucide-react";
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

export default function RiderTemplates() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form state
  const [templateName, setTemplateName] = useState("");
  const [stageRequirements, setStageRequirements] = useState("");
  const [soundRequirements, setSoundRequirements] = useState("");
  const [lightingRequirements, setLightingRequirements] = useState("");
  const [backlineRequirements, setBacklineRequirements] = useState("");
  const [dressingRoomRequirements, setDressingRoomRequirements] = useState("");
  const [cateringRequirements, setCateringRequirements] = useState("");
  const [transportationRequirements, setTransportationRequirements] = useState("");
  const [accommodationRequirements, setAccommodationRequirements] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const { data: artistProfile } = trpc.artist.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'artist',
  });

  const { data: templates, refetch } = trpc.rider.getMyTemplates.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'artist',
  });

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

  if (!artistProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Please complete your artist profile first</p>
        <Link href="/onboarding/artist">
          <Button>Complete Profile</Button>
        </Link>
      </div>
    );
  }

  const resetForm = () => {
    setSelectedTemplate(null);
    setTemplateName("");
    setStageRequirements("");
    setSoundRequirements("");
    setLightingRequirements("");
    setBacklineRequirements("");
    setDressingRoomRequirements("");
    setCateringRequirements("");
    setTransportationRequirements("");
    setAccommodationRequirements("");
    setAdditionalNotes("");
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setTemplateName(template.templateName);
    
    const tech = template.technicalRequirements as any;
    setStageRequirements(tech?.stage || "");
    setSoundRequirements(tech?.sound || "");
    setLightingRequirements(tech?.lighting || "");
    setBacklineRequirements(tech?.backline || "");
    
    const hosp = template.hospitalityRequirements as any;
    setDressingRoomRequirements(hosp?.dressingRoom || "");
    setCateringRequirements(hosp?.catering || "");
    setTransportationRequirements(hosp?.transportation || "");
    setAccommodationRequirements(hosp?.accommodation || "");
    
    setAdditionalNotes(template.additionalNotes || "");
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate({ id: deleteId });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      templateName,
      technicalRequirements: {
        stage: stageRequirements,
        sound: soundRequirements,
        lighting: lightingRequirements,
        backline: backlineRequirements,
      },
      hospitalityRequirements: {
        dressingRoom: dressingRoomRequirements,
        catering: cateringRequirements,
        transportation: transportationRequirements,
        accommodation: accommodationRequirements,
      },
      additionalNotes,
    };

    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Music className="h-8 w-8" />
            Ologywood
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Rider Templates</h1>
            <p className="text-muted-foreground">
              Create reusable rider templates with your technical and hospitality requirements
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedTemplate ? "Edit Rider Template" : "Create Rider Template"}
                </DialogTitle>
                <DialogDescription>
                  Define your technical and hospitality requirements
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Template Name */}
                <div>
                  <Label htmlFor="templateName">Template Name *</Label>
                  <Input
                    id="templateName"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Standard Show, Festival Set, Acoustic Performance"
                    required
                  />
                </div>

                {/* Technical Requirements */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Technical Requirements</h3>
                  
                  <div>
                    <Label htmlFor="stage">Stage Requirements</Label>
                    <Textarea
                      id="stage"
                      value={stageRequirements}
                      onChange={(e) => setStageRequirements(e.target.value)}
                      placeholder="Stage dimensions, risers, etc."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sound">Sound Requirements</Label>
                    <Textarea
                      id="sound"
                      value={soundRequirements}
                      onChange={(e) => setSoundRequirements(e.target.value)}
                      placeholder="PA system, monitors, microphones, etc."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="lighting">Lighting Requirements</Label>
                    <Textarea
                      id="lighting"
                      value={lightingRequirements}
                      onChange={(e) => setLightingRequirements(e.target.value)}
                      placeholder="Lighting setup, special effects, etc."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="backline">Backline Requirements</Label>
                    <Textarea
                      id="backline"
                      value={backlineRequirements}
                      onChange={(e) => setBacklineRequirements(e.target.value)}
                      placeholder="Instruments, amplifiers, drums, etc."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Hospitality Requirements */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Hospitality Requirements</h3>
                  
                  <div>
                    <Label htmlFor="dressingRoom">Dressing Room</Label>
                    <Textarea
                      id="dressingRoom"
                      value={dressingRoomRequirements}
                      onChange={(e) => setDressingRoomRequirements(e.target.value)}
                      placeholder="Number of rooms, amenities, etc."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="catering">Catering</Label>
                    <Textarea
                      id="catering"
                      value={cateringRequirements}
                      onChange={(e) => setCateringRequirements(e.target.value)}
                      placeholder="Meals, beverages, dietary restrictions, etc."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="transportation">Transportation</Label>
                    <Textarea
                      id="transportation"
                      value={transportationRequirements}
                      onChange={(e) => setTransportationRequirements(e.target.value)}
                      placeholder="Ground transportation, parking, etc."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="accommodation">Accommodation</Label>
                    <Textarea
                      id="accommodation"
                      value={accommodationRequirements}
                      onChange={(e) => setAccommodationRequirements(e.target.value)}
                      placeholder="Hotel rooms, specifications, etc."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <Label htmlFor="additionalNotes">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Any other requirements or special requests..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending) 
                      ? "Saving..." 
                      : selectedTemplate ? "Update Template" : "Create Template"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates List */}
        {templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{template.templateName}</CardTitle>
                    </div>
                  </div>
                  <CardDescription>
                    Created {new Date(template.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    {template.paSystemRequired && (
                      <p className="line-clamp-2">
                        <strong>Sound:</strong> PA System Required
                      </p>
                    )}
                    {template.cateringProvided && (
                      <p className="line-clamp-2">
                        <strong>Catering:</strong> Provided
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground mb-4">
                No rider templates yet
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Create your first rider template to streamline your booking process
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Rider Template?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the rider template.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
