import React, { useState } from 'react';
import { HelpCenter } from '../components/HelpCenter';
import { SupportTicketForm } from '../components/SupportTicketForm';

export const HelpCenterPage: React.FC = () => {
  const [showTicketForm, setShowTicketForm] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', color: 'white', padding: '40px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Help Center</h1>
          <p style={{ fontSize: '16px', margin: 0, opacity: 0.9 }}>
            Find answers to common questions about contracts, bookings, and more
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '40px' }}>
          {/* Help Center */}
          <div>
            <HelpCenter />
          </div>

          {/* Sidebar */}
          <div>
            {/* Quick Links */}
            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Quick Links</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                <li style={{ marginBottom: '10px' }}>
                  <a href="#" style={{ color: '#7c3aed', textDecoration: 'none', fontSize: '14px' }}>
                    Getting Started
                  </a>
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <a href="#" style={{ color: '#7c3aed', textDecoration: 'none', fontSize: '14px' }}>
                    Contract Management
                  </a>
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <a href="#" style={{ color: '#7c3aed', textDecoration: 'none', fontSize: '14px' }}>
                    Booking Process
                  </a>
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <a href="#" style={{ color: '#7c3aed', textDecoration: 'none', fontSize: '14px' }}>
                    Payment & Billing
                  </a>
                </li>
                <li>
                  <a href="#" style={{ color: '#7c3aed', textDecoration: 'none', fontSize: '14px' }}>
                    Signature Verification
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Ticket */}
            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Still Need Help?</h3>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#6b7280' }}>
                Can't find what you're looking for? Create a support ticket and our team will help.
              </p>
              <button
                onClick={() => setShowTicketForm(!showTicketForm)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>

        {/* Ticket Form Modal */}
        {showTicketForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
            }}>
              <button
                onClick={() => setShowTicketForm(false)}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                ×
              </button>
              <div style={{ padding: '30px' }}>
                <SupportTicketForm onCancel={() => setShowTicketForm(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpCenterPage;
