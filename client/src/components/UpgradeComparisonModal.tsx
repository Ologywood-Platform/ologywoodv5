import { Button } from '@/components/ui/button';
import { Check, X, ArrowRight, Loader2 } from 'lucide-react';

interface Feature {
  name: string;
  free: boolean;
  starter: boolean;
  professional: boolean;
}

const COMPARISON_FEATURES: Feature[] = [
  { name: 'Artist or venue profile', free: true, starter: true, professional: true },
  { name: 'Browse & messaging', free: true, starter: true, professional: true },
  { name: 'Availability calendar', free: true, starter: true, professional: true },
  { name: 'Follow artists & events', free: true, starter: true, professional: true },
  { name: 'Booking requests', free: false, starter: true, professional: true },
  { name: 'Rider Builder & templates', free: false, starter: true, professional: true },
  { name: 'Fan email list & Send Update', free: false, starter: true, professional: true },
  { name: 'White Label Releases', free: false, starter: true, professional: true },
  { name: 'Contracts & e-signatures', free: false, starter: false, professional: true },
  { name: 'Analytics dashboard', free: false, starter: false, professional: true },
  { name: 'Priority support', free: false, starter: false, professional: true },
  { name: 'Featured profile & branding', free: false, starter: false, professional: true },
  { name: 'Bulk messaging', free: false, starter: false, professional: true },
];

interface UpgradeComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  targetPlan: 'starter' | 'professional';
  currentTier: string;
  billingInterval: 'month' | 'year';
}

export function UpgradeComparisonModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  targetPlan,
  currentTier,
  billingInterval,
}: UpgradeComparisonModalProps) {
  if (!isOpen) return null;

  const isYearly = billingInterval === 'year';
  const planLabel = targetPlan === 'starter' ? 'Starter' : 'Professional';
  const priceLabel = targetPlan === 'starter'
    ? (isYearly ? '$7.50/mo (billed $90/year)' : '$9/month')
    : (isYearly ? '$24.17/mo (billed $290/year)' : '$29/month');

  // Determine which features are NEW for the target plan vs current tier
  const getNewFeatures = () => {
    return COMPARISON_FEATURES.filter((f) => {
      const hasNow = currentTier === 'starter' ? f.starter : f.free;
      const willHave = targetPlan === 'starter' ? f.starter : f.professional;
      return willHave && !hasNow;
    });
  };

  const newFeatures = getNewFeatures();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            Upgrade to {planLabel}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {priceLabel}
            {isYearly && <span className="ml-2 text-green-600 font-medium">2 months free</span>}
          </p>
        </div>

        {/* New features you'll unlock */}
        <div className="p-6">
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

          {/* Quick comparison table */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-2 text-xs text-center mb-2">
              <div className="font-medium text-gray-500">Free</div>
              <div className="font-medium text-gray-500">Starter</div>
              <div className="font-medium text-gray-500">Professional</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="text-sm font-semibold text-gray-400">$0</div>
              <div className={`text-sm font-semibold ${targetPlan === 'starter' ? 'text-blue-600' : 'text-gray-400'}`}>
                {isYearly ? '$7.50/mo' : '$9/mo'}
              </div>
              <div className={`text-sm font-semibold ${targetPlan === 'professional' ? 'text-purple-600' : 'text-gray-400'}`}>
                {isYearly ? '$24.17/mo' : '$29/mo'}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mt-1">
              <div className="text-[10px] text-gray-400">2 bookings/mo</div>
              <div className="text-[10px] text-gray-400">Unlimited</div>
              <div className="text-[10px] text-gray-400">Unlimited + contracts</div>
            </div>
          </div>

          {targetPlan === 'professional' && billingInterval === 'month' && (
            <p className="text-xs text-indigo-600 mt-3 font-medium text-center">
              Includes 14-day free trial — you won't be charged today
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-2 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
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
