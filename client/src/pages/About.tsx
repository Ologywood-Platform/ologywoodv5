import React from 'react';
import { Link } from 'wouter';
import { Users, Target, Heart, Zap } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Users,
      title: 'Community First',
      description: 'We believe in building a thriving community of artists and venues that support each other.',
    },
    {
      icon: Target,
      title: 'Transparency',
      description: 'Clear pricing, honest communication, and no hidden fees. What you see is what you get.',
    },
    {
      icon: Heart,
      title: 'Artist Support',
      description: 'We empower artists to grow their careers and reach new audiences through our platform.',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Constantly improving our platform with new features and tools to make booking easier.',
    },
  ];

  const stats = [
    { number: '5,000+', label: 'Active Artists' },
    { number: '1,000+', label: 'Verified Venues' },
    { number: '50,000+', label: 'Bookings Completed' },
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
          <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-4">About Ologywood</h1>
          <p className="text-lg text-purple-100">
            Connecting talented artists with venues and event organizers worldwide
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-4">
              Ologywood exists to revolutionize how artists and venues connect. We believe that live entertainment brings people together and creates unforgettable experiences.
            </p>
            <p className="text-gray-600 mb-4">
              Our platform simplifies the booking process, eliminates intermediaries, and empowers both artists and venues to build successful partnerships.
            </p>
            <p className="text-gray-600">
              By providing transparent pricing, secure payments, and excellent support, we're making it easier than ever to book amazing talent.
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg p-8 h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold text-purple-600 mb-2">Ologywood</div>
              <p className="text-gray-600">Where Artists Meet Venues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Values</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-600 text-white">
                        <IconComponent className="h-6 w-6" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{value.title}</h3>
                      <p className="text-gray-600">{value.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">By The Numbers</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">{stat.number}</div>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Team</h2>
          <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
            Ologywood is built by a passionate team of music industry veterans, software engineers, and creative professionals who are dedicated to making live entertainment more accessible.
          </p>
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <p className="text-gray-600 mb-4">
              We're always looking for talented individuals to join our mission. If you're interested in working with us, check out our Careers page.
            </p>
            <Link to="/careers">
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition">
                View Open Positions
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-purple-100 mb-8">
            Join thousands of artists and venues already using Ologywood
          </p>
          <Link to="/get-started">
            <button className="bg-white hover:bg-gray-100 text-purple-600 font-bold py-3 px-8 rounded-lg transition">
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

export default About;
