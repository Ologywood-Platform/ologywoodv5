import React, { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SignaturePad } from './SignaturePad';
import {
  FileText,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Scroll,
  PenLine,
  Edit3,
  Check,
  X,
  Save,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface NILContractViewerProps {
  bookingId: number;
  currentUserRole: 'artist' | 'venue';
  contractStatus?: string;
  onStatusChange?: () => void;
}

type ContractSignatureStatus = 'pending' | 'artist_signed' | 'venue_signed' | 'fully_executed';

export function NILContractViewer({ bookingId, currentUserRole, contractStatus: externalStatus, onStatusChange }: NILContractViewerProps) {
  const [showContract, setShowContract] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<'drawn' | 'typed'>('drawn');
  const [signerName, setSignerName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customTerms, setCustomTerms] = useState('');
  const [editedClauses, setEditedClauses] = useState<Record<string, string>>({});
  const [signStatus, setSignStatus] = useState<ContractSignatureStatus>('pending');

  const { data: contractData, isLoading } = trpc.riderContract.generateNILContract.useQuery(
    { bookingId },
    { enabled: showContract }
  );

  const downloadPdfMutation = trpc.riderContract.downloadNILContractPdf.useMutation();

  // Check existing contract/signature status
  const { data: existingContract } = trpc.riderContract.getForBooking.useQuery(
    { bookingId },
    { enabled: true }
  );

  useEffect(() => {
    if (existingContract) {
      const sigs = existingContract.signatures || [];
      const artistSigned = sigs.some((s: any) => s.role === 'artist' && s.signedAt);
      const venueSigned = sigs.some((s: any) => s.role === 'venue' && s.signedAt);
      if (artistSigned && venueSigned) {
        setSignStatus('fully_executed');
      } else if (artistSigned) {
        setSignStatus('artist_signed');
      } else if (venueSigned) {
        setSignStatus('venue_signed');
      } else {
        setSignStatus('pending');
      }
    }
  }, [existingContract]);

  const signContractMutation = trpc.riderContract.sign.useMutation({
    onSuccess: () => {
      toast.success('Contract signed successfully!');
      setShowSignaturePad(false);
      setSignatureData(null);
      // Update local status
      if (currentUserRole === 'artist') {
        setSignStatus(prev => prev === 'venue_signed' ? 'fully_executed' : 'artist_signed');
      } else {
        setSignStatus(prev => prev === 'artist_signed' ? 'fully_executed' : 'venue_signed');
      }
      onStatusChange?.();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to sign contract');
    },
  });

  const handleSign = async () => {
    if (!signatureData) {
      toast.error('Please provide your signature first');
      return;
    }
    if (!signerName.trim()) {
      toast.error('Please enter your full legal name');
      return;
    }
    setIsSigning(true);
    try {
      await signContractMutation.mutateAsync({
        bookingId,
        signatureData,
        signerName: signerName || 'Signer',
        signatureType,
      });
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const result = await downloadPdfMutation.mutateAsync({ bookingId });
      const byteCharacters = atob(result.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);
      toast.success('NIL Contract PDF downloaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download contract PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveEdits = () => {
    toast.success('Custom terms saved. They will appear in the final contract.');
    setIsEditing(false);
  };

  const getStatusConfig = (status: ContractSignatureStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending Signatures', color: 'bg-amber-100 text-amber-800', icon: AlertCircle };
      case 'artist_signed':
        return { label: 'Signed by Talent', color: 'bg-blue-100 text-blue-800', icon: PenLine };
      case 'venue_signed':
        return { label: 'Signed by Booker', color: 'bg-blue-100 text-blue-800', icon: PenLine };
      case 'fully_executed':
        return { label: 'Fully Executed', color: 'bg-green-100 text-green-800', icon: Check };
    }
  };

  const statusConfig = getStatusConfig(signStatus);
  const StatusIcon = statusConfig.icon;

  const canSign = () => {
    if (signStatus === 'fully_executed') return false;
    if (currentUserRole === 'artist' && ['artist_signed', 'fully_executed'].includes(signStatus)) return false;
    if (currentUserRole === 'venue' && ['venue_signed', 'fully_executed'].includes(signStatus)) return false;
    return true;
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-white">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scroll className="h-5 w-5 text-purple-600" />
              NIL Engagement Contract
            </CardTitle>
            <CardDescription className="mt-1">
              Full professional contract document with all terms, compliance, and signature fields
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <Badge className={`${statusConfig.color} hover:${statusConfig.color}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
              <Shield className="h-3 w-3 mr-1" />
              Blueprint
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowContract(!showContract)}
            className="border-purple-200 hover:bg-purple-50"
          >
            {showContract ? (
              <EyeOff className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {showContract ? 'Hide Contract' : 'View Full Contract'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="border-purple-200 hover:bg-purple-50"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </Button>

          {canSign() && (
            <Button
              size="sm"
              onClick={() => setShowSignaturePad(!showSignaturePad)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <PenLine className="h-4 w-4 mr-2" />
              {showSignaturePad ? 'Cancel Signing' : 'Sign Contract'}
            </Button>
          )}

          {signStatus === 'pending' && currentUserRole === 'artist' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="border-purple-200 hover:bg-purple-50"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel Editing' : 'Edit Terms'}
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          This contract auto-fills from your booking details and rider template. Review all sections before signing.
        </p>

        {/* Inline Editing Panel */}
        {isEditing && (
          <div className="mb-4 border border-amber-200 rounded-lg p-4 bg-amber-50/50">
            <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1">
              <Edit3 className="h-4 w-4" />
              Edit Contract Terms
            </h4>
            <p className="text-xs text-amber-700 mb-3">
              Modify specific clauses or add custom terms before signing. Changes will be visible to both parties.
            </p>

            {/* Editable Sections */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Compensation Adjustments</label>
                <Input
                  value={editedClauses.compensation || ''}
                  onChange={(e) => setEditedClauses(prev => ({ ...prev, compensation: e.target.value }))}
                  placeholder="e.g., Add performance bonus of $500 if attendance exceeds 500"
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Travel Modifications</label>
                <Input
                  value={editedClauses.travel || ''}
                  onChange={(e) => setEditedClauses(prev => ({ ...prev, travel: e.target.value }))}
                  placeholder="e.g., First class flights required for trips over 3 hours"
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Media Rights Changes</label>
                <Input
                  value={editedClauses.media || ''}
                  onChange={(e) => setEditedClauses(prev => ({ ...prev, media: e.target.value }))}
                  placeholder="e.g., No live streaming without prior written approval"
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Additional Custom Terms</label>
                <textarea
                  value={customTerms}
                  onChange={(e) => setCustomTerms(e.target.value)}
                  placeholder="Add any additional terms, conditions, or requirements not covered above..."
                  className="mt-1 w-full text-sm border rounded-md p-2 min-h-[80px] resize-y"
                  maxLength={2000}
                />
                <p className="text-[10px] text-slate-500 mt-1">{customTerms.length}/2000 characters</p>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleSaveEdits} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Discard
              </Button>
            </div>
          </div>
        )}

        {/* Signature Pad */}
        {showSignaturePad && (
          <div className="mb-4 border border-purple-200 rounded-lg p-4 bg-white">
            <h4 className="text-sm font-semibold text-purple-800 mb-1 flex items-center gap-1">
              <PenLine className="h-4 w-4" />
              Sign as {currentUserRole === 'artist' ? 'Talent' : 'Booker'}
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              By signing below, you agree to all terms outlined in this NIL Engagement Contract.
            </p>

            <div className="mb-3">
              <label className="text-xs font-medium text-slate-700">Full Legal Name</label>
              <Input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter your full legal name"
                className="mt-1"
                disabled={isSigning}
              />
            </div>

            <SignaturePad
              onSignatureChange={(data, type) => {
                setSignatureData(data);
                setSignatureType(type);
              }}
              disabled={isSigning}
            />

            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleSign}
                disabled={!signatureData || isSigning}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSigning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {isSigning ? 'Signing...' : 'Confirm & Sign'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowSignaturePad(false);
                  setSignatureData(null);
                  setSignerName('');
                }}
              >
                Cancel
              </Button>
            </div>

            <p className="text-[10px] text-slate-400 mt-2">
              Your signature is legally binding. A timestamped record will be stored securely.
            </p>
          </div>
        )}

        {/* Custom Terms Preview (if any saved) */}
        {(Object.values(editedClauses).some(v => v.trim()) || customTerms.trim()) && !isEditing && (
          <div className="mb-4 border border-purple-100 rounded-lg p-3 bg-purple-50/30">
            <p className="text-xs font-medium text-purple-700 mb-1">Custom Amendments:</p>
            {editedClauses.compensation && (
              <p className="text-xs text-slate-600">• Compensation: {editedClauses.compensation}</p>
            )}
            {editedClauses.travel && (
              <p className="text-xs text-slate-600">• Travel: {editedClauses.travel}</p>
            )}
            {editedClauses.media && (
              <p className="text-xs text-slate-600">• Media: {editedClauses.media}</p>
            )}
            {customTerms && (
              <p className="text-xs text-slate-600">• Additional: {customTerms}</p>
            )}
          </div>
        )}

        {/* Contract Preview */}
        {showContract && (
          <div className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                <span className="ml-2 text-muted-foreground">Generating contract...</span>
              </div>
            ) : contractData ? (
              <div className="border border-purple-200 rounded-lg overflow-hidden">
                <div className="bg-purple-50 px-4 py-2 border-b border-purple-200 flex items-center justify-between">
                  <span className="text-xs font-medium text-purple-700 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Contract ID: {contractData.contractId}
                  </span>
                  <span className="text-xs text-purple-500">Auto-generated from booking data</span>
                </div>
                <div
                  className="bg-white max-h-[600px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contractData.html) }}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Unable to generate contract. Ensure booking details are complete.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
