import { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';
import { trpc } from '@/lib/trpc';
import Footer from '@/components/Footer';

const SUBJECTS = [
  'General Inquiry',
  'Booking Support',
  'Artist Inquiry',
  'Venue Inquiry',
  'Technical Issue',
  'Partnership',
  'Other',
] as const;

type Subject = typeof SUBJECTS[number];

export default function Contact() {
  useEffect(() => {
    setMetaTags(pageMetaTags.contact);
  }, []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<Subject | ''>('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot field
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setError('');
    },
    onError: (err) => {
      setError(err.message || 'Something went wrong. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (!subject) { setError('Please select a subject.'); return; }
    if (!message.trim() || message.trim().length < 10) { setError('Message must be at least 10 characters.'); return; }

    submitMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      subject: subject as Subject,
      message: message.trim(),
      website, // Honeypot — bots fill this, humans never see it
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Contact Us</h1>
          <p className="text-gray-600 mb-8">Have a question or need help? We'd love to hear from you.</p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <a href="mailto:hello@ologywood.com" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition group">
              <Mail className="w-8 h-8 text-indigo-600 mb-3 group-hover:scale-110 transition" />
              <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
              <p className="text-gray-600 text-sm">hello@ologywood.com</p>
            </a>

            <a href="tel:+18006549963" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition group">
              <Phone className="w-8 h-8 text-indigo-600 mb-3 group-hover:scale-110 transition" />
              <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
              <p className="text-gray-600 text-sm">+1 (800) 654-9963</p>
            </a>

            <div className="bg-white p-6 rounded-lg shadow">
              <MapPin className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
              <p className="text-gray-600 text-sm">Hoschton, GA 30548</p>
            </div>
          </div>

          {submitted ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
              <p className="text-gray-600 mb-2">
                Thanks for reaching out. We've sent a confirmation to <strong>{email || 'your email'}</strong>.
              </p>
              <p className="text-gray-500 text-sm mb-6">Our team typically responds within 24 hours.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Send another message
              </button>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send a Message</h2>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot field — hidden from real users, bots will fill it */}
                <div className="absolute opacity-0 -z-10" style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
                  <label htmlFor="contact-website">Website</label>
                  <input
                    id="contact-website"
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    disabled={submitMutation.isPending}
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    disabled={submitMutation.isPending}
                  />
                </div>

                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="contact-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as Subject)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
                    disabled={submitMutation.isPending}
                  >
                    <option value="">Select a subject...</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us how we can help..."
                    rows={6}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
                    disabled={submitMutation.isPending}
                  />
                  <p className="text-xs text-gray-400 mt-1">{message.length}/5000 characters</p>
                </div>

                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By submitting this form, you agree to our{' '}
                  <a href="/privacy-policy" className="text-indigo-600 hover:underline">Privacy Policy</a>.
                  We'll respond within 24 hours.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
          <Footer />
    </div>
  );
}
