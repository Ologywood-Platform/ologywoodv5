import React, { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

export function Unsubscribe() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const { isAuthenticated } = useAuth();

  const unsubscribeAllMutation = trpc.emailPreferences.unsubscribeAll.useMutation();

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');

    if (emailParam) {
      setEmail(emailParam);
    }

    // If user is authenticated, auto-unsubscribe
    if (isAuthenticated) {
      handleUnsubscribe();
    } else if (emailParam) {
      // Show confirmation for unauthenticated users with email param
      setStatus('idle');
      setMessage('Click the button below to confirm your unsubscription.');
    } else {
      setStatus('error');
      setMessage('Please log in to manage your email preferences, or use the unsubscribe link from your email.');
    }
  }, [isAuthenticated]);

  const handleUnsubscribe = async () => {
    setStatus('loading');
    try {
      await unsubscribeAllMutation.mutateAsync();
      setStatus('success');
      setMessage('You have been successfully unsubscribed from our mailing list.');
    } catch (error: any) {
      // If not authenticated, show login prompt
      if (error?.data?.code === 'UNAUTHORIZED') {
        setStatus('error');
        setMessage('Please log in to manage your email preferences, or use the unsubscribe link from your email.');
      } else {
        setStatus('error');
        setMessage('Something went wrong. Please try again or contact support.');
      }
    }
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

        {/* Idle State - Confirm unsubscribe */}
        {status === 'idle' && (
          <div className="text-center">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800 font-medium">{message}</p>
              {email && (
                <p className="text-amber-700 text-sm mt-2">Email: {email}</p>
              )}
            </div>
            <button
              onClick={handleUnsubscribe}
              className="w-full px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium mb-4"
            >
              Confirm Unsubscribe
            </button>
            <a
              href="/"
              className="inline-block text-sm text-slate-600 hover:text-slate-800"
            >
              Cancel and return home
            </a>
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
            <div className="space-y-3">
              <a
                href="/"
                className="inline-block w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Return to Home
              </a>
              {isAuthenticated && (
                <a
                  href="/settings"
                  className="inline-block w-full px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-center"
                >
                  Manage Email Settings
                </a>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">{message}</p>
            </div>

            <div className="space-y-3">
              <a
                href="/api/login"
                className="inline-block w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
              >
                Log In to Manage Preferences
              </a>
              <a
                href="/"
                className="inline-block w-full px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-center"
              >
                Return to Home
              </a>
            </div>

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
