import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Lock,
  Download,
  Crown,
  Mail,
  UserCheck,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { SendUpdateDialog } from "./SendUpdateDialog";

interface FansSectionProps {
  artistUserId?: number;
}

/** Paid creators may only see/export fans who affirmatively permitted contact. */
export function FansSection({ artistUserId }: FansSectionProps) {
  const [, navigate] = useLocation();
  const [sendUpdateOpen, setSendUpdateOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: stats } = trpc.follows.getStats.useQuery(
    { userId: artistUserId! },
    { enabled: !!artistUserId }
  );
  const {
    data: fanEmails,
    isLoading: fanEmailsLoading,
    error: fanEmailsError,
    refetch: refetchFanEmails,
  } = trpc.follows.getFanEmails.useQuery(
    { limit: 100, offset: 0 },
    { enabled: !!artistUserId, retry: false }
  );

  const followerCount = fanEmails?.totalCount ?? stats?.followersCount ?? 0;
  const eligibleCount = fanEmails?.eligibleCount ?? 0;
  const hasPaidAccess = !fanEmailsError && fanEmails?.hasAccess === true;
  const fanEmailList = hasPaidAccess ? (fanEmails?.fans ?? []) : [];

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // A fresh export avoids silently exporting only the first list-page.
      const exportData = await utils.follows.exportFanEmails.fetch(undefined, { staleTime: 0 });
      if (!exportData.csv || exportData.totalCount === 0) {
        toast.info("There are no consent-eligible fan emails to export.");
        return;
      }
      const blob = new Blob([exportData.csv], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = exportData.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(
        exportData.truncated
          ? `Exported the first ${exportData.totalCount.toLocaleString()} eligible contacts (export limit: 10,000).`
          : `Exported ${exportData.totalCount.toLocaleString()} eligible fan contacts.`
      );
    } catch (error: any) {
      toast.error(
        error?.message || "Could not export fan emails. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const utils = trpc.useUtils();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Your Fans
              </CardTitle>
              <CardDescription>
                {followerCount.toLocaleString()}{" "}
                {followerCount === 1 ? "follower" : "followers"} ·{" "}
                {eligibleCount.toLocaleString()} consent-eligible email{" "}
                {eligibleCount === 1 ? "contact" : "contacts"}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {hasPaidAccess && eligibleCount > 0 && (
                <Button
                  size="sm"
                  onClick={() => setSendUpdateOpen(true)}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Update
                </Button>
              )}
              {hasPaidAccess && eligibleCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={isExporting}
                  className="gap-2"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isExporting ? "Exporting…" : "Export CSV"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {fanEmailsLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading fan access…
            </div>
          ) : fanEmailsError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <div className="flex gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p>
                  We could not load your eligible fan contacts. No contact
                  details are shown.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => refetchFanEmails()}
              >
                Try again
              </Button>
            </div>
          ) : followerCount === 0 ? (
            <div className="py-6 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 opacity-30" />
              <p className="mb-2 text-sm text-slate-600">No followers yet</p>
              <p className="text-xs text-muted-foreground">
                Share your profile to build your audience. Following alone never
                shares a fan’s email.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {hasPaidAccess ? (
                <>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                    Only fans who separately opted in, have a verified email,
                    and have not globally blocked creator updates are included.
                    Exported contacts may be used outside OlogyWood; honor
                    removals for any list you exported. Exports are limited to
                    up to 10,000 contacts.
                  </div>
                  {eligibleCount === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      <Mail className="mx-auto mb-2 h-6 w-6 opacity-50" />
                      No followers have opted in to creator email updates yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {fanEmailList.map((fan: any, index: number) => (
                        <div
                          key={fan.id || `${fan.email}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <UserCheck className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {fan.name || "Fan"}
                              </p>
                              <p className="flex truncate items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3 shrink-0" />
                                {fan.email}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {fan.followedAt
                              ? new Date(fan.followedAt).toLocaleDateString()
                              : "Recently"}
                          </span>
                        </div>
                      ))}
                      {eligibleCount > fanEmailList.length && (
                        <p className="text-center text-xs text-muted-foreground">
                          Showing {fanEmailList.length} of{" "}
                          {eligibleCount.toLocaleString()} eligible contacts.
                          CSV export includes up to 10,000.
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
                  <div className="flex items-start gap-3">
                    <Crown className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Unlock consent-eligible fan emails
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Paid creators can view, export (up to 10,000), and send
                        updates only to followers who separately gave
                        permission. Following does not provide an email address.
                      </p>
                      <Button
                        size="sm"
                        className="mt-3 gap-2"
                        onClick={() => navigate("/pricing")}
                      >
                        <Crown className="h-3.5 w-3.5" />
                        View Plans
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {!hasPaidAccess && (
                <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Follower count is separate from email permission.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <SendUpdateDialog
        open={sendUpdateOpen}
        onOpenChange={setSendUpdateOpen}
        eligibleCount={eligibleCount}
      />
    </>
  );
}
