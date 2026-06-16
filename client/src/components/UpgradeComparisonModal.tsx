import { Button } from '@/components/ui/button';
import { Check, X, ArrowRight, ArrowDown, Loader2, AlertTriangle, Sparkles } from 'lucide-react';

interface Feature {
  name: string;
  free: boolean;
  starter: boolean;
  professional: boolean;
  enterprise: boolean;
}

const COMPARISON_FEATURES: Feature[] = [
  { name: 'Artist or venue profile', free: true, starter: true, professional: true, enterprise: true },
  { name: 'Browse & messaging', free: true, starter: true, professional: true, enterprise: true },
  { name: 'Availability calendar', free: true, starter: true, professional: true, enterprise: true },
  { name: 'Follow artists & events', free: true, starter: true, professional: true, enterprise: true },
  { name: 'Booking requests', free: false, starter: true, professional: true, enterprise: true },
  { name: 'Rider Builder & templates', free: false, starter: true, professional: true, enterprise: true },
  { name: 'Fan email list & Send Update', free: false, starter: true, professional: true, enterprise: true },
  { name: 'White Label Releases', free: false, starter: true, professional: true, enterprise: true },
  { name: 'Contracts & e-signatures', free: false, starter: false, professional: true, enterprise: true },
  { name: 'Analytics dashboard', free: false, starter: false, professional: true, enterprise: true },
  { name: 'Priority support', free: false, starter: false, professional: true, enterprise: true },
  { name: 'Featured profile & branding', free: false, starter: false, professional: true, enterprise: true },
  { name: 'Bulk messaging', free: false, starter: false, professional: true, enterprise: true },
  { name: 'Sponsor Showcase (5 slots)', free: false, starter: false, professional: false, enterprise: true },
  { name: 'Sponsor Analytics & CTR', free: false, starter: false, professional: false, enterprise: true },
  { name: 'Auto-generated Media Kit', free: false, starter: false, professional: false, enterprise: true },
];

// Tier hierarchy for determining upgrade vs downgrade
const TIER_RANK: Record<string, number> = { free: 0, starter: 1, professional: 2, enterprise: 3 };

interface UpgradeComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSwitchToYearly?: () => void;
  isLoading: boolean;
  targetPlan: 'starter' | 'professional' | 'enterprise';
  currentTier: string;
  billingInterval: 'month' | 'year';
  creditBalance?: number;
  useCredits?: boolean;
  onToggleCredits?: (value: boolean) => void;
}

export function UpgradeComparisonModal({
  isOpen,
  onClose,
  onConfirm,
  onSwitchToYearly,
  isLoading,
  targetPlan,
  currentTier,
  billingInterval,
  creditBalance = 0,
  useCredits = false,
  onToggleCredits,
}: UpgradeComparisonModalProps) {
  if (!isOpen) return null;

  const isYearly = billingInterval === 'year';
  const isDowngrade = TIER_RANK[targetPlan] < TIER_RANK[currentTier];
  const planLabel = targetPlan === 'starter' ? 'Starter' : targetPlan === 'enterprise' ? 'Enterprise' : 'Professional';
  const priceLabel = targetPlan === 'starter'
    ? (isYearly ? '$7.50/mo (billed $90/year)' : '$9/month')
    : targetPlan === 'enterprise'
      ? (isYearly ? '$65.83/mo (billed $790/year)' : '$79/month')
      : (isYearly ? '$24.17/mo (billed $290/year)' : '$29/month');

  const getTierValue = (f: Feature, tier: string) => {
    if (tier === 'enterprise') return f.enterprise;
    if (tier === 'professional') return f.professional;
    if (tier === 'starter') return f.starter;
    return f.free;
  };

  // Features the user will GAIN (for upgrades)
  const getNewFeatures = () => {
    return COMPARISON_FEATURES.filter((f) => {
      const hasNow = getTierValue(f, currentTier);
      const willHave = getTierValue(f, targetPlan);
      return willHave && !hasNow;
    });
  };

  // Features the user will LOSE (for downgrades)
  const getLostFeatures = () => {
    return COMPARISON_FEATURES.filter((f) => {
      const hasNow = getTierValue(f, currentTier);
      const willHave = getTierValue(f, targetPlan);
      return hasNow && !willHave;
    });
  };

  const newFeatures = getNewFeatures();
  const lostFeatures = getLostFeatures();

  // Annual savings calculation for the nudge
  const monthlySavings = targetPlan === 'starter' ? 18 : targetPlan === 'enterprise' ? 158 : 58;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-6 pb-4 border-b ${isDowngrade ? 'border-amber-100 bg-amber-50/50' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2">
            {isDowngrade && <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />}
            <h2 className="text-xl font-bold text-gray-900">
              {isDowngrade ? `Downgrade to ${planLabel}` : `Upgrade to ${planLabel}`}
            </h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {priceLabel}
            {isYearly && <span className="ml-2 text-green-600 font-medium">2 months free</span>}
          </p>
        </div>

        <div className="p-6">
          {/* DOWNGRADE: Show features they'll lose */}
          {isDowngrade && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
                <p className="text-sm text-amber-800 font-medium">
                  You'll lose access to these features:
                </p>
              </div>
              <div className="space-y-2.5 mb-5">
                {lostFeatures.map((feature) => (
                  <div key={feature.name} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <X className="w-3 h-3 text-red-500" />
                    </div>
                    <span className="text-sm text-gray-700 line-through">{feature.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Your existing data (contracts, analytics history) will be preserved but inaccessible until you upgrade again.
              </p>
            </>
          )}

          {/* UPGRADE: Show features they'll gain */}
          {!isDowngrade && (
            <>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                What you'll unlock
              </h3>
              <div className="space-y-2.5">
                {newFeatures.map((feature) => (
                  <div key={feature.name} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-800">{feature.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Quick comparison table */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-4 gap-2 text-xs text-center mb-2">
              <div className="font-medium text-gray-500">Free</div>
              <div className="font-medium text-gray-500">Starter</div>
              <div className="font-medium text-gray-500">Professional</div>
              <div className="font-medium text-gray-500">Enterprise</div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="text-sm font-semibold text-gray-400">$0</div>
              <div className={`text-sm font-semibold ${targetPlan === 'starter' ? 'text-blue-600' : 'text-gray-400'}`}>
                {isYearly ? '$7.50/mo' : '$9/mo'}
              </div>
              <div className={`text-sm font-semibold ${targetPlan === 'professional' ? 'text-purple-600' : 'text-gray-400'}`}>
                {isYearly ? '$24.17/mo' : '$29/mo'}
              </div>
              <div className={`text-sm font-semibold ${targetPlan === 'enterprise' ? 'text-amber-600' : 'text-gray-400'}`}>
                {isYearly ? '$65.83/mo' : '$79/mo'}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center mt-1">
              <div className="text-[10px] text-gray-400">2 bookings/mo</div>
              <div className="text-[10px] text-gray-400">Unlimited</div>
              <div className="text-[10px] text-gray-400">+ contracts</div>
              <div className="text-[10px] text-gray-400">+ sponsors</div>
            </div>
          </div>

          {/* Annual savings nudge — only shown when monthly is selected */}
          {!isYearly && !isDowngrade && onSwitchToYearly && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-green-800 font-medium">
                    Save ${monthlySavings}/year with yearly billing
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    That's 2 months free — same plan, better price.
                  </p>
                </div>
              </div>
              <button
                onClick={onSwitchToYearly}
                className="mt-2.5 w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Switch to Yearly & Save
              </button>
            </div>
          )}

          {targetPlan === 'professional' && billingInterval === 'month' && !isDowngrade && (
            <p className="text-xs text-indigo-600 mt-3 font-medium text-center">
              Includes 14-day free trial — you won't be charged today
            </p>
          )}
        </div>

        {/* Redeem Credits Toggle */}
        {creditBalance > 0 && !isDowngrade && onToggleCredits && (
          <div className="px-6 pb-2">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-purple-800">
                    Apply ${creditBalance.toFixed(2)} referral credit
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={useCredits}
                    onChange={(e) => onToggleCredits(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-checked:bg-purple-600 rounded-full transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </div>
              </label>
              {useCredits && (
                <p className="text-xs text-purple-600 mt-1">
                  Your credit will be applied as a discount at checkout
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 pt-2 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            {isDowngrade ? 'Keep Current Plan' : 'Cancel'}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 text-white ${
              isDowngrade
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : isDowngrade ? (
              <>
                Confirm Downgrade
                <ArrowDown className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Continue to Checkout
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
