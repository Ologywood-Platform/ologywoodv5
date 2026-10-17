import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Mail, AlertCircle, CheckCircle, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";

const DEFAULT_PREFERENCES = {
  frequency: "weekly" as "daily" | "weekly" | "never",
  bookingUpdates: true,
  newOpportunities: true,
  platformNews: false,
  weeklyDigest: true,
  reminders: true,
  // This global setting is not creator consent. It only allows separately
  // granted per-creator consent to be eligible for future sends/exports.
  fanUpdates: true,
};

type LocalPreferences = typeof DEFAULT_PREFERENCES;

export function EmailPreferencesCenter() {
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const trpcUtils = trpc.useUtils();
  const { data: preferences, isLoading: preferencesLoading } =
    trpc.emailPreferences.getPreferences.useQuery();
  const updateMutation = trpc.emailPreferences.updatePreferences.useMutation();
  const unsubscribeAllMutation =
    trpc.emailPreferences.unsubscribeAll.useMutation();
  const resubscribeMutation = trpc.emailPreferences.resubscribe.useMutation();
  const [localPreferences, setLocalPreferences] =
    useState<LocalPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    if (!preferences) return;
    setLocalPreferences({
      frequency:
        (preferences.frequency as LocalPreferences["frequency"]) || "weekly",
      bookingUpdates: preferences.bookingUpdates ?? true,
      newOpportunities: preferences.newOpportunities ?? true,
      platformNews: preferences.platformNews ?? false,
      weeklyDigest: preferences.weeklyDigest ?? true,
      reminders: preferences.reminders ?? true,
      fanUpdates: preferences.fanUpdates ?? true,
    });
  }, [preferences]);

  const showStatus = (status: "success" | "error", message: string) => {
    setSaveStatus(status);
    setSaveMessage(message);
    window.setTimeout(() => setSaveStatus("idle"), 4000);
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      const updated = await updateMutation.mutateAsync(localPreferences);
      if (!updated) throw new Error('Preference change could not be confirmed');
      if (updated) {
        setLocalPreferences(current => ({
          ...current,
          frequency:
            (updated.frequency as LocalPreferences["frequency"]) ||
            current.frequency,
          bookingUpdates: updated.bookingUpdates ?? current.bookingUpdates,
          newOpportunities:
            updated.newOpportunities ?? current.newOpportunities,
          platformNews: updated.platformNews ?? current.platformNews,
          weeklyDigest: updated.weeklyDigest ?? current.weeklyDigest,
          reminders: updated.reminders ?? current.reminders,
          fanUpdates: updated.fanUpdates ?? current.fanUpdates,
        }));
      }
      const unsubscribedAt = (
        updated as { unsubscribedAt?: string | Date | null } | undefined
      )?.unsubscribedAt;
      showStatus(
        "success",
        localPreferences.frequency === "never"
          ? `Email preferences saved${unsubscribedAt ? `; unsubscribed ${new Date(unsubscribedAt).toLocaleString()}` : ""}.`
          : "Email preferences saved successfully."
      );
    } catch {
      showStatus("error", "Failed to save preferences. Please try again.");
    }
  };

  const handleUnsubscribeAll = async () => {
    if (
      !window.confirm(
        "Are you sure you want to unsubscribe from all emails? This changes your account-wide email settings."
      )
    )
      return;
    setSaveStatus("saving");
    try {
      const result = await unsubscribeAllMutation.mutateAsync();
      setLocalPreferences(current => ({
        ...current,
        frequency: "never",
        bookingUpdates: false,
        newOpportunities: false,
        platformNews: false,
        weeklyDigest: false,
        reminders: false,
        fanUpdates: false,
      }));
      const unsubscribedAt = (
        result as { unsubscribedAt?: string | Date | null }
      ).unsubscribedAt;
      showStatus(
        "success",
        `You have been unsubscribed from account-wide emails${unsubscribedAt ? ` as of ${new Date(unsubscribedAt).toLocaleString()}` : ""}.`
      );
    } catch {
      showStatus("error", "Failed to unsubscribe. Please try again.");
    }
  };

  const handleResubscribe = async () => {
    setSaveStatus("saving");
    try {
      await resubscribeMutation.mutateAsync();
      const prefs = await trpcUtils.emailPreferences.getPreferences.fetch(undefined, { staleTime: 0 });
      if (!prefs) throw new Error('Preference change could not be confirmed');
      setLocalPreferences({ ...DEFAULT_PREFERENCES, ...prefs });
      showStatus(
        "success",
        "Account-wide email preferences restored. This does not add permission for any creator."
      );
    } catch {
      showStatus("error", "Failed to resubscribe. Please try again.");
    }
  };

  if (preferencesLoading)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-slate-600">
            Loading preferences...
          </p>
        </CardContent>
      </Card>
    );

  const isUnsubscribed = localPreferences.frequency === "never";
  const toggle = (key: Exclude<keyof LocalPreferences, "frequency">) =>
    setLocalPreferences(current => ({ ...current, [key]: !current[key] }));

  return (
    <div className="space-y-6">
      {saveStatus === "success" && (
        <div
          role="status"
          className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4"
        >
          <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
          <p className="text-sm text-green-700">{saveMessage}</p>
        </div>
      )}
      {saveStatus === "error" && (
        <div
          role="alert"
          className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{saveMessage}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-slate-600" />
            <div>
              <CardTitle>Email Frequency</CardTitle>
              <CardDescription>
                How often would you like to receive account emails?
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {(["daily", "weekly", "never"] as const).map(frequency => (
            <label
              key={frequency}
              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-slate-50"
            >
              <input
                type="radio"
                name="frequency"
                value={frequency}
                checked={localPreferences.frequency === frequency}
                onChange={() =>
                  setLocalPreferences(current => ({ ...current, frequency }))
                }
                className="h-4 w-4"
              />
              <div>
                <p className="font-medium capitalize text-slate-900">
                  {frequency}
                </p>
                <p className="text-sm text-slate-600">
                  {frequency === "daily"
                    ? "Get account updates every day"
                    : frequency === "weekly"
                      ? "Get a digest once a week"
                      : "Stop account-wide non-essential emails"}
                </p>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-600" />
            <div>
              <CardTitle>Creator updates</CardTitle>
              <CardDescription>
                A global setting for emails from creators you follow
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-slate-50">
            <input
              type="checkbox"
              checked={localPreferences.fanUpdates}
              onChange={() => toggle("fanUpdates")}
              className="mt-0.5 h-4 w-4 rounded"
            />
            <span>
              <span className="block text-sm font-medium text-slate-900">
                Allow creator update emails globally
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                This only permits updates from creators you have separately
                chosen to share your name and email with. Turning it on does not
                opt you in to any creator. Turning it off blocks future creator
                sends and eligibility until you turn it back on.
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      {!isUnsubscribed && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-slate-600" />
              <div>
                <CardTitle>Email Content</CardTitle>
                <CardDescription>
                  Choose which account email categories you receive
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(
              [
                [
                  "bookingUpdates",
                  "Booking Updates",
                  "New booking requests, confirmations, and cancellations",
                ],
                [
                  "newOpportunities",
                  "New Opportunities",
                  "Matching artists and venues based on your preferences",
                ],
                [
                  "weeklyDigest",
                  "Weekly Digest",
                  "Summary of activity and important updates",
                ],
                [
                  "reminders",
                  "Event Reminders",
                  "Reminders for upcoming bookings and events",
                ],
                [
                  "platformNews",
                  "Platform News",
                  "New features, updates, and announcements",
                ],
              ] as const
            ).map(([key, label, description]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={localPreferences[key]}
                  onChange={() => toggle(key)}
                  className="h-4 w-4 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{label}</p>
                  <p className="text-sm text-slate-600">{description}</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 [&_button]:h-auto [&_button]:min-h-9 [&_button]:whitespace-normal">
        <Button
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className="flex-1"
        >
          {saveStatus === "saving" ? "Saving..." : "Save Preferences"}
        </Button>
        {isUnsubscribed ? (
          <Button
            onClick={handleResubscribe}
            variant="outline"
            disabled={saveStatus === "saving"}
            className="flex-1"
          >
            {saveStatus === "saving"
              ? "Resubscribing..."
              : "Restore Account Emails"}
          </Button>
        ) : (
          <Button
            onClick={handleUnsubscribeAll}
            variant="outline"
            disabled={saveStatus === "saving"}
            className="flex-1"
          >
            {saveStatus === "saving" ? "Unsubscribing..." : "Unsubscribe All"}
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Creator email permission is managed separately
          for each creator in Following. Changing account-wide settings never
          creates per-creator consent.
        </p>
      </div>
    </div>
  );
}
