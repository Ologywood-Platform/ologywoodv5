import React, { useState } from 'react';
import { trpc } from '../lib/trpc';

interface VerificationResult {
  isValid: boolean;
  certificateNumber: string;
  signerName: string;
  signerEmail: string;
  signerRole: string;
  signedAt: string;
  expiresAt: string;
  tamperDetected: boolean;
  verificationCount: number;
  lastVerifiedAt?: string;
  auditTrail: Array<{
    action: string;
    timestamp: string;
    performedBy?: string;
    ipAddress?: string;
  }>;
}

export const CertificateVerification: React.FC = () => {
  const [certificateNumber, setCertificateNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyMutation = trpc.contractManagement.verifyCertificate.useMutation();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!certificateNumber.trim()) {
      setError('Please enter a certificate number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      // TODO: Replace with actual TRPC call
      // const result = await trpc.contracts.verifyCertificate.query({ certificateNumber });
      
      // Mock verification result
      const mockResult: VerificationResult = {
        isValid: true,
        certificateNumber: certificateNumber,
        signerName: 'John Smith',
        signerEmail: 'john@example.com',
        signerRole: 'artist',
        signedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        tamperDetected: false,
        verificationCount: 5,
        lastVerifiedAt: new Date().toISOString(),
        auditTrail: [
          {
            action: 'created',
            timestamp: new Date().toISOString(),
            performedBy: 'John Smith',
          },
          {
            action: 'verified',
            timestamp: new Date().toISOString(),
            ipAddress: '192.168.1.100',
          },
        ],
      };

      setVerificationResult(mockResult);
    } catch (err) {
      setError('Failed to verify certificate. Please check the certificate number and try again.');
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '40px 20px' }}>
      <style>{`
        .verification-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .verification-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .verification-header h1 {
          font-size: 36px;
          font-weight: 700;
          margin: 0 0 10px 0;
          color: #1f2937;
        }

        .verification-header p {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
        }

        .verification-form {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #1f2937;
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
          transition: border-color 0.3s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }

        .form-group input::placeholder {
          color: #9ca3af;
        }

        .submit-button {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          background: #fee2e2;
          color: #991b1b;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          border-left: 4px solid #dc2626;
        }

        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(124, 58, 237, 0.3);
          border-top-color: #7c3aed;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .result-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .result-header {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .result-status {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          color: white;
        }

        .status-badge.valid {
          background: #10b981;
        }

        .status-badge.invalid {
          background: #ef4444;
        }

        .result-body {
          padding: 20px;
        }

        .result-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .result-field {
          border: 1px solid #e5e7eb;
          padding: 12px;
          border-radius: 6px;
          background: #f9fafb;
        }

        .result-field-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .result-field-value {
          font-size: 14px;
          color: #1f2937;
          word-break: break-all;
        }

        .audit-trail {
          margin-top: 20px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }

        .audit-trail h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 15px 0;
          color: #1f2937;
        }

        .audit-entry {
          padding: 12px;
          background: #f9fafb;
          border-left: 3px solid #7c3aed;
          margin-bottom: 10px;
          border-radius: 4px;
        }

        .audit-entry-action {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .audit-entry-details {
          font-size: 13px;
          color: #6b7280;
        }

        .security-warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 12px;
          border-radius: 4px;
          margin-top: 15px;
          font-size: 13px;
          color: #92400e;
        }

        .help-text {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 12px;
          border-radius: 4px;
          margin-top: 15px;
          font-size: 13px;
          color: #1e40af;
        }

        @media (max-width: 768px) {
          .verification-header h1 {
            font-size: 28px;
          }

          .result-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="verification-container">
        <div className="verification-header">
          <h1>🔐 Verify Digital Signature</h1>
          <p>Enter a certificate number to verify the authenticity of a digital signature</p>
        </div>

        <form className="verification-form" onSubmit={handleVerify}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="certificateNumber">Certificate Number</label>
            <input
              id="certificateNumber"
              type="text"
              placeholder="e.g., SIG-2026-ABC123"
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading && <span className="loading-spinner"></span>}
            {isLoading ? 'Verifying...' : 'Verify Certificate'}
          </button>

          <div className="help-text">
            💡 <strong>Tip:</strong> You can find the certificate number in the contract document or email confirmation.
          </div>
        </form>

        {verificationResult && (
          <div className="result-container">
            <div className="result-header">
              <div className="result-status">
                <span className={`status-badge ${verificationResult.isValid ? 'valid' : 'invalid'}`}>
                  {verificationResult.isValid ? '✓ VERIFIED' : '✗ INVALID'}
                </span>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>
                  {verificationResult.certificateNumber}
                </span>
              </div>
            </div>

            <div className="result-body">
              <div className="result-grid">
                <div className="result-field">
                  <div className="result-field-label">Signer Name</div>
                  <div className="result-field-value">{verificationResult.signerName}</div>
                </div>

                <div className="result-field">
                  <div className="result-field-label">Signer Email</div>
                  <div className="result-field-value">{verificationResult.signerEmail}</div>
                </div>

                <div className="result-field">
                  <div className="result-field-label">Signer Role</div>
                  <div className="result-field-value" style={{ textTransform: 'capitalize' }}>
                    {verificationResult.signerRole}
                  </div>
                </div>

                <div className="result-field">
                  <div className="result-field-label">Signed Date</div>
                  <div className="result-field-value">
                    {new Date(verificationResult.signedAt).toLocaleString()}
                  </div>
                </div>

                <div className="result-field">
                  <div className="result-field-label">Expiration Date</div>
                  <div className="result-field-value">
                    {new Date(verificationResult.expiresAt).toLocaleString()}
                  </div>
                </div>

                <div className="result-field">
                  <div className="result-field-label">Verification Count</div>
                  <div className="result-field-value">{verificationResult.verificationCount}</div>
                </div>
              </div>

              {verificationResult.tamperDetected && (
                <div className="security-warning">
                  ⚠️ <strong>Warning:</strong> Tampering has been detected on this signature. This certificate may be fraudulent.
                </div>
              )}

              {verificationResult.lastVerifiedAt && (
                <div className="help-text">
                  ✓ Last verified: {new Date(verificationResult.lastVerifiedAt).toLocaleString()}
                </div>
              )}

              {verificationResult.auditTrail && verificationResult.auditTrail.length > 0 && (
                <div className="audit-trail">
                  <h3>Audit Trail</h3>
                  {verificationResult.auditTrail.map((entry, index) => (
                    <div key={index} className="audit-entry">
                      <div className="audit-entry-action">
                        {entry.action.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div className="audit-entry-details">
                        {new Date(entry.timestamp).toLocaleString()}
                        {entry.performedBy && ` • By: ${entry.performedBy}`}
                        {entry.ipAddress && ` • IP: ${entry.ipAddress}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateVerification;
