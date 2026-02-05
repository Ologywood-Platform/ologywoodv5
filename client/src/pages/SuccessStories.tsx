import React from 'react';
import { Link } from 'wouter';
import { Star, Quote } from 'lucide-react';

const SuccessStories = () => {
  const stories = [
    {
      name: 'Alex Rivera',
      role: 'Independent Musician',
      location: 'Los Angeles, CA',
      story: 'Started with just 2 bookings a month on Ologywood. Within 6 months, I was booking 15+ gigs monthly. The platform\'s visibility and professional tools helped me grow my career exponentially.',
      image: '🎤',
      stats: '15+ bookings/month',
    },
    {
      name: 'The Jazz Collective',
      role: 'Jazz Band',
      location: 'New York, NY',
      story: 'We went from struggling to find consistent work to being fully booked 3 months in advance. Ologywood connected us with venues we never would have found otherwise.',
      image: '🎷',
      stats: 'Fully booked 3 months ahead',
    },
    {
      name: 'Luna\'s Lounge',
      role: 'Venue Owner',
      location: 'Miami, FL',
      story: 'Finding quality artists was our biggest challenge. Ologywood solved that problem. We now have a steady stream of talented performers and our event attendance has increased by 40%.',
      image: '🎭',
      stats: '40% increase in attendance',
    },
    {
      name: 'Marcus Thompson',
      role: 'DJ & Producer',
      location: 'Chicago, IL',
      story: 'Ologywood gave me the platform to showcase my work. I\'ve gone from weekend gigs to international bookings. The professional tools and exposure have been game-changing.',
      image: '🎧',
      stats: 'International bookings secured',
    },
    {
      name: 'The Rooftop Bar',
      role: 'Event Venue',
      location: 'Austin, TX',
      story: 'We used to spend hours searching for artists. Now we find perfect matches in minutes. Our customers love the variety of entertainment, and our revenue has grown significantly.',
      image: '🎪',
      stats: 'Revenue up 35%',
    },
    {
      name: 'Sophia Chen',
      role: 'Singer-Songwriter',
      location: 'Seattle, WA',
      story: 'As an independent artist, I struggled to get noticed. Ologywood\'s platform gave me the visibility I needed. I\'ve built a loyal fanbase and now tour regularly.',
      image: '🎸',
      stats: 'Regular touring artist',
    },
  ];

  const stats = [
    { number: '5,000+', label: 'Artists Empowered' },
    { number: '1,000+', label: 'Venues Connected' },
    { number: '50,000+', label: 'Successful Bookings' },
    { number: '98%', label: 'Satisfaction Rate' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-purple-100 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-4">Success Stories</h1>
          <p className="text-lg text-purple-100">
            Real stories from artists and venues who've transformed their careers with Ologywood
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">{stat.number}</div>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stories Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Featured Stories</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
              <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-8 text-center">
                <div className="text-6xl mb-4">{story.image}</div>
                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start gap-2 mb-4">
                  <Quote className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-600 italic text-sm line-clamp-3">{story.story}</p>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <p className="font-bold text-gray-900">{story.name}</p>
                  <p className="text-sm text-gray-600">{story.role}</p>
                  <p className="text-xs text-gray-500 mb-3">{story.location}</p>
                  <div className="bg-purple-50 px-3 py-2 rounded text-sm font-semibold text-purple-600">
                    {story.stats}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">What People Are Saying</h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 text-center mb-4 italic">
                "Ologywood has completely transformed how I book artists. What used to take hours now takes minutes. The quality of artists is outstanding."
              </p>
              <p className="text-center font-semibold text-gray-900">- Sarah, Venue Manager</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 text-center mb-4 italic">
                "As an independent artist, I was struggling to get bookings. Ologywood gave me the exposure I needed to build a sustainable career."
              </p>
              <p className="text-center font-semibold text-gray-900">- James, Musician</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-8 text-center border border-purple-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Write Your Success Story?</h2>
          <p className="text-gray-600 mb-6">
            Join thousands of artists and venues already succeeding on Ologywood.
          </p>
          <Link to="/get-started">
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition">
              Get Started Today
            </button>
          </Link>
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

export default SuccessStories;
