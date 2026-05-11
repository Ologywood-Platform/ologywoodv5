import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  Eye,
  Pen,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

type ContractStatus = "pending" | "signed_by_artist" | "signed_by_venue" | "fully_signed";

function getStatusConfig(status: ContractStatus) {
  switch (status) {
    case "fully_signed":
      return {
        label: "Fully Signed",
        variant: "default" as const,
        icon: CheckCircle2,
        className: "bg-green-600 hover:bg-green-700 text-white border-green-600",
      };
    case "signed_by_artist":
      return {
        label: "Artist Signed",
        variant: "secondary" as const,
        icon: Clock,
        className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
      };
    case "signed_by_venue":
      return {
        label: "Venue Signed",
        variant: "secondary" as const,
        icon: Clock,
        className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
      };
    case "pending":
    default:
      return {
        label: "Pending",
        variant: "outline" as const,
        icon: AlertCircle,
        className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      };
  }
}

function ContractCard({
  contract,
  userRole,
  onDownloadPdf,
  onViewBooking,
}: {
  contract: any;
  userRole: string;
  onDownloadPdf: (bookingId: number) => void;
  onViewBooking: (bookingId: number) => void;
}) {
  const statusConfig = getStatusConfig(contract.status);
  const StatusIcon = statusConfig.icon;
  const counterparty = userRole === "artist" ? contract.venueName : contract.artistName;
  const counterpartyLabel = userRole === "artist" ? "Venue" : "Artist";

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Top row: title + status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-gray-100 truncate">
                  {contract.riderTemplateName}
                </h3>
                {(contract as any).contractSource === 'venue' && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5">Venue Agreement</Badge>
                )}
                {(contract as any).contractSource === 'rider' && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5">Artist Rider</Badge>
                )}
                <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                  {counterpartyLabel}: {counterparty}
                </p>
              </div>
            </div>
            <Badge className={`flex-shrink-0 ${statusConfig.className}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Info row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-gray-400">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                {contract.eventDate
                  ? new Date(contract.eventDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "No date"}
              </span>
            </div>
            {contract.totalFee && (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-gray-400">
                <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
                <span>${parseFloat(contract.totalFee).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-gray-400">
              <Pen className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                {contract.artistSigned && contract.venueSigned
                  ? "Both signed"
                  : contract.artistSigned
                  ? "Artist signed"
                  : contract.venueSigned
                  ? "Venue signed"
                  : "No signatures"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-gray-400">
              <FileText className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Booking #{contract.bookingId}</span>
            </div>
          </div>

          {/* Signature details */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs text-slate-500 dark:text-gray-500 border-t border-slate-100 dark:border-gray-800 pt-3">
            <div className="flex items-center gap-1.5">
              {contract.artistSigned ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-slate-400" />
              )}
              <span>
                Artist: {contract.artistSigned
                  ? `${contract.artistSignerName || "Signed"} — ${new Date(contract.artistSignedAt).toLocaleDateString()}`
                  : "Awaiting signature"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {contract.venueSigned ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-slate-400" />
              )}
              <span>
                Venue: {contract.venueSigned
                  ? `${contract.venueSignerName || "Signed"} — ${new Date(contract.venueSignedAt).toLocaleDateString()}`
                  : "Awaiting signature"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onViewBooking(contract.bookingId)}
            >
              <Eye className="h-3.5 w-3.5" />
              View Booking
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 bg-purple-600 hover:bg-purple-700"
              onClick={() => onDownloadPdf(contract.bookingId)}
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContractSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32 mt-1" />
              </div>
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Contracts() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [activeFilter, setActiveFilter] = useState("all");
  const [downloading, setDownloading] = useState<number | null>(null);

  const { data: contracts, isLoading } = trpc.contractDashboard.getMyContracts.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const handleDownloadPdf = async (bookingId: number) => {
    setDownloading(bookingId);
    try {
      const response = await fetch(`/api/contract/${bookingId}/pdf`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error("Empty PDF received");
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rider-contract-booking-${bookingId}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
      toast.success("Contract PDF downloaded successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to download PDF");
    } finally {
      setDownloading(null);
    }
  };

  const handleViewBooking = (bookingId: number) => {
    navigate(`/booking/${bookingId}`);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const userRole = user.role || "artist";

  // Filter contracts
  const filteredContracts = (contracts || []).filter((c: any) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "signed") return c.status === "fully_signed";
    if (activeFilter === "pending") return c.status === "pending" || c.status === "signed_by_artist" || c.status === "signed_by_venue";
    return true;
  });

  const totalCount = contracts?.length || 0;
  const signedCount = contracts?.filter((c: any) => c.status === "fully_signed").length || 0;
  const pendingCount = totalCount - signedCount;

  const dashboardUrl = userRole === "venue" ? "/venue-dashboard" : "/dashboard";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white dark:bg-gray-900 dark:border-gray-800 shadow-sm transition-colors duration-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(dashboardUrl)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-gray-100">
                Contracts
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                Manage your rider contracts and agreements
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 mb-6">
          <button onClick={() => navigate("/")} className="hover:text-purple-600 transition-colors">
            Home
          </button>
          <span>/</span>
          <button onClick={() => navigate(dashboardUrl)} className="hover:text-purple-600 transition-colors">
            Dashboard
          </button>
          <span>/</span>
          <span className="text-slate-900 dark:text-gray-100 font-medium">Contracts</span>
        </nav>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-gray-100">{totalCount}</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{signedCount}</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">Fully Signed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="signed" className="text-xs sm:text-sm">
              Signed ({signedCount})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              Pending ({pendingCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Contract List */}
        <div className="space-y-4">
          {isLoading ? (
            <>
              <ContractSkeleton />
              <ContractSkeleton />
              <ContractSkeleton />
            </>
          ) : filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <FileText className="h-12 w-12 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-gray-300 mb-2">
                  {activeFilter === "all"
                    ? "No contracts yet"
                    : activeFilter === "signed"
                    ? "No fully signed contracts"
                    : "No pending contracts"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
                  {activeFilter === "all"
                    ? "Contracts will appear here when a rider is attached to a booking and signed."
                    : "Try a different filter to see your contracts."}
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/bookings")}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Bookings
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredContracts.map((contract: any) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                userRole={userRole}
                onDownloadPdf={handleDownloadPdf}
                onViewBooking={handleViewBooking}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Contracts;
