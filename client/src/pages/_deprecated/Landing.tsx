import React from 'react';
import { Star, Users, TrendingUp, CheckCircle, ArrowRight, Zap } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  image: string;
  quote: string;
  rating: number;
}

interface CaseStudy {
  title: string;
  description: string;
  metrics: Array<{ label: string; value: string }>;
  image: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah Johnson',
    role: 'DJ & Producer',
    company: 'SJ Events',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    quote: 'Ologywood transformed how I manage bookings. I went from email chaos to organized, professional contracts in minutes.',
    rating: 5,
  },
  {
    name: 'Marcus Chen',
    role: 'Venue Manager',
    company: 'The Groove Room',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    quote: 'Finding and booking quality artists used to take weeks. Now it takes days. Our booking conversion increased by 40%.',
    rating: 5,
  },
  {
    name: 'Emma Rodriguez',
    role: 'Event Promoter',
    company: 'Live Experiences Co',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    quote: 'The platform handles everything - contracts, payments, negotiations. We saved thousands on admin overhead.',
    rating: 5,
  },
];

const caseStudies: CaseStudy[] = [
  {
    title: 'DJ Collective Increases Bookings by 60%',
    description: 'A group of 5 DJs used Ologywood to streamline their booking process and reach more venues.',
    metrics: [
      { label: 'Bookings Increased', value: '+60%' },
      { label: 'Time Saved Weekly', value: '12 hours' },
      { label: 'Revenue Growth', value: '+45%' },
    ],
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=300&fit=crop',
  },
  {
    title: 'Event Venue Reduces Booking Time by 70%',
    description: 'A mid-size venue automated their artist booking workflow with Ologywood.',
    metrics: [
      { label: 'Booking Time', value: '-70%' },
      { label: 'Artists Booked/Month', value: '+8' },
      { label: 'Customer Satisfaction', value: '+35%' },
    ],
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=300&fit=crop',
  },
];

export function Landing() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 text-white py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Book Talented Artists.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-blue-200">
                Manage Everything.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Ologywood connects artists and venues. Streamline bookings, manage contracts, process payments—all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button className="px-8 py-3 bg-white text-purple-900 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2">
                Get Started Free <ArrowRight className="h-5 w-5" />
              </button>
              <button className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-colors">
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
              <div>
                <p className="text-3xl sm:text-4xl font-bold">500+</p>
                <p className="text-purple-200 text-sm">Bookings Completed</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold">1000+</p>
                <p className="text-purple-200 text-sm">Active Users</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold">$2M+</p>
                <p className="text-purple-200 text-sm">Payments Processed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Why Choose Ologywood?</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-lg transition-shadow">
              <Zap className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Fast Booking</h3>
              <p className="text-gray-600">
                What used to take weeks now takes days. Find artists, negotiate terms, and finalize bookings quickly.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-lg transition-shadow">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Professional Contracts</h3>
              <p className="text-gray-600">
                Automated contract generation, version control, and e-signatures. No more email back-and-forth.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-lg transition-shadow">
              <TrendingUp className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Secure Payments</h3>
              <p className="text-gray-600">
                Stripe-powered payments with escrow protection. Deposits held until event completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Loved by Artists & Venues</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>

                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-600 italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Success Stories</h2>

          <div className="space-y-12">
            {caseStudies.map((study, idx) => (
              <div key={idx} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                <div className="grid md:grid-cols-2 gap-8 p-8">
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-900">{study.title}</h3>
                    <p className="text-gray-600 mb-8">{study.description}</p>

                    <div className="grid grid-cols-3 gap-4">
                      {study.metrics.map((metric, i) => (
                        <div key={i}>
                          <p className="text-2xl font-bold text-purple-600">{metric.value}</p>
                          <p className="text-sm text-gray-600">{metric.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <img
                      src={study.image}
                      alt={study.title}
                      className="rounded-lg w-full h-64 object-cover"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Transform Your Booking Process?</h2>
          <p className="text-lg text-purple-100 mb-8">
            Join 1000+ artists and venues already using Ologywood. Start free today.
          </p>

          <button className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-lg flex items-center justify-center gap-2 mx-auto">
            Get Started Free <ArrowRight className="h-5 w-5" />
          </button>

          <p className="text-purple-200 text-sm mt-6">No credit card required. 14-day free trial on Premium.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Follow</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Ologywood. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
