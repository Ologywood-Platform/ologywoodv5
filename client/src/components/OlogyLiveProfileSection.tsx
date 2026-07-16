import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Video, Clock, Users, Star, ExternalLink, Share2, Check, Link2 } from "lucide-react";

interface OlogyLiveProfileSectionProps {
  talentId: number;
  talentName: string;
}

function ShareMenu({ experience, talentName, onClose }: { experience: any; talentName: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const experienceUrl = `${window.location.origin}/ology-live/${experience.id}`;
  const shareText = `Check out "${experience.title}" by ${talentName} on Ology Live! Book a virtual ${experience.category || "experience"} session.`;

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(experienceUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
    onClose();
  };

  const shareToInstagram = () => {
    // Instagram doesn't support direct URL sharing via web intent, so we copy the link
    // and inform the user to paste it in their Instagram story/post
    navigator.clipboard.writeText(`${shareText}\n\n${experienceUrl}`);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(experienceUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1500);
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(experienceUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "width=600,height=400");
    onClose();
  };

  return (
    <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[180px]">
      <button
        onClick={shareToTwitter}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Share on X
      </button>
      <button
        onClick={shareToInstagram}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
        {copied ? "Copied! Paste in Instagram" : "Share on Instagram"}
      </button>
      <button
        onClick={shareToFacebook}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        Share on Facebook
      </button>
      <div className="border-t border-gray-100 mt-1 pt-1">
        <button
          onClick={copyLink}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Link2 className="w-4 h-4" />}
          {copied ? "Link Copied!" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}

export function OlogyLiveProfileSection({ talentId, talentName }: OlogyLiveProfileSectionProps) {
  const [sharingExpId, setSharingExpId] = useState<number | null>(null);

  const experiences = trpc.ologyLive.browseExperiences.useQuery({
    category: undefined,
    capacityType: undefined,
    limit: 4,
    offset: 0,
  });

  // Filter to only this talent's experiences
  const talentExperiences = experiences.data?.filter(
    (exp: any) => exp.talentId === talentId
  ) || [];

  if (talentExperiences.length === 0) return null;

  const formatPrice = (price: string | number) => {
    const num = typeof price === "string" ? parseFloat(price) : price;
    return `$${num.toFixed(0)}`;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      gaming: "Gaming",
      music: "Music",
      fitness: "Fitness",
      qa: "Q&A",
      workshop: "Workshop",
      cooking: "Cooking",
      education: "Education",
      other: "Other",
    };
    return labels[category] || category;
  };

  const getCapacityLabel = (type: string) => {
    const labels: Record<string, string> = {
      one_on_one: "1-on-1",
      small_group: "Small Group",
      broadcast: "Broadcast",
    };
    return labels[type] || type;
  };

  return (
    <div className="mt-8 border-t pt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Ology Live</h2>
        </div>
        <a
          href="/ology-live"
          className="text-sm text-purple-600 hover:underline flex items-center gap-1"
        >
          View All <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Book a virtual experience with {talentName}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {talentExperiences.map((exp: any) => (
          <div
            key={exp.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow group relative"
          >
            <a href={`/ology-live/${exp.id}`} className="block">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors pr-8">
                  {exp.title}
                </h3>
                <span className="text-lg font-bold text-purple-600">
                  {formatPrice(exp.price)}
                </span>
              </div>

              {exp.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {exp.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {exp.duration} min
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {getCapacityLabel(exp.capacityType)}
                </span>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded">
                  {getCategoryLabel(exp.category)}
                </span>
                {exp.averageRating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400" />
                    {parseFloat(String(exp.averageRating)).toFixed(1)}
                  </span>
                )}
              </div>
            </a>

            {/* Share Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSharingExpId(sharingExpId === exp.id ? null : exp.id);
              }}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
              title="Share this experience"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Share Menu */}
            {sharingExpId === exp.id && (
              <ShareMenu
                experience={exp}
                talentName={talentName}
                onClose={() => setSharingExpId(null)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
