import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Music, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

export default function ArtistOnboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Step 1: Basic Info
  const [artistName, setArtistName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");

  // Step 2: Genre & Performance Details
  const [genreInput, setGenreInput] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [feeRangeMin, setFeeRangeMin] = useState("");
  const [feeRangeMax, setFeeRangeMax] = useState("");
  const [touringPartySize, setTouringPartySize] = useState("1");

  // Step 3: Social Links
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [youtube, setYoutube] = useState("");
  const [spotify, setSpotify] = useState("");

  const createProfile = trpc.artist.createProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile created successfully!");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create profile");
    },
  });

  const handleAddGenre = () => {
    if (genreInput.trim() && !genres.includes(genreInput.trim())) {
      setGenres([...genres, genreInput.trim()]);
      setGenreInput("");
    }
  };

  const handleRemoveGenre = (genre: string) => {
    setGenres(genres.filter(g => g !== genre));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!artistName.trim()) {
        toast.error("Please enter your artist name");
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

  const handleSubmit = () => {
    if (!artistName.trim()) {
      toast.error("Artist name is required");
      return;
    }

    createProfile.mutate({
      artistName,
      location: location || undefined,
      bio: bio || undefined,
      genre: genres.length > 0 ? genres : undefined,
      feeRangeMin: feeRangeMin ? parseInt(feeRangeMin) : undefined,
      feeRangeMax: feeRangeMax ? parseInt(feeRangeMax) : undefined,
      touringPartySize: parseInt(touringPartySize),
      websiteUrl: websiteUrl || undefined,
      socialLinks: {
        instagram: instagram || undefined,
        facebook: facebook || undefined,
        youtube: youtube || undefined,
        spotify: spotify || undefined,
      },
    });
  };

  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Music className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Create Your Artist Profile</CardTitle>
                <CardDescription>Step {currentStep} of {totalSteps}</CardDescription>
              </div>
            </div>
            <Badge variant="secondary">{user?.name}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Let's start with the basics. Tell us about yourself as an artist.
                </p>
              </div>

              <div>
                <Label htmlFor="artistName">Artist Name *</Label>
                <Input
                  id="artistName"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Your stage name or band name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State or Region"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell venues about your music, experience, and what makes you unique..."
                  rows={5}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be displayed on your public profile
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Genre & Performance Details */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold mb-4">Performance Details</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Help venues understand your style and requirements.
                </p>
              </div>

              <div>
                <Label htmlFor="genre">Genres</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="genre"
                    value={genreInput}
                    onChange={(e) => setGenreInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGenre())}
                    placeholder="e.g., Jazz, Rock, Hip-Hop"
                  />
                  <Button type="button" onClick={handleAddGenre} variant="outline">
                    Add
                  </Button>
                </div>
                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {genres.map((genre) => (
                      <Badge key={genre} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveGenre(genre)}>
                        {genre} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="feeMin">Fee Range Min ($)</Label>
                  <Input
                    id="feeMin"
                    type="number"
                    value={feeRangeMin}
                    onChange={(e) => setFeeRangeMin(e.target.value)}
                    placeholder="500"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="feeMax">Fee Range Max ($)</Label>
                  <Input
                    id="feeMax"
                    type="number"
                    value={feeRangeMax}
                    onChange={(e) => setFeeRangeMax(e.target.value)}
                    placeholder="2000"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="partySize">Touring Party Size</Label>
                <Input
                  id="partySize"
                  type="number"
                  value={touringPartySize}
                  onChange={(e) => setTouringPartySize(e.target.value)}
                  min="1"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How many people travel with you (including yourself)
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Social Links */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold mb-4">Connect Your Socials</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Add your social media and music platform links so venues can learn more about you.
                </p>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/yourusername"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  type="url"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="spotify">Spotify</Label>
                <Input
                  id="spotify"
                  type="url"
                  value={spotify}
                  onChange={(e) => setSpotify(e.target.value)}
                  placeholder="https://open.spotify.com/artist/..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
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
