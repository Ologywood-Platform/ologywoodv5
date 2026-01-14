import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { TrendingUp, Share2, Copy, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface ReferralStats {
  balance: string;
  totalEarned: string;
  totalReferrals: number;
  completedReferrals: number;
  referralCode: string;
}

interface ReferralWidgetProps {
  stats?: ReferralStats;
  onViewDetails?: () => void;
}

export function ReferralWidget({ stats, onViewDetails }: ReferralWidgetProps) {
  const [copied, setCopied] = useState(false);

  // Default stats if not provided
  const defaultStats: ReferralStats = {
    balance: "$0.00",
    totalEarned: "$0.00",
    totalReferrals: 0,
    completedReferrals: 0,
    referralCode: "LOADING",
  };

  const data = stats || defaultStats;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const shareText = `Join me on Ologywood! Use my referral code ${data.referralCode} to get $25 credit. Book amazing artists and venues!`;
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
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Referral Program</h3>
        </div>
        <Link href="/referrals">
          <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-purple-100">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Available</p>
          <p className="text-xl font-bold text-purple-600">{data.balance}</p>
        </div>
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Earned</p>
          <p className="text-xl font-bold text-green-600">{data.totalEarned}</p>
        </div>
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Referrals</p>
          <p className="text-xl font-bold text-blue-600">{data.totalReferrals}</p>
        </div>
      </div>

      {/* Referral Code Section */}
      <div className="bg-white rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-600 mb-2">Your Code</p>
        <div className="flex items-center gap-2">
          <code className="text-lg font-mono font-bold text-purple-600 flex-1">
            {data.referralCode}
          </code>
          <Button
            onClick={handleCopyCode}
            size="sm"
            variant="outline"
            className="px-2"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleShare}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          size="sm"
        >
          <Share2 className="w-4 h-4 mr-1" />
          Share
        </Button>
        <Link href="/referrals" className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            Details
          </Button>
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-medium text-gray-700">
            {data.completedReferrals} of {data.totalReferrals} completed
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full transition-all"
            style={{
              width: `${data.totalReferrals > 0 ? (data.completedReferrals / data.totalReferrals) * 100 : 0}%`,
            }}
          ></div>
        </div>
      </div>

      {copied && (
        <div className="mt-3 p-2 bg-green-100 text-green-800 text-xs rounded">
          ✓ Code copied to clipboard!
        </div>
      )}
    </Card>
  );
}

/**
 * Referral Performance Chart Component
 */
export function ReferralPerformanceChart({
  monthlyData,
}: {
  monthlyData?: Array<{ month: string; referrals: number; earnings: number }>;
}) {
  const defaultData = [
    { month: "Jan", referrals: 2, earnings: 50 },
    { month: "Feb", referrals: 3, earnings: 75 },
    { month: "Mar", referrals: 5, earnings: 125 },
  ];

  const data = monthlyData || defaultData;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Monthly Performance</h3>

      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.month}>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium text-gray-700">{item.month}</p>
              <p className="text-sm text-gray-600">
                {item.referrals} referrals • ${item.earnings}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                style={{ width: `${Math.min((item.referrals / 5) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-600">
          💡 Tip: Share your code on social media to increase referrals
        </p>
      </div>
    </Card>
  );
}
