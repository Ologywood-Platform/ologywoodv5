import React, { useState } from 'react';
import { Link } from 'wouter';
import { Facebook, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import TikTokIcon from './TikTokIcon';
import { trpc } from '@/lib/trpc';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const subscriptionMutation = trpc.newsletter.subscribe.useMutation();

  const socialLinks = [
    { name: 'YouTube', icon: Youtube, url: 'https://www.youtube.com/@Ologywood', color: 'hover:text-red-600' },
    { name: 'Instagram', icon: Instagram, url: 'https://www.instagram.com/ologywood_artist_service/', color: 'hover:text-pink-600' },
    { name: 'Facebook', icon: Facebook, url: 'https://www.facebook.com/profile.php?id=61587512344110', color: 'hover:text-blue-600' },
    { name: 'TikTok', icon: TikTokIcon, url: 'https://www.tiktok.com/@ologywood', color: 'hover:text-black' },
    { name: 'LinkedIn', icon: Linkedin, url: 'https://www.linkedin.com/showcase/ologywood-com/about/?viewAsMember=true', color: 'hover:text-blue-700' },
  ];

  // MVP-only footer sections - removed all dead links
  const footerSections = [
    {
      title: 'Platform',
      links: [
        { label: 'Browse Talent', path: '/browse' },
        { label: 'Events', path: '/events' },
        { label: 'Pricing', path: '/pricing' },
        { label: 'How It Works', path: '/how-it-works' },
        { label: 'Help Center', path: '/help' },
        { label: 'FAQ', path: '/faq' },
        { label: 'Contact Us', path: '/contact' },
        { label: 'Blog', path: '/blog' },
      ],
    },
    {
      title: 'For Talent',
      links: [
        { label: 'Artist Dashboard', path: '/dashboard' },
        { label: 'Browse Venues', path: '/venues' },
        { label: 'My Bookings', path: '/bookings' },
        { label: 'Earnings', path: '/earnings' },
        { label: 'Releases', path: '/releases' },
        { label: 'Riders', path: '/riders' },
        { label: 'Availability', path: '/availability' },
      ],
    },
    {
      title: 'For Venues',
      links: [
        { label: 'Venue Dashboard', path: '/venue-dashboard' },
        { label: 'Browse Talent', path: '/browse' },
        { label: 'Events', path: '/events' },
        { label: 'My Bookings', path: '/bookings' },
        { label: 'Invoices', path: '/venue-invoices' },
        { label: 'Favorites', path: '/favorites' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms of Service', path: '/terms-of-service' },
        { label: 'Privacy Policy', path: '/privacy-policy' },
        { label: 'Disclaimer', path: '/disclaimer' },
        { label: 'Creator Bill of Rights', path: '/creator-rights' },
        { label: 'Community Guidelines', path: '/community-guidelines' },
        { label: 'Cookie Policy', path: '/cookies' },
        { label: 'DMCA Policy', path: '/dmca' },
      ],
    },
  ];

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address');
      setSubscriptionStatus('error');
      setTimeout(() => setSubscriptionStatus('idle'), 4000);
      return;
    }

    setSubscriptionStatus('loading');
    setErrorMessage('');
    try {
      const result = await subscriptionMutation.mutateAsync({
        email,
        name: '',
        source: 'footer',
      });
      setSubscriptionStatus('success');
      setEmail('');
      setTimeout(() => setSubscriptionStatus('idle'), 5000);
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to subscribe. Please try again later.';
      setErrorMessage(errorMsg);
      setSubscriptionStatus('error');
      setTimeout(() => setSubscriptionStatus('idle'), 5000);
    }
  };

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 pt-16 pb-8">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Signup Section */}
        <div className="mb-12 pb-12 border-b border-gray-800">
          <div className="max-w-md">
            <h3 className="text-white text-lg font-semibold mb-2">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">Get the latest news about talent, venues, and booking opportunities.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
              />
              <button 
                type="submit"
                disabled={subscriptionStatus === 'loading'}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium text-sm disabled:opacity-50"
              >
                {subscriptionStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            {subscriptionStatus === 'success' && (
              <p className="text-green-400 text-sm mt-2">✓ Successfully subscribed! Check your email for confirmation.</p>
            )}
            {subscriptionStatus === 'error' && (
              <p className="text-red-400 text-sm mt-2">✗ {errorMessage || 'Please enter a valid email'}</p>
            )}
          </div>
        </div>

        {/* Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-white font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.path.startsWith('mailto:') ? (
                      <a
                        href={link.path}
                        className="text-gray-400 hover:text-white transition text-sm"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.path}
                        className="text-gray-400 hover:text-white transition text-sm"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact & Social Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 pb-12 border-b border-gray-800">
          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <a href="mailto:support@ologywood.com" className="text-white hover:text-blue-400 transition">
                    support@ologywood.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">Phone</p>
                  <a href="tel:+1-678-525-0891" className="text-white hover:text-blue-400 transition">
                    +1 (678) 525-0891
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">Address</p>
                  <p className="text-white">
                    171 Prestwick Dr<br />
                    Hoschton, GA 30548<br />
                    United States
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="text-white font-semibold mb-4">Follow Us</h4>
            <p className="text-gray-400 text-sm mb-4">Connect with us on social media for the latest updates and announcements.</p>
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-gray-400 transition ${social.color}`}
                    title={social.name}
                  >
                    <Icon className="w-6 h-6" />
                  </a>
                );
              })}
            </div>
            
            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-gray-400 text-xs mb-3">Trusted by artists, athletes, and venues worldwide</p>
              <div className="flex gap-3 flex-wrap">
                <div className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-300">✓ Secure Payments</div>
                <div className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-300">✓ Verified Users</div>
                <div className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-300">✓ Dedicated Support</div>
              </div>
              <p className="text-gray-500 text-xs mt-4">
                All payments processed securely by Stripe. Disputes and chargebacks are handled directly by Stripe in accordance with card network rules.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm">
            <p>&copy; {currentYear} OlogyWood®. All rights reserved.</p>
          </div>
          
          <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
            <Link to="/terms-of-service" className="text-gray-400 hover:text-white transition">
              Terms
            </Link>
            <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition">
              Privacy
            </Link>
            <Link to="/disclaimer" className="text-gray-400 hover:text-white transition">
              Disclaimer
            </Link>
            <Link to="/cookies" className="text-gray-400 hover:text-white transition">
              Cookies
            </Link>
            <Link to="/dmca" className="text-gray-400 hover:text-white transition">
              DMCA
            </Link>
            <Link to="/creator-rights" className="text-gray-400 hover:text-white transition">
              Creator Rights
            </Link>
            <Link to="/community-guidelines" className="text-gray-400 hover:text-white transition">
              Guidelines
            </Link>
          </div>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-gray-400 hover:text-white transition text-sm"
          >
            Back to Top ↑
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
