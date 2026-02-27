import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { useLocation } from "wouter";
import { JsonLd, buildBreadcrumbJsonLd, buildFaqPageJsonLd } from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";

const PRICING_FAQS = [
  {
    question: 'Can I change my plan anytime?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
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
    question: 'How does the booking limit work on the Free plan?',
    answer: 'Free plan users can send up to 2 booking requests per month. Upgrade to Starter or Professional for unlimited bookings.',
  },
  {
    question: 'What is the Rider Builder?',
    answer: 'The Rider Builder lets artists create professional technical riders with equipment needs, hospitality requirements, and stage specifications. Available on Starter and Professional plans.',
  },
  {
    question: 'Can I send email updates to my fans?',
    answer: 'Yes! Artists on Starter and Professional plans can send branded email updates to all their followers, up to once per day.',
  },
];

export default function Pricing() {
  const [, navigate] = useLocation();

  const tiers = [
    {
      name: "Free",
      description: "Get started and explore the platform",
      price: "$0",
      period: "forever",
      cta: "Get Started",
      highlight: false,
      features: [
        { name: "Artist or venue profile", included: true },
        { name: "Browse artists and venues", included: true },
        { name: "In-platform messaging", included: true },
        { name: "Availability calendar", included: true },
        { name: "Follow artists & event discovery", included: true },
        { name: "2 booking requests per month", included: true },
        { name: "Rider Builder & templates", included: false },
        { name: "Contract management & e-signatures", included: false },
        { name: "Fan email list & Send Update", included: false },
        { name: "Analytics & payment history", included: false },
        { name: "Priority support", included: false },
        { name: "Featured profile & custom branding", included: false },
      ],
    },
    {
      name: "Starter",
      description: "For active artists and bookers",
      price: "$9",
      period: "month",
      cta: "Upgrade to Starter",
      highlight: true,
      badge: "Most Popular",
      features: [
        { name: "Everything in Free, plus:", included: true },
        { name: "Unlimited booking requests", included: true },
        { name: "Rider Builder & saved templates", included: true },
        { name: "Fan email list & Send Update", included: true },
        { name: "Follow artists & event discovery", included: true },
        { name: "In-platform messaging", included: true },
        { name: "Availability calendar", included: true },
        { name: "Contract management & e-signatures", included: false },
        { name: "Analytics & payment history", included: false },
        { name: "Priority support", included: false },
        { name: "Featured profile & custom branding", included: false },
        { name: "Bulk messaging", included: false },
      ],
    },
    {
      name: "Professional",
      description: "Full-featured for serious professionals",
      price: "$29",
      period: "month",
      cta: "Go Professional",
      highlight: false,
      features: [
        { name: "Everything in Starter, plus:", included: true },
        { name: "Contract management & e-signatures", included: true },
        { name: "Advanced analytics dashboard", included: true },
        { name: "Payment history & earnings tracking", included: true },
        { name: "Priority support", included: true },
        { name: "Featured profile listing", included: true },
        { name: "Custom branding", included: true },
        { name: "Bulk messaging", included: true },
        { name: "Advanced profile customization", included: true },
        { name: "Unlimited booking requests", included: true },
        { name: "Rider Builder & saved templates", included: true },
        { name: "Fan email list & Send Update", included: true },
      ],
    },
  ];

  const handleCTA = (tierName: string) => {
    if (tierName === "Free" || tierName === "Starter") {
      navigate("/get-started");
    } else {
      navigate("/get-started");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your needs. Start free, upgrade anytime.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-12">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={`relative flex flex-col ${
                  tier.highlight
                    ? "ring-2 ring-indigo-600 shadow-xl md:scale-105"
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
                      {tier.period !== "forever" && (
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
                  <div className="space-y-3 flex-1">
                    {tier.features.map((feature) => (
                      <div key={feature.name} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={
                            feature.included ? "text-gray-900 text-sm" : "text-gray-400 text-sm"
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
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {PRICING_FAQS.map((faq, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
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
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
