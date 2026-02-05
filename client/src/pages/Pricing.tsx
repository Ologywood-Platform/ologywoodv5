import React from 'react';
import { Link } from 'wouter';
import { Check } from 'lucide-react';

const Pricing = () => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'Forever',
      description: 'Perfect for getting started',
      features: [
        'Create artist/venue profile',
        'Browse artists and venues',
        'Basic search and filters',
        'Up to 5 bookings per month',
        'Standard support',
        'Community access',
      ],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '$29',
      period: '/month',
      description: 'For serious artists and venues',
      features: [
        'Everything in Free',
        'Unlimited bookings',
        'Advanced analytics',
        'Priority support',
        'Custom profile branding',
        'Rider templates',
        'Calendar management',
        'Payment tracking',
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Premium',
      price: '$99',
      period: '/month',
      description: 'For high-volume operations',
      features: [
        'Everything in Professional',
        'Advanced reporting',
        'API access',
        '24/7 dedicated support',
        'Team management',
        'Custom integrations',
        'White-label options',
        'Revenue analytics',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  const faqs = [
    {
      question: 'Can I upgrade or downgrade my plan?',
      answer: 'Yes! You can change your plan at any time. Changes take effect at the start of your next billing cycle.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.',
    },
    {
      question: 'Is there a long-term contract?',
      answer: 'No, all plans are month-to-month with no long-term commitment. Cancel anytime.',
    },
    {
      question: 'Do you offer discounts for annual billing?',
      answer: 'Yes! Annual plans include a 20% discount compared to monthly billing.',
    },
    {
      question: 'What happens if I cancel?',
      answer: 'Your account remains active until the end of your current billing period. No refunds for partial months.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes, Professional and Premium plans include a 14-day free trial. No credit card required.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-purple-100 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-purple-100">
            Choose the plan that works best for you. No hidden fees, cancel anytime.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-lg overflow-hidden transition transform hover:scale-105 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xl scale-105'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className={plan.highlighted ? 'text-purple-100' : 'text-gray-600'}>
                  {plan.description}
                </p>
                
                <div className="my-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.highlighted ? 'text-purple-100' : 'text-gray-600'}>
                    {plan.period}
                  </span>
                </div>

                <button
                  className={`w-full py-3 rounded-lg font-bold transition mb-8 ${
                    plan.highlighted
                      ? 'bg-white text-purple-600 hover:bg-gray-100'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {plan.cta}
                </button>

                <div className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Comparison */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Feature Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-4 px-4 font-bold">Feature</th>
                  <th className="text-center py-4 px-4 font-bold">Free</th>
                  <th className="text-center py-4 px-4 font-bold">Professional</th>
                  <th className="text-center py-4 px-4 font-bold">Premium</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4">Bookings per month</td>
                  <td className="text-center">5</td>
                  <td className="text-center">Unlimited</td>
                  <td className="text-center">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4">Analytics</td>
                  <td className="text-center">Basic</td>
                  <td className="text-center">Advanced</td>
                  <td className="text-center">Advanced</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4">Support</td>
                  <td className="text-center">Standard</td>
                  <td className="text-center">Priority</td>
                  <td className="text-center">24/7 Dedicated</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4">Custom Branding</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4">API Access</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr>
                  <td className="py-4 px-4">Team Management</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-purple-100 mb-8">
            Choose your plan and start booking today. 14-day free trial on paid plans.
          </p>
          <Link to="/get-started">
            <button className="bg-white hover:bg-gray-100 text-purple-600 font-bold py-3 px-8 rounded-lg transition">
              Get Started Now
            </button>
          </Link>
        </div>
      </div>

      {/* Footer Link */}
      <div className="bg-white border-t py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link to="/" className="text-purple-600 hover:text-purple-700 font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
