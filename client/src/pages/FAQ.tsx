import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';
import Footer from '@/components/Footer';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Set SEO meta tags
  useEffect(() => {
    setMetaTags(pageMetaTags.faq);
  }, []);

  const faqs = [
    // Getting Started
    { q: 'How do I book an artist?', a: 'Browse artists, select one, and create a booking request with your event details. Communicate directly through in-platform messaging to finalize the arrangement.' },
    { q: 'How do I create an artist profile?', a: 'Sign up and select "I\'m an Artist" during onboarding. Complete your profile with a bio, genres, photos, and pricing. Set your availability calendar and start receiving booking requests.' },
    { q: 'How do I create a venue profile?', a: 'Sign up and select "I\'m a Venue" during onboarding. Add your venue details, capacity, location, and the types of events you host.' },
    
    // Booking & Payments
    { q: 'What payment methods are accepted?', a: 'We accept all major credit cards (Visa, Mastercard, American Express) through secure Stripe payment processing.' },
    { q: 'Can I cancel a booking?', a: 'Yes, you can cancel through your dashboard. Cancellation policies vary by artist and are outlined in the booking contract.' },
    { q: 'How do artists set pricing?', a: 'Artists set their own pricing based on event type, duration, and location from their dashboard profile settings.' },
    { q: 'Is there a booking fee?', a: 'Ologywood charges a small service fee on bookings to maintain the platform. The fee is transparently shown before you confirm.' },
    { q: 'How many bookings can I make on the Free plan?', a: 'Free plan users can send up to 2 booking requests per month. Upgrade to Starter ($9/month) or Professional ($29/month) for unlimited bookings.' },
    
    // Riders & Contracts
    { q: 'What is a rider?', a: 'A rider is a document listing an artist\'s technical requirements (sound, lighting, stage specs) and hospitality needs. Artists can build riders using the Rider Builder tool, available on Starter and Professional plans.' },
    { q: 'How do contracts and e-signatures work?', a: 'When a booking is confirmed, a digital contract is generated. Both the artist and venue sign electronically through the platform. Contracts are stored securely and accessible from your dashboard. Available on the Professional plan.' },
    
    // Following & Fan Updates
    { q: 'How do I follow an artist?', a: 'Visit any artist\'s profile and click the "Follow" button. Access all your followed artists from the "Following" link in the navigation bar.' },
    { q: 'Can artists send updates to their followers?', a: 'Yes! Artists on paid plans can compose and send branded email updates to all their followers using the "Send Update" feature in the Fans section of their dashboard.' },
    
    // Events
    { q: 'How do events work?', a: 'Venues can create events and artists can discover them through the Events page. Browse upcoming events, view details, and connect with organizers directly.' },
    
    // Subscription & Pricing
    { q: 'What subscription plans are available?', a: 'We offer three plans: Free (basic features, 2 bookings/month), Starter ($9/month, unlimited bookings, Rider Builder, fan updates), and Professional ($29/month, contracts, e-signatures, analytics, priority support). Visit our Pricing page for full details.' },
    { q: 'Can I change my plan?', a: 'Yes! You can upgrade or downgrade your plan at any time from your dashboard. Changes take effect immediately.' },
    
    // Support
    { q: 'How do I contact support?', a: 'Email support@ologywood.com or use our contact form. Our team is available Monday through Friday, 9 AM to 6 PM EST, and typically responds within 24 hours.' },
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
          <Footer />
    </div>
  );
}
