import { Button } from '@/components/ui/button';
import { Share2, Facebook, Twitter, Linkedin, Mail, Link2, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface VenueShareButtonsProps {
  venueId: number;
  venueName: string;
  venueLocation?: string;
  venueDescription?: string;
  profilePhotoUrl?: string;
}

export function VenueShareButtons({
  venueId,
  venueName,
  venueLocation,
  venueDescription,
  profilePhotoUrl,
}: VenueShareButtonsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate shareable URL
  const shareUrl = `${window.location.origin}/venues/${venueId}`;
  const shareTitle = `Check out ${venueName} on Ologywood`;
  const shareText = `${venueName}${venueLocation ? ` in ${venueLocation}` : ''} - Book amazing artists for your events!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareTitle)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    trackShare('facebook');
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}&hashtags=Ologywood,VenueBooking`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    trackShare('twitter');
  };

  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
    trackShare('linkedin');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(`${shareText}\n\nCheck it out: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    trackShare('email');
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
    trackShare('whatsapp');
  };

  const trackShare = (platform: string) => {
    // Track share event for analytics
    console.log(`Venue ${venueId} shared on ${platform}`);
    // TODO: Send to analytics backend
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-50 p-4 space-y-3">
          <div className="font-semibold text-sm mb-3">Share this venue</div>

          {/* Copy Link */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left"
            onClick={handleCopyLink}
          >
            <Copy className="h-4 w-4 mr-2" />
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>

          <div className="border-t my-2" />

          {/* Social Media Buttons */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left hover:bg-blue-50"
            onClick={handleFacebookShare}
          >
            <Facebook className="h-4 w-4 mr-2 text-blue-600" />
            Facebook
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left hover:bg-sky-50"
            onClick={handleTwitterShare}
          >
            <Twitter className="h-4 w-4 mr-2 text-sky-500" />
            Twitter / X
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left hover:bg-blue-50"
            onClick={handleLinkedInShare}
          >
            <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
            LinkedIn
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left hover:bg-green-50"
            onClick={handleWhatsAppShare}
          >
            <svg className="h-4 w-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.946 1.347l-.355.192-.368-.06a9.879 9.879 0 00-3.464.608l.564 2.173 1.888-.959a9.877 9.877 0 018.368 1.215l.341.256.364-.057a9.876 9.876 0 013.465-.608l-.564-2.173-1.888.959a9.877 9.877 0 00-8.368-1.215l-.341-.256-.364.057z" />
            </svg>
            WhatsApp
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left hover:bg-gray-50"
            onClick={handleEmailShare}
          >
            <Mail className="h-4 w-4 mr-2 text-gray-600" />
            Email
          </Button>

          <div className="border-t my-2" />

          {/* Share URL Display */}
          <div className="bg-gray-50 p-2 rounded text-xs break-all text-gray-600">
            {shareUrl}
          </div>
        </div>
      )}
    </div>
  );
}
