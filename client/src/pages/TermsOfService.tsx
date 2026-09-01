import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
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
          Last updated: September 1, 2026
        </p>

        <div className="prose prose-sm sm:prose max-w-none space-y-6">

          {/* 1. Agreement to Terms */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Agreement to Terms</h2>
            <p className="text-base leading-relaxed">
              By accessing and using the Ologywood platform at www.ologywood.com and our progressive web application (collectively, the "Platform"), you accept and agree to be bound by these Terms of Service ("Terms"). Ologywood is a talent booking, fan engagement, and creator-commerce platform that connects music and visual artists, authors and writers, athletes, entertainers, filmmakers, influencers, and other creators with venues, event organizers, readers, and fans. If you do not agree to these Terms, please do not use the Platform.
            </p>
            <p className="text-base leading-relaxed mt-4">
              We may update these Terms at any time by posting the revised version with an updated "Last updated" date. Material changes will be communicated via email or in-app notification at least fourteen (14) days before they take effect. Your continued use of the Platform after changes are posted constitutes acceptance of the revised Terms. If you do not agree to the revised Terms, you must discontinue use of the Platform before the effective date.
            </p>
          </section>

          {/* 2. Platform Role and Relationship */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Platform Role and Relationship</h2>
            <p className="text-base leading-relaxed">
              <strong>Ologywood is a technology platform that provides tools for talent to manage their careers and grow their fan communities.</strong> Ologywood is not a talent agency, booking agent, promoter, venue operator, employer, payment processor, escrow agent, financial institution, or party to any agreement between users. Ologywood does not employ, endorse, recommend, or guarantee any talent, venue, or event organizer on the Platform.
            </p>
            <p className="text-base leading-relaxed mt-4">
              The Platform provides tools including, but not limited to: talent profile hosting, booking request management, rider contract creation and e-signature, event ticketing, Creator Shop sales of merchandise, physical books, and eBooks, digital music releases, content release monetization, Fan Club membership tiers and exclusive content, fan engagement, messaging, and payment facilitation through third-party processors. Ologywood serves as a monetization and commerce layer. Ologywood is not the publisher, printer, distributor, literary agent, or owner of any book offered by a user. All contractual relationships for performances, events, goods, and services are solely between the applicable users, subject to these Terms and the tools Ologywood provides.
            </p>
          </section>

          {/* 3. Eligibility and Accounts */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">3. Eligibility and Accounts</h2>
            <p className="text-base leading-relaxed">
              You must be at least eighteen (18) years old to create an account and use the Platform. By creating an account, you represent and warrant that you are at least 18 years of age, that you have the legal capacity to enter into a binding agreement, and that all information you provide is accurate and complete. If you are creating an account on behalf of a business entity (such as a band, production company, sports team, or venue), you represent that you have the authority to bind that entity to these Terms.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Accounts are created through our OAuth authentication provider (Google, Spotify) or via email and password registration. Email verification is required before you can create a talent profile. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. You must notify us immediately at <a href="mailto:support@ologywood.com" className="text-primary hover:underline">support@ologywood.com</a> if you suspect unauthorized access to your account. Ologywood is not liable for any loss or damage arising from unauthorized use of your account.
            </p>
          </section>

          {/* 4. User Roles and Profiles */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">4. User Roles and Profiles</h2>
            <p className="text-base leading-relaxed">
              The Platform supports three primary user roles:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Talent</strong> — Music and visual artists, authors and writers, athletes, creators, entertainers, filmmakers, influencers, and other professionals who offer bookable services, products, or content.</li>
              <li><strong>Venues</strong> — Event spaces, clubs, restaurants, corporate event organizers, and other performance locations that book talent for events.</li>
              <li><strong>Fans</strong> — Users who follow talent, discover events, purchase tickets, books, eBooks, merchandise, and music releases, join Fan Clubs, and engage with creator content.</li>
            </ul>
            <p className="text-base leading-relaxed mt-4">
              During onboarding, Talent users select their profile type, including Music Artist, Visual Artist, Author / Writer, Athlete, Creator, Entertainer, Filmmaker, or Influencer. Each type has relevant profile guidance while sharing the Platform's core creator tools. Users may hold only one primary role per account but may change their talent type through Edit Profile.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Athlete Profiles and Data</h3>
            <p className="text-base leading-relaxed">
              Athletes who create profiles on the Platform may provide additional information specific to their athletic career, including but not limited to: sport, position, team affiliation, athletic statistics, achievements, and NIL deal history. By providing this information, you represent that it is accurate, current, and that you have the right to share it publicly. Athletic statistics and achievements displayed on your profile are self-reported; Ologywood does not independently verify athletic credentials or statistics.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Team and Institutional References:</strong> If you reference a team, school, or organization on your profile, you represent that you are (or were) legitimately affiliated with that entity. Displaying a team or school name on your profile does not imply endorsement by that institution. Ologywood reserves the right to remove team or institutional references if we receive a valid complaint from the referenced entity.
            </p>
            <p className="text-base leading-relaxed mt-4">
              You are responsible for the accuracy of all profile information, including your bio, photos, location, genre or category, rates, and availability. Profiles that contain false, misleading, or fraudulent information may be suspended or terminated without notice. Public profile information (name, photo, bio, genre, location) is visible to all Platform users and may appear in search results and social media previews.
            </p>
          </section>

          {/* 5. Content Ownership and Licensing */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Content Ownership and Licensing</h2>
            <p className="text-base leading-relaxed">
              <strong>You retain full ownership of all content you upload, create, or submit to the Platform.</strong> This includes, without limitation, profile photos, music recordings, album and book artwork, manuscripts and eBook files, videos, highlight clips, performance media, video portfolio content, rider templates, contract documents, event descriptions, blog posts, Fan Club posts, and any other materials you provide ("Your Content"). Ologywood does not claim any ownership interest in Your Content.
            </p>
            <p className="text-base leading-relaxed mt-4">
              By uploading Your Content to the Platform, you grant Ologywood a limited, non-exclusive, royalty-free, revocable license to host, store, display, reproduce, and distribute Your Content <strong>solely for the purpose of operating the Platform and providing the services you have requested.</strong> This license includes the right to display Your Content on your public profile, in search results, in social media previews (Open Graph), in Fan Club feeds, in your video portfolio, and in connection with the features you use (such as event listings, music releases, booking pages, and highlight clip galleries). This license does not grant Ologywood the right to sell, sublicense, or commercially exploit Your Content for any purpose unrelated to operating the Platform.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Content removal:</strong> You may remove Your Content at any time through your account settings or by contacting us. Upon removal or account deletion, Ologywood will remove Your Content from public display within a commercially reasonable timeframe. Copies of Your Content may be retained in backups for up to thirty (30) days after deletion, after which they will be permanently purged. Content that has been incorporated into executed contracts or completed transactions may be retained as part of the transaction record as required by law or for dispute resolution purposes.
            </p>
            <p className="text-base leading-relaxed mt-4">
              You represent and warrant that you own or have obtained all necessary rights, licenses, and permissions for all content you upload, and that Your Content does not infringe upon the intellectual property rights, privacy rights, publicity rights, or any other rights of any third party. You are solely responsible for ensuring that your books, manuscripts, cover art, music, images, videos, highlight clips, and other media comply with applicable copyright, publishing, licensing, and consumer-protection laws.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Video Portfolio and Highlight Clips</h3>
            <p className="text-base leading-relaxed">
              Athletes and other Talent may upload video content to their Video Portfolio (up to 10 clips per profile). By uploading video content, you represent and warrant that: (a) you own or have obtained all necessary rights to the video content, including any music, commentary, or third-party footage contained therein; (b) the video content does not violate any broadcast rights, league media policies, or institutional media agreements; (c) you have obtained consent from any identifiable individuals appearing in the video (other than yourself); and (d) the video content does not contain material that violates these Terms or applicable law.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Athlete-Specific Video Content:</strong> If you are a student-athlete, you acknowledge that certain game footage, broadcast clips, and institutional media may be owned by your school, conference, or broadcast partners. You are solely responsible for ensuring that any highlight clips you upload do not infringe on broadcast rights or violate your institution's media policies. Ologywood is not responsible for verifying the ownership or licensing status of uploaded video content.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Sandbox Posts</h3>
            <p className="text-base leading-relaxed">
              Talent may publish one current Sandbox Post on their public profile and share that post through a clean public link. You retain ownership of the text and media you submit and grant Ologywood the limited operational license described above, including display in social media previews. You represent that you own or control all rights necessary for any text, image, music, video, likeness, or other material included in a Sandbox Post.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Replacement and deletion:</strong> Publishing a new Sandbox Post deletes the current post row from Ologywood's active database and inserts the replacement; the prior post is not retained in a user-accessible archive and cannot be restored. Manually deleting the current post also removes its active database row. The prior media reference is removed from the Platform, subject to temporary backup, security-log, legal-retention, and service-provider limitations described in these Terms and the Privacy Policy. Ologywood may hide or remove a Sandbox Post that violates law, these Terms, or the Community Guidelines.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Sandbox Post links always resolve to the talent's current active post. If a post is replaced, deleted, hidden, or unavailable, a previously shared link will not continue displaying that version. Version one does not provide comments, downvotes, reaction counts, popularity rankings, or public post history.
            </p>
          </section>

          {/* 6. Bookings */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Bookings</h2>
            <p className="text-base leading-relaxed">
              Ologywood facilitates bookings between talent and venues or event organizers by providing tools to submit, review, accept, and manage booking requests. A booking is created when one party submits a booking request and the other party accepts it. By submitting or accepting a booking, both parties agree to the event details, date, time, location, and agreed fee specified in the booking.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Ologywood acts solely as a facilitator and is not a party to any booking agreement.</strong> The contractual relationship for a performance is exclusively between the talent and the venue or organizer. Ologywood is not responsible for the quality of performances, venue conditions, talent conduct, venue safety, or any disputes arising from the booking. Both parties are expected to communicate promptly through the Platform's messaging system regarding any changes, special requirements, or concerns related to the booking.
            </p>
          </section>

          {/* 7. Rider Contracts and E-Signatures */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Rider Contracts and E-Signatures</h2>
            <p className="text-base leading-relaxed">
              Talent may create rider templates specifying their technical requirements (sound, lighting, stage setup), hospitality needs (green room, meals, beverages), payment terms, cancellation policies, and other performance conditions. Rider templates can be attached to bookings to form part of the booking agreement between the parties. The Platform provides pre-built rider templates for various talent types, including artist performance riders and athlete-specific riders (Appearance, Autograph Signing, Speaking Engagement, and Camp/Clinic).
            </p>
            <p className="text-base leading-relaxed mt-4">
              The Platform provides an electronic signature (e-signature) system for signing rider contracts. By using the e-signature feature, you acknowledge and agree that: (a) your electronic signature is legally binding and carries the same legal effect as a handwritten signature under the Electronic Signatures in Global and National Commerce Act (E-SIGN Act) and the Uniform Electronic Transactions Act (UETA); (b) when you sign a contract, the Platform records your signature (drawn or typed), the signing timestamp, your IP address, and your user agent for verification purposes; and (c) you consent to conducting this transaction electronically.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Both the talent and the venue or organizer must sign a rider contract for it to be considered fully executed. <strong>Ologywood stores signed contracts and makes them available to both parties but does not enforce, interpret, or adjudicate the terms of rider contracts.</strong> The terms of each rider contract, including but not limited to payout timing, cancellation penalties, and performance obligations, are solely between the contracting parties. Any disputes regarding rider contract terms must be resolved directly between the parties or through appropriate legal channels.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.1 NIL Engagement Contracts</h3>
            <p className="text-base leading-relaxed">
              For athlete bookings, the Platform generates NIL (Name, Image, and Likeness) Engagement Contracts — professional 10-section contracts covering: identification of parties, engagement details, compensation and payment terms, travel and logistics, security requirements, equipment and facilities, media rights and usage, NIL compliance provisions, cancellation and force majeure, and signature blocks. These contracts include NCAA/conference compliance language and disclosure requirements.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>NIL Engagement Contracts are templates provided as a convenience tool and do not constitute legal advice.</strong> Ologywood is not a law firm, sports agent, or compliance advisor. The Platform's contract templates are designed to facilitate common NIL transaction structures but may not address all legal requirements applicable to your specific situation, state, institution, or athletic conference. Both parties are strongly encouraged to consult with qualified legal counsel before executing any NIL agreement.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Athletes may use the inline clause editing feature to modify contract terms (including compensation, travel provisions, and custom terms) before signing. Any modifications made through the inline editing feature become part of the final contract upon execution by both parties.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Contract Status and Execution</h3>
            <p className="text-base leading-relaxed">
              Contracts on the Platform progress through the following statuses: Pending (generated but not yet signed), Partially Signed (signed by one party), and Fully Executed (signed by both parties). A contract is not binding until both parties have applied their electronic signatures. The Platform provides visual status indicators on the booking dashboard to track contract progress.
            </p>
          </section>

          {/* 7A. NIL Compliance and NCAA Provisions */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">7A. NIL Compliance and NCAA Provisions</h2>
            <p className="text-base leading-relaxed">
              <strong>Ologywood is not an NCAA compliance office, athletic department representative, sports agent, or legal advisor.</strong> The Platform provides tools to facilitate NIL transactions between athletes and brands, venues, or event organizers, but does not provide compliance advice, monitor NCAA eligibility, or guarantee that any transaction complies with applicable NCAA rules, conference regulations, state NIL laws, or institutional policies.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7A.1 Athlete Representations</h3>
            <p className="text-base leading-relaxed">
              By using the Platform as an athlete, you represent and warrant that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li>You are eligible to enter into NIL agreements under applicable NCAA rules, conference regulations, and your institution's NIL policies</li>
              <li>You have disclosed (or will disclose) all NIL activities conducted through the Platform to your institution's compliance office as required by your school's policies</li>
              <li>You will not use the Platform to arrange any activity that would violate NCAA rules regarding pay-for-play, recruiting inducements, or academic fraud</li>
              <li>All information provided in your athlete profile (sport, position, team, statistics, achievements) is accurate and current</li>
              <li>You have the authority to license your name, image, and likeness for the purposes described in any booking or contract you accept through the Platform</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">7A.2 Platform Limitations</h3>
            <p className="text-base leading-relaxed">
              Ologywood does not: (a) verify an athlete's NCAA eligibility status; (b) confirm whether a specific NIL deal complies with an athlete's conference or institutional rules; (c) file disclosure forms on behalf of athletes; (d) monitor changes to NCAA, state, or institutional NIL regulations; or (e) guarantee that contract templates reflect the most current legal requirements. <strong>Athletes are solely responsible for ensuring their NIL activities comply with all applicable rules and regulations.</strong>
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7A.3 Prohibited NIL Activities</h3>
            <p className="text-base leading-relaxed">
              The following activities are prohibited on the Platform and may result in immediate account suspension or termination:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li>Using NIL deals as inducements for prospective student-athletes to attend a particular institution</li>
              <li>Arranging pay-for-play compensation tied to athletic performance or participation</li>
              <li>Facilitating NIL deals that require athletes to miss classes, practices, or team activities in violation of institutional policies</li>
              <li>Misrepresenting athletic credentials, team affiliation, or eligibility status</li>
              <li>Using the Platform to circumvent institutional or conference NIL disclosure requirements</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">7A.4 Indemnification for NIL Activities</h3>
            <p className="text-base leading-relaxed">
              You agree to indemnify and hold harmless Ologywood from any claims, damages, penalties, or losses arising from: (a) your failure to comply with NCAA rules, conference regulations, or institutional policies regarding NIL activities; (b) your failure to make required disclosures to your compliance office; (c) any loss of eligibility resulting from NIL activities conducted through the Platform; or (d) any regulatory action taken against you in connection with NIL transactions facilitated through the Platform.
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
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Talent Receives</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Booking Payments (deposit and final)</td>
                    <td className="border border-gray-200 px-4 py-2">1% of transaction amount</td>
                    <td className="border border-gray-200 px-4 py-2">99% (direct to talent's connected Stripe account)</td>
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
                    <td className="border border-gray-200 px-4 py-2"><strong>Fan Club Memberships (monthly subscriptions)</strong></td>
                    <td className="border border-gray-200 px-4 py-2"><strong>15% of subscription amount</strong></td>
                    <td className="border border-gray-200 px-4 py-2"><strong>85% (direct to talent's connected Stripe account)</strong></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Fan Tips and Donations (via external links)</td>
                    <td className="border border-gray-200 px-4 py-2"><strong>No platform fee (0%)</strong></td>
                    <td className="border border-gray-200 px-4 py-2">100% of tip amount (processed outside the Platform)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Note: Standard Stripe processing fees (currently 2.9% + $0.30 per transaction) apply to all transactions processed through Stripe and are separate from Ologywood's platform fees. These fees are set by Stripe and are subject to change per Stripe's terms. Tips sent via external payment apps (CashApp, Venmo, PayPal, Zelle) are subject to those services' own fee structures.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Ologywood reserves the right to modify its fee schedule with at least thirty (30) days' advance written notice to affected users. Fee changes will not apply retroactively to transactions already completed.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.2 Stripe Connect and Direct Payouts</h3>
            <p className="text-base leading-relaxed">
              Talent may connect their own Stripe account to the Platform through Stripe Connect. When talent has a connected Stripe account, booking payments, release sales, ticket revenue, and Fan Club subscription revenue are routed directly to the talent's connected bank account by Stripe, minus any applicable platform fees and Stripe processing fees. <strong>Ologywood does not hold, delay, or control the timing of these payouts.</strong> Payout timing is determined by Stripe's standard payout schedule and the talent's Stripe account settings.
            </p>
            <p className="text-base leading-relaxed mt-4">
              If talent has not connected a Stripe account, payments for bookings and Fan Club memberships will be processed through Ologywood's Stripe account and held until the talent completes Stripe Connect onboarding. Ologywood will make reasonable efforts to notify the talent of pending funds.
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
              <strong>Payout timing for booking payments is governed by the individual rider contract or booking agreement between the talent and the venue/organizer.</strong> Ologywood does not impose or enforce payout timing requirements. Talent and venues are encouraged to clearly specify payment milestones and timing in their rider contracts.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.4 Platform Subscriptions</h3>
            <p className="text-base leading-relaxed">
              Certain premium features of the Platform require a paid subscription plan (e.g., Starter, Professional, Enterprise tiers for talent profiles). Subscription fees are billed on a recurring basis (monthly or annually, as selected) through Stripe. By subscribing, you authorize Ologywood to charge your payment method on a recurring basis at the then-current subscription rate until you cancel.
            </p>
            <p className="text-base leading-relaxed mt-4">
              You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period, and you will retain access to premium features until that date. <strong>Subscription fees are non-refundable</strong> except where required by applicable law. Ologywood reserves the right to modify subscription pricing with at least thirty (30) days' advance notice. Price changes will take effect at the start of your next billing cycle following the notice period.
            </p>
          </section>

          {/* 9. Fan Club Memberships */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">9. Fan Club Memberships</h2>
            <p className="text-base leading-relaxed">
              The Platform allows Talent to create Fan Club membership tiers, offering fans access to exclusive content, perks, and community engagement in exchange for a recurring monthly subscription fee set by the Talent. By subscribing to a Fan Club tier, you agree to the following:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">9.1 Membership Terms</h3>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li>Fan Club memberships are billed monthly through Stripe on a recurring basis until cancelled.</li>
              <li>Membership pricing is set by the Talent and may vary between tiers (e.g., different access levels, perks, or content).</li>
              <li>By subscribing, you authorize recurring charges to your payment method at the tier price selected.</li>
              <li>You may cancel your Fan Club membership at any time. Cancellation takes effect at the end of the current billing period, and you retain access until that date.</li>
              <li>Fan Club membership fees are non-refundable except where required by applicable law.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">9.2 Revenue Share</h3>
            <p className="text-base leading-relaxed">
              Fan Club subscription revenue is split between the Talent and Ologywood as follows: <strong>85% of each subscription payment goes to the Talent</strong> (routed directly to their connected Stripe account) and <strong>15% is retained by Ologywood as a platform fee.</strong> Standard Stripe processing fees (approximately 2.9% + $0.30) are deducted from the gross amount before the revenue split is applied.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">9.3 Exclusive Content</h3>
            <p className="text-base leading-relaxed">
              Talent may post content designated as "members only" that is accessible only to active Fan Club members. Ologywood does not guarantee the frequency, quality, or type of exclusive content provided by Talent. The relationship between Fan Club members and Talent is a direct relationship; Ologywood facilitates the tools but is not responsible for content delivery obligations.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>No Guarantee of Content:</strong> A Fan Club membership grants access to whatever exclusive content the Talent chooses to share. Ologywood does not require Talent to post a minimum amount of content and is not liable if a Talent fails to provide content that meets a member's expectations.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">9.4 Talent Obligations</h3>
            <p className="text-base leading-relaxed">
              By creating Fan Club tiers, Talent agrees to: (a) accurately describe the perks and benefits of each tier; (b) make reasonable efforts to deliver the perks described; (c) not engage in deceptive practices regarding membership benefits; and (d) comply with all applicable consumer protection laws regarding subscription services. Talent is solely responsible for any tax obligations arising from Fan Club revenue.
            </p>
          </section>

          {/* 10. Fan Tips and Support */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">10. Fan Tips and Support</h2>
            <p className="text-base leading-relaxed">
              The Platform allows Talent to display links and QR codes for external tipping services (such as CashApp, Venmo, PayPal, and Zelle) on their public profiles. <strong>Ologywood does not process, facilitate, or take any fee on tips sent through these external services.</strong> Tips are sent directly from the fan to the Talent through the selected external payment application.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Ologywood is not responsible for: (a) the delivery, receipt, or processing of tips sent through external services; (b) disputes between fans and Talent regarding tips; (c) the accuracy of QR codes or payment links provided by Talent; or (d) any fees charged by the external payment service. Tips are voluntary, non-refundable, and do not create any obligation on the part of the Talent to provide goods, services, or performances in return.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Talent is solely responsible for reporting and paying all applicable taxes on tips received.</strong> Ologywood does not issue tax forms for tips processed through external services, as these transactions occur entirely outside the Platform.
            </p>
          </section>

          {/* 11. Digital Music Releases and Music Library */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">11. Digital Music Releases and Music Library</h2>
            <p className="text-base leading-relaxed">
              Talent may publish and sell digital music releases (singles, albums) through the Platform. By purchasing a music release, fans receive a license to stream and download the purchased content for personal, non-commercial use. This license is non-transferable and does not grant any rights to redistribute, publicly perform, or create derivative works from the purchased content.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Purchased music is accessible through the Platform's Music Library feature, which provides streaming playback, download capability, and library management tools. Downloads may be subject to reasonable limits as displayed at the time of purchase.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Rights Certification:</strong> By publishing a music release on the Platform, Talent certifies that they own or have obtained all necessary rights, licenses, and permissions for the audio content, artwork, and any samples or third-party material contained therein. Talent is solely responsible for ensuring compliance with all applicable copyright, licensing, and royalty obligations.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.1 Digital Release Refunds</h3>
            <p className="text-base leading-relaxed">
              Due to the nature of digital goods, purchases of music releases are generally non-refundable once the download has been accessed. If a download link is defective or the file is corrupted, the purchaser may contact the Talent or Ologywood support for a replacement or refund at the Talent's discretion.
            </p>
          </section>


          {/* 11A. Content Releases (External Distribution) */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">11A. Content Releases (Externally-Hosted Content)</h2>
            <p className="text-base leading-relaxed">
              The Platform allows Talent to create and sell access to content that is hosted on third-party platforms (such as YouTube, Vimeo, Spotify, Twitch, Apple Podcasts, or the Talent's personal website). <strong>Ologywood does not host, stream, store, or control the availability of externally-hosted content.</strong> Ologywood serves solely as the monetization and access-control layer — facilitating the sale of tickets, access passes, or memberships that grant purchasers access to the Talent's externally-hosted content.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">11A.1 Platform Role and Limitations</h3>
            <p className="text-base leading-relaxed">
              When a fan purchases access to a Content Release, Ologywood processes the payment and grants the purchaser access to the content URL provided by the Talent. The actual content delivery (streaming, playback, bandwidth) is handled entirely by the third-party hosting platform. Ologywood is not responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2 mt-3">
              <li>The availability, uptime, or performance of the third-party hosting platform</li>
              <li>Content that is removed, restricted, or made unavailable by the hosting platform after purchase</li>
              <li>Geographic restrictions or content blocking imposed by the hosting platform</li>
              <li>Changes to the hosting platform's terms of service that affect content accessibility</li>
              <li>The quality, accuracy, or completeness of the externally-hosted content</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">11A.2 Creator Responsibilities</h3>
            <p className="text-base leading-relaxed">
              By creating a Content Release on the Platform, Talent represents and warrants that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2 mt-3">
              <li>They own or have obtained all necessary rights to distribute or sell access to the content</li>
              <li>The content URL provided will remain accessible to purchasers for a reasonable period (minimum 90 days from the last purchase date)</li>
              <li>They will not intentionally remove, restrict, or make the content unavailable to paying purchasers without providing a refund</li>
              <li>The content does not violate the hosting platform's terms of service or any applicable law</li>
              <li>Any premiere dates, scheduled availability, or access windows are accurately represented at the time of sale</li>
            </ul>
            <p className="text-base leading-relaxed mt-4">
              <strong>Failure to maintain content accessibility:</strong> If Talent removes or restricts access to content that has been purchased by fans, Ologywood reserves the right to issue refunds to affected purchasers and deduct the refunded amounts from the Talent's earnings or connected Stripe account.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">11A.3 Content Release Refunds</h3>
            <p className="text-base leading-relaxed">
              Content Release purchases are subject to the following refund policy:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2 mt-3">
              <li><strong>Content available and accessible:</strong> No refund — the purchase grants access to the content URL as described.</li>
              <li><strong>Content unavailable due to Talent action:</strong> Full refund if the Talent removes or restricts the content within 90 days of purchase.</li>
              <li><strong>Content unavailable due to hosting platform:</strong> Ologywood will make reasonable efforts to facilitate a refund or alternative access, but is not obligated to provide a refund for third-party platform actions beyond its control.</li>
              <li><strong>Scheduled premiere not delivered:</strong> Full refund if a scheduled premiere does not occur within 7 days of the advertised date without prior notice from the Talent.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">11A.4 Access Models</h3>
            <p className="text-base leading-relaxed">
              Content Releases may be offered under the following access models, as selected by the Talent:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2 mt-3">
              <li><strong>Free:</strong> Content is accessible to all users at no charge.</li>
              <li><strong>Ticketed:</strong> A one-time purchase at a fixed price grants permanent access to the content.</li>
              <li><strong>Fan Club Members Only:</strong> Access is restricted to active Fan Club members of the Talent.</li>
              <li><strong>Pay What You Want:</strong> Fans choose their own price (subject to an optional minimum set by the Talent).</li>
              <li><strong>Unlock After Purchase:</strong> Content is locked until the fan completes a purchase at the listed price.</li>
            </ul>
          </section>

          {/* 11B. Creator Shop Books and eBooks */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">11B. Creator Shop Books and eBooks</h2>
            <p className="text-base leading-relaxed">
              Authors and other eligible Talent may list physical books or eBooks in Creator Shop. The listing creator is the seller and is responsible for the accuracy of the title, format, edition, ISBN, publication information, pricing, description, availability, and any signed-copy representation. Ologywood facilitates discovery, payment, order records, and digital access, but is not the publisher, printer, distributor, literary agent, or guarantor of any listed book.
            </p>
            <h3 className="text-xl font-semibold mt-6 mb-3">11B.1 Rights and Seller Responsibilities</h3>
            <p className="text-base leading-relaxed">
              By listing or uploading a book, the seller represents and warrants that they own or control all rights needed to sell and deliver the book, cover art, description, and related materials in the selected territories and formats. The seller is responsible for royalties, contributor permissions, publisher restrictions, taxes, fulfillment obligations, and infringement claims. Ologywood may hide a listing, suspend access, preserve transaction records, or respond to a valid legal or DMCA request when reasonably necessary.
            </p>
            <h3 className="text-xl font-semibold mt-6 mb-3">11B.2 Physical Books</h3>
            <p className="text-base leading-relaxed">
              Physical books are fulfilled by the seller. The seller is responsible for inventory, packaging, shipping or pickup, delivery estimates, tracking, signed-copy accuracy, returns, and compliance with applicable consumer laws. Buyers should review the listing and fulfillment terms before purchase.
            </p>
            <h3 className="text-xl font-semibold mt-6 mb-3">11B.3 eBook Access and License</h3>
            <p className="text-base leading-relaxed">
              A completed eBook purchase grants the buyer a limited, non-exclusive, non-transferable license to download and use the purchased file for personal, non-commercial purposes. It does not transfer copyright or permit resale, public distribution, file sharing, sublicensing, republication, or removal of rights-management notices. eBook files remain in protected storage and are released through purchase-authorized, time-limited download links. Reasonable download limits may apply and are shown in the buyer's order history.
            </p>
            <h3 className="text-xl font-semibold mt-6 mb-3">11B.4 Refunds and Access Revocation</h3>
            <p className="text-base leading-relaxed">
              Because eBooks are digital goods, purchases are generally final after download access is provided, except where required by law or where the file is unavailable, corrupted, or materially different from the listing. An approved refund, charge reversal, rights claim, or account-enforcement action may revoke future download access. Physical-book refunds are also subject to the seller's stated policy, applicable law, Stripe procedures, and any Platform dispute tools.
            </p>
          </section>

          {/* 12. Refunds and Cancellations */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">12. Refunds and Cancellations</h2>
            <p className="text-base leading-relaxed">
              Refund and cancellation terms are primarily governed by the rider contract or booking agreement between the parties. Ologywood encourages all parties to clearly specify cancellation and refund terms in their rider contracts before confirming a booking. <strong>Ologywood does not guarantee, process, or adjudicate refunds between users.</strong> Refunds for booking payments are handled through Stripe based on the terms agreed upon by the parties.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">12.1 Default Cancellation Policy</h3>
            <p className="text-base leading-relaxed">
              If no specific cancellation terms are agreed upon in the rider contract or booking agreement, the following default policy applies:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li><strong>Talent cancels (any time):</strong> The venue or organizer receives a full refund of all payments made (deposit and/or final payment).</li>
              <li><strong>Venue/organizer cancels before deposit payment:</strong> No charge; booking is cancelled with no financial obligation.</li>
              <li><strong>Venue/organizer cancels after deposit payment:</strong> The deposit is non-refundable and is retained by the Talent. If the full fee has been paid, only the final payment (balance beyond the deposit) is refunded.</li>
              <li><strong>Cancellations more than 30 days before the event:</strong> Full deposit refund.</li>
              <li><strong>Cancellations 14 to 30 days before the event:</strong> 50% deposit refund.</li>
              <li><strong>Cancellations less than 14 days before the event:</strong> No deposit refund.</li>
            </ul>
            <p className="text-base leading-relaxed mt-4">
              Both parties should communicate cancellations promptly through the Platform. Repeated cancellations without reasonable cause may result in account restrictions or suspension.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">12.2 Ticket Refunds</h3>
            <p className="text-base leading-relaxed">
              Refund policies for event tickets are set by the event organizer (Talent or venue) at the time of event creation. Ticket purchasers should review the refund policy displayed on the event page before purchasing. If an event is cancelled by the organizer, ticket purchasers are entitled to a full refund. Ologywood's $0.99 per-ticket platform fee is non-refundable.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">12.3 Fan Club Membership Cancellations</h3>
            <p className="text-base leading-relaxed">
              Fan Club memberships may be cancelled at any time by the member. Cancellation takes effect at the end of the current billing period. No partial-month refunds are provided. If a Talent deactivates their Fan Club or deletes a tier with active members, affected members will not be charged for subsequent periods and will retain access through the end of their current paid period.
            </p>
          </section>

          {/* 13. Payment Disputes and Chargebacks */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">13. Payment Disputes and Chargebacks</h2>
            <p className="text-base leading-relaxed">
              <strong>All payment disputes and chargebacks are handled directly by Stripe, our third-party payment processor.</strong> Ologywood does not process, hold, or control user funds at any point during a transaction or dispute. Stripe manages the entire dispute and chargeback lifecycle in accordance with card network rules (Visa, Mastercard, American Express, etc.) and applicable financial regulations.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.1 How Disputes and Chargebacks Work</h3>
            <p className="text-base leading-relaxed">
              If a cardholder (buyer) initiates a payment dispute or chargeback with their bank or card issuer, Stripe will:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li>Notify the relevant parties (seller/Talent) of the dispute</li>
              <li>Collect evidence from both parties as needed</li>
              <li>Submit evidence to the card network on behalf of the seller</li>
              <li>Manage the dispute timeline and resolution process</li>
              <li>Communicate the final outcome to all parties</li>
            </ul>
            <p className="text-base leading-relaxed mt-4">
              <strong>Ologywood is not a party to the chargeback or dispute process.</strong> We do not make decisions on dispute outcomes, hold funds in escrow during disputes, or have the ability to override Stripe's or the card network's determination.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.2 Seller (Talent/Venue) Responsibilities</h3>
            <p className="text-base leading-relaxed">
              If you receive a payment and a dispute is filed against that transaction, you may be asked by Stripe to provide evidence supporting the legitimacy of the charge (e.g., signed contracts, proof of service delivery, communication records). It is your responsibility to respond to Stripe's evidence requests within the timeframes specified.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.3 Buyer Protection</h3>
            <p className="text-base leading-relaxed">
              Buyers are protected by their card issuer's standard dispute rights. If you believe a charge is unauthorized, fraudulent, or for services not delivered, you may file a dispute directly with your bank or card issuer. For more information, refer to <a href="https://stripe.com/docs/disputes" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe's dispute documentation</a>.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.4 Prohibited Conduct</h3>
            <p className="text-base leading-relaxed">
              Users who initiate frivolous, fraudulent, or bad-faith chargebacks may have their accounts suspended or permanently terminated. Repeated abuse of the chargeback process is a violation of these Terms and may result in legal action.
            </p>
          </section>

          {/* 14. Force Majeure */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">14. Force Majeure</h2>
            <p className="text-base leading-relaxed">
              Neither Ologywood nor any user shall be liable for failure to perform obligations under these Terms or any booking agreement facilitated through the Platform if such failure results from circumstances beyond the party's reasonable control, including but not limited to: natural disasters, severe weather events, pandemics or public health emergencies, government orders or restrictions, acts of terrorism, civil unrest, power outages, internet service disruptions, or other events commonly recognized as force majeure.
            </p>
            <p className="text-base leading-relaxed mt-4">
              In the event of a force majeure affecting a booked event, the parties should communicate promptly through the Platform to discuss rescheduling or cancellation. Refund terms for force majeure cancellations should be specified in the rider contract. If no force majeure terms are specified, the default cancellation policy in Section 12.1 applies.
            </p>
          </section>

          {/* 15. Messaging and Communications */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">15. Messaging and Communications</h2>
            <p className="text-base leading-relaxed">
              The Platform provides in-app messaging for communication between users regarding bookings and events. Talent may also send email update blasts to their followers through the Platform. By following a Talent profile, you consent to receiving their update emails. You may unfollow or unsubscribe from emails at any time through the unsubscribe link included in every email or through your account settings.
            </p>
            <p className="text-base leading-relaxed mt-4">
              You agree not to use the messaging system for spam, harassment, solicitation of services outside the Platform, or any illegal purpose. Ologywood reserves the right to monitor messages for compliance with these Terms and to suspend accounts that violate messaging policies.
            </p>
          </section>

          {/* 16. Sponsor Showcase and Brand Partnerships */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">16. Sponsor Showcase and Brand Partnerships</h2>
            <p className="text-base leading-relaxed">
              The Platform offers a Sponsor Showcase feature available to Enterprise tier subscribers, allowing Talent to display sponsor logos, names, and links on their public profile, event detail pages, and in ticket confirmation emails. By using the Sponsor Showcase feature, you represent and warrant that you have obtained all necessary rights, licenses, and permissions from each sponsor to display their brand assets on the Platform.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>No Endorsement:</strong> The display of sponsor logos on the Platform does not constitute an endorsement, recommendation, or affiliation between Ologywood and any sponsor. <strong>Prohibited Sponsor Content:</strong> You may not use the Sponsor Showcase to display content that promotes illegal products or services, contains adult or hateful material, impersonates or falsely implies a sponsorship that does not exist, or violates any applicable advertising laws or FTC disclosure requirements.
            </p>
          </section>

          {/* 17. Prohibited Conduct */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">17. Prohibited Conduct</h2>
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
              <li>Create Fan Club tiers with deceptive or misleading benefit descriptions</li>
              <li>Use Fan Club exclusive content features to distribute illegal, harmful, or infringing material</li>
              <li>Misrepresent athletic credentials, team affiliation, eligibility status, or NIL deal history</li>
              <li>Use the Platform to arrange NIL deals that serve as recruiting inducements or pay-for-play compensation</li>
              <li>Upload video content (highlight clips) that infringes on broadcast rights, league media policies, or institutional media agreements</li>
            </ul>
          </section>

          {/* 18. DMCA and Copyright */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">18. DMCA and Copyright Compliance</h2>
            <p className="text-base leading-relaxed">
              Ologywood respects the intellectual property rights of others and expects users to do the same. We comply with the Digital Millennium Copyright Act (DMCA) and will respond to valid notices of alleged copyright infringement. Our full DMCA policy, including instructions for submitting takedown notices and counter-notices, is available at <Link href="/dmca-policy" className="text-primary hover:underline">www.ologywood.com/dmca-policy</Link>.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Repeat infringers will have their accounts terminated in accordance with our repeat infringer policy.
            </p>
          </section>

          {/* 19. Account Suspension and Termination */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">19. Account Suspension and Termination</h2>
            <p className="text-base leading-relaxed">
              Ologywood reserves the right to suspend or terminate your account at any time, with or without notice, for violations of these Terms, fraudulent activity, repeated chargebacks, or any conduct that we determine is harmful to other users or the Platform. Upon termination, your right to use the Platform ceases immediately. Any pending bookings or active Fan Club memberships at the time of termination will be handled on a case-by-case basis.
            </p>
            <p className="text-base leading-relaxed mt-4">
              You may delete your account at any time by contacting us at <a href="mailto:support@ologywood.com" className="text-primary hover:underline">support@ologywood.com</a>. Upon account deletion: (a) your public profile will be removed from the Platform; (b) Your Content will be removed from public display in accordance with Section 5; (c) your Stripe Connect account connection will be severed (your Stripe account itself remains yours); (d) active Fan Club memberships you hold will be cancelled at the end of the current billing period; and (e) account deletion is subject to the data retention terms described in our <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          {/* 20. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">20. Intellectual Property</h2>
            <p className="text-base leading-relaxed">
              The Platform and its original contents, features, and functionality (including but not limited to software, code, text, images, logos, design, and user interface) are owned by Ologywood and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property laws. The Ologywood™ name, logo, and all related marks are trademarks of Ologywood. You may not copy, modify, distribute, sell, or create derivative works from any part of the Platform without our prior written permission.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Trademark Notice:</strong> "Ologywood" is a trademark pending registration with the United States Patent and Trademark Office (USPTO). The ™ designation indicates that Ologywood claims trademark rights in the name and is actively pursuing federal registration. Unauthorized use of the Ologywood name, logo, or any confusingly similar marks in connection with competing or related services is strictly prohibited and may constitute trademark infringement under the Lanham Act (15 U.S.C. § 1125(a)) and applicable state laws.
            </p>
          </section>

          {/* 21. Disclaimer of Warranties */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">21. Disclaimer of Warranties</h2>
            <p className="text-base leading-relaxed">
              THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. OLOGYWOOD EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. OLOGYWOOD DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. OLOGYWOOD DOES NOT GUARANTEE THE QUALITY, RELIABILITY, AVAILABILITY, PROFESSIONALISM, OR SUITABILITY OF ANY TALENT, VENUE, EVENT, OR SERVICE LISTED ON THE PLATFORM.
            </p>
            <p className="text-base leading-relaxed mt-4">
              OLOGYWOOD DOES NOT WARRANT OR GUARANTEE THAT: (A) ANY BOOKING WILL BE FULFILLED AS AGREED BETWEEN THE PARTIES; (B) ANY PAYMENT WILL BE PROCESSED WITHOUT ERROR OR DELAY; (C) ANY TALENT OR VENUE WILL PERFORM AS REPRESENTED; (D) FAN CLUB CONTENT WILL MEET YOUR EXPECTATIONS; OR (E) THE PLATFORM WILL MEET YOUR SPECIFIC REQUIREMENTS. YOUR USE OF THE PLATFORM IS AT YOUR SOLE RISK.
            </p>
          </section>

          {/* 22. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">22. Limitation of Liability</h2>
            <p className="text-base leading-relaxed">
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, OLOGYWOOD, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUES, DATA, GOODWILL, OR BUSINESS OPPORTUNITIES ARISING FROM OR RELATED TO YOUR USE OF THE PLATFORM, REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, TORT, STRICT LIABILITY, OR OTHERWISE), EVEN IF OLOGYWOOD HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="text-base leading-relaxed mt-4">
              THIS LIMITATION INCLUDES, WITHOUT LIMITATION, DAMAGES ARISING FROM: BOOKING DISPUTES OR CANCELLATIONS; PAYMENT PROCESSING ERRORS, DELAYS, OR FAILURES; PERFORMANCE QUALITY OR NON-PERFORMANCE; RIDER CONTRACT DISAGREEMENTS; CHARGEBACKS OR PAYMENT REVERSALS; LOSS OF REVENUE DUE TO EVENT CANCELLATIONS; FAN CLUB CONTENT OR MEMBERSHIP DISPUTES; PERSONAL INJURY OR PROPERTY DAMAGE AT EVENTS; OR ANY ACTIONS OR OMISSIONS OF OTHER PLATFORM USERS.
            </p>
            <p className="text-base leading-relaxed mt-4">
              IN NO EVENT SHALL OLOGYWOOD'S TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR YOUR USE OF THE PLATFORM EXCEED THE GREATER OF: (A) THE TOTAL PLATFORM FEES PAID BY YOU TO OLOGYWOOD IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM; OR (B) ONE HUNDRED DOLLARS ($100.00).
            </p>
          </section>

          {/* 23. Indemnification */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">23. Indemnification</h2>
            <p className="text-base leading-relaxed">
              You agree to indemnify, defend, and hold harmless Ologywood and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees and court costs) arising from or related to: (a) your use of the Platform; (b) Your Content; (c) your violation of these Terms; (d) your violation of any applicable law or regulation; (e) your violation of any rights of another user or third party; (f) any booking, contract, or transaction you enter into through the Platform; (g) any dispute between you and another user; or (h) your use of the Fan Club feature, including content you post or membership benefits you offer.
            </p>
          </section>

          {/* 24. Governing Law and Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">24. Governing Law and Dispute Resolution</h2>
            <p className="text-base leading-relaxed">
              These Terms are governed by and construed in accordance with the laws of the State of Georgia, United States, without regard to its conflict of law principles. Any legal action, suit, or proceeding arising from or related to these Terms or your use of the Platform shall be brought exclusively in the state or federal courts located in Gwinnett County, Georgia, and you consent to the personal jurisdiction and venue of such courts.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Before initiating any legal proceeding, you agree to first attempt to resolve the dispute informally by contacting Ologywood at <a href="mailto:legal@ologywood.com" className="text-primary hover:underline">legal@ologywood.com</a>. Ologywood will attempt to resolve the dispute informally within thirty (30) days. If the dispute is not resolved informally, either party may proceed with formal legal action as described above.
            </p>
          </section>

          {/* 25. General Provisions */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">25. General Provisions</h2>
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

          {/* 25A. Artificial Intelligence Policy */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">25A. Artificial Intelligence (AI) Policy</h2>
            <p className="text-base leading-relaxed">
              OlogyWood may use artificial intelligence to assist creators and users by generating biographies, event descriptions, marketing copy, SEO metadata, suggested tags, captions, and recommendations. AI-generated content is provided as a starting point and should be reviewed by the creator before publication.
            </p>
            <p className="text-base leading-relaxed mt-4">
              Users remain solely responsible for ensuring they have the rights to any AI-assisted content they publish on the Platform. OlogyWood does not guarantee the accuracy, originality, or legal compliance of AI-generated suggestions. AI features are tools to support creativity — not replacements for human judgment.
            </p>
            <p className="text-base leading-relaxed mt-4">
              OlogyWood does not use AI to make automated decisions regarding account suspension, payment holds, or content removal without human review.
            </p>
          </section>

          {/* 25B. Creator Bill of Rights */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">25B. Creator Bill of Rights</h2>
            <p className="text-base leading-relaxed">
              OlogyWood is committed to empowering creators. Our <Link href="/creator-rights" className="text-primary hover:underline">Creator Bill of Rights</Link> outlines the fundamental rights every creator has on our platform, including the right to own your work, control your brand, earn fairly, build your community, know the rules, protect your privacy, and access opportunity.
            </p>
            <p className="text-base leading-relaxed mt-4">
              The Creator Bill of Rights is a core part of our platform identity and informs how we build features, write policies, and make decisions.
            </p>
          </section>

          {/* 26. Contact Information */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">26. Contact Information</h2>
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
