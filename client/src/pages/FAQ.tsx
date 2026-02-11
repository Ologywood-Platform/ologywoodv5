import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  id: number;
  category: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    category: 'Booking',
    question: 'How do I book an artist?',
    answer: 'Browse our artist directory, click on an artist profile, and submit a booking request. Include your event details, date, and venue information. The artist will review your request and respond within 48 hours.',
  },
  {
    id: 2,
    category: 'Booking',
    question: 'Can I modify a booking after it\'s confirmed?',
    answer: 'Yes! You can modify booking details by going to your Bookings page. Some changes may require the artist\'s approval. Contact us if you need to reschedule.',
  },
  {
    id: 3,
    category: 'Booking',
    question: 'What\'s your cancellation policy?',
    answer: 'Cancellations made 30+ days before the event receive a full refund. Cancellations 15-29 days before receive 50% refund. Cancellations within 14 days are non-refundable.',
  },
  {
    id: 4,
    category: 'Payment',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and digital wallets through our secure Stripe payment processor.',
  },
  {
    id: 5,
    category: 'Payment',
    question: 'When do artists get paid?',
    answer: 'Artists receive payment 3 business days after the event date. Payments are transferred directly to their connected bank account.',
  },
  {
    id: 6,
    category: 'Payment',
    question: 'Are there any hidden fees?',
    answer: 'No hidden fees! We charge a transparent 5% platform fee on bookings. All fees are clearly displayed before you complete your booking.',
  },
  {
    id: 7,
    category: 'Riders',
    question: 'What is a rider and why do I need one?',
    answer: 'A rider is a document outlining technical, hospitality, and financial requirements for a performance. It helps venues understand what an artist needs to deliver their best performance.',
  },
  {
    id: 8,
    category: 'Riders',
    question: 'Can I create multiple riders?',
    answer: 'Yes! Artists can create different riders for different performance types (e.g., solo acoustic vs. full band). You can select which rider to use for each booking.',
  },
  {
    id: 9,
    category: 'Account',
    question: 'How do I update my profile?',
    answer: 'Log in to your dashboard, go to Profile, and edit your information. You can update your bio, photos, location, and fee range anytime.',
  },
  {
    id: 10,
    category: 'Account',
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page. We\'ll send you an email with a reset link. Check your spam folder if you don\'t see it.',
  },
  {
    id: 11,
    category: 'Technical',
    question: 'What browsers do you support?',
    answer: 'Ologywood works best on Chrome, Firefox, Safari, and Edge. We support the latest two versions of each browser.',
  },
  {
    id: 12,
    category: 'Technical',
    question: 'Is my data secure?',
    answer: 'Yes! We use industry-standard SSL encryption and comply with GDPR and data protection regulations. Your payment information is never stored on our servers.',
  },
];

const categories = ['All', ...Array.from(new Set(faqData.map(item => item.category)))];

export default function FAQ() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredFAQs = selectedCategory === 'All' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-600">Find answers to common questions about booking, payments, and using Ologywood.</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFAQs.map(faq => (
            <div key={faq.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                  <p className="text-sm text-purple-600 mt-1">{faq.category}</p>
                </div>
                <ChevronDown
                  className={`w-6 h-6 text-gray-400 transition-transform ${
                    expandedId === faq.id ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              {expandedId === faq.id && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Didn't find your answer?</h2>
          <p className="text-gray-600 mb-6">Our support team is here to help. Get in touch with us anytime.</p>
          <a
            href="/contact"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
