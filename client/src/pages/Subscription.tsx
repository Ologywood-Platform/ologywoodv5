import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { SUBSCRIPTION_PRODUCTS } from "../../../shared/products";

export default function Subscription() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: subscription, refetch: refetchSubscription, isLoading } = trpc.subscription.getMy.useQuery(
    undefined,
    { retry: false }
  );
  const { data: stripeStatus } = trpc.subscription.getStatus.useQuery(
    undefined,
    { retry: false }
  );

  const createCheckout = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      toast.success("Redirecting to checkout...");
      window.open(data.checkoutUrl, '_blank');
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  const cancelSubscription = trpc.subscription.cancel.useMutation({
    onSuccess: () => {
      toast.success("Subscription will be canceled at the end of the billing period");
      refetchSubscription();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel subscription");
    },
  });

  const reactivateSubscription = trpc.subscription.reactivate.useMutation({
    onSuccess: () => {
      toast.success("Subscription reactivated successfully");
      refetchSubscription();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reactivate subscription");
    },
  });

  const handleSubscribe = () => {
    const origin = window.location.origin;
    createCheckout.mutate({
      successUrl: `${origin}/subscription?success=true`,
      cancelUrl: `${origin}/subscription?canceled=true`,
    });
  };

  const product = SUBSCRIPTION_PRODUCTS.ARTIST_BASIC;
  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isTrialing = subscription?.status === 'trialing';
  const isCanceled = stripeStatus?.cancelAtPeriodEnd;

  if (!isAuthenticated || user?.role !== 'artist') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Artist Subscription Required</CardTitle>
            <CardDescription>
              You need to be logged in as an artist to manage subscriptions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/role-selection")} className="w-full">
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      <div className="container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Subscription Management</h1>
            <p className="text-muted-foreground">
              Manage your Ologywood artist subscription
            </p>
          </div>

          {/* Current Subscription Status */}
          {hasActiveSubscription && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>Your active subscription details</CardDescription>
                  </div>
                  <Badge variant={isTrialing ? "secondary" : "default"}>
                    {isTrialing ? "Trial" : subscription?.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{product.name}</span>
                  <span className="text-muted-foreground">
                    ${(product.priceMonthly / 100).toFixed(2)}/month
                  </span>
                </div>

                {stripeStatus?.currentPeriodEnd && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {isCanceled ? "Expires" : isTrialing ? "Trial ends" : "Renews"} on{" "}
                      {new Date(stripeStatus.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {isTrialing && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-blue-900">
                      You're currently in your {product.trialDays}-day free trial. You won't be charged until the trial ends.
                    </span>
                  </div>
                )}

                {isCanceled && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-md">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <span className="text-sm text-orange-900">
                      Your subscription is set to cancel at the end of the billing period.
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  {isCanceled ? (
                    <Button
                      onClick={() => reactivateSubscription.mutate()}
                      disabled={reactivateSubscription.isPending}
                    >
                      {reactivateSubscription.isPending ? "Reactivating..." : "Reactivate Subscription"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => cancelSubscription.mutate()}
                      disabled={cancelSubscription.isPending}
                    >
                      {cancelSubscription.isPending ? "Canceling..." : "Cancel Subscription"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription Plan */}
          {!hasActiveSubscription && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                  <div className="text-right">
                    <div className="text-3xl font-bold">
                      ${(product.priceMonthly / 100).toFixed(0)}
                    </div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                </div>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {product.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-900 font-medium">
                    🎉 {product.trialDays}-day free trial included!
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Try Ologywood risk-free. Cancel anytime during the trial period.
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSubscribe}
                  disabled={createCheckout.isPending}
                >
                  {createCheckout.isPending ? "Creating checkout..." : "Start Free Trial"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By subscribing, you agree to our terms of service and privacy policy.
                  You can cancel anytime.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Features Included */}
          <Card>
            <CardHeader>
              <CardTitle>What's Included</CardTitle>
              <CardDescription>
                Everything you need to manage your bookings and grow your career
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-md hover:bg-accent">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
