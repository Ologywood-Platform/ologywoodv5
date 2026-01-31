import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

interface PlanFeature {
  name: string;
  free: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
}

const PLAN_FEATURES: PlanFeature[] = [
  {
    name: 'Artist Profiles',
    free: '1',
    professional: '5',
    enterprise: 'Unlimited',
  },
  {
    name: 'Venue Profiles',
    free: '1',
    professional: '10',
    enterprise: 'Unlimited',
  },
  {
    name: 'Advanced Analytics',
    free: false,
    professional: true,
    enterprise: true,
  },
  {
    name: 'Priority Support',
    free: false,
    professional: true,
    enterprise: true,
  },
  {
    name: 'Custom Branding',
    free: false,
    professional: false,
    enterprise: true,
  },
  {
    name: 'API Access',
    free: false,
    professional: true,
    enterprise: true,
  },
  {
    name: 'Webhooks',
    free: false,
    professional: true,
    enterprise: true,
  },
  {
    name: 'Team Members',
    free: '1',
    professional: '3',
    enterprise: 'Unlimited',
  },
  {
    name: 'Email Support',
    free: false,
    professional: true,
    enterprise: true,
  },
  {
    name: 'Phone Support',
    free: false,
    professional: false,
    enterprise: true,
  },
];

const PLAN_PRICING = {
  free: {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    cta: 'Current Plan',
    color: 'bg-gray-50',
    buttonColor: 'bg-gray-200 text-gray-800',
  },
  professional: {
    name: 'Professional',
    price: '$29',
    period: 'per month',
    description: 'For growing businesses',
    cta: 'Upgrade to Professional',
    color: 'bg-blue-50',
    buttonColor: 'bg-blue-600 text-white',
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact sales',
    description: 'For large organizations',
    cta: 'Contact Sales',
    color: 'bg-purple-50',
    buttonColor: 'bg-purple-600 text-white',
  },
};

export function UpgradePlan() {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'professional' | 'enterprise'>('professional');

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-600" />
      ) : (
        <X className="w-5 h-5 text-gray-300" />
      );
    }
    return <span className="font-semibold text-gray-900">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your needs. Upgrade anytime.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {Object.entries(PLAN_PRICING).map(([key, plan]) => (
            <div
              key={key}
              className={`rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 ${plan.color}`}
            >
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h2>
                <p className="text-gray-600 mb-4">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">/{plan.period}</span>
                </div>

                <button
                  onClick={() => setSelectedPlan(key as any)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${plan.buttonColor}`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Features
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Free
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">
                    Professional
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-purple-600">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {PLAN_FEATURES.map((feature) => (
                  <tr key={feature.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {feature.name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderFeatureValue(feature.free)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderFeatureValue(feature.professional)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderFeatureValue(feature.enterprise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial for Professional?
              </h3>
              <p className="text-gray-600">
                Yes! All new Professional accounts include a 14-day free trial. No credit card required.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I get a refund?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee if you're not satisfied with your plan.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Need help choosing a plan? Our team is here to help.
          </p>
          <a
            href="mailto:support@ologywood.com"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  );
}

export default UpgradePlan;
