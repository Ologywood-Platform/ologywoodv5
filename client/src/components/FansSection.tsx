/**
 * FansSection Component
 * Displays fan/follower information on the Artist Dashboard.
 * 
 * Free tier: Shows follower count, recent followers (names only, emails blurred)
 * Paid tier: Shows full fan list with emails, export to CSV, and "Send Update" button
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Lock, Download, Crown, Mail, UserCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { SendUpdateDialog } from "./SendUpdateDialog";

interface FansSectionProps {
  artistUserId?: number;
}

export function FansSection({ artistUserId }: FansSectionProps) {
  const [, navigate] = useLocation();
  const [sendUpdateOpen, setSendUpdateOpen] = useState(false);

  // Get follow stats
  const { data: stats } = trpc.follows.getStats.useQuery(
    { userId: artistUserId! },
    { enabled: !!artistUserId }
  );

  // Get fan followers list
  const { data: followers } = trpc.follows.getFollowers.useQuery(
    { userId: artistUserId!, limit: 10 },
    { enabled: !!artistUserId }
  );

  // Try to get fan emails (will fail for free tier)
  const { data: fanEmails, error: emailError } = trpc.follows.getFanEmails.useQuery(
    { limit: 100 },
    { enabled: !!artistUserId, retry: false }
  );

  const followerCount = stats?.followersCount ?? 0;
  const hasPaidAccess = !emailError && fanEmails?.hasAccess === true;
  const fanEmailList = hasPaidAccess && fanEmails?.fans ? fanEmails.fans : [];

  const handleExportCSV = () => {
    if (!fanEmailList || fanEmailList.length === 0) {
      toast.error("No fan emails to export");
      return;
    }

    const csvContent = [
      "Name,Email,Followed Since",
      ...fanEmailList.map((fan: any) => 
        `"${fan.name || 'Fan'}","${fan.email}","${new Date(fan.followedAt).toLocaleDateString()}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fan-emails-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${fanEmailList.length} fan emails`);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Fans
              </CardTitle>
              <CardDescription>
                {followerCount} {followerCount === 1 ? "person" : "people"} following you
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {hasPaidAccess && followerCount > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSendUpdateOpen(true)}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Update
                </Button>
              )}
              {hasPaidAccess && fanEmailList.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {followerCount === 0 ? (
            <div className="text-center py-6">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm text-slate-600 mb-2">No fans yet</p>
              <p className="text-xs text-muted-foreground">
                Share your profile to start building your fan base. When fans follow you, they'll appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Fan List */}
              <div className="space-y-2">
                {followers?.map((follower: any, index: number) => (
                  <div
                    key={follower.id || index}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{follower.name || "Fan"}</p>
                        {hasPaidAccess ? (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {follower.email || "No email"}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            <span className="blur-sm select-none">email@hidden.com</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {follower.createdAt
                        ? new Date(follower.createdAt).toLocaleDateString()
                        : "Recently"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Upgrade Prompt for Free Tier */}
              {!hasPaidAccess && (
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Crown className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Unlock Fan Email List & Updates
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upgrade to a paid plan to access your fans' email addresses, export them as CSV, 
                        and send direct updates to your audience.
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

              {/* Fan Count Summary */}
              {followerCount > 10 && (
                <p className="text-xs text-center text-muted-foreground">
                  Showing 10 of {followerCount} fans
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Update Dialog */}
      <SendUpdateDialog
        open={sendUpdateOpen}
        onOpenChange={setSendUpdateOpen}
        followerCount={followerCount}
      />
    </>
  );
}
