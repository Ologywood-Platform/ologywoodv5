import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

const TRIAL_END_DATE = new Date('2026-06-19T00:00:00');
const DISMISS_KEY = 'ologywood_early_access_dismissed';

export default function EarlyAccessBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Auto-hide after trial end date
    if (new Date() >= TRIAL_END_DATE) {
      return;
    }
    // Check if user dismissed it
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  if (!visible) return null;

  // Calculate days remaining
  const now = new Date();
  const diffMs = TRIAL_END_DATE.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return (
    <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white">
      <div className="max-w-7xl mx-auto px-4 pr-10 py-2.5 sm:py-2 flex items-center justify-center gap-2 sm:gap-3 text-center">
        <Sparkles className="w-4 h-4 flex-shrink-0 hidden sm:block" />
        <p className="text-xs sm:text-sm font-medium">
          <span className="font-semibold">Early Access</span>
          <span className="mx-1">·</span>
          <span>Free to use, no credit card required.</span>
          <span className="mx-1 hidden sm:inline">·</span>
          <span className="hidden sm:inline"> Live payments begin June 2026</span>
          <span className="text-purple-200 ml-1.5 hidden md:inline">({daysRemaining} days remaining)</span>
        </p>
        <button
          onClick={handleDismiss}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
