import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Marketing() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Navigation */}
      <nav style={{
        background: 'white',
        padding: '1rem 2rem',
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
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6366f1' }}>
            🎭 Ologywood
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <a href="#features" style={{ color: '#666', textDecoration: 'none' }}>Features</a>
            <a href="#pricing" style={{ color: '#666', textDecoration: 'none' }}>Pricing</a>
            <a href="#testimonials" style={{ color: '#666', textDecoration: 'none' }}>Reviews</a>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => navigate('/signin')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#6366f1',
                  border: '2px solid #6366f1',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '6rem 2rem',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', lineHeight: 1.2 }}>
            Book Talented Artists for Your Events
          </h1>
          <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.95 }}>
            Connect with performing artists, manage bookings, and streamline your event planning all in one place.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/signup?type=artist')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              For Artists
            </button>
            <button
              onClick={() => navigate('/signup?type=venue')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              For Venues
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '5rem 2rem', background: '#f9fafb' }} id="features">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: '#1f2937' }}>
            Powerful Features
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}>
            {[
              { icon: '📅', title: 'Smart Calendar Sync', desc: 'Sync your availability across Google Calendar, Outlook, and iCal. Never double-book again.' },
              { icon: '📋', title: 'Rider Templates', desc: 'Create and customize professional rider contracts with technical requirements and payment terms.' },
              { icon: '💳', title: 'Secure Payments', desc: 'Accept deposits and full payments through Stripe. Automatic invoicing and payment tracking.' },
              { icon: '🌐', title: 'Venue Directory', desc: 'Free listing for venues. Get discovered by artists and showcase your space.' },
              { icon: '⭐', title: 'Reviews & Ratings', desc: 'Build trust with detailed reviews and ratings from the community.' },
              { icon: '📊', title: 'Analytics Dashboard', desc: 'Track bookings, revenue, and trends. Make data-driven decisions.' },
              { icon: '👥', title: 'Team Management', desc: 'Invite team members and assign roles for seamless collaboration.' },
              { icon: '📱', title: 'Mobile App', desc: 'Install as an app on your phone. Get push notifications on the go.' },
              { icon: '🎓', title: 'Interactive Tutorials', desc: 'Learn features through step-by-step guides with built-in help.' },
            ].map((feature, idx) => (
              <div
                key={idx}
                style={{
                  background: 'white',
                  padding: '2rem',
                  borderRadius: '1rem',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#1f2937' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#666', lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Artists Section */}
      <section style={{ padding: '5rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: '#1f2937' }}>
            For Artists
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#1f2937' }}>
                Grow Your Booking Business
              </h3>
              <ul style={{ listStyle: 'none' }}>
                {[
                  'Reach thousands of venues looking for talent',
                  'Manage all your bookings in one place',
                  'Get paid securely through Stripe',
                  'Share your profile on social media',
                  'Track your earnings and trends',
                  'Customize your rider requirements',
                  'Sync availability across calendars',
                  'Build your reputation with reviews',
                ].map((item, idx) => (
                  <li key={idx} style={{ padding: '0.75rem 0', paddingLeft: '2rem', position: 'relative', color: '#555' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#6366f1', fontWeight: 'bold' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '1rem',
              height: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '3rem',
            }}>
              🎤
            </div>
          </div>
        </div>
      </section>

      {/* For Venues Section */}
      <section style={{ padding: '5rem 2rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: '#1f2937' }}>
            For Venues
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '1rem',
              height: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '3rem',
            }}>
              🎭
            </div>
            <div>
              <h3 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#1f2937' }}>
                Find & Book the Perfect Artist
              </h3>
              <ul style={{ listStyle: 'none' }}>
                {[
                  'Browse thousands of talented artists',
                  'Search by genre, price, and availability',
                  'Get free promotion with venue listing',
                  'Manage all bookings in one dashboard',
                  'See artist reviews and ratings',
                  'Secure payment processing',
                  'Track booking inquiries and views',
                  'Build your venue reputation',
                ].map((item, idx) => (
                  <li key={idx} style={{ padding: '0.75rem 0', paddingLeft: '2rem', position: 'relative', color: '#555' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#6366f1', fontWeight: 'bold' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ padding: '5rem 2rem', background: 'white' }} id="pricing">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: '#1f2937' }}>
            Simple, Transparent Pricing
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
          }}>
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'Forever',
                features: ['Basic profile', 'Browse artists/venues', 'Send booking requests', 'Basic analytics'],
                cta: 'Get Started',
              },
              {
                name: 'Professional',
                price: '$29',
                period: 'per month',
                features: ['Everything in Free', 'Calendar sync', 'Custom rider templates', 'Advanced analytics', 'Priority support'],
                cta: 'Start Free Trial',
                featured: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: 'contact us',
                features: ['Everything in Professional', 'Team management', 'Custom integrations', 'Dedicated support'],
                cta: 'Contact Sales',
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                style={{
                  background: 'white',
                  padding: '2.5rem',
                  borderRadius: '1rem',
                  textAlign: 'center',
                  border: plan.featured ? '2px solid #6366f1' : '2px solid #e5e7eb',
                  transform: plan.featured ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: plan.featured ? '0 12px 24px rgba(99, 102, 241, 0.2)' : 'none',
                }}
              >
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>
                  {plan.name}
                </h3>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#6366f1', marginBottom: '0.5rem' }}>
                  {plan.price}
                </div>
                <div style={{ color: '#999', marginBottom: '1.5rem' }}>{plan.period}</div>
                <ul style={{ listStyle: 'none', margin: '2rem 0', textAlign: 'left' }}>
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6', color: '#666' }}>
                      ✓ {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: plan.featured ? '#6366f1' : 'white',
                    color: plan.featured ? 'white' : '#6366f1',
                    border: plan.featured ? 'none' : '2px solid #6366f1',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    width: '100%',
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={{ padding: '5rem 2rem', background: '#f9fafb' }} id="testimonials">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: '#1f2937' }}>
            What Users Say
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}>
            {[
              {
                text: 'Ologywood has transformed how I manage my bookings. I\'ve increased my gigs by 40% in just three months!',
                author: 'Sarah Martinez',
                role: 'Jazz Vocalist',
              },
              {
                text: 'Finding quality artists used to be a nightmare. Now I can browse, compare, and book in minutes. Highly recommend!',
                author: 'James Chen',
                role: 'Event Venue Manager',
              },
              {
                text: 'The calendar sync feature alone is worth it. No more double bookings and my availability is always up to date.',
                author: 'Michael Thompson',
                role: 'DJ & Producer',
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                style={{
                  background: 'white',
                  padding: '2rem',
                  borderRadius: '1rem',
                  borderLeft: '4px solid #6366f1',
                }}
              >
                <div style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.25rem' }}>
                  ★★★★★
                </div>
                <p style={{ color: '#555', marginBottom: '1rem', fontStyle: 'italic' }}>
                  "{testimonial.text}"
                </p>
                <p style={{ fontWeight: 600, color: '#1f2937' }}>{testimonial.author}</p>
                <p style={{ color: '#999', fontSize: '0.9rem' }}>{testimonial.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '4rem 2rem',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.95 }}>
            Join hundreds of artists and venues already using Ologywood
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/signup?type=artist')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              Sign Up as Artist
            </button>
            <button
              onClick={() => navigate('/signup?type=venue')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              Sign Up as Venue
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#1f2937',
        color: 'white',
        padding: '3rem 2rem',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <a href="#" style={{ color: '#d1d5db', textDecoration: 'none', margin: '0 1.5rem' }}>About</a>
          <a href="#" style={{ color: '#d1d5db', textDecoration: 'none', margin: '0 1.5rem' }}>Privacy</a>
          <a href="#" style={{ color: '#d1d5db', textDecoration: 'none', margin: '0 1.5rem' }}>Terms</a>
          <a href="#" style={{ color: '#d1d5db', textDecoration: 'none', margin: '0 1.5rem' }}>Contact</a>
        </div>
        <p>&copy; 2026 Ologywood. All rights reserved.</p>
      </footer>
    </div>
  );
}
