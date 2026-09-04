/**
 * ReleaseManager — Artist page for managing White Label Releases.
 * Allows creating, editing, publishing, unpublishing, and archiving releases.
 */

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Music, Upload, Plus, Edit, Trash2, Eye, EyeOff, Archive,
  Loader2, DollarSign, AlertTriangle, Crown, ArrowLeft, ExternalLink, Megaphone
} from "lucide-react";
import { useToast } from "@/components/ErrorToast";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { SiteHeader } from "@/components/SiteHeader";
import { AIUseDisclosureFields, AIUseDisclosureTag } from "@/components/AIUseDisclosure";
import { getAiDisclosureFormValue, type AiDisclosureFormValue, type AiDisclosureRecord } from "@shared/aiDisclosure";

type ReleaseStatus = "draft" | "published" | "archived";

interface Release extends AiDisclosureRecord {
  id: number;
  title: string;
  description: string | null;
  genre: string | null;
  audioFileKey: string;
  previewFileKey: string | null;
  coverArtKey: string;
  coverArtUrl?: string | null;
  durationSeconds: number;
  fileFormat: string;
  fileSizeBytes: number;
  priceInCents: number;
  currency: string;
  allowPayWhatYouWant: boolean;
  status: string;
  totalSales: number;
  totalRevenueCents: number;
  publishedAt: string | Date | null;
  createdAt: string | Date;
}

export default function ReleaseManager() {
  const toast = useToast();
  const [, setLocation] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);

  // Check if artist can create releases
  const canCreateQuery = trpc.release.canCreate.useQuery();
  const myReleasesQuery = trpc.release.getMyReleases.useQuery();

  const canCreate = canCreateQuery.data;
  const releases = myReleasesQuery.data || [];

  const handleCreated = () => {
    setShowCreateForm(false);
    setEditingRelease(null);
    myReleasesQuery.refetch();
    canCreateQuery.refetch();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };

  if (canCreateQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SiteHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Error — likely not an artist
  if (canCreateQuery.isError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <h1 className="text-2xl font-bold">White Label Release</h1>
        </div>
        <Card className="border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="h-16 w-16 text-destructive/40 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Artist Account Required</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              White Label Release is available for artists. Please create an artist profile first to start selling your music.
            </p>
            <Button onClick={() => setLocation("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not allowed — show upgrade prompt
  if (canCreate && !canCreate.hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <h1 className="text-2xl font-bold">White Label Release</h1>
        </div>
        <Card className="border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Crown className="h-16 w-16 text-primary/40 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Upgrade to Sell Music</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              {canCreate.message}
            </p>
            <Button onClick={() => setLocation("/dashboard")}>
              <Crown className="h-4 w-4 mr-2" /> View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageBreadcrumb
        className="mb-4"
        segments={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Releases' },
        ]}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="shrink-0">
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">White Label Release</h1>
            <p className="text-sm text-muted-foreground">
              Sell your singles directly to fans • 1% platform fee
            </p>
          </div>
        </div>
        {canCreate?.allowed && !showCreateForm && !editingRelease && (
          <Button onClick={() => setShowCreateForm(true)} className="shrink-0 self-end sm:self-center">
            <Plus className="h-4 w-4 mr-2" /> New Release
          </Button>
        )}
      </div>

      {/* Tier info */}
      {canCreate && (
        <div className="mb-6 text-sm text-muted-foreground">
          {canCreate.maxAllowed === -1
            ? `${canCreate.currentCount} active releases (unlimited)`
            : `${canCreate.currentCount} / ${canCreate.maxAllowed} active releases`}
        </div>
      )}

      {/* Create / Edit Form */}
      {(showCreateForm || editingRelease) && (
        <ReleaseForm
          release={editingRelease}
          onSuccess={handleCreated}
          onCancel={() => { setShowCreateForm(false); setEditingRelease(null); window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }}
        />
      )}

      {/* Release List */}
      {!showCreateForm && !editingRelease && (
        <div className="space-y-4">
          {releases.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Music className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">No releases yet</h3>
                <p className="text-muted-foreground">
                  Upload your first single and start selling to fans. Use the "+ New Release" button above to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            releases.map((release: Release) => (
              <ReleaseListItem
                key={release.id}
                release={release}
                onEdit={() => setEditingRelease(release)}
                onRefresh={() => { myReleasesQuery.refetch(); canCreateQuery.refetch(); }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Release Form ─────────────────────────────────────────────────────────────

function ReleaseForm({
  release,
  onSuccess,
  onCancel,
}: {
  release: Release | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const isEditing = !!release;

  const [title, setTitle] = useState(release?.title || "");
  const [description, setDescription] = useState(release?.description || "");
  const [genre, setGenre] = useState(release?.genre || "");
  const [priceInCents, setPriceInCents] = useState(release?.priceInCents || 100);
  const [priceDisplay, setPriceDisplay] = useState((release?.priceInCents || 100) / 100 + "");
  const [allowPayWhatYouWant, setAllowPayWhatYouWant] = useState(release?.allowPayWhatYouWant || false);
  const [rightsCertified, setRightsCertified] = useState(false);
  const [aiDisclosure, setAiDisclosure] = useState<AiDisclosureFormValue>(() => getAiDisclosureFormValue(release));

  const [audioFileKey, setAudioFileKey] = useState(release?.audioFileKey || "");
  const [audioFileName, setAudioFileName] = useState("");
  const [coverArtKey, setCoverArtKey] = useState(release?.coverArtKey || "");
  const [coverArtPreview, setCoverArtPreview] = useState("");
  const [previewFileKey, setPreviewFileKey] = useState(release?.previewFileKey || "");

  const [durationSeconds, setDurationSeconds] = useState(release?.durationSeconds || 0);
  const [fileFormat, setFileFormat] = useState(release?.fileFormat || "");
  const [fileSizeBytes, setFileSizeBytes] = useState(release?.fileSizeBytes || 0);

  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const createMutation = trpc.release.create.useMutation({
    onSuccess: () => {
      toast.addSuccess("Release created", "Your release has been saved as a draft.");
      onSuccess();
    },
    onError: (error) => {
      toast.addError("Failed to create release", error.message);
      setIsSubmitting(false);
    },
  });

  const updateMutation = trpc.release.update.useMutation({
    onSuccess: () => {
      toast.addSuccess("Release updated", "Your changes have been saved.");
      onSuccess();
    },
    onError: (error) => {
      toast.addError("Failed to update release", error.message);
      setIsSubmitting(false);
    },
  });

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/aac", "audio/mp4"];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|aac|m4a)$/i)) {
      toast.addError("Invalid file", "Please upload an MP3, WAV, FLAC, or AAC file.");
      return;
    }

    // Validate file size (50 MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.addError("File too large", "Maximum file size is 50 MB.");
      return;
    }

    setIsUploadingAudio(true);
    try {
      // Extract audio duration using HTML5 Audio element
      const audioDuration = await new Promise<number>((resolve) => {
        const audio = new Audio();
        const objectUrl = URL.createObjectURL(file);
        audio.addEventListener("loadedmetadata", () => {
          const duration = Math.round(audio.duration);
          URL.revokeObjectURL(objectUrl);
          resolve(duration > 0 ? duration : 1);
        });
        audio.addEventListener("error", () => {
          URL.revokeObjectURL(objectUrl);
          resolve(1); // fallback to 1 second if metadata can't be read
        });
        audio.src = objectUrl;
      });

      // Read file as base64 (backend expects JSON with base64 data)
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/release/upload/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: base64Data,
          fileName: file.name,
          mimeType: file.type || "audio/mpeg",
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAudioFileKey(data.fileKey);
        setAudioFileName(file.name);
        setDurationSeconds(audioDuration);
        setFileFormat(data.fileFormat || file.name.split(".").pop()?.toUpperCase() || "MP3");
        setFileSizeBytes(data.fileSizeBytes || file.size);
        toast.addSuccess("Audio uploaded", `${file.name} uploaded successfully.`);
      } else {
        toast.addError("Upload failed", data.error || "Failed to upload audio file.");
      }
    } catch {
      toast.addError("Upload failed", "Network error. Please try again.");
    }
    setIsUploadingAudio(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.addError("Invalid file", "Please upload an image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.addError("File too large", "Maximum cover art size is 10 MB.");
      return;
    }

    setIsUploadingCover(true);
    try {
      // Read file as base64 (backend expects JSON with base64 data)
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/release/upload/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: base64Data,
          fileName: file.name,
          mimeType: file.type || "image/jpeg",
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCoverArtKey(data.fileKey);
        setCoverArtPreview(data.url || URL.createObjectURL(file));
        toast.addSuccess("Cover uploaded", "Cover art uploaded successfully.");
      } else {
        toast.addError("Upload failed", data.error || "Failed to upload cover art.");
      }
    } catch {
      toast.addError("Upload failed", "Network error. Please try again.");
    }
    setIsUploadingCover(false);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = "Title is required";
    }
    if (!audioFileKey) {
      errors.audio = "Audio file is required";
    }
    if (!coverArtKey) {
      errors.cover = "Cover art is required";
    }
    if (priceInCents < 50) {
      errors.price = "Minimum price is $0.50";
    }
    if (!isEditing && !rightsCertified) {
      errors.rights = "You must certify that you own the rights to this music";
    }
    if (aiDisclosure.enabled && (!aiDisclosure.level || aiDisclosure.components.length === 0)) {
      errors.aiDisclosure = "Choose the AI-use level and at least one component, or turn the disclosure off.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.addError("Missing required fields", "Please fill in all required fields highlighted below.");
      return;
    }

    setIsSubmitting(true);

    const aiDisclosurePayload = {
      aiUseDisclosureEnabled: aiDisclosure.enabled,
      aiUseLevel: aiDisclosure.enabled && aiDisclosure.level ? aiDisclosure.level : null,
      aiUseComponents: aiDisclosure.enabled ? aiDisclosure.components : [],
      aiUseTools: aiDisclosure.enabled ? aiDisclosure.tools.trim() || null : null,
      aiUseNotes: aiDisclosure.enabled ? aiDisclosure.notes.trim() || null : null,
    };

    if (isEditing && release) {
      updateMutation.mutate({
        id: release.id,
        title,
        description: description || undefined,
        genre: genre || undefined,
        audioFileKey,
        previewFileKey: previewFileKey || undefined,
        coverArtKey,
        durationSeconds: durationSeconds || undefined,
        fileFormat: fileFormat || undefined,
        fileSizeBytes: fileSizeBytes || undefined,
        priceInCents,
        allowPayWhatYouWant,
        ...aiDisclosurePayload,
      });
    } else {
      createMutation.mutate({
        title,
        description: description || undefined,
        genre: genre || undefined,
        audioFileKey,
        previewFileKey: previewFileKey || undefined,
        coverArtKey,
        durationSeconds,
        fileFormat,
        fileSizeBytes,
        priceInCents,
        allowPayWhatYouWant,
        rightsCertified,
        rightsCertifiedAt: new Date().toISOString(),
        ...aiDisclosurePayload,
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Release" : "New Release"}</CardTitle>
        <CardDescription>
          {isEditing ? "Update your release details" : "Upload your single and set your price"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title && e.target.value.trim()) {
                  setFieldErrors((prev) => { const n = { ...prev }; delete n.title; return n; });
                }
              }}
              placeholder="Enter track title"
              maxLength={255}
              className={fieldErrors.title ? 'border-red-500' : ''}
            />
            {fieldErrors.title && <p className="text-xs text-red-500">{fieldErrors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell fans about this track..."
              maxLength={2000}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/2000 characters</p>
          </div>

          {/* Genre */}
          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Input
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g., Hip Hop, R&B, Rock, Electronic"
              maxLength={100}
            />
          </div>

          {/* Audio Upload */}
          <div className="space-y-2">
            <Label className={fieldErrors.audio ? 'text-red-500' : ''}>Audio File * (MP3, WAV, FLAC, AAC — max 50 MB)</Label>
            <input
              ref={audioInputRef}
              type="file"
              accept=".mp3,.wav,.flac,.aac,.m4a,audio/*"
              onChange={(e) => {
                handleAudioUpload(e);
                if (fieldErrors.audio) {
                  setFieldErrors((prev) => { const n = { ...prev }; delete n.audio; return n; });
                }
              }}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={fieldErrors.audio ? "destructive" : "outline"}
                onClick={() => audioInputRef.current?.click()}
                disabled={isUploadingAudio}
              >
                {isUploadingAudio ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {audioFileKey ? "Replace Audio" : "Upload Audio"}
              </Button>
              {(audioFileName || audioFileKey) && (
                <span className="text-sm text-muted-foreground">
                  {audioFileName || "Audio uploaded"} {durationSeconds > 0 && `(${Math.floor(durationSeconds / 60)}:${(durationSeconds % 60).toString().padStart(2, "0")})`}
                </span>
              )}
            </div>
            {fieldErrors.audio && <p className="text-xs text-red-500">{fieldErrors.audio}</p>}
          </div>

          {/* Cover Art Upload */}
          <div className="space-y-2">
            <Label className={fieldErrors.cover ? 'text-red-500' : ''}>Cover Art * (JPG, PNG, WebP — max 10 MB)</Label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                handleCoverUpload(e);
                if (fieldErrors.cover) {
                  setFieldErrors((prev) => { const n = { ...prev }; delete n.cover; return n; });
                }
              }}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={fieldErrors.cover ? "destructive" : "outline"}
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
              >
                {isUploadingCover ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {coverArtKey ? "Replace Cover" : "Upload Cover"}
              </Button>
              {coverArtPreview && (
                <img src={coverArtPreview} alt="Cover preview" className="h-16 w-16 object-cover rounded" />
              )}
              {!coverArtPreview && coverArtKey && (
                <span className="text-sm text-muted-foreground">Cover art uploaded</span>
              )}
            </div>
            {fieldErrors.cover && <p className="text-xs text-red-500">{fieldErrors.cover}</p>}
          </div>

           {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (USD) *</Label>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <Input
                id="price"
                type="text"
                inputMode="decimal"
                placeholder="1.00"
                value={priceDisplay}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow only digits and one decimal point
                  if (/^\d*\.?\d{0,2}$/.test(val) || val === "") {
                    setPriceDisplay(val);
                    const num = parseFloat(val);
                    if (!isNaN(num) && num >= 0) {
                      setPriceInCents(Math.round(num * 100));
                    } else if (val === "" || val === ".") {
                      setPriceInCents(0);
                    }
                  }
                }}
                onBlur={() => {
                  // Format nicely on blur
                  const num = parseFloat(priceDisplay);
                  if (!isNaN(num) && num > 0) {
                    setPriceDisplay(num.toFixed(2));
                    setPriceInCents(Math.round(num * 100));
                  } else {
                    setPriceDisplay("1.00");
                    setPriceInCents(100);
                  }
                }}
                className={`w-32 ${fieldErrors.price ? 'border-red-500' : ''}`}
              />
              <span className="text-sm text-muted-foreground">
                You receive ${((priceInCents * 0.99) / 100).toFixed(2)} (1% platform fee)
              </span>
            </div>
            {fieldErrors.price && <p className="text-xs text-red-500">{fieldErrors.price}</p>}
          </div>

          {/* Pay What You Want */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pwyw"
              checked={allowPayWhatYouWant}
              onCheckedChange={(checked) => setAllowPayWhatYouWant(checked === true)}
            />
            <Label htmlFor="pwyw" className="text-sm">
              Allow fans to pay more than the listed price (Professional plan only)
            </Label>
          </div>

          <AIUseDisclosureFields
            idPrefix="white-label-ai-disclosure"
            value={aiDisclosure}
            onChange={(value) => {
              setAiDisclosure(value);
              if (fieldErrors.aiDisclosure) {
                setFieldErrors((previous) => {
                  const next = { ...previous };
                  delete next.aiDisclosure;
                  return next;
                });
              }
            }}
            error={fieldErrors.aiDisclosure}
          />

          {/* Rights Certification (only for new releases) */}
          {!isEditing && (
            <div className={`border rounded-lg p-4 bg-muted/30 ${fieldErrors.rights ? 'border-red-500' : ''}`}>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="rights"
                  checked={rightsCertified}
                  onCheckedChange={(checked) => {
                    setRightsCertified(checked === true);
                    if (checked && fieldErrors.rights) {
                      setFieldErrors((prev) => { const n = { ...prev }; delete n.rights; return n; });
                    }
                  }}
                />
                <div>
                  <Label htmlFor="rights" className={`text-sm font-medium ${fieldErrors.rights ? 'text-red-500' : ''}`}>
                    Rights Certification *
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    I certify that I am the copyright owner or have obtained all necessary licenses
                    and permissions to distribute this music through Ologywood. I understand that
                    uploading copyrighted material without authorization may result in removal of
                    the content and suspension of my account.
                  </p>
                  {fieldErrors.rights && <p className="text-xs text-red-500 mt-1">{fieldErrors.rights}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEditing ? "Save Changes" : "Create Draft"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Release List Item ────────────────────────────────────────────────────────

function ReleaseListItem({
  release,
  onEdit,
  onRefresh,
}: {
  release: Release;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const toast = useToast();
  const [, navigate] = useLocation();
  const [isActing, setIsActing] = useState(false);

  const publishMutation = trpc.release.publish.useMutation({
    onSuccess: () => {
      toast.addSuccess("Published", "Your release is now live and available for purchase.");
      onRefresh();
      setIsActing(false);
    },
    onError: (error) => {
      toast.addError("Failed to publish", error.message);
      setIsActing(false);
    },
  });

  const unpublishMutation = trpc.release.unpublish.useMutation({
    onSuccess: () => {
      toast.addSuccess("Unpublished", "Your release has been taken down.");
      onRefresh();
      setIsActing(false);
    },
    onError: (error) => {
      toast.addError("Failed to unpublish", error.message);
      setIsActing(false);
    },
  });

  const archiveMutation = trpc.release.archive.useMutation({
    onSuccess: () => {
      toast.addSuccess("Archived", "Your release has been archived.");
      onRefresh();
      setIsActing(false);
    },
    onError: (error) => {
      toast.addError("Failed to archive", error.message);
      setIsActing(false);
    },
  });

  const deleteMutation = trpc.release.delete.useMutation({
    onSuccess: () => {
      toast.addSuccess("Deleted", "Your release has been permanently deleted.");
      onRefresh();
      setIsActing(false);
    },
    onError: (error) => {
      toast.addError("Failed to delete", error.message);
      setIsActing(false);
    },
  });

  const statusBadge = {
    draft: <Badge variant="secondary">Draft</Badge>,
    published: <Badge className="bg-green-600 text-white">Published</Badge>,
    archived: <Badge variant="outline">Archived</Badge>,
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Cover art thumbnail */}
          <div className="w-20 h-20 flex-shrink-0 bg-muted rounded overflow-hidden">
            {release.coverArtUrl ? (
              <img src={release.coverArtUrl} alt={release.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="h-8 w-8 text-muted-foreground/40" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{release.title}</h3>
              {statusBadge[release.status as ReleaseStatus] || <Badge variant="outline">{release.status}</Badge>}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>${(release.priceInCents / 100).toFixed(2)}</span>
              {release.genre && <span>{release.genre}</span>}
              <span>{release.totalSales} sales</span>
              <span>${(release.totalRevenueCents / 100).toFixed(2)} revenue</span>
            </div>
            <AIUseDisclosureTag disclosure={release} className="mt-2" />
            {release.publishedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Published {new Date(release.publishedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {release.status === "draft" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onEdit}
                  disabled={isActing}
                >
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  onClick={() => { setIsActing(true); publishMutation.mutate({ id: release.id }); }}
                  disabled={isActing}
                >
                  {isActing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                  Publish
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Delete this release permanently?")) {
                      setIsActing(true);
                      deleteMutation.mutate({ id: release.id });
                    }
                  }}
                  disabled={isActing}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
            {release.status === "published" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  onClick={() => navigate(`/promote?type=release&name=${encodeURIComponent(release.title)}`)}
                >
                  <Megaphone className="h-3 w-3 mr-1" /> Promote
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setIsActing(true); unpublishMutation.mutate({ id: release.id }); }}
                  disabled={isActing}
                >
                  <EyeOff className="h-3 w-3 mr-1" /> Unpublish
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setIsActing(true); archiveMutation.mutate({ id: release.id }); }}
                  disabled={isActing}
                >
                  <Archive className="h-3 w-3 mr-1" /> Archive
                </Button>
              </>
            )}
            {release.status === "archived" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setIsActing(true); publishMutation.mutate({ id: release.id }); }}
                  disabled={isActing}
                >
                  {isActing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                  Re-publish
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Permanently delete this archived release? This cannot be undone.")) {
                      setIsActing(true);
                      deleteMutation.mutate({ id: release.id });
                    }
                  }}
                  disabled={isActing}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
