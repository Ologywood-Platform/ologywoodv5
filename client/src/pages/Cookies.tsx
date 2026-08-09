import React from 'react';
import { Link } from 'wouter';
import { SiteHeader } from "@/components/SiteHeader";

const Cookies = () => {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <div className="bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">Cookie Policy</h1>
          <p className="text-gray-600 mt-2">Last updated: February 28, 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h2>1. What Are Cookies and Local Storage?</h2>
          <p>
            Cookies are small text files placed on your device by websites you visit. Local storage is a similar browser technology that allows websites to store data on your device. Both help us provide a better experience by remembering your preferences and keeping you signed in. This policy covers all such technologies used by Ologywood.
          </p>

          <h2>2. Cookies We Use</h2>
          <p>
            Ologywood uses a single HTTP cookie for authentication. We do not use advertising cookies, tracking pixels, or third-party marketing cookies.
          </p>

          <h3>Essential Cookie</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold border-b">Name</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Purpose</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Type</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b font-mono text-xs">app_session_id</td>
                  <td className="px-4 py-2 border-b">Keeps you signed in after logging in via OAuth. This cookie is essential for the platform to function and cannot be disabled.</td>
                  <td className="px-4 py-2 border-b">HttpOnly, Secure</td>
                  <td className="px-4 py-2 border-b">1 year</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>3. Local Storage We Use</h2>
          <p>
            We use your browser's local storage to remember your preferences and provide offline functionality. This data stays on your device and is never sent to third parties.
          </p>

          <h3>Preferences and Personalization</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold border-b">Key</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Purpose</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Category</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b font-mono text-xs">theme</td>
                  <td className="px-4 py-2 border-b">Remembers your dark or light mode preference</td>
                  <td className="px-4 py-2 border-b">Functional</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-mono text-xs">sidebar_width</td>
                  <td className="px-4 py-2 border-b">Remembers your preferred dashboard sidebar width</td>
                  <td className="px-4 py-2 border-b">Functional</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-mono text-xs">notificationPreferences</td>
                  <td className="px-4 py-2 border-b">Stores your notification settings (email, push, in-app)</td>
                  <td className="px-4 py-2 border-b">Functional</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-mono text-xs">pwa-install-dismissed</td>
                  <td className="px-4 py-2 border-b">Prevents the "Install App" prompt from reappearing after you dismiss it</td>
                  <td className="px-4 py-2 border-b">Functional</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>Favorites and Activity</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold border-b">Key</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Purpose</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Category</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b font-mono text-xs">favorites_artist</td>
                  <td className="px-4 py-2 border-b">Stores the list of artists you have favorited for quick access</td>
                  <td className="px-4 py-2 border-b">Functional</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-mono text-xs">favorites_venue</td>
                  <td className="px-4 py-2 border-b">Stores the list of venues you have favorited for quick access</td>
                  <td className="px-4 py-2 border-b">Functional</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>Offline and PWA Support</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold border-b">Key</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Purpose</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Category</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b font-mono text-xs">syncQueue</td>
                  <td className="px-4 py-2 border-b">Queues actions taken while offline so they can be synced when you reconnect</td>
                  <td className="px-4 py-2 border-b">Essential</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Our service worker (<code>ologywood-v4</code> cache) also stores static assets like page layouts, icons, and stylesheets in your browser's Cache Storage to enable faster loading and offline access. This cache is automatically managed and updated when new versions of the platform are deployed.
          </p>

          <h2>4. Third-Party Services</h2>
          <p>
            The following third-party services may set their own cookies or store data when you interact with their features on Ologywood. Each service operates under its own privacy and cookie policies.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold border-b">Service</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">Purpose</th>
                  <th className="px-4 py-2 text-left font-semibold border-b">When Active</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b font-semibold">Stripe</td>
                  <td className="px-4 py-2 border-b">Processes payments securely. May set cookies for fraud prevention during checkout.</td>
                  <td className="px-4 py-2 border-b">When you make a payment or manage subscriptions</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-semibold">Google Maps</td>
                  <td className="px-4 py-2 border-b">Displays venue and event locations on maps. May set cookies for map functionality.</td>
                  <td className="px-4 py-2 border-b">When viewing venue or event location maps</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>5. What We Do Not Use</h2>
          <p>
            Ologywood does <strong>not</strong> use:
          </p>
          <ul>
            <li>Advertising or marketing cookies</li>
            <li>Cross-site tracking pixels (Facebook Pixel, Google Ads, etc.)</li>
            <li>Third-party analytics cookies that track you across other websites</li>
            <li>Fingerprinting or device identification technologies</li>
          </ul>

          <h2>6. Managing Your Data</h2>
          <p>
            You can manage cookies and local storage through your browser settings:
          </p>
          <ul>
            <li><strong>Clear cookies:</strong> Removes your session cookie, which will sign you out of Ologywood</li>
            <li><strong>Clear local storage:</strong> Resets your preferences (theme, favorites, notification settings) to defaults</li>
            <li><strong>Clear cache storage:</strong> Removes offline-cached pages and assets; they will be re-downloaded on your next visit</li>
            <li><strong>Block all cookies:</strong> Ologywood requires the <code>app_session_id</code> cookie to function. Blocking it will prevent you from signing in.</li>
          </ul>
          <p>
            Most browsers allow you to selectively manage cookies by site. Consult your browser's help documentation for specific instructions.
          </p>

          <h2>7. Changes to This Policy</h2>
          <p>
            We will update this Cookie Policy when we add or change the cookies and storage technologies we use. The "Last updated" date at the top of this page reflects the most recent revision. Continued use of Ologywood after changes constitutes acceptance of the updated policy.
          </p>

          <h2>8. Contact Us</h2>
          <p>
            If you have questions about this Cookie Policy or how Ologywood uses cookies and local storage, please contact us at{' '}
            <a href="mailto:privacy@ologywood.com" className="text-blue-600 hover:text-blue-700">privacy@ologywood.com</a>.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex gap-4">
            <Link to="/terms" className="text-blue-600 hover:text-blue-700">Terms of Service</Link>
            <Link to="/privacy" className="text-blue-600 hover:text-blue-700">Privacy Policy</Link>
            <Link to="/accessibility" className="text-blue-600 hover:text-blue-700">Accessibility</Link>
            <Link to="/" className="text-blue-600 hover:text-blue-700">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cookies;
