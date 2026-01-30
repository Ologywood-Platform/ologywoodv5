import React, { useState } from 'react';
import { Copy, Share2, TrendingUp, DollarSign, Users, Gift, CheckCircle } from 'lucide-react';

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  referralCode: string;
  referralLink: string;
}

interface ReferralRecord {
  id: string;
  referredName: string;
  referredEmail: string;
  status: 'pending' | 'completed' | 'paid';
  referralDate: Date;
  completionDate?: Date;
  earningsAmount: number;
  tier: 'basic' | 'premium';
}

interface ReferralRewardsDashboardProps {
  stats?: ReferralStats;
  referrals?: ReferralRecord[];
}

export function ReferralRewardsDashboard({ 
  stats = {
    totalReferrals: 12,
    successfulReferrals: 8,
    totalEarnings: 480,
    pendingEarnings: 90,
    referralCode: 'ARTIST2024',
    referralLink: 'https://ologywood.com/ref/ARTIST2024',
  },
  referrals = [],
}: ReferralRewardsDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'payouts'>('overview');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(stats.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Ologywood',
        text: 'Join Ologywood and get exclusive benefits!',
        url: stats.referralLink,
      });
    }
  };

  const conversionRate = stats.totalReferrals > 0 
    ? Math.round((stats.successfulReferrals / stats.totalReferrals) * 100) 
    : 0;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 sm:p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="h-8 w-8" />
          <h1 className="text-3xl sm:text-4xl font-bold">Referral Rewards</h1>
        </div>
        <p className="text-purple-100">Earn money by referring friends and colleagues to Ologywood</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm mb-2">Total Referrals</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalReferrals}</p>
          <p className="text-xs text-gray-500 mt-2">{conversionRate}% conversion</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm mb-2">Successful</p>
          <p className="text-3xl font-bold text-green-600">{stats.successfulReferrals}</p>
          <p className="text-xs text-gray-500 mt-2">Active users</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-gray-600" />
            <p className="text-gray-600 text-sm">Total Earned</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">${stats.totalEarnings}</p>
          <p className="text-xs text-gray-500 mt-2">All time</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm mb-2">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">${stats.pendingEarnings}</p>
          <p className="text-xs text-gray-500 mt-2">Next payout</p>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Your Referral Link</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-white rounded-lg border border-gray-300 px-4 py-3 flex items-center gap-2 overflow-x-auto">
            <span className="text-sm text-gray-600 truncate">{stats.referralLink}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleShareLink}
            className="px-4 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`py-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'referrals'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Referrals
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`py-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'payouts'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Payouts
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">How It Works</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Share Your Link</p>
                  <p className="text-sm text-gray-600">Send your unique referral link to friends and colleagues</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">They Sign Up</p>
                  <p className="text-sm text-gray-600">Your friend creates an account using your link</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">They Upgrade</p>
                  <p className="text-sm text-gray-600">When they upgrade to Basic or Premium, you earn a commission</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                  4
                </div>
                <div>
                  <p className="font-medium text-gray-900">Get Paid</p>
                  <p className="text-sm text-gray-600">Earn 10% commission on their first year subscription</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg border border-green-200 p-6">
            <h3 className="font-semibold text-green-900 mb-3">Commission Structure</h3>
            <div className="space-y-2 text-sm text-green-800">
              <p>• <strong>Basic Plan ($9/mo):</strong> Earn $10.80/year per referral</p>
              <p>• <strong>Premium Plan ($29/mo):</strong> Earn $34.80/year per referral</p>
              <p>• <strong>Lifetime Earnings:</strong> Continue earning as long as they stay subscribed</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'referrals' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {referrals.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">No referrals yet</p>
              <p className="text-sm text-gray-500">Start sharing your link to earn rewards!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tier</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{ref.referredName}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{ref.referredEmail}</td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            ref.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : ref.status === 'paid'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          <CheckCircle className="h-3 w-3" />
                          {ref.status.charAt(0).toUpperCase() + ref.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900 capitalize">{ref.tier}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900">${ref.earningsAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payout Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Next Payout Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Payout Method</p>
                <p className="text-lg font-semibold text-gray-900">Direct Bank Transfer</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Minimum Payout Threshold</p>
                <p className="text-lg font-semibold text-gray-900">$50</p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Current Balance</p>
                <p className="text-3xl font-bold text-green-600">${stats.pendingEarnings}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Payout Schedule</h3>
            <p className="text-sm text-blue-800 mb-3">
              Payouts are processed on the 1st and 15th of each month for balances over $50.
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Update Payout Method
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
