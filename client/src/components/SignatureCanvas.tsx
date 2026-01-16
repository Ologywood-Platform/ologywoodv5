import React, { useRef, useState } from 'react';
import SignaturePad from 'react-signature-canvas';

interface SignatureCanvasProps {
  onSignatureCapture: (signatureData: string) => void;
  signerName: string;
  signerRole: 'artist' | 'venue';
  disabled?: boolean;
}

export const SignatureCanvasComponent: React.FC<SignatureCanvasProps> = ({
  onSignatureCapture,
  signerName,
  signerRole,
  disabled = false,
}) => {
  const signaturePadRef = useRef<SignaturePad>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);

  const handleClear = () => {
    signaturePadRef.current?.clear();
    setIsEmpty(true);
    setSignatureImage(null);
  };

  const handleSave = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signatureData = signaturePadRef.current.toDataURL('image/png');
      setSignatureImage(signatureData);
      onSignatureCapture(signatureData);
    }
  };

  const handleDrawStart = () => {
    setIsEmpty(false);
  };

  return (
    <div className="signature-canvas-container">
      <style>{`
        .signature-canvas-container {
          background: white;
          border-radius: 8px;
          padding: 24px;
          margin: 20px 0;
        }

        .signature-header {
          margin-bottom: 16px;
        }

        .signature-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .signature-header p {
          font-size: 14px;
          color: #6b7280;
        }

        .signature-role-badge {
          display: inline-block;
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          margin-left: 8px;
        }

        .canvas-wrapper {
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          background: #fafafa;
          overflow: hidden;
          margin: 16px 0;
          position: relative;
        }

        .canvas-wrapper.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        canvas {
          display: block;
          width: 100% !important;
          height: 200px !important;
          cursor: ${disabled ? 'not-allowed' : 'crosshair'};
          background: white;
        }

        .signature-preview {
          margin: 16px 0;
          padding: 12px;
          background: #f3f4f6;
          border-radius: 6px;
          text-align: center;
        }

        .signature-preview img {
          max-width: 100%;
          max-height: 150px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }

        .signature-preview p {
          font-size: 13px;
          color: #6b7280;
          margin-top: 8px;
        }

        .signature-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-clear {
          background: #e5e7eb;
          color: #1f2937;
          flex: 1;
        }

        .btn-clear:hover:not(:disabled) {
          background: #d1d5db;
        }

        .btn-save {
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
          color: white;
          flex: 1;
        }

        .btn-save:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .signature-instructions {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #1e40af;
        }

        .signature-timestamp {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
        }
      `}</style>

      <div className="signature-header">
        <h3>
          Digital Signature
          <span className="signature-role-badge">{signerRole}</span>
        </h3>
        <p>Signer: <strong>{signerName}</strong></p>
      </div>

      <div className="signature-instructions">
        📝 Sign below to electronically sign this contract. Your signature will be timestamped and legally binding.
      </div>

      <div className={`canvas-wrapper ${disabled ? 'disabled' : ''}`}>
        <SignaturePad
          ref={signaturePadRef}
          canvasProps={{
            width: 500,
            height: 200,
            className: 'signature-pad-canvas',
          }}
          onEnd={handleDrawStart}
          disabled={disabled}
        />
      </div>

      {signatureImage && (
        <div className="signature-preview">
          <img src={signatureImage} alt="Signature preview" />
          <p>✓ Signature captured successfully</p>
          <div className="signature-timestamp">
            Captured at: {new Date().toLocaleString()}
          </div>
        </div>
      )}

      <div className="signature-actions">
        <button
          className="btn btn-clear"
          onClick={handleClear}
          disabled={isEmpty || disabled}
        >
          Clear
        </button>
        <button
          className="btn btn-save"
          onClick={handleSave}
          disabled={isEmpty || disabled}
        >
          Save Signature
        </button>
      </div>
    </div>
  );
};

export default SignatureCanvasComponent;
