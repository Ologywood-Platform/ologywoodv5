import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

export default function VenueOnboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // Step 1: Organization Info
  const [organizationName, setOrganizationName] = useState("");
  const [contactName, setContactName] = useState(user?.name || "");
  const [contactPhone, setContactPhone] = useState("");

  // Step 2: Website
  const [websiteUrl, setWebsiteUrl] = useState("");

  const createProfile = trpc.venue.createProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile created successfully!");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create profile");
    },
  });

  const handleNext = () => {
    if (currentStep === 1) {
      if (!organizationName.trim()) {
        toast.error("Please enter your organization name");
        return;
      }
      if (!contactName.trim()) {
        toast.error("Please enter your contact name");
        return;
      }
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = () => {
    if (!organizationName.trim() || !contactName.trim()) {
      toast.error("Organization name and contact name are required");
      return;
    }

    createProfile.mutate({
      organizationName,
      contactName,
      contactPhone: contactPhone || undefined,
      websiteUrl: websiteUrl || undefined,
    });
  };

  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img src="/logo-icon.png" alt="Ologywood" className="h-8 w-8 rounded" />
              <div>
                <CardTitle>Create Your Venue Profile</CardTitle>
                <CardDescription>Step {currentStep} of {totalSteps}</CardDescription>
              </div>
            </div>
            <Badge variant="secondary">{user?.name}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Organization Information */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold mb-4">Organization Information</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Tell us about your venue or organization.
                </p>
              </div>

              <div>
                <Label htmlFor="organizationName">Organization/Venue Name *</Label>
                <Input
                  id="organizationName"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Your venue or company name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="contactName">Contact Person Name *</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your full name"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This is the primary contact for booking inquiries
                </p>
              </div>

              <div>
                <Label htmlFor="contactPhone">Contact Phone Number</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Step 2: Website */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold mb-4">Online Presence</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Add your website so artists can learn more about your venue.
                </p>
              </div>

              <div>
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourvenue.com"
                  className="mt-1"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 mt-6">
                <h4 className="font-semibold mb-2">You're all set!</h4>
                <p className="text-sm text-muted-foreground">
                  Once you complete setup, you'll be able to browse artists and send booking requests. 
                  Artists will see your organization name and contact information when reviewing requests.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
            >
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={createProfile.isPending}>
                {createProfile.isPending ? (
                  "Creating..."
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
