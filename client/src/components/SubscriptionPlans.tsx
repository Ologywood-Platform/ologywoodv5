import React, { useState } from 'react';
import { Check, X, Zap } from 'lucide-react';

type PlanTier = 'free' | 'basic' | 'premium';

interface Plan {
  id: PlanTier;
  name: string;
  price: number;
  period: string;
  description: string;
  features: Array<{ name: string; included: boolean }>;
  cta: string;
  highlighted?: boolean;
  trial?: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Starter',
    price: 0,
    period: 'Forever',
    description: 'Perfect for trying out Ologywood',
    features: [
      { name: '1 Artist/Venue Profile', included: true },
      { name: '1 Rider Template', included: true },
      { name: '2 Bookings/Month', included: true },
      { name: 'Basic Messaging', included: true },
      { name: 'Email Support', included: true },
      { name: 'Advanced Analytics', included: false },
      { name: 'Priority Support', included: false },
      { name: 'Custom Branding', included: false },
      { name: 'API Access', included: false },
    ],
    cta: 'Get Started Free',
  },
  {
    id: 'basic',
    name: 'Professional',
    price: 9,
    period: 'month',
    description: 'For active artists and venues',
    features: [
      { name: 'Unlimited Profiles', included: true },
      { name: '5 Rider Templates', included: true },
      { name: '20 Bookings/Month', included: true },
      { name: 'Advanced Messaging', included: true },
      { name: 'Contract Collaboration', included: true },
      { name: 'Advanced Analytics', included: true },
      { name: 'Email Support', included: true },
      { name: 'Custom Branding', included: true },
      { name: 'API Access', included: true },
    ],
    cta: 'Start Free Trial',
    trial: '14-day free trial',
  },
  {
    id: 'premium',
    name: 'Enterprise',
    price: 29,
    period: 'month',
    description: 'For agencies and high-volume users',
    features: [
      { name: 'Unlimited Profiles', included: true },
      { name: 'Unlimited Riders', included: true },
      { name: 'Unlimited Bookings', included: true },
      { name: 'Priority Messaging', included: true },
      { name: 'Advanced Contract Tools', included: true },
      { name: 'Real-time Analytics', included: true },
      { name: 'Priority Support (24/7)', included: true },
      { name: 'Custom Branding & Domain', included: true },
      { name: 'Full API Access', included: true },
    ],
    cta: 'Start Free Trial',
    trial: '14-day free trial',
    highlighted: true,
  },
];

interface SubscriptionPlansProps {
  currentPlan?: PlanTier;
  onSelectPlan?: (plan: PlanTier) => void;
}

export function SubscriptionPlans({ currentPlan = 'free', onSelectPlan }: SubscriptionPlansProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handleSelectPlan = (planId: PlanTier) => {
    onSelectPlan?.(planId);
  };

  return (
    <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Choose the perfect plan for your needs. Upgrade or downgrade anytime.
        </p>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              billingCycle === 'annual'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Annual
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl overflow-hidden transition-transform hover:scale-105 ${
              plan.highlighted
                ? 'ring-2 ring-purple-600 shadow-2xl md:scale-105'
                : 'border border-gray-200 shadow-lg'
            } ${plan.highlighted ? 'bg-gradient-to-br from-purple-50 to-white' : 'bg-white'}`}
          >
            {/* Popular Badge */}
            {plan.highlighted && (
              <div className="absolute top-0 right-0 bg-purple-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg flex items-center gap-1">
                <Zap className="h-4 w-4" />
                Most Popular
              </div>
            )}

            <div className="p-8">
              {/* Plan Name */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

              {/* Pricing */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-600">/{plan.period}</span>}
                </div>
                {plan.trial && (
                  <p className="text-sm text-green-600 mt-2">✓ {plan.trial}</p>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={currentPlan === plan.id}
                className={`w-full py-3 rounded-lg font-semibold transition-colors mb-8 ${
                  currentPlan === plan.id
                    ? 'bg-gray-200 text-gray-700 cursor-not-allowed'
                    : plan.highlighted
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50'
                }`}
              >
                {currentPlan === plan.id ? 'Current Plan' : plan.cta}
              </button>

              {/* Features */}
              <div className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-sm ${
                        feature.included ? 'text-gray-900' : 'text-gray-400 line-through'
                      }`}
                    >
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Frequently Asked Questions
        </h3>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h4>
            <p className="text-gray-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">What happens if I exceed my limits?</h4>
            <p className="text-gray-600">
              We'll notify you when you're approaching your limits. You can upgrade anytime to get more capacity.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Do you offer refunds?</h4>
            <p className="text-gray-600">
              We offer a 30-day money-back guarantee if you're not satisfied with your plan.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Is there a contract?</h4>
            <p className="text-gray-600">
              No contracts! Cancel your subscription anytime without penalties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
