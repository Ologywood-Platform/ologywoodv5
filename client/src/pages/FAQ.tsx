import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { q: 'How do I book an artist?', a: 'Browse artists, select one, and create a booking request. Communicate directly to finalize details.' },
    { q: 'What payment methods are accepted?', a: 'We accept all major credit cards through secure Stripe payment processing.' },
    { q: 'Can I cancel a booking?', a: 'Yes, you can cancel through your dashboard. Cancellation policies vary by artist.' },
    { q: 'How do artists set pricing?', a: 'Artists set their own pricing based on event type, duration, and location.' },
    { q: 'Is there a booking fee?', a: 'Yes, Ologywood charges a small service fee on bookings to maintain the platform.' },
    { q: 'How do I create an artist profile?', a: 'Sign up as an artist, complete your profile, set pricing, and start receiving booking requests.' },
    { q: 'Can I upload a performance rider?', a: 'Yes! Artists can create riders with technical requirements and hospitality needs.' },
    { q: 'How do I contact support?', a: 'Email info@ologywood.com or use our contact form. We respond within 24 hours.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-600 mb-8">Find answers to common questions about Ologywood.</p>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-lg shadow">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <h3 className="font-semibold text-gray-900 text-left">{faq.q}</h3>
                <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
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
          <a href="/contact" className="text-indigo-600 hover:text-indigo-700 font-semibold">Contact us →</a>
        </div>
      </div>
    </div>
  );
}
