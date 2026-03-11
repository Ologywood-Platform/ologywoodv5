import React, { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Mail, MailX, ArrowLeft, CheckCircle, AlertTriangle, RefreshCw, Settings, Bell, BellOff } from 'lucide-react';

type PageState = 'confirm' | 'loading' | 'success' | 'resubscribed' | 'error' | 'login-required';

export function Unsubscribe() {
  const [state, setState] = useState<PageState>('confirm');
  const [email, setEmail] = useState('');
  const { isAuthenticated, user } = useAuth();

  const unsubscribeAllMutation = trpc.emailPreferences.unsubscribeAll.useMutation();
  const resubscribeMutation = trpc.emailPreferences.resubscribe.useMutation();
  const updatePrefsMutation = trpc.emailPreferences.updatePreferences.useMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) setEmail(emailParam);

    // Never auto-unsubscribe — always show confirmation first
    if (!isAuthenticated && !emailParam) {
      setState('login-required');
    } else {
      setState('confirm');
    }
  }, [isAuthenticated]);

  const handleUnsubscribe = async () => {
    setState('loading');
    try {
      await unsubscribeAllMutation.mutateAsync();
      setState('success');
    } catch (error: any) {
      if (error?.data?.code === 'UNAUTHORIZED') {
        setState('login-required');
      } else {
        setState('error');
      }
    }
  };

  const handleReduceFrequency = async () => {
    setState('loading');
    try {
      await updatePrefsMutation.mutateAsync({
        frequency: 'weekly',
        bookingUpdates: true,
        newOpportunities: false,
        platformNews: false,
        weeklyDigest: true,
        reminders: true,
      });
      setState('success');
    } catch (error: any) {
      if (error?.data?.code === 'UNAUTHORIZED') {
        setState('login-required');
      } else {
        setState('error');
      }
    }
  };

  const handleResubscribe = async () => {
    setState('loading');
    try {
      await resubscribeMutation.mutateAsync();
      setState('resubscribed');
    } catch {
      setState('error');
    }
  };

  const displayEmail = email || user?.email || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* ========== CONFIRM STATE ========== */}
        {state === 'confirm' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Before You Go...</h1>
              <p className="text-purple-100 mt-2 text-sm">
                Are you sure you want to unsubscribe?
              </p>
            </div>

            <div className="px-8 py-6 space-y-5">
              {/* What you'll miss */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-900 text-sm">You'll stop receiving:</p>
                    <ul className="mt-2 space-y-1 text-sm text-amber-800">
                      <li>Booking requests and confirmations</li>
                      <li>New opportunity alerts</li>
                      <li>Event reminders</li>
                      <li>Weekly activity digests</li>
                    </ul>
                  </div>
                </div>
              </div>

              {displayEmail && (
                <p className="text-center text-sm text-slate-500">
                  Unsubscribing: <span className="font-medium text-slate-700">{displayEmail}</span>
                </p>
              )}

              {/* Alternative: Reduce frequency */}
              <div className="border border-purple-200 bg-purple-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-purple-900 text-sm">Prefer fewer emails instead?</p>
                    <p className="text-xs text-purple-700 mt-1">
                      We'll only send you essential booking updates and a weekly digest — no marketing.
                    </p>
                    <button
                      onClick={handleReduceFrequency}
                      className="mt-3 w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      Just Reduce My Emails
                    </button>
                  </div>
                </div>
              </div>

              {/* Manage preferences link */}
              {isAuthenticated && (
                <a
                  href="/settings"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  <Settings className="h-4 w-4" />
                  Choose Exactly What to Receive
                </a>
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400">or</span>
                </div>
              </div>

              {/* Unsubscribe button - less prominent */}
              <button
                onClick={handleUnsubscribe}
                className="w-full px-4 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              >
                <span className="flex items-center justify-center gap-2">
                  <MailX className="h-4 w-4" />
                  Yes, Unsubscribe from All Emails
                </span>
              </button>

              {/* Cancel */}
              <a
                href="/"
                className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors py-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Never mind, take me back
              </a>
            </div>
          </div>
        )}

        {/* ========== LOADING STATE ========== */}
        {state === 'loading' && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4" />
            <p className="text-slate-600">Processing your request...</p>
          </div>
        )}

        {/* ========== SUCCESS STATE (Unsubscribed) ========== */}
        {state === 'success' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Done!</h1>
              <p className="text-green-100 mt-2 text-sm">
                Your preferences have been updated
              </p>
            </div>

            <div className="px-8 py-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-slate-700 text-sm">
                  You may still receive essential transactional emails related to active bookings and your account security.
                </p>
              </div>

              {/* Changed your mind? */}
              <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-800 font-medium mb-3">Changed your mind?</p>
                <button
                  onClick={handleResubscribe}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Resubscribe
                </button>
              </div>

              <a
                href="/"
                className="flex items-center justify-center w-full px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                Return to Home
              </a>

              {isAuthenticated && (
                <a
                  href="/settings"
                  className="flex items-center justify-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition-colors py-1"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Fine-tune your email preferences
                </a>
              )}
            </div>
          </div>
        )}

        {/* ========== RESUBSCRIBED STATE ========== */}
        {state === 'resubscribed' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Welcome Back!</h1>
              <p className="text-purple-100 mt-2 text-sm">
                You're subscribed to emails again
              </p>
            </div>

            <div className="px-8 py-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 text-sm font-medium">
                  You'll receive booking updates, opportunity alerts, and weekly digests.
                </p>
              </div>

              <a
                href="/"
                className="flex items-center justify-center w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Return to Home
              </a>

              {isAuthenticated && (
                <a
                  href="/settings"
                  className="flex items-center justify-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition-colors py-1"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Customize what you receive
                </a>
              )}
            </div>
          </div>
        )}

        {/* ========== ERROR STATE ========== */}
        {state === 'error' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Something Went Wrong</h1>
              <p className="text-slate-600 text-sm mt-2">
                We couldn't process your request. Please try again.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setState('confirm')}
                className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
              <a
                href="/"
                className="flex items-center justify-center w-full px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                Return to Home
              </a>
              <p className="text-slate-500 text-xs text-center mt-4">
                Having trouble? Contact us at{' '}
                <a href="mailto:support@ologywood.com" className="text-purple-600 hover:underline">
                  support@ologywood.com
                </a>
              </p>
            </div>
          </div>
        )}

        {/* ========== LOGIN REQUIRED STATE ========== */}
        {state === 'login-required' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <BellOff className="h-8 w-8 text-purple-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Sign In Required</h1>
              <p className="text-slate-600 text-sm mt-2">
                Please sign in to manage your email preferences. This ensures we update the right account.
              </p>
            </div>

            <div className="space-y-3">
              <a
                href="/api/login"
                className="flex items-center justify-center w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Sign In to Manage Preferences
              </a>
              <a
                href="/"
                className="flex items-center justify-center w-full px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                Return to Home
              </a>
              <p className="text-slate-500 text-xs text-center mt-4">
                Having trouble? Contact{' '}
                <a href="mailto:support@ologywood.com" className="text-purple-600 hover:underline">
                  support@ologywood.com
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-6">
          © 2026 Ologywood. All rights reserved.
        </p>
      </div>
    </div>
  );
}
