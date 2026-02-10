import React, { useState } from 'react';
import { SupportTicketForm } from '../components/SupportTicketForm';

interface Ticket {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const SupportTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return { bg: '#fef3c7', color: '#92400e' };
      case 'in-progress':
        return { bg: '#dbeafe', color: '#1e40af' };
      case 'waiting-customer':
        return { bg: '#f3e8ff', color: '#6b21a8' };
      case 'resolved':
        return { bg: '#dcfce7', color: '#166534' };
      case 'closed':
        return { bg: '#e5e7eb', color: '#374151' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return '#3b82f6';
      case 'medium':
        return '#f59e0b';
      case 'high':
        return '#ef4444';
      case 'urgent':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', color: 'white', padding: '40px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Support Tickets</h1>
            <p style={{ fontSize: '16px', margin: 0, opacity: 0.9 }}>
              Track and manage your support requests
            </p>
          </div>
          <button
            onClick={() => setShowNewTicketForm(true)}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#7c3aed',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            + New Ticket
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {tickets.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '10px' }}>No Support Tickets</h2>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              You haven't created any support tickets yet. If you need help, create a new ticket or check our help center.
            </p>
            <button
              onClick={() => setShowNewTicketForm(true)}
              style={{
                padding: '10px 20px',
                background: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              Create Support Ticket
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                      {ticket.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                      {ticket.id}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{
                      padding: '4px 12px',
                      background: getPriorityColor(ticket.priority),
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      {ticket.priority.toUpperCase()}
                    </span>
                    <span style={{
                      padding: '4px 12px',
                      background: getStatusColor(ticket.status).bg,
                      color: getStatusColor(ticket.status).color,
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      {ticket.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280' }}>
                  <span>{ticket.category}</span>
                  <span>Updated {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewTicketForm && (
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
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
          }}>
            <button
              onClick={() => setShowNewTicketForm(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280',
                zIndex: 10,
              }}
            >
              ×
            </button>
            <div style={{ padding: '30px' }}>
              <SupportTicketForm onCancel={() => setShowNewTicketForm(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
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
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
          }}>
            <button
              onClick={() => setSelectedTicket(null)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280',
                zIndex: 10,
              }}
            >
              ×
            </button>
            <div style={{ padding: '30px' }}>
              <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {selectedTicket.title}
              </h2>
              <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>TICKET ID</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1f2937' }}>{selectedTicket.id}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>STATUS</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1f2937' }}>
                      {selectedTicket.status.replace('-', ' ').toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>CATEGORY</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1f2937' }}>{selectedTicket.category}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>PRIORITY</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1f2937' }}>
                      {selectedTicket.priority.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Created on {new Date(selectedTicket.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicketsPage;
