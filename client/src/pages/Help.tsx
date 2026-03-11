import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, Mail, MessageCircle, Phone } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';
import Footer from '@/components/Footer';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  // Getting Started
  {
    id: 'getting-started-1',
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer: 'Click the "Sign Up" button on the homepage. You can sign up with your email or use Google/social login. After verifying your email, choose your role: Artist, Venue, or Fan. Each role unlocks different features tailored to your needs.',
  },
  {
    id: 'getting-started-2',
    category: 'Getting Started',
    question: 'What are the different account types?',
    answer: 'Ologywood has three account types. Artist accounts are for performers and musicians who want to get booked, sell music, and grow their fanbase. Venue accounts are for event organizers and clubs looking to book talent. Fan accounts let you follow artists, buy releases, leave reviews, and tip your favorite performers.',
  },
  {
    id: 'getting-started-3',
    category: 'Getting Started',
    question: 'Is there a fee to join Ologywood?',
    answer: 'Joining is free! The Free tier includes basic features and up to 2 bookings per month. Premium subscriptions (Starter at $9/month and Professional at $29/month) unlock advanced features like unlimited bookings, Rider Builder, contracts, e-signatures, analytics, and more.',
  },
  {
    id: 'getting-started-4',
    category: 'Getting Started',
    question: 'How do I set up my artist profile?',
    answer: 'After selecting the Artist role, complete the onboarding form with your bio, genres, location, and pricing. Upload a professional profile photo. Then visit Edit Profile from your Dashboard to add social links, tip links (Cash App, Venmo, etc.), and media. Set your availability calendar so venues can see when you are free.',
  },

  // Booking & Contracts
  {
    id: 'booking-1',
    category: 'Booking & Contracts',
    question: 'How do I book an artist?',
    answer: 'Browse the artist directory, view profiles and availability, and click the booking button. Fill in the event date, time, venue address (street, city, state, zip), offered fee, and event details. The artist will review your request and respond. Once accepted, a digital contract can be generated for both parties to sign.',
  },
  {
    id: 'booking-2',
    category: 'Booking & Contracts',
    question: 'What happens after I send a booking request?',
    answer: 'The artist receives an in-app notification and email about your request. They can accept, decline, or message you to discuss details. Once accepted, you can attach a rider contract with technical requirements. Both parties sign electronically, and the booking is confirmed.',
  },
  {
    id: 'booking-3',
    category: 'Booking & Contracts',
    question: 'Can I modify a booking after it\'s confirmed?',
    answer: 'Yes, you can request modifications to date, time, or terms through the booking detail page. The other party will review and approve or counter-propose. Changes require mutual agreement. You can also cancel a booking from your dashboard.',
  },
  {
    id: 'booking-4',
    category: 'Booking & Contracts',
    question: 'What is a rider and how do I create one?',
    answer: 'A rider is a document listing technical requirements (sound, lighting, stage specs), hospitality needs, and special requests. Artists can build rider templates using the Rider Builder in their Dashboard. Choose from structured templates or create custom ones. When a booking is confirmed, attach your rider so the venue knows exactly what you need. Available on Starter and Professional plans.',
  },
  {
    id: 'booking-5',
    category: 'Booking & Contracts',
    question: 'How do contracts and e-signatures work?',
    answer: 'When a booking is confirmed, a digital contract is generated with all agreed terms including event details, fees, and rider requirements. Both the artist and venue sign electronically with drawn or typed signatures. Signatures are verified with IP logging and timestamps. Contracts are stored securely and accessible from your dashboard. Available on the Professional plan.',
  },

  // Payments & Billing
  {
    id: 'payment-1',
    category: 'Payments & Billing',
    question: 'How are payments handled?',
    answer: 'We use Stripe for secure payment processing. Artists can connect their Stripe account from the Earnings & Payouts page in their Dashboard to receive payments directly. All transactions are encrypted and secure.',
  },
  {
    id: 'payment-2',
    category: 'Payments & Billing',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and digital wallets through Stripe. Payments are processed securely.',
  },
  {
    id: 'payment-3',
    category: 'Payments & Billing',
    question: 'Can I get a refund?',
    answer: 'Refund policies depend on when the cancellation occurs. Cancellations 30+ days before the event typically receive full refunds. Cancellations within 30 days may have reduced refunds. Check your booking terms for specifics.',
  },
  {
    id: 'payment-4',
    category: 'Payments & Billing',
    question: 'How do I view my earnings and sales analytics?',
    answer: 'Artists can view their earnings from Dashboard > Earnings & Payouts. This page shows total earnings, completed payments, pending amounts, and paid out totals. It also includes Release Sales Analytics with per-release breakdowns showing sales count, gross revenue, net revenue (after 1% platform fee), and release status.',
  },
  {
    id: 'payment-5',
    category: 'Payments & Billing',
    question: 'How does the deposit payment work for bookings?',
    answer: 'When you book an artist, you can pay in two stages. First, pay a 50% deposit to secure the booking. The artist is notified and the booking status updates to "Deposit Paid." Before the event, you can pay the remaining 50% balance. Once both payments are complete, the booking status updates to "Paid in Full." You can manage all payments from the My Bookings page by clicking the "Pay Deposit" or "Pay Remaining Balance" buttons.',
  },
  {
    id: 'payment-6',
    category: 'Payments & Billing',
    question: 'Where can I see my booking payment status?',
    answer: 'Go to My Bookings from the user dropdown menu in the navigation bar. Each booking card shows a payment status badge: "Deposit Paid" (50% paid), "Paid in Full" (100% paid), or "Refunded" if applicable. You can also pay outstanding balances directly from this page.',
  },

  // Music & Releases
  {
    id: 'music-1',
    category: 'Music & Releases',
    question: 'How do I sell my music on Ologywood?',
    answer: 'Go to your Artist Dashboard and navigate to the Releases section. Upload your track, add cover art, set your price, and publish. Fans can purchase and download your music directly from your artist profile. You keep 99% of each sale (1% platform fee).',
  },
  {
    id: 'music-2',
    category: 'Music & Releases',
    question: 'How do fans purchase and download releases?',
    answer: 'Fans click the "Buy" button on a release card, which opens a secure Stripe checkout. After payment, they are redirected to a Purchase Success page with a download button. Fans can also re-download from the "My Purchases" page (accessible from the user dropdown menu in the navigation bar). Each purchase allows up to 5 downloads. A branded confirmation email with download instructions is also sent to the buyer.',
  },
  {
    id: 'music-3',
    category: 'Music & Releases',
    question: 'Where can I see my purchased music?',
    answer: 'Click your name or email in the top navigation bar to open the user dropdown menu, then select "My Purchases." This page shows all your purchased releases with cover art, artist name, purchase date, and a download button. You can also access the download link from the confirmation email sent after each purchase.',
  },
  {
    id: 'music-4',
    category: 'Music & Releases',
    question: 'I completed a purchase but the page is stuck on "Processing." What should I do?',
    answer: 'If the Purchase Success page shows "Processing your purchase," wait a few seconds for automatic verification. If it takes longer, click the "Verify Payment Now" button. The system will confirm your payment directly with Stripe and unlock your download. You will also receive a confirmation email with a link to My Purchases where you can download your track anytime.',
  },
  {
    id: 'music-5',
    category: 'Music & Releases',
    question: 'How many times can I download a purchased release?',
    answer: 'Each purchase allows up to 5 downloads. You can download from the Purchase Success page immediately after buying, or return to My Purchases anytime to download again. The remaining download count is shown on each purchase card.',
  },

  // Tips & Support Artists
  {
    id: 'tips-1',
    category: 'Tips & Support',
    question: 'How do tip links work?',
    answer: 'Artists can add their Cash App, Venmo, PayPal, and Zelle handles in Edit Profile under the "Support This Artist" section. These appear on the artist\'s public profile as subtle branded badges. Fans can click to tip directly through their preferred payment app. Tips go directly to the artist with zero platform fees.',
  },
  {
    id: 'tips-2',
    category: 'Tips & Support',
    question: 'How do I set up my tip links as an artist?',
    answer: 'Go to Dashboard > Edit Profile and scroll to the "Support This Artist" card. Enter your username or handle for Cash App, Venmo, PayPal, and/or Zelle. Click Save. Your tip links will appear on your public profile for fans to use.',
  },
  {
    id: 'tips-3',
    category: 'Tips & Support',
    question: 'Does Ologywood take a cut from tips?',
    answer: 'No. Tips go directly from the fan to the artist through their chosen payment app (Cash App, Venmo, PayPal, or Zelle). Ologywood does not process or take any fees from tips.',
  },

  // Notifications
  {
    id: 'notifications-1',
    category: 'Notifications',
    question: 'How do notifications work?',
    answer: 'Ologywood has both in-app and email notifications. The bell icon in the navigation bar shows your in-app notifications with an unread count badge. You receive notifications for new booking requests, booking confirmations and cancellations, new messages, contract signings, reviews, and payment events. Click any notification to go directly to the relevant page.',
  },
  {
    id: 'notifications-2',
    category: 'Notifications',
    question: 'How do I manage my notifications?',
    answer: 'Click the bell icon in the top navigation to see your notifications. You can mark individual notifications as read, mark all as read, or delete them. Email notifications are sent automatically for important events like booking requests and payment confirmations.',
  },

  // Following & Fans
  {
    id: 'fans-1',
    category: 'Following & Fans',
    question: 'How do I follow an artist?',
    answer: 'Visit any artist\'s profile page and click the "Follow" button. View all artists you follow from the "Following" link in the navigation bar. You will receive email updates when artists you follow post new events or update their profiles.',
  },
  {
    id: 'fans-2',
    category: 'Following & Fans',
    question: 'What is the Send Update feature?',
    answer: 'Artists on paid plans can compose and send branded email updates to all their followers. Go to your Artist Dashboard, find the Fans section, and click "Send Update" to compose a message with a subject and body. This is a great way to announce upcoming shows, new releases, or special news.',
  },
  {
    id: 'fans-3',
    category: 'Following & Fans',
    question: 'How do I leave a review for an artist?',
    answer: 'After attending a performance or purchasing a release, visit the artist\'s profile and scroll to the Reviews section. Click "Write a Review" to rate the artist and share your experience. Reviews help other fans and venues make informed booking decisions.',
  },

  // Profile & Settings
  {
    id: 'profile-1',
    category: 'Profile & Settings',
    question: 'How do I upload photos to my profile?',
    answer: 'Go to Dashboard > Edit Profile > Media Gallery. Click "Add Photos" to upload images. We automatically optimize images for performance. Your profile photo appears on browse cards, search results, and your public profile.',
  },
  {
    id: 'profile-2',
    category: 'Profile & Settings',
    question: 'How do I manage my availability?',
    answer: 'Artists can set their availability calendar in Dashboard > Availability. Mark dates when you are available to perform and block out unavailable dates. Venues will see your availability when browsing your profile, preventing scheduling conflicts.',
  },
  {
    id: 'profile-3',
    category: 'Profile & Settings',
    question: 'Can I change my subscription plan?',
    answer: 'Yes, you can upgrade or downgrade your subscription tiers anytime from your Dashboard or Account Settings. Changes take effect immediately. Upgrades are prorated; downgrades apply at the next billing cycle. Visit the Pricing page to compare plans.',
  },
  {
    id: 'profile-4',
    category: 'Profile & Settings',
    question: 'How do I add social media links to my profile?',
    answer: 'Go to Dashboard > Edit Profile and scroll to the Social Links section. Add your Instagram, Twitter/X, Facebook, YouTube, Spotify, SoundCloud, TikTok, or website URL. These appear as clickable icons on your public artist profile.',
  },

  // Events
  {
    id: 'events-1',
    category: 'Events',
    question: 'How do events work on Ologywood?',
    answer: 'Venues can create events from their Dashboard with details like date, time, location, description, and ticket info. Events appear on the Events page where artists and fans can discover them. Browse upcoming events, view details, and connect with organizers directly through the platform.',
  },
  {
    id: 'events-2',
    category: 'Events',
    question: 'How do I create an event as a venue?',
    answer: 'Go to your Venue Dashboard and click "Create Event". Fill in the event name, date, time, description, and any ticket information. Once published, your event will be visible on the Events page and discoverable by artists and fans.',
  },

  // Support & Contact
  {
    id: 'support-1',
    category: 'Support & Contact',
    question: 'How do I contact support?',
    answer: 'Use the Contact Us form, email support@ologywood.com, or use the chat widget in the bottom-right corner of any page. We typically respond within 24 hours.',
  },
  {
    id: 'support-2',
    category: 'Support & Contact',
    question: 'What are your support hours?',
    answer: 'Our support team is available Monday through Friday, 9 AM to 6 PM EST. For urgent issues, use the in-app chat for faster response.',
  },
  {
    id: 'support-3',
    category: 'Support & Contact',
    question: 'How do I report a problem or issue?',
    answer: 'Contact support@ologywood.com with details about what happened, including screenshots if possible. You can also use the Contact Us page or the chat widget. We will investigate and respond within 24 hours.',
  },
];

export default function Help() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Set SEO meta tags
  useEffect(() => {
    setMetaTags(pageMetaTags.help);
  }, []);

  const categories = ['All', ...new Set(faqItems.map(item => item.category))];
  
  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-purple-100 text-lg">Find answers to common questions about Ologywood</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Items */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        {filteredFAQs.length > 0 ? (
          <div className="space-y-3">
            {filteredFAQs.map(item => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="w-full px-6 py-4 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.question}</h3>
                    <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`text-purple-600 flex-shrink-0 ml-4 transition-transform ${
                      expandedId === item.id ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedId === item.id && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No results found. Try a different search term.</p>
          </div>
        )}
      </div>

      {/* Contact Support Section */}
      <div className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Still need help?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Email */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <Mail className="text-purple-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 mb-4">support@ologywood.com</p>
              <p className="text-sm text-gray-500">Response time: 24 hours</p>
            </div>

            {/* Chat */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <MessageCircle className="text-purple-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4">Available in your dashboard</p>
              <p className="text-sm text-gray-500">Mon-Fri, 9 AM - 6 PM EST</p>
            </div>

            {/* Phone */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <Phone className="text-purple-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Phone Support</h3>
              <p className="text-gray-600 mb-4">+1 (678) 525-0891</p>
              <p className="text-sm text-gray-500">Mon-Fri, 9 AM - 6 PM EST</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h2>
          <p className="text-purple-100 mb-6">Send us a message and our support team will get back to you shortly.</p>
          <a
            href="/contact"
            className="inline-block bg-white text-purple-600 font-semibold px-8 py-3 rounded-lg hover:bg-purple-50 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
      </div>
          <Footer />
    </div>
  );
}
