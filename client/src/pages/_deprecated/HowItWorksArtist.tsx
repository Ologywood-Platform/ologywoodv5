import React from 'react';
import { Link } from 'wouter';
import { CheckCircle, Users, Calendar, DollarSign, Star, Zap, Award, TrendingUp, Users2, Gift, BarChart3, MessageSquare } from 'lucide-react';

const HowItWorksArtist = () => {
  const steps = [
    {
      number: 1,
      title: 'Create Your Profile',
      description: 'Sign up and build your artist profile with photos, bio, genres, and rates. Add your technical requirements and hospitality needs with our comprehensive rider management system.',
      icon: Users,
    },
    {
      number: 2,
      title: 'Set Your Availability',
      description: 'Mark your available dates on the interactive calendar. Venues can see your availability and send booking requests. Automatic reminders help you stay organized.',
      icon: Calendar,
    },
    {
      number: 3,
      title: 'Receive & Review Booking Requests',
      description: 'Get booking requests from venues interested in your services. Review event details, venue information, and requirements. Accept or decline with ease.',
      icon: Zap,
    },
    {
      number: 4,
      title: 'Confirm & Communicate',
      description: 'Confirm bookings and communicate with venues through our in-platform messaging system. Share your rider, technical requirements, and coordinate all logistics seamlessly.',
      icon: CheckCircle,
    },
    {
      number: 5,
      title: 'Get Paid Securely',
      description: 'Receive payment securely through our platform with Stripe integration. Track your earnings, view payment history, and manage deposits in your dashboard.',
      icon: DollarSign,
    },
    {
      number: 6,
      title: 'Build Your Reputation & Grow',
      description: 'Collect reviews from venues and earn verification badges as you build your reputation. Higher ratings lead to more booking opportunities and better visibility on the platform.',
      icon: Star,
    },
  ];

  const features = [
    {
      title: 'Professional Profile & Portfolio',
      description: 'Showcase your talent with high-quality photos, videos, and detailed information. Build a complete portfolio that venues trust.',
      icon: Users,
    },
    {
      title: 'Smart Calendar Management',
      description: 'Control your availability with an interactive calendar. Prevent double-bookings with automatic conflict detection and manage multiple gigs simultaneously.',
      icon: Calendar,
    },
    {
      title: 'Secure Payment Processing',
      description: 'Get paid reliably through our Stripe integration. Track all transactions, view payment history, and manage deposits with complete transparency.',
      icon: DollarSign,
    },
    {
      title: 'Direct Messaging & Communication',
      description: 'Message venues directly to discuss details, negotiate terms, and coordinate logistics. Keep all conversations organized in one place.',
      icon: MessageSquare,
    },
    {
      title: 'Comprehensive Rider Management',
      description: 'Create and share detailed technical requirements, hospitality needs, and equipment specifications with venues. Ensure your needs are met before every performance.',
      icon: CheckCircle,
    },
    {
      title: 'Advanced Analytics Dashboard',
      description: 'Track your performance with detailed analytics. Monitor profile views, booking trends, conversion rates, and revenue to grow your business strategically.',
      icon: BarChart3,
    },
    {
      title: 'Verification Badges & Milestones',
      description: 'Earn verification badges as you complete bookings and build your reputation. Display your achievements to increase credibility and attract more bookings.',
      icon: Award,
    },
    {
      title: 'Referral Program',
      description: 'Earn rewards by referring other artists and venues to Ologywood. Build your network and earn commissions on successful referrals.',
      icon: Gift,
    },
    {
      title: 'Automated Booking Reminders',
      description: 'Receive automatic reminders for upcoming bookings. Never miss an event with timely notifications sent to both you and the venue.',
      icon: TrendingUp,
    },
    {
      title: 'Venue Reviews & Ratings',
      description: 'Review venues after performances and help other artists make informed decisions. Build a community of trusted venues and share your experiences.',
      icon: Star,
    },
  ];

  const benefits = [
    {
      title: 'Increased Visibility',
      description: 'Get discovered by venues searching for artists in your genre, location, and price range. Our advanced search filters connect you with the right opportunities.',
    },
    {
      title: 'Time-Saving Tools',
      description: 'Automate your booking workflow with templates, reminders, and calendar management. Spend less time on admin and more time on your music.',
    },
    {
      title: 'Professional Growth',
      description: 'Build your reputation with verified reviews, analytics insights, and professional tools that help you scale your music career.',
    },
    {
      title: 'Community Support',
      description: 'Join a community of talented artists. Share experiences, learn from others, and grow together with Ologywood.',
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
            Get discovered, book gigs, and grow your music career with Ologywood's comprehensive artist platform
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
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Powerful Artist Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-start gap-3">
                  <feature.icon className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
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
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Artists Choose Ologywood</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-100">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-purple-100 mb-8">
            Join thousands of artists already booking gigs and growing their careers on Ologywood
          </p>
          <Link to="/get-started">
            <button className="bg-white text-purple-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition">
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
                Ologywood is free to join! We offer flexible subscription plans with additional premium features and benefits. Start for free and upgrade anytime.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">How do I get paid?</h3>
              <p className="text-gray-600">
                Payments are processed securely through Stripe. You set your rates, and venues pay through our platform. You can track all payments in your dashboard.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Can I manage multiple gigs at once?</h3>
              <p className="text-gray-600">
                Absolutely! Our smart calendar system helps you manage multiple bookings simultaneously and automatically prevents double-bookings.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">How do I increase my visibility?</h3>
              <p className="text-gray-600">
                Complete your profile with high-quality photos and videos, add detailed information about your services, collect positive reviews, earn verification badges, and maintain your availability.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">What if I need to cancel a booking?</h3>
              <p className="text-gray-600">
                You can communicate with venues through our messaging system to discuss cancellations. Cancellation policies are agreed upon between parties during the booking process.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">How does the referral program work?</h3>
              <p className="text-gray-600">
                Refer other artists and venues to Ologywood and earn rewards for successful sign-ups. Track your referrals and earnings in your dashboard.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Can I see my performance analytics?</h3>
              <p className="text-gray-600">
                Yes! Your analytics dashboard shows profile views, booking trends, conversion rates, revenue, and other key metrics to help you grow your business.
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
