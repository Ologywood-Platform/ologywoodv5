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
import { ArrowLeft, Camera, Save, X, Plus, Loader2, Globe } from "lucide-react";
import { TipQRPreview } from "@/components/TipQRCode";
import { toast } from "sonner";
import SiteHeader from "@/components/SiteHeader";
import ImageCropper from "@/components/ImageCropper";
import PageBreadcrumb from '@/components/PageBreadcrumb';
import TouringSection from '@/components/TouringSection';

const GENRE_OPTIONS = [
  "Afrobeats", "Alternative", "Ambient", "Blues", "Classical", "Country",
  "Dancehall", "Electronic", "Experimental", "Folk", "Funk", "Gospel",
  "Hip-Hop", "House", "Indie", "Jazz", "Latin", "Lo-fi", "Metal", "Pop",
  "Punk", "R&B", "Reggae", "Rock", "Soul", "Techno", "Trap", "World", "Other"
];

export default function ArtistEditProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

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
  const [appleMusic, setAppleMusic] = useState("");
  const [tidal, setTidal] = useState("");
  const [soundcloud, setSoundcloud] = useState("");
  const [otherStreaming, setOtherStreaming] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [customGenre, setCustomGenre] = useState("");
  // Tip links state
  const [cashapp, setCashapp] = useState("");
  const [venmo, setVenmo] = useState("");
  const [paypal, setPaypal] = useState("");
  const [zelle, setZelle] = useState("");
  // CRM badge state
  const [crmSupporter, setCrmSupporter] = useState(false);

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
      setWebsiteUrl(profile.websiteUrl || "");
      const social = profile.socialLinks as any;
      if (social) {
        setInstagram(social.instagram || "");
        setFacebook(social.facebook || "");
        setYoutube(social.youtube || "");
        setSpotify(social.spotify || "");
        setTwitter(social.twitter || "");
        setAppleMusic(social.appleMusic || "");
        setTidal(social.tidal || "");
        setSoundcloud(social.soundcloud || "");
        setOtherStreaming(social.otherStreaming || "");
      }
      const tips = profile.tipLinks as any;
      if (tips) {
        setCashapp(tips.cashapp || "");
        setVenmo(tips.venmo || "");
        setPaypal(tips.paypal || "");
        setZelle(tips.zelle || "");
      }
      setCrmSupporter(!!(profile as any).crmSupporter);
    }
  }, [profile]);

  // Redirect if not an artist
  useEffect(() => {
    if (user && user.role !== "artist") {
      if (!user.role || user.role === 'user') {
        window.location.href = '/get-started';
      } else {
        toast.error("Only artists can edit their profile");
        navigate("/");
      }
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    setShowCropper(false);
    setCropperImage(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadPhoto.mutate({
        fileData: base64,
        fileName: 'profile-photo.jpg',
        mimeType: 'image/jpeg',
      });
    };
    reader.readAsDataURL(croppedBlob);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setCropperImage(null);
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
      websiteUrl: websiteUrl.trim() || null,
      socialLinks: {
        instagram: instagram.trim() || undefined,
        facebook: facebook.trim() || undefined,
        youtube: youtube.trim() || undefined,
        spotify: spotify.trim() || undefined,
        twitter: twitter.trim() || undefined,
        appleMusic: appleMusic.trim() || undefined,
        tidal: tidal.trim() || undefined,
        soundcloud: soundcloud.trim() || undefined,
        otherStreaming: otherStreaming.trim() || undefined,
      },
      tipLinks: {
        cashapp: cashapp.trim() || undefined,
        venmo: venmo.trim() || undefined,
        paypal: paypal.trim() || undefined,
        zelle: zelle.trim() || undefined,
      },
      profilePhotoUrl: profilePhotoUrl || undefined,
      crmSupporter,
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
                  onClick={() => !uploadPhoto.isPending && fileInputRef.current?.click()}
                >
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Profile"
                      className={`w-full h-full object-cover transition-opacity ${uploadPhoto.isPending ? 'opacity-40' : ''}`}
                    />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  )}
                  {!uploadPhoto.isPending && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  )}
                  {uploadPhoto.isPending && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                      <span className="text-[10px] text-white font-medium">Uploading</span>
                    </div>
                  )}
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadPhoto.isPending}
                    className="gap-2"
                  >
                    {uploadPhoto.isPending ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</>
                    ) : (
                      profilePhotoUrl ? "Change Photo" : "Upload Photo"
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, or WebP. Max 5MB.</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoSelect}
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
                  autoCapitalize="words"
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
                  autoCapitalize="sentences"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {bio.length}/1000 characters — Keep it short and engaging. Venues scan this in seconds. Mention your style, experience, and what makes your show unique.
                </p>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State"
                  autoCapitalize="words"
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
              <p className="text-xs text-muted-foreground mb-3">
                This is what venues see when deciding whether to book you. Set a range that reflects your flexibility.
              </p>
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
              <CardDescription>Connect your website and social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="websiteUrl" className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Website
                </Label>
                <Input
                  id="websiteUrl"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://www.yourwebsite.com"
                />
              </div>
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

          {/* Streaming Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                Streaming Services
              </CardTitle>
              <CardDescription>Link your music streaming profiles so fans and venues can listen to your work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="spotify" className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                  Spotify
                </Label>
                <Input
                  id="spotify"
                  value={spotify}
                  onChange={(e) => setSpotify(e.target.value)}
                  placeholder="https://open.spotify.com/artist/..."
                />
              </div>
              <div>
                <Label htmlFor="appleMusic" className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#FA243C"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.802.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03c.525 0 1.048-.034 1.57-.1.823-.106 1.597-.35 2.296-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.862.358-1.31.083-.59.105-1.18.108-1.772.003-3.413.002-6.828.002-10.242zM17.7 18.09c0 .36-.072.71-.21 1.04-.27.64-.71 1.09-1.34 1.35-.39.16-.8.24-1.22.27-.65.04-1.3.01-1.9-.27-.78-.37-1.18-1.03-1.18-1.89V11.5c0-.12.01-.24.04-.36.09-.38.3-.67.66-.84.23-.11.49-.15.74-.17.37-.02.73 0 1.08.11.56.17.91.52 1.04 1.09.04.17.06.35.06.53v6.23zm-.07-9.93c-.03.42-.17.81-.43 1.15-.38.5-.89.78-1.51.87-.25.04-.5.04-.75.02-.55-.05-1.03-.26-1.41-.66-.3-.31-.47-.69-.53-1.12-.04-.25-.04-.5-.02-.76.05-.56.26-1.04.67-1.42.34-.32.75-.5 1.2-.56.25-.03.5-.03.75-.01.56.06 1.04.27 1.42.68.31.33.48.73.53 1.18.02.13.03.26.03.39v.24z"/></svg>
                  Apple Music
                </Label>
                <Input
                  id="appleMusic"
                  value={appleMusic}
                  onChange={(e) => setAppleMusic(e.target.value)}
                  placeholder="https://music.apple.com/artist/..."
                />
              </div>
              <div>
                <Label htmlFor="tidal" className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#000000"><path d="M12 0L8 4l4 4-4 4 4 4 4-4-4-4 4-4-4-4zm-8 4l4 4-4 4 4 4-4-4-4 4 4-4-4-4 4-4zm16 0l-4 4 4 4-4 4 4-4 4 4-4-4 4-4-4-4z"/></svg>
                  Tidal
                </Label>
                <Input
                  id="tidal"
                  value={tidal}
                  onChange={(e) => setTidal(e.target.value)}
                  placeholder="https://tidal.com/artist/..."
                />
              </div>
              <div>
                <Label htmlFor="soundcloud" className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#FF5500"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.05-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.172 1.282c.013.06.045.094.104.094.057 0 .09-.035.104-.094l.2-1.282-.2-1.332c-.014-.057-.047-.094-.104-.094m1.8-1.18c-.066 0-.108.046-.118.1l-.213 2.506.213 2.41c.01.057.052.1.118.1.063 0 .108-.043.116-.1l.24-2.41-.24-2.506c-.008-.054-.053-.1-.116-.1m.899-.395c-.073 0-.12.046-.127.1l-.195 2.9.195 2.56c.007.058.054.1.127.1.07 0 .12-.042.126-.1l.22-2.56-.22-2.9c-.006-.054-.056-.1-.126-.1m.9-.432c-.08 0-.127.046-.133.1l-.18 3.332.18 2.66c.006.06.053.1.133.1.076 0 .127-.04.131-.1l.202-2.66-.202-3.332c-.004-.054-.055-.1-.131-.1m.891-.567c-.084 0-.135.05-.14.11l-.16 3.899.16 2.727c.005.06.056.11.14.11.08 0 .135-.05.139-.11l.18-2.727-.18-3.899c-.004-.06-.059-.11-.14-.11m.9-.39c-.09 0-.14.05-.146.11l-.143 4.289.143 2.76c.006.06.056.11.146.11.087 0 .14-.05.145-.11l.16-2.76-.16-4.289c-.005-.06-.058-.11-.145-.11m.89-.238c-.1 0-.148.05-.153.11l-.128 4.527.128 2.78c.005.06.053.11.153.11.094 0 .148-.05.152-.11l.14-2.78-.14-4.527c-.004-.06-.058-.11-.152-.11m.904-.13c-.1 0-.155.054-.159.116l-.112 4.657.112 2.8c.004.06.059.116.159.116.096 0 .155-.056.158-.116l.125-2.8-.125-4.657c-.003-.062-.062-.116-.158-.116m.89.05c-.11 0-.163.054-.166.116l-.098 4.49.098 2.81c.003.06.056.116.166.116.104 0 .163-.056.165-.116l.11-2.81-.11-4.49c-.002-.062-.06-.116-.165-.116m.9.1c-.11 0-.168.058-.17.12l-.084 4.39.084 2.81c.002.06.06.12.17.12.107 0 .168-.06.17-.12l.093-2.81-.093-4.39c-.002-.062-.063-.12-.17-.12m5.1 1.677c-.475 0-.905.186-1.225.487a6.652 6.652 0 00-6.635-6.14c-.476 0-.943.054-1.394.154-.165.037-.22.075-.222.15v12.18c.002.077.06.14.14.153h9.336a2.46 2.46 0 002.46-2.46 2.46 2.46 0 00-2.46-2.46"/></svg>
                  SoundCloud
                </Label>
                <Input
                  id="soundcloud"
                  value={soundcloud}
                  onChange={(e) => setSoundcloud(e.target.value)}
                  placeholder="https://soundcloud.com/yourprofile"
                />
              </div>
              <div>
                <Label htmlFor="otherStreaming" className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Other Streaming Link
                </Label>
                <Input
                  id="otherStreaming"
                  value={otherStreaming}
                  onChange={(e) => setOtherStreaming(e.target.value)}
                  placeholder="https://bandcamp.com/... or any other streaming URL"
                />
              </div>
            </CardContent>
          </Card>

          {/* Support / Tip Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                Support This Artist
              </CardTitle>
              <CardDescription>Let fans tip you directly. Add your payment handles and they'll appear on your public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cashapp" className="flex items-center gap-1.5">
                  <span className="inline-block w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#00D54B' }} />
                  Cash App
                </Label>
                <Input
                  id="cashapp"
                  value={cashapp}
                  onChange={(e) => setCashapp(e.target.value)}
                  placeholder="$yourcashtag"
                />
              </div>
              <div>
                <Label htmlFor="venmo" className="flex items-center gap-1.5">
                  <span className="inline-block w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#3D95CE' }} />
                  Venmo
                </Label>
                <Input
                  id="venmo"
                  value={venmo}
                  onChange={(e) => setVenmo(e.target.value)}
                  placeholder="@yourvenmo"
                />
              </div>
              <div>
                <Label htmlFor="paypal" className="flex items-center gap-1.5">
                  <span className="inline-block w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#00457C' }} />
                  PayPal
                </Label>
                <Input
                  id="paypal"
                  value={paypal}
                  onChange={(e) => setPaypal(e.target.value)}
                  placeholder="paypal.me/yourname"
                />
              </div>
              <div>
                <Label htmlFor="zelle" className="flex items-center gap-1.5">
                  <span className="inline-block w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#6D1ED4' }} />
                  Zelle
                </Label>
                <Input
                  id="zelle"
                  value={zelle}
                  onChange={(e) => setZelle(e.target.value)}
                  placeholder="your@email.com or phone number"
                />
              </div>
              <p className="text-xs text-muted-foreground">Only filled fields will be shown on your profile. Fans can tip you directly — no platform fees.</p>
              <TipQRPreview tipLinks={{ cashapp, venmo, paypal, zelle }} />
            </CardContent>
          </Card>

          {/* Touring Availability */}
          <TouringSection />

          {/* Creators' Rights Movement Badge */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Creators' Rights Movement</CardTitle>
              <CardDescription>Show your support for creators' rights on your public profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <img
                  src="/manus-storage/crmbadge_optimized_2553962d.png"
                  alt="Creators' Rights Movement Badge"
                  className="w-16 h-16 object-contain"
                />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-3">
                    The Creators' Rights Movement is a grassroots organization committed to defending the full spectrum of creators' rights through decisive action. Display this badge on your profile to show solidarity.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={crmSupporter}
                      onChange={(e) => setCrmSupporter(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">I support the Creators' Rights Movement</span>
                  </label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Learn more at{' '}
                <a href="https://creatorsrightsmovement.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  creatorsrightsmovement.com
                </a>
              </p>
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
