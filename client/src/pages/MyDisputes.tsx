import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { Link } from "wouter";
import { SiteHeader } from "@/components/SiteHeader";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Open", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  under_review: { label: "Under Review", color: "bg-blue-100 text-blue-800", icon: Eye },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  dismissed: { label: "Dismissed", color: "bg-gray-100 text-gray-800", icon: XCircle },
};

const TYPE_LABELS: Record<string, string> = {
  payment_issue: "Payment Issue",
  no_show: "No Show",
  contract_violation: "Contract Violation",
  quality_issue: "Quality Issue",
  cancellation_dispute: "Cancellation Dispute",
  harassment: "Harassment",
  other: "Other",
};

export default function MyDisputes() {
  const { user, isAuthenticated } = useAuth();
  const { data: disputes, isLoading } = trpc.dispute.getMyDisputes.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || !user) return null;

  const dashboardUrl = user.role === "venue" ? "/venue-dashboard" : "/dashboard";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SiteHeader />
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href={dashboardUrl}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Disputes</h1>
              <p className="text-gray-600 mt-1">Track and manage your reported issues</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading disputes...</p>
          </div>
        ) : !disputes || disputes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Disputes</h3>
              <p className="text-gray-500 mb-4">
                You haven't reported any issues yet. If you have a problem with a booking,
                you can report it from the booking detail page.
              </p>
              <Link href="/bookings">
                <Button variant="outline">View Bookings</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute: any) => {
              const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;
              const StatusIcon = statusConfig.icon;
              const isReporter = dispute.reporterId === user.id;

              return (
                <Card key={dispute.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {TYPE_LABELS[dispute.type] || dispute.type}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {isReporter ? "Filed by you" : "Filed against you"} &middot;{" "}
                            {dispute.booking
                              ? `Booking on ${new Date(dispute.booking.eventDate).toLocaleDateString()}`
                              : `Booking #${dispute.bookingId}`}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{dispute.description}</p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {isReporter
                          ? `Against: ${dispute.respondentName}`
                          : `Reported by: ${dispute.reporterName}`}
                      </span>
                      <span>Filed {new Date(dispute.createdAt).toLocaleDateString()}</span>
                    </div>

                    {dispute.resolution && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-sm font-medium text-green-800 mb-1">Resolution</p>
                        <p className="text-sm text-green-700">{dispute.resolution}</p>
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <Link href={`/booking/${dispute.bookingId}`}>
                        <Button variant="outline" size="sm">
                          View Booking
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
