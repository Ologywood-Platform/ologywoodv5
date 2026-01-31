import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', lineHeight: '1.6', color: '#333' }}>
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
          <a href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6366f1', textDecoration: 'none' }}>
            🎭 Ologywood
          </a>
          <a href="/" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>
            Back to Home
          </a>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#1f2937' }}>Privacy Policy</h1>
        
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          <strong>Last Updated: January 31, 2026</strong>
        </p>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>1. Introduction</h2>
          <p>
            Ologywood ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>2. Information We Collect</h2>
          <p style={{ marginBottom: '0.5rem' }}>We collect information you provide directly to us, such as:</p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
            <li>Account registration information (name, email, phone number)</li>
            <li>Profile information (bio, photos, availability, pricing)</li>
            <li>Payment information (processed securely through Stripe)</li>
            <li>Booking and contract details</li>
            <li>Communications and messages between users</li>
            <li>Reviews and ratings</li>
          </ul>
          <p style={{ marginBottom: '0.5rem' }}>We also automatically collect:</p>
          <ul style={{ marginLeft: '2rem' }}>
            <li>Device information (browser type, IP address)</li>
            <li>Usage data (pages visited, time spent, interactions)</li>
            <li>Location data (if you permit)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul style={{ marginLeft: '2rem' }}>
            <li>Provide, maintain, and improve our services</li>
            <li>Process bookings and payments</li>
            <li>Send transactional emails (confirmations, reminders)</li>
            <li>Communicate with you about updates and features</li>
            <li>Personalize your experience</li>
            <li>Prevent fraud and ensure security</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>4. Sharing Your Information</h2>
          <p>We do not sell your personal information. We may share your information with:</p>
          <ul style={{ marginLeft: '2rem' }}>
            <li>Other users (profile information, reviews, booking details)</li>
            <li>Payment processors (Stripe) for transaction processing</li>
            <li>Service providers who assist us in operating our platform</li>
            <li>Law enforcement when required by law</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>5. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your personal information, including encryption, secure servers, and access controls. However, no method of transmission over the internet is completely secure.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>6. Your Privacy Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul style={{ marginLeft: '2rem' }}>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt-out of marketing communications</li>
            <li>Data portability</li>
          </ul>
          <p style={{ marginTop: '1rem' }}>
            To exercise these rights, please contact us at privacy@ologywood.com.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>7. Cookies</h2>
          <p>
            We use cookies to enhance your experience. You can control cookie settings through your browser. Disabling cookies may affect functionality.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>8. Third-Party Links</h2>
          <p>
            Our platform may contain links to third-party websites. We are not responsible for their privacy practices. Please review their privacy policies before providing information.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>9. Children's Privacy</h2>
          <p>
            Our services are not intended for users under 18 years old. We do not knowingly collect personal information from children. If we become aware of such collection, we will delete the information immediately.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify you of significant changes by email or by posting the updated policy on our website.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>11. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> privacy@ologywood.com<br />
            <strong>Address:</strong> Ologywood, Inc., 123 Music Lane, Nashville, TN 37201<br />
            <strong>Phone:</strong> 1-800-OLOGYWOOD
          </p>
        </section>
      </div>
    </div>
  );
}
