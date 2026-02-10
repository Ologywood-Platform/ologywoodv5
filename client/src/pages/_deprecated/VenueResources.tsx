import React from 'react';
import { Link } from 'wouter';
import { BookOpen, Download, Video, Lightbulb } from 'lucide-react';

const VenueResources = () => {
  const resources = [
    {
      icon: BookOpen,
      title: 'Venue Setup Guide',
      description: 'Complete guide to setting up your venue profile and finding artists.',
      type: 'PDF',
      link: '#',
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Step-by-step videos for booking artists and managing events.',
      type: 'Video Series',
      link: '#',
    },
    {
      icon: Lightbulb,
      title: 'Booking Strategies',
      description: 'Best practices for finding and booking the right talent.',
      type: 'Guide',
      link: '#',
    },
    {
      icon: Download,
      title: 'Contract Templates',
      description: 'Ready-to-use booking agreement templates.',
      type: 'Templates',
      link: '#',
    },
  ];

  const guides = [
    {
      title: 'Creating an Attractive Venue Profile',
      description: 'How to showcase your venue and attract quality artists.',
      readTime: '5 min read',
    },
    {
      title: 'Finding the Right Artist for Your Event',
      description: 'Search strategies and filtering tips to find perfect matches.',
      readTime: '8 min read',
    },
    {
      title: 'Negotiating Booking Terms',
      description: 'How to communicate with artists and reach mutually beneficial agreements.',
      readTime: '7 min read',
    },
    {
      title: 'Understanding Artist Riders',
      description: 'What technical requirements and hospitality needs mean.',
      readTime: '6 min read',
    },
    {
      title: 'Event Day Coordination',
      description: 'Tips for smooth coordination with artists on event day.',
      readTime: '9 min read',
    },
    {
      title: 'Building Long-Term Artist Relationships',
      description: 'How to create partnerships with artists for recurring bookings.',
      readTime: '7 min read',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-indigo-100 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-4">Venue Resources</h1>
          <p className="text-lg text-indigo-100">
            Tools and guides to help you book amazing artists
          </p>
        </div>
      </div>

      {/* Featured Resources */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Featured Resources</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resources.map((resource, index) => {
            const IconComponent = resource.icon;
            return (
              <a
                key={index}
                href={resource.link}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-600 text-white">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    {resource.type}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{resource.title}</h3>
                <p className="text-sm text-gray-600">{resource.description}</p>
              </a>
            );
          })}
        </div>
      </div>

      {/* Guides Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Guides & Articles</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {guides.map((guide, index) => (
              <a
                key={index}
                href="#"
                className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">{guide.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{guide.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{guide.readTime}</span>
                  <span className="text-indigo-600 font-semibold text-sm">Read →</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Quick Tips for Success</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Complete Your Profile</h3>
            <p className="text-gray-600 text-sm">
              Add venue photos, capacity, location, and event types. Complete profiles attract more artists.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Be Specific in Requests</h3>
            <p className="text-gray-600 text-sm">
              Provide clear event details, budget, and requirements. This helps artists make informed decisions.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Respond Promptly</h3>
            <p className="text-gray-600 text-sm">
              Reply to artist inquiries quickly. Fast communication leads to better artist relationships.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Leave Reviews</h3>
            <p className="text-gray-600 text-sm">
              Share your experience with artists. Reviews help build a trustworthy community.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Book Amazing Artists?</h2>
          <p className="text-lg text-indigo-100 mb-8">
            Start using these resources to find and book the perfect talent.
          </p>
          <Link to="/get-started">
            <button className="bg-white hover:bg-gray-100 text-indigo-600 font-bold py-3 px-8 rounded-lg transition">
              Get Started Now
            </button>
          </Link>
        </div>
      </div>

      {/* Footer Link */}
      <div className="bg-white border-t py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VenueResources;
