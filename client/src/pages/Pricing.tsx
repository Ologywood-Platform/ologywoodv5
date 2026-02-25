import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { useLocation } from "wouter";
import { JsonLd, buildBreadcrumbJsonLd, buildFaqPageJsonLd } from "@/components/JsonLd";

const PRICING_FAQS = [
  {
    question: 'Can I change my plan anytime?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! Professional plan includes a 14-day free trial. No credit card required.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) through Stripe.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Absolutely! Cancel your subscription anytime with no penalties or hidden fees.',
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer: 'Yes! Annual billing saves you 20% compared to monthly. Contact our sales team for details.',
  },
  {
    question: 'What about refunds?',
    answer: 'We offer a 30-day money-back guarantee if you\'re not satisfied with our service.',
  },
];

export default function Pricing() {
  const [, navigate] = useLocation();

  const tiers = [
    {
      name: "Free",
      description: "Perfect for getting started",
      price: "$0",
      period: "forever",
      cta: "Get Started",
      highlight: false,
      features: [
        { name: "Browse artists", included: true },
        { name: "Create 1 rider template", included: true },
        { name: "Send 5 booking requests/month", included: true },
        { name: "Basic messaging", included: true },
        { name: "View artist profiles", included: true },
        { name: "Priority support", included: false },
        { name: "Advanced analytics", included: false },
        { name: "Custom branding", included: false },
      ],
    },
    {
      name: "Professional",
      description: "For active bookers and artists",
      price: "$9.99",
      period: "month",
      cta: "Start Free Trial",
      highlight: true,
      badge: "14-day free trial",
      features: [
        { name: "Browse artists", included: true },
        { name: "Create unlimited rider templates", included: true },
        { name: "Unlimited booking requests", included: true },
        { name: "Advanced messaging", included: true },
        { name: "Contract management", included: true },
        { name: "Priority support", included: true },
        { name: "Basic analytics", included: true },
        { name: "Custom branding", included: false },
      ],
    },
    {
      name: "Enterprise",
      description: "For venues and agencies",
      price: "Custom",
      period: "contact us",
      cta: "Contact Sales",
      highlight: false,
      features: [
        { name: "Browse artists", included: true },
        { name: "Create unlimited rider templates", included: true },
        { name: "Unlimited booking requests", included: true },
        { name: "Advanced messaging", included: true },
        { name: "Contract management", included: true },
        { name: "Priority support", included: true },
        { name: "Advanced analytics", included: true },
        { name: "Custom branding", included: true },
      ],
    },
  ];

  const handleCTA = (tierName: string) => {
    if (tierName === "Free") {
      navigate("/get-started");
    } else if (tierName === "Professional") {
      navigate("/get-started");
    } else {
      navigate("/contact");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      <JsonLd
        id="pricing"
        data={[
          buildBreadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Pricing', url: '/pricing' },
          ]),
          buildFaqPageJsonLd(PRICING_FAQS),
        ]}
      />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your booking needs. Start free, upgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative flex flex-col ${
                tier.highlight
                  ? "ring-2 ring-indigo-600 shadow-xl scale-105"
                  : "shadow-lg"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {tier.badge}
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {tier.price}
                    </span>
                    {tier.period !== "contact us" && (
                      <span className="text-gray-600">/{tier.period}</span>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleCTA(tier.name)}
                  className={`w-full mb-8 ${
                    tier.highlight
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  }`}
                >
                  {tier.cta}
                </Button>

                {/* Features List */}
                <div className="space-y-4 flex-1">
                  {tier.features.map((feature) => (
                    <div key={feature.name} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          feature.included ? "text-gray-900" : "text-gray-400"
                        }
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! Professional plan includes a 14-day free trial. No credit card required.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, Mastercard, American Express) through Stripe.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Absolutely! Cancel your subscription anytime with no penalties or hidden fees.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer discounts for annual billing?
              </h3>
              <p className="text-gray-600">
                Yes! Annual billing saves you 20% compared to monthly. Contact our sales team for details.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What about refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee if you're not satisfied with our service.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Have questions? We're here to help!
          </p>
          <Button
            onClick={() => navigate("/contact")}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Contact Our Sales Team
          </Button>
        </div>
      </div>
    </div>
  );
}
