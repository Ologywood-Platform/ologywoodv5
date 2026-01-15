import React, { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';

interface VenueProfileEditorProps {
  onSave?: () => void;
}

export function VenueProfileEditor({ onSave }: VenueProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: profile } = trpc.venue.getMyProfile.useQuery();

  const [formData, setFormData] = useState({
    organizationName: '',
    contactName: '',
    contactPhone: '',
    websiteUrl: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        organizationName: profile.organizationName || '',
        contactName: profile.contactName || '',
        contactPhone: profile.contactPhone || '',
        websiteUrl: profile.websiteUrl || '',
      });
    }
  }, [profile]);

  const updateMutation = trpc.venue.updateProfile.useMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateMutation.mutateAsync({
        organizationName: formData.organizationName,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        websiteUrl: formData.websiteUrl,
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
            <h3 className="text-lg font-semibold">Venue Information</h3>
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Organization Name</p>
              <p className="font-medium">{formData.organizationName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact Name</p>
              <p className="font-medium">{formData.contactName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact Phone</p>
              <p className="font-medium">{formData.contactPhone || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Website</p>
              <p className="font-medium">{formData.websiteUrl || 'Not set'}</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Edit Venue Profile</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Organization Name *</label>
              <Input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleInputChange}
                required
                placeholder="Your venue or organization name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contact Name *</label>
              <Input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                required
                placeholder="Primary contact person"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contact Phone</label>
              <Input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Website URL</label>
              <Input
                type="url"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                placeholder="https://yourwebsite.com"
              />
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
