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
            <img src="/logo-icon.png" alt="Ologywood" className="h-6 sm:h-8 w-6 sm:w-8 rounded" />
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
          Last updated: January 31, 2026
        </p>

        <div className="prose prose-sm sm:prose max-w-none space-y-6">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Introduction</h2>
            <p className="text-base leading-relaxed">
              Ologywood ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our artist booking platform. Please read this privacy policy carefully. If you do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">2.1 Information You Provide Directly</h3>
            <p className="text-base leading-relaxed">
              We collect information you voluntarily provide when you create an account, complete your profile, or use our services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, profile photo, and biographical information</li>
              <li><strong>Professional Information:</strong> For artists: genres, experience level, equipment needs, and availability. For venues: venue type, capacity, and event history</li>
              <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely through Stripe)</li>
              <li><strong>Communication Data:</strong> Messages, booking requests, and support inquiries</li>
              <li><strong>Rider Information:</strong> Technical and hospitality requirements you create or share</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">2.2 Information Collected Automatically</h3>
            <p className="text-base leading-relaxed">
              When you access our platform, we automatically collect certain technical information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Device Information:</strong> Device type, operating system, browser type, and IP address</li>
              <li><strong>Usage Data:</strong> Pages visited, time spent, features used, and search queries</li>
              <li><strong>Cookies and Similar Technologies:</strong> We use cookies to enhance your experience and analyze platform usage</li>
              <li><strong>Location Data:</strong> General location based on IP address (not precise GPS location without consent)</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">2.3 Information from Third Parties</h3>
            <p className="text-base leading-relaxed">
              We may receive information about you from third parties, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li>Payment processors (Stripe) for transaction verification</li>
              <li>Calendar services (Google Calendar, Outlook) if you authorize integration</li>
              <li>Social media platforms if you link your account</li>
              <li>Other users who mention or tag you in their profiles or communications</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="text-base leading-relaxed">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Service Delivery:</strong> Creating and maintaining your account, processing bookings, and managing payments</li>
              <li><strong>Communication:</strong> Sending booking confirmations, reminders, and support responses</li>
              <li><strong>Personalization:</strong> Customizing your experience and providing relevant recommendations</li>
              <li><strong>Safety and Security:</strong> Detecting fraud, preventing abuse, and protecting user safety</li>
              <li><strong>Analytics and Improvement:</strong> Understanding how you use our platform to improve features and services</li>
              <li><strong>Legal Compliance:</strong> Fulfilling legal obligations and responding to lawful requests</li>
              <li><strong>Marketing (with consent):</strong> Sending newsletters and promotional content you've opted into</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">4. Data Security</h2>
            <p className="text-base leading-relaxed">
              We implement comprehensive security measures to protect your information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Encryption:</strong> All data in transit is encrypted using SSL/TLS protocols</li>
              <li><strong>Payment Security:</strong> Payment information is never stored on our servers; it's processed securely through Stripe</li>
              <li><strong>Access Controls:</strong> Only authorized personnel can access personal information, and access is limited to what's necessary</li>
              <li><strong>Regular Audits:</strong> We conduct regular security audits and penetration testing</li>
              <li><strong>Data Retention:</strong> We retain your information only as long as necessary to provide services and comply with legal obligations</li>
            </ul>
            <p className="text-base leading-relaxed mt-4">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">5. How We Share Your Information</h2>
            <p className="text-base leading-relaxed">
              We are committed to protecting your privacy and only share information in specific circumstances:
            </p>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">5.1 With Other Users</h3>
            <p className="text-base leading-relaxed">
              Your public profile information (name, photo, bio, ratings, reviews) is visible to other users to facilitate bookings. You control what information is public through your privacy settings.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">5.2 With Service Providers</h3>
            <p className="text-base leading-relaxed">
              We share information with trusted service providers who assist us in operating our platform:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Stripe:</strong> For payment processing (credit card information is not shared with us)</li>
              <li><strong>Email Services:</strong> For sending transactional emails and notifications</li>
              <li><strong>Analytics Providers:</strong> For understanding platform usage (anonymized data)</li>
              <li><strong>Cloud Hosting:</strong> For storing and managing your data securely</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">5.3 Legal Requirements</h3>
            <p className="text-base leading-relaxed">
              We may disclose your information when required by law, court order, or government request, or when we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">5.4 Business Transfers</h3>
            <p className="text-base leading-relaxed">
              If Ologywood is involved in a merger, acquisition, bankruptcy, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change and any choices you may have regarding your information.
            </p>
          </section>

          {/* Your Rights and Choices */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Your Rights and Choices</h2>
            <p className="text-base leading-relaxed">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Access:</strong> You can request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> You can update or correct your information through your account settings</li>
              <li><strong>Deletion:</strong> You can request deletion of your account and associated data (subject to legal retention requirements)</li>
              <li><strong>Opt-Out:</strong> You can opt out of marketing communications at any time by clicking "unsubscribe" in emails</li>
              <li><strong>Data Portability:</strong> You can request your data in a portable format</li>
              <li><strong>Cookie Control:</strong> You can manage cookie preferences through your browser settings</li>
            </ul>
            <p className="text-base leading-relaxed mt-4">
              To exercise these rights, please contact us at <a href="mailto:info@ologywood.com" className="text-primary hover:underline">info@ologywood.com</a>.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Children's Privacy</h2>
            <p className="text-base leading-relaxed">
              Ologywood is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will take steps to delete such information and terminate the child's account. If you believe we have collected information from a child under 13, please contact us immediately at <a href="mailto:info@ologywood.com" className="text-primary hover:underline">info@ologywood.com</a>.
            </p>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">8. International Data Transfers</h2>
            <p className="text-base leading-relaxed">
              Your information may be transferred to, stored in, and processed in countries other than your country of residence. These countries may have data protection laws that differ from your home country. By using Ologywood, you consent to the transfer of your information to countries outside your country of residence, which may have different data protection rules.
            </p>
          </section>

          {/* GDPR and Privacy Laws */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">9. GDPR and Privacy Law Compliance</h2>
            <p className="text-base leading-relaxed">
              If you are a resident of the European Union, United Kingdom, or other jurisdictions with privacy laws similar to GDPR, you have additional rights:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Legal Basis:</strong> We process your data based on your consent, contract performance, legal obligation, or legitimate interests</li>
              <li><strong>Data Protection Officer:</strong> You can contact our privacy team for any data protection concerns</li>
              <li><strong>Complaints:</strong> You have the right to lodge a complaint with your local data protection authority</li>
              <li><strong>Right to Restrict Processing:</strong> You can request that we restrict how we use your data</li>
              <li><strong>Right to Object:</strong> You can object to certain types of data processing</li>
            </ul>
          </section>

          {/* Third-Party Links */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">10. Third-Party Links</h2>
            <p className="text-base leading-relaxed">
              Our platform may contain links to third-party websites and services that are not operated by Ologywood. This Privacy Policy does not apply to third-party websites, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party services before providing your information.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">11. Contact Us</h2>
            <p className="text-base leading-relaxed">
              If you have questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4 space-y-2 text-base">
              <p><strong>Ologywood</strong></p>
              <p>Email: <a href="mailto:info@ologywood.com" className="text-primary hover:underline">info@ologywood.com</a></p>
              <p>Phone: <a href="tel:678-525-0891" className="text-primary hover:underline">678-525-0891</a></p>
              <p>Address: 171 Prestwick Dr, Hoschton, GA</p>
            </div>
          </section>

          {/* Policy Changes */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-base leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by updating the "Last updated" date at the top of this policy and, if required, by obtaining your consent. Your continued use of Ologywood after any changes constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row gap-4 justify-between">
          <Link href="/terms-of-service">
            <Button variant="outline" className="w-full sm:w-auto">
              View Terms of Service
            </Button>
          </Link>
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
