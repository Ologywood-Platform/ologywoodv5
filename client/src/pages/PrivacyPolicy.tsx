import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg sm:text-2xl font-bold text-primary">
            <img src="/logo-sm.png" alt="Ologywood" className="h-6 sm:h-8 w-6 sm:w-8 rounded" />
            <span className="hidden sm:inline">Ologywood</span>
            <span className="sm:hidden">OW</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: February 28, 2026
        </p>

        <div className="prose prose-sm sm:prose max-w-none space-y-6">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Introduction</h2>
            <p className="text-base leading-relaxed">
              Ologywood ("we," "us," "our," or "Company") operates a talent booking and fan engagement platform that connects artists, athletes, creators, entertainers, and influencers with venues, event organizers, brands, and fans. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website at www.ologywood.com and our progressive web application (collectively, the "Platform"). Please read this privacy policy carefully. If you do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">2.1 Account Information</h3>
            <p className="text-base leading-relaxed">
              When you create an account, you authenticate through our OAuth provider. We receive and store your name and email address. We do not collect or store passwords, as authentication is handled entirely by our OAuth provider.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">2.2 Profile Information</h3>
            <p className="text-base leading-relaxed">
              Depending on your role, you may provide additional information to complete your profile:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Artists:</strong> Bio, genre, location, profile photos, social media links (Instagram, Facebook, YouTube, Spotify, SoundCloud, TikTok), experience level, equipment needs, availability calendar, and performance rates</li>
              <li><strong>Athletes:</strong> Sport, position, team affiliation, athletic statistics, achievements, NIL deal history, highlight video clips, and booking availability</li>
              <li><strong>Creators/Entertainers/Influencers:</strong> Bio, category, location, profile photos, social media links, content type, and rates</li>
              <li><strong>Venues:</strong> Venue name, type, capacity, location, photos, amenities, and event history</li>
              <li><strong>Event Organizers:</strong> Organization name, event details, and contact information</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">2.3 Booking and Contract Information</h3>
            <p className="text-base leading-relaxed">
              When you create or accept bookings, we collect event details (date, time, location, event type), agreed fees, and rider requirements (technical specifications, hospitality needs, stage setup). When you sign contracts through our e-signature system, we record your signature (drawn or typed), the signing timestamp, and your IP address for verification purposes.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">2.4 Payment Information</h3>
            <p className="text-base leading-relaxed">
              Payments are processed entirely by Stripe. We store only your Stripe Customer ID and Payment Intent IDs to link transactions to your account. We never receive, process, or store your credit card numbers, CVV, or full billing details. All payment data is handled directly by Stripe under their <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a>.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">2.5 Communication Data</h3>
            <p className="text-base leading-relaxed">
              Messages sent through our in-platform messaging system are stored to facilitate communication between talent (artists, athletes, creators, entertainers, influencers), venues, and organizers. We also store email update blasts that talent send to their followers through our platform.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">2.6 Information Collected Automatically</h3>
            <p className="text-base leading-relaxed">
              When you access our Platform, we automatically collect:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Device Information:</strong> Device type, operating system, and browser type</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, and time spent on the Platform</li>
              <li><strong>IP Address:</strong> Used for approximate location detection and contract signature verification</li>
            </ul>
            <p className="text-base leading-relaxed mt-2">
              We use a privacy-focused analytics service that does not use cookies for tracking and does not collect personally identifiable information. See our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link> for full details on cookies and local storage.
            </p>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Platform Operation:</strong> Creating and maintaining your account, processing bookings, generating rider contracts, and managing e-signatures</li>
              <li><strong>Payment Processing:</strong> Creating Stripe checkout sessions, processing deposits, and managing subscription billing</li>
              <li><strong>Communication:</strong> Sending booking confirmations, contract notifications, countersigning requests, and update blasts via SendGrid email</li>
              <li><strong>Search and Discovery:</strong> Displaying talent and venue profiles in search results, browse pages, and recommendations</li>
              <li><strong>Maps and Location:</strong> Showing venue and event locations on Google Maps within the Platform</li>
              <li><strong>Offline Support:</strong> Caching pages and assets via our service worker so the Platform works when you lose internet connectivity</li>
              <li><strong>Safety and Security:</strong> Detecting fraud, verifying contract signatures, and protecting user safety</li>
              <li><strong>Platform Improvement:</strong> Understanding usage patterns through anonymized analytics to improve features</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">4. Third-Party Services</h2>
            <p className="text-base leading-relaxed">
              Ologywood integrates with the following third-party services, each of which operates under its own privacy policy:
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold border-b">Service</th>
                    <th className="px-4 py-2 text-left font-semibold border-b">Purpose</th>
                    <th className="px-4 py-2 text-left font-semibold border-b">Data Shared</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 border-b font-semibold">Stripe</td>
                    <td className="px-4 py-2 border-b">Payment processing and subscriptions</td>
                    <td className="px-4 py-2 border-b">Email, name, user ID (via checkout metadata). Card details go directly to Stripe.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border-b font-semibold">SendGrid</td>
                    <td className="px-4 py-2 border-b">Transactional and notification emails</td>
                    <td className="px-4 py-2 border-b">Recipient email address and name for email delivery</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border-b font-semibold">Google Maps</td>
                    <td className="px-4 py-2 border-b">Location display and geocoding</td>
                    <td className="px-4 py-2 border-b">Venue and event addresses for map rendering</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border-b font-semibold">AWS S3</td>
                    <td className="px-4 py-2 border-b">File storage</td>
                    <td className="px-4 py-2 border-b">Profile images and contract PDFs you upload or generate</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-base leading-relaxed mt-4">
              We do not sell your personal information to any third party. We do not share your data with advertising networks or data brokers.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Data Security</h2>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Encryption in Transit:</strong> All data is transmitted over HTTPS with TLS encryption</li>
              <li><strong>Authentication:</strong> Sessions are managed via HttpOnly, Secure cookies with SameSite protection to prevent cross-site attacks</li>
              <li><strong>Payment Security:</strong> Credit card information is never transmitted to or stored on our servers. Stripe handles all payment data under PCI DSS Level 1 compliance.</li>
              <li><strong>Database Security:</strong> Our database is hosted on AWS RDS with encryption at rest and restricted network access</li>
              <li><strong>Contract Integrity:</strong> E-signatures are verified with IP address logging and timestamp recording</li>
              <li><strong>Access Controls:</strong> Administrative access is restricted and audited</li>
            </ul>
            <p className="text-base leading-relaxed mt-4">
              No method of transmission over the internet is 100% secure. While we implement industry-standard protections, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">6. How We Share Your Information</h2>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">6.1 With Other Users</h3>
            <p className="text-base leading-relaxed">
              Your public profile information (name, photo, bio, genre/sport, location, ratings) is visible to other Platform users to facilitate bookings. For athletes, this includes sport, position, team, statistics, and achievements. When you accept a booking, your contact information and rider requirements are shared with the other party to the booking. Signed contracts (including NIL Engagement Contracts) are accessible to both the talent and the venue, organizer, or brand involved.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">6.2 With Service Providers</h3>
            <p className="text-base leading-relaxed">
              We share information with the third-party services listed in Section 4 solely for the purposes described. These providers are contractually obligated to protect your data and use it only for the services they provide to us.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">6.3 Legal Requirements</h3>
            <p className="text-base leading-relaxed">
              We may disclose your information when required by law, court order, or government request, or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">6.4 Business Transfers</h3>
            <p className="text-base leading-relaxed">
              If Ologywood is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Data Retention</h2>
            <p className="text-base leading-relaxed">
              We retain your account information for as long as your account is active. Booking records and signed contracts are retained for 7 years to comply with financial record-keeping requirements. Messages are retained for the duration of your account. If you delete your account, we will remove your personal information within 30 days, except where retention is required by law or for legitimate business purposes (such as resolving disputes or enforcing agreements).
            </p>
          </section>

          {/* Your Rights and Choices */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">8. Your Rights and Choices</h2>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Update your information through your profile settings or dashboard</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Email Opt-Out:</strong> Unsubscribe from marketing emails using the link in every email. Transactional emails (booking confirmations, contract notifications) cannot be disabled while your account is active.</li>
              <li><strong>Data Portability:</strong> Request your data in a portable format</li>
              <li><strong>Cookie Control:</strong> Manage cookies and local storage through your browser settings (see our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>)</li>
            </ul>
            <p className="text-base leading-relaxed mt-4">
              To exercise these rights, contact us at <a href="mailto:privacy@ologywood.com" className="text-primary hover:underline">privacy@ologywood.com</a>.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">9. Children's Privacy</h2>
            <p className="text-base leading-relaxed">
              Ologywood is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will delete such information and terminate the account. If you believe a child under 13 has created an account, please contact us at <a href="mailto:privacy@ologywood.com" className="text-primary hover:underline">privacy@ologywood.com</a>.
            </p>
          </section>

          {/* GDPR */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">10. GDPR and International Users</h2>
            <p className="text-base leading-relaxed">
              If you are located in the European Economic Area (EEA) or the United Kingdom, you have additional rights under the General Data Protection Regulation (GDPR):
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Legal Basis:</strong> We process your data based on consent (account creation), contract performance (booking fulfillment), and legitimate interests (platform security and improvement)</li>
              <li><strong>Right to Restrict Processing:</strong> You can request that we limit how we use your data</li>
              <li><strong>Right to Object:</strong> You can object to processing based on legitimate interests</li>
              <li><strong>Complaints:</strong> You have the right to lodge a complaint with your local data protection authority</li>
            </ul>
            <p className="text-base leading-relaxed mt-4">
              Your information may be transferred to and processed in the United States, where our servers are located. By using the Platform, you consent to this transfer.
            </p>
          </section>

          {/* California Privacy */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">11. California Privacy Rights</h2>
            <p className="text-base leading-relaxed">
              California residents have additional rights under the California Consumer Privacy Act (CCPA). You may request disclosure of the categories and specific pieces of personal information we have collected, request deletion of your personal information, and opt out of the sale of personal information. Ologywood does not sell personal information.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">12. Contact Us</h2>
            <p className="text-base leading-relaxed">
              If you have questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4 space-y-2 text-base">
              <p><strong>Ologywood</strong></p>
              <p>Email: <a href="mailto:privacy@ologywood.com" className="text-primary hover:underline">privacy@ologywood.com</a></p>
              <p>General Inquiries: <a href="mailto:hello@ologywood.com" className="text-primary hover:underline">hello@ologywood.com</a></p>
              <p>Phone: <a href="tel:678-525-0891" className="text-primary hover:underline">678-525-0891</a></p>
              <p>Address: 171 Prestwick Dr, Hoschton, GA 30548</p>
            </div>
          </section>

          {/* Policy Changes */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">13. Changes to This Privacy Policy</h2>
            <p className="text-base leading-relaxed">
              We may update this Privacy Policy to reflect changes in our practices, technology, or legal requirements. We will notify you of material changes by updating the "Last updated" date at the top of this page. Your continued use of Ologywood after any changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-4">
            <Link href="/terms-of-service">
              <Button variant="outline" className="w-full sm:w-auto">
                Terms of Service
              </Button>
            </Link>
            <Link href="/cookies">
              <Button variant="outline" className="w-full sm:w-auto">
                Cookie Policy
              </Button>
            </Link>
          </div>
          <Link href="/">
            <Button className="w-full sm:w-auto">
              Back to Home
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
