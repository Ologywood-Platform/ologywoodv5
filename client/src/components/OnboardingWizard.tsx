import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Music, Building2, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type OnboardingStep = "role" | "profile" | "review";

interface OnboardingWizardProps {
  onComplete: (data: any) => void;
  isLoading?: boolean;
}

export default function OnboardingWizard({ onComplete, isLoading = false }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("role");
  const [role, setRole] = useState<"artist" | "venue" | null>(null);
  const [artistData, setArtistData] = useState({
    artistName: "",
    genre: "",
    bio: "",
    location: "",
    feeRangeMin: "",
    feeRangeMax: "",
  });
  const [venueData, setVenueData] = useState({
    organizationName: "",
    contactName: "",
    contactPhone: "",
    location: "",
    bio: "",
  });

  const steps: OnboardingStep[] = ["role", "profile", "review"];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleRoleSelect = (selectedRole: "artist" | "venue") => {
    setRole(selectedRole);
    setCurrentStep("profile");
  };

  const handleArtistChange = (field: string, value: string) => {
    setArtistData(prev => ({ ...prev, [field]: value }));
  };

  const handleVenueChange = (field: string, value: string) => {
    setVenueData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = () => {
    if (role === "artist") {
      onComplete({
        role,
        ...artistData,
      });
    } else {
      onComplete({
        role,
        ...venueData,
      });
    }
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
          return artistData.artistName && artistData.location && artistData.genre && artistData.feeRangeMin && artistData.feeRangeMax;
        } else {
          return venueData.organizationName && venueData.contactName && venueData.location;
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
              {role === "artist" ? (
                <>
                  <div>
                    <Label htmlFor="artistName">Artist Name</Label>
                    <Input
                      id="artistName"
                      placeholder="Your stage name"
                      value={artistData.artistName}
                      onChange={(e) => handleArtistChange("artistName", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="genre">Genre</Label>
                    <Input
                      id="genre"
                      placeholder="e.g., Rock, Jazz, Pop"
                      value={artistData.genre}
                      onChange={(e) => handleArtistChange("genre", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, State"
                      value={artistData.location}
                      onChange={(e) => handleArtistChange("location", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="feeMin">Minimum Fee ($)</Label>
                      <Input
                        id="feeMin"
                        type="number"
                        placeholder="500"
                        value={artistData.feeRangeMin}
                        onChange={(e) => handleArtistChange("feeRangeMin", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="feeMax">Maximum Fee ($)</Label>
                      <Input
                        id="feeMax"
                        type="number"
                        placeholder="2500"
                        value={artistData.feeRangeMax}
                        onChange={(e) => handleArtistChange("feeRangeMax", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio / About You</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about your music style and experience"
                      value={artistData.bio}
                      onChange={(e) => handleArtistChange("bio", e.target.value)}
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="organizationName">Venue Name</Label>
                    <Input
                      id="organizationName"
                      placeholder="Your venue name"
                      value={venueData.organizationName}
                      onChange={(e) => handleVenueChange("organizationName", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      placeholder="Your name"
                      value={venueData.contactName}
                      onChange={(e) => handleVenueChange("contactName", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      placeholder="(555) 123-4567"
                      value={venueData.contactPhone}
                      onChange={(e) => handleVenueChange("contactPhone", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, State"
                      value={venueData.location}
                      onChange={(e) => handleVenueChange("location", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">About Your Venue</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about your venue"
                      value={venueData.bio}
                      onChange={(e) => handleVenueChange("bio", e.target.value)}
                      rows={4}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-6">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!isStepComplete()}
                  size="sm"
                  className="flex-1"
                >
                  Review <ArrowRight className="ml-2 h-4 w-4" />
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
              <CardDescription>Make sure everything looks good</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                {role === "artist" ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Artist Name</p>
                      <p className="font-semibold">{artistData.artistName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Genre</p>
                      <p className="font-semibold">{artistData.genre}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-semibold">{artistData.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fee Range</p>
                      <p className="font-semibold">${artistData.feeRangeMin} - ${artistData.feeRangeMax}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bio</p>
                      <p className="font-semibold">{artistData.bio}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Venue Name</p>
                      <p className="font-semibold">{venueData.organizationName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Name</p>
                      <p className="font-semibold">{venueData.contactName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Phone</p>
                      <p className="font-semibold">{venueData.contactPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-semibold">{venueData.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">About</p>
                      <p className="font-semibold">{venueData.bio}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={isLoading}
                  size="sm"
                  className="flex-1"
                >
                  {isLoading ? "Creating..." : "Complete Setup"} <Check className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
