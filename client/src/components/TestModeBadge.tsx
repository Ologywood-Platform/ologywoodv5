import { Shield, CreditCard } from 'lucide-react';

const TRIAL_END_DATE = new Date('2026-06-19T00:00:00');

interface TestModeBadgeProps {
  /** Show the test card number hint */
  showTestCard?: boolean;
  /** Compact mode for inline use */
  compact?: boolean;
}

export default function TestModeBadge({ showTestCard = false, compact = false }: TestModeBadgeProps) {
  // Hide after trial ends
  if (new Date() >= TRIAL_END_DATE) return null;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-medium">
        <Shield className="w-3 h-3" />
        Test Mode — No real charges
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Test Mode — No real charges
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            Payments are simulated during Early Access. No credit card will be charged.
          </p>
          {showTestCard && (
            <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-100 dark:bg-amber-900/40 w-fit">
              <CreditCard className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
              <span className="text-xs font-mono text-amber-800 dark:text-amber-200">
                4242 4242 4242 4242
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400">
                (any expiry & CVC)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
