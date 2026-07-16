import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Scroll,
} from 'lucide-react';
import { toast } from 'sonner';

interface NILContractViewerProps {
  bookingId: number;
  currentUserRole: 'artist' | 'venue';
}

export function NILContractViewer({ bookingId, currentUserRole }: NILContractViewerProps) {
  const [showContract, setShowContract] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: contractData, isLoading } = trpc.riderContract.generateNILContract.useQuery(
    { bookingId },
    { enabled: showContract }
  );

  const downloadPdfMutation = trpc.riderContract.downloadNILContractPdf.useMutation();

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
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            <Shield className="h-3 w-3 mr-1" />
            Blueprint
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 mb-4">
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
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          This contract auto-fills from your booking details and rider template. It includes: Parties, Engagement Details, Compensation, Travel, Security, Equipment, Media Rights, NIL Compliance, Cancellation Terms, and Signature fields.
        </p>

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
                  dangerouslySetInnerHTML={{ __html: contractData.html }}
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
