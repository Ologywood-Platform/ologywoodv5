import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, DollarSign, FileText } from "lucide-react";
import { toast } from "sonner";

interface BookingConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistName: string;
  eventDate: string;
  eventLocation: string;
  artistRate: number;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function BookingConfirmationModal({
  open,
  onOpenChange,
  artistName,
  eventDate,
  eventLocation,
  artistRate,
  onConfirm,
  isLoading = false,
}: BookingConfirmationModalProps) {
  const [step, setStep] = useState<"review" | "deposit" | "contract" | "confirm">("review");
  const [depositAmount, setDepositAmount] = useState(artistRate * 0.25); // 25% deposit
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleNext = () => {
    if (step === "review") setStep("deposit");
    else if (step === "deposit") setStep("contract");
    else if (step === "contract") setStep("confirm");
  };

  const handlePrevious = () => {
    if (step === "deposit") setStep("review");
    else if (step === "contract") setStep("deposit");
    else if (step === "confirm") setStep("contract");
  };

  const handleConfirm = async () => {
    if (!agreedToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }
    onConfirm();
    toast.success("Booking confirmed! Check your email for details.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirm Your Booking</DialogTitle>
          <DialogDescription>
            Complete these steps to finalize your booking with {artistName}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="review" disabled={step !== "review"}>
              Review
            </TabsTrigger>
            <TabsTrigger value="deposit" disabled={step === "review"}>
              Deposit
            </TabsTrigger>
            <TabsTrigger value="contract" disabled={["review", "deposit"].includes(step)}>
              Contract
            </TabsTrigger>
            <TabsTrigger value="confirm" disabled={["review", "deposit", "contract"].includes(step)}>
              Confirm
            </TabsTrigger>
          </TabsList>

          {/* Review Step */}
          <TabsContent value="review" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Artist</p>
                    <p className="font-semibold">{artistName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Event Date</p>
                    <p className="font-semibold">{eventDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-semibold">{eventLocation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Artist Rate</p>
                    <p className="font-semibold">${artistRate.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deposit Step */}
          <TabsContent value="deposit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Deposit Payment
                </CardTitle>
                <CardDescription>
                  A 25% deposit is required to secure the booking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">Deposit Amount</p>
                    <p className="text-blue-800">${depositAmount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    This deposit will be held until the event date. After the event, the remaining balance will be due.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contract Step */}
          <TabsContent value="contract" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Contract Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-48 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {`BOOKING AGREEMENT

Artist: ${artistName}
Event Date: ${eventDate}
Location: ${eventLocation}
Rate: $${artistRate.toLocaleString()}
Deposit: $${depositAmount.toLocaleString()}

Terms & Conditions:
1. Artist agrees to perform at the specified date and location
2. Venue agrees to provide necessary equipment and setup
3. Cancellation policy: 30 days notice for full refund
4. Payment terms: 25% deposit due upon booking, balance due 7 days before event
5. Both parties agree to professional conduct and punctuality

Signed digitally by both parties upon confirmation.`}
                  </p>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">
                    I agree to the terms and conditions above
                  </span>
                </label>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Confirm Step */}
          <TabsContent value="confirm" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Ready to Confirm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  You're about to confirm your booking with <strong>{artistName}</strong>. 
                  A confirmation email will be sent to both you and the artist with all the details.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-900">
                    ✓ Booking details reviewed
                    <br />✓ Deposit amount confirmed
                    <br />✓ Contract terms agreed
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={step === "review" || isLoading}
          >
            Previous
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            {step !== "confirm" ? (
              <Button onClick={handleNext} disabled={isLoading}>
                Next
              </Button>
            ) : (
              <Button
                onClick={handleConfirm}
                disabled={!agreedToTerms || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Confirming..." : "Confirm Booking"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
