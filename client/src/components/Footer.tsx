import React from 'react';
import { Link } from 'wouter';
import { Facebook, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import TikTokIcon from './TikTokIcon';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'YouTube', icon: Youtube, url: 'https://www.youtube.com/@Ologywood', color: 'hover:text-red-600' },
    { name: 'Instagram', icon: Instagram, url: 'https://www.instagram.com/ologywood_artist_service/', color: 'hover:text-pink-600' },
    { name: 'Facebook', icon: Facebook, url: 'https://www.facebook.com/profile.php?id=61587512344110', color: 'hover:text-blue-600' },
    { name: 'TikTok', icon: TikTokIcon, url: 'https://www.tiktok.com/@ologywood', color: 'hover:text-black' },
    { name: 'LinkedIn', icon: Linkedin, url: 'https://www.linkedin.com/showcase/ologywood-com/about/?viewAsMember=true', color: 'hover:text-blue-700' },
  ];

  const footerSections = [
    {
      title: 'Company',
      links: [
        { label: 'About Us', path: '/about' },
        { label: 'Blog', path: '/blog' },
        { label: 'Careers', path: '/careers' },
        { label: 'Press Kit', path: '/press' },
        { label: 'Contact Us', path: '/contact' },
      ],
    },
    {
      title: 'For Artists',
      links: [
        { label: 'How It Works', path: '/how-it-works-artist' },
        { label: 'Pricing', path: '/pricing' },
        { label: 'Artist Resources', path: '/resources/artists' },
        { label: 'Verification', path: '/verification' },
        { label: 'Success Stories', path: '/success-stories' },
      ],
    },
    {
      title: 'For Venues',
      links: [
        { label: 'How It Works', path: '/how-it-works-venue' },
        { label: 'Venue Directory', path: '/venues' },
        { label: 'Venue Resources', path: '/resources/venues' },
        { label: 'Verification', path: '/verification' },
        { label: 'Partner With Us', path: '/partner' },
      ],
    },
    {
      title: 'Support & Legal',
      links: [
        { label: 'Help Center', path: '/help' },
        { label: 'FAQ', path: '/faq' },
        { label: 'Contact Support', path: '/support-page' },
        { label: 'Terms of Service', path: '/terms' },
        { label: 'Privacy Policy', path: '/privacy' },
        { label: 'Cookie Policy', path: '/cookies' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Signup Section */}
        <div className="mb-12 pb-12 border-b border-gray-800">
          <div className="max-w-md">
            <h3 className="text-white text-lg font-semibold mb-2">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">Get the latest news about artists, venues, and booking opportunities.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
              />
              <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium text-sm">
                Subscribe
              </button>
            </div>
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
                    <Link
                      to={link.path}
                      className="text-gray-400 hover:text-white transition text-sm"
                    >
                      {link.label}
                    </Link>
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
                  <a href="mailto:info@ologywood.com" className="text-white hover:text-blue-400 transition">
                    info@ologywood.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">Phone</p>
                  <a href="tel:+1-800-OLOGYWOOD" className="text-white hover:text-blue-400 transition">
                    +1 (800) 654-9963
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
              <p className="text-gray-400 text-xs mb-3">Trusted by artists and venues worldwide</p>
              <div className="flex gap-3 flex-wrap">
                <div className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-300">✓ Secure Payments</div>
                <div className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-300">✓ Verified Users</div>
                <div className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-300">✓ 24/7 Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm">
            <p>&copy; {currentYear} Ologywood. All rights reserved.</p>
          </div>
          
          <div className="flex gap-6 text-sm">
            <Link to="/terms" className="text-gray-400 hover:text-white transition">
              Terms
            </Link>
            <Link to="/privacy" className="text-gray-400 hover:text-white transition">
              Privacy
            </Link>
            <Link to="/cookies" className="text-gray-400 hover:text-white transition">
              Cookies
            </Link>
            <Link to="/accessibility" className="text-gray-400 hover:text-white transition">
              Accessibility
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
