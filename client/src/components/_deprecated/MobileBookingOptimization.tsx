import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";

interface MobileBookingOptimizationProps {
  artistName: string;
  artistPhone?: string;
  artistEmail?: string;
  eventDate: string;
  eventLocation: string;
  artistRate: number;
  onBookingComplete: () => void;
}

export function MobileBookingOptimization({
  artistName,
  artistPhone,
  artistEmail,
  eventDate,
  eventLocation,
  artistRate,
  onBookingComplete,
}: MobileBookingOptimizationProps) {
  const [showQuickBooking, setShowQuickBooking] = useState(false);
  const [bookingStep, setBookingStep] = useState<"confirm" | "sign" | "complete">("confirm");
  const [isProcessing, setIsProcessing] = useState(false);
  const [signatureInitials, setSignatureInitials] = useState("");

  const handleQuickBook = async () => {
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setBookingStep("sign");
      toast.success("Booking details confirmed!");
    } catch (error) {
      toast.error("Failed to process booking");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignContract = async () => {
    if (!signatureInitials.trim()) {
      toast.error("Please enter your initials");
      return;
    }
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setBookingStep("complete");
      toast.success("Contract signed successfully!");
    } catch (error) {
      toast.error("Failed to sign contract");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteBooking = () => {
    onBookingComplete();
    setShowQuickBooking(false);
    setBookingStep("confirm");
    setSignatureInitials("");
    toast.success("Booking confirmed! Check your email for details.");
  };

  return (
    <>
      <Button
        onClick={() => setShowQuickBooking(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 sm:py-2 text-base sm:text-sm rounded-lg"
      >
        Quick Book Now
      </Button>

      <Dialog open={showQuickBooking} onOpenChange={setShowQuickBooking}>
        <DialogContent className="max-w-sm mx-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>Book {artistName}</DialogTitle>
            <DialogDescription>
              Complete your booking in just a few taps
            </DialogDescription>
          </DialogHeader>

          {bookingStep === "confirm" && (
            <div className="space-y-4">
              <Card className="bg-gray-50">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Event Date</p>
                      <p className="text-sm text-gray-600">{eventDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Location</p>
                      <p className="text-sm text-gray-600">{eventLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Artist Rate</p>
                      <p className="text-sm text-gray-600">${artistRate.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>Deposit:</strong> ${(artistRate * 0.25).toLocaleString()} (25%)
                </p>
                <p className="text-xs text-blue-800 mt-1">
                  Balance due 7 days before event
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleQuickBook}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? "Processing..." : "Confirm Booking"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowQuickBooking(false)}
                  disabled={isProcessing}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {bookingStep === "sign" && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-900">
                  Please sign the contract to complete your booking
                </p>
              </div>

              <Card className="bg-gray-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Contract Summary</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2 text-gray-700">
                  <p>✓ Artist: {artistName}</p>
                  <p>✓ Date: {eventDate}</p>
                  <p>✓ Location: {eventLocation}</p>
                  <p>✓ Rate: ${artistRate.toLocaleString()}</p>
                  <p>✓ Deposit: ${(artistRate * 0.25).toLocaleString()}</p>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <label className="block text-sm font-semibold">Your Initials</label>
                <input
                  type="text"
                  maxLength={3}
                  placeholder="e.g., JD"
                  value={signatureInitials}
                  onChange={(e) => setSignatureInitials(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-xs text-gray-500">
                  By entering your initials, you agree to the terms
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleSignContract}
                  disabled={isProcessing || !signatureInitials.trim()}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? "Signing..." : "Sign & Continue"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBookingStep("confirm")}
                  disabled={isProcessing}
                  className="w-full"
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {bookingStep === "complete" && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </div>

              <div>
                <h3 className="font-semibold text-lg">Booking Confirmed!</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your booking with {artistName} is confirmed
                </p>
              </div>

              <Card className="bg-green-50">
                <CardContent className="pt-4 space-y-2 text-sm">
                  <p>✓ Confirmation email sent</p>
                  <p>✓ Contract signed digitally</p>
                  <p>✓ Deposit payment pending</p>
                </CardContent>
              </Card>

              {artistEmail && (
                <div className="flex items-center gap-2 justify-center text-sm">
                  <Mail className="w-4 h-4" />
                  <p className="text-gray-600">{artistEmail}</p>
                </div>
              )}

              <Button
                onClick={handleCompleteBooking}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
