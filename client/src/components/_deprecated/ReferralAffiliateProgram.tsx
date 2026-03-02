import React, { useState } from 'react';
import { Copy, Share2, TrendingUp, DollarSign, Users, Gift } from 'lucide-react';

interface AffiliateAccount {
  totalReferrals: number;
  successfulReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  commissionRate: number;
}

interface ReferralRecord {
  id: string;
  referredUserName: string;
  referredUserType: 'artist' | 'venue';
  status: 'pending' | 'completed' | 'expired';
  commissionAmount: number;
  createdAt: Date;
}

interface ReferralAffiliateProgramProps {
  account: AffiliateAccount;
  referrals: ReferralRecord[];
  referralCode: string;
  onCopyCode: (code: string) => void;
  onShareCode: (code: string) => void;
}

export const ReferralAffiliateProgram: React.FC<ReferralAffiliateProgramProps> = ({
  account,
  referrals,
  referralCode,
  onCopyCode,
  onShareCode,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    onCopyCode(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-t-lg">
        <h1 className="text-4xl font-bold mb-2">Earn Money Referring Artists & Venues</h1>
        <p className="text-purple-100 text-lg">
          Get 10-15% commission on every successful booking from your referrals
        </p>
      </div>

      <div className="px-8 space-y-8">
        {/* Referral Code Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Referral Code</h2>
          <div className="flex gap-3">
            <div className="flex-1 bg-white border-2 border-purple-300 rounded-lg px-4 py-3 flex items-center">
              <code className="text-2xl font-bold text-purple-600">{referralCode}</code>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium flex items-center gap-2"
            >
              <Copy size={18} />
              {copiedCode ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={() => onShareCode(referralCode)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
            >
              <Share2 size={18} />
              Share
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Share this code with artists and venues. When they sign up and make their first booking, you
            earn a commission!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-600 font-medium">Total Referrals</h3>
              <Users className="text-blue-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{account.totalReferrals}</p>
            <p className="text-sm text-gray-500 mt-1">{account.successfulReferrals} successful</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-600 font-medium">Total Earnings</h3>
              <DollarSign className="text-green-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">${account.totalEarnings.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-600 font-medium">Pending Earnings</h3>
              <TrendingUp className="text-yellow-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">${account.pendingEarnings.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Ready to payout</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-600 font-medium">Commission Rate</h3>
              <Gift className="text-purple-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{account.commissionRate}%</p>
            <p className="text-sm text-gray-500 mt-1">Per booking</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: 1, title: 'Share Code', desc: 'Share your referral code with artists & venues' },
              { step: 2, title: 'They Sign Up', desc: 'They create an account using your code' },
              { step: 3, title: 'First Booking', desc: 'They make their first booking on the platform' },
              { step: 4, title: 'You Earn', desc: 'Receive 10-15% commission automatically' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mx-auto mb-2">
                  {step}
                </div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referrals List */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Referrals</h2>

          {referrals.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Users className="mx-auto text-gray-400 mb-3" size={32} />
              <p className="text-gray-600">No referrals yet. Start sharing your code!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div key={referral.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{referral.referredUserName}</p>
                    <p className="text-sm text-gray-600">
                      {referral.referredUserType === 'artist' ? '🎤 Artist' : '🎪 Venue'} •{' '}
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(referral.status)}`}>
                      {referral.status}
                    </span>
                    {referral.status === 'completed' && (
                      <p className="text-lg font-bold text-green-600 mt-2">
                        +${referral.commissionAmount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout Settings */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payout Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payout Schedule</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account</label>
              <p className="text-sm text-gray-600 mb-3">Add your bank account to receive payouts</p>
              <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
                Add Bank Account
              </button>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
          <strong>Program Terms:</strong> Commissions are paid 30 days after the booking is completed. Referrals
          must sign up using your code and complete their first booking within 90 days. Fraudulent referrals will
          be detected and removed.
        </div>
      </div>
    </div>
  );
};

export default ReferralAffiliateProgram;
