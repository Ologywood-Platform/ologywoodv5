import React, { useState, useMemo } from 'react';

interface Contract {
  id: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  eventTime: string;
  status: 'pending' | 'signed' | 'expired' | 'rejected';
  createdAt: string;
  expiresAt: string;
  artistSigned: boolean;
  venueSigned: boolean;
  artistSignedAt?: string;
  venueSignedAt?: string;
  contractUrl: string;
}

interface ContractManagementDashboardProps {
  contracts: Contract[];
  userRole: 'artist' | 'venue';
  userName: string;
  onContractClick: (contractId: string) => void;
  onSendReminder: (contractIds: string[]) => Promise<void>;
  onDownloadContract: (contractId: string) => Promise<void>;
  isLoading?: boolean;
}

export const ContractManagementDashboard: React.FC<ContractManagementDashboardProps> = ({
  contracts,
  userRole,
  userName,
  onContractClick,
  onSendReminder,
  onDownloadContract,
  isLoading = false,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'signed' | 'expired' | 'rejected'>('all');
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'name'>('date');
  const [isReminderSending, setIsReminderSending] = useState(false);

  // Filter and sort contracts
  const filteredContracts = useMemo(() => {
    let filtered = contracts;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((c) => c.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'name':
          const nameA = userRole === 'artist' ? a.venueName : a.artistName;
          const nameB = userRole === 'artist' ? b.venueName : b.artistName;
          return nameA.localeCompare(nameB);
        default:
          return 0;
      }
    });

    return filtered;
  }, [contracts, filterStatus, sortBy, userRole]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: contracts.length,
      pending: contracts.filter((c) => c.status === 'pending').length,
      signed: contracts.filter((c) => c.status === 'signed').length,
      expired: contracts.filter((c) => c.status === 'expired').length,
      rejected: contracts.filter((c) => c.status === 'rejected').length,
    };
  }, [contracts]);

  const handleSelectAll = () => {
    if (selectedContracts.size === filteredContracts.length) {
      setSelectedContracts(new Set());
    } else {
      setSelectedContracts(new Set(filteredContracts.map((c) => c.id)));
    }
  };

  const handleSelectContract = (contractId: string) => {
    const newSelected = new Set(selectedContracts);
    if (newSelected.has(contractId)) {
      newSelected.delete(contractId);
    } else {
      newSelected.add(contractId);
    }
    setSelectedContracts(newSelected);
  };

  const handleSendReminders = async () => {
    if (selectedContracts.size === 0) return;

    setIsReminderSending(true);
    try {
      await onSendReminder(Array.from(selectedContracts));
      setSelectedContracts(new Set());
    } catch (error) {
      console.error('Error sending reminders:', error);
    } finally {
      setIsReminderSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'expired':
        return '#ef4444';
      case 'rejected':
        return '#6366f1';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'signed':
        return '✓ Signed';
      case 'pending':
        return '⏳ Pending';
      case 'expired':
        return '⏰ Expired';
      case 'rejected':
        return '✕ Rejected';
      default:
        return status;
    }
  };

  return (
    <div className="contract-management-dashboard">
      <style>{`
        .contract-management-dashboard {
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }

        .dashboard-header {
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
          color: white;
          padding: 32px 24px;
        }

        .dashboard-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .dashboard-header p {
          font-size: 16px;
          opacity: 0.9;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-top: 20px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.1);
          padding: 16px;
          border-radius: 6px;
          text-align: center;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          display: block;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.8;
          margin-top: 4px;
        }

        .dashboard-controls {
          display: flex;
          gap: 16px;
          padding: 24px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          flex-wrap: wrap;
          align-items: center;
        }

        .control-group {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .control-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          font-size: 14px;
          cursor: pointer;
        }

        .bulk-actions {
          display: flex;
          gap: 8px;
          margin-left: auto;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #1f2937;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #d1d5db;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .contracts-table {
          width: 100%;
          border-collapse: collapse;
        }

        .contracts-table thead {
          background: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
        }

        .contracts-table th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          color: #374151;
          text-transform: uppercase;
        }

        .contracts-table tbody tr {
          border-bottom: 1px solid #e5e7eb;
          transition: background 0.2s;
        }

        .contracts-table tbody tr:hover {
          background: #f9fafb;
        }

        .contracts-table td {
          padding: 16px;
          font-size: 14px;
        }

        .checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .contract-name {
          font-weight: 600;
          color: #1f2937;
        }

        .contract-date {
          color: #6b7280;
          font-size: 13px;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .signature-status {
          display: flex;
          gap: 8px;
          font-size: 12px;
        }

        .signature-indicator {
          padding: 2px 8px;
          border-radius: 4px;
          background: #e5e7eb;
          color: #374151;
        }

        .signature-indicator.signed {
          background: #d1fae5;
          color: #065f46;
        }

        .row-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .empty-state {
          text-align: center;
          padding: 60px 24px;
          color: #6b7280;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(124, 58, 237, 0.3);
          border-top-color: #7c3aed;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .dashboard-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .bulk-actions {
            margin-left: 0;
            width: 100%;
          }

          .contracts-table {
            font-size: 12px;
          }

          .contracts-table th,
          .contracts-table td {
            padding: 12px 8px;
          }

          .row-actions {
            flex-direction: column;
          }
        }
      `}</style>

      {/* Header */}
      <div className="dashboard-header">
        <h1>📋 Contract Management</h1>
        <p>Manage and track all your performance rider contracts</p>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Contracts</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.signed}</span>
            <span className="stat-label">Signed</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.expired}</span>
            <span className="stat-label">Expired</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="dashboard-controls">
        <div className="control-group">
          <label className="control-label">Filter by Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
            <option value="all">All Contracts</option>
            <option value="pending">Pending Signature</option>
            <option value="signed">Fully Signed</option>
            <option value="expired">Expired</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="control-group">
          <label className="control-label">Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="date">Event Date</option>
            <option value="status">Status</option>
            <option value="name">{userRole === 'artist' ? 'Venue' : 'Artist'} Name</option>
          </select>
        </div>

        {selectedContracts.size > 0 && (
          <div className="bulk-actions">
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              {selectedContracts.size} selected
            </span>
            <button
              className="btn btn-primary"
              onClick={handleSendReminders}
              disabled={isReminderSending}
            >
              {isReminderSending ? (
                <>
                  <span className="loading-spinner" /> Sending...
                </>
              ) : (
                '📧 Send Reminders'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Contracts Table */}
      {filteredContracts.length > 0 ? (
        <table className="contracts-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={selectedContracts.size === filteredContracts.length && filteredContracts.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>{userRole === 'artist' ? 'Venue' : 'Artist'}</th>
              <th>Event Date</th>
              <th>Status</th>
              <th>Signatures</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContracts.map((contract) => (
              <tr key={contract.id}>
                <td>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selectedContracts.has(contract.id)}
                    onChange={() => handleSelectContract(contract.id)}
                  />
                </td>
                <td>
                  <div className="contract-name">
                    {userRole === 'artist' ? contract.venueName : contract.artistName}
                  </div>
                  <div className="contract-date">
                    {new Date(contract.eventDate).toLocaleDateString()} at {contract.eventTime}
                  </div>
                </td>
                <td>
                  <div className="contract-date">
                    {new Date(contract.eventDate).toLocaleDateString()}
                  </div>
                </td>
                <td>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(contract.status) }}
                  >
                    {getStatusLabel(contract.status)}
                  </span>
                </td>
                <td>
                  <div className="signature-status">
                    <span className={`signature-indicator ${contract.artistSigned ? 'signed' : ''}`}>
                      {contract.artistSigned ? '✓ Artist' : '○ Artist'}
                    </span>
                    <span className={`signature-indicator ${contract.venueSigned ? 'signed' : ''}`}>
                      {contract.venueSigned ? '✓ Venue' : '○ Venue'}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="action-btn"
                      onClick={() => onContractClick(contract.id)}
                    >
                      👁️ View
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => onDownloadContract(contract.id)}
                    >
                      💾 Download
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">
          <h3>No Contracts Found</h3>
          <p>
            {filterStatus === 'all'
              ? 'You don\'t have any contracts yet.'
              : `No contracts with status "${filterStatus}".`}
          </p>
        </div>
      )}
    </div>
  );
};

export default ContractManagementDashboard;
