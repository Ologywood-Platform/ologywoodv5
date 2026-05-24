import React, { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SignaturePad } from './SignaturePad';
import {
  FileText,
  CheckCircle2,
  Clock,
  PenTool,
  Shield,
  Download,
  Eye,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface RiderContractSigningProps {
  bookingId: number;
  currentUserRole: 'artist' | 'venue';
  onSigningComplete?: () => void;
}

export function RiderContractSigning({
  bookingId,
  currentUserRole,
  onSigningComplete,
}: RiderContractSigningProps) {
  const [showSigningForm, setShowSigningForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<'drawn' | 'typed'>('drawn');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = trpc.riderContract.getForBooking.useQuery(
    { bookingId },
    { enabled: bookingId > 0 }
  );

  const { data: previewData } = trpc.riderContract.getRiderPreview.useQuery(
    { bookingId },
    { enabled: bookingId > 0 && showPreview }
  );

  const signMutation = trpc.riderContract.sign.useMutation({
    onSuccess: (result) => {
      toast.success(
        result.contractStatus === 'fully_signed'
          ? 'Contract fully signed! Both parties have agreed.'
          : 'Signature recorded successfully. Waiting for the other party to sign.'
      );
      setShowSigningForm(false);
      setSignerName('');
      setSignatureData(null);
      setAgreedToTerms(false);
      refetch();
      onSigningComplete?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to sign contract');
    },
  });

  const handleSign = () => {
    if (!signerName.trim()) {
      toast.error('Please enter your full legal name');
      return;
    }
    if (!signatureData) {
      toast.error('Please provide your signature');
      return;
    }
    if (!agreedToTerms) {
      toast.error('Please agree to the terms before signing');
      return;
    }

    signMutation.mutate({
      bookingId,
      signatureData,
      signerName: signerName.trim(),
      signatureType,
    });
  };

  const handleSignatureChange = (data: string | null, type: 'drawn' | 'typed') => {
    setSignatureData(data);
    setSignatureType(type);
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const downloadPdfMutation = trpc.riderContract.downloadPdf.useMutation();

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const result = await downloadPdfMutation.mutateAsync({ bookingId });
      // Convert base64 to blob and download
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
      toast.success('Contract PDF downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading contract...</span>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.booking.riderTemplateId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rider Contract
          </CardTitle>
          <CardDescription>No rider template attached to this booking yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const contractStatus = data.contract?.status || 'pending';
  const artistSig = data.signatures.find((s: any) => s.signerRole === 'artist');
  const venueSig = data.signatures.find((s: any) => s.signerRole === 'venue');
  const currentUserSigned =
    (currentUserRole === 'artist' && artistSig) ||
    (currentUserRole === 'venue' && venueSig);
  const isFullySigned = contractStatus === 'fully_signed';

  const getStatusBadge = () => {
    switch (contractStatus) {
      case 'fully_signed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Fully Signed
          </Badge>
        );
      case 'signed_by_artist':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Clock className="h-3 w-3 mr-1" />
            Artist Signed — Awaiting Venue
          </Badge>
        );
      case 'signed_by_venue':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Clock className="h-3 w-3 mr-1" />
            Venue Signed — Awaiting Artist
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <PenTool className="h-3 w-3 mr-1" />
            Awaiting Signatures
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Contract Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Rider Contract
              </CardTitle>
              <CardDescription className="mt-1">
                {data.riderTemplate?.templateName || 'Performance Rider'}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          {/* Signature Status */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Artist Signature */}
            <div
              className={`p-4 rounded-lg border-2 ${
                artistSig ? 'border-green-200 bg-green-50' : 'border-dashed border-gray-200 bg-gray-50'
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Artist Signature
              </p>
              {artistSig ? (
                <div>
                  <img
                    src={artistSig.signatureData}
                    alt="Artist signature"
                    className="max-h-12 mb-2"
                  />
                  <p className="text-sm font-medium">{artistSig.signerName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(artistSig.signedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Not yet signed</p>
              )}
            </div>

            {/* Venue Signature */}
            <div
              className={`p-4 rounded-lg border-2 ${
                venueSig ? 'border-green-200 bg-green-50' : 'border-dashed border-gray-200 bg-gray-50'
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Venue Signature
              </p>
              {venueSig ? (
                <div>
                  <img
                    src={venueSig.signatureData}
                    alt="Venue signature"
                    className="max-h-12 mb-2"
                  />
                  <p className="text-sm font-medium">{venueSig.signerName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(venueSig.signedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Not yet signed</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide' : 'View'} Rider
            </Button>

            <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isDownloading}>
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </Button>

            {!currentUserSigned && !isFullySigned && (
              <Button
                onClick={() => setShowSigningForm(!showSigningForm)}
                className={currentUserRole === 'venue' && contractStatus === 'signed_by_artist'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-purple-600 hover:bg-purple-700'
                }
              >
                <PenTool className="h-4 w-4 mr-2" />
                {showSigningForm
                  ? 'Cancel'
                  : currentUserRole === 'venue' && contractStatus === 'signed_by_artist'
                    ? 'Accept & Counter-Sign'
                    : currentUserRole === 'artist' && contractStatus === 'signed_by_venue'
                      ? 'Accept & Counter-Sign'
                      : 'Sign Contract'
                }
              </Button>
            )}
          </div>

          {/* Fully Signed Notice */}
          {isFullySigned && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Contract Fully Executed</p>
                <p className="text-xs text-green-700 mt-1">
                  Both parties have digitally signed this rider contract. This document serves as a
                  binding addendum to the performance agreement.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rider Preview */}
      {showPreview && previewData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rider Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={previewRef}
              className="border rounded-lg p-4 bg-white max-h-[500px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: previewData.html }}
            />
          </CardContent>
        </Card>
      )}

      {/* Signing Form */}
      {showSigningForm && !currentUserSigned && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PenTool className="h-5 w-5 text-purple-600" />
              Sign Rider Contract
            </CardTitle>
            <CardDescription>
              By signing below, you agree to the terms outlined in the rider contract as a{' '}
              <strong>{currentUserRole === 'artist' ? 'performing artist' : 'venue/promoter'}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Legal Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter your full legal name"
                className="text-base"
              />
            </div>

            {/* Signature Pad */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Your Signature <span className="text-red-500">*</span>
              </label>
              <SignaturePad
                onSignatureChange={handleSignatureChange}
                disabled={signMutation.isPending}
              />
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="agree-terms" className="text-sm text-gray-700 leading-relaxed">
                I confirm that I am authorized to sign this rider contract on behalf of the{' '}
                {currentUserRole === 'artist' ? 'artist/performer' : 'venue/promoter'}. I understand
                that this digital signature constitutes a legally binding agreement to the terms
                outlined in the attached rider document.
              </label>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>Once signed, this action cannot be undone. Please review the rider carefully before signing.</p>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                onClick={handleSign}
                disabled={signMutation.isPending || !signerName.trim() || !signatureData || !agreedToTerms}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {signMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <PenTool className="h-4 w-4 mr-2" />
                    Sign Contract
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSigningForm(false);
                  setSignerName('');
                  setSignatureData(null);
                  setAgreedToTerms(false);
                }}
                disabled={signMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
