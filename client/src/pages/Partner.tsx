import React from 'react';
import { Link } from 'wouter';
import { CheckCircle, Users, TrendingUp, Award } from 'lucide-react';

const Partner = () => {
  const benefits = [
    {
      icon: Users,
      title: 'Access to Talent Pool',
      description: 'Connect with thousands of verified artists actively seeking bookings.',
    },
    {
      icon: TrendingUp,
      title: 'Increased Revenue',
      description: 'Boost bookings and revenue with our platform\'s marketing and reach.',
    },
    {
      icon: Award,
      title: 'Professional Support',
      description: 'Dedicated support team to help you succeed on the platform.',
    },
    {
      icon: CheckCircle,
      title: 'Verified Artists',
      description: 'All artists are verified to ensure quality and reliability.',
    },
  ];

  const partnerTiers = [
    {
      name: 'Bronze',
      description: 'Perfect for getting started',
      features: [
        'Access to artist directory',
        'Up to 10 artist connections',
        'Basic analytics',
        'Standard support',
        'Free listing',
      ],
      cta: 'Get Started',
    },
    {
      name: 'Silver',
      description: 'For growing venues',
      features: [
        'Everything in Bronze',
        'Unlimited artist connections',
        'Advanced analytics',
        'Priority support',
        'Featured listing',
        'Marketing materials',
      ],
      cta: 'Learn More',
      highlighted: true,
    },
    {
      name: 'Gold',
      description: 'For established venues',
      features: [
        'Everything in Silver',
        'Dedicated account manager',
        'Custom branding',
        '24/7 support',
        'API access',
        'Revenue sharing options',
      ],
      cta: 'Contact Sales',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-indigo-100 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-4">Partner With Us</h1>
          <p className="text-lg text-indigo-100">
            Grow your venue with access to thousands of talented artists
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Partner With Ologywood?</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-600 text-white">
                      <IconComponent className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Partnership Tiers */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Partnership Tiers</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {partnerTiers.map((tier, index) => (
              <div
                key={index}
                className={`rounded-lg overflow-hidden transition transform hover:scale-105 ${
                  tier.highlighted
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl scale-105'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className={tier.highlighted ? 'text-indigo-100' : 'text-gray-600'}>
                    {tier.description}
                  </p>
                  
                  <button
                    className={`w-full py-3 rounded-lg font-bold transition mt-8 mb-8 ${
                      tier.highlighted
                        ? 'bg-white text-indigo-600 hover:bg-gray-100'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {tier.cta}
                  </button>

                  <div className="space-y-4">
                    {tier.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
        
        <div className="space-y-6">
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white font-bold">
                1
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Sign Up</h3>
              <p className="text-gray-600">
                Create your venue account and complete your profile with photos and details.
              </p>
            </div>
          </div>
          
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white font-bold">
                2
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Browse Artists</h3>
              <p className="text-gray-600">
                Search and filter through thousands of verified artists matching your needs.
              </p>
            </div>
          </div>
          
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white font-bold">
                3
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Send Booking Requests</h3>
              <p className="text-gray-600">
                Contact artists directly with your event details and negotiate terms.
              </p>
            </div>
          </div>
          
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white font-bold">
                4
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm & Manage</h3>
              <p className="text-gray-600">
                Confirm bookings, manage contracts, and coordinate with artists through our platform.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-indigo-100 mb-8">
            Join hundreds of venues already using Ologywood to book amazing artists.
          </p>
          <button className="bg-white hover:bg-gray-100 text-indigo-600 font-bold py-3 px-8 rounded-lg transition">
            Become a Partner
          </button>
        </div>
      </div>

      {/* Footer Link */}
      <div className="bg-white border-t py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Partner;
