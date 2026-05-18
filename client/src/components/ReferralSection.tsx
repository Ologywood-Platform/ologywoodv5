import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Copy, Check, Gift, Users, DollarSign, Share2 } from "lucide-react";
import { useToast } from "@/components/ErrorToast";

export function ReferralSection() {
  const [copied, setCopied] = useState(false);
  const { addSuccess, addError } = useToast();

  const { data: codeData, isLoading: codeLoading } = trpc.referral.getMyCode.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.referral.getMyStats.useQuery();
  const { data: referralHistory } = trpc.referral.getMyReferrals.useQuery();

  const referralCode = codeData?.code || "";
  const referralLink = referralCode
    ? `${window.location.origin}/signup?ref=${referralCode}`
    : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      addSuccess("Copied", "Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addError("Error", "Failed to copy");
    }
  };

  const handleShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Ologywood",
          text: "Sign up with my referral link and get 50% off your first month!",
          url: referralLink,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  if (codeLoading || statsLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-400">
          Loading referral info...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-purple-600" />
          Refer & Earn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Value proposition */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
          <p className="text-sm text-gray-700 font-medium">
            Share your link and earn <span className="text-purple-700 font-bold">$5 credit</span> for every friend who signs up.
            They get <span className="text-green-700 font-bold">50% off</span> their first month!
          </p>
        </div>

        {/* Referral link */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">
            Your Referral Link
          </label>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 truncate font-mono">
              {referralLink || "Loading..."}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex-shrink-0"
              disabled={!referralLink}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex-shrink-0"
              disabled={!referralLink}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Users className="h-4 w-4 text-blue-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">
              {stats?.totalReferrals || 0}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Referred</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Check className="h-4 w-4 text-green-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">
              {stats?.convertedReferrals || 0}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Converted</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <DollarSign className="h-4 w-4 text-purple-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">
              ${stats?.creditBalance?.toFixed(2) || "0.00"}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Credits</div>
          </div>
        </div>

        {/* Recent referrals */}
        {referralHistory && referralHistory.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Recent Referrals
            </h4>
            <div className="space-y-2">
              {referralHistory.slice(0, 5).map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      ref.status === "completed" || ref.status === "rewarded"
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }`} />
                    <span className="text-sm text-gray-700">
                      {ref.referredName || ref.referredEmail || "User"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ref.rewardAmount && (
                      <span className="text-xs font-medium text-green-600">
                        +${ref.rewardAmount}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      ref.status === "completed" || ref.status === "rewarded"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {ref.status === "completed" || ref.status === "rewarded" ? "Converted" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
