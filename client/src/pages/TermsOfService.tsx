import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: February 28, 2026
        </p>

        <div className="prose prose-sm sm:prose max-w-none space-y-6">
          {/* Agreement to Terms */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Agreement to Terms</h2>
            <p className="text-base leading-relaxed">
              By accessing and using the Ologywood platform at www.ologywood.com and our progressive web application (collectively, the "Platform"), you accept and agree to be bound by these Terms of Service ("Terms"). Ologywood is an artist booking platform that connects performing artists with venues and event organizers. If you do not agree to these Terms, please do not use the Platform. We may update these Terms at any time by posting the revised version with an updated "Last updated" date. Your continued use of the Platform after changes are posted constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* Eligibility and Accounts */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Eligibility and Accounts</h2>
            <p className="text-base leading-relaxed">
              You must be at least 18 years old to create an account and use the Platform. By creating an account, you represent that you are at least 18 years of age and that all information you provide is accurate and complete. Accounts are created through our OAuth authentication provider. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. You must notify us immediately if you suspect unauthorized access to your account.
            </p>
          </section>

          {/* User Roles */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">3. User Roles and Profiles</h2>
            <p className="text-base leading-relaxed">
              The Platform supports three user roles: <strong>Artists</strong> (solo performers, bands, DJs, speakers, and other entertainers), <strong>Venues</strong> (event spaces, clubs, restaurants, and other performance locations), and <strong>Fans</strong> (users who follow artists and discover events). Each role has specific profile requirements and features.
            </p>
            <p className="text-base leading-relaxed mt-4">
              You are responsible for the accuracy of all profile information, including your bio, photos, location, genre, rates, and availability. Profiles that contain false, misleading, or fraudulent information may be suspended or terminated. Public profile information (name, photo, bio, genre, location) is visible to all Platform users and may appear in search results.
            </p>
          </section>

          {/* Bookings */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">4. Bookings</h2>
            <p className="text-base leading-relaxed">
              Ologywood facilitates bookings between artists and venues or event organizers. A booking is created when one party submits a booking request and the other party accepts it. By submitting or accepting a booking, both parties agree to the event details, date, time, location, and agreed fee specified in the booking.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Ologywood acts as a facilitator, not a party to the booking agreement.</strong> The contractual relationship for a performance is between the artist and the venue or organizer. Ologywood is not responsible for the quality of performances, venue conditions, or any disputes arising from the booking itself.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Both parties are expected to communicate promptly through the Platform's messaging system regarding any changes, special requirements, or concerns related to the booking.
            </p>
          </section>

          {/* Rider Contracts and E-Signatures */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Rider Contracts and E-Signatures</h2>
            <p className="text-base leading-relaxed">
              Artists may create rider templates specifying their technical requirements (sound, lighting, stage setup), hospitality needs (green room, meals, beverages), and other performance conditions. Rider templates can be attached to bookings to form part of the booking agreement.
            </p>
            <p className="text-base leading-relaxed mt-4">
              The Platform provides an electronic signature (e-signature) system for signing rider contracts. By using the e-signature feature, you agree that your electronic signature is legally binding and has the same legal effect as a handwritten signature. When you sign a contract, the Platform records your signature (drawn or typed), the signing timestamp, and your IP address for verification purposes.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Both the artist and the venue or organizer must sign a rider contract for it to be considered fully executed. Ologywood stores signed contracts and makes them available to both parties but does not enforce the terms of rider contracts. Disputes regarding rider contract terms are between the contracting parties.
            </p>
          </section>

          {/* Payments */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Payments and Fees</h2>
            <p className="text-base leading-relaxed">
              Payments on the Platform are processed securely through Stripe. By making a payment, you agree to Stripe's <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms of Service</a>. You are responsible for providing accurate payment information and maintaining sufficient funds.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Deposits:</strong> Bookings typically require a deposit to confirm. The deposit amount is agreed upon between the artist and the venue or organizer. Deposits are processed through Stripe at the time of booking confirmation.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Subscriptions:</strong> Certain premium features may require a paid subscription. Subscription fees are billed on a recurring basis through Stripe. You may cancel your subscription at any time through your account settings or by contacting us. Cancellation takes effect at the end of the current billing period.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Refunds:</strong> Refund eligibility depends on the cancellation terms agreed upon between the booking parties. Ologywood does not guarantee refunds and is not responsible for payment disputes between users. For payment issues, contact our support team.
            </p>
          </section>

          {/* Cancellations */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Cancellations</h2>
            <p className="text-base leading-relaxed">
              Cancellation terms are specified in the rider contract or booking agreement between the parties. If no specific cancellation terms are agreed upon, the following default policy applies:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li>Cancellations made more than 30 days before the event: full deposit refund</li>
              <li>Cancellations made 14–30 days before the event: 50% deposit refund</li>
              <li>Cancellations made less than 14 days before the event: no deposit refund</li>
            </ul>
            <p className="text-base leading-relaxed mt-4">
              Both parties should communicate cancellations promptly through the Platform. Repeated cancellations without reasonable cause may result in account restrictions.
            </p>
          </section>

          {/* User Content */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">8. User-Generated Content</h2>
            <p className="text-base leading-relaxed">
              By submitting content to the Platform (including profile information, photos, messages, reviews, rider templates, and event descriptions), you grant Ologywood a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such content solely for the purpose of operating and improving the Platform. You retain ownership of your content.
            </p>
            <p className="text-base leading-relaxed mt-4">
              You represent that you own or have the necessary rights to all content you submit and that it does not violate any third-party rights or applicable laws. Ologywood reserves the right to remove content that violates these Terms or is otherwise objectionable, without prior notice.
            </p>
          </section>

          {/* Messaging and Communications */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">9. Messaging and Communications</h2>
            <p className="text-base leading-relaxed">
              The Platform provides in-app messaging for communication between users regarding bookings and events. Artists may also send email update blasts to their followers through the Platform. By following an artist, you consent to receiving their update emails. You may unfollow an artist or unsubscribe from emails at any time.
            </p>
            <p className="text-base leading-relaxed mt-4">
              You agree not to use the messaging system for spam, harassment, solicitation of services outside the Platform, or any other purpose unrelated to legitimate booking and event communication.
            </p>
          </section>

          {/* Prohibited Conduct */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">10. Prohibited Conduct</h2>
            <p className="text-base leading-relaxed">
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li>Create fake profiles or misrepresent your identity, qualifications, or experience</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Post false, misleading, or defamatory content</li>
              <li>Attempt to circumvent the Platform to avoid fees or conduct transactions outside the Platform</li>
              <li>Scrape, crawl, or use automated tools to extract data from the Platform</li>
              <li>Upload viruses, malicious code, or any material that could damage the Platform</li>
              <li>Attempt to gain unauthorized access to other users' accounts or Platform systems</li>
              <li>Use the Platform for any illegal purpose or in violation of any applicable laws</li>
              <li>Infringe on the intellectual property rights of Ologywood or any third party</li>
            </ul>
          </section>

          {/* Account Termination */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">11. Account Suspension and Termination</h2>
            <p className="text-base leading-relaxed">
              Ologywood reserves the right to suspend or terminate your account at any time, with or without notice, for violations of these Terms, fraudulent activity, or any conduct that we determine is harmful to other users or the Platform. Upon termination, your right to use the Platform ceases immediately. Any pending bookings at the time of termination will be handled on a case-by-case basis.
            </p>
            <p className="text-base leading-relaxed mt-4">
              You may delete your account at any time by contacting us at <a href="mailto:info@ologywood.com" className="text-primary hover:underline">info@ologywood.com</a>. Account deletion is subject to the data retention terms described in our <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">12. Intellectual Property</h2>
            <p className="text-base leading-relaxed">
              The Platform and its contents, features, and functionality (including software, text, images, logos, and design) are owned by Ologywood and are protected by United States and international copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works from any part of the Platform without our written permission.
            </p>
          </section>

          {/* Disclaimer of Warranties */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">13. Disclaimer of Warranties</h2>
            <p className="text-base leading-relaxed">
              THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. OLOGYWOOD MAKES NO WARRANTIES, EXPRESS OR IMPLIED, REGARDING THE PLATFORM, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. WE DO NOT GUARANTEE THE QUALITY, RELIABILITY, OR AVAILABILITY OF ANY ARTIST, VENUE, OR EVENT LISTED ON THE PLATFORM.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">14. Limitation of Liability</h2>
            <p className="text-base leading-relaxed">
              TO THE FULLEST EXTENT PERMITTED BY LAW, OLOGYWOOD, ITS DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUES, DATA, OR GOODWILL ARISING FROM YOUR USE OF THE PLATFORM. THIS INCLUDES, WITHOUT LIMITATION, DAMAGES ARISING FROM BOOKING DISPUTES, PAYMENT ISSUES, PERFORMANCE CANCELLATIONS, OR RIDER CONTRACT DISAGREEMENTS BETWEEN USERS.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">15. Indemnification</h2>
            <p className="text-base leading-relaxed">
              You agree to indemnify, defend, and hold harmless Ologywood and its officers, directors, employees, and agents from any claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising from your use of the Platform, your violation of these Terms, or your violation of any rights of another user or third party.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">16. Governing Law</h2>
            <p className="text-base leading-relaxed">
              These Terms are governed by and construed in accordance with the laws of the State of Georgia, United States, without regard to conflict of law principles. Any legal action arising from these Terms or your use of the Platform shall be brought exclusively in the state or federal courts located in Georgia.
            </p>
          </section>

          {/* Entire Agreement */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">17. Entire Agreement</h2>
            <p className="text-base leading-relaxed">
              These Terms, together with our <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>, <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>, and any rider contracts or booking agreements entered into through the Platform, constitute the entire agreement between you and Ologywood regarding your use of the Platform.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">18. Contact Information</h2>
            <p className="text-base leading-relaxed">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4 space-y-2 text-base">
              <p><strong>Ologywood</strong></p>
              <p>Email: <a href="mailto:info@ologywood.com" className="text-primary hover:underline">info@ologywood.com</a></p>
              <p>Phone: <a href="tel:678-525-0891" className="text-primary hover:underline">678-525-0891</a></p>
              <p>Address: 171 Prestwick Dr, Hoschton, GA</p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-4">
            <Link href="/privacy-policy">
              <Button variant="outline" className="w-full sm:w-auto">
                Privacy Policy
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
