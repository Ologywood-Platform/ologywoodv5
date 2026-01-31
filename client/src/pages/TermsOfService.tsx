import React from 'react';

export default function TermsOfService() {
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
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#1f2937' }}>Terms of Service</h1>
        
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          <strong>Last Updated: January 31, 2026</strong>
        </p>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Ologywood, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on Ologywood for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul style={{ marginLeft: '2rem' }}>
            <li>Modifying or copying the materials</li>
            <li>Using the materials for any commercial purpose or for any public display</li>
            <li>Attempting to decompile or reverse engineer any software contained on Ologywood</li>
            <li>Removing any copyright or other proprietary notations from the materials</li>
            <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>3. Disclaimer</h2>
          <p>
            The materials on Ologywood are provided on an 'as is' basis. Ologywood makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>4. Limitations</h2>
          <p>
            In no event shall Ologywood or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Ologywood.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>5. Accuracy of Materials</h2>
          <p>
            The materials appearing on Ologywood could include technical, typographical, or photographic errors. Ologywood does not warrant that any of the materials on its website are accurate, complete, or current. Ologywood may make changes to the materials contained on its website at any time without notice.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>6. Links</h2>
          <p>
            Ologywood has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Ologywood of the site. Use of any such linked website is at the user's own risk.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>7. Modifications</h2>
          <p>
            Ologywood may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>8. User Accounts</h2>
          <p>
            When you create an account on Ologywood, you must provide accurate, complete, and current information. You are responsible for maintaining the confidentiality of your password and account. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>9. User Conduct</h2>
          <p>
            You agree not to use Ologywood to:
          </p>
          <ul style={{ marginLeft: '2rem' }}>
            <li>Harass, threaten, embarrass, or cause distress or discomfort to any individual</li>
            <li>Obscene or abusive language or graphic files</li>
            <li>Disrupt the normal flow of dialogue within Ologywood</li>
            <li>Attempt to gain unauthorized access to Ologywood</li>
            <li>Engage in any form of fraud or deception</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>10. Booking Agreements</h2>
          <p>
            Bookings made through Ologywood are binding agreements between artists and venues. Both parties agree to honor the terms specified in the booking confirmation. Cancellations must follow the cancellation policy specified at the time of booking.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>11. Payments</h2>
          <p>
            All payments are processed through Stripe. By making a payment, you authorize Ologywood to charge your payment method for the booking amount. Ologywood is not responsible for payment processing errors or disputes.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>12. Intellectual Property Rights</h2>
          <p>
            All content on Ologywood, including text, graphics, logos, images, and software, is the property of Ologywood or its content suppliers and is protected by international copyright laws.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>13. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>14. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> legal@ologywood.com<br />
            <strong>Address:</strong> Ologywood, Inc., 123 Music Lane, Nashville, TN 37201<br />
            <strong>Phone:</strong> 1-800-OLOGYWOOD
          </p>
        </section>
      </div>
    </div>
  );
}
