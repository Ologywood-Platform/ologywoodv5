import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc';

export function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const email = searchParams.get('email');
  const unsubscribeMutation = trpc.newsletter.unsubscribe.useMutation();

  useEffect(() => {
    if (!email) {
      setStatus('error');
      setMessage('No email address provided. Please check your unsubscribe link.');
      return;
    }

    // Automatically unsubscribe when page loads
    unsubscribeMutation.mutate(
      { email },
      {
        onSuccess: (data) => {
          setStatus('success');
          setMessage(data.message);
        },
        onError: (error) => {
          setStatus('error');
          setMessage(error.message || 'Failed to unsubscribe. Please try again later.');
        },
      }
    );
  }, [email, unsubscribeMutation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="mb-4">
              <div className="inline-block animate-spin">
                <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Processing Unsubscribe</h1>
            <p className="text-slate-600">Please wait while we process your request...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4">
              <div className="inline-block">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Unsubscribed Successfully</h1>
            <p className="text-slate-600 mb-6">{message}</p>
            <p className="text-sm text-slate-500 mb-6">
              Email: <span className="font-mono font-semibold">{email}</span>
            </p>
            <p className="text-slate-600 mb-6">
              You will no longer receive newsletters from Ologywood. If you change your mind, you can resubscribe anytime from our website.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Return to Home
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4">
              <div className="inline-block">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Unsubscribe Failed</h1>
            <p className="text-slate-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Return to Home
              </button>
            </div>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            If you have any questions, please contact us at{' '}
            <a href="mailto:info@ologywood.com" className="text-purple-600 hover:underline">
              info@ologywood.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
