import { useEffect } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';

export default function Contact() {
  // Set SEO meta tags
  useEffect(() => {
    setMetaTags(pageMetaTags.contact);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Contact Us</h1>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow">
            <Mail className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
            <p className="text-gray-600">info@ologywood.com</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <Phone className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
            <p className="text-gray-600">+1 (800) 654-9963</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <MapPin className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Address</h3>
            <p className="text-gray-600">Hoschton, GA 30548</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Send a Message</h2>
          <form className="space-y-4">
            <input type="text" placeholder="Your name" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            <input type="email" placeholder="Your email" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option>Select subject</option>
              <option>Booking Support</option>
              <option>Artist Inquiry</option>
              <option>Venue Inquiry</option>
              <option>Technical Issue</option>
            </select>
            <textarea placeholder="Your message" rows={6} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg">
              Send Message
            </button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
