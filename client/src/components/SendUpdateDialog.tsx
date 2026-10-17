import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
  Eye,
  History,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface SendUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A snapshot from the Fans section; canSend rechecks this when opened. */
  eligibleCount?: number;
  /** @deprecated Kept for callers migrating to eligibleCount; canSend remains authoritative. */
  followerCount?: number;
  initialSubject?: string;
  initialBody?: string;
  prefillKey?: string;
}

export function SendUpdateDialog({
  open,
  onOpenChange,
  eligibleCount: initialEligibleCount,
  followerCount,
  initialSubject,
  initialBody,
  prefillKey,
}: SendUpdateDialogProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const appliedPrefillKey = useRef<string | null>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!open || !prefillKey || appliedPrefillKey.current === prefillKey)
      return;
    setSubject(initialSubject || "");
    setBody(initialBody || "");
    setShowPreview(false);
    setShowConfirm(false);
    setShowHistory(false);
    appliedPrefillKey.current = prefillKey;
  }, [initialBody, initialSubject, open, prefillKey]);

  // The server recomputes eligible contacts immediately before this sender is used.
  const {
    data: canSendData,
    isLoading: checkingCanSend,
    error: canSendError,
    refetch: refetchCanSend,
    isFetching: refreshingCanSend,
  } = trpc.artistUpdates.canSend.useQuery(undefined, {
    enabled: open,
    retry: false,
    staleTime: 0,
  });
  const { data: historyData } = trpc.artistUpdates.getHistory.useQuery(
    { limit: 10, offset: 0 },
    { enabled: open && showHistory }
  );

  const sendMutation = trpc.artistUpdates.send.useMutation({
    onSuccess: data => {
      const accepted = data.sentCount ?? 0;
      const failed = data.failedCount ?? 0;
      const skipped = data.skippedCount ?? 0;
      const message = `Update processing complete: ${accepted} accepted, ${failed} failed, ${skipped} skipped.`;
      if (accepted > 0) toast.success(message); else toast.warning(message);
      if (accepted > 0) {
        setSubject("");
        setBody("");
        appliedPrefillKey.current = null;
      }
      setShowConfirm(false);
      utils.artistUpdates.canSend.invalidate();
      utils.artistUpdates.getHistory.invalidate();
    },
    onError: error => {
      toast.error(error.message || "Failed to send update");
      setShowConfirm(false);
    },
  });

  const currentEligibleCount =
    canSendData?.eligibleCount ?? initialEligibleCount ?? followerCount ?? 0;
  const canSend = !canSendError && !checkingCanSend && !refreshingCanSend && canSendData?.canSend === true && currentEligibleCount > 0;
  const hasAccess = canSendData?.hasAccess !== false;
  const isFormValid = subject.trim().length > 0 && body.trim().length > 0;

  const getTimeRemaining = () => {
    if (!canSendData?.nextAllowedAt) return "";
    const diff = new Date(canSendData.nextAllowedAt).getTime() - Date.now();
    if (diff <= 0) return "now";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Please fill in both subject and body");
      return;
    }
    if (currentEligibleCount === 0) {
      toast.info("There are no consent-eligible contacts to email.");
      return;
    }
    if (!canSend) return;
    const refreshed = await refetchCanSend();
    if (refreshed.error || refreshed.data?.canSend !== true || !refreshed.data.eligibleCount) {
      toast.error('We could not confirm an eligible audience. No email was sent.');
      return;
    }
    setShowConfirm(true);
  };

  const confirmSend = () =>
    canSend && sendMutation.mutate({ subject: subject.trim(), body: body.trim() });
  const targetLabel = `${currentEligibleCount.toLocaleString()} ${currentEligibleCount === 1 ? "eligible contact" : "eligible contacts"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Update
          </DialogTitle>
          <DialogDescription>
            Compose an email for {targetLabel} who separately opted in to
            creator updates. This does not email all followers.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={showHistory ? "ghost" : "default"}
            size="sm"
            onClick={() => setShowHistory(false)}
            className="gap-1"
          >
            <Mail className="h-3.5 w-3.5" />
            Compose
          </Button>
          <Button
            variant={showHistory ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowHistory(true)}
            className="gap-1"
          >
            <History className="h-3.5 w-3.5" />
            History
          </Button>
        </div>

        {showHistory ? (
          <div className="space-y-3">
            {!historyData?.updates || historyData.updates.length === 0 ? (
              <div className="py-8 text-center">
                <History className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p className="text-sm text-muted-foreground">
                  No updates sent yet
                </p>
              </div>
            ) : (
              historyData.updates.map((update: any) => (
                <Card key={update.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {update.subject}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {update.body}
                        </p>
                      </div>
                      <Badge
                        variant={
                          update.status === "sent"
                            ? "default"
                            : update.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                        className="shrink-0"
                      >
                        {update.status === "sent" && (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        )}
                        {update.status === "failed" && (
                          <AlertCircle className="mr-1 h-3 w-3" />
                        )}
                        {update.status === "sending" && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        {update.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {update.sentCount}/{update.recipientCount} accepted
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(update.sentAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : showPreview ? (
          <div className="space-y-4">
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Email Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 rounded-lg border bg-white p-4">
                  <div className="text-xs text-muted-foreground">
                    <strong>To:</strong> {targetLabel}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <strong>Subject:</strong> [Your Name]: {subject}
                  </div>
                  <hr />
                  <div className="whitespace-pre-wrap text-sm">{body}</div>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Edit
              </Button>
              <Button
                onClick={handleSend}
                disabled={!isFormValid || !canSend}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Send to {targetLabel}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {checkingCanSend ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking eligible contacts and sending availability…
              </div>
            ) : canSendError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <p>
                  We could not confirm who is eligible. No email will be sent
                  until this is resolved.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => refetchCanSend()}
                >
                  Try again
                </Button>
              </div>
            ) : !hasAccess ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {canSendData?.message ||
                  "A paid creator plan is required to send updates."}
              </div>
            ) : currentEligibleCount === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                No followers are currently eligible for creator email updates.
                Fans must separately opt in with a verified email and may block
                creator updates globally.
              </div>
            ) : !canSend ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Rate limit reached
                  </p>
                  <p className="mt-0.5 text-xs text-amber-700">
                    You can send one update per day. Next available in{" "}
                    {getTimeRemaining()}.
                  </p>
                </div>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="update-subject">Subject</Label>
              <Input
                id="update-subject"
                placeholder="e.g., New show dates announced!"
                value={subject}
                onChange={event => setSubject(event.target.value)}
                maxLength={200}
                disabled={!canSend}
              />
              <p className="text-right text-xs text-muted-foreground">
                {subject.length}/200
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-body">Message</Label>
              <Textarea
                id="update-body"
                placeholder="Write your update here…"
                value={body}
                onChange={event => setBody(event.target.value)}
                maxLength={5000}
                rows={8}
                disabled={!canSend}
                className="resize-none"
              />
              <p className="text-right text-xs text-muted-foreground">
                {body.length}/5000
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-muted-foreground">
              Messages are addressed only to the currently eligible contacts
              confirmed above. Each email includes a creator-update unsubscribe
              link. Sending acceptance is not a delivery guarantee.
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
                disabled={!isFormValid || !canSend}
                className="gap-1"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                onClick={handleSend}
                disabled={!isFormValid || !canSend || sendMutation.isPending}
                className="gap-2"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send to {targetLabel}
              </Button>
            </div>
          </div>
        )}

        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-send-title"
              className="mx-4 max-w-sm rounded-lg bg-white p-6 shadow-xl"
            >
              <h3
                id="confirm-send-title"
                className="mb-2 text-lg font-semibold"
              >
                Confirm Send
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                This will submit your update to {targetLabel} currently eligible
                for creator updates. Counts may change if eligibility changes
                before sending. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  disabled={sendMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmSend}
                  disabled={!canSend || sendMutation.isPending}
                  className="gap-2"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Confirm Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
