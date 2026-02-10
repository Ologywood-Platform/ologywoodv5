import React from 'react';
import { Link } from 'wouter';
import { Mail, Phone, MessageSquare, Clock } from 'lucide-react';

const SupportPage = () => {
  const supportChannels = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us an email and we\'ll respond within 24 hours',
      contact: 'info@ologywood.com',
      time: 'Response time: 24 hours',
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Call our support team during business hours',
      contact: '+1 (800) 654-9963',
      time: 'Mon-Fri: 9AM-6PM PST',
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      contact: 'Available on the platform',
      time: 'Mon-Fri: 10AM-8PM PST',
    },
    {
      icon: Clock,
      title: 'Help Center',
      description: 'Browse our knowledge base for instant answers',
      contact: 'Visit Help Center',
      time: 'Available 24/7',
    },
  ];

  const commonIssues = [
    {
      category: 'Account Issues',
      issues: [
        'Can\'t log in to my account',
        'How to reset my password',
        'How to update my profile',
        'Account verification process',
      ],
    },
    {
      category: 'Booking Issues',
      issues: [
        'How to create a booking request',
        'Booking confirmation delays',
        'How to cancel a booking',
        'Dispute resolution process',
      ],
    },
    {
      category: 'Payment Issues',
      issues: [
        'Payment not processing',
        'How to view payment history',
        'Refund requests',
        'Invoice information',
      ],
    },
    {
      category: 'Technical Issues',
      issues: [
        'App not loading',
        'Message notifications not working',
        'Calendar sync issues',
        'Browser compatibility',
      ],
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
          <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-4">Support</h1>
          <p className="text-lg text-purple-100">
            We're here to help. Get in touch with our support team.
          </p>
        </div>
      </div>

      {/* Support Channels */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Contact Us</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {supportChannels.map((channel, index) => {
            const IconComponent = channel.icon;
            return (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-600 text-white">
                      <IconComponent className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{channel.title}</h3>
                    <p className="text-sm text-gray-600">{channel.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">{channel.contact}</p>
                  <p className="text-sm text-gray-600">{channel.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Common Issues */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Common Issues</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {commonIssues.map((section, index) => (
              <div key={index} className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{section.category}</h3>
                <ul className="space-y-3">
                  {section.issues.map((issue, issueIndex) => (
                    <li key={issueIndex}>
                      <a href="#" className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-2">
                        <span>→</span> {issue}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Send Us a Message</h2>
        
        <form className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                placeholder="your@email.com"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Subject</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
              placeholder="How can we help?"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Message</label>
            <textarea
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
              placeholder="Tell us more about your issue..."
            ></textarea>
          </div>
          
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition"
          >
            Send Message
          </button>
        </form>
      </div>

      {/* Response Time */}
      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-900 font-semibold mb-2">Average Response Time</p>
          <p className="text-3xl font-bold text-purple-600">Less than 24 hours</p>
        </div>
      </div>

      {/* Footer Link */}
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

export default SupportPage;
