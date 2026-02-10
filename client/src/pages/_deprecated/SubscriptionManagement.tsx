import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Calendar,
  CreditCard,
  Download,
  Settings,
  Check,
  X,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface SubscriptionData {
  currentPlan: "free" | "basic" | "premium";
  status: "active" | "cancelled" | "past_due";
  monthlyPrice: number;
  nextBillingDate: string;
  billingCycle: "monthly" | "annual";
  paymentMethod: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  usageStats: {
    ridersUsed: number;
    ridersLimit: number;
    bookingsUsed: number;
    bookingsLimit: number;
    teamMembersUsed: number;
    teamMembersLimit: number;
  };
}

const mockSubscription: SubscriptionData = {
  currentPlan: "basic",
  status: "active",
  monthlyPrice: 29,
  nextBillingDate: "2026-02-15",
  billingCycle: "monthly",
  paymentMethod: {
    brand: "Visa",
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 2026,
  },
  usageStats: {
    ridersUsed: 3,
    ridersLimit: 5,
    bookingsUsed: 12,
    bookingsLimit: 20,
    teamMembersUsed: 2,
    teamMembersLimit: 3,
  },
};

export default function SubscriptionManagement() {
  const [subscription] = useState<SubscriptionData>(mockSubscription);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const planColors = {
    free: "bg-slate-100 text-slate-900",
    basic: "bg-purple-100 text-purple-900",
    premium: "bg-amber-100 text-amber-900",
  };

  const planNames = {
    free: "Free",
    basic: "Basic",
    premium: "Premium",
  };

  const handleUpgrade = () => {
    toast.success("Redirecting to upgrade page...");
  };

  const handleDowngrade = () => {
    setShowCancelModal(true);
  };

  const handleCancelSubscription = () => {
    toast.success("Subscription cancelled. Changes take effect at next billing cycle.");
    setShowCancelModal(false);
  };

  const UsageBar = ({ used, limit, label }: { used: number; limit: number; label: string }) => {
    const percentage = (used / limit) * 100;
    const isWarning = percentage > 80;

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <span className="text-sm text-slate-600">
            {used} / {limit}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isWarning ? "bg-orange-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Subscription Management</h1>
          <p className="text-slate-600">Manage your plan, billing, and usage</p>
        </div>

        {/* Current Plan Card */}
        <Card className="mb-8 border-2 border-purple-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Current Plan</CardTitle>
                <CardDescription>You are currently on the {planNames[subscription.currentPlan]} plan</CardDescription>
              </div>
              <Badge className={`${planColors[subscription.currentPlan]} text-lg px-4 py-2`}>
                {planNames[subscription.currentPlan]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Monthly Cost</p>
                <p className="text-2xl font-bold text-slate-900">${subscription.monthlyPrice}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Billing Cycle</p>
                <p className="text-2xl font-bold text-slate-900 capitalize">
                  {subscription.billingCycle}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <p className="text-2xl font-bold text-slate-900 capitalize">
                    {subscription.status}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleUpgrade}
              >
                Upgrade Plan
              </Button>
              {subscription.currentPlan !== "free" && (
                <Button
                  variant="outline"
                  onClick={handleDowngrade}
                >
                  Downgrade Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>Your current usage for this billing period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <UsageBar
              used={subscription.usageStats.ridersUsed}
              limit={subscription.usageStats.ridersLimit}
              label="Rider Templates"
            />
            <UsageBar
              used={subscription.usageStats.bookingsUsed}
              limit={subscription.usageStats.bookingsLimit}
              label="Monthly Booking Requests"
            />
            <UsageBar
              used={subscription.usageStats.teamMembersUsed}
              limit={subscription.usageStats.teamMembersLimit}
              label="Team Members"
            />

            {subscription.usageStats.bookingsUsed / subscription.usageStats.bookingsLimit > 0.8 && (
              <Alert className="bg-orange-50 border-orange-200">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  You are using {Math.round((subscription.usageStats.bookingsUsed / subscription.usageStats.bookingsLimit) * 100)}% of your monthly booking requests. Consider upgrading to Premium for unlimited requests.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Billing Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Information
            </CardTitle>
            <CardDescription>Manage your payment method and billing details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Next Billing Date */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="text-sm text-slate-600">Next Billing Date</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {new Date(subscription.nextBillingDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </div>

            {/* Payment Method */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="text-sm text-slate-600">Payment Method</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {subscription.paymentMethod.brand} ending in {subscription.paymentMethod.last4}
                  </p>
                  <p className="text-xs text-slate-500">
                    Expires {subscription.paymentMethod.expiryMonth}/{subscription.paymentMethod.expiryYear}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Update
              </Button>
            </div>

            {/* Billing History */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">Recent Invoices</h3>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Invoice #{1001 + i}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">${subscription.monthlyPrice}</span>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Plan Features</CardTitle>
            <CardDescription>Features included in your {planNames[subscription.currentPlan]} plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscription.currentPlan === "basic" && (
                <>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Unlimited artist profiles</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">5 rider templates</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">20 booking requests/month</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Advanced contract management</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">3 team members</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">24-hour email support</span>
                  </div>
                </>
              )}
              {subscription.currentPlan === "free" && (
                <>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">1 limited artist profile</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">1 basic rider template</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">2 booking requests/month</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <X className="h-5 w-5 text-slate-300 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-500">API access</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <X className="h-5 w-5 text-slate-300 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-500">Team members</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Community forum support</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cancel Subscription Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Downgrade Plan</CardTitle>
                <CardDescription>
                  Are you sure you want to downgrade to the Free plan?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    Downgrading will restrict some features. Your data will be preserved but excess items will be archived.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1"
                  >
                    Keep Current Plan
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    className="flex-1"
                  >
                    Confirm Downgrade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
