import React, { useState } from 'react';
import { AlertCircle, TrendingUp, Clock, CheckCircle, Users } from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  responseTime?: number;
  slaStatus: 'on-track' | 'at-risk' | 'breached';
}

export const AdminTicketDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const stats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    avgResponseTime: 2.5,
    slaCompliance: 94,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return { bg: '#fef3c7', color: '#92400e' };
      case 'in-progress':
        return { bg: '#dbeafe', color: '#1e40af' };
      case 'resolved':
        return { bg: '#dcfce7', color: '#166534' };
      case 'closed':
        return { bg: '#e5e7eb', color: '#374151' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const getSLAColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return '#10b981';
      case 'at-risk':
        return '#f59e0b';
      case 'breached':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filterStatus !== 'all' && ticket.status !== filterStatus) return false;
    if (filterPriority !== 'all' && ticket.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', color: 'white', padding: '40px 20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Support Ticket Management</h1>
          <p style={{ fontSize: '16px', margin: 0, opacity: 0.9 }}>
            Monitor, assign, and resolve support tickets with SLA tracking
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>TOTAL TICKETS</p>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{stats.totalTickets}</p>
              </div>
              <AlertCircle size={32} color="#7c3aed" />
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>OPEN TICKETS</p>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{stats.openTickets}</p>
              </div>
              <Clock size={32} color="#f59e0b" />
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>AVG RESPONSE TIME</p>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{stats.avgResponseTime}h</p>
              </div>
              <TrendingUp size={32} color="#3b82f6" />
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>SLA COMPLIANCE</p>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{stats.slaCompliance}%</p>
              </div>
              <CheckCircle size={32} color="#10b981" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Priority
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {filteredTickets.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              <Users size={48} style={{ margin: '0 auto 15px', opacity: 0.5 }} />
              <p>No tickets found matching the selected filters</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Ticket ID</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Title</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Category</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Priority</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Status</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>SLA</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket, index) => (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        background: index % 2 === 0 ? 'white' : '#f9fafb',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = index % 2 === 0 ? 'white' : '#f9fafb';
                      }}
                    >
                      <td style={{ padding: '15px', fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>{ticket.id}</td>
                      <td style={{ padding: '15px', fontSize: '14px', color: '#1f2937' }}>{ticket.title}</td>
                      <td style={{ padding: '15px', fontSize: '14px', color: '#6b7280' }}>{ticket.category}</td>
                      <td style={{ padding: '15px', fontSize: '14px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: ticket.priority === 'urgent' ? '#fee2e2' : ticket.priority === 'high' ? '#fef3c7' : '#dbeafe',
                          color: ticket.priority === 'urgent' ? '#991b1b' : ticket.priority === 'high' ? '#92400e' : '#1e40af',
                          borderRadius: '4px',
                          fontWeight: '600',
                          fontSize: '12px',
                        }}>
                          {ticket.priority.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '15px', fontSize: '14px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: getStatusColor(ticket.status).bg,
                          color: getStatusColor(ticket.status).color,
                          borderRadius: '4px',
                          fontWeight: '600',
                          fontSize: '12px',
                        }}>
                          {ticket.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '15px', fontSize: '14px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: getSLAColor(ticket.slaStatus) + '20',
                          color: getSLAColor(ticket.slaStatus),
                          borderRadius: '4px',
                          fontWeight: '600',
                          fontSize: '12px',
                        }}>
                          {ticket.slaStatus.replace('-', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '15px', fontSize: '14px', color: '#6b7280' }}>
                        {ticket.assignedTo || 'Unassigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>PRIORITY</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1f2937' }}>
                      {selectedTicket.priority.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>SLA STATUS</p>
                    <p style={{ margin: 0, fontSize: '14px', color: getSLAColor(selectedTicket.slaStatus) }}>
                      {selectedTicket.slaStatus.replace('-', ' ').toUpperCase()}
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

export default AdminTicketDashboard;
