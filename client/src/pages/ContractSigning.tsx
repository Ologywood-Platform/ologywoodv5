import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SignatureCapture } from '@/components/SignatureCapture';
import { RyderContractTemplate } from '@/components/RyderContractTemplate';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function ContractSigning() {
  const params = useParams();
  const contractId = params?.contractId ? parseInt(params.contractId) : 0;
  const bookingId = params?.bookingId ? parseInt(params.bookingId) : 0;

  const [showSignatureCapture, setShowSignatureCapture] = useState(false);
  const [contractContent, setContractContent] = useState('');

  // Fetch contract if contractId is provided
  const { data: contract, isLoading: contractLoading } = trpc.contracts.getById.useQuery(
    { contractId },
    { enabled: contractId > 0 }
  );

  // Fetch booking details for context
  const { data: booking } = trpc.booking.getById.useQuery(
    { id: bookingId },
    { enabled: bookingId > 0 }
  );

  // Get current user
  const { data: user } = trpc.auth.me.useQuery();

  // Get existing signatures
  const { data: signatures } = trpc.contracts.getSignatures.useQuery(
    { contractId },
    { enabled: contractId > 0 }
  );

  // Mutations
  const createContractMutation = trpc.contracts.create.useMutation({
    onSuccess: (newContract) => {
      toast.success('Contract created successfully');
      // Redirect or update state
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create contract');
    },
  });

  const signContractMutation = trpc.contracts.sign.useMutation({
    onSuccess: () => {
      toast.success('Contract signed successfully');
      setShowSignatureCapture(false);
      // Refresh signatures
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to sign contract');
    },
  });

  const handleGenerateContract = (content: string) => {
    setContractContent(content);
    if (!contract && bookingId > 0) {
      createContractMutation.mutate({
        bookingId,
        contractType: 'ryder',
        contractTitle: `Performance Agreement - ${booking?.venueName}`,
        contractContent: content,
      });
    }
  };

  const handleSignatureCapture = (signatureData: string, signatureType: 'canvas' | 'typed') => {
    if (!contract) {
      toast.error('Contract not found');
      return;
    }

    signContractMutation.mutate({
      contractId: contract.id,
      signatureData,
      signatureType,
    });
  };

  const currentUserSignature = signatures?.find((sig) => sig.signerId === user?.id);
  const otherPartySignature = signatures?.find((sig) => sig.signerId !== user?.id);

  const isArtist = user?.role === 'artist';
  const isVenue = user?.role === 'venue';

  if (contractLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (!contract && !bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <p className="text-muted-foreground mb-4">No contract found</p>
          <Button onClick={() => window.location.href = '/dashboard'}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Performance Agreement & Rider</h1>
        <p className="text-gray-600">
          {contract ? 'Review and sign the contract' : 'Generate a contract for this booking'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main contract area */}
        <div className="lg:col-span-2 space-y-6">
          {!contract ? (
            <RyderContractTemplate
              artistName={booking?.venueName || 'Artist'}
              venueName={booking?.venueName || 'Venue'}
              eventDate={booking?.eventDate?.toString() || ''}
              eventTime={booking?.eventTime || ''}
              eventLocation={booking?.venueAddress || ''}
              totalFee={booking?.totalFee ? Number(booking.totalFee) : 0}
              depositAmount={booking?.depositAmount ? Number(booking.depositAmount) : 0}
              riderData={booking?.riderData as any}
              onGenerate={handleGenerateContract}
            />
          ) : (
            <Card className="p-6">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: contract.contractContent }}
              />
            </Card>
          )}
        </div>

        {/* Signature status sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Signature Status</h3>

            <div className="space-y-4">
              {/* Artist signature */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Artist</span>
                  {contract?.artistSignedAt ? (
                    <span className="text-green-600 text-sm font-semibold">✓ Signed</span>
                  ) : (
                    <span className="text-yellow-600 text-sm font-semibold">Pending</span>
                  )}
                </div>
                {contract?.artistSignedAt && (
                  <p className="text-xs text-gray-500">
                    Signed on {new Date(contract.artistSignedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Venue signature */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Venue</span>
                  {contract?.venueSignedAt ? (
                    <span className="text-green-600 text-sm font-semibold">✓ Signed</span>
                  ) : (
                    <span className="text-yellow-600 text-sm font-semibold">Pending</span>
                  )}
                </div>
                {contract?.venueSignedAt && (
                  <p className="text-xs text-gray-500">
                    Signed on {new Date(contract.venueSignedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Overall status */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium mb-2">Contract Status</p>
                <p className="text-xs text-gray-600 mb-3">
                  {contract?.status === 'signed' ? (
                    <span className="text-green-600 font-semibold">✓ Fully Executed</span>
                  ) : contract?.status === 'pending_signatures' ? (
                    <span className="text-yellow-600 font-semibold">Awaiting Signatures</span>
                  ) : (
                    <span className="text-gray-600">{contract?.status || 'Draft'}</span>
                  )}
                </p>
              </div>

              {/* Sign button */}
              {contract && !currentUserSignature && contract.status !== 'signed' && (
                <Button
                  onClick={() => setShowSignatureCapture(true)}
                  className="w-full bg-primary text-white"
                  disabled={signContractMutation.isPending}
                >
                  {signContractMutation.isPending ? 'Signing...' : 'Sign Contract'}
                </Button>
              )}

              {currentUserSignature && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700">
                    <strong>✓ You have signed this contract</strong>
                  </p>
                </div>
              )}

              {contract?.status === 'signed' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700 font-semibold">
                    ✓ Contract is fully executed and legally binding
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Signature capture modal */}
      {showSignatureCapture && contract && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <SignatureCapture
                signerName={user.name || 'User'}
                signerRole={isArtist ? 'artist' : 'venue'}
                onSignatureCapture={handleSignatureCapture}
                onCancel={() => setShowSignatureCapture(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
