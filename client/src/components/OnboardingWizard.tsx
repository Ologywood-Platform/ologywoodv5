import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Music, Building2, ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type OnboardingStep = "role" | "profile" | "review";

interface OnboardingWizardProps {
  onComplete: (data: any) => void;
  isLoading?: boolean;
}

export default function OnboardingWizard({ onComplete, isLoading = false }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("role");
  const [role, setRole] = useState<"artist" | "venue" | null>(null);
  const [profileData, setProfileData] = useState({
    name: "",
    location: "",
    bio: "",
    genre: "",
    feeMin: "",
    feeMax: "",
  });

  const steps: OnboardingStep[] = ["role", "profile", "review"];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleRoleSelect = (selectedRole: "artist" | "venue") => {
    setRole(selectedRole);
    setCurrentStep("profile");
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = () => {
    onComplete({
      role,
      ...profileData,
      photoUrl: "", // Empty for now
    });
  };

  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case "role":
        return role !== null;
      case "profile":
        if (role === "artist") {
          return profileData.name && profileData.location && profileData.genre && profileData.feeMin && profileData.feeMax;
        } else {
          return profileData.name && profileData.location;
        }
      case "review":
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Welcome to Ologywood</h1>
            <span className="text-sm text-muted-foreground">Step {currentStepIndex + 1} of {steps.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex gap-2 mb-8">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
                  index < currentStepIndex
                    ? "bg-green-500 text-white"
                    : index === currentStepIndex
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-600"
                )}
              >
                {index < currentStepIndex ? <Check className="h-5 w-5" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-1 w-8 mx-1 transition-colors",
                    index < currentStepIndex ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Role Selection Step */}
        {currentStep === "role" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">What's your role?</h2>
              <p className="text-muted-foreground">Choose how you'll use Ologywood</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Artist Card */}
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg",
                  role === "artist" && "ring-2 ring-primary"
                )}
                onClick={() => handleRoleSelect("artist")}
              >
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Music className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-center">I'm an Artist</CardTitle>
                  <CardDescription className="text-center">
                    Showcase your talent and receive bookings
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Venue Card */}
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg",
                  role === "venue" && "ring-2 ring-primary"
                )}
                onClick={() => handleRoleSelect("venue")}
              >
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-accent" />
                    </div>
                  </div>
                  <CardTitle className="text-center">I'm a Venue</CardTitle>
                  <CardDescription className="text-center">
                    Find and book talented artists
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Button
              onClick={handleNext}
              disabled={!isStepComplete()}
              className="w-full"
              size="lg"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Profile Information Step */}
        {currentStep === "profile" && (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Profile</CardTitle>
              <CardDescription>
                Tell us about yourself {role === "artist" ? "as an artist" : "as a venue"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name">
                  {role === "artist" ? "Artist Name" : "Venue Name"}
                </Label>
                <Input
                  id="name"
                  placeholder={role === "artist" ? "Your stage name" : "Your venue name"}
                  value={profileData.name}
                  onChange={(e) => handleProfileChange("name", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="City, State"
                  value={profileData.location}
                  onChange={(e) => handleProfileChange("location", e.target.value)}
                />
              </div>

              {role === "artist" && (
                <>
                  <div>
                    <Label htmlFor="genre">Genre</Label>
                    <Input
                      id="genre"
                      placeholder="e.g., Rock, Jazz, Pop"
                      value={profileData.genre}
                      onChange={(e) => handleProfileChange("genre", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="feeMin">Minimum Fee ($)</Label>
                      <Input
                        id="feeMin"
                        type="number"
                        placeholder="500"
                        value={profileData.feeMin}
                        onChange={(e) => handleProfileChange("feeMin", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="feeMax">Maximum Fee ($)</Label>
                      <Input
                        id="feeMax"
                        type="number"
                        placeholder="5000"
                        value={profileData.feeMax}
                        onChange={(e) => handleProfileChange("feeMax", e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder={role === "artist" ? "Tell venues about your music and experience" : "Tell artists about your venue"}
                  value={profileData.bio}
                  onChange={(e) => handleProfileChange("bio", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!isStepComplete()}
                  className="flex-1"
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Step */}
        {currentStep === "review" && (
          <Card>
            <CardHeader>
              <CardTitle>Review Your Profile</CardTitle>
              <CardDescription>
                Make sure everything looks good before completing setup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-semibold capitalize">{role}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {role === "artist" ? "Artist Name" : "Venue Name"}
                  </p>
                  <p className="font-semibold">{profileData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">{profileData.location}</p>
                </div>
                {role === "artist" && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Genre</p>
                      <p className="font-semibold">{profileData.genre}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fee Range</p>
                      <p className="font-semibold">
                        ${profileData.feeMin} - ${profileData.feeMax}
                      </p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p className="font-semibold">{profileData.bio}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isLoading}>
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Complete Setup
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
