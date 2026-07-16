import { useState, useEffect, useCallback } from "react";
import { trpc } from "../lib/trpc";
import { Calendar, Clock, Video, Star, MessageSquare, ExternalLink, CheckCircle, Timer } from "lucide-react";

type TabType = "upcoming" | "past" | "all";

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isJoinable: boolean;
  isLive: boolean;
  isPast: boolean;
}

function useCountdown(targetDate: string | Date | null): CountdownState {
  const [countdown, setCountdown] = useState<CountdownState>(() => calculateCountdown(targetDate));

  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return countdown;
}

function calculateCountdown(targetDate: string | Date | null): CountdownState {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isJoinable: false, isLive: false, isPast: true };

  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const diff = target - now;
  const fiveMinBefore = target - 5 * 60 * 1000;

  if (diff < -60 * 60 * 1000) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isJoinable: false, isLive: false, isPast: true };
  }

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isJoinable: true, isLive: true, isPast: false };
  }

  const isJoinable = now >= fiveMinBefore;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isJoinable, isLive: false, isPast: false };
}

function CountdownTimer({ scheduledAt }: { scheduledAt: string | Date | null }) {
  const { days, hours, minutes, seconds, isJoinable, isLive, isPast } = useCountdown(scheduledAt);

  if (isPast) return null;

  if (isLive) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        </span>
        <span className="text-sm font-semibold text-red-700">LIVE NOW</span>
      </div>
    );
  }

  if (isJoinable) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg animate-pulse">
        <Timer className="w-4 h-4 text-green-600" />
        <span className="text-sm font-semibold text-green-700">Starting soon — Join now!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <Timer className="w-4 h-4 text-purple-500" />
      <div className="flex gap-1 text-xs font-mono">
        {days > 0 && (
          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{days}d</span>
        )}
        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{String(hours).padStart(2, "0")}h</span>
        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{String(minutes).padStart(2, "0")}m</span>
        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{String(seconds).padStart(2, "0")}s</span>
      </div>
    </div>
  );
}

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
            <SessionCard
              key={session.id}
              session={session}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
              getPlatformIcon={getPlatformIcon}
              reviewingBooking={reviewingBooking}
              setReviewingBooking={setReviewingBooking}
              rating={rating}
              setRating={setRating}
              reviewText={reviewText}
              setReviewText={setReviewText}
              submitReview={submitReview}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  formatDate,
  getStatusBadge,
  getPlatformIcon,
  reviewingBooking,
  setReviewingBooking,
  rating,
  setRating,
  reviewText,
  setReviewText,
  submitReview,
}: any) {
  const { isJoinable, isLive } = useCountdown(session.scheduledAt);

  const joinEnabled = session.status === "confirmed" && session.joinLink && (isJoinable || isLive);

  return (
    <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
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

          {/* Countdown Timer */}
          {session.status === "confirmed" && session.scheduledAt && (
            <CountdownTimer scheduledAt={session.scheduledAt} />
          )}
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
          joinEnabled ? (
            <a
              href={session.joinLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Join Session
            </a>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-1 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm cursor-not-allowed"
              title="Join button activates 5 minutes before session starts"
            >
              <ExternalLink className="w-4 h-4" />
              Join Session
            </button>
          )
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
  );
}
