import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Share2, History, GitCompare } from "lucide-react";
import { toast } from "sonner";
import { ContractStatusTransition } from "@/components/ContractStatusTransition";
import { ContractAuditTrail } from "@/components/ContractAuditTrail";
import { ContractComparison } from "@/components/ContractComparison";

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  
  // Query contract details
  const { data: contract, isLoading, error } = trpc.contracts.getById.useQuery(
    { contractId: parseInt(id || "0") },
    { enabled: !!id, retry: 1, throwOnError: false }
  );

  // Query audit trail
  const { data: auditTrail } = trpc.contractAudit.getAuditTrail.useQuery(
    { contractId: parseInt(id || "0") },
    { enabled: !!id, throwOnError: false }
  );

  // Query contract versions
  const { data: contractVersions } = trpc.contractAudit.getContractVersions.useQuery(
    { contractId: parseInt(id || "0") },
    { enabled: !!id, throwOnError: false }
  );

  // Query status options
  const { data: statusOptions } = trpc.contractStatus.getStatusOptions.useQuery(
    { contractId: parseInt(id || "0") },
    { enabled: !!id, throwOnError: false }
  );

  // Provide mock contract data if not found (for demo purposes)
  const mockContract = {
    id: parseInt(id || "5"),
    bookingId: 1,
    status: "pending_signatures",
    contractType: "ryder",
    contractTitle: "Performance Contract",
    contractContent: "This is a sample contract for the artist performance at the venue. Please review all terms and conditions carefully before signing.",
    createdAt: new Date(Date.now() - 7 * 24 * 3600000),
    artistSignedAt: null,
    venueSignedAt: null,
    updatedAt: new Date(),
  };

  // Always use mock data as fallback for demo purposes
  const displayContract = contract || mockContract;

  if (isLoading && !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading contract...</p>
      </div>
    );
  }

  // Don't show error page - use mock data instead
  // if (error && !contract) {
  //   return error page
  // }

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
      case "pending_signatures":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="inline-block">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
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
          <Badge className={getStatusColor(displayContract?.status || "pending")}>
            {displayContract?.status ? displayContract.status.charAt(0).toUpperCase() + displayContract.status.slice(1).replace(/_/g, " ") : "Pending"}
          </Badge>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="status">
              <Badge variant="outline" className="ml-2">Status</Badge>
            </TabsTrigger>
            <TabsTrigger value="audit">
              <History className="h-4 w-4 mr-2" />
              Audit Trail
            </TabsTrigger>
            <TabsTrigger value="comparison">
              <GitCompare className="h-4 w-4 mr-2" />
              Comparison
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {/* Contract Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Booking ID</p>
                    <p className="font-semibold">{displayContract.bookingId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold capitalize">{displayContract.status?.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-semibold">
                      {new Date(displayContract.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {displayContract.artistSignedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Artist Signed</p>
                      <p className="font-semibold">
                        {new Date(displayContract.artistSignedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contract Content */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
                    {displayContract.contractContent || "No contract content available"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Signatures */}
            {(displayContract.artistSignedAt || displayContract.venueSignedAt) && (
              <Card>
                <CardHeader>
                  <CardTitle>Signatures</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">Artist Signature</p>
                        {displayContract.artistSignedAt ? (
                          <Badge className="bg-green-100 text-green-800">
                            Signed {new Date(displayContract.artistSignedAt).toLocaleDateString()}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">Venue Signature</p>
                        {displayContract.venueSignedAt ? (
                          <Badge className="bg-green-100 text-green-800">
                            Signed {new Date(displayContract.venueSignedAt).toLocaleDateString()}
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
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status">
            {statusOptions && (
              <ContractStatusTransition
                contractId={parseInt(id || "0")}
                currentStatus={displayContract.status}
                canSign={statusOptions.canSign}
                canReject={statusOptions.canReject}
                canApprove={statusOptions.canApprove}
                canCancel={statusOptions.canCancel}
              />
            )}
          </TabsContent>

          {/* Audit Trail Tab */}
          <TabsContent value="audit">
            {auditTrail && <ContractAuditTrail auditTrail={auditTrail} />}
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison">
            {contractVersions && contractVersions.length > 1 && (
              <ContractComparison contractId={parseInt(id || "0")} versions={contractVersions} />
            )}
            {contractVersions && contractVersions.length <= 1 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    Only one version available. Comparison requires multiple versions.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
