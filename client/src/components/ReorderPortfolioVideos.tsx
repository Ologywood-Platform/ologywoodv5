import { useEffect, useRef, useState } from "react";
import { GripVertical, Loader2, MoveDown, MoveUp } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
  VideoPortfolioManagementItem,
  VideoPortfolioManagementState,
} from "@shared/videoPortfolioManagement";

type FrozenOrder = Pick<VideoPortfolioManagementState, "artistProfileId" | "revision"> & {
  items: VideoPortfolioManagementItem[];
  /** IDs returned with the revision; background cache updates never replace this snapshot. */
  loadedIds: number[];
};

type FailureKind = "source" | "save" | null;

type ReorderPortfolioVideosProps = {
  context: VideoPortfolioManagementContext;
};

function freezeOrder(state: VideoPortfolioManagementState): FrozenOrder {
  return {
    artistProfileId: state.artistProfileId,
    revision: state.revision,
    items: state.items.map((item) => ({ ...item })),
    loadedIds: state.items.map((item) => item.id),
  };
}

function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) return [...items];
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function sameIds(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function saveErrorMessage(code: string | undefined): string {
  if (code === "CONFLICT") {
    return "This order changed elsewhere. Your draft is still here; reload the current order before saving again.";
  }
  return "We could not confirm the save. Your draft is still here. Reload the current order to check before retrying.";
}

/** Profile presentation order only; it does not alter the underlying clips or their share pages. */
export default function ReorderPortfolioVideos({ context }: ReorderPortfolioVideosProps) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FrozenOrder | null>(null);
  const [failure, setFailure] = useState<FailureKind>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const dragIndexRef = useRef<number | null>(null);
  const requestGeneration = useRef(0);
  const submitPendingRef = useRef(false);
  const ownerKey = `${context.ownerAccountId}:${context.artistProfileId}`;

  // Keep dormant until an authorized owner intentionally opens the dialog.
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

  const saveOrder = trpc.videoPortfolioManagement.saveOrder.useMutation({
    onSuccess: async (confirmed) => {
      submitPendingRef.current = false;
      // The server response is confirmation of the frozen revision save; do not use
      // a later cache event to modify the local draft while a save is in progress.
      setDraft(freezeOrder(confirmed));
      setFailure(null);
      await invalidatePortfolioViews();
      toast.success("Video order saved");
      setOpen(false);
      setDraft(null);
    },
    onError: (error) => {
      submitPendingRef.current = false;
      setFailure("save");
      toast.error("Order not saved", { description: saveErrorMessage(error.data?.code) });
    },
  });

  const loadCurrentOrder = async (replaceDraft: boolean) => {
    if (!open || saveOrder.isPending) return;
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
      // A state result only replaces a draft after an intentional open/reload.
      if (replaceDraft || !draft) setDraft(freezeOrder(result.data));
    } catch {
      if (generation === requestGeneration.current) setFailure("source");
    } finally {
      if (generation === requestGeneration.current) setSourceLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setDraft(null);
    setFailure(null);
    void loadCurrentOrder(true);
    // The lazy protected request is the only source of this dialog's draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ownerKey]);

  const close = () => {
    if (saveOrder.isPending || submitPendingRef.current) return;
    requestGeneration.current += 1;
    setOpen(false);
    setDraft(null);
    setFailure(null);
    setSourceLoading(false);
  };

  const reorder = (from: number, to: number) => {
    if (sourceLoading || saveOrder.isPending || !draft) return;
    setDraft((current) => current ? { ...current, items: moveItem(current.items, from, to) } : current);
  };

  const reloadCurrentOrder = () => {
    const hasChanges = Boolean(draft && !sameIds(draft.items.map((item) => item.id), draft.loadedIds));
    if (hasChanges && !window.confirm("Reload the current order? This discards your unsaved moves.")) return;
    void loadCurrentOrder(true);
  };

  const submit = () => {
    if (!draft || sourceLoading || saveOrder.isPending || submitPendingRef.current) return;
    submitPendingRef.current = true;
    setFailure(null);
    saveOrder.mutate({
      ids: draft.items.map((item) => item.id),
      expectedRevision: draft.revision,
    });
  };

  const pending = sourceLoading || saveOrder.isPending;
  const hasChanges = Boolean(draft && !sameIds(draft.items.map((item) => item.id), draft.loadedIds));
  const canSave = Boolean(draft) && hasChanges && !pending;

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Reorder videos
      </Button>
      <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) close(); }}>
        <DialogContent
          overlayClassName="z-[70]"
          className="z-[71] max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl"
          showCloseButton={!saveOrder.isPending}
          onEscapeKeyDown={(event) => { if (saveOrder.isPending || submitPendingRef.current) event.preventDefault(); }}
          onPointerDownOutside={(event) => { if (saveOrder.isPending || submitPendingRef.current) event.preventDefault(); }}
          onInteractOutside={(event) => { if (saveOrder.isPending || submitPendingRef.current) event.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle>Reorder videos</DialogTitle>
            <DialogDescription>
              Choose the order shown on your public profile. Your clips, playback pages, and share links stay the same.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p><strong>Tip:</strong> Drag the grip handle on desktop, or use <strong>Move Up</strong> and <strong>Move Down</strong> on mobile or with your keyboard.</p>
            <p className="mt-1 text-muted-foreground">Choose <strong>Save Order</strong> to publish changes. <strong>Cancel</strong> discards unsaved moves.</p>
          </div>

          {!draft && (sourceLoading || stateQuery.isLoading) && (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading current order…
            </div>
          )}

          {!draft && !sourceLoading && (failure === "source" || stateQuery.isError) && (
            <div role="alert" className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p>We could not load the current order. Nothing has been changed.</p>
              <Button type="button" variant="outline" onClick={() => void loadCurrentOrder(true)} disabled={pending}>
                Retry
              </Button>
            </div>
          )}

          {draft && (
            <div className="space-y-4">
              {(failure === "source" || failure === "save" || stateQuery.isError) && (
                <div role="alert" className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <p>
                    {failure === "save"
                      ? "We could not confirm the save. Your local order draft has not been lost."
                      : "The latest source order could not be loaded. Your local order draft has not been lost."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {failure === "save" && (
                      <Button type="button" size="sm" variant="outline" onClick={submit} disabled={pending}>
                        Retry save
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="outline" onClick={reloadCurrentOrder} disabled={pending}>
                      Reload current order
                    </Button>
                  </div>
                </div>
              )}

              {draft.items.length === 0 ? (
                <p className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">No active or preparing videos are available to reorder yet.</p>
              ) : (
                <ol className="space-y-2" aria-label="Video portfolio order">
                  {draft.items.map((item, index) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2 sm:flex-nowrap"
                      onDragOver={(event) => { if (!pending) event.preventDefault(); }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (dragIndexRef.current !== null) reorder(dragIndexRef.current, index);
                        dragIndexRef.current = null;
                      }}
                    >
                      <span className="w-7 shrink-0 text-right text-sm font-medium tabular-nums" aria-hidden="true">{index + 1}.</span>
                      <button
                        type="button"
                        draggable={!pending}
                        disabled={pending}
                        onDragStart={() => { dragIndexRef.current = index; }}
                        onDragEnd={() => { dragIndexRef.current = null; }}
                        className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 active:cursor-grabbing disabled:cursor-not-allowed"
                        aria-label={`Drag ${item.title} to reorder`}
                        title="Drag to reorder"
                      >
                        <GripVertical className="h-5 w-5" />
                      </button>
                      <span className="min-w-0 flex-1 break-words text-sm font-medium">{item.title}</span>
                      {item.status === "processing" && <span className="shrink-0 text-xs text-muted-foreground">Preparing</span>}
                      <div className="flex w-full justify-end gap-1 sm:w-auto sm:shrink-0">
                        <Button type="button" size="sm" variant="ghost" onClick={() => reorder(index, index - 1)} disabled={pending || index === 0} aria-label={`Move ${item.title} up`} title="Move video one position up">
                          <MoveUp className="mr-1 h-4 w-4" /> Move Up
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => reorder(index, index + 1)} disabled={pending || index === draft.items.length - 1} aria-label={`Move ${item.title} down`} title="Move video one position down">
                          <MoveDown className="mr-1 h-4 w-4" /> Move Down
                        </Button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={saveOrder.isPending}>Cancel</Button>
            <Button type="button" onClick={submit} disabled={!canSave}>
              {saveOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
