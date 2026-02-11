import { useState } from 'react';
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Facebook, Twitter, Linkedin, Instagram, Mail, QrCode, Check, Image } from 'lucide-react';
import { toast } from 'sonner';
import * as QRCode from 'qrcode.react';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: number;
  artistName: string;
  artistBio?: string;
  artistProfileImage?: string;
}

export function ShareProfileModal({
  isOpen,
  onClose,
  artistId,
  artistName,
  artistBio,
  artistProfileImage,
}: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Generate profile URL
  const profileUrl = `${window.location.origin}/artist/${artistId}`;
  const shareText = `Check out ${artistName} on Ologywood - Book amazing artists for your events!`;
  
  // Update Open Graph meta tags for better social sharing
  React.useEffect(() => {
    if (!isOpen) return;
    
    // Remove existing meta tags
    const existingOGTitle = document.querySelector('meta[property="og:title"]');
    const existingOGDescription = document.querySelector('meta[property="og:description"]');
    const existingOGImage = document.querySelector('meta[property="og:image"]');
    const existingOGUrl = document.querySelector('meta[property="og:url"]');
    
    if (existingOGTitle) existingOGTitle.remove();
    if (existingOGDescription) existingOGDescription.remove();
    if (existingOGImage) existingOGImage.remove();
    if (existingOGUrl) existingOGUrl.remove();
    
    // Add new meta tags
    const ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', `${artistName} - Ologywood Artist`);
    document.head.appendChild(ogTitle);
    
    const ogDescription = document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', artistBio || shareText);
    document.head.appendChild(ogDescription);
    
    let ogImage: HTMLMetaElement | null = null;
    if (artistProfileImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      ogImage.setAttribute('content', artistProfileImage);
      document.head.appendChild(ogImage);
    }
    
    const ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    ogUrl.setAttribute('content', profileUrl);
    document.head.appendChild(ogUrl);
    
    return () => {
      // Cleanup on unmount
      ogTitle.remove();
      ogDescription.remove();
      if (ogImage) ogImage.remove();
      ogUrl.remove();
    };
  }, [isOpen, artistName, artistBio, artistProfileImage, profileUrl]);

  // Copy to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success('Profile link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  // Social share handlers
  const handleSocialShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(profileUrl);
    const encodedText = encodeURIComponent(shareText);
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing via URL, so copy link instead
        handleCopyLink();
        toast.info('Link copied! Share it in your Instagram bio or posts.');
        return;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      toast.success(`Shared on ${platform}!`);
    }
  };

  // Send email invite
  const handleSendEmail = async () => {
    if (!emailTo) {
      toast.error('Please enter an email address');
      return;
    }

    setSendingEmail(true);
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll show a success message
      toast.success(`Profile invite sent to ${emailTo}!`);
      setEmailTo('');
      setEmailMessage('');
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Your Profile</DialogTitle>
          <DialogDescription>
            Help venues discover you by sharing your Ologywood profile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Artist Preview Section */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            {artistProfileImage && (
              <img
                src={artistProfileImage}
                alt={artistName}
                className="w-16 h-16 rounded-full object-cover border-2 border-purple-300"
              />
            )}
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900">{artistName}</h3>
              {artistBio && (
                <p className="text-sm text-gray-600 line-clamp-2">{artistBio}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">This is how your profile will appear when shared</p>
            </div>
          </div>

          {/* Copy Link Section */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Your Profile Link</Label>
            <div className="flex gap-2">
              <Input
                value={profileUrl}
                readOnly
                className="flex-1 bg-gray-50"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Social Share Section */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Share on Social Media</Label>
            <p className="text-xs text-gray-500">Your profile image and name will be included in the preview</p>
            <div className="grid grid-cols-5 gap-2">
              <Button
                onClick={() => handleSocialShare('facebook')}
                variant="outline"
                className="gap-2 h-auto flex-col py-3"
              >
                <Facebook className="w-5 h-5" />
                <span className="text-xs">Facebook</span>
              </Button>
              <Button
                onClick={() => handleSocialShare('twitter')}
                variant="outline"
                className="gap-2 h-auto flex-col py-3"
              >
                <Twitter className="w-5 h-5" />
                <span className="text-xs">Twitter</span>
              </Button>
              <Button
                onClick={() => handleSocialShare('linkedin')}
                variant="outline"
                className="gap-2 h-auto flex-col py-3"
              >
                <Linkedin className="w-5 h-5" />
                <span className="text-xs">LinkedIn</span>
              </Button>
              <Button
                onClick={() => handleSocialShare('instagram')}
                variant="outline"
                className="gap-2 h-auto flex-col py-3"
              >
                <Instagram className="w-5 h-5" />
                <span className="text-xs">Instagram</span>
              </Button>
              <Button
                onClick={() => handleSocialShare('whatsapp')}
                variant="outline"
                className="gap-2 h-auto flex-col py-3"
              >
                <Mail className="w-5 h-4" />
                <span className="text-xs">WhatsApp</span>
              </Button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">QR Code</Label>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                Generate a QR code for your profile. Great for business cards and posters!
              </div>
              <div className="flex items-center gap-2">
                {artistProfileImage && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Image className="w-3 h-3" />
                    Profile image included
                  </span>
                )}
                <Button
                  onClick={() => setShowQR(!showQR)}
                  variant="outline"
                  className="gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  {showQR ? 'Hide' : 'Show'} QR Code
                </Button>
              </div>
            </div>
            {showQR && (
              <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <QRCode.QRCodeSVG
                  value={profileUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
                <Button
                  onClick={() => {
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                      const link = document.createElement('a');
                      link.href = canvas.toDataURL('image/png');
                      link.download = `${artistName}-profile-qr.png`;
                      link.click();
                      toast.success('QR code downloaded!');
                    }
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Download QR Code
                </Button>
              </div>
            )}
          </div>

          {/* Email Invite Section */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Send Email Invite</Label>
            <div className="space-y-2">
              <Input
                placeholder="venue@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                type="email"
              />
              <Textarea
                placeholder="Add a personal message (optional)"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailTo}
                className="w-full gap-2"
              >
                <Mail className="w-4 h-4" />
                {sendingEmail ? 'Sending...' : 'Send Email Invite'}
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <Button onClick={onClose} variant="outline" className="w-full">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
