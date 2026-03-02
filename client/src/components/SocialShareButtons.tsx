/**
 * SocialShareButtons — reusable sharing bar for Twitter/X, LinkedIn, and copy-link.
 * Accepts a title, url, and optional description for pre-filled share text.
 */
import { useState } from "react";
import { Check, Copy, Linkedin } from "lucide-react";

/** Simple X / Twitter icon (no lucide icon available) */
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface SocialShareButtonsProps {
  title: string;
  url?: string;
  description?: string;
}

export default function SocialShareButtons({
  title,
  url,
  description,
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = description ? `${title} — ${description}` : title;

  const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 font-medium mr-1">Share:</span>

      {/* Twitter / X */}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X (Twitter)"
        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-900 hover:text-white transition-colors"
      >
        <XIcon className="w-4 h-4" />
      </a>

      {/* LinkedIn */}
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 hover:bg-[#0A66C2] hover:text-white transition-colors"
      >
        <Linkedin className="w-4 h-4" />
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        aria-label={copied ? "Link copied" : "Copy link"}
        className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
          copied
            ? "bg-green-100 text-green-600"
            : "bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600"
        }`}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>

      {copied && (
        <span className="text-xs text-green-600 font-medium animate-fade-in">
          Copied!
        </span>
      )}
    </div>
  );
}
