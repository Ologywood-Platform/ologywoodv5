import React, { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface ArtistProfileEditorProps {
  onSave?: () => void;
}

export function ArtistProfileEditor({ onSave }: ArtistProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: profile } = trpc.artist.getMyProfile.useQuery();

  const [formData, setFormData] = useState({
    artistName: '',
    bio: '',
    genre: [] as string[],
    location: '',
    feeRangeMin: 0,
    feeRangeMax: 0,
    touringPartySize: 1,
    socialLinks: {
      instagram: '',
      facebook: '',
      youtube: '',
      spotify: '',
      twitter: '',
    },
  });

  const [genreInput, setGenreInput] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        artistName: profile.artistName || '',
        bio: profile.bio || '',
        genre: profile.genre || [],
        location: profile.location || '',
        feeRangeMin: profile.feeRangeMin || 0,
        feeRangeMax: profile.feeRangeMax || 0,
        touringPartySize: profile.touringPartySize || 1,
        socialLinks: (profile.socialLinks as any) || {
          instagram: '',
          facebook: '',
          youtube: '',
          spotify: '',
          twitter: '',
        },
      });
    }
  }, [profile]);

  const updateMutation = trpc.artist.updateProfile.useMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('feeRange') || name === 'touringPartySize' ? Number(value) : value,
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const handleAddGenre = () => {
    if (genreInput.trim() && !formData.genre.includes(genreInput.trim())) {
      setFormData(prev => ({
        ...prev,
        genre: [...prev.genre, genreInput.trim()],
      }));
      setGenreInput('');
    }
  };

  const handleRemoveGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genre: prev.genre.filter(g => g !== genre),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateMutation.mutateAsync({
        artistName: formData.artistName,
        bio: formData.bio,
        genre: formData.genre,
        location: formData.location,
        feeRangeMin: formData.feeRangeMin,
        feeRangeMax: formData.feeRangeMax,
        touringPartySize: formData.touringPartySize,
        socialLinks: formData.socialLinks,
      });

      setSuccess(true);
      setIsEditing(false);
      onSave?.();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-800">Profile updated successfully!</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!isEditing ? (
        <Card className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-semibold">Profile Information</h3>
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Artist Name</p>
              <p className="font-medium">{formData.artistName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium">{formData.location || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Genres</p>
              <div className="flex gap-2 flex-wrap">
                {formData.genre.map(g => (
                  <span key={g} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {g}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fee Range</p>
              <p className="font-medium">
                ${formData.feeRangeMin} - ${formData.feeRangeMax}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Bio</p>
              <p className="font-medium">{formData.bio || 'Not set'}</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Edit Profile</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Artist Name *</label>
              <Input
                type="text"
                name="artistName"
                value={formData.artistName}
                onChange={handleInputChange}
                required
                placeholder="Your artist name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <Input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Genres</label>
              <div className="flex gap-2 mb-3">
                <Input
                  type="text"
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  placeholder="Add a genre"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGenre();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddGenre} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {formData.genre.map(g => (
                  <div
                    key={g}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm flex items-center gap-2"
                  >
                    {g}
                    <button
                      type="button"
                      onClick={() => handleRemoveGenre(g)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Minimum Fee ($)</label>
                <Input
                  type="number"
                  name="feeRangeMin"
                  value={formData.feeRangeMin}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Maximum Fee ($)</label>
                <Input
                  type="number"
                  name="feeRangeMax"
                  value={formData.feeRangeMax}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Touring Party Size</label>
              <Input
                type="number"
                name="touringPartySize"
                value={formData.touringPartySize}
                onChange={handleInputChange}
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">Social Links</h4>
              <div className="space-y-3">
                {Object.entries(formData.socialLinks).map(([platform, value]) => (
                  <div key={platform}>
                    <label className="block text-sm font-medium mb-1 capitalize">{platform}</label>
                    <Input
                      type="text"
                      value={value || ''}
                      onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                      placeholder={`Your ${platform} handle or URL`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
