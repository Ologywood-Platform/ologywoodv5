import { useState, useEffect } from 'react';
import { getLoginUrl } from '../const';

export default function Marketing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if user is signed in and redirect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          // User is signed in, redirect to dashboard
          window.location.href = '/dashboard';
        }
      } catch (error) {
        // User is not signed in, show marketing page
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Navigation */}
      <nav style={{
        background: 'white',
        padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ 
            fontSize: isMobile ? '1.25rem' : '1.5rem', 
            fontWeight: 'bold', 
            color: '#6366f1',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            🎭 Ologywood
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <a href="#features" style={{ color: '#666', textDecoration: 'none', fontSize: '0.95rem' }}>Features</a>
              <a href="#pricing" style={{ color: '#666', textDecoration: 'none', fontSize: '0.95rem' }}>Pricing</a>
              <a href="#testimonials" style={{ color: '#666', textDecoration: 'none', fontSize: '0.95rem' }}>Reviews</a>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <a
                  href={getLoginUrl()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    color: '#6366f1',
                    border: '2px solid #6366f1',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  Sign In
                </a>
                <a
                  href={getLoginUrl()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  Get Started
                </a>
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              ☰
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobile && mobileMenuOpen && (
          <div style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #eee',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <a href="#features" style={{ color: '#666', textDecoration: 'none' }}>Features</a>
            <a href="#pricing" style={{ color: '#666', textDecoration: 'none' }}>Pricing</a>
            <a href="#testimonials" style={{ color: '#666', textDecoration: 'none' }}>Reviews</a>
            <a
              href={getLoginUrl()}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#6366f1',
                border: '2px solid #6366f1',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Sign In
            </a>
            <a
              href={getLoginUrl()}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Get Started
            </a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'white',
        padding: isMobile ? '3rem 1rem' : '5rem 2rem',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: isMobile ? '2rem' : '3.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
          Connect Artists & Venues
        </h1>
        <p style={{ fontSize: isMobile ? '1rem' : '1.25rem', marginBottom: '2rem', opacity: 0.9 }}>
          The ultimate platform for booking live performances. Seamless, secure, and built for everyone.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={getLoginUrl()}
            style={{
              padding: '1rem 2rem',
              background: 'white',
              color: '#6366f1',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Get Started Free
          </a>
          <a
            href="#features"
            style={{
              padding: '1rem 2rem',
              background: 'transparent',
              color: 'white',
              border: '2px solid white',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: isMobile ? '3rem 1rem' : '5rem 2rem',
        background: '#f8f9fa',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', textAlign: 'center', marginBottom: '3rem', fontWeight: 'bold' }}>
            Why Choose Ologywood?
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '2rem',
          }}>
            {[
              { icon: '🎵', title: 'For Artists', desc: 'Showcase your talent, manage bookings, and grow your career' },
              { icon: '🎭', title: 'For Venues', desc: 'Find the perfect performers and manage events effortlessly' },
              { icon: '🔒', title: 'Secure & Reliable', desc: 'Enterprise-grade security with Stripe payments' },
            ].map((feature, i) => (
              <div key={i} style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '0.75rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{feature.title}</h3>
                <p style={{ color: '#666' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: '#6366f1',
        color: 'white',
        padding: isMobile ? '3rem 1rem' : '4rem 2rem',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
          Ready to Get Started?
        </h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
          Join thousands of artists and venues already using Ologywood
        </p>
        <a
          href={getLoginUrl()}
          style={{
            padding: '1rem 2rem',
            background: 'white',
            color: '#6366f1',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Sign Up Now
        </a>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#1f2937',
        color: '#999',
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        textAlign: 'center',
        fontSize: '0.9rem',
      }}>
        <p>&copy; 2026 Ologywood. All rights reserved.</p>
      </footer>
    </div>
  );
}
