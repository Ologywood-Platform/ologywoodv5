import React from 'react';
import { Link } from 'wouter';
import { CheckCircle, Shield, Clock, FileCheck } from 'lucide-react';

const Verification = () => {
  const steps = [
    {
      number: 1,
      title: 'Complete Your Profile',
      description: 'Fill in all required information including bio, photos, and contact details.',
      icon: FileCheck,
    },
    {
      number: 2,
      title: 'Submit Documents',
      description: 'Provide ID verification and any relevant credentials or certifications.',
      icon: Shield,
    },
    {
      number: 3,
      title: 'Review Process',
      description: 'Our team reviews your submission within 24-48 hours.',
      icon: Clock,
    },
    {
      number: 4,
      title: 'Get Verified',
      description: 'Receive your verification badge and boost your profile credibility.',
      icon: CheckCircle,
    },
  ];

  const benefits = [
    'Increased visibility in search results',
    'Higher booking conversion rates',
    'Access to premium features',
    'Priority customer support',
    'Featured profile placement',
    'Trust badge on your profile',
    'Exclusive partnership opportunities',
    'Enhanced profile analytics',
  ];

  const requirements = [
    {
      category: 'For Artists',
      items: [
        'Valid government-issued ID',
        'Professional photos or videos',
        'Detailed bio and experience',
        'Links to social media or portfolio',
        'References from previous bookings (if available)',
      ],
    },
    {
      category: 'For Venues',
      items: [
        'Business registration documents',
        'Venue photos and location proof',
        'Detailed venue information',
        'Capacity and amenities list',
        'Previous event references (if available)',
      ],
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
          <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-4">Get Verified</h1>
          <p className="text-lg text-purple-100">
            Build trust and credibility on Ologywood with our verification program
          </p>
        </div>
      </div>

      {/* Why Verification Matters */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Get Verified?</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
              <span className="text-gray-600">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Steps */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Verification Process</h2>
          
          <div className="space-y-6">
            {steps.map((step) => {
              const IconComponent = step.icon;
              return (
                <div key={step.number} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-14 w-14 rounded-full bg-purple-600 text-white font-bold text-lg">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <IconComponent className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                      <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-gray-600 ml-9">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Verification Requirements</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {requirements.map((req, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{req.category}</h3>
              <ul className="space-y-3">
                {req.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">How long does verification take?</h3>
              <p className="text-gray-600">
                Most verifications are completed within 24-48 hours. You'll receive an email notification once your verification is approved.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Is verification mandatory?</h3>
              <p className="text-gray-600">
                No, verification is optional. However, verified profiles receive significantly more visibility and bookings.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">What if my verification is rejected?</h3>
              <p className="text-gray-600">
                If your verification is rejected, we'll provide feedback on what needs to be improved. You can resubmit after making corrections.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Is my personal information secure?</h3>
              <p className="text-gray-600">
                Yes, all submitted documents are encrypted and stored securely. We only use this information for verification purposes.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can I update my verified profile?</h3>
              <p className="text-gray-600">
                Yes, you can update your profile information anytime. Significant changes may require re-verification.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-8 text-center border border-purple-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Verified?</h2>
          <p className="text-gray-600 mb-6">
            Start the verification process and boost your profile credibility today.
          </p>
          <Link to="/dashboard">
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition">
              Start Verification
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

export default Verification;
