import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Calendar, Clock, Video, Star, MessageSquare, ExternalLink, CheckCircle } from "lucide-react";

type TabType = "upcoming" | "past" | "all";

export default function OlogyLiveMySessions() {
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [reviewingBooking, setReviewingBooking] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const sessions = trpc.ologyLivePhase2.getMyFanSessions.useQuery({ status: activeTab });
  const submitReview = trpc.ologyLivePhase2.submitReview.useMutation({
    onSuccess: () => {
      setReviewingBooking(null);
      setRating(5);
      setReviewText("");
      sessions.refetch();
    },
  });

  const tabs: { key: TabType; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "all", label: "All Sessions" },
  ];

  const formatDate = (date: string | Date | null) => {
    if (!date) return "TBD";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPlatformIcon = (platform: string | null) => {
    return <Video className="w-4 h-4" />;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Live Sessions</h1>
        <p className="text-gray-600 mt-2">
          View your upcoming and past Ology Live experiences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {sessions.isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading sessions...</div>
      ) : !sessions.data?.length ? (
        <div className="text-center py-12">
          <Video className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No {activeTab === "all" ? "" : activeTab} sessions found</p>
          <a href="/ology-live" className="text-purple-600 hover:underline mt-2 inline-block">
            Browse Ology Live experiences
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.data.map((session: any) => (
            <div key={session.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {session.experienceTitle || "Live Session"}
                    </h3>
                    {getStatusBadge(session.status)}
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    with <span className="font-medium">{session.talentName || "Host"}</span>
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(session.scheduledAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {session.experienceDuration || 30} min
                    </span>
                    <span className="flex items-center gap-1">
                      {getPlatformIcon(session.experiencePlatform)}
                      {session.experiencePlatform || "Virtual"}
                    </span>
                    {session.experienceCategory && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                        {session.experienceCategory}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ${parseFloat(session.amount || "0").toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex gap-3">
                {session.status === "confirmed" && session.joinLink && (
                  <a
                    href={session.joinLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Join Session
                  </a>
                )}

                {session.status === "completed" && !session.reviewedAt && (
                  <button
                    onClick={() => setReviewingBooking(session.id)}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600"
                  >
                    <Star className="w-4 h-4" />
                    Leave Review
                  </button>
                )}

                {session.reviewedAt && (
                  <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Reviewed
                  </span>
                )}
              </div>

              {/* Review Form */}
              {reviewingBooking === session.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium mb-3">Rate your experience</h4>

                  {/* Star Rating */}
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`w-8 h-8 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                      >
                        <Star className="w-full h-full fill-current" />
                      </button>
                    ))}
                  </div>

                  {/* Review Text */}
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience (optional)..."
                    className="w-full p-3 border rounded-lg text-sm resize-none h-24"
                    maxLength={2000}
                  />

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        submitReview.mutate({
                          bookingId: session.id,
                          rating,
                          reviewText: reviewText || undefined,
                        });
                      }}
                      disabled={submitReview.isPending}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                    >
                      {submitReview.isPending ? "Submitting..." : "Submit Review"}
                    </button>
                    <button
                      onClick={() => {
                        setReviewingBooking(null);
                        setRating(5);
                        setReviewText("");
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
