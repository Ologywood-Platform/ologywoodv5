import React from 'react';
import { Link } from 'wouter';
import { CheckCircle, Search, MessageSquare, Calendar, CreditCard, TrendingUp } from 'lucide-react';

const HowItWorksVenue = () => {
  const steps = [
    {
      number: 1,
      title: 'Create Your Venue Profile',
      description: 'Sign up and set up your venue profile with photos, capacity, location, and event types. Help artists find you.',
      icon: Search,
    },
    {
      number: 2,
      title: 'Browse & Discover Artists',
      description: 'Search our database of talented artists. Filter by genre, location, price range, and availability.',
      icon: Search,
    },
    {
      number: 3,
      title: 'Send Booking Requests',
      description: 'Find the perfect artist and send a booking request with your event details, date, and requirements.',
      icon: MessageSquare,
    },
    {
      number: 4,
      title: 'Communicate & Confirm',
      description: 'Chat with artists to discuss details, negotiate terms, and review their technical requirements.',
      icon: CheckCircle,
    },
    {
      number: 5,
      title: 'Process Payment',
      description: 'Secure payment processing through our platform. Transparent pricing with no hidden fees.',
      icon: CreditCard,
    },
    {
      number: 6,
      title: 'Leave a Review',
      description: 'After the event, share your experience. Help other venues find great artists and build the community.',
      icon: TrendingUp,
    },
  ];

  const features = [
    {
      title: 'Artist Discovery',
      description: 'Access to thousands of verified artists across all genres and price ranges.',
    },
    {
      title: 'Advanced Search',
      description: 'Filter artists by genre, location, availability, price, and ratings to find the perfect fit.',
    },
    {
      title: 'Booking Templates',
      description: 'Save booking templates to streamline your booking process for recurring event types.',
    },
    {
      title: 'Secure Payments',
      description: 'Handle payments securely with transparent pricing and detailed transaction history.',
    },
    {
      title: 'Calendar Management',
      description: 'Manage your event calendar and coordinate with multiple artists simultaneously.',
    },
    {
      title: 'Verified Artists',
      description: 'Book with confidence from our verified artist community with ratings and reviews.',
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
          <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-4">How It Works for Venues</h1>
          <p className="text-lg text-indigo-100">
            Book talented artists and create unforgettable events with Ologywood
          </p>
        </div>
      </div>

      {/* Steps Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">6 Simple Steps to Book Artists</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {steps.map((step) => {
            const IconComponent = step.icon;
            return (
              <div key={step.number} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-600 text-white">
                    <IconComponent className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {step.number}. {step.title}
                  </h3>
                  <p className="mt-2 text-gray-600">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Venue Features</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Book Great Artists?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of venues already using Ologywood to book amazing talent
          </p>
          <Link to="/get-started">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition">
              Create Your Venue Profile
            </button>
          </Link>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Choose Ologywood?</h2>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">✓ Verified Artists</h3>
              <p className="text-gray-600">
                All artists are verified and reviewed by other venues. Book with confidence.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">✓ Transparent Pricing</h3>
              <p className="text-gray-600">
                Know exactly what you're paying. No hidden fees or surprise charges.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">✓ Easy Communication</h3>
              <p className="text-gray-600">
                Message artists directly to discuss details and coordinate logistics.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">✓ Secure Payments</h3>
              <p className="text-gray-600">
                All payments are processed securely through our trusted payment system.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">✓ Support Team</h3>
              <p className="text-gray-600">
                Our support team is available 24/7 to help with any questions or issues.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">What are the fees?</h3>
              <p className="text-gray-600">
                We charge a small platform fee on each booking. The exact fee depends on your subscription plan.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Can I negotiate prices with artists?</h3>
              <p className="text-gray-600">
                Yes! You can message artists to discuss pricing and terms before confirming a booking.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">What if an artist cancels?</h3>
              <p className="text-gray-600">
                Our cancellation policy protects both venues and artists. Contact our support team for assistance.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">How do I find artists in my area?</h3>
              <p className="text-gray-600">
                Use our search filters to find artists by location, genre, availability, and price range.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Can I save favorite artists?</h3>
              <p className="text-gray-600">
                Yes! Save your favorite artists and get notified when they have new availability.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="bg-gray-50 border-t py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksVenue;
