import React, { useState } from 'react';
import { ContractManagementDashboard } from '../components/ContractManagementDashboard';
import { trpc } from '../lib/trpc';

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

export const ArtistDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'bookings'>('overview');
  
  // Fetch contracts using TRPC
  const { data: contractsData, isLoading, error } = trpc.contractManagement.getArtistContracts.useQuery();
  
  const contracts: Contract[] = contractsData?.map((c: any) => ({
    id: c.id.toString(),
    artistName: c.artistName,
    venueName: c.venueName,
    eventDate: c.eventDate,
    eventTime: c.eventTime,
    status: c.status,
    createdAt: c.createdAt,
    expiresAt: c.expiresAt,
    artistSigned: c.artistSigned,
    venueSigned: c.venueSigned,
    artistSignedAt: c.artistSignedAt,
    venueSignedAt: c.venueSignedAt,
    contractUrl: c.contractUrl,
  })) || [];

  const handleContractClick = (contractId: string) => {
    // Navigate to contract detail view
    console.log('View contract:', contractId);
  };

  const sendReminderMutation = trpc.contractManagement.sendManualReminders.useMutation();

  const handleSendReminder = async (contractIds: string[]) => {
    try {
      await sendReminderMutation.mutateAsync({ 
        contractIds: contractIds.map(id => parseInt(id, 10)) 
      });
      alert('Reminders sent successfully!');
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Failed to send reminders');
    }
  };

  const handleDownloadContract = async (contractId: string) => {
    try {
      const exportMutation = trpc.contractManagement.exportContractData.useMutation();
      const result = await exportMutation.mutateAsync({ contractId: parseInt(contractId, 10) });
      
      const blob = new Blob([result.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contractId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading contract:', error);
      alert('Failed to download contract');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <style>{`
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          margin-bottom: 30px;
        }

        .dashboard-header h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 10px 0;
          color: #1f2937;
        }

        .dashboard-header p {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
        }

        .tabs {
          display: flex;
          gap: 0;
          margin: 30px 0 20px 0;
          border-bottom: 2px solid #e5e7eb;
        }

        .tab-button {
          padding: 12px 20px;
          border: none;
          background: transparent;
          font-size: 15px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
          margin-bottom: -2px;
        }

        .tab-button.active {
          color: #7c3aed;
          border-bottom-color: #7c3aed;
        }

        .tab-button:hover {
          color: #1f2937;
        }

        .tab-content {
          display: none;
        }

        .tab-content.active {
          display: block;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.2);
        }

        .stat-card h3 {
          font-size: 14px;
          font-weight: 600;
          opacity: 0.9;
          margin: 0 0 10px 0;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          margin: 0;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        .loading-spinner {
          display: inline-block;
          width: 40px;
          height: 40px;
          border: 4px solid rgba(124, 58, 237, 0.3);
          border-top-color: #7c3aed;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-bottom: 10px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>🎤 Artist Dashboard</h1>
          <p>Manage your bookings, contracts, and performance details</p>
        </div>

        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-button ${activeTab === 'contracts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contracts')}
          >
            Contracts
          </button>
          <button
            className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </button>
        </div>

        <div className={`tab-content ${activeTab === 'overview' ? 'active' : ''}`}>
          <div className="overview-grid">
            <div className="stat-card">
              <h3>Total Contracts</h3>
              <p className="stat-value">{contracts.length}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Signature</h3>
              <p className="stat-value">{contracts.filter((c) => c.status === 'pending').length}</p>
            </div>
            <div className="stat-card">
              <h3>Signed Contracts</h3>
              <p className="stat-value">{contracts.filter((c) => c.status === 'signed').length}</p>
            </div>
            <div className="stat-card">
              <h3>Upcoming Events</h3>
              <p className="stat-value">
                {contracts.filter((c) => new Date(c.eventDate) > new Date()).length}
              </p>
            </div>
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'contracts' ? 'active' : ''}`}>
          {isLoading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Loading your contracts...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '20px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px' }}>
              <p>Error loading contracts. Please try again later.</p>
            </div>
          ) : (
            <ContractManagementDashboard
              contracts={contracts}
              userRole="artist"
              userName={contractsData?.[0]?.artistName || 'Your Name'}
              onContractClick={handleContractClick}
              onSendReminder={handleSendReminder}
              onDownloadContract={handleDownloadContract}
              isLoading={isLoading}
            />
          )}
        </div>

        <div className={`tab-content ${activeTab === 'bookings' ? 'active' : ''}`}>
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            <p>Bookings feature coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDashboard;
