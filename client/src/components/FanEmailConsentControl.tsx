import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface FanEmailConsentControlProps {
  /** The creator's user id, which is also the follow relation's followingId. */
  followingId: number;
  creatorName: string;
  /** Lets a parent open the disclosure immediately after a successful follow. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  triggerLabel?: string;
}

/**
 * Per-creator, affirmative email-consent control. Following is intentionally
 * separate: no consent request is read until this control is opened, and no
 * preference changes until the fan explicitly saves the checkbox state.
 */
export function FanEmailConsentControl({
  followingId,
  creatorName,
  open: controlledOpen,
  onOpenChange,
  className,
  triggerLabel = "Creator email updates",
}: FanEmailConsentControlProps) {
  const { isAuthenticated } = useAuth();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [draftOptIn, setDraftOptIn] = useState(false);
  const [hasLoadedConsent, setHasLoadedConsent] = useState(false);
  const [draftRevision, setDraftRevision] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  // This is intentionally lazy. Opening the control is the first time we read
  // a fan's per-creator consent state, and the server verifies ownership.
  const consentQuery = trpc.follows.getEmailConsent.useQuery(
    { followingId },
    { enabled: open && isAuthenticated && !!followingId, retry: false, staleTime: 0 }
  );

  useEffect(() => {
    if (!open) {
      setHasLoadedConsent(false);
      setSaveError(null);
      return;
    }
    if (consentQuery.data && !consentQuery.isFetching && !hasLoadedConsent) {
      setDraftOptIn(consentQuery.data.optedIn === true);
      setDraftRevision(consentQuery.data.revision);
      setHasLoadedConsent(true);
      setSaveError(null);
    }
  }, [consentQuery.data, consentQuery.isFetching, open, hasLoadedConsent]);

  const saveMutation = trpc.follows.setEmailConsent.useMutation({
    onSuccess: result => {
      setDraftOptIn(result.optedIn);
      setDraftRevision(result.revision);
      setSaveError(null);
      toast.success(
        result.optedIn
          ? `Email updates from ${creatorName} are enabled.`
          : `Email updates from ${creatorName} are turned off.`
      );
      utils.follows.getEmailConsent.invalidate({ followingId });
    },
    onError: error => {
      // Preserve the checkbox draft so the fan can decide how to retry.
      setSaveError(
        error.message ||
          "We could not save your email permission. Please try again."
      );
    },
  });

  const consent = consentQuery.data;
  const isNotFollowing = consent?.isFollowing === false;
  const globalBlock = consent?.globallyBlocked === true;
  const emailUnverified = consent?.emailVerified === false;
  const currentlyOptedIn = consent?.optedIn === true;
  const canEnable = !globalBlock && !emailUnverified && !isNotFollowing;
  // A fan can always revoke an existing consent, even if a global block or an
  // unverified address otherwise prevents a new opt-in.
  const canSave = !!consent && !consentQuery.error && (!draftOptIn || canEnable);

  const handleSave = () => {
    if (!consent || !canSave) return;
    setSaveError(null);
    saveMutation.mutate({
      followingId,
      optIn: draftOptIn,
      expectedRevision: draftRevision,
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
      >
        <Mail className="mr-2 h-4 w-4" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email updates from {creatorName}
            </DialogTitle>
            <DialogDescription>
              Following {creatorName} is separate from email permission.
            </DialogDescription>
          </DialogHeader>

          {!isAuthenticated ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Sign in to review or change your email permission.
            </div>
          ) : consentQuery.isLoading ||
            (open && !hasLoadedConsent && !consentQuery.error) ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your permission…
            </div>
          ) : consentQuery.error || !consent ? (
            <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <div className="flex gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p>
                  We could not load this email permission. No changes were made.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => consentQuery.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : isNotFollowing && !currentlyOptedIn ? (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              Follow {creatorName} first to manage this optional email
              permission.
            </div>
          ) : (
            <div className="space-y-4 py-1">
              {globalBlock && (
                <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <p>
                    Creator updates are globally turned off in your email
                    settings. You can still revoke an existing permission here.
                    To allow future eligible creator updates, change your{" "}
                    <a className="font-medium underline" href="/settings">
                      email settings
                    </a>
                    .
                  </p>
                </div>
              )}

              {emailUnverified && (
                <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <p>
                    Verify your email address before opting in to creator
                    updates.{" "}
                    <a className="font-medium underline" href="/verify-email">
                      Verify your email
                    </a>
                    , then return here. You can still revoke an existing
                    permission now.
                  </p>
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40">
                <Checkbox
                  checked={draftOptIn}
                  onCheckedChange={checked => setDraftOptIn(checked === true)}
                  disabled={
                    saveMutation.isPending ||
                    (draftOptIn === false && !canEnable)
                  }
                  aria-describedby="creator-email-consent-disclosure"
                />
                <span className="min-w-0 space-y-2">
                  <span className="block text-sm font-medium">
                    I want email updates from {creatorName}
                  </span>
                  <span
                    id="creator-email-consent-disclosure"
                    className="block text-xs leading-relaxed text-muted-foreground"
                  >
                    Share my name and email with {creatorName} for updates;
                    eligible paid creator can export contacts and contact me
                    outside OlogyWood; I can revoke permission without
                    unfollowing. Past exports cannot be recalled.
                  </span>
                </span>
              </label>

              {currentlyOptedIn && !draftOptIn && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Saving will revoke this creator’s permission without
                  unfollowing.
                </p>
              )}

              {saveError && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  {saveError}
                  <Button type="button" variant="outline" size="sm" className="mt-2" disabled={saveMutation.isPending}
                    onClick={() => { setHasLoadedConsent(false); consentQuery.refetch(); }}>
                    Refresh current permission
                  </Button>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={saveMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave || saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Settings className="mr-2 h-4 w-4" />
                  )}
                  Save email permission
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
