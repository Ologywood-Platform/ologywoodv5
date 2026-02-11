import React, { useEffect, useState } from 'react';

export function Unsubscribe() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  useEffect(() => {
    // Parse URL parameters using native URLSearchParams
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');

    if (emailParam) {
      setEmail(emailParam);
      // Simulate unsubscribe process
      setTimeout(() => {
        setStatus('success');
        setMessage('You have been successfully unsubscribed from our mailing list.');
      }, 1500);
    } else {
      setStatus('error');
      setMessage('No email address provided. Please enter your email below to unsubscribe.');
    }
  }, []);

  const handleManualUnsubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!manualEmail) {
      setMessage('Please enter your email address.');
      return;
    }

    setStatus('loading');
    setEmail(manualEmail);

    // Simulate unsubscribe process
    setTimeout(() => {
      setStatus('success');
      setMessage('You have been successfully unsubscribed from our mailing list.');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Unsubscribe</h1>
          <p className="text-slate-600">Manage your email preferences</p>
        </div>

        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-600">Processing your request...</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center">
            <div className="mb-4 text-5xl">✓</div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">{message}</p>
              {email && (
                <p className="text-green-700 text-sm mt-2">Email: {email}</p>
              )}
            </div>
            <p className="text-slate-600 text-sm mb-6">
              You will no longer receive marketing emails from Ologywood. You may still receive transactional emails related to your account.
            </p>
            <a
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </a>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">{message}</p>
            </div>

            {/* Manual Unsubscribe Form */}
            <form onSubmit={handleManualUnsubscribe} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="your@email.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Unsubscribe
              </button>
            </form>

            <p className="text-slate-600 text-sm mt-4 text-center">
              Having trouble? Contact us at{' '}
              <a href="mailto:info@ologywood.com" className="text-blue-600 hover:underline">
                info@ologywood.com
              </a>
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-slate-500 text-xs">
            © 2026 Ologywood. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
