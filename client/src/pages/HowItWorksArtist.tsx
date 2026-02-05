import React from 'react';
import { Link } from 'wouter';
import { CheckCircle, Users, Calendar, DollarSign, Star, Zap } from 'lucide-react';

const HowItWorksArtist = () => {
  const steps = [
    {
      number: 1,
      title: 'Create Your Profile',
      description: 'Sign up and build your artist profile with photos, bio, genres, and rates. Add your technical requirements and hospitality needs.',
      icon: Users,
    },
    {
      number: 2,
      title: 'Set Your Availability',
      description: 'Mark your available dates on the calendar. Venues can see your availability and send booking requests.',
      icon: Calendar,
    },
    {
      number: 3,
      title: 'Receive Booking Requests',
      description: 'Get booking requests from venues interested in your services. Review details and accept or decline.',
      icon: Zap,
    },
    {
      number: 4,
      title: 'Confirm & Communicate',
      description: 'Confirm bookings and communicate with venues through our messaging system. Share your rider and requirements.',
      icon: CheckCircle,
    },
    {
      number: 5,
      title: 'Get Paid',
      description: 'Receive payment securely through our platform. Track your earnings and payment history in your dashboard.',
      icon: DollarSign,
    },
    {
      number: 6,
      title: 'Build Your Reputation',
      description: 'Collect reviews from venues. Higher ratings lead to more booking opportunities and better visibility.',
      icon: Star,
    },
  ];

  const features = [
    {
      title: 'Professional Profile',
      description: 'Showcase your talent with photos, videos, and detailed information about your services.',
    },
    {
      title: 'Flexible Scheduling',
      description: 'Control your availability and manage your calendar to avoid double-bookings.',
    },
    {
      title: 'Secure Payments',
      description: 'Get paid reliably through our secure payment system. Track all transactions.',
    },
    {
      title: 'Direct Communication',
      description: 'Message venues directly to discuss details, negotiate terms, and coordinate logistics.',
    },
    {
      title: 'Rider Management',
      description: 'Create and share technical requirements and hospitality needs with venues.',
    },
    {
      title: 'Analytics & Insights',
      description: 'Track your performance, profile views, and booking trends to grow your business.',
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
          <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-4">How It Works for Artists</h1>
          <p className="text-lg text-purple-100">
            Get discovered, book gigs, and grow your music career with Ologywood
          </p>
        </div>
      </div>

      {/* Steps Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">6 Simple Steps to Success</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {steps.map((step) => {
            const IconComponent = step.icon;
            return (
              <div key={step.number} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-600 text-white">
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
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Artist Features</h2>
          
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of artists already booking gigs on Ologywood
          </p>
          <Link to="/get-started">
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition">
              Create Your Artist Profile
            </button>
          </Link>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">How much does it cost to join?</h3>
              <p className="text-gray-600">
                Ologywood is free to join! We offer flexible subscription plans with additional features and benefits.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">How do I get paid?</h3>
              <p className="text-gray-600">
                Payments are processed securely through Stripe. You can set your rates and receive payment after each booking.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Can I manage multiple gigs at once?</h3>
              <p className="text-gray-600">
                Yes! Our calendar system helps you manage multiple bookings and avoid double-bookings.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">How do I increase my visibility?</h3>
              <p className="text-gray-600">
                Complete your profile, add high-quality photos and videos, collect positive reviews, and maintain your availability.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">What if I need to cancel a booking?</h3>
              <p className="text-gray-600">
                You can communicate with venues through our messaging system. Cancellation policies are agreed upon between parties.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links */}
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

export default HowItWorksArtist;
