import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Video, Clock, DollarSign, Users, Calendar, Search, Zap,
  Gamepad2, Music, Dumbbell, MessageCircle, Camera, Film, Palette, Briefcase, Star
} from "lucide-react";

const CATEGORIES = [
  { value: "", label: "All", icon: Star },
  { value: "gaming", label: "Gaming", icon: Gamepad2 },
  { value: "music", label: "Music", icon: Music },
  { value: "fitness", label: "Fitness", icon: Dumbbell },
  { value: "qa", label: "Q&A", icon: MessageCircle },
  { value: "workshop", label: "Workshop", icon: Briefcase },
  { value: "photography", label: "Photo", icon: Camera },
  { value: "film_breakdown", label: "Film", icon: Film },
  { value: "creative", label: "Creative", icon: Palette },
  { value: "brand_building", label: "Brand", icon: Zap },
];

interface LiveExperience {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  price: string;
  capacityType: string;
  maxAttendees: number | null;
  platform: string;
  platformLink: string | null;
  linkSentAfterBooking: boolean | null;
  category: string;
  tags: string[] | null;
  coverImageUrl: string | null;
  isActive: boolean;
  totalBookings: number | null;
  averageRating: string | null;
  createdAt: Date;
  updatedAt: Date;
  talentId: number;
  recurringSchedule: unknown;
}

export default function OlogyLiveBrowse() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const experiences = trpc.ologyLive.browseExperiences.useQuery({
    category: selectedCategory || undefined,
    limit: 50,
  });

  const filteredExperiences = ((experiences.data || []) as LiveExperience[]).filter(exp => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return exp.title.toLowerCase().includes(q) ||
      (exp.description || "").toLowerCase().includes(q) ||
      exp.category.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Video className="h-9 w-9 text-primary" />
          Ology Live
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Book virtual experiences with your favorite talent — gaming sessions, Q&As, workshops, and more.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="space-y-4">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search experiences..."
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                  selectedCategory === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      {experiences.isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading experiences...</p>
        </div>
      ) : filteredExperiences.length === 0 ? (
        <div className="text-center py-12">
          <Video className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg">No experiences found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || selectedCategory
              ? "Try adjusting your search or filters."
              : "Be the first to check back when talent starts offering live experiences!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExperiences.map(exp => {
            const catInfo = CATEGORIES.find(c => c.value === exp.category);
            const CatIcon = catInfo?.icon || Star;
            return (
              <Card key={exp.id} className="hover:shadow-md transition-shadow group cursor-pointer">
                <CardContent className="pt-5 pb-4">
                  {/* Category badge */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <CatIcon className="h-3 w-3" />
                      {catInfo?.label || exp.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {exp.capacityType === "one_on_one" ? "1-on-1" :
                       exp.capacityType === "small_group" ? "Small Group" : "Broadcast"}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                    {exp.title}
                  </h3>
                  {exp.description ? (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {String(exp.description)}
                    </p>
                  ) : null}

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {exp.duration} min
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      {parseFloat(exp.price) === 0 ? "Free" : `$${exp.price}`}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {exp.capacityType === "one_on_one" ? "Private" :
                       `Up to ${exp.maxAttendees}`}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground capitalize">
                      <Calendar className="h-4 w-4" />
                      {exp.platform.replace("_", " ")}
                    </div>
                  </div>

                  {/* Tags */}
                  {exp.tags && (exp.tags as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {(exp.tags as string[]).slice(0, 3).map((tag: string, i: number) => (
                        <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Rating */}
                  {exp.averageRating ? (
                    <div className="flex items-center gap-1 mt-3 text-sm">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{String(exp.averageRating)}</span>
                      <span className="text-muted-foreground">({String(exp.totalBookings || 0)} sessions)</span>
                    </div>
                  ) : null}

                  {/* CTA */}
                  <Button className="w-full mt-4" variant="default" asChild>
                    <a href={`/ology-live/${exp.id}`}>
                      View & Book
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
