import React, { useState, useEffect } from 'react';
import { getLoginUrl } from '../const';

export default function Marketing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
              aria-label="Toggle menu"
            >
              ☰
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobile && mobileMenuOpen && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #eee',
          }}>
            <a href="#features" style={{ color: '#666', textDecoration: 'none', fontSize: '0.95rem' }}>Features</a>
            <a href="#pricing" style={{ color: '#666', textDecoration: 'none', fontSize: '0.95rem' }}>Pricing</a>
            <a href="#testimonials" style={{ color: '#666', textDecoration: 'none', fontSize: '0.95rem' }}>Reviews</a>
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
                textAlign: 'center',
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
                textAlign: 'center',
              }}
            >
              Get Started
            </a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '2rem 1rem' : '4rem 2rem',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: isMobile ? '1.75rem' : '3rem', 
            marginBottom: '1rem', 
            fontWeight: 'bold', 
            lineHeight: '1.2',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}>
            Book Talented Artists for Your Events
          </h1>
          <p style={{ 
            fontSize: isMobile ? '0.95rem' : '1.25rem', 
            marginBottom: '2rem', 
            opacity: 0.95, 
            lineHeight: '1.5',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}>
            Connect with performing artists, manage bookings, and streamline your event planning all in one place.
          </p>
          <div style={{ 
            display: 'flex', 
            gap: isMobile ? '0.75rem' : '1rem', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            padding: isMobile ? '0 0.5rem' : '0',
          }}>
            <a
              href={getLoginUrl()}
              style={{
                padding: isMobile ? '0.6rem 1.2rem' : '0.75rem 1.5rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}
            >
              For Artists
            </a>
            <a
              href={getLoginUrl()}
              style={{
                padding: isMobile ? '0.6rem 1.2rem' : '0.75rem 1.5rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}
            >
              For Venues
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: isMobile ? '2rem 1rem' : '4rem 2rem',
        background: '#f9fafb',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: isMobile ? '1.5rem' : '2rem', 
            textAlign: 'center', 
            marginBottom: '2rem', 
            fontWeight: 'bold',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}>
            Powerful Features
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '2rem',
          }}>
            {[
              { icon: '📅', title: 'Smart Calendar Sync', desc: 'Sync availability with Google Calendar and Outlook' },
              { icon: '📋', title: 'Rider Templates', desc: 'Create custom riders with technical and hospitality requirements' },
              { icon: '💳', title: 'Secure Payments', desc: 'Process payments with Stripe integration' },
              { icon: '🏢', title: 'Venue Directory', desc: 'Free listing for venues to get discovered' },
              { icon: '⭐', title: 'Reviews & Ratings', desc: 'Build trust with community reviews' },
              { icon: '📊', title: 'Analytics', desc: 'Track bookings, revenue, and performance metrics' },
              { icon: '👥', title: 'Team Management', desc: 'Invite team members and manage roles' },
              { icon: '📱', title: 'Mobile App', desc: 'Install as native app on iOS and Android' },
              { icon: '🎓', title: 'Interactive Tutorials', desc: 'Learn features with guided walkthroughs' },
            ].map((feature, idx) => (
              <div key={idx} style={{
                padding: '1.5rem',
                background: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{feature.icon}</div>
                <h3 style={{ 
                  fontSize: isMobile ? '1rem' : '1.1rem', 
                  fontWeight: 'bold', 
                  marginBottom: '0.5rem',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: '#666', 
                  lineHeight: '1.5',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Artists Section */}
      <section style={{
        padding: isMobile ? '2rem 1rem' : '4rem 2rem',
        background: 'white',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: isMobile ? '1.5rem' : '2rem', 
            marginBottom: '1.5rem', 
            fontWeight: 'bold',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}>
            🎤 For Artists
          </h2>
          <ul style={{ 
            fontSize: isMobile ? '0.9rem' : '1rem', 
            lineHeight: '1.8', 
            marginBottom: '1.5rem',
            paddingLeft: '1.5rem',
          }}>
            <li>✓ Get discovered by venues looking for your talent</li>
            <li>✓ Manage your availability and bookings in one place</li>
            <li>✓ Create professional rider templates</li>
            <li>✓ Receive payments securely through Stripe</li>
            <li>✓ Track your earnings and performance metrics</li>
            <li>✓ Share your profile on social media</li>
          </ul>
          <a
            href={getLoginUrl()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Sign Up as Artist
          </a>
        </div>
      </section>

      {/* For Venues Section */}
      <section style={{
        padding: isMobile ? '2rem 1rem' : '4rem 2rem',
        background: '#f9fafb',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: isMobile ? '1.5rem' : '2rem', 
            marginBottom: '1.5rem', 
            fontWeight: 'bold',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}>
            🎪 For Venues
          </h2>
          <ul style={{ 
            fontSize: isMobile ? '0.9rem' : '1rem', 
            lineHeight: '1.8', 
            marginBottom: '1.5rem',
            paddingLeft: '1.5rem',
          }}>
            <li>✓ Get free promotion in our venue directory</li>
            <li>✓ Browse and book talented artists</li>
            <li>✓ Manage all bookings in one dashboard</li>
            <li>✓ Receive reviews from artists</li>
            <li>✓ Track listing views and inquiries</li>
            <li>✓ Collaborate with team members</li>
          </ul>
          <a
            href={getLoginUrl()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Sign Up as Venue
          </a>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{
        padding: isMobile ? '2rem 1rem' : '4rem 2rem',
        background: 'white',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: isMobile ? '1.5rem' : '2rem', 
            textAlign: 'center', 
            marginBottom: '2rem', 
            fontWeight: 'bold',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}>
            Simple, Transparent Pricing
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '2rem',
          }}>
            {[
              { name: 'Free', price: '$0', features: ['Basic profile', 'Browse artists', 'Limited bookings', 'Community support'] },
              { name: 'Professional', price: '$29', features: ['Calendar sync', 'Custom riders', 'Advanced analytics', 'Team management', 'Priority support'], highlight: true },
              { name: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'API access', 'Custom integrations', 'Dedicated support'] },
            ].map((plan, idx) => (
              <div key={idx} style={{
                padding: '2rem',
                background: plan.highlight ? '#667eea' : '#f9fafb',
                borderRadius: '0.5rem',
                border: plan.highlight ? 'none' : '1px solid #e5e7eb',
                color: plan.highlight ? 'white' : 'black',
              }}>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  marginBottom: '0.5rem',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                  {plan.price}<span style={{ fontSize: '1rem' }}>/month</span>
                </p>
                <ul style={{ 
                  fontSize: '0.95rem', 
                  lineHeight: '1.8', 
                  marginBottom: '1.5rem',
                  listStyle: 'none',
                  padding: 0,
                }}>
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx}>✓ {feature}</li>
                  ))}
                </ul>
                <a
                  href={getLoginUrl()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: plan.highlight ? 'white' : '#667eea',
                    color: plan.highlight ? '#667eea' : 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-block',
                    width: '100%',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                  }}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" style={{
        padding: isMobile ? '2rem 1rem' : '4rem 2rem',
        background: '#f9fafb',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: isMobile ? '1.5rem' : '2rem', 
            textAlign: 'center', 
            marginBottom: '2rem', 
            fontWeight: 'bold',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}>
            Loved by Artists and Venues
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '2rem',
          }}>
            {[
              { quote: 'Ologywood made it so easy to manage my bookings. I love the calendar sync feature!', author: 'Sarah Martinez', role: 'Jazz Vocalist' },
              { quote: 'Finding the right artists has never been easier. The platform is intuitive and reliable.', author: 'James Chen', role: 'Venue Manager' },
              { quote: 'The rider templates save us so much time. Highly recommend to anyone in the industry.', author: 'Michael Thompson', role: 'Event Planner' },
            ].map((testimonial, idx) => (
              <div key={idx} style={{
                padding: '1.5rem',
                background: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}>
                <div style={{ 
                  fontSize: '0.9rem', 
                  marginBottom: '1rem', 
                  color: '#666', 
                  lineHeight: '1.6',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}>
                  "⭐⭐⭐⭐⭐ {testimonial.quote}"
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{testimonial.author}</div>
                <div style={{ fontSize: '0.85rem', color: '#666', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{testimonial.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: isMobile ? '2rem 1rem' : '4rem 2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: isMobile ? '1.5rem' : '2rem', 
            marginBottom: '1rem', 
            fontWeight: 'bold',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}>
            Ready to Transform Your Booking Experience?
          </h2>
          <p style={{ 
            fontSize: isMobile ? '0.95rem' : '1.1rem', 
            marginBottom: '2rem', 
            opacity: 0.95,
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}>
            Join thousands of artists and venues already using Ologywood.
          </p>
          <div style={{ 
            display: 'flex', 
            gap: isMobile ? '0.75rem' : '1rem', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            padding: isMobile ? '0 0.5rem' : '0',
          }}>
            <a
              href={getLoginUrl()}
              style={{
                padding: isMobile ? '0.6rem 1.2rem' : '0.75rem 1.5rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}
            >
              Sign Up as Artist
            </a>
            <a
              href={getLoginUrl()}
              style={{
                padding: isMobile ? '0.6rem 1.2rem' : '0.75rem 1.5rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}
            >
              Sign Up as Venue
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        background: '#1f2937',
        color: '#d1d5db',
        fontSize: '0.9rem',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '2rem',
            marginBottom: '2rem',
          }}>
            <div>
              <h4 style={{ color: 'white', marginBottom: '1rem', fontWeight: 'bold' }}>Ologywood</h4>
              <p style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>The modern platform for booking artists and managing events.</p>
            </div>
            <div>
              <h4 style={{ color: 'white', marginBottom: '1rem', fontWeight: 'bold' }}>Quick Links</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li><a href="#features" style={{ color: '#d1d5db', textDecoration: 'none' }}>Features</a></li>
                <li><a href="#pricing" style={{ color: '#d1d5db', textDecoration: 'none' }}>Pricing</a></li>
                <li><a href="#testimonials" style={{ color: '#d1d5db', textDecoration: 'none' }}>Reviews</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'white', marginBottom: '1rem', fontWeight: 'bold' }}>Legal</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li><a href="/privacy-policy" style={{ color: '#d1d5db', textDecoration: 'none' }}>Privacy Policy</a></li>
                <li><a href="/terms-of-service" style={{ color: '#d1d5db', textDecoration: 'none' }}>Terms of Service</a></li>
                <li><a href="/contact" style={{ color: '#d1d5db', textDecoration: 'none' }}>Contact</a></li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #374151', paddingTop: '2rem', textAlign: 'center' }}>
            <p>&copy; 2026 Ologywood. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
