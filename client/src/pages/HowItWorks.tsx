import React from 'react';
import { Music, Search, MessageSquare, CreditCard, Star } from 'lucide-react';

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12 px-4 text-center">
        <h1 className="text-4xl font-bold mb-2">How It Works</h1>
        <p className="text-lg text-purple-100">Simple. Easy. Fast.</p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Simple 3-Step Flow */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {/* Step 1 */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-purple-100 p-8 rounded-full">
                <Music size={64} className="text-purple-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">1. Create Profile</h2>
            <p className="text-gray-600 text-lg">
              Artists share who they are. Venues share what they need.
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center">
            <div className="text-4xl text-purple-400">→</div>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 p-8 rounded-full">
                <Search size={64} className="text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">2. Find & Connect</h2>
            <p className="text-gray-600 text-lg">
              Venues find artists. Artists get booking requests.
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center">
            <div className="text-4xl text-blue-400">→</div>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-8 rounded-full">
                <CreditCard size={64} className="text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">3. Book & Get Paid</h2>
            <p className="text-gray-600 text-lg">
              Agree on details. Perform. Get paid. Leave reviews.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-gray-200 my-16"></div>

        {/* For Artists Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">For Artists</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="font-bold text-gray-800 mb-2">Sign Up</h3>
              <p className="text-gray-600">Create your profile</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="font-bold text-gray-800 mb-2">Set Availability</h3>
              <p className="text-gray-600">Mark your open dates</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="font-bold text-gray-800 mb-2">Get Requests</h3>
              <p className="text-gray-600">Venues send you offers</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="font-bold text-gray-800 mb-2">Get Paid</h3>
              <p className="text-gray-600">After your performance</p>
            </div>
          </div>
        </div>

        {/* For Venues Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">For Venues</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="font-bold text-gray-800 mb-2">Sign Up</h3>
              <p className="text-gray-600">Create your venue</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-bold text-gray-800 mb-2">Search Artists</h3>
              <p className="text-gray-600">Find the perfect fit</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="font-bold text-gray-800 mb-2">Send Request</h3>
              <p className="text-gray-600">Make your offer</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="text-4xl mb-3">⭐</div>
              <h3 className="font-bold text-gray-800 mb-2">Review</h3>
              <p className="text-gray-600">Rate the artist</p>
            </div>
          </div>
        </div>

        {/* Why Use Ologywood */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Why Ologywood?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">Direct Connection</h3>
              <p className="text-gray-600">No middleman. Just you and the venue.</p>
            </div>
            <div>
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">Safe & Secure</h3>
              <p className="text-gray-600">Protected payments and verified users.</p>
            </div>
            <div>
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">Super Fast</h3>
              <p className="text-gray-600">Book in minutes, not weeks.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12 px-4 text-center mt-16">
        <h2 className="text-3xl font-bold mb-4">Ready?</h2>
        <p className="text-lg mb-8 text-purple-100">Join thousands of artists and venues.</p>
        <a
          href="/get-started"
          className="inline-block px-8 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition text-lg"
        >
          Get Started Now
        </a>
      </div>
    </div>
  );
}
