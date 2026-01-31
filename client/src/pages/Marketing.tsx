import React from 'react';

export default function Marketing() {
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
              <a
                href="/signin"
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#6366f1',
                  border: '2px solid #6366f1',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Sign In
              </a>
              <a
                href="/signup"
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '4rem 2rem',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 'bold' }}>
            Book Talented Artists for Your Events
          </h1>
          <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.95 }}>
            Connect with performing artists, manage bookings, and streamline your event planning all in one place.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/signup?type=artist"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              For Artists
            </a>
            <a
              href="/signup?type=venue"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              For Venues
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '4rem 2rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '3rem', color: '#1f2937' }}>
            Powerful Features
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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
                background: 'white',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#1f2937' }}>{feature.title}</h3>
                <p style={{ color: '#6b7280' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Artists Section */}
      <section style={{ padding: '4rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#1f2937' }}>🎤 For Artists</h2>
            <ul style={{ fontSize: '1.1rem', color: '#4b5563', lineHeight: '1.8' }}>
              <li>✓ Get discovered by venues looking for your talent</li>
              <li>✓ Manage your availability and bookings in one place</li>
              <li>✓ Create professional rider templates</li>
              <li>✓ Receive payments securely through Stripe</li>
              <li>✓ Track your earnings and performance metrics</li>
              <li>✓ Share your profile on social media</li>
            </ul>
            <a
              href="/signup?type=artist"
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
                marginTop: '1.5rem',
              }}
            >
              Sign Up as Artist
            </a>
          </div>
          <div style={{ fontSize: '4rem', textAlign: 'center' }}>🎸</div>
        </div>
      </section>

      {/* For Venues Section */}
      <section style={{ padding: '4rem 2rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
          <div style={{ fontSize: '4rem', textAlign: 'center' }}>🎭</div>
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#1f2937' }}>🎪 For Venues</h2>
            <ul style={{ fontSize: '1.1rem', color: '#4b5563', lineHeight: '1.8' }}>
              <li>✓ Get free promotion in our venue directory</li>
              <li>✓ Browse and book talented artists</li>
              <li>✓ Manage all bookings in one dashboard</li>
              <li>✓ Receive reviews from artists</li>
              <li>✓ Track listing views and inquiries</li>
              <li>✓ Collaborate with team members</li>
            </ul>
            <a
              href="/signup?type=venue"
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
                marginTop: '1.5rem',
              }}
            >
              Sign Up as Venue
            </a>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '4rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '3rem', color: '#1f2937' }}>
            Simple, Transparent Pricing
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}>
            {[
              {
                name: 'Free',
                price: '$0',
                featured: false,
                features: ['Basic profile', 'Browse artists', 'Limited bookings', 'Community support'],
                cta: 'Get Started',
              },
              {
                name: 'Professional',
                price: '$29',
                featured: true,
                features: ['Calendar sync', 'Custom riders', 'Advanced analytics', 'Team management', 'Priority support'],
                cta: 'Start Free Trial',
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                featured: false,
                features: ['Everything in Pro', 'API access', 'Custom integrations', 'Dedicated support'],
                cta: 'Contact Sales',
              },
            ].map((plan, idx) => (
              <div key={idx} style={{
                background: plan.featured ? '#667eea' : 'white',
                color: plan.featured ? 'white' : '#1f2937',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: plan.featured ? '0 10px 25px rgba(102, 126, 234, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                border: plan.featured ? 'none' : '1px solid #e5e7eb',
              }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{plan.name}</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                  {plan.price}<span style={{ fontSize: '1rem' }}>/month</span>
                </div>
                <ul style={{ marginBottom: '2rem', lineHeight: '1.8' }}>
                  {plan.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
                <a
                  href="/upgrade"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: plan.featured ? 'white' : '#667eea',
                    color: plan.featured ? '#667eea' : 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-block',
                    width: '100%',
                    textAlign: 'center',
                  }}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" style={{ padding: '4rem 2rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '3rem', color: '#1f2937' }}>
            Loved by Artists and Venues
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}>
            {[
              {
                name: 'Sarah Martinez',
                role: 'Jazz Vocalist',
                review: 'Ologywood made it so easy to manage my bookings. I love the calendar sync feature!',
                rating: 5,
              },
              {
                name: 'James Chen',
                role: 'Venue Manager',
                review: 'Finding the right artists has never been easier. The platform is intuitive and reliable.',
                rating: 5,
              },
              {
                name: 'Michael Thompson',
                role: 'Event Planner',
                review: 'The rider templates save us so much time. Highly recommend to anyone in the industry.',
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <div key={idx} style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  {'⭐'.repeat(testimonial.rating)}
                </div>
                <p style={{ marginBottom: '1rem', color: '#4b5563', fontStyle: 'italic' }}>
                  "{testimonial.review}"
                </p>
                <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{testimonial.name}</div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>{testimonial.role}</div>
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
            Ready to Transform Your Booking Experience?
          </h2>
          <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.95 }}>
            Join thousands of artists and venues already using Ologywood.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/signup"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#667eea',
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
            <a
              href="/signup?type=venue"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#667eea',
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
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#1f2937',
        color: 'white',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p>&copy; 2026 Ologywood. All rights reserved.</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem', justifyContent: 'center' }}>
              <a href="/privacy" style={{ color: 'white', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/terms" style={{ color: 'white', textDecoration: 'none' }}>Terms of Service</a>
            <a href="/contact" style={{ color: 'white', textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
