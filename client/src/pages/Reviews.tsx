import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, ThumbsUp, MessageSquare, Filter, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface Review {
  id: number;
  reviewerId: number;
  reviewerName: string;
  reviewerRole: string;
  reviewerPhoto?: string;
  rating: number;
  reviewText: string;
  createdAt: Date | string;
  helpful?: number;
  response?: string;
  responseDate?: Date | string;
  bookingId?: number;
  eventDate?: Date | string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function Reviews() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("received");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);

  // Mock data for demonstration
  const artistReviews: Review[] = [
    {
      id: 1,
      reviewerId: 2,
      reviewerName: "The Grand Ballroom",
      reviewerRole: "venue",
      reviewerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=ballroom",
      rating: 5,
      reviewText: "Exceptional performance! The artist was professional, punctual, and delivered an amazing show. Highly recommend!",
      createdAt: new Date(Date.now() - 7 * 24 * 3600000),
      helpful: 12,
      bookingId: 1,
      eventDate: new Date(Date.now() - 14 * 24 * 3600000),
    },
    {
      id: 2,
      reviewerId: 3,
      reviewerName: "Downtown Events Center",
      reviewerRole: "venue",
      reviewerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=downtown",
      rating: 4,
      reviewText: "Great performance with good stage presence. Minor technical issues but handled professionally.",
      createdAt: new Date(Date.now() - 21 * 24 * 3600000),
      helpful: 8,
      response: "Thank you for the feedback! We appreciate working with you.",
      responseDate: new Date(Date.now() - 20 * 24 * 3600000),
      bookingId: 2,
      eventDate: new Date(Date.now() - 28 * 24 * 3600000),
    },
    {
      id: 3,
      reviewerId: 4,
      reviewerName: "Riverside Theater",
      reviewerRole: "venue",
      reviewerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=riverside",
      rating: 5,
      reviewText: "Outstanding! Professional, talented, and a pleasure to work with. Will definitely book again.",
      createdAt: new Date(Date.now() - 35 * 24 * 3600000),
      helpful: 15,
      bookingId: 3,
      eventDate: new Date(Date.now() - 42 * 24 * 3600000),
    },
  ];

  const venueReviews: Review[] = [
    {
      id: 4,
      reviewerId: 5,
      reviewerName: "Alex Martinez",
      reviewerRole: "artist",
      reviewerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
      rating: 5,
      reviewText: "Fantastic venue! Great sound system, professional staff, and excellent audience. Loved performing here!",
      createdAt: new Date(Date.now() - 10 * 24 * 3600000),
      helpful: 18,
      bookingId: 4,
      eventDate: new Date(Date.now() - 17 * 24 * 3600000),
    },
    {
      id: 5,
      reviewerId: 6,
      reviewerName: "Jordan Lee",
      reviewerRole: "artist",
      reviewerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
      rating: 4,
      reviewText: "Good venue with nice facilities. Parking could be better, but overall a great experience.",
      createdAt: new Date(Date.now() - 25 * 24 * 3600000),
      helpful: 7,
      response: "Thanks for the review! We're working on improving parking options.",
      responseDate: new Date(Date.now() - 24 * 24 * 3600000),
      bookingId: 5,
      eventDate: new Date(Date.now() - 32 * 24 * 3600000),
    },
  ];

  const reviewStats: ReviewStats = {
    totalReviews: artistReviews.length + venueReviews.length,
    averageRating: 4.6,
    ratingDistribution: {
      5: 4,
      4: 1,
      3: 0,
      2: 0,
      1: 0,
    },
  };

  const filteredReviews = (reviews: Review[]) => {
    return reviews.filter((review) => {
      const matchesSearch =
        review.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.reviewText.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRating = filterRating === null || review.rating === filterRating;
      return matchesSearch && matchesRating;
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Reviews & Ratings</h1>
          <p className="text-gray-600 mt-2">
            Manage your professional reputation with reviews from collaborators
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Rating Summary */}
        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{reviewStats.averageRating}</div>
              <div className="mt-2">{renderStars(Math.round(reviewStats.averageRating))}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{reviewStats.totalReviews}</div>
              <p className="text-sm text-gray-600 mt-2">From verified bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">5-Star Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{reviewStats.ratingDistribution[5]}</div>
              <p className="text-sm text-gray-600 mt-2">Excellent ratings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Response Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">50%</div>
              <p className="text-sm text-gray-600 mt-2">Reviews responded to</p>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-20">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${(reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution] / reviewStats.totalReviews) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12">
                    {reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reviews Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">Reviews Received ({artistReviews.length + venueReviews.length})</TabsTrigger>
            <TabsTrigger value="given">Reviews Given</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4 mt-6">
            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {filteredReviews([...artistReviews, ...venueReviews]).length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500">No reviews found matching your criteria</p>
                  </CardContent>
                </Card>
              ) : (
                filteredReviews([...artistReviews, ...venueReviews]).map((review) => (
                  <Card key={review.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <img
                          src={review.reviewerPhoto}
                          alt={review.reviewerName}
                          className="h-12 w-12 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{review.reviewerName}</h3>
                              <p className="text-sm text-gray-600 capitalize">{review.reviewerRole}</p>
                            </div>
                            <div className="text-right">
                              {renderStars(review.rating)}
                              <p className="text-xs text-gray-500 mt-1">{formatDate(review.createdAt)}</p>
                            </div>
                          </div>

                          <p className="text-gray-700 mt-3">{review.reviewText}</p>

                          {review.response && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm font-semibold text-blue-900 mb-1">Your Response</p>
                              <p className="text-sm text-blue-800">{review.response}</p>
                              <p className="text-xs text-blue-600 mt-1">{formatDate(review.responseDate || "")}</p>
                            </div>
                          )}

                          <div className="flex gap-4 mt-4">
                            <Button variant="ghost" size="sm" className="text-gray-600">
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Helpful ({review.helpful || 0})
                            </Button>
                            {!review.response && (
                              <Button variant="ghost" size="sm" className="text-gray-600">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Respond
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="given" className="space-y-4 mt-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500 mb-4">You haven't written any reviews yet</p>
                <Button>Write a Review</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
