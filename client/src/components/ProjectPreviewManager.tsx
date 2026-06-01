import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Plus, Edit2, Trash2, Image as ImageIcon, Music, Upload,
  Loader2, Crown, AlertTriangle, ExternalLink, Disc3, ListMusic
} from 'lucide-react';

const RELEASE_TYPES = [
  { value: 'album', label: 'Album' },
  { value: 'ep', label: 'EP' },
  { value: 'mixtape', label: 'Mixtape' },
  { value: 'deluxe', label: 'Deluxe Edition' },
  { value: 'single_collection', label: 'Single Collection' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'coming_soon', label: 'Coming Soon' },
];

export function ProjectPreviewManager() {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [showTrackDialog, setShowTrackDialog] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [uploadingCoverId, setUploadingCoverId] = useState<number | null>(null);
  const [uploadingTrackId, setUploadingTrackId] = useState<number | null>(null);

  // Project form state
  const [title, setTitle] = useState('');
  const [releaseType, setReleaseType] = useState('album');
  const [description, setDescription] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [status, setStatus] = useState('active');

  // Track form state
  const [trackTitle, setTrackTitle] = useState('');

  // Queries
  const { data: projects, refetch: refetchProjects } = trpc.projectPreviews.myProjects.useQuery();
  const { data: limitInfo } = trpc.projectPreviews.getLimitInfo.useQuery();

  // Project mutations
  const createProjectMutation = trpc.projectPreviews.createProject.useMutation({
    onSuccess: () => {
      toast.success('Project created');
      resetProjectForm();
      setShowProjectDialog(false);
      refetchProjects();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateProjectMutation = trpc.projectPreviews.updateProject.useMutation({
    onSuccess: () => {
      toast.success('Project updated');
      resetProjectForm();
      setEditingProject(null);
      refetchProjects();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteProjectMutation = trpc.projectPreviews.deleteProject.useMutation({
    onSuccess: () => {
      toast.success('Project deleted');
      refetchProjects();
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadCoverMutation = trpc.projectPreviews.uploadCoverArt.useMutation({
    onSuccess: () => {
      toast.success('Cover art uploaded');
      setUploadingCoverId(null);
      refetchProjects();
    },
    onError: (err) => {
      toast.error(err.message);
      setUploadingCoverId(null);
    },
  });

  // Track mutations
  const addTrackMutation = trpc.projectPreviews.addTrack.useMutation({
    onSuccess: () => {
      toast.success('Track added');
      setTrackTitle('');
      setShowTrackDialog(false);
      refetchProjects();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteTrackMutation = trpc.projectPreviews.deleteTrack.useMutation({
    onSuccess: () => {
      toast.success('Track removed');
      refetchProjects();
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadAudioMutation = trpc.projectPreviews.uploadAudio.useMutation({
    onSuccess: () => {
      toast.success('Audio uploaded');
      setUploadingTrackId(null);
      refetchProjects();
    },
    onError: (err) => {
      toast.error(err.message);
      setUploadingTrackId(null);
    },
  });

  function resetProjectForm() {
    setTitle('');
    setReleaseType('album');
    setDescription('');
    setReleaseDate('');
    setExternalLink('');
    setStatus('active');
  }

  function openEditProject(project: any) {
    setEditingProject(project);
    setTitle(project.title);
    setReleaseType(project.releaseType);
    setDescription(project.description || '');
    setReleaseDate(project.releaseDate || '');
    setExternalLink(project.externalLink || '');
    setStatus(project.status);
  }

  function handleProjectSubmit() {
    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }

    const data: any = {
      title: title.trim(),
      releaseType,
      description: description.trim() || undefined,
      releaseDate: releaseDate || undefined,
      externalLink: externalLink.trim() || undefined,
      status: status as 'active' | 'coming_soon',
    };

    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, ...data });
    } else {
      createProjectMutation.mutate(data);
    }
  }

  function handleAddTrack() {
    if (!trackTitle.trim() || !activeProjectId) {
      toast.error('Track title is required.');
      return;
    }
    addTrackMutation.mutate({ projectId: activeProjectId, title: trackTitle.trim() });
  }

  function handleCoverUpload(projectId: number, file: File) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB.');
      return;
    }

    setUploadingCoverId(projectId);
    const reader = new FileReader();
    reader.onload = () => {
      uploadCoverMutation.mutate({
        projectId,
        fileData: reader.result as string,
        fileName: file.name,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  }

  function handleAudioUpload(trackId: number, file: File) {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'audio/m4a'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only MP3, WAV, and M4A audio files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Audio must be under 5MB.');
      return;
    }

    setUploadingTrackId(trackId);
    const reader = new FileReader();
    reader.onload = () => {
      uploadAudioMutation.mutate({
        trackId,
        fileData: reader.result as string,
        fileName: file.name,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  }

  // Tier gate: can't add projects
  if (limitInfo && limitInfo.maxProjects === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Crown className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Project Previews is a paid feature</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Upgrade to Starter (1 project, 6 tracks, 30s snippets) or Professional (3 projects, 12 tracks, 60s snippets)
                to showcase your upcoming albums, EPs, and mixtapes.
              </p>
            </div>
            <Button className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={() => window.location.href = '/pricing'}>
              <Crown className="h-4 w-4" />
              View Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with limit info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Disc3 className="h-5 w-5" />
            Project Previews
          </h2>
          <p className="text-sm text-muted-foreground">
            Showcase upcoming albums, EPs, and mixtapes with audio snippets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {limitInfo && (
            <Badge variant="secondary" className="text-xs">
              {limitInfo.currentCount}/{limitInfo.maxProjects} projects
            </Badge>
          )}
          <Button
            onClick={() => { resetProjectForm(); setShowProjectDialog(true); }}
            disabled={limitInfo ? !limitInfo.canAdd : false}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Limit warning */}
      {limitInfo && !limitInfo.canAdd && limitInfo.maxProjects > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>You've reached your {limitInfo.maxProjects} project limit. Upgrade to Professional for up to 3 projects.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tier info */}
      {limitInfo && (
        <div className="text-xs text-muted-foreground">
          Your plan: {limitInfo.tierName} — up to {limitInfo.maxTracksPerProject} tracks per project, {limitInfo.maxSnippetSeconds}s snippets
        </div>
      )}

      {/* Projects list */}
      {!projects || projects.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-12 text-center">
            <Disc3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Create a project to preview your upcoming album, EP, or mixtape with audio snippets for your fans.
            </p>
            <Button onClick={() => { resetProjectForm(); setShowProjectDialog(true); }} className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project: any) => (
            <Card key={project.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Cover art */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {project.coverArtUrl ? (
                      <img src={project.coverArtUrl} alt={project.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Project info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-base">{project.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs capitalize">{project.releaseType.replace('_', ' ')}</Badge>
                          <Badge
                            variant={project.status === 'coming_soon' ? 'default' : 'secondary'}
                            className={`text-xs ${project.status === 'coming_soon' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}`}
                          >
                            {project.status === 'coming_soon' ? 'Coming Soon' : 'Active'}
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={() => openEditProject(project)}>
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline" size="sm" className="text-xs h-7 px-2"
                        onClick={() => {
                          setUploadingCoverId(project.id);
                          coverInputRef.current?.click();
                        }}
                        disabled={uploadingCoverId === project.id}
                      >
                        {uploadingCoverId === project.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-3 w-3 mr-1" />
                            Cover
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline" size="sm" className="text-xs h-7 px-2"
                        onClick={() => { setActiveProjectId(project.id); setTrackTitle(''); setShowTrackDialog(true); }}
                        disabled={limitInfo ? project.tracks.length >= limitInfo.maxTracksPerProject : false}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Track
                      </Button>
                      {project.externalLink && (
                        <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={() => window.open(project.externalLink, '_blank')}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Link
                        </Button>
                      )}
                      <Button
                        variant="outline" size="sm"
                        className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                        onClick={() => {
                          if (confirm('Delete this project and all its tracks?')) {
                            deleteProjectMutation.mutate({ id: project.id });
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Track list */}
                    {project.tracks && project.tracks.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <ListMusic className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {project.tracks.length} track{project.tracks.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {project.tracks.map((track: any) => (
                            <div key={track.id} className="flex items-center gap-2 text-sm group">
                              <span className="text-xs text-muted-foreground w-5 text-right">{track.trackNumber}.</span>
                              <span className="flex-1 truncate">{track.title}</span>
                              {track.audioUrl ? (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                  <Music className="h-2.5 w-2.5 mr-0.5" />
                                  {track.durationSeconds}s
                                </Badge>
                              ) : (
                                <Button
                                  variant="ghost" size="sm" className="text-[10px] h-5 px-1.5 opacity-0 group-hover:opacity-100"
                                  onClick={() => {
                                    setUploadingTrackId(track.id);
                                    audioInputRef.current?.click();
                                  }}
                                  disabled={uploadingTrackId === track.id}
                                >
                                  {uploadingTrackId === track.id ? (
                                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                  ) : (
                                    <>
                                      <Upload className="h-2.5 w-2.5 mr-0.5" />
                                      Audio
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="ghost" size="sm"
                                className="text-[10px] h-5 px-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                                onClick={() => {
                                  if (confirm(`Remove "${track.title}"?`)) {
                                    deleteTrackMutation.mutate({ trackId: track.id });
                                  }
                                }}
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingCoverId) {
            handleCoverUpload(uploadingCoverId, file);
          }
          e.target.value = '';
        }}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/x-m4a,audio/mp4"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingTrackId) {
            handleAudioUpload(uploadingTrackId, file);
          }
          e.target.value = '';
        }}
      />

      {/* Add/Edit Project Dialog */}
      <Dialog open={showProjectDialog || !!editingProject} onOpenChange={(open) => {
        if (!open) {
          setShowProjectDialog(false);
          setEditingProject(null);
          resetProjectForm();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="project-title">Title *</Label>
              <Input
                id="project-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midnight Sessions, Vol. 2"
                maxLength={255}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Release Type</Label>
              <Select value={releaseType} onValueChange={setReleaseType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELEASE_TYPES.map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-date">Release Date (optional)</Label>
              <Input
                id="project-date"
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-link">External Link (optional)</Label>
              <Input
                id="project-link"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://open.spotify.com/album/..."
                type="url"
              />
              <p className="text-xs text-muted-foreground">Spotify, Apple Music, Bandcamp, etc.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-desc">Description (optional)</Label>
              <Textarea
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the project..."
                maxLength={500}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowProjectDialog(false); setEditingProject(null); resetProjectForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleProjectSubmit}
              disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {(createProjectMutation.isPending || updateProjectMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Track Dialog */}
      <Dialog open={showTrackDialog} onOpenChange={(open) => {
        if (!open) {
          setShowTrackDialog(false);
          setActiveProjectId(null);
          setTrackTitle('');
        }
      }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Track</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="track-title">Track Title *</Label>
              <Input
                id="track-title"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                placeholder="e.g. Intro, Late Night Drive"
                maxLength={255}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You can upload audio after adding the track. Snippets are limited to {limitInfo?.maxSnippetSeconds || 30}s on your plan.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowTrackDialog(false); setTrackTitle(''); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTrack}
              disabled={addTrackMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {addTrackMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Track
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
