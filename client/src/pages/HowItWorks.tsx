import React, { useState, useEffect } from 'react';
import { Music, Briefcase, Heart, CheckCircle, MessageSquare, CreditCard, Star, Bell, DollarSign, Download, Users, Shield, Award, BarChart3, Calendar, Gift, Ticket, FileText, Lock } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';

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
    description: 'Sign up and build your talent profile with your bio, genres or specialties, photos, and pricing. Choose your type: Artist, Athlete, Creator, DJ, Band, Comedian, Actor, Influencer, or Speaker.',
    items: [
      'Upload professional photos and videos',
      'List your genres, skills, or performance style',
      'Set your booking rates',
      'Add social links (Instagram, Spotify, etc.)',
      'Get a verification badge for added credibility',
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
    description: 'Venues and fans discover your profile and send booking requests. Review event details, venue information, and requirements.',
    items: [
      'In-app and email notifications for new requests',
      'See full event details and venue info',
      'Review technical requirements',
      'Track all bookings from your dashboard',
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
    title: 'Sign Contracts & Get Paid',
    description: 'Sign digital contracts with e-signatures and receive payment securely through Stripe. All disputes and chargebacks are handled by Stripe.',
    items: [
      'Legally binding digital contracts',
      'Electronic signatures with verification certificates',
      'Secure Stripe payment processing',
      'Stripe handles all disputes and chargebacks',
      'View earnings and payment history in your Dashboard',
    ],
  },
  {
    number: 7,
    title: 'Sell Music & Create Events',
    description: 'Upload and sell your music directly to fans. Create events, sell tickets, and grow your audience all from one platform.',
    items: [
      'Upload releases with cover art and pricing',
      'Keep 99% of each music sale',
      'Create and publish events with ticketing',
      'Track sales and event analytics in real-time',
    ],
  },
  {
    number: 8,
    title: 'Launch Your Fan Club',
    description: 'Create membership tiers for your most dedicated fans. Offer exclusive content, early access, and VIP perks — all with recurring revenue.',
    items: [
      'Create custom membership tiers with monthly pricing',
      'Post exclusive members-only content',
      'Fans subscribe via Stripe (you keep 85%, platform takes 15%)',
      'Track member count and earnings from your dashboard',
      'Build a loyal community that supports you monthly',
    ],
  },
  {
    number: 9,
    title: 'Promote Your Brand',
    description: 'Use the AI Ad Assistant to generate professional ad copy and targeting suggestions for your events, releases, or profile. Or submit a Boost request for hands-off promotion.',
    items: [
      'AI generates platform-specific ad copy (Instagram, Facebook, TikTok, YouTube, X)',
      'Get hashtag suggestions and audience targeting recommendations',
      'Budget calculator estimates reach based on your spend',
      'Submit a "Boost My Event" request for managed promotion',
    ],
  },
  {
    number: 10,
    title: 'Grow Your Fan Base',
    description: 'Build a following on Ologywood. Fans can follow you, tip you, and buy your music. Refer friends and earn credits.',
    items: [
      'Fans can follow your profile',
      'Set up tip links (Cash App, Venmo, PayPal, Zelle)',
      'Send branded email updates to followers',
      'Receive reviews and ratings from fans and venues',
      'Earn $5 credit for every friend you refer',
    ],
  },
  {
    number: 11,
    title: 'Track Your Analytics',
    description: 'Monitor your growth with a comprehensive analytics dashboard. Track bookings, earnings, fan engagement, and music sales.',
    items: [
      'Booking conversion rates and trends',
      'Earnings breakdown by source (bookings, music, Fan Club, tips)',
      'Fan growth and engagement metrics',
      'Music sales and download analytics',
    ],
  },
];

const venueSteps: Step[] = [
  {
    number: 1,
    title: 'Create Your Venue Profile',
    description: 'Set up your venue profile with details about your space, capacity, and the types of events you host. Get verified for credibility.',
    items: [
      'Add venue photos and details',
      'Describe your space and capacity',
      'List event types you host',
      'Get a verification badge for added trust',
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
      'See verification badges and ratings',
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
    description: 'Sign digital contracts with e-signatures and process payments securely through Stripe. Pay a 50% deposit to confirm, then the remaining balance before the event.',
    items: [
      'Digital contracts with all agreed terms',
      'Electronic signatures with verification certificates',
      'Pay 50% deposit to secure the booking',
      'Pay remaining balance before the event',
      'Track payment status from My Bookings',
      'Stripe handles all disputes and chargebacks',
    ],
  },
  {
    number: 6,
    title: 'Create Events & Sell Tickets',
    description: 'Create events for your venue, sell tickets directly to fans, and manage your event calendar all in one place.',
    items: [
      'Create and publish events with ticketing',
      'Set ticket prices and capacity limits',
      'Promote events to the Ologywood community',
      'Track ticket sales and attendance',
    ],
  },
  {
    number: 7,
    title: 'Build Reputation & Refer Friends',
    description: 'Build your venue reputation with reviews. Refer other venues and artists to earn referral credits toward your subscription.',
    items: [
      'Leave reviews for artists after performances',
      'Build your venue reputation with ratings',
      'Earn $5 credit for every friend you refer',
      'Use credits toward your subscription plan',
    ],
  },
];

const fanSteps: Step[] = [
  {
    number: 1,
    title: 'Create Your Account',
    description: 'Sign up for free and select "Fan" as your role. Your account is ready immediately to start discovering artists, athletes, and creators.',
    items: [
      'Sign up with email or social login',
      'Select the Fan role during onboarding',
      'No subscription required for fan features',
    ],
  },
  {
    number: 2,
    title: 'Discover & Follow Talent',
    description: 'Browse the directory to find artists, athletes, and creators you love. Follow them to stay updated on their latest shows and releases.',
    items: [
      'Browse talent by genre, sport, location, and style',
      'Click "Follow" on any profile',
      'View all followed talent from "Following" in the nav',
      'Get email updates when they post events or updates',
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
      'Branded confirmation email with download instructions',
    ],
  },
  {
    number: 4,
    title: 'Book Artists & Attend Events',
    description: 'Book an artist for your private event, party, or gathering. Browse upcoming events and purchase tickets directly on the platform.',
    items: [
      'Fill in event date, time, and venue details',
      'Set your offered fee and communicate with artists',
      'Pay a 50% deposit to secure your booking',
      'Pay the remaining 50% balance before the event',
      'Browse and buy tickets to upcoming events',
    ],
  },
  {
    number: 5,
    title: 'Join Fan Clubs',
    description: 'Subscribe to your favorite talent\'s Fan Club for exclusive content, early access, and VIP perks. Support them with a monthly membership.',
    items: [
      'Browse available membership tiers on any talent profile',
      'Subscribe monthly for exclusive members-only content',
      'Cancel anytime — no long-term commitment',
      'Get a membership badge on your profile',
    ],
  },
  {
    number: 6,
    title: 'Support with Tips',
    description: 'Show your appreciation by tipping talent directly through their preferred payment apps. Zero platform fees on tips.',
    items: [
      'Tip via Cash App, Venmo, PayPal, or Zelle',
      'Find tip links on profiles under "Support This Artist"',
      'Tips go 100% to the talent',
    ],
  },
  {
    number: 7,
    title: 'Leave Reviews & Refer Friends',
    description: 'Share your experience by leaving reviews. Refer friends to earn credits and get them 50% off their first month.',
    items: [
      'Rate and review talent after events or purchases',
      'Share your unique referral link with friends',
      'Earn $5 credit for every friend who signs up',
      'Referred friends get 50% off their first month',
      'Credits are redeemable at checkout',
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
            Connect talented artists, athletes, and creators with venues and fans. Simple, secure, and seamless.
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
              Get Booked. Build Your Fan Club. Grow Your Career.
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
                  <p className="text-gray-600">Earn from bookings, music sales, event tickets, and fan tips all in one place.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <Shield className="text-purple-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Protected Payments</h4>
                  <p className="text-gray-600">Stripe handles all payments, disputes, and chargebacks — you focus on performing.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <BarChart3 className="text-purple-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Analytics Dashboard</h4>
                  <p className="text-gray-600">Track bookings, earnings, fan growth, and music sales with real-time analytics.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <FileText className="text-purple-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Digital Contracts</h4>
                  <p className="text-gray-600">Legally binding contracts with e-signatures and verification certificates.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <Gift className="text-purple-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Referral Rewards</h4>
                  <p className="text-gray-600">Earn $5 credit for every friend you refer. Credits apply at checkout.</p>
                </div>
              </div>
            </div>

            {/* Subscription Plans */}
            <div className="mt-12 pt-12 border-t-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Choose Your Plan</h3>
              <p className="text-gray-600 text-center mb-8">Start free, upgrade when you're ready.</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-900 text-lg mb-2">Free</h4>
                  <p className="text-3xl font-bold text-gray-900 mb-4">$0<span className="text-sm font-normal text-gray-500">/mo</span></p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Artist or venue profile</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Browse artists & venues</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> In-platform messaging</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Availability calendar</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> AI Ad Assistant & Promote</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> 2 booking requests/month</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-600">
                  <span className="text-xs font-semibold bg-purple-600 text-white px-2 py-0.5 rounded-full">Most Popular</span>
                  <h4 className="font-bold text-purple-700 text-lg mb-2 mt-2">Starter</h4>
                  <p className="text-3xl font-bold text-gray-900 mb-4">$9<span className="text-sm font-normal text-gray-500">/mo</span></p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Everything in Free</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Unlimited booking requests</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Rider Builder & templates</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Fan email list & Send Update</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> AI Ad Assistant & Promote</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> 2 White Label singles</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-800">
                  <h4 className="font-bold text-purple-800 text-lg mb-2">Professional</h4>
                  <p className="text-3xl font-bold text-gray-900 mb-4">$29<span className="text-sm font-normal text-gray-500">/mo</span></p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Everything in Starter</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Contracts & e-signatures</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Advanced analytics</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Unlimited releases</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> AI Ad Assistant & Promote</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Priority support</li>
                  </ul>
                </div>
                <div className="bg-indigo-50 p-6 rounded-lg border-2 border-indigo-600">
                  <span className="text-xs font-semibold bg-indigo-600 text-white px-2 py-0.5 rounded-full">New</span>
                  <h4 className="font-bold text-indigo-700 text-lg mb-2 mt-2">Enterprise</h4>
                  <p className="text-3xl font-bold text-gray-900 mb-4">$79<span className="text-sm font-normal text-gray-500">/mo</span></p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Everything in Professional</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Sponsor Showcase (5 slots)</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Sponsor Analytics & CTR</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Auto-generated Media Kit</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> AI Ad Assistant & Promote</li>
                    <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Branded event pages</li>
                  </ul>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">Save 17% with yearly billing. Use referral credits at checkout for additional savings.</p>
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
                  <FileText className="text-blue-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Digital Contracts</h4>
                  <p className="text-gray-600">Legally binding contracts with e-signatures and verification certificates protect both parties.</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <Shield className="text-blue-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Payment Protection</h4>
                  <p className="text-gray-600">Stripe handles all payments and disputes. No funds are held by Ologywood.</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <Ticket className="text-blue-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Event Ticketing</h4>
                  <p className="text-gray-600">Create events, sell tickets, and manage your event calendar in one place.</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <Award className="text-blue-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Verified Artists</h4>
                  <p className="text-gray-600">Book with confidence using verification badges, ratings, and reviews.</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <Gift className="text-blue-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Referral Rewards</h4>
                  <p className="text-gray-600">Earn $5 credit for every friend you refer. Use credits toward your subscription.</p>
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
                  <Ticket className="text-pink-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Events & Tickets</h4>
                  <p className="text-gray-600">Browse upcoming events and buy tickets directly on the platform.</p>
                </div>
                <div className="bg-pink-50 p-6 rounded-lg">
                  <DollarSign className="text-pink-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Tip Your Favorites</h4>
                  <p className="text-gray-600">Support artists directly through Cash App, Venmo, PayPal, or Zelle.</p>
                </div>
                <div className="bg-pink-50 p-6 rounded-lg">
                  <Gift className="text-pink-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Refer & Earn</h4>
                  <p className="text-gray-600">Share your referral link. Friends get 50% off, you earn $5 credit.</p>
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

      {/* Trust & Safety Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-8 border border-slate-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Platform Trust & Safety</h3>
          <p className="text-gray-600 text-center mb-8">
            Ologywood is built on trust. Here's how we keep everyone safe.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Lock className="text-blue-600" size={32} />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Secure Payments</h4>
              <p className="text-sm text-gray-600">All payments processed by Stripe with bank-level encryption. We never store card details.</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Shield className="text-blue-600" size={32} />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Dispute Protection</h4>
              <p className="text-sm text-gray-600">All disputes and chargebacks are handled directly by Stripe in accordance with card network rules.</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Award className="text-blue-600" size={32} />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Verified Users</h4>
              <p className="text-sm text-gray-600">Verification badges, ratings, and reviews help you book with confidence.</p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Digital Contracts</h4>
                <p className="text-sm text-gray-600">Every booking is backed by a legally binding digital contract with electronic signatures and verification certificates. Both parties are protected.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Referral Credits</h4>
                <p className="text-sm text-gray-600">Earn $5 for every friend you refer. Credits are valid for 90 days and can be redeemed at checkout toward your subscription.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16 px-4 mt-8">
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
            <a
              href="/pricing"
              className="px-8 py-3 bg-transparent text-white font-bold rounded-lg hover:bg-purple-700 transition border border-white"
            >
              View Plans
            </a>
          </div>
        </div>
      </div>
      </div>

    </div>
  );
}
