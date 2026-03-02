import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface ContractStatusTransitionProps {
  contractId: number;
  currentStatus: string;
  canSign: boolean;
  canReject: boolean;
  canApprove: boolean;
  canCancel: boolean;
  onSign?: () => void;
  onReject?: (reason: string) => void;
  onApprove?: (notes: string) => void;
  onCancel?: () => void;
}

export function ContractStatusTransition({
  contractId,
  currentStatus,
  canSign,
  canReject,
  canApprove,
  canCancel,
  onSign,
  onReject,
  onApprove,
  onCancel,
}: ContractStatusTransitionProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending_signatures":
        return "bg-yellow-100 text-yellow-800";
      case "signed":
        return "bg-blue-100 text-blue-800";
      case "executed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Clock className="h-4 w-4" />;
      case "pending_signatures":
        return <AlertCircle className="h-4 w-4" />;
      case "signed":
        return <CheckCircle className="h-4 w-4" />;
      case "executed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleSign = async () => {
    setIsLoading(true);
    try {
      if (onSign) {
        await onSign();
      }
      toast.success("Contract signed successfully");
    } catch (error) {
      toast.error("Failed to sign contract");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setIsLoading(true);
    try {
      if (onReject) {
        await onReject(rejectReason);
      }
      toast.success("Contract rejected");
      setRejectReason("");
    } catch (error) {
      toast.error("Failed to reject contract");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      if (onApprove) {
        await onApprove(approveNotes);
      }
      toast.success("Contract approved");
      setApproveNotes("");
    } catch (error) {
      toast.error("Failed to approve contract");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this contract?")) {
      return;
    }
    setIsLoading(true);
    try {
      if (onCancel) {
        await onCancel();
      }
      toast.success("Contract cancelled");
    } catch (error) {
      toast.error("Failed to cancel contract");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Contract Status & Actions</CardTitle>
        <CardDescription>Manage contract workflow and status transitions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <div className={`p-3 rounded-full ${getStatusColor(currentStatus)}`}>
            {getStatusIcon(currentStatus)}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Status</p>
            <p className="text-lg font-semibold capitalize">{currentStatus.replace(/_/g, " ")}</p>
          </div>
          <Badge className={getStatusColor(currentStatus)}>{currentStatus}</Badge>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Sign Button */}
          {canSign && (
            <Button
              onClick={handleSign}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Sign Contract
            </Button>
          )}

          {/* Reject Button */}
          {canReject && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Contract</DialogTitle>
                  <DialogDescription>
                    Please provide a reason for rejecting this contract
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter rejection reason..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="min-h-24"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline">Cancel</Button>
                    <Button
                      onClick={handleReject}
                      disabled={isLoading || !rejectReason.trim()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Reject Contract
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Approve Button */}
          {canApprove && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Contract</DialogTitle>
                  <DialogDescription>
                    Add optional notes before approving this contract
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Add approval notes (optional)..."
                    value={approveNotes}
                    onChange={(e) => setApproveNotes(e.target.value)}
                    className="min-h-24"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline">Cancel</Button>
                    <Button
                      onClick={handleApprove}
                      disabled={isLoading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Approve Contract
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Cancel Button */}
          {canCancel && (
            <Button
              onClick={handleCancel}
              disabled={isLoading}
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>

        {/* No Actions Available */}
        {!canSign && !canReject && !canApprove && !canCancel && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              No actions available for this contract in its current status.
            </p>
          </div>
        )}

        {/* Status Workflow Info */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-sm mb-2">Contract Workflow</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-white rounded border">Draft</span>
            <span>→</span>
            <span className="px-2 py-1 bg-white rounded border">Pending Signatures</span>
            <span>→</span>
            <span className="px-2 py-1 bg-white rounded border">Signed</span>
            <span>→</span>
            <span className="px-2 py-1 bg-white rounded border">Executed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
