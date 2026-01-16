/**
 * Enhanced Contract Signing Workflow with PDF Download
 * Allows users to sign contracts and download PDF copies
 */

import React, { useState } from 'react';
import { SignatureCanvas } from './SignatureCanvas';
import { trpc } from '../lib/trpc';

interface ContractData {
  contractId: string;
  contractTitle: string;
  artistName: string;
  artistEmail: string;
  venueName: string;
  venueEmail: string;
  eventDate: string;
  eventVenue: string;
  performanceFee: number;
  paymentTerms: string;
  performanceDetails: Record<string, any>;
  technicalRequirements: Record<string, any>;
  isSigned: boolean;
  certificateNumber?: string;
  signedAt?: string;
}

interface ContractSigningWorkflowWithPdfProps {
  contract: ContractData;
  onSignatureComplete?: (certificateNumber: string) => void;
}

export const ContractSigningWorkflowWithPdf: React.FC<ContractSigningWorkflowWithPdfProps> = ({
  contract,
  onSignatureComplete,
}) => {
  const [step, setStep] = useState<'review' | 'sign' | 'verify' | 'download'>('review');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerRole, setSignerRole] = useState<'artist' | 'venue'>('artist');
  const [isLoading, setIsLoading] = useState(false);
  const [certificateNumber, setCertificateNumber] = useState<string | null>(null);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generatePdfMutation = trpc.contractPdf.generatePdf.useMutation();
  const archivePdfMutation = trpc.contractPdf.archivePdf.useMutation();

  /**
   * Handle signature capture
   */
  const handleSignatureCapture = async (signatureData: string) => {
    try {
      setIsLoading(true);
      setSignatureImage(signatureData);

      // Move to verification step
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture signature');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate PDF for the contract
   */
  const handleGeneratePdf = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const pdfResult = await generatePdfMutation.mutateAsync({
        contractId: contract.contractId,
        contractTitle: contract.contractTitle,
        artistName: contract.artistName,
        artistEmail: contract.artistEmail,
        venueName: contract.venueName,
        venueEmail: contract.venueEmail,
        eventDate: contract.eventDate,
        eventVenue: contract.eventVenue,
        performanceFee: contract.performanceFee,
        paymentTerms: contract.paymentTerms,
        performanceDetails: contract.performanceDetails,
        technicalRequirements: contract.technicalRequirements,
        artistSignatureImage: signatureImage || undefined,
        certificateNumber: certificateNumber || undefined,
        isSigned: contract.isSigned || !!certificateNumber,
      });

      if (pdfResult.success) {
        // Create blob from base64
        const binaryString = atob(pdfResult.pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });

        // Create download link
        const url = URL.createObjectURL(blob);
        setPdfDownloadUrl(url);

        // Archive the PDF
        await archivePdfMutation.mutateAsync({
          contractId: contract.contractId,
          pdfBase64: pdfResult.pdfBase64,
          metadata: pdfResult.metadata,
        });

        setStep('download');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Download PDF
   */
  const handleDownloadPdf = () => {
    if (pdfDownloadUrl) {
      const link = document.createElement('a');
      link.href = pdfDownloadUrl;
      link.download = `contract-${contract.contractId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  /**
   * Handle signature confirmation
   */
  const handleConfirmSignature = async () => {
    try {
      setIsLoading(true);

      // In production, this would call the backend to save the signature
      // and generate a certificate number
      const newCertificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setCertificateNumber(newCertificateNumber);

      // Notify parent component
      if (onSignatureComplete) {
        onSignatureComplete(newCertificateNumber);
      }

      // Generate PDF with signature
      await handleGeneratePdf();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm signature');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{contract.contractTitle}</h2>
        <p className="text-gray-600">Contract ID: {contract.contractId}</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className={`flex-1 h-2 rounded ${step === 'review' || ['sign', 'verify', 'download'].includes(step) ? 'bg-purple-600' : 'bg-gray-300'}`} />
          <div className={`flex-1 h-2 rounded mx-2 ${step === 'sign' || ['verify', 'download'].includes(step) ? 'bg-purple-600' : 'bg-gray-300'}`} />
          <div className={`flex-1 h-2 rounded mx-2 ${step === 'verify' || step === 'download' ? 'bg-purple-600' : 'bg-gray-300'}`} />
          <div className={`flex-1 h-2 rounded ml-2 ${step === 'download' ? 'bg-purple-600' : 'bg-gray-300'}`} />
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Review</span>
          <span>Sign</span>
          <span>Verify</span>
          <span>Download</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-semibold">Error</p>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Step Content */}
      {step === 'review' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Artist</h3>
              <p className="text-gray-700">{contract.artistName}</p>
              <p className="text-gray-600 text-sm">{contract.artistEmail}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Venue</h3>
              <p className="text-gray-700">{contract.venueName}</p>
              <p className="text-gray-600 text-sm">{contract.venueEmail}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Event Date</h3>
              <p className="text-gray-700">{new Date(contract.eventDate).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Performance Fee</h3>
              <p className="text-gray-700">${contract.performanceFee.toLocaleString()}</p>
            </div>
          </div>

          <button
            onClick={() => setStep('sign')}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Proceed to Sign'}
          </button>
        </div>
      )}

      {step === 'sign' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Signer Name</label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Signer Role</label>
            <select
              value={signerRole}
              onChange={(e) => setSignerRole(e.target.value as 'artist' | 'venue')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="artist">Artist</option>
              <option value="venue">Venue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Digital Signature</label>
            <SignatureCanvas onSignatureCapture={handleSignatureCapture} />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('review')}
              className="flex-1 bg-gray-300 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
              disabled={isLoading}
            >
              Back
            </button>
            <button
              onClick={() => setStep('verify')}
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
              disabled={!signatureImage || !signerName || isLoading}
            >
              {isLoading ? 'Processing...' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Signature Verification</h3>
            <p className="text-blue-800 mb-4">Please review your signature and confirm it is correct before proceeding.</p>

            {signatureImage && (
              <div className="mb-4 p-4 bg-white border border-blue-200 rounded">
                <img src={signatureImage} alt="Signature Preview" className="max-h-32 mx-auto" />
              </div>
            )}

            <div className="space-y-2 text-sm text-blue-800">
              <p>
                <strong>Signer:</strong> {signerName}
              </p>
              <p>
                <strong>Role:</strong> {signerRole === 'artist' ? 'Artist' : 'Venue'}
              </p>
              <p>
                <strong>Timestamp:</strong> {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('sign')}
              className="flex-1 bg-gray-300 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
              disabled={isLoading}
            >
              Back
            </button>
            <button
              onClick={handleConfirmSignature}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Confirm & Generate PDF'}
            </button>
          </div>
        </div>
      )}

      {step === 'download' && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">✓</div>
            <h3 className="text-2xl font-bold text-green-900 mb-2">Contract Signed Successfully!</h3>
            <p className="text-green-800 mb-4">Your contract has been signed and a PDF copy has been generated.</p>

            {certificateNumber && (
              <div className="bg-white p-4 rounded border border-green-200 mb-4">
                <p className="text-sm text-gray-600">Certificate Number</p>
                <p className="text-lg font-mono font-bold text-green-900">{certificateNumber}</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">PDF Download</h3>
            <p className="text-blue-800 mb-4">Download your signed contract as a PDF for your records.</p>

            <button
              onClick={handleDownloadPdf}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={!pdfDownloadUrl || isLoading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {isLoading ? 'Preparing...' : 'Download PDF'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-600 text-sm mb-4">
              A copy of this contract has been automatically archived and can be accessed from your dashboard at any time.
            </p>
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractSigningWorkflowWithPdf;
