import React from 'react';
import { Link } from 'wouter';
import { BookOpen, Download, Video, Lightbulb } from 'lucide-react';

const ArtistResources = () => {
  const resources = [
    {
      icon: BookOpen,
      title: 'Getting Started Guide',
      description: 'Complete guide to setting up your artist profile and getting your first bookings.',
      type: 'PDF',
      link: '#',
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Step-by-step video guides for using all platform features.',
      type: 'Video Series',
      link: '#',
    },
    {
      icon: Lightbulb,
      title: 'Marketing Tips',
      description: 'Strategies to increase your visibility and attract more bookings.',
      type: 'Guide',
      link: '#',
    },
    {
      icon: Download,
      title: 'Rider Templates',
      description: 'Pre-made rider templates you can customize for your needs.',
      type: 'Templates',
      link: '#',
    },
  ];

  const guides = [
    {
      title: 'How to Create a Compelling Artist Profile',
      description: 'Learn what information and photos to include to attract venues.',
      readTime: '5 min read',
    },
    {
      title: 'Pricing Your Services: A Complete Guide',
      description: 'How to set competitive rates based on experience and market demand.',
      readTime: '8 min read',
    },
    {
      title: 'Building Your Brand on Social Media',
      description: 'Social media strategies to grow your fanbase and booking opportunities.',
      readTime: '10 min read',
    },
    {
      title: 'Negotiating Better Booking Terms',
      description: 'Tips for communicating with venues and getting the best deals.',
      readTime: '6 min read',
    },
    {
      title: 'Managing Multiple Bookings',
      description: 'Best practices for coordinating multiple gigs and avoiding conflicts.',
      readTime: '7 min read',
    },
    {
      title: 'Creating an Effective Rider',
      description: 'Technical requirements and hospitality needs that venues need to know.',
      readTime: '9 min read',
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
          <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-4">Artist Resources</h1>
          <p className="text-lg text-purple-100">
            Tools and guides to help you succeed on Ologywood
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
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-600 text-white">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">
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
                  <span className="text-purple-600 font-semibold text-sm">Read →</span>
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
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Complete Your Profile</h3>
            <p className="text-gray-600 text-sm">
              Add high-quality photos, detailed bio, and all relevant information. Complete profiles get 3x more bookings.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Respond Quickly</h3>
            <p className="text-gray-600 text-sm">
              Reply to booking inquiries within 24 hours. Quick responses lead to more confirmed bookings.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Maintain Availability</h3>
            <p className="text-gray-600 text-sm">
              Keep your calendar updated with accurate availability. This increases your visibility in searches.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Collect Reviews</h3>
            <p className="text-gray-600 text-sm">
              Ask venues to leave reviews after bookings. Positive reviews boost your profile ranking.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Grow Your Career?</h2>
          <p className="text-lg text-purple-100 mb-8">
            Start booking more gigs today with these resources and tools.
          </p>
          <Link to="/get-started">
            <button className="bg-white hover:bg-gray-100 text-purple-600 font-bold py-3 px-8 rounded-lg transition">
              Get Started Now
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

export default ArtistResources;
