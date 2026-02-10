import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

interface PlanFeature {
  name: string;
  free: boolean | string;
  basic: boolean | string;
  premium: boolean | string;
}

const features: PlanFeature[] = [
  { name: "Artist Profiles", free: "1 limited", basic: "Unlimited", premium: "Unlimited" },
  { name: "Rider Templates", free: "1 basic", basic: "5 riders", premium: "Unlimited" },
  { name: "Monthly Booking Requests", free: "2", basic: "20", premium: "Unlimited" },
  { name: "Contract Management", free: "Basic", basic: "Advanced", premium: "Full Suite" },
  { name: "Rider Comparison Tool", free: "Limited (2)", basic: "Full Access", premium: "Full Access" },
  { name: "Rider Acknowledgment", free: "Basic", basic: "Full", premium: "Full + Priority" },
  { name: "Analytics Dashboard", free: "Basic Metrics", basic: "Standard", premium: "Advanced" },
  { name: "PDF Export", free: "1/month", basic: "10/month", premium: "Unlimited" },
  { name: "Email Notifications", free: "Basic", basic: "Standard", premium: "Priority + Custom" },
  { name: "Support Chat", free: "Limited Hours", basic: "Business Hours", premium: "24/7 Priority" },
  { name: "Support Tickets", free: "Community Forum", basic: "Email Support", premium: "Phone + Email" },
  { name: "API Access", free: false, basic: "Limited", premium: "Full Access" },
  { name: "Team Members", free: "1 (Self)", basic: "3 Members", premium: "Unlimited" },
  { name: "Custom Branding", free: false, basic: "Basic", premium: "Full Custom" },
  { name: "Payment Processing", free: false, basic: "2.9% + $0.30", premium: "2.5% + $0.30" },
];

export default function SubscriptionPlans() {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handleUpgrade = (plan: 'basic' | 'premium') => {
    if (!user) {
      toast.error('Please log in to upgrade');
      return;
    }

    try {
      const checkoutUrl = `/checkout?plan=${plan}&billing=${billingCycle}`;
      window.open(checkoutUrl, '_blank');
    } catch (error) {
      toast.error('Failed to initiate upgrade');
    }
  };

  const monthlyPrices = { basic: 29, premium: 99 };
  const annualPrices = { basic: 278, premium: 950 };
  const prices = billingCycle === "monthly" ? monthlyPrices : annualPrices;
  const savings = billingCycle === "annual" ? " (Save 20%)" : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-slate-600 mb-6 sm:mb-8">
            Choose the perfect plan for your artist booking needs
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-6 sm:mb-8">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                billingCycle === "annual"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              Annual
              <span className="ml-2 text-sm font-semibold text-green-600">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:p-4 md:p-8 mb-12">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="mt-4">
                <span className="text-2xl sm:text-xl sm:text-2xl md:text-3xl md:text-4xl font-bold text-slate-900">$0</span>
                <span className="text-slate-600 ml-2">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-slate-600">
                Explore Ologywood's core features without any commitment
              </p>
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">1 limited artist profile</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">1 basic rider template</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">2 booking requests/month</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Community forum support</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Plan */}
          <Card className="relative border-2 border-purple-600 shadow-lg">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-purple-600">Most Popular</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Basic</CardTitle>
              <CardDescription>For active artists and venues</CardDescription>
              <div className="mt-4">
                <span className="text-2xl sm:text-xl sm:text-2xl md:text-3xl md:text-4xl font-bold text-slate-900">${prices.basic}</span>
                <span className="text-slate-600 ml-2">/month{savings}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-slate-600">
                Everything you need to manage regular bookings and riders
              </p>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => handleUpgrade('basic')}
              >
                Upgrade to Basic
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Unlimited artist profiles</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">5 rider templates</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">20 booking requests/month</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Advanced contract management</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">3 team members</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">24-hour email support</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Premium</CardTitle>
              <CardDescription>For professional operations</CardDescription>
              <div className="mt-4">
                <span className="text-2xl sm:text-xl sm:text-2xl md:text-3xl md:text-4xl font-bold text-slate-900">${prices.premium}</span>
                <span className="text-slate-600 ml-2">/month{savings}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-slate-600">
                Maximum flexibility and priority support for power users
              </p>
              <Button
                className="w-full bg-slate-900 hover:bg-slate-800"
                onClick={() => handleUpgrade('premium')}
              >
                Upgrade to Premium
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Unlimited everything</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Advanced analytics & reporting</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Full API access</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">White-label options</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Unlimited team members</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">24/7 priority phone support</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-slate-900 text-white">
            <h2 className="text-2xl font-bold">Detailed Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                    Free
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                    Basic
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr
                    key={index}
                    className={`border-b border-slate-200 ${index % 2 === 0 ? "bg-slate-50" : ""}`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {feature.name}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">
                      {typeof feature.free === "boolean" ? (
                        feature.free ? (
                          <Check className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-700">{feature.free}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">
                      {typeof feature.basic === "boolean" ? (
                        feature.basic ? (
                          <Check className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-700">{feature.basic}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">
                      {typeof feature.premium === "boolean" ? (
                        feature.premium ? (
                          <Check className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-700">{feature.premium}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-slate-600">
                Yes! You can upgrade or downgrade your plan at any time through your account
                settings. Changes take effect at your next billing cycle.
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                What happens if I downgrade?
              </h3>
              <p className="text-slate-600">
                When downgrading, you'll be notified about features that will be restricted. Your
                data is preserved, but excess items (e.g., riders beyond your new tier limit) will
                be archived.
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Do you offer annual billing discounts?
              </h3>
              <p className="text-slate-600">
                Yes! Annual subscriptions receive a 20% discount. Basic tier is $278/year and
                Premium is $950/year instead of monthly pricing.
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-slate-600">
                New users get a 14-day free trial of Premium tier to experience all features
                before committing to a paid plan.
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-600">
                We accept all major credit cards (Visa, Mastercard, American Express) through
                Stripe. All payments are secure and encrypted.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-12 text-center text-white">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-lg mb-6 sm:mb-8 opacity-90">
            Join thousands of artists and venues using Ologywood to streamline their bookings
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleUpgrade('basic')}
            >
              Start with Basic
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-white text-purple-600 hover:bg-slate-100"
              onClick={() => handleUpgrade('premium')}
            >
              Go Premium
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
