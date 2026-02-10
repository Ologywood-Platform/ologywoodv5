import React from 'react';
import { Link } from 'wouter';
import { CheckCircle, Search, MessageSquare, Calendar, CreditCard, TrendingUp, Zap, Heart, BarChart3, Clock, Users, Award } from 'lucide-react';

const HowItWorksVenue = () => {
  const steps = [
    {
      number: 1,
      title: 'Create Your Venue Profile',
      description: 'Sign up and set up your venue profile with photos, capacity, location, event types, and venue details. Help artists discover you.',
      icon: Search,
    },
    {
      number: 2,
      title: 'Browse & Discover Artists',
      description: 'Search our database of thousands of talented artists. Use advanced filters to find artists by genre, location, price range, availability, and ratings.',
      icon: Search,
    },
    {
      number: 3,
      title: 'Send Booking Requests',
      description: 'Find the perfect artist and send a booking request with your event details, date, and requirements. Use booking templates to streamline the process.',
      icon: MessageSquare,
    },
    {
      number: 4,
      title: 'Communicate & Confirm',
      description: 'Chat with artists through our messaging system to discuss details, negotiate terms, and review their technical and hospitality requirements.',
      icon: CheckCircle,
    },
    {
      number: 5,
      title: 'Process Payment Securely',
      description: 'Handle payments securely through our Stripe integration. Manage deposits, full payments, and refunds with complete transparency.',
      icon: CreditCard,
    },
    {
      number: 6,
      title: 'Review & Build Community',
      description: 'After the event, share your experience with a review. Help other venues find great artists and contribute to our trusted community.',
      icon: TrendingUp,
    },
  ];

  const features = [
    {
      title: 'Vast Artist Database',
      description: 'Access thousands of verified artists across all genres, price ranges, and locations. Find exactly who you need.',
      icon: Users,
    },
    {
      title: 'Advanced Search & Filters',
      description: 'Filter artists by genre, location, availability, price range, ratings, and more. Find the perfect fit for your event.',
      icon: Search,
    },
    {
      title: 'Booking Templates',
      description: 'Create and save booking templates for recurring event types. Streamline your workflow and book artists faster.',
      icon: Clock,
    },
    {
      title: 'Secure Payment Processing',
      description: 'Handle deposits and full payments securely through Stripe. Track all transactions with complete transparency and detailed history.',
      icon: CreditCard,
    },
    {
      title: 'Smart Calendar Management',
      description: 'Manage your event calendar and coordinate with multiple artists simultaneously. View confirmed bookings and pending requests at a glance.',
      icon: Calendar,
    },
    {
      title: 'Verified Artist Community',
      description: 'Book with confidence from our verified artist community. View ratings, reviews, and verified badges to make informed decisions.',
      icon: Award,
    },
    {
      title: 'Direct Messaging',
      description: 'Communicate directly with artists to discuss details, negotiate terms, and coordinate logistics all in one place.',
      icon: MessageSquare,
    },
    {
      title: 'Saved Favorites',
      description: 'Save your favorite artists and get notified when they have new availability. Build relationships with artists you love.',
      icon: Heart,
    },
    {
      title: 'Venue Analytics',
      description: 'Track your booking activity, spending trends, and artist performance. Get insights to improve your event planning.',
      icon: BarChart3,
    },
    {
      title: 'Automated Reminders',
      description: 'Receive automatic reminders for upcoming events. Both you and the artist get notified to ensure smooth coordination.',
      icon: Zap,
    },
  ];

  const benefits = [
    {
      title: 'Verified & Trusted Artists',
      description: 'All artists are verified and reviewed by other venues. Book with confidence knowing you\'re working with quality talent.',
    },
    {
      title: 'Transparent Pricing',
      description: 'Know exactly what you\'re paying upfront. No hidden fees or surprise charges. All pricing is clear and straightforward.',
    },
    {
      title: 'Easy Communication',
      description: 'Message artists directly to discuss details, negotiate terms, and coordinate all logistics in one secure platform.',
    },
    {
      title: 'Secure Payments',
      description: 'All payments are processed securely through Stripe. Manage deposits, full payments, and refunds with complete transparency.',
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
            Book talented artists and create unforgettable events with Ologywood's comprehensive venue platform
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
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Powerful Venue Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-start gap-3">
                  <feature.icon className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Choose Ologywood?</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100">
                    <CheckCircle className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Book Great Artists?</h2>
          <p className="text-lg text-indigo-100 mb-8">
            Join thousands of venues already using Ologywood to book amazing talent and create unforgettable events
          </p>
          <Link to="/get-started">
            <button className="bg-white text-indigo-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition">
              Create Your Venue Profile
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">What are the fees?</h3>
              <p className="text-gray-600">
                We charge a small platform fee on each booking. The exact fee depends on your subscription plan. You can view all pricing details when you sign up.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Can I negotiate prices with artists?</h3>
              <p className="text-gray-600">
                Absolutely! You can message artists directly to discuss pricing and terms before confirming a booking. Many artists are open to negotiation.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">What if an artist cancels?</h3>
              <p className="text-gray-600">
                Our cancellation policy protects both venues and artists. If an artist cancels, contact our support team for assistance and resolution.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">How do I find artists in my area?</h3>
              <p className="text-gray-600">
                Use our advanced search filters to find artists by location, genre, availability, price range, and ratings. You can also save your favorite artists.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Can I save favorite artists?</h3>
              <p className="text-gray-600">
                Yes! Save your favorite artists and get notified when they have new availability. Build relationships with artists you love working with.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">How do booking templates work?</h3>
              <p className="text-gray-600">
                Create templates for your recurring event types with pre-filled details. When booking an artist, select a template to auto-fill the form and save time.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Can I view artist technical requirements?</h3>
              <p className="text-gray-600">
                Yes! Each artist has a detailed rider with their technical requirements, hospitality needs, and equipment specifications. Review these before confirming.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">How do I track my bookings?</h3>
              <p className="text-gray-600">
                Your venue dashboard shows all bookings organized by status (pending, confirmed, completed). You can also view your event calendar and analytics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links */}
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

export default HowItWorksVenue;
