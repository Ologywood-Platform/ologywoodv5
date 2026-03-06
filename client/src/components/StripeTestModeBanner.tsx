import { useState } from 'react';
import { AlertTriangle, Copy, Check, X } from 'lucide-react';

/**
 * StripeTestModeBanner: Displays a prominent banner with test card info
 * when Stripe is running in test mode.
 * 
 * Automatically detects test mode by checking the VITE_STRIPE_PUBLISHABLE_KEY.
 * When Stripe goes live, this banner disappears automatically — no code changes needed.
 */

const isTestMode = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').startsWith('pk_test_');

export function StripeTestModeBanner() {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't show in live mode or if dismissed
  if (!isTestMode || dismissed) return null;

  const copyCardNumber = async () => {
    try {
      await navigator.clipboard.writeText('4242424242424242');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const input = document.createElement('input');
      input.value = '4242424242424242';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <div>
              <p className="font-semibold text-amber-800 text-sm">Stripe Test Mode</p>
              <p className="text-amber-700 text-sm mt-0.5">
                No real charges will be made. Use the test card below for all payments.
              </p>
            </div>
            <div className="bg-white border border-amber-200 rounded-md px-3 py-2 inline-flex items-center gap-3">
              <div className="text-sm">
                <span className="text-gray-500">Card:</span>{' '}
                <code className="font-mono font-semibold text-gray-900">4242 4242 4242 4242</code>
              </div>
              <div className="text-sm text-gray-400">|</div>
              <div className="text-sm">
                <span className="text-gray-500">Exp:</span>{' '}
                <code className="font-mono text-gray-700">12/28</code>
              </div>
              <div className="text-sm text-gray-400">|</div>
              <div className="text-sm">
                <span className="text-gray-500">CVC:</span>{' '}
                <code className="font-mono text-gray-700">123</code>
              </div>
              <button
                onClick={copyCardNumber}
                className="ml-1 p-1 rounded hover:bg-amber-50 transition-colors"
                title="Copy card number"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-amber-100 transition-colors flex-shrink-0"
          title="Dismiss"
        >
          <X className="w-4 h-4 text-amber-600" />
        </button>
      </div>
    </div>
  );
}
