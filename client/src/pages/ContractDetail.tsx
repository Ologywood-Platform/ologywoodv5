import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  
  // Query contract details
  const { data: contract, isLoading, error } = trpc.contracts.getById.useQuery(
    { contractId: parseInt(id || "0") },
    { enabled: !!id, retry: 1 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading contract...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Contract Not Found</CardTitle>
            <CardDescription>
              {error ? `Error: ${error.message}` : "The contract you're looking for doesn't exist or has been deleted."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    try {
      toast.loading("Generating PDF...");
      // Call API to generate and download PDF
      const response = await fetch(`/api/trpc/contracts.generatePdf?input=${JSON.stringify({ id: parseInt(id || "0") })}`);
      if (!response.ok) throw new Error("Failed to generate PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contract-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      toast.error("Failed to download PDF");
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/contract/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Contract link copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "signed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard">
              <a className="inline-block">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </a>
            </Link>
            <h1 className="text-3xl font-bold mt-4">Contract #{id}</h1>
            <p className="text-muted-foreground mt-1">
              Booking Contract Details
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <Badge className={getStatusColor(contract?.status || "pending")}>
            {contract?.status ? contract.status.charAt(0).toUpperCase() + contract.status.slice(1) : "Pending"}
          </Badge>
        </div>

        {/* Contract Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contract Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Booking ID</p>
                <p className="font-semibold">{contract.bookingId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{contract.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-semibold">
                  {new Date(contract.createdAt).toLocaleDateString()}
                </p>
              </div>
              {contract.artistSignedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Artist Signed</p>
                  <p className="font-semibold">
                    {new Date(contract.artistSignedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contract Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contract Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
                {contract.contractContent || "No contract content available"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signatures */}
        {(contract.artistSignedAt || contract.venueSignedAt) && (
          <Card>
            <CardHeader>
              <CardTitle>Signatures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Artist Signature</p>
                    {contract.artistSignedAt ? (
                      <Badge className="bg-green-100 text-green-800">
                        Signed {new Date(contract.artistSignedAt).toLocaleDateString()}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Venue Signature</p>
                    {contract.venueSignedAt ? (
                      <Badge className="bg-green-100 text-green-800">
                        Signed {new Date(contract.venueSignedAt).toLocaleDateString()}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
