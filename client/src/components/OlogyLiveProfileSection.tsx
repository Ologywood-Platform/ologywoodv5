import { trpc } from "../lib/trpc";
import { Video, Clock, Users, Star, ExternalLink } from "lucide-react";

interface OlogyLiveProfileSectionProps {
  talentId: number;
  talentName: string;
}

export function OlogyLiveProfileSection({ talentId, talentName }: OlogyLiveProfileSectionProps) {
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
          <a
            key={exp.id}
            href={`/ology-live/${exp.id}`}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
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
        ))}
      </div>
    </div>
  );
}
