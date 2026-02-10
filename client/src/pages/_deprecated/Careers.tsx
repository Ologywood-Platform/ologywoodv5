import React from 'react';
import { Link } from 'wouter';
import { Briefcase, MapPin, DollarSign, Users } from 'lucide-react';

const Careers = () => {
  const jobs = [
    {
      id: 1,
      title: 'Senior Full Stack Engineer',
      department: 'Engineering',
      location: 'Los Angeles, CA (Remote)',
      salary: '$150,000 - $200,000',
      type: 'Full-time',
      description: 'We\'re looking for an experienced full stack engineer to help build the next generation of our platform.',
    },
    {
      id: 2,
      title: 'Product Manager',
      department: 'Product',
      location: 'Los Angeles, CA',
      salary: '$120,000 - $160,000',
      type: 'Full-time',
      description: 'Lead product strategy and roadmap for our artist and venue platforms.',
    },
    {
      id: 3,
      title: 'Customer Success Manager',
      department: 'Support',
      location: 'Remote',
      salary: '$80,000 - $110,000',
      type: 'Full-time',
      description: 'Build relationships with our customers and ensure their success on the platform.',
    },
    {
      id: 4,
      title: 'Marketing Specialist',
      department: 'Marketing',
      location: 'Los Angeles, CA',
      salary: '$70,000 - $95,000',
      type: 'Full-time',
      description: 'Develop and execute marketing campaigns to grow our artist and venue communities.',
    },
    {
      id: 5,
      title: 'Data Analyst',
      department: 'Analytics',
      location: 'Remote',
      salary: '$90,000 - $130,000',
      type: 'Full-time',
      description: 'Analyze platform data to drive business insights and product improvements.',
    },
    {
      id: 6,
      title: 'Community Manager',
      department: 'Community',
      location: 'Remote',
      salary: '$65,000 - $85,000',
      type: 'Full-time',
      description: 'Engage with our community, moderate forums, and gather feedback.',
    },
  ];

  const benefits = [
    'Competitive salary and equity',
    'Health, dental, and vision insurance',
    'Unlimited PTO',
    'Remote work options',
    'Professional development budget',
    'Flexible work hours',
    'Team events and outings',
    'Free snacks and beverages',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-purple-100 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-4">Join Our Team</h1>
          <p className="text-lg text-purple-100">
            Help us revolutionize the live entertainment industry
          </p>
        </div>
      </div>

      {/* About Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Work at Ologywood?</h2>
            <p className="text-gray-600 mb-4">
              We're a passionate team building the future of live entertainment. We believe in creating meaningful work that impacts millions of artists and venues worldwide.
            </p>
            <p className="text-gray-600 mb-6">
              Our culture is built on collaboration, innovation, and a genuine love for live music and entertainment.
            </p>
            
            <h3 className="text-xl font-bold text-gray-900 mb-4">Benefits</h3>
            <div className="grid grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">✓</span>
                  <span className="text-gray-600 text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg p-8 h-96 flex items-center justify-center">
            <div className="text-center">
              <Users className="w-24 h-24 text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Join 50+ talented people</p>
            </div>
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Open Positions</h2>
          
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-purple-600 font-semibold">{job.department}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full w-fit">
                    {job.type}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{job.description}</p>
                
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    {job.salary}
                  </div>
                </div>
                
                <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm flex items-center gap-2">
                  View Details & Apply →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-8 text-center border border-purple-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Don't see your role?</h2>
          <p className="text-gray-600 mb-6">
            We're always looking for talented people. Send us your resume and let us know what you're interested in.
          </p>
          <a href="mailto:careers@ologywood.com" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition inline-block">
            Send Your Resume
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

export default Careers;
