import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, Save, X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SiteHeader from "@/components/SiteHeader";
import PageBreadcrumb from '@/components/PageBreadcrumb';

const GENRE_OPTIONS = [
  "Pop", "Rock", "Hip-Hop", "R&B", "Jazz", "Blues", "Country", "Electronic",
  "Classical", "Reggae", "Latin", "Folk", "Metal", "Punk", "Soul", "Funk",
  "Gospel", "Indie", "Alternative", "World", "Afrobeats", "Dancehall",
  "House", "Techno", "Trap", "Lo-fi", "Ambient", "Experimental", "Other"
];

export default function ArtistEditProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing profile
  const { data: profile, isLoading, refetch } = trpc.artist.getMyProfile.useQuery(undefined, {
    enabled: !!user,
  });

  // Mutations
  const updateProfile = trpc.artist.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update profile");
    },
  });

  const uploadPhoto = trpc.artist.uploadProfilePhoto.useMutation({
    onSuccess: (data) => {
      setProfilePhotoUrl(data.url);
      toast.success("Photo uploaded!");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to upload photo");
    },
  });

  // Form state
  const [artistName, setArtistName] = useState("");
  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [feeRangeMin, setFeeRangeMin] = useState("");
  const [feeRangeMax, setFeeRangeMax] = useState("");
  const [touringPartySize, setTouringPartySize] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [youtube, setYoutube] = useState("");
  const [spotify, setSpotify] = useState("");
  const [twitter, setTwitter] = useState("");
  const [customGenre, setCustomGenre] = useState("");

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setArtistName(profile.artistName || "");
      setBio(profile.bio || "");
      setGenres(Array.isArray(profile.genre) ? profile.genre : []);
      setLocation(profile.location || "");
      setFeeRangeMin(profile.feeRangeMin?.toString() || "");
      setFeeRangeMax(profile.feeRangeMax?.toString() || "");
      setTouringPartySize(profile.touringPartySize?.toString() || "1");
      setProfilePhotoUrl(profile.profilePhotoUrl || "");
      const social = profile.socialLinks as any;
      if (social) {
        setInstagram(social.instagram || "");
        setFacebook(social.facebook || "");
        setYoutube(social.youtube || "");
        setSpotify(social.spotify || "");
        setTwitter(social.twitter || "");
      }
    }
  }, [profile]);

  // Redirect if not an artist
  useEffect(() => {
    if (user && user.role !== "artist") {
      toast.error("Only artists can edit their profile");
      navigate("/dashboard");
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to edit your profile.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-8 max-w-3xl text-center">
          <p className="text-muted-foreground mb-4">No artist profile found.</p>
          <Button onClick={() => navigate("/onboarding/artist")}>Create Profile</Button>
        </div>
      </div>
    );
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadPhoto.mutate({
        fileData: base64,
        fileName: file.name,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

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

  const handleSave = () => {
    if (!artistName.trim()) {
      toast.error("Artist name is required");
      return;
    }

    updateProfile.mutate({
      artistName: artistName.trim(),
      bio: bio.trim() || undefined,
      genre: genres.length > 0 ? genres : undefined,
      location: location.trim() || undefined,
      feeRangeMin: feeRangeMin ? parseInt(feeRangeMin) : undefined,
      feeRangeMax: feeRangeMax ? parseInt(feeRangeMax) : undefined,
      touringPartySize: touringPartySize ? parseInt(touringPartySize) : undefined,
      socialLinks: {
        instagram: instagram.trim() || undefined,
        facebook: facebook.trim() || undefined,
        youtube: youtube.trim() || undefined,
        spotify: spotify.trim() || undefined,
        twitter: twitter.trim() || undefined,
      },
      profilePhotoUrl: profilePhotoUrl || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <PageBreadcrumb
          className="mb-4"
          segments={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Edit Profile' },
          ]}
        />
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Profile</h1>
              <p className="text-sm text-muted-foreground">Update your artist information</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="gap-2"
          >
            {updateProfile.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="space-y-6">
          {/* Profile Photo */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>Upload a photo that represents you or your act</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div
                  className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex items-center justify-center cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  {uploadPhoto.isPending && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadPhoto.isPending}
                  >
                    {uploadPhoto.isPending ? "Uploading..." : "Change Photo"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, or WebP. Max 5MB.</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your public artist details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="artistName">Artist / Band Name *</Label>
                <Input
                  id="artistName"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Your stage name"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell venues and fans about yourself..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">{bio.length}/1000 characters</p>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State"
                />
              </div>
            </CardContent>
          </Card>

          {/* Genres */}
          <Card>
            <CardHeader>
              <CardTitle>Genres</CardTitle>
              <CardDescription>Select the genres that best describe your music</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
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
              <div className="flex gap-2">
                <Input
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                  placeholder="Add custom genre..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomGenre())}
                />
                <Button variant="outline" size="icon" onClick={addCustomGenre} disabled={!customGenre.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {genres.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">Selected: {genres.join(", ")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing & Touring */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Touring</CardTitle>
              <CardDescription>Set your fee range and touring party size</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="feeMin">Minimum Fee ($)</Label>
                  <Input
                    id="feeMin"
                    type="number"
                    value={feeRangeMin}
                    onChange={(e) => setFeeRangeMin(e.target.value)}
                    placeholder="500"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="feeMax">Maximum Fee ($)</Label>
                  <Input
                    id="feeMax"
                    type="number"
                    value={feeRangeMax}
                    onChange={(e) => setFeeRangeMax(e.target.value)}
                    placeholder="5000"
                    min="0"
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
                  placeholder="1"
                  min="1"
                />
                <p className="text-xs text-muted-foreground mt-1">Total number of people in your touring group</p>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Connect your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div>
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>
              <div>
                <Label htmlFor="spotify">Spotify</Label>
                <Input
                  id="spotify"
                  value={spotify}
                  onChange={(e) => setSpotify(e.target.value)}
                  placeholder="https://open.spotify.com/artist/..."
                />
              </div>
              <div>
                <Label htmlFor="twitter">Twitter / X</Label>
                <Input
                  id="twitter"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pb-8">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/artist/${profile.id}`)}
              >
                View Public Profile
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="gap-2"
              >
                {updateProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
