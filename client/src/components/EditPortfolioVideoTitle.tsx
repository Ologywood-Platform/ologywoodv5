import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  VideoPortfolioManagementContext,
  VideoPortfolioManagementState,
} from "@shared/videoPortfolioManagement";

type FrozenTitle = {
  id: number;
  title: string;
};

type FailureKind = "source" | "save" | null;

type EditPortfolioVideoTitleProps = {
  context: VideoPortfolioManagementContext;
  videoId: number;
};

function saveErrorMessage(code: string | undefined): string {
  if (code === "CONFLICT") {
    return "This title changed elsewhere. Your draft is still here; reload the current title before saving again.";
  }
  return "We could not confirm the save. Your draft is still here. Reload the current title before retrying.";
}

/**
 * The state read is deliberately lazy. It freezes the title that the server
 * returned when this editor opened, so a later cache update cannot change the
 * expectedTitle behind an editor's draft.
 */
export default function EditPortfolioVideoTitle({ context, videoId }: EditPortfolioVideoTitleProps) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [frozen, setFrozen] = useState<FrozenTitle | null>(null);
  const [draft, setDraft] = useState("");
  const [failure, setFailure] = useState<FailureKind>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const requestGeneration = useRef(0);
  const submitPendingRef = useRef(false);
  const ownerKey = `${context.ownerAccountId}:${context.artistProfileId}`;

  // Never let a normal React Query update replace a title that somebody is editing.
  const stateQuery = trpc.videoPortfolioManagement.getState.useQuery(undefined, {
    enabled: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: false,
  });

  const invalidatePortfolioViews = async () => {
    await Promise.all([
      utils.artist.getVideoPortfolio.invalidate({ artistProfileId: context.artistProfileId }),
      utils.artist.getPortfolioVideo.invalidate(),
      utils.artist.getMyVideoPortfolio.invalidate(),
      utils.videoPortfolioManagement.getState.invalidate(),
    ]);
  };

  const editTitle = trpc.videoPortfolioManagement.editTitle.useMutation({
    onSuccess: async () => {
      submitPendingRef.current = false;
      await invalidatePortfolioViews();
      toast.success("Video title saved");
      setOpen(false);
      setFrozen(null);
      setDraft("");
      setFailure(null);
    },
    onError: (error) => {
      submitPendingRef.current = false;
      setFailure("save");
      toast.error("Title not saved", { description: saveErrorMessage(error.data?.code) });
    },
  });

  const loadCurrentTitle = async (replaceDraft: boolean) => {
    if (!open || editTitle.isPending) return;
    const generation = ++requestGeneration.current;
    setSourceLoading(true);
    setFailure(null);
    try {
      const result = await stateQuery.refetch();
      if (generation !== requestGeneration.current) return;
      if (result.isError || result.error || !result.data || result.data.artistProfileId !== context.artistProfileId) {
        setFailure("source");
        return;
      }
      const current = (result.data as VideoPortfolioManagementState).items.find((item) => item.id === videoId);
      if (!current) {
        setFailure("source");
        return;
      }
      // Only an explicit initial load or explicit Reload can replace a draft.
      if (replaceDraft || !frozen) {
        setFrozen({ id: current.id, title: current.title });
        setDraft(current.title);
      }
    } catch {
      if (generation === requestGeneration.current) setFailure("source");
    } finally {
      if (generation === requestGeneration.current) setSourceLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setFrozen(null);
    setDraft("");
    setFailure(null);
    void loadCurrentTitle(true);
    // The protected source must only be read after the editor has opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ownerKey, videoId]);

  const close = () => {
    if (editTitle.isPending || submitPendingRef.current) return;
    requestGeneration.current += 1;
    setOpen(false);
    setFrozen(null);
    setDraft("");
    setFailure(null);
    setSourceLoading(false);
  };

  const reloadCurrentTitle = () => {
    const changed = Boolean(frozen && draft !== frozen.title);
    if (changed && !window.confirm("Reload the current title? This discards your unsaved title draft.")) return;
    void loadCurrentTitle(true);
  };

  const save = () => {
    const title = draft.trim();
    if (!frozen || sourceLoading || editTitle.isPending || submitPendingRef.current) return;
    if (!title) {
      toast.error("Enter a video title before saving.");
      return;
    }
    if (title === frozen.title) return;
    submitPendingRef.current = true;
    setFailure(null);
    editTitle.mutate({ id: frozen.id, title, expectedTitle: frozen.title });
  };

  const pending = sourceLoading || editTitle.isPending;
  const canSave = Boolean(frozen) && draft.trim().length > 0 && draft.trim() !== frozen?.title && !pending;

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-9 shrink-0 px-2 text-xs"
        onClick={() => setOpen(true)}
      >
        <Pencil className="mr-1 h-3.5 w-3.5" /> Edit title
      </Button>
      <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) close(); }}>
        <DialogContent
          overlayClassName="z-[70]"
          className="z-[71] max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"
          showCloseButton={!editTitle.isPending}
          onEscapeKeyDown={(event) => { if (editTitle.isPending || submitPendingRef.current) event.preventDefault(); }}
          onPointerDownOutside={(event) => { if (editTitle.isPending || submitPendingRef.current) event.preventDefault(); }}
          onInteractOutside={(event) => { if (editTitle.isPending || submitPendingRef.current) event.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle>Edit video title</DialogTitle>
            <DialogDescription>
              This changes the title only. Your video, playback page, and share link stay the same.
            </DialogDescription>
          </DialogHeader>

          {!frozen && (sourceLoading || stateQuery.isLoading) && (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading current title…
            </div>
          )}

          {!frozen && !sourceLoading && (failure === "source" || stateQuery.isError) && (
            <div role="alert" className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p>We could not load the current title. Nothing has been changed.</p>
              <Button type="button" variant="outline" onClick={() => void loadCurrentTitle(true)} disabled={pending}>
                Retry
              </Button>
            </div>
          )}

          {frozen && (
            <div className="space-y-4">
              {(failure === "source" || failure === "save" || stateQuery.isError) && (
                <div role="alert" className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <p>
                    {failure === "save"
                      ? "We could not confirm the save. Your title draft has not been lost."
                      : "The latest title could not be loaded. Your title draft has not been lost."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {failure === "save" && (
                      <Button type="button" size="sm" variant="outline" onClick={save} disabled={pending}>
                        Retry save
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="outline" onClick={reloadCurrentTitle} disabled={pending}>
                      Reload current title
                    </Button>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor={`portfolio-video-title-${videoId}`}>Title</Label>
                <Input
                  id={`portfolio-video-title-${videoId}`}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={255}
                  disabled={pending}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={editTitle.isPending}>Cancel</Button>
            <Button type="button" onClick={save} disabled={!canSave}>
              {editTitle.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save title
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
