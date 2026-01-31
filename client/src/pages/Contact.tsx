import React, { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, this would send to a backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

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
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#1f2937' }}>Contact Us</h1>
        <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '3rem' }}>
          Have questions or feedback? We'd love to hear from you. Get in touch with our team.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
          {/* Contact Information */}
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#1f2937' }}>Get in Touch</h2>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>📧 Email</h3>
              <p style={{ color: '#6b7280' }}>
                <a href="mailto:support@ologywood.com" style={{ color: '#6366f1', textDecoration: 'none' }}>
                  support@ologywood.com
                </a>
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                General inquiries and support
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>📱 Phone</h3>
              <p style={{ color: '#6b7280' }}>
                <a href="tel:1-800-OLOGYWOOD" style={{ color: '#6366f1', textDecoration: 'none' }}>
                  1-800-OLOGYWOOD (1-800-654-9963)
                </a>
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                Monday - Friday, 9am - 6pm EST
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>📍 Address</h3>
              <p style={{ color: '#6b7280' }}>
                Ologywood, Inc.<br />
                123 Music Lane<br />
                Nashville, TN 37201<br />
                United States
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>🔒 Privacy & Legal</h3>
              <p style={{ color: '#6b7280' }}>
                <a href="/privacy" style={{ color: '#6366f1', textDecoration: 'none' }}>
                  Privacy Policy
                </a>
                <br />
                <a href="/terms" style={{ color: '#6366f1', textDecoration: 'none' }}>
                  Terms of Service
                </a>
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#1f2937' }}>Send us a Message</h2>
            
            {submitted && (
              <div style={{
                background: '#d1fae5',
                border: '1px solid #6ee7b7',
                color: '#065f46',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
              }}>
                ✓ Thank you! Your message has been sent. We'll get back to you soon.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  Subject
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="billing">Billing Question</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <section style={{ marginTop: '3rem', paddingTop: '3rem', borderTop: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#1f2937' }}>Frequently Asked Questions</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
              How long does it take to get a response?
            </h3>
            <p style={{ color: '#6b7280' }}>
              We aim to respond to all inquiries within 24 business hours. During peak times, it may take up to 48 hours.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
              What if I have a technical issue?
            </h3>
            <p style={{ color: '#6b7280' }}>
              Please contact our technical support team at support@ologywood.com or call 1-800-OLOGYWOOD. Include as much detail as possible about the issue.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
              How do I report a problem with a booking?
            </h3>
            <p style={{ color: '#6b7280' }}>
              Contact our support team immediately with your booking details. We'll investigate and help resolve the issue.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
              Can I schedule a call with someone?
            </h3>
            <p style={{ color: '#6b7280' }}>
              Yes! For partnership inquiries or enterprise customers, please mention this in your message and we'll arrange a call.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
