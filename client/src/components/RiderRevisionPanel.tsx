import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Check, X, Edit3, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface RiderRevisionPanelProps {
  bookingId: number;
  currentUserRole: "artist" | "venue";
  riderData: Record<string, any>;
  contractStatus?: string;
}

interface RevisionChange {
  oldValue: any;
  newValue: any;
  label: string;
}

// Editable fields that can be proposed for revision
const EDITABLE_FIELDS: { id: string; label: string; type: "text" | "number" | "select"; options?: string[] }[] = [
  { id: "soundcheck", label: "Soundcheck Time", type: "select", options: ["15 min before", "30 min before", "1 hour before", "2 hours before"] },
  { id: "guest_list", label: "Guest List Spots", type: "number" },
  { id: "performance_fee", label: "Performance Fee ($)", type: "number" },
  { id: "set_duration", label: "Set Length (min)", type: "number" },
  { id: "sound_system", label: "Sound / PA", type: "select", options: ["Venue provides", "I bring my own", "Not needed"] },
  { id: "microphones", label: "Microphones", type: "text" },
  { id: "backline", label: "Backline / Equipment", type: "text" },
  { id: "green_room", label: "Green Room", type: "select", options: ["Yes", "No"] },
  { id: "meals_provided", label: "Meal Provided", type: "select", options: ["Yes", "No"] },
  { id: "parking", label: "Parking", type: "select", options: ["Yes", "No"] },
  { id: "cancellation_policy", label: "Cancellation Policy", type: "select", options: ["Full refund 14+ days out, 50% within 14 days", "Full refund 30+ days out, no refund within 30 days", "Non-refundable", "Custom (see notes)"] },
  { id: "event_time", label: "Start Time", type: "text" },
];

export function RiderRevisionPanel({ bookingId, currentUserRole, riderData, contractStatus }: RiderRevisionPanelProps) {
  const [proposing, setProposing] = useState(false);
  const [changes, setChanges] = useState<Record<string, string | number>>({});
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: revisions, isLoading } = trpc.riderContract.getRevisions.useQuery({ bookingId });
  const proposeMutation = trpc.riderContract.proposeRevision.useMutation({
    onSuccess: () => {
      toast.success("Changes proposed! The other party will be notified.");
      setProposing(false);
      setChanges({});
      utils.riderContract.getRevisions.invalidate({ bookingId });
    },
    onError: (err) => toast.error(err.message),
  });
  const approveMutation = trpc.riderContract.approveRevision.useMutation({
    onSuccess: () => {
      toast.success("Changes approved and applied to the rider.");
      utils.riderContract.getRevisions.invalidate({ bookingId });
      utils.riderContract.getForBooking.invalidate({ bookingId });
    },
    onError: (err) => toast.error(err.message),
  });
  const rejectMutation = trpc.riderContract.rejectRevision.useMutation({
    onSuccess: () => {
      toast.success("Changes rejected.");
      setRejectingId(null);
      setRejectReason("");
      utils.riderContract.getRevisions.invalidate({ bookingId });
    },
    onError: (err) => toast.error(err.message),
  });

  // Don't show revision panel if contract is fully signed
  if (contractStatus === "fully_signed") return null;

  const handlePropose = () => {
    const proposedChanges: Record<string, RevisionChange> = {};
    for (const [fieldId, newValue] of Object.entries(changes)) {
      if (newValue === "" || newValue === undefined) continue;
      const field = EDITABLE_FIELDS.find(f => f.id === fieldId);
      if (!field) continue;
      const oldValue = riderData[fieldId] ?? "";
      if (String(oldValue) === String(newValue)) continue;
      proposedChanges[fieldId] = { oldValue, newValue, label: field.label };
    }

    if (Object.keys(proposedChanges).length === 0) {
      toast.error("No changes to propose. Modify at least one field.");
      return;
    }

    proposeMutation.mutate({ bookingId, changes: proposedChanges });
  };

  const pendingRevisions = revisions?.filter(r => r.status === "pending") || [];
  const pastRevisions = revisions?.filter(r => r.status !== "pending") || [];

  return (
    <Card className="w-full max-w-3xl mx-auto mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Rider Revisions
          </CardTitle>
          {!proposing && contractStatus !== "fully_signed" && (
            <Button variant="outline" size="sm" onClick={() => setProposing(true)}>
              <Edit3 className="h-3.5 w-3.5 mr-1.5" />
              Propose Changes
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Propose Changes Form */}
        {proposing && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
            <p className="text-sm text-muted-foreground">
              Select fields to change. The {currentUserRole === "venue" ? "artist" : "venue"} will review your proposal.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EDITABLE_FIELDS.map(field => (
                <div key={field.id}>
                  <Label className="text-xs">{field.label}</Label>
                  <div className="text-xs text-muted-foreground mb-1">
                    Current: {riderData[field.id] !== undefined ? String(riderData[field.id]) : "—"}
                  </div>
                  {field.type === "select" ? (
                    <select
                      value={changes[field.id] ?? ""}
                      onChange={(e) => setChanges(prev => ({ ...prev, [field.id]: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                    >
                      <option value="">— No change —</option>
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === "number" ? (
                    <Input
                      type="number"
                      placeholder="New value"
                      value={changes[field.id] ?? ""}
                      onChange={(e) => setChanges(prev => ({ ...prev, [field.id]: e.target.value ? parseFloat(e.target.value) : "" }))}
                    />
                  ) : (
                    <Input
                      placeholder="New value"
                      value={changes[field.id] ?? ""}
                      onChange={(e) => setChanges(prev => ({ ...prev, [field.id]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handlePropose} disabled={proposeMutation.isPending}>
                {proposeMutation.isPending ? "Submitting..." : "Submit Proposal"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setProposing(false); setChanges({}); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Pending Revisions (actionable) */}
        {pendingRevisions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              Pending Review ({pendingRevisions.length})
            </h4>
            {pendingRevisions.map(rev => {
              const isMyProposal = rev.proposedByRole === currentUserRole;
              const changesObj = rev.changes as Record<string, RevisionChange>;
              return (
                <div key={rev.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Proposed by {rev.proposedByRole === "artist" ? "Artist" : "Venue"} · {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                    {isMyProposal && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Awaiting response</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {Object.entries(changesObj).map(([fieldId, change]) => (
                      <div key={fieldId} className="flex items-center gap-2 text-sm">
                        <span className="font-medium min-w-[120px]">{change.label}:</span>
                        <span className="line-through text-muted-foreground">{String(change.oldValue || "—")}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium text-primary">{String(change.newValue)}</span>
                      </div>
                    ))}
                  </div>
                  {!isMyProposal && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => approveMutation.mutate({ revisionId: rev.id })} disabled={approveMutation.isPending}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      {rejectingId === rev.id ? (
                        <div className="flex gap-2 items-center">
                          <Input placeholder="Reason (optional)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="h-8 text-sm w-48" />
                          <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate({ revisionId: rev.id, reason: rejectReason || undefined })} disabled={rejectMutation.isPending}>
                            Confirm
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectReason(""); }}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setRejectingId(rev.id)}>
                          <X className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Past Revisions */}
        {pastRevisions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">History</h4>
            {pastRevisions.slice(0, 5).map(rev => {
              const changesObj = rev.changes as Record<string, RevisionChange>;
              return (
                <div key={rev.id} className="border rounded-lg p-3 opacity-70">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {rev.proposedByRole === "artist" ? "Artist" : "Venue"} · {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                    {rev.status === "approved" ? (
                      <span className="text-xs flex items-center gap-1 text-green-600"><CheckCircle className="h-3 w-3" /> Approved</span>
                    ) : (
                      <span className="text-xs flex items-center gap-1 text-red-600"><XCircle className="h-3 w-3" /> Rejected</span>
                    )}
                  </div>
                  <div className="text-xs space-y-0.5">
                    {Object.entries(changesObj).map(([fieldId, change]) => (
                      <span key={fieldId} className="mr-3">
                        {change.label}: {String(change.oldValue || "—")} → {String(change.newValue)}
                      </span>
                    ))}
                  </div>
                  {rev.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">Reason: {rev.rejectionReason}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!revisions || revisions.length === 0) && !proposing && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No revisions yet. Use "Propose Changes" to suggest modifications before signing.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
