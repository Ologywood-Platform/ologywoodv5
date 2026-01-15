import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Eye, Filter } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

interface Payment {
  id: number;
  amount?: number;
  status: string;
  type: string;
  createdAt: Date;
  stripePaymentId?: string;
}

interface BookingPayment {
  id: number;
  eventDate: Date;
  totalFee?: number;
  paymentStatus?: string;
  depositAmount?: number;
  depositPaidAt?: Date;
  fullPaymentPaidAt?: Date;
}

export default function Payments() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // For now, we'll use mock data since the full payment history endpoints may not be fully implemented
  // In a production system, these would come from the TRPC payment router
  const isLoading = false;
  const paymentHistory: Payment[] = [];
  const bookingPayments: BookingPayment[] = [];

  if (!isAuthenticated || !user) {
    return null;
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "refunded":
        return <Badge className="bg-blue-100 text-blue-800">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case "deposit":
        return "Deposit Payment";
      case "full_payment":
        return "Full Payment";
      case "refund":
        return "Refund";
      default:
        return type;
    }
  };

  const filteredPayments = paymentHistory.filter((payment: Payment) => {
    if (filterStatus === "all") return true;
    return payment.status === filterStatus;
  });

  const totalEarnings = paymentHistory
    .filter((p: Payment) => p.status === "completed" && p.type !== "refund")
    .reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0);

  const pendingAmount = paymentHistory
    .filter((p: Payment) => p.status === "pending")
    .reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
                <p className="text-gray-600 mt-1">Manage your payment history and transactions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                ${totalEarnings.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-2">Completed payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                ${pendingAmount.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-2">Awaiting completion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {paymentHistory?.length || 0}
              </div>
              <p className="text-xs text-gray-500 mt-2">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Payment History</TabsTrigger>
            <TabsTrigger value="bookings">Booking Payments</TabsTrigger>
          </TabsList>

          {/* Payment History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>View all your payment transactions</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Payment history will appear here once you complete bookings.</p>
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No payments found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                            Date
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                            Type
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                            Amount
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                            Reference
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.map((payment: Payment) => (
                          <tr key={payment.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {getPaymentTypeLabel(payment.type)}
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold">
                              ${(payment.amount || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {getPaymentStatusBadge(payment.status)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {payment.stripePaymentId?.substring(0, 8)}...
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Booking Payments Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Booking Payments</CardTitle>
                <CardDescription>Payment status for your bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {bookingPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No booking payments found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookingPayments.map((booking: BookingPayment) => (
                      <Card key={booking.id} className="border">
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Booking ID</p>
                              <p className="font-semibold">#{booking.id}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Event Date</p>
                              <p className="font-semibold">
                                {new Date(booking.eventDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Total Fee</p>
                              <p className="font-semibold">
                                ${(booking.totalFee || 0).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Payment Status</p>
                              <div className="mt-1">
                                {getPaymentStatusBadge(booking.paymentStatus || "pending")}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Deposit</p>
                              <p className="font-semibold">
                                ${(booking.depositAmount || 0).toFixed(2)}
                              </p>
                              {booking.depositPaidAt && (
                                <p className="text-xs text-green-600">
                                  Paid: {new Date(booking.depositPaidAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Full Payment</p>
                              <p className="font-semibold">
                                ${((booking.totalFee || 0) - (booking.depositAmount || 0)).toFixed(2)}
                              </p>
                              {booking.fullPaymentPaidAt && (
                                <p className="text-xs text-green-600">
                                  Paid: {new Date(booking.fullPaymentPaidAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Methods Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Manage your payment methods and billing information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Stripe Payment Processing</p>
                    <p className="text-sm text-gray-600 mt-1">
                      All payments are processed securely through Stripe. Your payment information is encrypted and never stored on our servers.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Need help?</strong> Contact our support team for payment issues or questions about your transactions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
