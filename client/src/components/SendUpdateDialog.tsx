/**
 * SendUpdateDialog Component
 * Allows paid-tier artists to compose and send custom email blasts to their fan list.
 * Includes compose form, character count, preview, send confirmation, and update history.
 */

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
  followerCount: number;
  initialSubject?: string;
  initialBody?: string;
  prefillKey?: string;
}

export function SendUpdateDialog({
  open,
  onOpenChange,
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

  useEffect(() => {
    if (!open || !prefillKey || appliedPrefillKey.current === prefillKey) return;
    setSubject(initialSubject || "");
    setBody(initialBody || "");
    setShowPreview(false);
    setShowConfirm(false);
    setShowHistory(false);
    appliedPrefillKey.current = prefillKey;
  }, [initialBody, initialSubject, open, prefillKey]);

  const utils = trpc.useUtils();

  // Check if artist can send
  const { data: canSendData, isLoading: checkingCanSend } =
    trpc.artistUpdates.canSend.useQuery(undefined, {
      enabled: open,
    });

  // Get update history
  const { data: historyData } = trpc.artistUpdates.getHistory.useQuery(
    { limit: 10, offset: 0 },
    { enabled: open && showHistory }
  );

  // Send mutation
  const sendMutation = trpc.artistUpdates.send.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Update sent to ${data.sentCount} of ${data.recipientCount} fans!`
      );
      setSubject("");
      setBody("");
      appliedPrefillKey.current = null;
      setShowConfirm(false);
      utils.artistUpdates.canSend.invalidate();
      utils.artistUpdates.getHistory.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send update");
      setShowConfirm(false);
    },
  });

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Please fill in both subject and body");
      return;
    }
    setShowConfirm(true);
  };

  const confirmSend = () => {
    sendMutation.mutate({ subject: subject.trim(), body: body.trim() });
  };

  const canSend = canSendData?.canSend === true;
  const hasAccess = canSendData?.hasAccess !== false;
  const isFormValid = subject.trim().length > 0 && body.trim().length > 0;

  // Format time remaining until next allowed send
  const getTimeRemaining = () => {
    if (!canSendData?.nextAllowedAt) return "";
    const next = new Date(canSendData.nextAllowedAt);
    const now = new Date();
    const diff = next.getTime() - now.getTime();
    if (diff <= 0) return "now";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Update to Fans
          </DialogTitle>
          <DialogDescription>
            Compose a message to email all {followerCount}{" "}
            {followerCount === 1 ? "fan" : "fans"} who follow you.
          </DialogDescription>
        </DialogHeader>

        {/* Tab-like toggle between Compose and History */}
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
          /* Update History View */
          <div className="space-y-3">
            {!historyData?.updates || historyData.updates.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">
                  No updates sent yet
                </p>
              </div>
            ) : (
              historyData.updates.map((update: any) => (
                <Card key={update.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {update.subject}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {update.status === "failed" && (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {update.status === "sending" && (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        )}
                        {update.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {update.sentCount}/{update.recipientCount} delivered
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
          /* Preview View */
          <div className="space-y-4">
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Email Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border p-4 space-y-3">
                  <div className="text-xs text-muted-foreground">
                    <strong>To:</strong> {followerCount} fans
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <strong>Subject:</strong> [Your Name]: {subject}
                  </div>
                  <hr />
                  <div className="text-sm whitespace-pre-wrap">{body}</div>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                Edit
              </Button>
              <Button
                onClick={handleSend}
                disabled={!isFormValid || !canSend}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Send to {followerCount} Fans
              </Button>
            </div>
          </div>
        ) : (
          /* Compose View */
          <div className="space-y-4">
            {/* Rate limit warning */}
            {checkingCanSend ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking availability...
              </div>
            ) : !canSend && hasAccess ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Rate limit reached
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    You can send one update per day. Next available in{" "}
                    {getTimeRemaining()}.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="update-subject">Subject</Label>
              <Input
                id="update-subject"
                placeholder="e.g., New show dates announced!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                disabled={!canSend}
              />
              <p className="text-xs text-muted-foreground text-right">
                {subject.length}/200
              </p>
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="update-body">Message</Label>
              <Textarea
                id="update-body"
                placeholder="Write your update here. Tell your fans about upcoming shows, new music, behind-the-scenes news, or anything you'd like to share..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={5000}
                rows={8}
                disabled={!canSend}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {body.length}/5000
              </p>
            </div>

            {/* Info note */}
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-muted-foreground">
              <p>
                Your update will be sent as a branded email from Ologywood.
                Each email includes an unsubscribe link so fans can opt out.
                You can send one update per day.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
                disabled={!isFormValid}
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
                Send to {followerCount} Fans
              </Button>
            </div>
          </div>
        )}

        {/* Confirmation Dialog (nested) */}
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
              <h3 className="text-lg font-semibold mb-2">Confirm Send</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This will email <strong>{followerCount}</strong>{" "}
                {followerCount === 1 ? "fan" : "fans"} with your update. This
                action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  disabled={sendMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmSend}
                  disabled={sendMutation.isPending}
                  className="gap-2"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
