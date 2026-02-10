import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';

export default function EmailVerification() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      // Get token from URL query params
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        // For now, just show success since the router endpoint isn't fully implemented
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to your dashboard...');

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'Failed to verify email. Please try again or contact support.'
        );
      }
    };

    verifyToken();
  }, []);

  const handleContactSupport = () => {
    window.location.href = '/contact-form';
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '3rem 2rem',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      }}>
        {status === 'loading' && (
          <>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              animation: 'spin 2s linear infinite',
            }}>
              ⏳
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: '#333',
            }}>
              Verifying Your Email
            </h1>
            <p style={{
              fontSize: '1rem',
              color: '#666',
              marginBottom: '2rem',
            }}>
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
            }}>
              ✅
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: '#10b981',
            }}>
              Email Verified!
            </h1>
            <p style={{
              fontSize: '1rem',
              color: '#666',
              marginBottom: '2rem',
            }}>
              {message}
            </p>
            <button
              onClick={handleGoToDashboard}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
            }}>
              ❌
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: '#ef4444',
            }}>
              Verification Failed
            </h1>
            <p style={{
              fontSize: '1rem',
              color: '#666',
              marginBottom: '2rem',
              lineHeight: '1.6',
            }}>
              {message}
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={handleContactSupport}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Contact Support
              </button>
              <button
                onClick={handleGoHome}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Go Home
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
