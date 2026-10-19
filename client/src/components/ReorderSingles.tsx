import { useEffect, useRef, useState } from "react";
import { GripVertical, Loader2, MoveDown, MoveUp, RotateCcw } from "lucide-react";
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
import { useToast } from "@/components/ErrorToast";
import {
  moveReleaseOrderItem,
  sameReleaseOrder,
  type ReleaseOrderKind,
  type ReleaseOrderState,
} from "@shared/releaseOrder";

type FrozenOrder = Pick<ReleaseOrderState, "kind" | "revision" | "custom" | "items"> & {
  /** IDs returned with revision; never replaced by a background cache update. */
  loadedIds: number[];
};
type FailureKind = "source" | "save" | null;

type ReorderSinglesProps = {
  /** The release-order service also verifies this account on every read and write. */
  ownerAccountId: number | null | undefined;
  kind: ReleaseOrderKind;
  /** False for signed-out, non-creator, and collaborator/team-manager contexts. */
  enabled: boolean;
};

function freezeOrder(order: ReleaseOrderState): FrozenOrder {
  return {
    kind: order.kind,
    revision: order.revision,
    custom: order.custom,
    items: order.items.map((item) => ({ ...item })),
    loadedIds: order.items.map((item) => item.id),
  };
}

function safeSaveError(code: string | undefined): string {
  if (code === "CONFLICT") {
    return "This order changed elsewhere. Your draft is still here; reload the current order before saving again.";
  }
  return "We could not confirm the save. Your draft is still here. Reload the current order to check before retrying.";
}

/**
 * Creator-only ordering for profile presentation. This intentionally does not touch
 * pricing, purchases, previews, downloads, or a listener's library.
 */
export default function ReorderSingles({ ownerAccountId, kind, enabled }: ReorderSinglesProps) {
  const toast = useToast();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<FrozenOrder | null>(null);
  const [failure, setFailure] = useState<FailureKind>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const dragIndexRef = useRef<number | null>(null);
  const submitPendingRef = useRef(false);
  const saveIntentRef = useRef<"save" | "reset">("save");
  const loadGenerationRef = useRef(0);

  // This protected request is deliberately dormant until an owner opens the dialog.
  const orderQuery = trpc.releaseOrder.get.useQuery(
    { kind },
    {
      // `loadCurrentOrder` below is the sole fetch path and checks that the
      // dialog is open. Keeping React Query disabled avoids an automatic cache
      // read/refetch racing the freshly frozen local draft.
      enabled: false,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      retry: false,
    },
  );

  const invalidateReleaseViews = () => {
    void utils.releaseOrder.get.invalidate({ kind });
    if (kind === "music") {
      void utils.release.getMyReleases.invalidate();
      void utils.release.getByArtist.invalidate();
      return;
    }
    void utils.contentRelease.myReleases.invalidate();
    void utils.contentRelease.getByArtist.invalidate();
  };

  const saveMutation = trpc.releaseOrder.save.useMutation({
    onSuccess: (confirmed) => {
      submitPendingRef.current = false;
      setDraft(freezeOrder(confirmed));
      setFailure(null);
      invalidateReleaseViews();
      toast.addSuccess(
        saveIntentRef.current === "reset" ? "Order reset" : "Order saved",
        saveIntentRef.current === "reset"
          ? "Your singles are back in newest-first order."
          : "Your single order has been updated.",
      );
      setDialogOpen(false);
    },
    onError: (error) => {
      submitPendingRef.current = false;
      setFailure("save");
      // Never display server/database details in this management dialog.
      toast.addError("Save not confirmed", safeSaveError(error.data?.code));
    },
  });

  const isPending = saveMutation.isPending || sourceLoading;

  const loadCurrentOrder = async (replaceDraft: boolean) => {
    if (!dialogOpen || !enabled || !ownerAccountId || saveMutation.isPending) return;
    const generation = ++loadGenerationRef.current;
    setSourceLoading(true);
    setFailure(null);
    try {
      const result = await orderQuery.refetch();
      if (generation !== loadGenerationRef.current) return;
      if (result.isError || result.error) {
        setFailure("source");
        return;
      }
      if (result.data) {
        // Only an explicit open/reload can replace a frozen draft. Background query
        // updates therefore never overwrite a creator's unsaved moves.
        if (replaceDraft || !draft) setDraft(freezeOrder(result.data));
        return;
      }
      setFailure("source");
    } catch {
      if (generation === loadGenerationRef.current) setFailure("source");
    } finally {
      if (generation === loadGenerationRef.current) setSourceLoading(false);
    }
  };

  useEffect(() => {
    if (!dialogOpen) return;
    // Reopening always starts a new source read rather than reusing a former draft.
    setDraft(null);
    setFailure(null);
    void loadCurrentOrder(true);
    // The query is intentionally fetched on open only; do not adopt its later cache
    // updates while a local draft is being edited.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, enabled, ownerAccountId]);

  const closeDialog = () => {
    if (saveMutation.isPending || submitPendingRef.current) return;
    loadGenerationRef.current += 1;
    setDialogOpen(false);
    setDraft(null);
    setFailure(null);
    setSourceLoading(false);
  };

  const moveItem = (from: number, to: number) => {
    if (isPending || !draft) return;
    setDraft((current) => current ? { ...current, items: moveReleaseOrderItem(current.items, from, to) } : current);
  };

  const submitOrder = (reset = false) => {
    if (!draft || isPending || submitPendingRef.current) return;
    submitPendingRef.current = true;
    saveIntentRef.current = reset ? "reset" : "save";
    setFailure(null);
    saveMutation.mutate({
      kind,
      expectedRevision: draft.revision,
      ids: draft.items.map((item) => item.id),
      ...(reset ? { reset: true } : {}),
    });
  };

  const resetToNewest = () => {
    if (!draft || isPending) return;
    if (!window.confirm("Reset this single order to newest first? This discards any unsaved moves.")) return;
    submitOrder(true);
  };

  // Do not render a trigger, or perform an order query, for a denied account.
  if (!enabled || !ownerAccountId) return null;

  const hasChanges = draft
    ? !sameReleaseOrder(draft.items.map((item) => item.id), draft.loadedIds)
    : false;
  const canSave = Boolean(draft) && !isPending && hasChanges;
  const title = kind === "music" ? "Music Releases" : "Content Releases";
  const eligibleDescription = kind === "music"
    ? "Reorder your uploaded, published singles on your public profile. Purchases, prices, previews, downloads, and libraries are unchanged."
    : "Reorder your hosted, published Singles on your public profile. Other content stays in place.";

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setDialogOpen(true)}>
        Reorder Singles
      </Button>
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent
          overlayClassName="z-[70]"
          className="z-[71] max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl"
          showCloseButton={!saveMutation.isPending}
          onEscapeKeyDown={(event) => { if (saveMutation.isPending || submitPendingRef.current) event.preventDefault(); }}
          onPointerDownOutside={(event) => { if (saveMutation.isPending || submitPendingRef.current) event.preventDefault(); }}
          onInteractOutside={(event) => { if (saveMutation.isPending || submitPendingRef.current) event.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle>Reorder Singles</DialogTitle>
            <DialogDescription>{eligibleDescription}</DialogDescription>
          </DialogHeader>

          {(!draft && (sourceLoading || orderQuery.isLoading)) && (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading current order…
            </div>
          )}

          {!draft && !sourceLoading && (failure === "source" || orderQuery.isError) && (
            <div role="alert" className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p>We could not load the current order. Nothing has been changed.</p>
              <Button type="button" variant="outline" onClick={() => void loadCurrentOrder(true)} disabled={isPending}>
                Retry
              </Button>
            </div>
          )}

          {draft && (
            <div className="space-y-4">
              {(failure === "save" || failure === "source" || orderQuery.isError) && (
                <div role="alert" className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <p>{failure === "save" ? "We could not confirm the save. Your local draft has not been lost; reload to check the saved order." : "The latest source order could not be loaded. Your local draft has not been lost."}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => {
                      if (failure === "save") submitOrder(saveIntentRef.current === "reset");
                      else void loadCurrentOrder(false);
                    }} disabled={isPending}>
                      Retry
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void loadCurrentOrder(true)} disabled={isPending}>
                      Reload current order
                    </Button>
                  </div>
                </div>
              )}

              {draft.items.length === 0 ? (
                <p className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">No eligible published singles are available to reorder yet.</p>
              ) : (
                <>
                  {draft.items.length === 1 && <p className="text-sm text-muted-foreground">You have one eligible single. Publish another single to arrange their order.</p>}
                  <ol className="space-y-2" aria-label={`${title} single order`}>
                    {draft.items.map((item, index) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2 sm:flex-nowrap"
                        onDragOver={(event) => { if (!isPending) event.preventDefault(); }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (dragIndexRef.current !== null) moveItem(dragIndexRef.current, index);
                          dragIndexRef.current = null;
                        }}
                      >
                        <span className="w-7 shrink-0 text-right text-sm font-medium tabular-nums" aria-hidden="true">{index + 1}.</span>
                        <button
                          type="button"
                          draggable={!isPending}
                          onDragStart={() => { dragIndexRef.current = index; }}
                          onDragEnd={() => { dragIndexRef.current = null; }}
                          disabled={isPending}
                          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 active:cursor-grabbing disabled:cursor-not-allowed"
                          aria-label={`Drag ${item.title} to reorder`}
                          title="Drag to reorder"
                        >
                          <GripVertical className="h-5 w-5" />
                        </button>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
                        <div className="flex w-full justify-end gap-1 sm:w-auto sm:shrink-0">
                          <Button type="button" size="sm" variant="ghost" onClick={() => moveItem(index, index - 1)} disabled={isPending || index === 0} aria-label={`Move ${item.title} up`}>
                            <MoveUp className="mr-1 h-4 w-4" /> Move Up
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => moveItem(index, index + 1)} disabled={isPending || index === draft.items.length - 1} aria-label={`Move ${item.title} down`}>
                            <MoveDown className="mr-1 h-4 w-4" /> Move Down
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={saveMutation.isPending}>Cancel</Button>
            {draft?.custom && (
              <Button type="button" variant="outline" onClick={resetToNewest} disabled={isPending}>
                {saveMutation.isPending && saveIntentRef.current === "reset" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                Reset to Newest
              </Button>
            )}
            <Button type="button" onClick={() => submitOrder(false)} disabled={!canSave}>
              {saveMutation.isPending && saveIntentRef.current === "save" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
