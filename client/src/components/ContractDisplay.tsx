import React, { useState } from 'react';

interface ContractDisplayProps {
  contractHtml: string;
  contractTitle: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  onDownload?: () => void;
  onPrint?: () => void;
  onSign?: () => void;
  signatureStatus?: 'pending' | 'signed' | 'rejected';
  readOnly?: boolean;
}

export const ContractDisplay: React.FC<ContractDisplayProps> = ({
  contractHtml,
  contractTitle,
  artistName,
  venueName,
  eventDate,
  onDownload,
  onPrint,
  onSign,
  signatureStatus = 'pending',
  readOnly = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const statusColors: Record<string, string> = {
    pending: '#fbbf24',
    signed: '#10b981',
    rejected: '#ef4444',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Awaiting Signature',
    signed: 'Signed',
    rejected: 'Rejected',
  };

  return (
    <div className="contract-display">
      <style>{`
        .contract-display {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .contract-header {
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
          color: white;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .contract-header-info h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .contract-header-info p {
          font-size: 14px;
          opacity: 0.9;
        }

        .contract-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 12px;
          font-size: 13px;
        }

        .meta-item {
          background: rgba(255, 255, 255, 0.1);
          padding: 8px 12px;
          border-radius: 4px;
        }

        .meta-label {
          opacity: 0.8;
          display: block;
          margin-bottom: 2px;
        }

        .meta-value {
          font-weight: 600;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .contract-toolbar {
          display: flex;
          gap: 12px;
          padding: 16px 24px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          flex-wrap: wrap;
        }

        .toolbar-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          color: #374151;
        }

        .toolbar-btn:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .toolbar-btn.primary {
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
          color: white;
          border: none;
        }

        .toolbar-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        .toolbar-btn.danger {
          background: #fee2e2;
          color: #991b1b;
          border-color: #fca5a5;
        }

        .toolbar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .contract-content {
          padding: 32px;
          max-height: 600px;
          overflow-y: auto;
          background: white;
        }

        .contract-content iframe {
          width: 100%;
          height: 500px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }

        .contract-footer {
          padding: 16px 24px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .contract-footer-info {
          font-size: 12px;
          color: #6b7280;
        }

        .fullscreen-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .fullscreen-container {
          background: white;
          border-radius: 8px;
          width: 90%;
          height: 90%;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px rgba(0, 0, 0, 0.2);
        }

        .fullscreen-header {
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .fullscreen-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
        }

        .fullscreen-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        @media (max-width: 768px) {
          .contract-meta {
            grid-template-columns: 1fr;
          }

          .contract-toolbar {
            flex-direction: column;
          }

          .toolbar-btn {
            width: 100%;
            justify-content: center;
          }

          .fullscreen-container {
            width: 95%;
            height: 95%;
          }
        }
      `}</style>

      {/* Main Contract Display */}
      <div className="contract-display">
        {/* Header */}
        <div className="contract-header">
          <div className="contract-header-info">
            <h2>{contractTitle}</h2>
            <p>Professional Performance Rider Agreement</p>
            <div className="contract-meta">
              <div className="meta-item">
                <span className="meta-label">Artist</span>
                <span className="meta-value">{artistName}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Venue</span>
                <span className="meta-value">{venueName}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Event Date</span>
                <span className="meta-value">{eventDate}</span>
              </div>
            </div>
          </div>
          <div className="status-badge" style={{ color: statusColors[signatureStatus] }}>
            <span className="status-dot" />
            {statusLabels[signatureStatus]}
          </div>
        </div>

        {/* Toolbar */}
        <div className="contract-toolbar">
          <button className="toolbar-btn" onClick={() => setIsFullscreen(true)}>
            🖥️ Fullscreen
          </button>
          {onPrint && (
            <button className="toolbar-btn" onClick={onPrint}>
              🖨️ Print
            </button>
          )}
          {onDownload && (
            <button className="toolbar-btn" onClick={onDownload}>
              💾 Download
            </button>
          )}
          {onSign && signatureStatus === 'pending' && !readOnly && (
            <button className="toolbar-btn primary" onClick={onSign}>
              ✍️ Sign Contract
            </button>
          )}
          {signatureStatus === 'signed' && (
            <button className="toolbar-btn" disabled>
              ✓ Already Signed
            </button>
          )}
        </div>

        {/* Content */}
        <div className="contract-content">
          <div dangerouslySetInnerHTML={{ __html: contractHtml }} />
        </div>

        {/* Footer */}
        <div className="contract-footer">
          <div className="contract-footer-info">
            📄 This is a legally binding document. Please review carefully before signing.
          </div>
          <div className="contract-footer-info">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fullscreen-overlay" onClick={() => setIsFullscreen(false)}>
          <div className="fullscreen-container" onClick={(e) => e.stopPropagation()}>
            <div className="fullscreen-header">
              <h3>{contractTitle}</h3>
              <button className="fullscreen-close" onClick={() => setIsFullscreen(false)}>
                ✕
              </button>
            </div>
            <div className="fullscreen-content">
              <div dangerouslySetInnerHTML={{ __html: contractHtml }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractDisplay;
