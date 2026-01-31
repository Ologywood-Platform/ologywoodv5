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
import { Building2, ArrowRight, Check, Sparkles, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { SkeletonOnboarding } from "@/components/SkeletonLoaders";

export default function VenueOnboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Organization Info
  const [organizationName, setOrganizationName] = useState("");
  const [contactName, setContactName] = useState(user?.name || "");
  const [contactPhone, setContactPhone] = useState("");
  const [location, setLocation] = useState("");

  // Step 2: Website
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [email, setEmail] = useState("");

  // Step 3: Directory Listing
  const [venueType, setVenueType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [bio, setBio] = useState("");

  // Step 4: Photos
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");

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
      if (!location.trim()) {
        toast.error("Please enter your location");
        return;
      }
    }
    if (currentStep === 3) {
      if (!venueType) {
        toast.error("Please select a venue type");
        return;
      }
      if (!capacity) {
        toast.error("Please enter your venue capacity");
        return;
      }
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSubmit = () => {
    if (!organizationName.trim()) {
      toast.error("Organization name is required");
      return;
    }

    createProfile.mutate({
      organizationName,
      contactName: contactName || undefined,
      contactPhone: contactPhone || undefined,
      location: location || undefined,
      website: websiteUrl || undefined,
      email: email || undefined,
      venueType: venueType || undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
      amenities: amenities.length > 0 ? amenities : undefined,
      bio: bio || undefined,
    });
  };

  const progress = (currentStep / totalSteps) * 100;

  // Show skeleton while mutation is pending
  if (createProfile.isPending) {
    return <SkeletonOnboarding />;
  }

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
                <Label htmlFor="organizationName">Organization Name *</Label>
                <Input
                  id="organizationName"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Your venue or organization name"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your name"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State or Address"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Your phone number"
                  type="tel"
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {/* Step 2: Website & Email */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold mb-4">Website & Contact</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Add your website and email so artists can learn more about your venue.
                </p>
              </div>

              <div>
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input
                  id="websiteUrl"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  type="url"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="booking@yourvenuecom"
                  type="email"
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {/* Step 3: Directory Listing */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Directory Listing
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Complete your free directory listing to help artists discover your venue.
                </p>
              </div>

              <div>
                <Label htmlFor="venueType">Venue Type *</Label>
                <select
                  id="venueType"
                  value={venueType}
                  onChange={(e) => setVenueType(e.target.value)}
                  className="w-full mt-2 p-2 border rounded-md"
                >
                  <option value="">Select a venue type</option>
                  <option value="Club">Club</option>
                  <option value="Theater">Theater</option>
                  <option value="Lounge">Lounge</option>
                  <option value="Outdoor">Outdoor</option>
                  <option value="Hall">Hall</option>
                  <option value="Bar">Bar</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Event Space">Event Space</option>
                </select>
              </div>

              <div>
                <Label htmlFor="capacity">Venue Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Maximum number of attendees"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Amenities</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['PA System', 'Stage', 'Parking', 'Bar', 'Professional Lighting', 'Dressing Rooms', 'DJ Booth', 'Dance Floor'].map(amenity => (
                    <button
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      className={`p-2 text-sm rounded border transition ${
                        amenities.includes(amenity)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white border-gray-300 hover:border-primary'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="bio">About Your Venue</Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell artists about your venue, the atmosphere, and what makes it special..."
                  className="w-full mt-2 p-2 border rounded-md"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 4: Photos */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Add Photos
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Upload a photo of your venue to showcase it in the directory. (Optional)
                </p>
              </div>

              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {profilePhotoPreview ? (
                  <div className="space-y-4">
                    <img src={profilePhotoPreview} alt="Preview" className="w-full h-48 object-cover rounded" />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('profilePhoto')?.click()}
                    >
                      Change Photo
                    </Button>
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Drag and drop your photo here, or click to select</p>
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('profilePhoto')?.click()}
                    >
                      Select Photo
                    </Button>
                  </div>
                )}
                <input
                  id="profilePhoto"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  💡 <strong>Pro Tip:</strong> A high-quality photo of your venue will help attract more artists. Make sure it shows the stage, lighting, and atmosphere!
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 justify-between pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={createProfile.isPending}>
                {createProfile.isPending ? "Creating..." : "Create Profile"}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
