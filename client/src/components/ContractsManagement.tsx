import { useState } from 'react';
import { Link } from 'wouter';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { generateContractPdf } from '@/lib/contractPdf';

interface ContractsManagementProps {
  bookingId?: number;
}

export function ContractsManagement({ bookingId }: ContractsManagementProps) {
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

  // Fetch contracts
  const { data: contracts, isLoading } = trpc.contracts.getMyContracts.useQuery();

  // Fetch contract details
  const { data: selectedContract } = trpc.contracts.getById.useQuery(
    { contractId: selectedContractId || 0 },
    { enabled: selectedContractId !== null && selectedContractId > 0 }
  );

  // Fetch signatures for selected contract
  const { data: signatures } = trpc.contracts.getSignatures.useQuery(
    { contractId: selectedContractId || 0 },
    { enabled: selectedContractId !== null && selectedContractId > 0 }
  );

  const handleDownloadPdf = async () => {
    if (!selectedContract) {
      toast.error('No contract selected');
      return;
    }

    try {
      const contractTitle = selectedContract.contractData?.title || 'Contract';
      const contractContent = selectedContract.contractData?.content || '';
      await generateContractPdf({
        filename: `${contractTitle}.pdf`,
        title: contractTitle,
        contractContent: contractContent,
        artistName: 'Artist',
        venueName: 'Venue',
        eventDate: new Date().toLocaleDateString(),
        signatures: signatures?.map((sig) => ({
          signerName: 'Signer',
          signerRole: 'artist' as const,
          signatureData: sig.signatureData || '',
          signedAt: sig.signedAt || new Date(),
        })) || [],
      });
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
      case 'executed':
        return 'bg-green-100 text-green-800';
      case 'pending_signatures':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_signatures':
        return 'Awaiting Signatures';
      case 'executed':
        return 'Fully Executed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  if (!contracts || contracts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600 mb-4">No contracts yet</p>
        <Link href="/booking/new">
          <Button className="bg-primary text-white">
            Create a Booking
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Contracts list */}
      <div className="lg:col-span-1">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">My Contracts</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {contracts.map((contract) => (
              <button
                key={contract.id}
                onClick={() => setSelectedContractId(contract.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedContractId === contract.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium text-sm mb-1 truncate">
                  {contract.contractTitle}
                </div>
                <Badge className={`text-xs ${getStatusColor(contract.status)}`}>
                  {getStatusLabel(contract.status)}
                </Badge>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Contract details */}
      <div className="lg:col-span-2">
        {selectedContract ? (
          <div className="space-y-4">
            {/* Contract header */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-4">{selectedContract.contractData?.title || 'Contract'}</h2>
                </div>
                <Badge className={`${getStatusColor(selectedContract.status)}`}>
                  {getStatusLabel(selectedContract.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-medium">
                    {new Date(selectedContract.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Type</p>
                  <p className="font-medium capitalize">{selectedContract.contractType}</p>
                </div>
              </div>
            </Card>

            {/* Signature status */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Signature Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Status</span>
                  <span className={`text-sm font-semibold ${
                    selectedContract.status === 'signed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {selectedContract.status.charAt(0).toUpperCase() + selectedContract.status.slice(1)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Contract content preview */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Contract Preview</h3>
              <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto prose prose-sm">
                <div className="text-sm text-gray-600">
                  {selectedContract.contractData ? (
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(selectedContract.contractData, null, 2).substring(0, 500)}...
                    </pre>
                  ) : (
                    <p>No contract data available</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleDownloadPdf}
                className="flex-1 bg-primary text-white"
              >
                Download PDF
              </Button>
              <Link href={`/contract/${selectedContract.id}`}>
                <Button className="flex-1 bg-secondary text-white">
                  View Full Contract
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-600">Select a contract to view details</p>
          </Card>
        )}
      </div>
    </div>
  );
}
