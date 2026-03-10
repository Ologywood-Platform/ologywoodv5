import React, { useState, useEffect } from 'react';
import { Music, Briefcase, Heart, CheckCircle, MessageSquare, CreditCard, Star, Bell, DollarSign, Download, Users } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';
import Footer from '@/components/Footer';

interface Step {
  number: number;
  title: string;
  description: string;
  items: string[];
}

const artistSteps: Step[] = [
  {
    number: 1,
    title: 'Create Your Profile',
    description: 'Sign up and build your artist profile with your bio, genres, photos, and pricing. Show venues exactly what you offer.',
    items: [
      'Upload professional photos and videos',
      'List your genres and performance style',
      'Set your booking rates',
      'Add social links (Instagram, Spotify, etc.)',
    ],
  },
  {
    number: 2,
    title: 'Set Your Availability',
    description: 'Use the interactive calendar to mark when you are available for bookings. Update it anytime as your schedule changes.',
    items: [
      'Mark available dates on your calendar',
      'Block out unavailable dates',
      'Real-time sync prevents double-bookings',
    ],
  },
  {
    number: 3,
    title: 'Receive Booking Requests',
    description: 'Venues discover your profile and send booking requests. Review event details, venue information, and requirements.',
    items: [
      'In-app and email notifications for new requests',
      'See full event details and venue info',
      'Review technical requirements',
    ],
  },
  {
    number: 4,
    title: 'Communicate & Confirm',
    description: 'Message venues directly to discuss details, negotiate terms, and finalize arrangements before confirming the booking.',
    items: [
      'In-platform messaging with venues',
      'Negotiate rates and requirements',
      'Accept or decline bookings',
    ],
  },
  {
    number: 5,
    title: 'Build & Attach Riders',
    description: 'Create professional rider templates with your technical and hospitality requirements using the Rider Builder tool.',
    items: [
      'Choose from structured templates or build custom',
      'List sound, lighting, and stage specs',
      'Attach riders to confirmed bookings',
      'Digital contracts with e-signatures',
    ],
  },
  {
    number: 6,
    title: 'Get Paid & Sell Music',
    description: 'Receive payment securely after performances. Upload and sell your music directly to fans through your profile.',
    items: [
      'Secure Stripe payment processing',
      'Upload releases with cover art and pricing',
      'Keep 99% of each music sale',
      'View earnings and sales analytics in your Dashboard',
    ],
  },
  {
    number: 7,
    title: 'Grow Your Fan Base',
    description: 'Build a following on Ologywood. Fans can follow you, tip you, and buy your music. Keep them engaged with direct updates.',
    items: [
      'Fans can follow your profile',
      'Set up tip links (Cash App, Venmo, PayPal, Zelle)',
      'Send branded email updates to followers',
      'Receive reviews and ratings from fans and venues',
    ],
  },
];

const venueSteps: Step[] = [
  {
    number: 1,
    title: 'Create Your Venue Profile',
    description: 'Set up your venue profile with details about your space, capacity, and the types of events you host.',
    items: [
      'Add venue photos and details',
      'Describe your space and capacity',
      'List event types you host',
    ],
  },
  {
    number: 2,
    title: 'Browse & Discover Artists',
    description: 'Search through our artist directory by genre, location, availability, and pricing to find the right fit for your event.',
    items: [
      'Filter by genre, location, and availability',
      'View artist profiles, media, and reviews',
      'Check real-time availability calendars',
    ],
  },
  {
    number: 3,
    title: 'Send Booking Requests',
    description: 'Found the right artist? Send a booking request with your event date, time, venue address, offered fee, and event details.',
    items: [
      'Fill in event date and time',
      'Enter venue address (street, city, state, zip)',
      'Set your offered fee',
      'Describe your event details',
    ],
  },
  {
    number: 4,
    title: 'Communicate & Finalize',
    description: 'Message artists directly to discuss details, review their rider requirements, and finalize all arrangements.',
    items: [
      'In-platform messaging with artists',
      'Review and acknowledge rider requirements',
      'Negotiate terms and finalize details',
    ],
  },
  {
    number: 5,
    title: 'Sign Contracts & Pay',
    description: 'Sign digital contracts with e-signatures and process payments securely through Stripe.',
    items: [
      'Digital contracts with all agreed terms',
      'Electronic signatures with verification',
      'Secure Stripe payment processing',
      'In-app notifications at every step',
    ],
  },
  {
    number: 6,
    title: 'Create Events & Build Reputation',
    description: 'Create events for your venue and build your reputation with reviews. Attract top talent with a strong venue profile.',
    items: [
      'Create and publish events',
      'Leave reviews for artists after performances',
      'Build your venue reputation',
      'Get verified for added credibility',
    ],
  },
];

const fanSteps: Step[] = [
  {
    number: 1,
    title: 'Create Your Account',
    description: 'Sign up for free and select "Fan" as your role. Your account is ready immediately to start discovering artists.',
    items: [
      'Sign up with email or social login',
      'Select the Fan role during onboarding',
      'No subscription required for fan features',
    ],
  },
  {
    number: 2,
    title: 'Discover & Follow Artists',
    description: 'Browse the artist directory to find performers you love. Follow them to stay updated on their latest shows and releases.',
    items: [
      'Browse artists by genre, location, and style',
      'Click "Follow" on any artist profile',
      'View all followed artists from "Following" in the nav',
      'Get email updates when artists post events or updates',
    ],
  },
  {
    number: 3,
    title: 'Buy & Download Music',
    description: 'Purchase releases directly from artist profiles. After payment, download your tracks instantly from the success page or My Purchases.',
    items: [
      'Click "Buy" on any release card',
      'Secure checkout through Stripe',
      'Download from the success page or My Purchases',
      'Up to 5 downloads per purchase',
    ],
  },
  {
    number: 4,
    title: 'Request Bookings',
    description: 'Want to book an artist for your private event, party, or gathering? Send a booking request directly from their profile.',
    items: [
      'Fill in event date, time, and venue details',
      'Set your offered fee',
      'Communicate with artists through messaging',
    ],
  },
  {
    number: 5,
    title: 'Support Artists with Tips',
    description: 'Show your appreciation by tipping artists directly through their preferred payment apps. Zero platform fees on tips.',
    items: [
      'Tip via Cash App, Venmo, PayPal, or Zelle',
      'Find tip links on artist profiles under "Support This Artist"',
      'Tips go 100% to the artist',
    ],
  },
  {
    number: 6,
    title: 'Leave Reviews & Stay Connected',
    description: 'Share your experience by leaving reviews. Stay connected through notifications about bookings, purchases, and artist updates.',
    items: [
      'Rate and review artists after events or purchases',
      'In-app notifications via the bell icon',
      'Email notifications for important updates',
      'Browse upcoming events in your area',
    ],
  },
];

function StepCard({ step, color }: { step: Step; color: string }) {
  const bgColor = color === 'purple' ? 'bg-purple-600' : color === 'blue' ? 'bg-blue-600' : 'bg-pink-600';
  const borderColor = color === 'purple' ? 'border-purple-600' : color === 'blue' ? 'border-blue-600' : 'border-pink-600';

  return (
    <div className={`bg-white rounded-lg shadow-md p-8 border-l-4 ${borderColor}`}>
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          <div className={`flex items-center justify-center h-12 w-12 rounded-md ${bgColor} text-white`}>
            <span className="text-xl font-bold">{step.number}</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
          <p className="text-gray-600 text-lg mb-4">{step.description}</p>
          <ul className="space-y-2 text-gray-600">
            {step.items.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState<'artists' | 'venues' | 'fans'>('artists');

  // Set SEO meta tags
  useEffect(() => {
    setMetaTags(pageMetaTags.howItWorks);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">How Ologywood Works</h1>
          <p className="text-xl text-purple-100">
            Connect talented artists with venues and fans. Simple, secure, and seamless.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-3 justify-center mb-12 flex-wrap">
          <button
            onClick={() => setActiveTab('artists')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'artists'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Music className="inline mr-2" size={20} />
            For Artists
          </button>
          <button
            onClick={() => setActiveTab('venues')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'venues'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Briefcase className="inline mr-2" size={20} />
            For Venues
          </button>
          <button
            onClick={() => setActiveTab('fans')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'fans'
                ? 'bg-pink-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Heart className="inline mr-2" size={20} />
            For Fans
          </button>
        </div>

        {/* Artists Section */}
        {activeTab === 'artists' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              Get Booked. Sell Music. Grow Your Career.
            </h2>

            {artistSteps.map((step) => (
              <StepCard key={step.number} step={step} color="purple" />
            ))}

            {/* Key Features */}
            <div className="mt-12 pt-12 border-t-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">Why Artists Love Ologywood</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-purple-50 p-6 rounded-lg">
                  <Star className="text-purple-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Increase Your Bookings</h4>
                  <p className="text-gray-600">Get discovered by venues looking for talent like you.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <DollarSign className="text-purple-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Multiple Revenue Streams</h4>
                  <p className="text-gray-600">Earn from bookings, music sales, and fan tips all in one place.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <CreditCard className="text-purple-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Secure Payments</h4>
                  <p className="text-gray-600">Get paid safely through Stripe with detailed earnings analytics.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <Bell className="text-purple-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Never Miss an Opportunity</h4>
                  <p className="text-gray-600">In-app and email notifications keep you updated on every booking and message.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Venues Section */}
        {activeTab === 'venues' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              Find & Book Amazing Talent
            </h2>

            {venueSteps.map((step) => (
              <StepCard key={step.number} step={step} color="blue" />
            ))}

            {/* Key Features */}
            <div className="mt-12 pt-12 border-t-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">Why Venues Love Ologywood</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <Users className="text-blue-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Diverse Talent Pool</h4>
                  <p className="text-gray-600">Access artists across every genre and style for any event.</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <MessageSquare className="text-blue-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Direct Communication</h4>
                  <p className="text-gray-600">Message artists directly to discuss every detail.</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <CreditCard className="text-blue-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Secure Contracts</h4>
                  <p className="text-gray-600">Digital contracts with e-signatures protect both parties.</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <CheckCircle className="text-blue-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Verified Artists</h4>
                  <p className="text-gray-600">Book with confidence using ratings and reviews.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fans Section */}
        {activeTab === 'fans' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              Discover. Support. Connect.
            </h2>

            {fanSteps.map((step) => (
              <StepCard key={step.number} step={step} color="pink" />
            ))}

            {/* Key Features */}
            <div className="mt-12 pt-12 border-t-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">Why Fans Love Ologywood</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-pink-50 p-6 rounded-lg">
                  <Music className="text-pink-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Discover New Artists</h4>
                  <p className="text-gray-600">Browse artists by genre, location, and style to find your next favorite performer.</p>
                </div>
                <div className="bg-pink-50 p-6 rounded-lg">
                  <Download className="text-pink-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Buy Music Directly</h4>
                  <p className="text-gray-600">Purchase and download releases directly from artists. 99% goes to the artist.</p>
                </div>
                <div className="bg-pink-50 p-6 rounded-lg">
                  <DollarSign className="text-pink-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Tip Your Favorites</h4>
                  <p className="text-gray-600">Support artists directly through Cash App, Venmo, PayPal, or Zelle.</p>
                </div>
                <div className="bg-pink-50 p-6 rounded-lg">
                  <Heart className="text-pink-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Stay Connected</h4>
                  <p className="text-gray-600">Follow artists, get updates on shows, and never miss a performance.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16 px-4 mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of artists, venues, and fans already using Ologywood.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/get-started"
              className="px-8 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition"
            >
              Sign Up Now
            </a>
            <a
              href="/browse"
              className="px-8 py-3 bg-purple-700 text-white font-bold rounded-lg hover:bg-purple-800 transition border border-white"
            >
              Browse Artists
            </a>
          </div>
        </div>
      </div>
      </div>
          <Footer />
    </div>
  );
}
