import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Copy, Share2, TrendingUp } from "lucide-react";

export function ReferralDashboard() {
  const [copied, setCopied] = useState(false);

  const referralCode = "GARY2025";
  const stats = {
    balance: "$125.50",
    totalEarned: "$325.50",
    totalReferrals: 5,
    completedReferrals: 3,
    nextMilestone: 2,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const shareText = `Join me on Ologywood! Use my referral code ${referralCode} to get $25 credit. Book amazing artists and venues!`;
    if (navigator.share) {
      navigator.share({
        title: "Ologywood Referral",
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balance Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available Credits</p>
              <p className="text-3xl font-bold text-purple-600">{stats.balance}</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </Card>

        {/* Total Earned Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earned</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalEarned}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        {/* Referrals Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Referrals</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalReferrals}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.completedReferrals} completed</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </Card>
      </div>

      {/* Referral Code Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Your Referral Code</h3>
        <div className="flex gap-3 items-center">
          <div className="flex-1 bg-gray-100 p-4 rounded-lg">
            <p className="text-2xl font-mono font-bold text-purple-600">{referralCode}</p>
            <p className="text-sm text-gray-600 mt-1">Share this code to earn $25 per referral</p>
          </div>
          <Button
            onClick={handleCopyCode}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            onClick={handleShare}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </Card>

      {/* Progress to Next Milestone */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Next Milestone</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Earn $50 more to unlock "Top Referrer" badge</p>
            <p className="text-sm text-gray-600">${stats.nextMilestone} away</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${(parseFloat(stats.balance.replace("$", "")) / 50) * 100}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* How It Works */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">How It Works</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-semibold">1</span>
            </div>
            <div>
              <p className="font-medium">Share Your Code</p>
              <p className="text-sm text-gray-600">Share your referral code with friends and artists</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-semibold">2</span>
            </div>
            <div>
              <p className="font-medium">They Sign Up</p>
              <p className="text-sm text-gray-600">They use your code during registration</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-semibold">3</span>
            </div>
            <div>
              <p className="font-medium">You Earn Credits</p>
              <p className="text-sm text-gray-600">Get $25 for each successful referral</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
