import React, { useState, useEffect } from 'react';
import { Music, Briefcase, CheckCircle, MessageSquare, CreditCard, Star } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState<'artists' | 'venues'>('artists');

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
            Connect talented artists with venues. Simple, secure, and seamless.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-4 justify-center mb-12">
          <button
            onClick={() => setActiveTab('artists')}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
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
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'venues'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Briefcase className="inline mr-2" size={20} />
            For Venues
          </button>
        </div>

        {/* Artists Section */}
        {activeTab === 'artists' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              Get Booked. Grow Your Career.
            </h2>

            {/* Step 1 */}
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-purple-600">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-600 text-white">
                    <span className="text-xl font-bold">1</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Create Your Profile</h3>
                  <p className="text-gray-600 text-lg mb-4">
                    Sign up and build your artist profile with your bio, genres, photos, and pricing. Show venues exactly what you offer.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Upload professional photos and videos
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      List your genres and performance style
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Set your booking rates
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-purple-600">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-600 text-white">
                    <span className="text-xl font-bold">2</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Set Your Availability</h3>
                  <p className="text-gray-600 text-lg mb-4">
                    Use the interactive calendar to mark when you're available for bookings. Update it anytime as your schedule changes.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Mark available dates on your calendar
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Block out unavailable dates
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Real-time sync prevents double-bookings
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-purple-600">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-600 text-white">
                    <span className="text-xl font-bold">3</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Receive Booking Requests</h3>
                  <p className="text-gray-600 text-lg mb-4">
                    Venues discover your profile and send booking requests. Review the event details, venue information, and requirements.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      See full event details and venue info
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Review technical requirements
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Instant notifications on new requests
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-purple-600">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-600 text-white">
                    <span className="text-xl font-bold">4</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Communicate & Confirm</h3>
                  <p className="text-gray-600 text-lg mb-4">
                    Message venues directly to discuss details, negotiate terms, and finalize arrangements before confirming the booking.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      In-platform messaging with venues
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Negotiate rates and requirements
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Accept or decline bookings
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-purple-600">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-600 text-white">
                    <span className="text-xl font-bold">5</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Paid & Build Your Reputation</h3>
                  <p className="text-gray-600 text-lg mb-4">
                    After your performance, receive payment securely and build your reputation with reviews from venues.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Secure payment processing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Receive venue reviews and ratings
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Build your portfolio
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 6 */}
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-purple-600">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-600 text-white">
                    <span className="text-xl font-bold">6</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Grow Your Fan Base</h3>
                  <p className="text-gray-600 text-lg mb-4">
                    Build a following on Ologywood and keep your fans engaged with direct email updates about upcoming shows and news.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Fans can follow your profile
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Send branded email updates to followers
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Track your fan engagement
                    </li>
                  </ul>
                </div>
              </div>
            </div>

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
                  <MessageSquare className="text-purple-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Direct Communication</h4>
                  <p className="text-gray-600">Message venues directly to discuss every detail.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <CreditCard className="text-purple-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Secure Payments</h4>
                  <p className="text-gray-600">Get paid safely through our secure payment system.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <CheckCircle className="text-purple-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Build Your Reputation</h4>
                  <p className="text-gray-600">Earn reviews and ratings to attract more bookings.</p>
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

            {/* Step 1 */}
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-600">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                    <span className="text-xl font-bold">1</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Create Your Venue Profile</h3>
                  <p className="text-gray-600 text-lg mb-4">
                    Set up your venue profile with details about your space, capacity, and the types of events you host.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Add venue photos and details
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Describe your space and capacity
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      List event types you host
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-600">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                    <span className="text-xl font-bold">2</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Browse & Search Artists</h3>
                  <p className="text-gray-600 text-lg mb-4">
                    Search our database of talented artists by genre, location, availability, and price. Save your favorites for quick access.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Filter by genre, location, and price
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      View artist profiles and ratings
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Save favorite artists
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-600">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                    <span className="text-xl font-bold">3</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Send Booking Requests</h3>
                  <p className="text-gray-600 text-lg mb-4">
                    Found the perfect artist? Send a booking request with your event details, requirements, and offer.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Specify event date and time
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Include technical requirements
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Make your offer
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-600">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                    <span className="text-xl font-bold">4</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Negotiate & Confirm</h3>
                  <p className="text-gray-600 text-lg mb-4">
                    Communicate directly with artists through our messaging system. Finalize details and confirm the booking.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Message artists directly
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Review artist riders and requirements
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Confirm booking details
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-600">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                    <span className="text-xl font-bold">5</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Manage & Review</h3>
                  <p className="text-gray-600 text-lg mb-4">
                    Track your bookings, manage payments, and leave reviews for artists after their performance.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Track all your bookings
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Manage payments securely
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      Leave reviews for artists
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="mt-12 pt-12 border-t-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">Why Venues Choose Ologywood</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <Star className="text-blue-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Talented Artists</h4>
                  <p className="text-gray-600">Access a diverse pool of performers across all genres.</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <MessageSquare className="text-blue-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Direct Communication</h4>
                  <p className="text-gray-600">Negotiate directly with artists without intermediaries.</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <CreditCard className="text-blue-600 mb-3" size={28} />
                  <h4 className="font-bold text-gray-900 mb-2">Secure Payments</h4>
                  <p className="text-gray-600">Safe and transparent payment processing.</p>
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
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16 px-4 mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of artists and venues already using Ologywood.
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
    </div>
  );
}
