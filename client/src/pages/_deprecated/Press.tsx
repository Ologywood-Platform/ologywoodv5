import React from 'react';
import { Link } from 'wouter';
import { Download, Mail } from 'lucide-react';

const Press = () => {
  const pressReleases = [
    {
      date: 'February 1, 2026',
      title: 'Ologywood Reaches 50,000 Bookings Milestone',
      excerpt: 'Platform celebrates record-breaking month with 50% growth in artist signups.',
    },
    {
      date: 'January 15, 2026',
      title: 'Ologywood Launches Advanced Analytics Dashboard',
      excerpt: 'New tools help artists and venues track performance and optimize pricing.',
    },
    {
      date: 'December 20, 2025',
      title: 'Ologywood Secures Series A Funding',
      excerpt: 'Raises $5M to expand platform and accelerate growth in live entertainment.',
    },
  ];

  const mediaAssets = [
    {
      name: 'Logo - Full Color',
      description: 'High-resolution logo with full color',
      format: 'PNG, SVG',
    },
    {
      name: 'Logo - Black & White',
      description: 'Monochrome version for print',
      format: 'PNG, SVG',
    },
    {
      name: 'Brand Guidelines',
      description: 'Complete brand style guide',
      format: 'PDF',
    },
    {
      name: 'Founder Photos',
      description: 'High-resolution photos of founders',
      format: 'JPG',
    },
    {
      name: 'Product Screenshots',
      description: 'Platform interface screenshots',
      format: 'PNG',
    },
    {
      name: 'Company Photos',
      description: 'Team and office photography',
      format: 'JPG',
    },
  ];

  const facts = [
    { label: 'Founded', value: '2023' },
    { label: 'Headquarters', value: 'Los Angeles, CA' },
    { label: 'Active Artists', value: '5,000+' },
    { label: 'Verified Venues', value: '1,000+' },
    { label: 'Bookings Completed', value: '50,000+' },
    { label: 'Countries', value: '15+' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-purple-100 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-4">Press Kit</h1>
          <p className="text-lg text-purple-100">
            Media resources and information about Ologywood
          </p>
        </div>
      </div>

      {/* Quick Facts */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Quick Facts</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {facts.map((fact, index) => (
            <div key={index} className="text-center">
              <p className="text-gray-600 text-sm mb-2">{fact.label}</p>
              <p className="text-3xl font-bold text-purple-600">{fact.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">About Ologywood</h2>
          
          <div className="space-y-4 text-gray-600">
            <p>
              Ologywood is the leading platform for booking talented artists and managing live entertainment events. We connect thousands of artists with venues and event organizers worldwide, simplifying the booking process and eliminating intermediaries.
            </p>
            <p>
              Founded in 2023, Ologywood has grown to facilitate over 50,000 bookings with a 98% satisfaction rate. Our mission is to empower artists and venues to build successful partnerships through transparent pricing, secure payments, and excellent support.
            </p>
            <p>
              We're headquartered in Los Angeles, CA with a team of 50+ professionals dedicated to revolutionizing the live entertainment industry.
            </p>
          </div>
        </div>
      </div>

      {/* Press Releases */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Press Releases</h2>
        
        <div className="space-y-6">
          {pressReleases.map((release, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
              <p className="text-sm text-purple-600 font-semibold mb-2">{release.date}</p>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{release.title}</h3>
              <p className="text-gray-600 mb-4">{release.excerpt}</p>
              <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm">
                Read Full Release →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Media Assets */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Media Assets</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {mediaAssets.map((asset, index) => (
              <div key={index} className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{asset.name}</h3>
                    <p className="text-sm text-gray-600">{asset.description}</p>
                  </div>
                  <Download className="w-5 h-5 text-purple-600 flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-600 mb-4">Format: {asset.format}</p>
                <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm">
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-8 text-center border border-purple-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Press Inquiries</h2>
          <p className="text-gray-600 mb-6">
            For media inquiries, interview requests, or additional information, please contact our press team.
          </p>
          <a href="mailto:press@ologywood.com" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition inline-flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Contact Press Team
          </a>
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

export default Press;
