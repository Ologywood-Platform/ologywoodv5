import { useState, useEffect } from "react";
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
import { Music, ArrowRight, ArrowLeft, Check, Loader2, X, Mic2, Trophy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SkeletonOnboarding } from "@/components/SkeletonLoaders";
import ImageCropper from "@/components/ImageCropper";

export default function ArtistOnboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Block unverified users from creating a profile
  useEffect(() => {
    if (user && !user.emailVerified) {
      toast.error("Please verify your email before setting up your profile.");
      navigate(`/verify-email?email=${encodeURIComponent(user.email || '')}`);
    }
  }, [user, navigate]);

  // Check if user already has an artist profile — redirect to dashboard if so
  const existingProfile = trpc.artist.getMyProfile.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (existingProfile.data) {
      toast.info("You already have an artist profile. Redirecting to edit page.");
      navigate("/profile/edit");
    }
  }, [existingProfile.data, navigate]);

  // Talent type selection
  const [talentType, setTalentType] = useState<'artist' | 'athlete' | 'creator'>('artist');

  // Step 1: Basic Info
  const [artistName, setArtistName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // Step 2: Genre & Performance Details
  const [genres, setGenres] = useState<string[]>([]);
  const [customGenre, setCustomGenre] = useState("");
  const [feeRangeMin, setFeeRangeMin] = useState("");
  const [feeRangeMax, setFeeRangeMax] = useState("");
  const [touringPartySize, setTouringPartySize] = useState("1");

  const GENRE_OPTIONS = [
    "Afrobeats", "Alternative", "Ambient", "Blues", "Classical", "Country",
    "Dancehall", "Electronic", "Experimental", "Folk", "Funk", "Gospel",
    "Hip-Hop", "House", "Indie", "Jazz", "Latin", "Lo-fi", "Metal", "Pop",
    "Punk", "R&B", "Reggae", "Rock", "Soul", "Techno", "Trap", "World", "Other"
  ];

  const toggleGenre = (genre: string) => {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const addCustomGenre = () => {
    const trimmed = customGenre.trim();
    if (trimmed && !genres.includes(trimmed)) {
      setGenres((prev) => [...prev, trimmed]);
      setCustomGenre("");
    }
  };

  // Step 3: Social Links
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [youtube, setYoutube] = useState("");
  const [spotify, setSpotify] = useState("");
  const [appleMusic, setAppleMusic] = useState("");
  const [tidal, setTidal] = useState("");
  const [soundcloud, setSoundcloud] = useState("");
  const [otherStreaming, setOtherStreaming] = useState("");

  const uploadPhoto = trpc.artist.uploadProfilePhoto.useMutation({
    onSuccess: (data) => {
      setProfilePhotoUrl(data.url);
      toast.success("Photo uploaded successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload photo");
    },
  });

  const createProfile = trpc.artist.createProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile created successfully!");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create profile");
    },
  });



  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      
      // Open cropper instead of setting directly
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
      // Reset input so same file can be re-selected
      e.target.value = '';
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    setShowCropper(false);
    setCropperImage(null);
    // Create a File from the cropped blob
    const croppedFile = new File([croppedBlob], 'profile-photo.jpg', { type: 'image/jpeg' });
    setProfilePhoto(croppedFile);
    // Create preview from cropped image
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedBlob);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setCropperImage(null);
  };

  const handleUploadPhoto = async (): Promise<string | null> => {
    if (!profilePhoto) return null;
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const result = await uploadPhoto.mutateAsync({
            fileData: reader.result as string,
            fileName: profilePhoto.name,
            mimeType: profilePhoto.type,
          });
          resolve(result.url);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(profilePhoto);
    });
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!artistName.trim()) {
        toast.error("Please enter your artist name");
        return;
      }
      if (!location.trim()) {
        toast.error("Please enter your location — this helps venues find local talent");
        return;
      }
    }
    if (currentStep === 2) {
      if (genres.length === 0) {
        toast.error("Please select at least one genre");
        return;
      }
      const partySize = parseInt(touringPartySize);
      if (!touringPartySize || isNaN(partySize) || partySize < 1) {
        toast.error("Touring party size must be at least 1 (including yourself)");
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

  // Validate URL format (optional fields - only validate if user entered something)
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true; // empty is OK for optional fields
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!artistName.trim()) {
      toast.error("Artist name is required");
      return;
    }
    if (!location.trim()) {
      toast.error("Location is required");
      return;
    }
    if (genres.length === 0) {
      toast.error("Please select at least one genre");
      return;
    }

    // Validate URL fields
    const urlFields = [
      { value: websiteUrl, label: 'Website' },
      { value: instagram, label: 'Instagram' },
      { value: facebook, label: 'Facebook' },
      { value: youtube, label: 'YouTube' },
      { value: spotify, label: 'Spotify' },
      { value: appleMusic, label: 'Apple Music' },
      { value: tidal, label: 'Tidal' },
      { value: soundcloud, label: 'SoundCloud' },
      { value: otherStreaming, label: 'Other Streaming' },
    ];
    for (const field of urlFields) {
      if (field.value && !isValidUrl(field.value)) {
        toast.error(`${field.label} URL is not valid. Please enter a full URL (e.g., https://example.com)`);
        return;
      }
    }

    // Upload photo first if one is selected but not yet uploaded
    let photoUrl = profilePhotoUrl;
    if (profilePhoto && !profilePhotoUrl) {
      try {
        photoUrl = await handleUploadPhoto();
      } catch {
        toast.error("Photo upload failed. You can add it later from Edit Profile.");
      }
    }

    createProfile.mutate({
      artistName,
      talentType,
      location: location || undefined,
      bio: bio || undefined,
      genre: genres.length > 0 ? genres : undefined,
      feeRangeMin: feeRangeMin ? parseInt(feeRangeMin) : undefined,
      feeRangeMax: feeRangeMax ? parseInt(feeRangeMax) : undefined,
      touringPartySize: parseInt(touringPartySize),
      websiteUrl: websiteUrl || undefined,
      profilePhotoUrl: photoUrl || undefined,
      socialLinks: {
        instagram: instagram || undefined,
        facebook: facebook || undefined,
        youtube: youtube || undefined,
        spotify: spotify || undefined,
        appleMusic: appleMusic || undefined,
        tidal: tidal || undefined,
        soundcloud: soundcloud || undefined,
        otherStreaming: otherStreaming || undefined,
      },
    });
  };

  const progress = (currentStep / totalSteps) * 100;

  const isSubmitting = uploadPhoto.isPending || createProfile.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img src="/logo-sm.png" alt="Ologywood" className="h-8 w-8 rounded" />
              <div>
                <CardTitle>Create Your Profile</CardTitle>
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
                  Let's start with the basics. Tell us about yourself.
                </p>
              </div>

              {/* Talent Type Selector */}
              <div>
                <Label className="mb-2 block">I am a... *</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTalentType('artist')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      talentType === 'artist'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <Mic2 className={`h-6 w-6 ${talentType === 'artist' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${talentType === 'artist' ? 'text-primary' : 'text-muted-foreground'}`}>Artist</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTalentType('athlete')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      talentType === 'athlete'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <Trophy className={`h-6 w-6 ${talentType === 'athlete' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${talentType === 'athlete' ? 'text-primary' : 'text-muted-foreground'}`}>Athlete</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTalentType('creator')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      talentType === 'creator'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <Sparkles className={`h-6 w-6 ${talentType === 'creator' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${talentType === 'creator' ? 'text-primary' : 'text-muted-foreground'}`}>Creator</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {talentType === 'artist' && 'Musicians, DJs, bands, comedians, actors, and entertainers'}
                  {talentType === 'athlete' && 'Professional and college athletes building their brand and fan community'}
                  {talentType === 'creator' && 'Content creators, influencers, coaches, and public speakers'}
                </p>
              </div>

              <div>
                <Label htmlFor="artistName">{talentType === 'artist' ? 'Artist / Stage Name' : talentType === 'athlete' ? 'Name / Brand Name' : 'Creator Name'} *</Label>
                <Input
                  id="artistName"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder={talentType === 'artist' ? 'Your stage name or band name' : talentType === 'athlete' ? 'Your name or brand name' : 'Your creator name'}
                  autoCapitalize="words"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State or Region"
                  autoCapitalize="words"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Helps venues find local talent in their area
                </p>
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

              <div>
                <Label htmlFor="photo">Profile Photo</Label>
                <div className="mt-2 flex items-center gap-4">
                  {profilePhotoPreview ? (
                    <div className="relative">
                      <img 
                        src={profilePhotoPreview} 
                        alt="Profile preview" 
                        className={`h-24 w-24 rounded-full object-cover border-2 border-primary transition-opacity ${uploadPhoto.isPending ? 'opacity-40' : ''}`}
                      />
                      {uploadPhoto.isPending && (
                        <div className="absolute inset-0 h-24 w-24 rounded-full bg-black/50 flex flex-col items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                          <span className="text-[10px] text-white font-medium mt-1">Uploading</span>
                        </div>
                      )}
                      {profilePhotoUrl && !uploadPhoto.isPending && (
                        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                      <Music className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Max 5MB. JPG, PNG, or GIF.
                    </p>
                    {profilePhoto && !profilePhotoUrl && (
                      <Button 
                        type="button"
                        size="sm" 
                        onClick={handleUploadPhoto}
                        disabled={uploadPhoto.isPending}
                        className="mt-2 gap-2"
                      >
                        {uploadPhoto.isPending ? (
                          <><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</>
                        ) : (
                          "Upload Photo"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
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
                <Label>Genres * <span className="text-xs text-muted-foreground font-normal">(select all that apply)</span></Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {GENRE_OPTIONS.map((genre) => (
                    <Badge
                      key={genre}
                      variant={genres.includes(genre) ? "default" : "outline"}
                      className="cursor-pointer select-none"
                      onClick={() => toggleGenre(genre)}
                    >
                      {genre}
                      {genres.includes(genre) && <X className="h-3 w-3 ml-1" />}
                    </Badge>
                  ))}
                </div>
                {/* Custom genre */}
                <div className="flex gap-2 mt-3">
                  <Input
                    value={customGenre}
                    onChange={(e) => setCustomGenre(e.target.value)}
                    placeholder="Add custom genre..."
                    autoCapitalize="words"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomGenre())}
                  />
                  <Button type="button" variant="outline" onClick={addCustomGenre} disabled={!customGenre.trim()}>
                    Add
                  </Button>
                </div>
                {genres.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">Selected: {genres.join(", ")}</p>
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
                    placeholder="Min ($)"
                    className="mt-1"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="feeMax">Fee Range Max ($)</Label>
                  <Input
                    id="feeMax"
                    type="number"
                    value={feeRangeMax}
                    onChange={(e) => setFeeRangeMax(e.target.value)}
                    placeholder="Max ($)"
                    className="mt-1"
                    min="0"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">Venues see this when deciding whether to book you. A wider range shows flexibility for different event sizes.</p>

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
                  How many people travel with you (including yourself). Venues use this for hospitality planning (green room, meals, parking).
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

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Streaming Services</h4>
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

              <div>
                <Label htmlFor="appleMusic">Apple Music</Label>
                <Input
                  id="appleMusic"
                  type="url"
                  value={appleMusic}
                  onChange={(e) => setAppleMusic(e.target.value)}
                  placeholder="https://music.apple.com/artist/..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="tidal">Tidal</Label>
                <Input
                  id="tidal"
                  type="url"
                  value={tidal}
                  onChange={(e) => setTidal(e.target.value)}
                  placeholder="https://tidal.com/artist/..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="soundcloud">SoundCloud</Label>
                <Input
                  id="soundcloud"
                  type="url"
                  value={soundcloud}
                  onChange={(e) => setSoundcloud(e.target.value)}
                  placeholder="https://soundcloud.com/yourprofile"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="otherStreaming">Other Streaming Link</Label>
                <Input
                  id="otherStreaming"
                  type="url"
                  value={otherStreaming}
                  onChange={(e) => setOtherStreaming(e.target.value)}
                  placeholder="https://bandcamp.com/... or any other streaming URL"
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
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {uploadPhoto.isPending ? 'Uploading Photo...' : 'Creating Profile...'}</>
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
      {/* Image Cropper Modal */}
      {showCropper && cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          cropShape="round"
        />
      )}
    </div>
  );
}
