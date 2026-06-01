import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Set SEO meta tags
  useEffect(() => {
    setMetaTags(pageMetaTags.faq);
  }, []);

  const faqs = [
    // Getting Started
    { q: 'How do I book an artist?', a: 'Browse artists, select one, and click the booking button. Fill in the event date, time, venue address (street, city, state, zip), offered fee, and event details. The artist will review your request and respond via in-app notification and email.' },
    { q: 'How do I create an artist profile?', a: 'Sign up and select "Artist" during role selection. Complete your profile with a bio, genres, photos, and pricing. Add social links and tip links (Cash App, Venmo, etc.) from Edit Profile. Set your availability calendar and start receiving booking requests.' },
    { q: 'How do I create a venue profile?', a: 'Sign up and select "Venue" during role selection. Add your venue details, capacity, location, and the types of events you host. Start browsing and booking artists immediately.' },
    { q: 'What can I do as a fan?', a: 'Fans can follow artists to get updates, purchase and download music releases, leave reviews, and tip artists directly through Cash App, Venmo, PayPal, or Zelle. Access your purchases from the "Purchases" link in the navigation.' },
    
    // Booking & Payments
    { q: 'What payment methods are accepted?', a: 'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and digital wallets through secure Stripe payment processing.' },
    { q: 'Can I cancel a booking?', a: 'Yes, you can cancel through your dashboard. Both artists and venues receive notifications when a booking is cancelled. Cancellation policies vary by artist and are outlined in the booking contract.' },
    { q: 'How do artists set pricing?', a: 'Artists set their own pricing based on event type, duration, and location from their dashboard profile settings. Pricing appears on your public profile for venues to see.' },
    { q: 'Is there a booking fee?', a: 'Ologywood charges a small service fee on bookings to maintain the platform. The fee is transparently shown before you confirm.' },
    { q: 'How many bookings can I make on the Free plan?', a: 'Free plan users can send up to 2 booking requests per month. Upgrade to Starter ($9/month) or Professional ($29/month) for unlimited bookings.' },
    { q: 'How does the deposit payment work?', a: 'Booking payments are split into two stages. First, pay a 50% deposit to secure your booking. Then, pay the remaining 50% balance before the event. Both payments are processed securely through Stripe. You can manage payments from the My Bookings page, where each booking shows its current payment status: Deposit Paid, Paid in Full, or Refunded.' },
    { q: 'Where do I find My Bookings?', a: 'Click your name or email in the top navigation bar to open the user dropdown menu, then select "My Bookings." This page shows all your booking requests with status, payment badges, and action buttons for messaging the artist or making payments.' },
    
    // Riders & Contracts
    { q: 'What is a rider?', a: 'A rider is a document listing an artist\'s technical requirements (sound, lighting, stage specs) and hospitality needs. Artists can build riders using the Rider Builder tool in their Dashboard. Choose from structured templates or create custom ones. Available on Starter and Professional plans.' },
    { q: 'How do contracts and e-signatures work?', a: 'When a booking is confirmed, a digital contract is generated with all agreed terms. Both parties sign electronically with drawn or typed signatures, verified with IP logging and timestamps. Contracts are stored securely and accessible from your dashboard. Available on the Professional plan.' },
    
    // Music & Releases
    { q: 'How do I sell my music on Ologywood?', a: 'Go to your Artist Dashboard > Releases. Upload your track, add cover art, set your price, and publish. Fans can purchase and download directly from your profile. You keep 99% of each sale (1% platform fee).' },
    { q: 'How do I buy and download music?', a: 'Click "Buy" on any release card to open Stripe checkout. After payment, you land on a success page with a download button. You can also re-download from "My Purchases" in the user dropdown menu. Each purchase allows up to 5 downloads. A branded confirmation email with download instructions is also sent to your email.' },
    { q: 'Where do I find My Purchases?', a: 'Click your name or email in the top navigation bar to open the user dropdown menu, then select "My Purchases." This page lists all your purchased releases with cover art, artist name, purchase date, and download buttons. You can also access downloads from the confirmation email sent after each purchase.' },
    { q: 'My purchase page says "Processing" and won\'t load. What do I do?', a: 'Wait a few seconds for automatic verification. If it takes longer, click the "Verify Payment Now" button on the page. This confirms your payment directly with Stripe and unlocks your download. You will also receive a confirmation email with a link to My Purchases.' },
    
    // Tips & Support
    { q: 'How do tip links work?', a: 'Artists can add their Cash App, Venmo, PayPal, and Zelle handles in Edit Profile under "Support This Artist". These appear on the artist\'s public profile as branded badges. Fans click to tip directly. Tips go straight to the artist with zero platform fees.' },
    
    // Notifications
    { q: 'How do notifications work?', a: 'The bell icon in the navigation bar shows your in-app notifications with an unread count. You receive notifications for booking requests, confirmations, cancellations, messages, contract signings, reviews, and payments. Click any notification to go to the relevant page. Email notifications are also sent for important events.' },
    
    // Following & Fan Updates
    { q: 'How do I follow an artist?', a: 'Visit any artist\'s profile and click the "Follow" button. View all followed artists from "Following" in the navigation. You will receive email updates when artists post new events or update their profiles.' },
    { q: 'Can artists send updates to their followers?', a: 'Yes! Artists on paid plans can compose and send branded email updates to all their followers using the "Send Update" feature in the Fans section of their dashboard.' },
    
    // Events
    { q: 'How do events work?', a: 'Venues can create events from their Dashboard with date, time, location, and details. Events appear on the Events page where artists and fans can discover them, view details, and connect with organizers.' },
    
    // Earnings & Analytics
    { q: 'How do I view my earnings and analytics?', a: 'Artists can view earnings from Dashboard > Earnings & Payouts. See total earnings, completed payments, pending amounts, and payouts. The Release Sales section shows per-release analytics including sales count, gross revenue, net revenue, and platform fees.' },
    
    // Subscription & Pricing
    { q: 'What subscription plans are available?', a: 'We offer three plans: Free (2 bookings/month, basic features), Starter ($9/month, unlimited bookings, Rider Builder, fan updates), and Professional ($29/month, contracts, e-signatures, analytics, priority support). Visit our Pricing page for full details.' },
    { q: 'Can I change my plan?', a: 'Yes! Upgrade or downgrade anytime from your Dashboard. Changes take effect immediately. Upgrades are prorated; downgrades apply at the next billing cycle.' },
    
    // Disputes & Payment Protection
    { q: 'What is a dispute and how do I file one?', a: 'If you have a payment issue with a booking — such as a no-show, unauthorized charge, or service not delivered — you can file a dispute directly with your bank or card issuer. Stripe, our payment processor, handles the entire chargeback and dispute process in accordance with card network rules (Visa, Mastercard, etc.). You can also report issues through the booking details page to flag concerns to the other party.' },
    { q: 'How long does it take to resolve a dispute?', a: 'Payment disputes and chargebacks are managed by Stripe and follow card network timelines, which typically take 60-90 days for a final resolution. Stripe will notify the relevant parties throughout the process. For non-payment issues (e.g., communication problems or scheduling conflicts), use the Report Issue feature on the booking page to flag concerns directly.' },
    { q: 'How are chargebacks and payment disputes handled?', a: 'All payment disputes and chargebacks are handled directly by Stripe, our payment processor. Stripe manages the entire dispute lifecycle — from evidence collection to resolution — in accordance with card network rules (Visa, Mastercard, etc.). If a chargeback is filed against a transaction, Stripe will notify the relevant parties and manage the process. Ologywood does not hold or control funds during disputes. For questions about an active chargeback, visit your Stripe Dashboard or contact Stripe support directly.' },
    { q: 'Am I protected as a buyer on Ologywood?', a: 'Yes. All payments are processed through Stripe, which provides industry-standard buyer protection. If you experience an issue with a payment (unauthorized charge, service not delivered, etc.), you can file a dispute directly with your bank or card issuer. Stripe will handle the chargeback process on your behalf, including evidence review and resolution per card network rules.' },
    
    // Reviews
    { q: 'How do reviews work?', a: 'After a completed booking, both artists and venues can leave reviews for each other. Reviews include a star rating and written feedback. Reviews are visible on public profiles and help build trust across the platform. Fans can also leave reviews on purchased music releases.' },
    
    // Roles
    { q: 'What roles are available on Ologywood?', a: 'Ologywood has several roles: Artist (performers who get booked and sell music), Venue (event organizers who book talent), User/Client (fans who browse, follow, book artists for private events, and purchase music), and Blogger (content creators who write blog posts for the platform). Admins manage the platform. You can request a role change by contacting support.' },
    
    // Merch & Shop
    { q: 'How does the Merch/Shop feature work?', a: 'Artists and venues on Starter or Professional plans can showcase products on their public profiles. Artists see it as "Merch" and venues as "Shop & Offers." Add items with a title, price, images (up to 2 per item, max 2MB), and an external purchase link to your own store. Fans click "Buy" and are taken directly to your store. You keep 100% of revenue — Ologywood takes zero commission on merch sales. Starter plans allow up to 6 items; Professional plans allow up to 15.' },
    
    // Project Previews
    { q: 'What are Project Previews and how do I use them?', a: 'Project Previews let artists on Starter or Professional plans showcase upcoming albums, EPs, and mixtapes with audio snippets on their public profile. Go to Dashboard → Projects to create a project, upload cover art, add tracks, and upload audio snippets. Starter allows 1 project (6 tracks, 30s snippets); Professional allows 3 projects (12 tracks, 60s snippets). Fans can listen to previews and share your project on social media.' },
    
    // Stripe & Webhooks
    { q: 'I got an email from Stripe about a failing webhook. What do I do?', a: 'This happens when a temporary development URL expires. Go to Stripe Dashboard → Developers → Webhooks, delete the old endpoint, and add a new one with your production URL (https://ologywood.com/api/stripe/webhook). Note: the current active webhook is https://ologywood-mp6flm6c.manus.space/api/stripe/webhook. Copy the new Signing Secret and update it in Settings → Payment. This does not affect existing payments.' },
    { q: 'How do I set up Stripe for production?', a: 'Complete Stripe KYC verification, then enter your live API keys in Settings → Payment. Add a production webhook endpoint in Stripe Dashboard → Developers → Webhooks pointing to https://ologywood.com/api/stripe/webhook (current active: https://ologywood-mp6flm6c.manus.space/api/stripe/webhook). Update the webhook signing secret in Settings → Payment. Test with card 4242 4242 4242 4242 before going live.' },
    
    // Support
    { q: 'How do I contact support?', a: 'Email support@ologywood.com, use the Contact Us page, or the chat widget in the bottom-right corner. Our team is available Monday through Friday, 9 AM to 6 PM EST, and typically responds within 24 hours.' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-600 mb-8">Find answers to common questions about Ologywood.</p>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-lg shadow">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <h3 className="font-semibold text-gray-900 text-left">{faq.q}</h3>
                  <ChevronDown className={`w-5 h-5 text-gray-600 flex-shrink-0 ml-4 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
                </button>
                {openIndex === i && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-indigo-50 rounded-lg border border-indigo-200">
            <h3 className="font-semibold text-gray-900 mb-2">Still have questions?</h3>
            <p className="text-gray-600 text-sm mb-3">Our team is here to help Monday through Friday, 9 AM to 6 PM EST.</p>
            <a href="/contact" className="text-indigo-600 hover:text-indigo-700 font-semibold">Contact us &rarr;</a>
          </div>
        </div>
      </div>

    </div>
  );
}
