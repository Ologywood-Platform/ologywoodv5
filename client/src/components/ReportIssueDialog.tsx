import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const DISPUTE_TYPES = [
  { value: "payment_issue", label: "Payment Issue", description: "Problems with payment, deposits, or fees" },
  { value: "no_show", label: "No Show", description: "The other party didn't show up" },
  { value: "contract_violation", label: "Contract Violation", description: "Terms of the rider/contract were not met" },
  { value: "quality_issue", label: "Quality Issue", description: "Performance or venue quality below expectations" },
  { value: "cancellation_dispute", label: "Cancellation Dispute", description: "Disagreement about a cancellation" },
  { value: "harassment", label: "Harassment", description: "Inappropriate behavior or communication" },
  { value: "other", label: "Other", description: "Something else not listed above" },
] as const;

interface ReportIssueDialogProps {
  bookingId: number;
  onDisputeFiled?: () => void;
}

export default function ReportIssueDialog({ bookingId, onDisputeFiled }: ReportIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"type" | "details" | "success">("type");
  const [selectedType, setSelectedType] = useState<string>("");
  const [description, setDescription] = useState("");
  const createDisputeMutation = trpc.dispute.create.useMutation({
    onSuccess: () => {
      setStep("success");
      onDisputeFiled?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (!selectedType || description.length < 20) return;
    createDisputeMutation.mutate({
      bookingId,
      type: selectedType as any,
      description,
    });
  };

  const handleClose = () => {
    setOpen(false);
    // Reset after animation
    setTimeout(() => {
      setStep("type");
      setSelectedType("");
      setDescription("");
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {step === "type" && (
          <>
            <DialogHeader>
              <DialogTitle>Report an Issue</DialogTitle>
              <DialogDescription>
                What type of issue are you experiencing with this booking?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-4">
              {DISPUTE_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setSelectedType(type.value);
                    setStep("details");
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-gray-50 ${
                    selectedType === type.value
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200"
                  }`}
                >
                  <p className="font-medium text-sm text-gray-900">{type.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "details" && (
          <>
            <DialogHeader>
              <DialogTitle>Describe the Issue</DialogTitle>
              <DialogDescription>
                Please provide details about the issue. For payment disputes, you can also contact your bank or card issuer directly.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700">
                  Issue Type: {DISPUTE_TYPES.find((t) => t.value === selectedType)?.label}
                </p>
              </div>
              <div>
                <Label htmlFor="description">What happened?</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the issue in detail. Include dates, specifics, and any relevant context..."
                  className="mt-1.5 min-h-[120px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length < 20
                    ? `${20 - description.length} more characters needed`
                    : ""}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("type")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={description.length < 20 || createDisputeMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {createDisputeMutation.isPending ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "success" && (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Issue Reported</h3>
            <p className="text-sm text-gray-600 mb-6">
              Your report has been submitted and the other party will be notified. For payment-related disputes, contact your bank or card issuer directly — Stripe handles all chargebacks per card network rules.
              You can track the status of your report from your dashboard.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
