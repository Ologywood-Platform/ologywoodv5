import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Loader2, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { JsonLd, buildBreadcrumbJsonLd } from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";
import { useToast } from "@/components/ErrorToast";
import { setMetaTags, pageMetaTags } from "@/utils/seoMeta";
import { StripeTestModeBanner } from '@/components/StripeTestModeBanner';
import TestModeBadge from '@/components/TestModeBadge';

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
  {
    question: 'What are White Label Releases?',
    answer: 'White Label Releases let artists sell singles directly from their Ologywood profile. Starter plans include up to 2 active singles with pay-what-you-want pricing. Professional plans get unlimited releases. Ologywood takes just a 1% platform fee on each sale.',
  },
];

type PlanSlug = 'starter' | 'professional';
type BillingInterval = 'month' | 'year';

interface Tier {
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  yearlyMonthly: string;
  yearlySavings: string;
  period: string;
  cta: string;
  highlight: boolean;
  badge?: string;
  planSlug?: PlanSlug;
  features: { name: string; included: boolean }[];
}

const tiers: Tier[] = [
  {
    name: "Free",
    description: "Get started and explore the platform",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    yearlyMonthly: "$0",
    yearlySavings: "",
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
      { name: "White Label Releases (sell music)", included: false },
      { name: "Analytics & payment history", included: false },
      { name: "Priority support", included: false },
      { name: "Featured profile & custom branding", included: false },
    ],
  },
  {
    name: "Starter",
    description: "For active artists and bookers",
    monthlyPrice: "$9",
    yearlyPrice: "$90",
    yearlyMonthly: "$7.50",
    yearlySavings: "Save $18",
    period: "month",
    cta: "Upgrade to Starter",
    highlight: true,
    badge: "Most Popular",
    planSlug: "starter",
    features: [
      { name: "Everything in Free, plus:", included: true },
      { name: "Unlimited booking requests", included: true },
      { name: "Rider Builder & saved templates", included: true },
      { name: "Fan email list & Send Update", included: true },
      { name: "Follow artists & event discovery", included: true },
      { name: "In-platform messaging", included: true },
      { name: "Availability calendar", included: true },
      { name: "White Label Releases — 2 singles + pay-what-you-want", included: true },
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
    monthlyPrice: "$29",
    yearlyPrice: "$290",
    yearlyMonthly: "$24.17",
    yearlySavings: "Save $58",
    period: "month",
    cta: "Go Professional",
    highlight: false,
    planSlug: "professional",
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
      { name: "White Label Releases — unlimited singles", included: true },
    ],
  },
];

/** Renders a single pricing card */
function PricingCard({ tier, loadingPlan, onCTA, billingInterval }: { tier: Tier; loadingPlan: string | null; onCTA: (tier: Tier) => void; billingInterval: BillingInterval }) {
  const isYearly = billingInterval === 'year';
  const displayPrice = tier.period === 'forever' ? tier.monthlyPrice : (isYearly ? tier.yearlyMonthly : tier.monthlyPrice);
  const displayPeriod = tier.period === 'forever' ? '' : '/mo';

  return (
    <Card
      className={`relative flex flex-col h-full ${
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
            <span className="text-4xl font-bold text-gray-900">{displayPrice}</span>
            {tier.period !== "forever" && (
              <span className="text-gray-600">{displayPeriod}</span>
            )}
          </div>
          {isYearly && tier.planSlug && (
            <div className="mt-1">
              <span className="text-xs text-gray-500">Billed {tier.yearlyPrice}/year</span>
              {tier.yearlySavings && (
                <span className="ml-2 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {tier.yearlySavings}
                </span>
              )}
            </div>
          )}
          {!isYearly && tier.planSlug === 'professional' && (
            <p className="text-xs text-indigo-600 mt-1 font-medium">14-day free trial included</p>
          )}
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => onCTA(tier)}
          disabled={loadingPlan === tier.name}
          className={`w-full mb-8 ${
            tier.highlight
              ? "bg-indigo-600 hover:bg-indigo-700"
              : tier.planSlug
                ? "bg-gray-900 hover:bg-gray-800 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-900"
          }`}
        >
          {loadingPlan === tier.name ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Redirecting...
            </>
          ) : (
            tier.cta
          )}
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
              <span className={feature.included ? "text-gray-900 text-sm" : "text-gray-400 text-sm"}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Pricing() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const toastCtx = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
  const [activeSlide, setActiveSlide] = useState(1); // Start on Starter (Most Popular)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  // Set SEO meta tags
  useEffect(() => {
    setMetaTags(pageMetaTags.pricing);
  }, []);

  const checkoutMutation = (trpc.subscription as any).createCheckoutSession.useMutation({
    onSuccess: (data: { checkoutUrl: string }) => {
      toastCtx.addInfo("Redirecting to checkout", "You'll be taken to Stripe to complete your subscription.");
      window.open(data.checkoutUrl, '_blank');
      setLoadingPlan(null);
    },
    onError: (err: any) => {
      toastCtx.addError("Checkout error", err?.message || "Could not create checkout session. Please try again.");
      setLoadingPlan(null);
    },
  });

  const handleCTA = (tier: Tier) => {
    if (!tier.planSlug) {
      navigate("/get-started");
      return;
    }
    if (!isAuthenticated) {
      toastCtx.addInfo("Sign in required", "Create an account or sign in first, then you can upgrade your plan.");
      navigate("/get-started");
      return;
    }
    setLoadingPlan(tier.name);
    const origin = window.location.origin;
    checkoutMutation.mutate({
      plan: tier.planSlug,
      interval: billingInterval,
      successUrl: `${origin}/dashboard?subscription=success`,
      cancelUrl: `${origin}/pricing`,
    });
  };

  const goToSlide = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(tiers.length - 1, index));
    setActiveSlide(clamped);
  }, []);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    const threshold = 50;
    if (touchDeltaX.current < -threshold) {
      goToSlide(activeSlide + 1);
    } else if (touchDeltaX.current > threshold) {
      goToSlide(activeSlide - 1);
    }
    touchDeltaX.current = 0;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb JSON-LD only — FAQPage schema is injected server-side by ogTags middleware to avoid duplicate structured data */}
        <JsonLd
          id="pricing"
          data={[
            buildBreadcrumbJsonLd([
              { name: 'Home', url: '/' },
              { name: 'Pricing', url: '/pricing' },
            ]),
          ]}
        />
        <div className="max-w-7xl mx-auto">
          <StripeTestModeBanner />
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your needs. Start free, upgrade anytime.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="mt-8 inline-flex items-center bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setBillingInterval('month')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingInterval === 'month'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingInterval === 'year'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-1.5 text-xs font-semibold text-green-600">2 months free</span>
              </button>
            </div>
          </div>

          {/* Desktop: 3-column grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-8 mb-12">
            {tiers.map((tier) => (
              <PricingCard key={tier.name} tier={tier} loadingPlan={loadingPlan} onCTA={handleCTA} billingInterval={billingInterval} />
            ))}
          </div>

          {/* Mobile: Swipeable carousel */}
          <div className="md:hidden mb-12">
            {/* Plan tabs */}
            <div className="flex justify-center gap-1 mb-8">
              {tiers.map((tier, i) => (
                <button
                  key={tier.name}
                  onClick={() => goToSlide(i)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeSlide === i
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tier.name}
                </button>
              ))}
            </div>

            {/* Carousel container — no arrows, swipe only */}
            <div
              ref={carouselRef}
              className="relative overflow-hidden pt-6"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {tiers.map((tier) => (
                  <div key={tier.name} className="w-full flex-shrink-0 px-4">
                    <PricingCard tier={tier} loadingPlan={loadingPlan} onCTA={handleCTA} billingInterval={billingInterval} />
                  </div>
                ))}
              </div>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {tiers.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    activeSlide === i ? 'bg-indigo-600 w-6' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to plan ${i + 1}`}
                />
              ))}
            </div>

            {/* Swipe hint */}
            <p className="text-center text-xs text-gray-400 mt-2">Swipe or tap tabs to compare plans</p>
          </div>

          {/* Test Mode Notice */}
          <div className="max-w-3xl mx-auto mb-6">
            <TestModeBadge showTestCard />
          </div>

          {/* FAQ Section */}
          <div id="faq" className="bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-3xl mx-auto scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-3">
              {PRICING_FAQS.map((faq, index) => (
                <div key={index} className="bg-gray-50 rounded-lg">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 rounded-lg"
                  >
                    <h3 className="font-semibold text-gray-900 text-left">{faq.question}</h3>
                    <ChevronDown className={`w-5 h-5 text-gray-600 flex-shrink-0 ml-4 transition-transform ${openFaqIndex === index ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaqIndex === index && (
                    <div className="px-6 py-4 border-t border-gray-200">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  )}
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
