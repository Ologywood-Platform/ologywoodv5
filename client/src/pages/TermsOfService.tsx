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
        <p className="text-sm text-muted-foreground mb-2">
          Last updated: May 18, 2026
        </p>
        <p className="text-sm text-muted-foreground mb-8 italic">
          DRAFT — Subject to legal review. This document is provided for informational purposes and will be finalized upon review by legal counsel.
        </p>

        <div className="prose prose-sm sm:prose max-w-none space-y-6">

          {/* 1. Agreement to Terms */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Agreement to Terms</h2>
            <p className="text-base leading-relaxed">
              By accessing and using the Ologywood platform at www.ologywood.com and our progressive web application (collectively, the "Platform"), you accept and agree to be bound by these Terms of Service ("Terms"). Ologywood is an artist booking and career management platform that connects performing artists with venues, event organizers, and fans. If you do not agree to these Terms, please do not use the Platform.
            </p>
            <p className="text-base leading-relaxed mt-4">
              We may update these Terms at any time by posting the revised version with an updated "Last updated" date. Material changes will be communicated via email or in-app notification at least fourteen (14) days before they take effect. Your continued use of the Platform after changes are posted constitutes acceptance of the revised Terms. If you do not agree to the revised Terms, you must discontinue use of the Platform before the effective date.
            </p>
          </section>

          {/* 2. Platform Role and Relationship */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Platform Role and Relationship</h2>
            <p className="text-base leading-relaxed">
              <strong>Ologywood is a technology platform that provides tools for artists to manage their careers.</strong> Ologywood is not a talent agency, booking agent, promoter, venue operator, employer, payment processor, escrow agent, financial institution, or party to any agreement between users. Ologywood does not employ, endorse, recommend, or guarantee any artist, venue, or event organizer on the Platform.
            </p>
            <p className="text-base leading-relaxed mt-4">
              The Platform provides tools including, but not limited to: artist profile hosting, booking request management, rider contract creation and e-signature, event ticketing, digital music release distribution, fan engagement features, messaging, and payment facilitation through third-party processors. All contractual relationships for performances, events, and services are solely between the contracting parties (artists, venues, and/or event organizers). Ologywood has no obligation to enforce, mediate, or adjudicate the terms of any agreement entered into between users.
            </p>
          </section>

          {/* 3. Eligibility and Accounts */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">3. Eligibility and Accounts</h2>
            <p className="text-base leading-relaxed">
              You must be at least eighteen (18) years old to create an account and use the Platform. By creating an account, you represent and warrant that you are at least 18 years of age, that you have the legal capacity to enter into a binding agreement, and that all information you provide is accurate and complete. If you are creating an account on behalf of a business entity (such as a band, production company, or venue), you represent that you have the authority to bind that entity to these Terms.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Accounts are created through our OAuth authentication provider. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. You must notify us immediately at <a href="mailto:support@ologywood.com" className="text-primary hover:underline">support@ologywood.com</a> if you suspect unauthorized access to your account. Ologywood is not liable for any loss or damage arising from unauthorized use of your account.
            </p>
          </section>

          {/* 4. User Roles and Profiles */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">4. User Roles and Profiles</h2>
            <p className="text-base leading-relaxed">
              The Platform supports three user roles: <strong>Artists</strong> (solo performers, bands, DJs, speakers, and other entertainers), <strong>Venues</strong> (event spaces, clubs, restaurants, corporate event organizers, and other performance locations), and <strong>Fans</strong> (users who follow artists, discover events, purchase tickets, and buy music releases). Each role has specific profile requirements and features. Users may hold only one role per account.
            </p>
            <p className="text-base leading-relaxed mt-4">
              You are responsible for the accuracy of all profile information, including your bio, photos, location, genre, rates, and availability. Profiles that contain false, misleading, or fraudulent information may be suspended or terminated without notice. Public profile information (name, photo, bio, genre, location) is visible to all Platform users and may appear in search results and social media previews.
            </p>
          </section>

          {/* 5. Content Ownership and Licensing */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Content Ownership and Licensing</h2>
            <p className="text-base leading-relaxed">
              <strong>You retain full ownership of all content you upload, create, or submit to the Platform.</strong> This includes, without limitation, profile photos, music recordings, album artwork, videos, performance media, rider templates, contract documents, event descriptions, blog posts, and any other materials you provide ("Your Content"). Ologywood does not claim any ownership interest in Your Content.
            </p>
            <p className="text-base leading-relaxed mt-4">
              By uploading Your Content to the Platform, you grant Ologywood a limited, non-exclusive, royalty-free, revocable license to host, store, display, reproduce, and distribute Your Content <strong>solely for the purpose of operating the Platform and providing the services you have requested.</strong> This license includes the right to display Your Content on your public profile, in search results, in social media previews (Open Graph), and in connection with the features you use (such as event listings, music releases, and booking pages). This license does not grant Ologywood the right to sell, sublicense, or commercially exploit Your Content for any purpose unrelated to operating the Platform.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Content removal:</strong> You may remove Your Content at any time through your account settings or by contacting us. Upon removal or account deletion, Ologywood will remove Your Content from public display within a commercially reasonable timeframe. Copies of Your Content may be retained in backups for up to thirty (30) days after deletion, after which they will be permanently purged. Content that has been incorporated into executed contracts or completed transactions may be retained as part of the transaction record as required by law or for dispute resolution purposes.
            </p>
            <p className="text-base leading-relaxed mt-4">
              You represent and warrant that you own or have obtained all necessary rights, licenses, and permissions for all content you upload, and that Your Content does not infringe upon the intellectual property rights, privacy rights, or any other rights of any third party. You are solely responsible for ensuring that your music, images, and other media comply with all applicable copyright laws.
            </p>
          </section>

          {/* 6. Bookings */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Bookings</h2>
            <p className="text-base leading-relaxed">
              Ologywood facilitates bookings between artists and venues or event organizers by providing tools to submit, review, accept, and manage booking requests. A booking is created when one party submits a booking request and the other party accepts it. By submitting or accepting a booking, both parties agree to the event details, date, time, location, and agreed fee specified in the booking.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Ologywood acts solely as a facilitator and is not a party to any booking agreement.</strong> The contractual relationship for a performance is exclusively between the artist and the venue or organizer. Ologywood is not responsible for the quality of performances, venue conditions, artist conduct, venue safety, or any disputes arising from the booking. Both parties are expected to communicate promptly through the Platform's messaging system regarding any changes, special requirements, or concerns related to the booking.
            </p>
          </section>

          {/* 7. Rider Contracts and E-Signatures */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Rider Contracts and E-Signatures</h2>
            <p className="text-base leading-relaxed">
              Artists may create rider templates specifying their technical requirements (sound, lighting, stage setup), hospitality needs (green room, meals, beverages), payment terms, cancellation policies, and other performance conditions. Rider templates can be attached to bookings to form part of the booking agreement between the parties.
            </p>
            <p className="text-base leading-relaxed mt-4">
              The Platform provides an electronic signature (e-signature) system for signing rider contracts. By using the e-signature feature, you acknowledge and agree that: (a) your electronic signature is legally binding and carries the same legal effect as a handwritten signature under the Electronic Signatures in Global and National Commerce Act (E-SIGN Act) and the Uniform Electronic Transactions Act (UETA); (b) when you sign a contract, the Platform records your signature (drawn or typed), the signing timestamp, your IP address, and your user agent for verification purposes; and (c) you consent to conducting this transaction electronically.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Both the artist and the venue or organizer must sign a rider contract for it to be considered fully executed. <strong>Ologywood stores signed contracts and makes them available to both parties but does not enforce, interpret, or adjudicate the terms of rider contracts.</strong> The terms of each rider contract, including but not limited to payout timing, cancellation penalties, and performance obligations, are solely between the contracting parties. Any disputes regarding rider contract terms must be resolved directly between the parties or through appropriate legal channels.
            </p>
          </section>

          {/* 8. Payments, Fees, and Payouts */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">8. Payments, Fees, and Payouts</h2>
            <p className="text-base leading-relaxed">
              All payments on the Platform are processed by Stripe, Inc. ("Stripe"), a third-party payment processor. By making or receiving a payment through the Platform, you agree to Stripe's <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms of Service</a> and <a href="https://stripe.com/connect-account/legal" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Connected Account Agreement</a>. <strong>Ologywood is not a payment processor, escrow agent, money transmitter, or financial institution.</strong> Ologywood does not hold, custody, or control user funds at any time. All payments are processed and disbursed directly by Stripe.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.1 Platform Fee Schedule</h3>
            <p className="text-base leading-relaxed">
              Ologywood charges the following fees for use of the Platform's payment facilitation services:
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Transaction Type</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Platform Fee</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Artist Receives</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Booking Payments (deposit and final)</td>
                    <td className="border border-gray-200 px-4 py-2">1% of transaction amount</td>
                    <td className="border border-gray-200 px-4 py-2">99% (direct to artist's connected Stripe account)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">Digital Music Release Sales (singles, albums)</td>
                    <td className="border border-gray-200 px-4 py-2">1% of sale price</td>
                    <td className="border border-gray-200 px-4 py-2">99% of sale price</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Event Ticket Sales</td>
                    <td className="border border-gray-200 px-4 py-2">$0.99 flat fee per ticket</td>
                    <td className="border border-gray-200 px-4 py-2">Ticket price minus $0.99 per ticket</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">Fan Tips and Donations</td>
                    <td className="border border-gray-200 px-4 py-2"><strong>No platform fee (0%)</strong></td>
                    <td className="border border-gray-200 px-4 py-2">100% of tip amount</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Note: Standard Stripe processing fees (currently 2.9% + $0.30 per transaction) apply to all transactions and are separate from Ologywood's platform fees. These fees are set by Stripe and are subject to change per Stripe's terms.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Ologywood reserves the right to modify its fee schedule with at least thirty (30) days' advance written notice to affected users. Fee changes will not apply retroactively to transactions already completed.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.2 Stripe Connect and Direct Payouts</h3>
            <p className="text-base leading-relaxed">
              Artists may connect their own Stripe account to the Platform through Stripe Connect. When an artist has a connected Stripe account, booking payments, release sales, ticket revenue, and fan tips are routed directly to the artist's connected bank account by Stripe, minus any applicable platform fees and Stripe processing fees. <strong>Ologywood does not hold, delay, or control the timing of these payouts.</strong> Payout timing is determined by Stripe's standard payout schedule and the artist's Stripe account settings.
            </p>
            <p className="text-base leading-relaxed mt-4">
              If an artist has not connected a Stripe account, payments for bookings will be processed through Ologywood's Stripe account and held until the artist completes Stripe Connect onboarding. Ologywood will make reasonable efforts to notify the artist of pending funds.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.3 Booking Payment Structure</h3>
            <p className="text-base leading-relaxed">
              Booking payments are structured as follows unless otherwise specified in the rider contract between the parties:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Deposit:</strong> A deposit (typically 50% of the agreed total fee, unless otherwise specified in the rider contract) is due upon booking confirmation. The deposit amount may be customized by the parties in the booking agreement or rider contract.</li>
              <li><strong>Final Payment:</strong> The remaining balance is due prior to or on the date of the event, as agreed between the parties.</li>
            </ul>
            <p className="text-base leading-relaxed mt-4">
              <strong>Payout timing for booking payments is governed by the individual rider contract or booking agreement between the artist and the venue/organizer.</strong> Ologywood does not impose or enforce payout timing requirements. Artists and venues are encouraged to clearly specify payment milestones and timing in their rider contracts.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.4 Subscriptions</h3>
            <p className="text-base leading-relaxed">
              Certain premium features of the Platform require a paid subscription plan. Subscription fees are billed on a recurring basis (monthly or annually, as selected) through Stripe. By subscribing, you authorize Ologywood to charge your payment method on a recurring basis at the then-current subscription rate until you cancel.
            </p>
            <p className="text-base leading-relaxed mt-4">
              You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period, and you will retain access to premium features until that date. <strong>Subscription fees are non-refundable</strong> except where required by applicable law. Ologywood reserves the right to modify subscription pricing with at least thirty (30) days' advance notice. Price changes will take effect at the start of your next billing cycle following the notice period.
            </p>
          </section>

          {/* 9. Fan Tips and Donations */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">9. Fan Tips and Donations</h2>
            <p className="text-base leading-relaxed">
              The Platform allows fans to send voluntary monetary tips and donations directly to artists through the Platform's tip jar feature, QR code tipping at live events, and pay-what-you-want pricing on music releases. <strong>Ologywood charges no platform fee on fan tips and donations.</strong> One hundred percent (100%) of the tip amount goes to the artist, minus only the standard Stripe processing fees.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Tips and donations are voluntary, non-refundable, and do not create any obligation on the part of the artist to provide goods, services, or performances in return. Tips are not tax-deductible contributions. <strong>Artists are solely responsible for reporting and paying all applicable taxes on tips and donations received through the Platform.</strong> Ologywood does not provide tax advice and will not issue tax forms (such as IRS Form 1099) for tips processed through Stripe Connect; Stripe may issue such forms directly to artists in accordance with applicable tax laws.
            </p>
          </section>

          {/* 10. Refunds and Cancellations */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">10. Refunds and Cancellations</h2>
            <p className="text-base leading-relaxed">
              Refund and cancellation terms are primarily governed by the rider contract or booking agreement between the parties. Ologywood encourages all parties to clearly specify cancellation and refund terms in their rider contracts before confirming a booking. <strong>Ologywood does not guarantee, process, or adjudicate refunds between users.</strong> Refunds for booking payments are handled through Stripe based on the terms agreed upon by the parties.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.1 Default Cancellation Policy</h3>
            <p className="text-base leading-relaxed">
              If no specific cancellation terms are agreed upon in the rider contract or booking agreement, the following default policy applies:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Artist cancels (any time):</strong> The venue or organizer receives a full refund of all payments made (deposit and/or final payment).</li>
              <li><strong>Venue/organizer cancels before deposit payment:</strong> No charge; booking is cancelled with no financial obligation.</li>
              <li><strong>Venue/organizer cancels after deposit payment:</strong> The deposit is non-refundable and is retained by the artist. If the full fee has been paid, only the final payment (balance beyond the deposit) is refunded.</li>
              <li><strong>Cancellations more than 30 days before the event:</strong> Full deposit refund.</li>
              <li><strong>Cancellations 14 to 30 days before the event:</strong> 50% deposit refund.</li>
              <li><strong>Cancellations less than 14 days before the event:</strong> No deposit refund.</li>
            </ul>
            <p className="text-base leading-relaxed mt-4">
              Both parties should communicate cancellations promptly through the Platform. Repeated cancellations without reasonable cause may result in account restrictions or suspension.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.2 Ticket Refunds</h3>
            <p className="text-base leading-relaxed">
              Refund policies for event tickets are set by the event organizer (artist or venue) at the time of event creation. Ticket purchasers should review the refund policy displayed on the event page before purchasing. If an event is cancelled by the organizer, ticket purchasers are entitled to a full refund. Ologywood's $0.99 per-ticket platform fee is non-refundable.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.3 Digital Release Refunds</h3>
            <p className="text-base leading-relaxed">
              Due to the nature of digital goods, purchases of music releases (singles, albums) are generally non-refundable once the download has been accessed. If a download link is defective or the file is corrupted, the purchaser may contact the artist or Ologywood support for a replacement or refund at the artist's discretion.
            </p>
          </section>

          {/* 11. Payment Disputes and Chargebacks */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">11. Payment Disputes and Chargebacks</h2>
            <p className="text-base leading-relaxed">
              <strong>All payment disputes and chargebacks are handled directly by Stripe, our third-party payment processor.</strong> Ologywood does not process, hold, or control user funds at any point during a transaction or dispute. Stripe manages the entire dispute and chargeback lifecycle in accordance with card network rules (Visa, Mastercard, American Express, etc.) and applicable financial regulations.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.1 How Disputes and Chargebacks Work</h3>
            <p className="text-base leading-relaxed">
              If a cardholder (buyer) initiates a payment dispute or chargeback with their bank or card issuer, Stripe will:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li>Notify the relevant parties (seller/artist) of the dispute</li>
              <li>Collect evidence from both parties as needed</li>
              <li>Submit evidence to the card network on behalf of the seller</li>
              <li>Manage the dispute timeline and resolution process</li>
              <li>Communicate the final outcome to all parties</li>
            </ul>
            <p className="text-base leading-relaxed mt-4">
              <strong>Ologywood is not a party to the chargeback or dispute process.</strong> We do not make decisions on dispute outcomes, hold funds in escrow during disputes, or have the ability to override Stripe's or the card network's determination. The resolution is determined solely by Stripe and the relevant card network based on the evidence provided.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.2 Seller (Artist/Venue) Responsibilities</h3>
            <p className="text-base leading-relaxed">
              If you receive a payment and a dispute is filed against that transaction, you may be asked by Stripe to provide evidence supporting the legitimacy of the charge (e.g., signed contracts, proof of service delivery, communication records). It is your responsibility to respond to Stripe's evidence requests within the timeframes specified. Failure to respond may result in the dispute being resolved in the buyer's favor.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.3 Buyer Protection</h3>
            <p className="text-base leading-relaxed">
              Buyers are protected by their card issuer's standard dispute rights. If you believe a charge is unauthorized, fraudulent, or for services not delivered, you may file a dispute directly with your bank or card issuer. Stripe will manage the dispute process in accordance with card network rules. For more information, refer to <a href="https://stripe.com/docs/disputes" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe's dispute documentation</a>.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.4 Platform Dispute Resolution (Non-Binding)</h3>
            <p className="text-base leading-relaxed">
              In addition to Stripe's formal chargeback process, Ologywood provides an in-app dispute resolution tool as a courtesy. This tool allows parties to document issues and communicate about booking-related disagreements. <strong>Ologywood's dispute resolution system is a courtesy tool, not a binding arbitration or mediation service.</strong> Ologywood may, at its sole discretion, review disputes and make non-binding recommendations, but has no obligation to resolve disputes or enforce any resolution. For disputes involving amounts exceeding $5,000 or allegations of fraud, users are advised to seek resolution through appropriate legal channels.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.5 Prohibited Conduct</h3>
            <p className="text-base leading-relaxed">
              Users who initiate frivolous, fraudulent, or bad-faith chargebacks may have their accounts suspended or permanently terminated. Repeated abuse of the chargeback process is a violation of these Terms and may result in legal action.
            </p>
          </section>

          {/* 12. Force Majeure */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">12. Force Majeure</h2>
            <p className="text-base leading-relaxed">
              Neither Ologywood nor any user shall be liable for failure to perform obligations under these Terms or any booking agreement facilitated through the Platform if such failure results from circumstances beyond the party's reasonable control, including but not limited to: natural disasters, severe weather events, pandemics or public health emergencies, government orders or restrictions, acts of terrorism, civil unrest, power outages, internet service disruptions, or other events commonly recognized as force majeure.
            </p>
            <p className="text-base leading-relaxed mt-4">
              In the event of a force majeure affecting a booked event, the parties should communicate promptly through the Platform to discuss rescheduling or cancellation. Refund terms for force majeure cancellations should be specified in the rider contract. If no force majeure terms are specified, the default cancellation policy in Section 10.1 applies. Ologywood is not responsible for determining whether a force majeure event has occurred or for mediating force majeure disputes between users.
            </p>
          </section>

          {/* 13. Messaging and Communications */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">13. Messaging and Communications</h2>
            <p className="text-base leading-relaxed">
              The Platform provides in-app messaging for communication between users regarding bookings and events. Artists may also send email update blasts to their followers through the Platform. By following an artist, you consent to receiving their update emails. You may unfollow an artist or unsubscribe from emails at any time through the unsubscribe link included in every email or through your account settings.
            </p>
            <p className="text-base leading-relaxed mt-4">
              You agree not to use the messaging system for spam, harassment, solicitation of services outside the Platform, distribution of malware, or any other purpose unrelated to legitimate booking and event communication. Ologywood does not monitor the content of private messages but reserves the right to investigate reports of abuse and take appropriate action, including account suspension.
            </p>
          </section>

          {/* 14. Prohibited Conduct */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">14. Prohibited Conduct</h2>
            <p className="text-base leading-relaxed">
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li>Create fake profiles or misrepresent your identity, qualifications, or experience</li>
              <li>Harass, threaten, discriminate against, or abuse other users</li>
              <li>Post false, misleading, or defamatory content</li>
              <li>Attempt to circumvent the Platform to avoid fees or conduct transactions outside the Platform for services initially arranged through the Platform</li>
              <li>Scrape, crawl, or use automated tools to extract data from the Platform without written permission</li>
              <li>Upload viruses, malicious code, or any material that could damage the Platform or its users</li>
              <li>Attempt to gain unauthorized access to other users' accounts or Platform systems</li>
              <li>Use the Platform for any illegal purpose or in violation of any applicable laws</li>
              <li>Infringe on the intellectual property rights of Ologywood or any third party</li>
              <li>Upload content that you do not own or do not have the rights to distribute</li>
              <li>Initiate fraudulent chargebacks or payment reversals</li>
              <li>Create multiple accounts to circumvent account restrictions or bans</li>
            </ul>
          </section>

          {/* 15. DMCA and Copyright */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">15. DMCA and Copyright Compliance</h2>
            <p className="text-base leading-relaxed">
              Ologywood respects the intellectual property rights of others and expects users to do the same. We comply with the Digital Millennium Copyright Act (DMCA) and will respond to valid notices of alleged copyright infringement. Our full DMCA policy, including instructions for submitting takedown notices and counter-notices, is available at <Link href="/dmca-policy" className="text-primary hover:underline">www.ologywood.com/dmca-policy</Link>.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Repeat infringers will have their accounts terminated in accordance with our repeat infringer policy.
            </p>
          </section>

          {/* 16. Account Suspension and Termination */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">16. Account Suspension and Termination</h2>
            <p className="text-base leading-relaxed">
              Ologywood reserves the right to suspend or terminate your account at any time, with or without notice, for violations of these Terms, fraudulent activity, repeated chargebacks, or any conduct that we determine is harmful to other users or the Platform. Upon termination, your right to use the Platform ceases immediately. Any pending bookings at the time of termination will be handled on a case-by-case basis.
            </p>
            <p className="text-base leading-relaxed mt-4">
              You may delete your account at any time by contacting us at <a href="mailto:support@ologywood.com" className="text-primary hover:underline">support@ologywood.com</a>. Upon account deletion: (a) your public profile will be removed from the Platform; (b) Your Content will be removed from public display in accordance with Section 5; (c) your Stripe Connect account connection will be severed (your Stripe account itself remains yours); and (d) account deletion is subject to the data retention terms described in our <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>. Executed contracts and completed transaction records may be retained as required by law.
            </p>
          </section>

          {/* 17. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">17. Intellectual Property</h2>
            <p className="text-base leading-relaxed">
              The Platform and its original contents, features, and functionality (including but not limited to software, code, text, images, logos, design, and user interface) are owned by Ologywood and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property laws. The Ologywood™ name, logo, and all related marks are trademarks of Ologywood. You may not copy, modify, distribute, sell, or create derivative works from any part of the Platform without our prior written permission.
            </p>
            <p className="text-base leading-relaxed mt-4">
              This section applies to Ologywood's own intellectual property and does not affect your ownership of Your Content as described in Section 5.
            </p>
          </section>

          {/* 18. Disclaimer of Warranties */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">18. Disclaimer of Warranties</h2>
            <p className="text-base leading-relaxed">
              THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. OLOGYWOOD EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. OLOGYWOOD DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. OLOGYWOOD DOES NOT GUARANTEE THE QUALITY, RELIABILITY, AVAILABILITY, PROFESSIONALISM, OR SUITABILITY OF ANY ARTIST, VENUE, EVENT, OR SERVICE LISTED ON THE PLATFORM.
            </p>
            <p className="text-base leading-relaxed mt-4">
              OLOGYWOOD DOES NOT WARRANT OR GUARANTEE THAT: (A) ANY BOOKING WILL BE FULFILLED AS AGREED BETWEEN THE PARTIES; (B) ANY PAYMENT WILL BE PROCESSED WITHOUT ERROR OR DELAY; (C) ANY ARTIST OR VENUE WILL PERFORM AS REPRESENTED; OR (D) THE PLATFORM WILL MEET YOUR SPECIFIC REQUIREMENTS. YOUR USE OF THE PLATFORM IS AT YOUR SOLE RISK.
            </p>
          </section>

          {/* 19. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">19. Limitation of Liability</h2>
            <p className="text-base leading-relaxed">
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, OLOGYWOOD, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUES, DATA, GOODWILL, OR BUSINESS OPPORTUNITIES ARISING FROM OR RELATED TO YOUR USE OF THE PLATFORM, REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, TORT, STRICT LIABILITY, OR OTHERWISE), EVEN IF OLOGYWOOD HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="text-base leading-relaxed mt-4">
              THIS LIMITATION INCLUDES, WITHOUT LIMITATION, DAMAGES ARISING FROM: BOOKING DISPUTES OR CANCELLATIONS; PAYMENT PROCESSING ERRORS, DELAYS, OR FAILURES; PERFORMANCE QUALITY OR NON-PERFORMANCE; RIDER CONTRACT DISAGREEMENTS; CHARGEBACKS OR PAYMENT REVERSALS; LOSS OF REVENUE DUE TO EVENT CANCELLATIONS; PERSONAL INJURY OR PROPERTY DAMAGE AT EVENTS; OR ANY ACTIONS OR OMISSIONS OF OTHER PLATFORM USERS.
            </p>
            <p className="text-base leading-relaxed mt-4">
              IN NO EVENT SHALL OLOGYWOOD'S TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR YOUR USE OF THE PLATFORM EXCEED THE GREATER OF: (A) THE TOTAL PLATFORM FEES PAID BY YOU TO OLOGYWOOD IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM; OR (B) ONE HUNDRED DOLLARS ($100.00).
            </p>
          </section>

          {/* 20. Indemnification */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">20. Indemnification</h2>
            <p className="text-base leading-relaxed">
              You agree to indemnify, defend, and hold harmless Ologywood and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees and court costs) arising from or related to: (a) your use of the Platform; (b) Your Content; (c) your violation of these Terms; (d) your violation of any applicable law or regulation; (e) your violation of any rights of another user or third party; (f) any booking, contract, or transaction you enter into through the Platform; or (g) any dispute between you and another user.
            </p>
          </section>

          {/* 21. Governing Law and Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">21. Governing Law and Dispute Resolution</h2>
            <p className="text-base leading-relaxed">
              These Terms are governed by and construed in accordance with the laws of the State of Georgia, United States, without regard to its conflict of law principles. Any legal action, suit, or proceeding arising from or related to these Terms or your use of the Platform shall be brought exclusively in the state or federal courts located in Gwinnett County, Georgia, and you consent to the personal jurisdiction and venue of such courts.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Before initiating any legal proceeding, you agree to first attempt to resolve the dispute informally by contacting Ologywood at <a href="mailto:legal@ologywood.com" className="text-primary hover:underline">legal@ologywood.com</a>. Ologywood will attempt to resolve the dispute informally within thirty (30) days. If the dispute is not resolved informally, either party may proceed with formal legal action as described above.
            </p>
          </section>

          {/* 22. General Provisions */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">22. General Provisions</h2>
            <p className="text-base leading-relaxed">
              <strong>Entire Agreement:</strong> These Terms, together with our <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>, <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>, <Link href="/dmca-policy" className="text-primary hover:underline">DMCA Policy</Link>, and any rider contracts or booking agreements entered into through the Platform, constitute the entire agreement between you and Ologywood regarding your use of the Platform.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Severability:</strong> If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving its original intent.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Waiver:</strong> The failure of Ologywood to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision. Any waiver must be in writing and signed by an authorized representative of Ologywood.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Assignment:</strong> You may not assign or transfer your rights or obligations under these Terms without Ologywood's prior written consent. Ologywood may assign its rights and obligations under these Terms without restriction.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Notices:</strong> Ologywood may provide notices to you via email to the address associated with your account, through in-app notifications, or by posting on the Platform. You are responsible for keeping your email address current. Notices to Ologywood should be sent to <a href="mailto:legal@ologywood.com" className="text-primary hover:underline">legal@ologywood.com</a>.
            </p>
          </section>

          {/* 23. Contact Information */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">23. Contact Information</h2>
            <p className="text-base leading-relaxed">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4 space-y-2 text-base">
              <p><strong>Ologywood</strong></p>
              <p>General: <a href="mailto:hello@ologywood.com" className="text-primary hover:underline">hello@ologywood.com</a></p>
              <p>Support: <a href="mailto:support@ologywood.com" className="text-primary hover:underline">support@ologywood.com</a></p>
              <p>Legal: <a href="mailto:legal@ologywood.com" className="text-primary hover:underline">legal@ologywood.com</a></p>
              <p>Phone: <a href="tel:678-525-0891" className="text-primary hover:underline">678-525-0891</a></p>
              <p>Address: 171 Prestwick Dr, Hoschton, GA 30548</p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-4 flex-wrap">
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
            <Link href="/dmca-policy">
              <Button variant="outline" className="w-full sm:w-auto">
                DMCA Policy
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
