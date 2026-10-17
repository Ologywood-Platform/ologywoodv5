import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Mail,
  MailX,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Settings,
  Bell,
  BellOff,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";

type PageState =
  | "confirm"
  | "loading"
  | "success"
  | "error"
  | "login-required"
  | "invalid-token";

const FEEDBACK_REASONS = [
  { id: "too_many_emails", label: "Too many emails" },
  { id: "not_relevant", label: "Content not relevant to me" },
  { id: "privacy_concerns", label: "Privacy concerns" },
  { id: "other", label: "Other" },
] as const;

/**
 * A fan-token changes only the signed creator-update subscription it names.
 * Query email/userId values are deliberately never used to choose a recipient.
 */
export function Unsubscribe() {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<PageState>("confirm");
  const [fanToken, setFanToken] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<
    "idle" | "sending" | "sent"
  >("idle");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("fanToken");
    // Ignore legacy identity-looking query parameters; they must never select a
    // recipient. Without a signed fan token only the logged-in account is used.
    setFanToken(params.has("fanToken") ? (token || "") : null);
    if (params.has("fanToken") && !token?.trim()) setState("invalid-token");
    else if (!params.has("fanToken") && !isAuthenticated) setState("login-required");
    else setState("confirm");
  }, [isAuthenticated]);

  const fanTokenQuery = trpc.emailPreferences.getFanUnsubscribe.useQuery(
    { token: fanToken || "" },
    { enabled: !!fanToken, retry: false }
  );
  const unsubscribeFanMutation = trpc.emailPreferences.unsubscribeFan.useMutation();
  const unsubscribeAllMutation =
    trpc.emailPreferences.unsubscribeAll.useMutation();
  const updatePrefsMutation =
    trpc.emailPreferences.updatePreferences.useMutation();
  const submitFeedbackMutation =
    trpc.emailPreferences.submitUnsubscribeFeedback.useMutation();

  useEffect(() => {
    if (!fanToken) return;
    if (fanTokenQuery.isLoading) {
      setState("loading");
      return;
    }
    if (
      fanTokenQuery.error ||
      fanTokenQuery.data?.valid !== true ||
      fanTokenQuery.data.scope !== "creator_updates"
    ) {
      setState("invalid-token");
      return;
    }
    setState("confirm");
  }, [
    fanToken,
    fanTokenQuery.data,
    fanTokenQuery.error,
    fanTokenQuery.isLoading,
  ]);

  const isFanTokenFlow =
    !!fanToken &&
    fanTokenQuery.data?.valid === true &&
    fanTokenQuery.data.scope === "creator_updates";

  const handleUnsubscribe = async () => {
    setState("loading");
    try {
      if (fanToken !== null) {
        if (!isFanTokenFlow || !fanToken) throw new Error("Invalid creator unsubscribe link");
        const result = await unsubscribeFanMutation.mutateAsync({
          token: fanToken,
        });
        if (result.success !== true || result.scope !== "creator_updates")
          throw new Error("Unable to unsubscribe");
      } else {
        // This only affects the authenticated account; no query param identity is used.
        await unsubscribeAllMutation.mutateAsync();
      }
      setState("success");
    } catch (error: any) {
      if (error?.data?.code === "UNAUTHORIZED" && !isFanTokenFlow)
        setState("login-required");
      else if (fanToken !== null) setState("invalid-token");
      else setState("error");
    }
  };

  const handleReduceFrequency = async () => {
    if (isFanTokenFlow) return;
    setState("loading");
    try {
      await updatePrefsMutation.mutateAsync({
        frequency: "weekly",
        bookingUpdates: true,
        newOpportunities: false,
        platformNews: false,
        weeklyDigest: true,
        reminders: true,
      });
      setState("success");
    } catch (error: any) {
      setState(
        error?.data?.code === "UNAUTHORIZED" ? "login-required" : "error"
      );
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedReason || !isAuthenticated) {
      setFeedbackStatus("sent");
      return;
    }
    setFeedbackStatus("sending");
    try {
      await submitFeedbackMutation.mutateAsync({
        reason: selectedReason,
        comment: feedbackComment.trim() || undefined,
      });
    } finally {
      setFeedbackStatus("sent");
    }
  };

  const scopeCopy = isFanTokenFlow
    ? "This will stop future creator update emails for this creator only. It will not unfollow the creator, change your account-wide email settings, or stop booking and purchase emails."
    : "This will update email preferences for your signed-in account only. It will not change another person’s account.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <SiteHeader />
      <main className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {state === "confirm" && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Confirm email preference
              </h1>
              <p className="mt-2 text-sm text-purple-100">
                Review this change before it is applied.
              </p>
            </div>
            <div className="space-y-5 px-6 py-6 sm:px-8">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      {isFanTokenFlow
                        ? "Creator update emails only"
                        : "Account email preferences"}
                    </p>
                    <p className="mt-1 text-sm text-amber-800">{scopeCopy}</p>
                  </div>
                </div>
              </div>
              {isFanTokenFlow ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                  This signed link does not reveal a recipient identity and
                  works without signing in. It is scoped only to creator
                  updates.
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                    <div className="flex items-start gap-3">
                      <Bell className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-900">
                          Prefer fewer account emails?
                        </p>
                        <p className="mt-1 text-xs text-purple-700">
                          Keep essential booking emails and a weekly digest
                          while turning off opportunity and platform-news
                          emails.
                        </p>
                        <button
                          onClick={handleReduceFrequency}
                          className="mt-3 w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700"
                        >
                          Reduce my emails
                        </button>
                      </div>
                    </div>
                  </div>
                  <a
                    href="/settings"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <Settings className="h-4 w-4" />
                    Choose account email settings
                  </a>
                </>
              )}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400">or</span>
                </div>
              </div>
              <button
                onClick={handleUnsubscribe}
                className="w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <span className="flex items-center justify-center gap-2">
                  <MailX className="h-4 w-4" />
                  {isFanTokenFlow
                    ? "Yes, stop this creator’s updates"
                    : "Yes, unsubscribe my account"}
                </span>
              </button>
              <a
                href="/"
                className="flex items-center justify-center gap-2 py-1 text-sm text-slate-500 transition-colors hover:text-slate-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Never mind, take me back
              </a>
            </div>
          </div>
        )}

        {state === "loading" && (
          <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-purple-600" />
            <p className="text-slate-600">
              Checking or processing your request…
            </p>
          </div>
        )}

        {state === "success" && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Preference updated
              </h1>
            </div>
            <div className="space-y-4 px-6 py-6 sm:px-8">
              <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-700">
                {isFanTokenFlow
                  ? "Future creator update sends and exports will no longer include this permission. Your following status and booking or purchase emails are unchanged."
                  : "Your signed-in account email preferences have been updated. Active booking and account-security emails may still be required."}
              </div>
              {isAuthenticated && feedbackStatus !== "sent" && (
                <div className="rounded-xl border border-slate-200 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-500" />
                    <p className="text-sm font-medium text-slate-800">
                      What made you unsubscribe? (optional)
                    </p>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {FEEDBACK_REASONS.map(reason => (
                      <button
                        key={reason.id}
                        onClick={() => setSelectedReason(reason.id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${selectedReason === reason.id ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      >
                        {reason.label}
                      </button>
                    ))}
                  </div>
                  {selectedReason && (
                    <>
                      <textarea
                        value={feedbackComment}
                        onChange={event =>
                          setFeedbackComment(event.target.value)
                        }
                        placeholder="Anything else you'd like to share? (optional)"
                        maxLength={500}
                        rows={2}
                        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={handleSubmitFeedback}
                        disabled={feedbackStatus === "sending"}
                        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {feedbackStatus === "sending"
                          ? "Sending…"
                          : "Send Feedback"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setFeedbackStatus("sent")}
                    className="mt-2 w-full text-xs text-slate-400 hover:text-slate-500"
                  >
                    Skip
                  </button>
                </div>
              )}
              {feedbackStatus === "sent" && isAuthenticated && (
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-center text-sm text-purple-800">
                  Thanks for your feedback.
                </div>
              )}
              <a
                href="/"
                className="flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Return to Home
              </a>
              {isAuthenticated && !isFanTokenFlow && (
                <a
                  href="/settings"
                  className="flex items-center justify-center gap-2 py-1 text-sm text-purple-600 hover:text-purple-700"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Fine-tune account email preferences
                </a>
              )}
            </div>
          </div>
        )}

        {state === "invalid-token" && (
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                This link can’t be used
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                The creator-update link is malformed or no longer
                current. No email preference was changed.
              </p>
            </div>
            <div className="space-y-3">
              <a
                href="/settings"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
              >
                <Settings className="h-4 w-4" />
                Manage my account settings
              </a>
              <a
                href="/"
                className="flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Return to Home
              </a>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Something went wrong
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                We couldn’t process your request. No change was confirmed.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setState("confirm")}
                className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
              >
                Try Again
              </button>
              <a
                href="/"
                className="flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Return to Home
              </a>
            </div>
          </div>
        )}

        {state === "login-required" && (
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <BellOff className="h-8 w-8 text-purple-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Sign in required
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                For legacy unsubscribe links, sign in to manage only your own
                authenticated account. Email or user ID values in the link are
                not used.
              </p>
            </div>
            <div className="space-y-3">
              <a
                href="/api/login"
                className="flex w-full items-center justify-center rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
              >
                Sign In to Manage Preferences
              </a>
              <a
                href="/"
                className="flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Return to Home
              </a>
            </div>
          </div>
        )}
        <p className="mt-6 text-center text-xs text-slate-400">
          © 2026 OlogyWood. All rights reserved.
        </p>
      </div>
      </main>
    </div>
  );
}
