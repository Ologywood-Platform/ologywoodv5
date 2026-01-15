import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Download, Share2, Copy, Clock, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface RiderTemplate {
  id: number;
  templateName: string;
  artistName: string;
  technicalRequirements?: Record<string, string>;
  hospitalityRequirements?: Record<string, string>;
  financialRequirements?: Record<string, string>;
}

interface SharedTemplate {
  id: string;
  shareToken: string;
  shareLink: string;
  expiresAt: string;
  accessCount: number;
  createdAt: string;
}

interface RiderTemplateExportProps {
  template: RiderTemplate;
  onExport?: (templateId: number) => void;
}

export function RiderTemplateExport({ template, onExport }: RiderTemplateExportProps) {
  const [sharedTemplates, setSharedTemplates] = useState<SharedTemplate[]>([]);
  const [showShareForm, setShowShareForm] = useState(false);
  const [expirationDays, setExpirationDays] = useState(30);
  const [loading, setLoading] = useState(false);

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      // In production, call API to generate PDF
      // const response = await fetch(`/api/riders/${template.id}/export`);
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `${template.templateName}.pdf`;
      // a.click();

      // Mock implementation
      toast.success('PDF export started');
      onExport?.(template.id);
    } catch (error) {
      toast.error('Failed to export PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShare = async () => {
    setLoading(true);
    try {
      // In production, call API to create share link
      // const response = await fetch(`/api/riders/${template.id}/share`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ expirationDays })
      // });
      // const data = await response.json();

      // Mock implementation
      const mockShared: SharedTemplate = {
        id: Math.random().toString(),
        shareToken: 'token_' + Math.random().toString(36).substr(2, 9),
        shareLink: `https://ologywood.com/shared-rider/token_${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toLocaleDateString(),
        accessCount: 0,
        createdAt: new Date().toLocaleDateString(),
      };

      setSharedTemplates([...sharedTemplates, mockShared]);
      setShowShareForm(false);
      toast.success('Share link created');
    } catch (error) {
      toast.error('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard');
  };

  const handleRevokeShare = (id: string) => {
    setSharedTemplates(sharedTemplates.filter(s => s.id !== id));
    toast.success('Share link revoked');
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Export Rider Template</h3>
        <p className="text-sm text-gray-600 mb-4">
          Download your rider template as a professional PDF document.
        </p>
        <Button onClick={handleExportPDF} disabled={loading} className="w-full">
          <Download className="h-4 w-4 mr-2" />
          {loading ? 'Generating PDF...' : 'Download as PDF'}
        </Button>
      </Card>

      {/* Sharing Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Share Rider Template</h3>
          {!showShareForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareForm(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Create Share Link
            </Button>
          )}
        </div>

        {showShareForm && (
          <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-2">
                Link Expiration (days)
              </label>
              <Input
                type="number"
                min="1"
                max="365"
                value={expirationDays}
                onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Link will expire in {expirationDays} days
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateShare}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Share Link'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowShareForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {sharedTemplates.length > 0 ? (
          <div className="space-y-3">
            {sharedTemplates.map(shared => (
              <Card key={shared.id} className="p-4 bg-blue-50 border-blue-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-100">
                        <Clock className="h-3 w-3 mr-1" />
                        Expires: {shared.expiresAt}
                      </Badge>
                      <Badge variant="outline" className="bg-green-100">
                        <Eye className="h-3 w-3 mr-1" />
                        Views: {shared.accessCount}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevokeShare(shared.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={shared.shareLink}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyLink(shared.shareLink)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-gray-600">
                    Created: {shared.createdAt}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No active share links. Create one to share your rider template with venues.
          </p>
        )}
      </Card>

      {/* Info Section */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Share links are secure and can be revoked at any time. 
          Venues can view and download your rider without needing an account.
        </p>
      </Card>
    </div>
  );
}
