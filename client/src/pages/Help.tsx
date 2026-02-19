import React, { useState } from 'react';
import { ChevronDown, Search, Mail, MessageCircle, Phone } from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: 'getting-started-1',
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer: 'Click the "Sign Up" button on the homepage. Choose whether you\'re an artist or venue, fill in your details, and verify your email. Your account will be ready to use immediately.',
  },
  {
    id: 'getting-started-2',
    category: 'Getting Started',
    question: 'What\'s the difference between Artist and Venue accounts?',
    answer: 'Artist accounts are for performers, musicians, and entertainers who want to book gigs. Venue accounts are for event organizers, clubs, and venues looking to book talent. Each has tailored features for their needs.',
  },
  {
    id: 'getting-started-3',
    category: 'Getting Started',
    question: 'Is there a fee to join Ologywood?',
    answer: 'Joining is free! We offer a Free tier with basic features. Premium subscriptions unlock advanced features like priority booking, analytics, and custom branding.',
  },
  {
    id: 'booking-1',
    category: 'Booking & Contracts',
    question: 'How do I book an artist?',
    answer: 'Browse our artist directory, view their profiles and availability, and send a booking request. Artists will review your request and respond within 24-48 hours. Once accepted, you\'ll receive a contract to sign.',
  },
  {
    id: 'booking-2',
    category: 'Booking & Contracts',
    question: 'What happens after I send a booking request?',
    answer: 'The artist will receive your request and can accept, decline, or propose modifications. Once accepted, a digital contract is generated. Both parties sign electronically, and the booking is confirmed.',
  },
  {
    id: 'booking-3',
    category: 'Booking & Contracts',
    question: 'Can I modify a booking after it\'s confirmed?',
    answer: 'Yes, you can request modifications to date, time, or terms. The other party will review and approve or counter-propose. Changes require mutual agreement.',
  },
  {
    id: 'booking-4',
    category: 'Booking & Contracts',
    question: 'What is a rider and how do I use it?',
    answer: 'A rider is a document with technical requirements, hospitality needs, and special requests. Artists can create rider templates, and venues acknowledge them before confirming bookings. This ensures everyone is on the same page.',
  },
  {
    id: 'payment-1',
    category: 'Payments & Billing',
    question: 'How are payments handled?',
    answer: 'We use Stripe for secure payment processing. Deposits are collected upfront, and final payments are processed after the event. All transactions are encrypted and secure.',
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
    answer: 'Refund policies depend on when the cancellation occurs. Cancellations 30+ days before the event receive full refunds. Cancellations within 30 days may have reduced refunds. Check your booking terms for specifics.',
  },
  {
    id: 'profile-1',
    category: 'Profile & Settings',
    question: 'How do I upload photos to my profile?',
    answer: 'Go to Account Settings > Profile > Media Gallery. Click "Add Photos" to upload images. You can add up to 10 photos. We automatically optimize images for performance.',
  },
  {
    id: 'profile-2',
    category: 'Profile & Settings',
    question: 'How do I manage my availability?',
    answer: 'Artists can set their availability calendar in Dashboard > Availability. Mark dates when you\'re available to perform. Venues will only see available dates when booking.',
  },
  {
    id: 'profile-3',
    category: 'Profile & Settings',
    question: 'Can I change my subscription plan?',
    answer: 'Yes, you can upgrade or downgrade anytime in Account Settings > Billing. Changes take effect immediately. Upgrades are prorated; downgrades apply at the next billing cycle.',
  },
  {
    id: 'support-1',
    category: 'Support & Contact',
    question: 'How do I contact support?',
    answer: 'Use the Contact Us form on this page, email support@ologywood.com, or message us through the in-app chat. We typically respond within 24 hours.',
  },
  {
    id: 'support-2',
    category: 'Support & Contact',
    question: 'What are your support hours?',
    answer: 'Our support team is available Monday-Friday, 9 AM - 6 PM EST. For urgent issues, use the in-app chat for faster response.',
  },
  {
    id: 'support-3',
    category: 'Support & Contact',
    question: 'How do I report a problem or issue?',
    answer: 'Click the "Report Issue" button in your dashboard or contact support@ologywood.com. Include details about what happened, and we\'ll investigate right away.',
  },
];

export default function Help() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...new Set(faqItems.map(item => item.category))];
  
  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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
              <p className="text-gray-600 mb-4">+1 (555) 123-4567</p>
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
  );
}
