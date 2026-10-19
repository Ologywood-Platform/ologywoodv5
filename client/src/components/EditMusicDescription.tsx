import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ErrorToast";

type DescriptionSource = {
  id: number;
  description: string | null;
  status: string;
};

type FrozenDescription = DescriptionSource & {
  /** Exact value read from the server; always used as the compare-and-swap baseline. */
  expectedDescription: string | null;
  draft: string;
};

type FailureKind = "source" | "save" | null;

type EditMusicDescriptionProps = {
  releaseId: number;
  releaseTitle: string;
  /** Passed only for the actual creator-owner, never for team/collaborator contexts. */
  enabled: boolean;
  disabled?: boolean;
};

function freezeDescription(source: DescriptionSource): FrozenDescription {
  return {
    ...source,
    expectedDescription: source.description,
    draft: source.description ?? "",
  };
}

function safeSaveError(code: string | undefined): string {
  if (code === "CONFLICT") {
    return "The saved description changed elsewhere. Your draft is still here; reload the saved description before saving again.";
  }
  return "We could not confirm the save. Your draft is still here; reload the saved description before retrying if needed.";
}

/**
 * Edits only a release's description. It intentionally does not read the release
 * until the real creator opens it, and never adopts a later query-cache update over
 * a local draft. The server verifies ownership and the compare-and-swap baseline.
 */
export default function EditMusicDescription({
  releaseId,
  releaseTitle,
  enabled,
  disabled = false,
}: EditMusicDescriptionProps) {
  const toast = useToast();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editor, setEditor] = useState<FrozenDescription | null>(null);
  const [failure, setFailure] = useState<FailureKind>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const submitPendingRef = useRef(false);
  const loadGenerationRef = useRef(0);

  // This request remains dormant until an enabled owner explicitly opens the modal.
  // `loadSavedDescription` is the only fetch path, so cache updates cannot replace
  // a frozen draft while someone is typing.
  const descriptionQuery = trpc.release.getDescriptionForEdit.useQuery(
    { id: releaseId },
    {
      enabled: false,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      retry: false,
    },
  );

  const invalidateReleaseViews = () => {
    void utils.release.getMyReleases.invalidate();
    void utils.release.getByArtist.invalidate();
    void utils.release.getById.invalidate();
    void utils.release.getPublicSingle.invalidate({ id: releaseId });
  };

  const saveMutation = trpc.release.updateDescription.useMutation({
    onSuccess: (saved) => {
      submitPendingRef.current = false;
      setEditor(freezeDescription(saved));
      setFailure(null);
      invalidateReleaseViews();
      toast.addSuccess("Description saved", "Your release description has been updated.");
      setDialogOpen(false);
    },
    onError: (error) => {
      submitPendingRef.current = false;
      setFailure("save");
      // Do not expose database details from a management-only action.
      toast.addError("Description not saved", safeSaveError(error.data?.code));
    },
  });

  const isSaving = saveMutation.isPending || submitPendingRef.current;
  const isBusy = sourceLoading || isSaving;
  const hasChanges = editor ? editor.draft !== (editor.expectedDescription ?? "") : false;

  const loadSavedDescription = async (replaceDraft: boolean) => {
    if (!dialogOpen || !enabled || disabled || isSaving) return;

    const generation = ++loadGenerationRef.current;
    setSourceLoading(true);
    setFailure(null);
    try {
      const result = await descriptionQuery.refetch();
      if (generation !== loadGenerationRef.current) return;
      if (result.isError || result.error || !result.data) {
        setFailure("source");
        return;
      }

      // Only an explicit open or reload may replace a frozen local draft. A normal
      // retry after a read error may populate an empty editor, but never overwrite one.
      if (replaceDraft || !editor) setEditor(freezeDescription(result.data));
    } catch {
      if (generation === loadGenerationRef.current) setFailure("source");
    } finally {
      if (generation === loadGenerationRef.current) setSourceLoading(false);
    }
  };

  useEffect(() => {
    if (!dialogOpen) return;
    // Every fresh open deliberately reads the latest saved value. It does not reuse a
    // draft from a prior open, while cache updates during this open stay ignored.
    setEditor(null);
    setFailure(null);
    void loadSavedDescription(true);
    // This effect intentionally runs only for an open/identity/access transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, enabled, disabled, releaseId]);

  const closeDialog = () => {
    if (saveMutation.isPending || submitPendingRef.current) return;
    loadGenerationRef.current += 1;
    setDialogOpen(false);
    setEditor(null);
    setFailure(null);
    setSourceLoading(false);
  };

  const reloadSavedDescription = () => {
    if (isBusy) return;
    if (hasChanges && !window.confirm("Reload the saved description? This discards your unsaved draft.")) return;
    void loadSavedDescription(true);
  };

  const saveDescription = () => {
    if (!editor || !hasChanges || isBusy || submitPendingRef.current) return;
    submitPendingRef.current = true;
    setFailure(null);
    // Never bypass the CAS check: retrying retains this same frozen baseline.
    saveMutation.mutate({
      id: editor.id,
      description: editor.draft,
      expectedDescription: editor.expectedDescription,
    });
  };

  // No trigger and no protected source request for a non-owner/collaborator account.
  if (!enabled) return null;

  const textareaId = `music-description-${releaseId}`;
  const charCountId = `${textareaId}-count`;
  const helpId = `${textareaId}-help`;

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setDialogOpen(true)}
        disabled={disabled || isSaving}
      >
        <Pencil className="mr-1 h-3 w-3" /> Edit Description
      </Button>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent
          overlayClassName="z-[70]"
          className="z-[71] max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl"
          showCloseButton={!isSaving}
          onEscapeKeyDown={(event) => { if (saveMutation.isPending || submitPendingRef.current) event.preventDefault(); }}
          onPointerDownOutside={(event) => { if (saveMutation.isPending || submitPendingRef.current) event.preventDefault(); }}
          onInteractOutside={(event) => { if (saveMutation.isPending || submitPendingRef.current) event.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle>Edit Description</DialogTitle>
            <DialogDescription>
              Update the fan-facing description for <span className="font-medium text-foreground">{releaseTitle}</span>.
            </DialogDescription>
          </DialogHeader>

          <div id={helpId} className="rounded-md border bg-muted/40 p-3 text-sm text-foreground">
            Changing this text does not publish or unpublish a release. A published release remains live; its price, music, and existing purchases are unaffected.
          </div>

          {!editor && (sourceLoading || descriptionQuery.isLoading) && (
            <div role="status" className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading saved description…
            </div>
          )}

          {!editor && !sourceLoading && (failure === "source" || descriptionQuery.isError) && (
            <div role="alert" className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p>We could not load the saved description. Nothing has been changed.</p>
              <Button type="button" variant="outline" onClick={() => void loadSavedDescription(false)} disabled={isBusy}>
                Retry loading saved description
              </Button>
            </div>
          )}

          {editor && (
            <div className="space-y-4">
              {failure && (
                <div role="alert" className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <p>
                    {failure === "save"
                      ? "We could not confirm the save. Your local draft has not been lost."
                      : "We could not load the latest saved description. Your local draft has not been lost."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {failure === "save" && (
                      <Button type="button" size="sm" variant="outline" onClick={saveDescription} disabled={isBusy || !hasChanges}>
                        Retry save
                      </Button>
                    )}
                    {failure === "source" && (
                      <Button type="button" size="sm" variant="outline" onClick={() => void loadSavedDescription(false)} disabled={isBusy}>
                        Retry loading saved description
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="outline" onClick={reloadSavedDescription} disabled={isBusy}>
                      Reload saved description
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={textareaId}>Description</Label>
                <Textarea
                  id={textareaId}
                  value={editor.draft}
                  onChange={(event) => setEditor((current) => current ? { ...current, draft: event.target.value } : current)}
                  placeholder="Tell fans about this track..."
                  maxLength={2000}
                  rows={6}
                  disabled={isBusy}
                  aria-describedby={`${helpId} ${charCountId}`}
                />
                <p id={charCountId} className="text-right text-xs text-muted-foreground" role="status" aria-live="polite">
                  {editor.draft.length} of 2000 characters
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={saveDescription} disabled={!editor || !hasChanges || isBusy}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Description
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
