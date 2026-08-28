import { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Check, Facebook, Twitter, Linkedin, MessageCircle, X, Mail, Smartphone, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { toOgShareUrl } from '@/lib/slugify';
import { portfolioVideoUrl } from '@shared/portfolioVideoShare';


interface ShareVideoButtonProps {
  artistId: number;
  artistName: string;
  videoId?: number;
  videoTitle?: string;
}

export function ShareVideoButton({ artistId, artistName, videoId, videoTitle }: ShareVideoButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // OG share URL for social media (bypasses Cloudflare WAF)
  const ogShareUrl = videoId && videoTitle
    ? portfolioVideoUrl(window.location.origin, videoTitle, videoId)
    : toOgShareUrl(window.location.origin, 'artist', artistName, artistId);

  const shareText = videoTitle
    ? `Watch “${videoTitle}” by ${artistName} on OlogyWood.`
    : `Watch ${artistName} perform on Ologywood!`;

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ogShareUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const share = (platform: string) => {
    const encodedUrl = encodeURIComponent(ogShareUrl);
    const encodedText = encodeURIComponent(shareText);
    let url = '';

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(videoTitle ? `${videoTitle} by ${artistName}` : artistName)}&body=${encodedText}%0A%0A${encodedUrl}`;
        break;
      case 'text':
        url = `sms:?&body=${encodedText}%20${encodedUrl}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
      setOpen(false);
    }
  };

  const shareMore = async () => {
    if (!navigator.share) {
      await handleCopy();
      return;
    }
    try {
      await navigator.share({
        title: videoTitle ? `${videoTitle} by ${artistName}` : artistName,
        text: shareText,
        url: ogShareUrl,
      });
      setOpen(false);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') toast.error('Unable to open device sharing');
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1.5"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Close button */}
          <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Share Video</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Copy Link */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          {/* Social platforms */}
          <button
            onClick={() => share('facebook')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Facebook className="h-4 w-4 text-[#1877F2]" />
            <span>Facebook</span>
          </button>

          <button
            onClick={() => share('twitter')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Twitter className="h-4 w-4 text-[#1DA1F2]" />
            <span>Twitter / X</span>
          </button>

          <button
            onClick={() => share('linkedin')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Linkedin className="h-4 w-4 text-[#0A66C2]" />
            <span>LinkedIn</span>
          </button>

          <button
            onClick={() => share('whatsapp')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MessageCircle className="h-4 w-4 text-[#25D366]" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => share('email')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Mail className="h-4 w-4 text-slate-600" />
            <span>Email</span>
          </button>

          <button
            onClick={() => share('text')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Smartphone className="h-4 w-4 text-slate-600" />
            <span>Text Message</span>
          </button>

          <button
            onClick={shareMore}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4 text-slate-600" />
            <span>More Options</span>
          </button>
        </div>
      )}
    </div>
  );
}
