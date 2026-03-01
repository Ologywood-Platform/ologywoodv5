import React, { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle2, Circle, Upload, Music, MapPin, DollarSign, Link2, Disc3 } from 'lucide-react';
import { trpc } from '../lib/trpc';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  completed: boolean;
}

export function ArtistProfileSetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    profilePhoto: null as File | null,
    genres: [] as string[],
    bio: '',
    location: '',
    feeMin: '',
    feeMax: '',
    websiteUrl: '',
    socialLinks: {
      instagram: '',
      facebook: '',
      youtube: '',
      spotify: '',
      twitter: ''
    }
  });

  const artistProfileQuery = trpc.artist.getMyProfile.useQuery();
  const updateProfileMutation = trpc.artist.updateProfile.useMutation();
  const uploadPhotoMutation = trpc.artist.uploadProfilePhoto.useMutation();

  const steps: SetupStep[] = [
    {
      id: 'photo',
      title: 'Add Profile Photo',
      description: 'Upload a professional photo that represents you as an artist',
      icon: <Upload className="w-5 h-5" />,
      required: true,
      completed: !!artistProfileQuery.data?.profilePhotoUrl
    },
    {
      id: 'genres',
      title: 'Select Your Genres',
      description: 'Choose the music genres you perform',
      icon: <Music className="w-5 h-5" />,
      required: true,
      completed: !!artistProfileQuery.data?.genre && artistProfileQuery.data.genre.length > 0
    },
    {
      id: 'location',
      title: 'Set Your Location',
      description: 'Where are you based? This helps venues find you',
      icon: <MapPin className="w-5 h-5" />,
      required: true,
      completed: !!artistProfileQuery.data?.location
    },
    {
      id: 'pricing',
      title: 'Set Your Pricing',
      description: 'Define your performance fee range',
      icon: <DollarSign className="w-5 h-5" />,
      required: true,
      completed: !!artistProfileQuery.data?.feeRangeMin && !!artistProfileQuery.data?.feeRangeMax
    },
    {
      id: 'links',
      title: 'Add Social Links',
      description: 'Connect your social media and website (optional)',
      icon: <Link2 className="w-5 h-5" />,
      required: false,
      completed: false
    },
    {
      id: 'releases',
      title: 'Sell Your Music',
      description: 'Learn how to sell singles directly from your profile (optional)',
      icon: <Disc3 className="w-5 h-5" />,
      required: false,
      completed: false
    }
  ];

  // Check if wizard should be visible (only show for new artists)
  useEffect(() => {
    if (artistProfileQuery.data) {
      const completedSteps = steps.filter(s => s.completed).length;
      const requiredSteps = steps.filter(s => s.required).length;
      setIsVisible(completedSteps < requiredSteps);
    }
  }, [artistProfileQuery.data]);

  const handlePhotoUpload = async (file: File) => {
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target?.result as string;
        const result = await uploadPhotoMutation.mutateAsync({ 
          fileData,
          fileName: file.name,
          mimeType: file.type
        });
        setFormData(prev => ({ ...prev, profilePhoto: file }));
        await updateProfileMutation.mutateAsync({
          profilePhotoUrl: result.url
        });
        handleNextStep();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload photo:', error);
    }
  };

  const handleGenreSelect = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleNextStep = async () => {
    // Save current step data
    if (currentStep === 1) { // Genres step
      await updateProfileMutation.mutateAsync({
        genre: formData.genres
      });
    } else if (currentStep === 2) { // Location step
      await updateProfileMutation.mutateAsync({
        location: formData.location
      });
    } else if (currentStep === 3) { // Pricing step
      await updateProfileMutation.mutateAsync({
        feeRangeMin: parseInt(formData.feeMin),
        feeRangeMax: parseInt(formData.feeMax)
      });
    } else if (currentStep === 4) { // Social links step
      await updateProfileMutation.mutateAsync({
        socialLinks: formData.socialLinks
      });
    } else if (currentStep === 5) { // White Label Releases info step — no save needed
      // Informational step, nothing to persist
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsVisible(false); // Close wizard when complete
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsVisible(false);
    }
  };

  if (!isVisible || artistProfileQuery.isLoading) return null;

  const step = steps[currentStep];
  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-6 text-white rounded-t-lg">
          <h2 className="text-2xl font-bold mb-2">Complete Your Artist Profile</h2>
          <p className="text-purple-100">Let's get you set up to start receiving bookings</p>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-gray-700">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-6 border-b bg-gray-50">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setCurrentStep(idx)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                    s.completed
                      ? 'bg-green-500 text-white'
                      : idx === currentStep
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {s.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold">{idx + 1}</span>
                  )}
                </button>
                {idx < steps.length - 1 && (
                  <div className={`w-8 h-0.5 ${s.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="px-6 py-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              {step.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
              <p className="text-gray-600 mt-1">{step.description}</p>
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 0 && (
            <PhotoUploadStep onUpload={handlePhotoUpload} isLoading={uploadPhotoMutation.isPending} />
          )}
          {currentStep === 1 && (
            <GenreSelectionStep
              selectedGenres={formData.genres}
              onGenreSelect={handleGenreSelect}
            />
          )}
          {currentStep === 2 && (
            <LocationStep
              location={formData.location}
              onChange={(location) => setFormData(prev => ({ ...prev, location }))}
            />
          )}
          {currentStep === 3 && (
            <PricingStep
              feeMin={formData.feeMin}
              feeMax={formData.feeMax}
              onFeeMinChange={(feeMin) => setFormData(prev => ({ ...prev, feeMin }))}
              onFeeMaxChange={(feeMax) => setFormData(prev => ({ ...prev, feeMax }))}
            />
          )}
          {currentStep === 4 && (
            <SocialLinksStep
              websiteUrl={formData.websiteUrl}
              socialLinks={formData.socialLinks}
              onWebsiteChange={(websiteUrl) => setFormData(prev => ({ ...prev, websiteUrl }))}
              onSocialChange={(platform, value) =>
                setFormData(prev => ({
                  ...prev,
                  socialLinks: { ...prev.socialLinks, [platform]: value }
                }))
              }
            />
          )}
          {currentStep === 5 && (
            <WhiteLabelReleasesStep />
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 rounded-lg transition-colors"
          >
            Back
          </button>

          <div className="flex gap-3">
            {!step.required && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNextStep}
              disabled={updateProfileMutation.isPending}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
function PhotoUploadStep({ onUpload, isLoading }: { onUpload: (file: File) => void; isLoading: boolean }) {
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onUpload(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive ? 'border-purple-600 bg-purple-50' : 'border-gray-300 bg-gray-50'
      }`}
    >
      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-900 font-medium mb-2">Drag and drop your photo here</p>
      <p className="text-gray-600 text-sm mb-4">or</p>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Uploading...' : 'Choose File'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <p className="text-gray-500 text-xs mt-4">PNG, JPG up to 5MB</p>
    </div>
  );
}

function GenreSelectionStep({
  selectedGenres,
  onGenreSelect
}: {
  selectedGenres: string[];
  onGenreSelect: (genre: string) => void;
}) {
  const genres = [
    'Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Blues', 'Country',
    'Electronic', 'Soul', 'Reggae', 'Latin', 'Classical', 'Folk',
    'R&B', 'Indie', 'Alternative'
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {genres.map(genre => (
        <button
          key={genre}
          onClick={() => onGenreSelect(genre)}
          className={`p-3 rounded-lg border-2 transition-all font-medium ${
            selectedGenres.includes(genre)
              ? 'border-purple-600 bg-purple-50 text-purple-600'
              : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}

function LocationStep({
  location,
  onChange
}: {
  location: string;
  onChange: (location: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        City, State/Country
      </label>
      <input
        type="text"
        value={location}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Los Angeles, CA"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
      />
      <p className="text-gray-600 text-sm mt-2">
        This helps venues find you and understand your touring radius
      </p>
    </div>
  );
}

function PricingStep({
  feeMin,
  feeMax,
  onFeeMinChange,
  onFeeMaxChange
}: {
  feeMin: string;
  feeMax: string;
  onFeeMinChange: (value: string) => void;
  onFeeMaxChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Fee ($)
        </label>
        <input
          type="number"
          value={feeMin}
          onChange={(e) => onFeeMinChange(e.target.value)}
          placeholder="500"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maximum Fee ($)
        </label>
        <input
          type="number"
          value={feeMax}
          onChange={(e) => onFeeMaxChange(e.target.value)}
          placeholder="5000"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
        />
      </div>
      <p className="text-gray-600 text-sm">
        Set your performance fee range. Venues will see this when browsing your profile.
      </p>
    </div>
  );
}

function SocialLinksStep({
  websiteUrl,
  socialLinks,
  onWebsiteChange,
  onSocialChange
}: {
  websiteUrl: string;
  socialLinks: Record<string, string>;
  onWebsiteChange: (value: string) => void;
  onSocialChange: (platform: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Website URL
        </label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => onWebsiteChange(e.target.value)}
          placeholder="https://yourwebsite.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(socialLinks).map(([platform, value]) => (
          <div key={platform}>
            <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
              {platform}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => onSocialChange(platform, e.target.value)}
              placeholder={`@yourprofile`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
            />
          </div>
        ))}
      </div>

      <p className="text-gray-600 text-sm">
        Add your social media handles so venues can learn more about you
      </p>
    </div>
  );
}

function WhiteLabelReleasesStep() {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-5">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Disc3 className="w-5 h-5 text-purple-600" />
          Sell Singles From Your Profile
        </h4>
        <p className="text-gray-700 text-sm leading-relaxed">
          With <strong>White Label Releases</strong>, you can upload and sell singles directly from your Ologywood artist profile. Fans can preview 30 seconds, purchase, and download instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-400 mb-1">Free</div>
          <p className="text-xs text-gray-500">Not available</p>
        </div>
        <div className="border-2 border-purple-600 rounded-lg p-4 text-center bg-purple-50">
          <div className="text-2xl font-bold text-purple-600 mb-1">Starter</div>
          <p className="text-xs text-gray-700">Up to <strong>2 singles</strong></p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">Pro</div>
          <p className="text-xs text-gray-700"><strong>Unlimited</strong> + pay-what-you-want</p>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800">Only 1% platform fee</p>
          <p className="text-xs text-green-700 mt-0.5">
            You keep 99% of every sale. No hidden costs, no monthly fees on top of your subscription.
          </p>
        </div>
      </div>

      <p className="text-gray-500 text-xs text-center">
        You can set up your first release anytime from the <strong>Release Manager</strong> in your dashboard.
      </p>
    </div>
  );
}
