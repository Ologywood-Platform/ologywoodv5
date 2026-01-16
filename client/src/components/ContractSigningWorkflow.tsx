import React, { useState } from 'react';
import { SignatureCanvasComponent } from './SignatureCanvas';
import { ContractDisplay } from './ContractDisplay';

interface Signature {
  id: string;
  signerName: string;
  signerRole: 'artist' | 'venue';
  signatureData: string;
  timestamp: string;
  ipAddress?: string;
}

interface ContractSigningWorkflowProps {
  contractHtml: string;
  contractTitle: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  currentSignerRole: 'artist' | 'venue';
  currentSignerName: string;
  onSignatureSubmit: (signature: Signature) => Promise<void>;
  existingSignatures?: Signature[];
  isLoading?: boolean;
}

export const ContractSigningWorkflow: React.FC<ContractSigningWorkflowProps> = ({
  contractHtml,
  contractTitle,
  artistName,
  venueName,
  eventDate,
  currentSignerRole,
  currentSignerName,
  onSignatureSubmit,
  existingSignatures = [],
  isLoading = false,
}) => {
  const [step, setStep] = useState<'review' | 'sign' | 'confirm'>('review');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignatureCapture = (data: string) => {
    setSignatureData(data);
  };

  const handleSignClick = () => {
    setStep('sign');
  };

  const handleSubmitSignature = async () => {
    if (!signatureData) {
      setError('Please capture your signature before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const signature: Signature = {
        id: `sig-${Date.now()}`,
        signerName: currentSignerName,
        signerRole: currentSignerRole,
        signatureData,
        timestamp: new Date().toISOString(),
      };

      await onSignatureSubmit(signature);
      setSuccess(true);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit signature');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToReview = () => {
    setStep('review');
    setSignatureData(null);
  };

  const currentSignature = existingSignatures.find(
    (sig) => sig.signerRole === currentSignerRole
  );

  return (
    <div className="contract-signing-workflow">
      <style>{`
        .contract-signing-workflow {
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }

        .workflow-header {
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
          color: white;
          padding: 24px;
          text-align: center;
        }

        .workflow-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .workflow-header p {
          font-size: 16px;
          opacity: 0.9;
        }

        .workflow-steps {
          display: flex;
          justify-content: center;
          gap: 24px;
          padding: 24px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          flex-wrap: wrap;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
        }

        .step.active {
          color: #7c3aed;
        }

        .step.completed {
          color: #10b981;
        }

        .step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e5e7eb;
          font-weight: 700;
          font-size: 14px;
        }

        .step.active .step-number {
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
          color: white;
        }

        .step.completed .step-number {
          background: #10b981;
          color: white;
        }

        .workflow-content {
          padding: 32px;
        }

        .review-section {
          margin-bottom: 32px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e5e7eb;
        }

        .signature-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin: 16px 0;
        }

        .signature-item {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 16px;
        }

        .signature-item.signed {
          background: #ecfdf5;
          border-color: #86efac;
        }

        .signature-item.pending {
          background: #fffbeb;
          border-color: #fcd34d;
        }

        .signature-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .signature-item-name {
          font-weight: 600;
          color: #1f2937;
        }

        .signature-item-role {
          display: inline-block;
          background: #e5e7eb;
          color: #374151;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .signature-item-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
        }

        .signature-item-status.signed {
          color: #10b981;
        }

        .signature-item-status.pending {
          color: #f59e0b;
        }

        .signature-item-timestamp {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
        }

        .signature-item-image {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #d1d5db;
        }

        .signature-item-image img {
          max-width: 100%;
          max-height: 80px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }

        .info-box {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 16px;
          margin: 16px 0;
          border-radius: 6px;
        }

        .info-box p {
          color: #1e40af;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }

        .warning-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 16px;
          margin: 16px 0;
          border-radius: 6px;
        }

        .warning-box p {
          color: #92400e;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }

        .error-box {
          background: #fee2e2;
          border-left: 4px solid #ef4444;
          padding: 16px;
          margin: 16px 0;
          border-radius: 6px;
        }

        .error-box p {
          color: #991b1b;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }

        .success-box {
          background: #ecfdf5;
          border-left: 4px solid #10b981;
          padding: 16px;
          margin: 16px 0;
          border-radius: 6px;
        }

        .success-box p {
          color: #065f46;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }

        .workflow-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
          color: white;
          flex: 1;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #1f2937;
          flex: 1;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #d1d5db;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .workflow-steps {
            flex-direction: column;
            gap: 12px;
          }

          .workflow-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>

      {/* Header */}
      <div className="workflow-header">
        <h1>Contract Signing Workflow</h1>
        <p>Review, sign, and execute your performance agreement</p>
      </div>

      {/* Steps */}
      <div className="workflow-steps">
        <div className={`step ${step === 'review' ? 'active' : ''} ${step !== 'review' ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <span>Review Contract</span>
        </div>
        <div className={`step ${step === 'sign' ? 'active' : ''} ${step === 'confirm' ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <span>Sign Contract</span>
        </div>
        <div className={`step ${step === 'confirm' ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <span>Confirmation</span>
        </div>
      </div>

      {/* Content */}
      <div className="workflow-content">
        {step === 'review' && (
          <>
            <div className="section-title">📄 Contract Review</div>
            <div className="info-box">
              <p>
                Please carefully review the contract below. Once you sign, this becomes a legally binding agreement.
              </p>
            </div>

            <ContractDisplay
              contractHtml={contractHtml}
              contractTitle={contractTitle}
              artistName={artistName}
              venueName={venueName}
              eventDate={eventDate}
              onSign={handleSignClick}
              signatureStatus={currentSignature ? 'signed' : 'pending'}
              readOnly={false}
            />

            {existingSignatures.length > 0 && (
              <>
                <div className="section-title" style={{ marginTop: '32px' }}>
                  ✍️ Current Signatures
                </div>
                <div className="signature-list">
                  {existingSignatures.map((sig) => (
                    <div key={sig.id} className={`signature-item ${sig.signerRole === currentSignerRole ? 'signed' : 'pending'}`}>
                      <div className="signature-item-header">
                        <div>
                          <div className="signature-item-name">{sig.signerName}</div>
                          <span className="signature-item-role">{sig.signerRole}</span>
                        </div>
                      </div>
                      <div className={`signature-item-status ${sig.signerRole === currentSignerRole ? 'signed' : 'pending'}`}>
                        {sig.signerRole === currentSignerRole ? '✓ Signed' : '⏳ Pending'}
                      </div>
                      <div className="signature-item-timestamp">
                        {new Date(sig.timestamp).toLocaleString()}
                      </div>
                      {sig.signatureData && (
                        <div className="signature-item-image">
                          <img src={sig.signatureData} alt={`${sig.signerName}'s signature`} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {step === 'sign' && (
          <>
            <div className="section-title">✍️ Digital Signature</div>
            <div className="warning-box">
              <p>
                By signing below, you confirm that you have reviewed the contract and agree to all terms and conditions.
                Your signature will be timestamped and legally binding.
              </p>
            </div>

            <SignatureCanvasComponent
              onSignatureCapture={handleSignatureCapture}
              signerName={currentSignerName}
              signerRole={currentSignerRole}
              disabled={isSubmitting}
            />

            {error && (
              <div className="error-box">
                <p>❌ {error}</p>
              </div>
            )}

            <div className="workflow-actions">
              <button
                className="btn btn-secondary"
                onClick={handleBackToReview}
                disabled={isSubmitting}
              >
                ← Back to Review
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitSignature}
                disabled={!signatureData || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading-spinner" /> Submitting...
                  </>
                ) : (
                  '✓ Submit Signature'
                )}
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="section-title">✓ Signature Confirmed</div>
            <div className="success-box">
              <p>
                🎉 Your signature has been successfully submitted and timestamped. The contract is now signed by you.
                A confirmation email has been sent to all parties.
              </p>
            </div>

            <div className="info-box">
              <p>
                <strong>What happens next?</strong> The venue will review your signature and confirm receipt. You'll receive
                an email notification once all parties have signed.
              </p>
            </div>

            <div className="workflow-actions">
              <button className="btn btn-primary" onClick={() => window.print()}>
                🖨️ Print Signed Contract
              </button>
              <button className="btn btn-secondary" onClick={() => setStep('review')}>
                ← Back to Contract
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContractSigningWorkflow;
