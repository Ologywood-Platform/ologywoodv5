import { useState } from 'react';

interface ReferralUser {
  id: number;
  name: string;
  referralCode: string;
  referralCount: number;
  totalRewards: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  joinedDate: Date;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  referrals: number;
  rewards: number;
  tier: string;
}

export default function ReferralProgram() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'rewards'>('overview');

  const currentUser: ReferralUser = {
    id: 1,
    name: 'Gary Chisolm',
    referralCode: 'GARY2026',
    referralCount: 12,
    totalRewards: 240,
    tier: 'gold',
    joinedDate: new Date('2026-01-30'),
  };

  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, name: 'Sarah Johnson', referrals: 45, rewards: 900, tier: 'platinum' },
    { rank: 2, name: 'Michael Chen', referrals: 38, rewards: 760, tier: 'gold' },
    { rank: 3, name: 'Gary Chisolm', referrals: 12, rewards: 240, tier: 'gold' },
    { rank: 4, name: 'Emma Davis', referrals: 8, rewards: 160, tier: 'silver' },
    { rank: 5, name: 'James Wilson', referrals: 5, rewards: 100, tier: 'bronze' },
  ];

  const rewards = [
    { tier: 'bronze', min: 1, max: 5, bonus: '$20 credit', perks: 'Basic support' },
    { tier: 'silver', min: 6, max: 15, bonus: '$50 credit', perks: 'Priority support' },
    { tier: 'gold', min: 16, max: 30, bonus: '$150 credit', perks: 'Premium support + featured badge' },
    { tier: 'platinum', min: 31, max: Infinity, bonus: '$300+ credit', perks: 'VIP support + featured profile + exclusive events' },
  ];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentUser.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
    };
    return colors[tier] || '#999';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Referral Program</h1>
        <p className="text-slate-600 mb-8">Earn rewards by inviting artists and venues to Ologywood</p>

        {/* Referral Code Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Your Referral Code</h2>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold">{currentUser.referralCode}</div>
            <button
              onClick={handleCopyCode}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-slate-100 transition"
            >
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
          </div>
          <p className="mt-4 text-blue-100">Share this code with friends to earn rewards</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-semibold mb-2">REFERRALS</p>
            <p className="text-3xl font-bold text-slate-900">{currentUser.referralCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-semibold mb-2">TOTAL REWARDS</p>
            <p className="text-3xl font-bold text-green-600">${currentUser.totalRewards}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-semibold mb-2">CURRENT TIER</p>
            <p className="text-3xl font-bold" style={{ color: getTierColor(currentUser.tier) }}>
              {currentUser.tier.toUpperCase()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-semibold mb-2">PROGRESS TO NEXT</p>
            <p className="text-3xl font-bold text-slate-900">18/30</p>
            <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b border-slate-200">
            {(['overview', 'leaderboard', 'rewards'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-4 font-semibold transition ${
                  activeTab === tab
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900">How It Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-slate-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-500 mb-2">1</div>
                    <h4 className="font-semibold text-slate-900 mb-2">Share Your Code</h4>
                    <p className="text-slate-600">Share your unique referral code with friends and colleagues</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-500 mb-2">2</div>
                    <h4 className="font-semibold text-slate-900 mb-2">They Sign Up</h4>
                    <p className="text-slate-600">They use your code when creating their Ologywood account</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-500 mb-2">3</div>
                    <h4 className="font-semibold text-slate-900 mb-2">Earn Rewards</h4>
                    <p className="text-slate-600">You earn $20 per successful referral + tier bonuses</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6">Top Referrers</h3>
                <div className="space-y-3">
                  {leaderboard.map(entry => (
                    <div
                      key={entry.rank}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ background: getTierColor(entry.tier) }}
                        >
                          {entry.rank}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{entry.name}</p>
                          <p className="text-sm text-slate-600">{entry.tier.toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{entry.referrals} referrals</p>
                        <p className="text-sm text-green-600">${entry.rewards} earned</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'rewards' && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6">Reward Tiers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {rewards.map(reward => (
                    <div
                      key={reward.tier}
                      className="p-6 rounded-lg border-2"
                      style={{
                        borderColor: getTierColor(reward.tier),
                        background: `${getTierColor(reward.tier)}10`,
                      }}
                    >
                      <h4
                        className="text-lg font-bold mb-4 uppercase"
                        style={{ color: getTierColor(reward.tier) }}
                      >
                        {reward.tier}
                      </h4>
                      <p className="text-sm text-slate-600 mb-4">
                        {reward.min}-{reward.max === Infinity ? '∞' : reward.max} referrals
                      </p>
                      <div className="mb-4 pb-4 border-b border-slate-300">
                        <p className="text-sm font-semibold text-slate-900">Bonus</p>
                        <p className="text-2xl font-bold" style={{ color: getTierColor(reward.tier) }}>
                          {reward.bonus}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mb-2">Perks</p>
                      <p className="text-sm text-slate-600">{reward.perks}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Share Buttons */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Share Your Code</h3>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition">
              Share on Facebook
            </button>
            <button className="px-6 py-3 bg-sky-400 text-white rounded-lg hover:bg-sky-500 font-semibold transition">
              Share on Twitter
            </button>
            <button className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-semibold transition">
              Share on LinkedIn
            </button>
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition">
              Share on WhatsApp
            </button>
            <button className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-semibold transition">
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
