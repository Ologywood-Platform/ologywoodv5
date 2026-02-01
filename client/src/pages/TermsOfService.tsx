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
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: January 31, 2026
        </p>

        <div className="prose prose-sm sm:prose max-w-none space-y-6">
          {/* Agreement to Terms */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Agreement to Terms</h2>
            <p className="text-base leading-relaxed">
              By accessing and using the Ologywood platform (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service. Ologywood reserves the right to make changes to these Terms of Service at any time and for any reason. We will alert you about any changes by updating the "Last updated" date of these Terms of Service. Any changes or modifications will be effective immediately upon posting to the Service, and your continued use of the Service following the posting of revised Terms of Service means that you accept and agree to the changes.
            </p>
          </section>

          {/* Use License */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Use License</h2>
            <p className="text-base leading-relaxed">
              Permission is granted to temporarily download one copy of the materials (information or software) on Ologywood's Service for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained on the Service</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              <li>Violate any applicable laws or regulations related to access to or use of the Service</li>
              <li>Harass or cause distress or inconvenience to any person</li>
              <li>Obscure or alter any legal notices or proprietary notices</li>
            </ul>
          </section>

          {/* Disclaimer of Warranties */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">3. Disclaimer of Warranties</h2>
            <p className="text-base leading-relaxed">
              The materials on Ologywood's Service are provided on an 'as is' basis. Ologywood makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights. Further, Ologywood does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.
            </p>
          </section>

          {/* Limitations of Liability */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">4. Limitations of Liability</h2>
            <p className="text-base leading-relaxed">
              In no event shall Ologywood or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Ologywood's Service, even if Ologywood or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          {/* Accuracy of Materials */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Accuracy of Materials</h2>
            <p className="text-base leading-relaxed">
              The materials appearing on Ologywood's Service could include technical, typographical, or photographic errors. Ologywood does not warrant that any of the materials on its Service are accurate, complete, or current. Ologywood may make changes to the materials contained on its Service at any time without notice.
            </p>
          </section>

          {/* Materials and Content */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Materials and Content</h2>
            <p className="text-base leading-relaxed">
              The materials on Ologywood's Service are protected by copyright law and owned or controlled by Ologywood or the party credited as the provider of the materials. You are granted a limited license to access and use these materials solely for your personal, non-commercial use. Any other use of the materials without the prior written permission of Ologywood is strictly prohibited.
            </p>
          </section>

          {/* User-Generated Content */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">7. User-Generated Content</h2>
            <p className="text-base leading-relaxed">
              By submitting content to Ologywood (including profiles, photos, messages, reviews, and rider templates), you grant Ologywood a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute such content. You represent and warrant that you own or have the necessary rights to the content you submit and that such content does not violate any third-party rights or applicable laws.
            </p>
            <p className="text-base leading-relaxed mt-4">
              You are solely responsible for the content you submit. Ologywood reserves the right to remove any content that violates these Terms of Service or is otherwise objectionable.
            </p>
          </section>

          {/* Booking and Payment Terms */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">8. Booking and Payment Terms</h2>
            <p className="text-base leading-relaxed">
              When you make a booking through Ologywood, you agree to pay all charges and fees associated with the booking. Payments are processed securely through Stripe. You are responsible for providing accurate payment information and maintaining sufficient funds. Ologywood is not responsible for declined payments or insufficient funds.
            </p>
            <p className="text-base leading-relaxed mt-4">
              <strong>Cancellation Policy:</strong> Cancellations and refunds are subject to the terms agreed upon between the artist and venue. Ologywood facilitates bookings but is not responsible for disputes between parties. For cancellation inquiries, please contact the other party directly or reach out to our support team.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">9. Dispute Resolution</h2>
            <p className="text-base leading-relaxed">
              Ologywood provides a platform for artists and venues to connect and conduct business. While we strive to facilitate positive interactions, Ologywood is not responsible for disputes between users. We encourage users to communicate directly to resolve any issues. If you have a dispute with another user, please contact our support team at <a href="mailto:info@ologywood.com" className="text-primary hover:underline">info@ologywood.com</a>.
            </p>
          </section>

          {/* Prohibited Conduct */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">10. Prohibited Conduct</h2>
            <p className="text-base leading-relaxed">
              You agree not to engage in any of the following prohibited conduct:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed ml-2">
              <li>Harassing, threatening, or abusing other users</li>
              <li>Posting false, misleading, or defamatory content</li>
              <li>Attempting to gain unauthorized access to the Service or other users' accounts</li>
              <li>Uploading viruses or malicious code</li>
              <li>Spamming or sending unsolicited messages</li>
              <li>Violating any applicable laws or regulations</li>
              <li>Infringing on intellectual property rights</li>
              <li>Engaging in fraud or deceptive practices</li>
            </ul>
          </section>

          {/* Account Termination */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">11. Account Termination</h2>
            <p className="text-base leading-relaxed">
              Ologywood reserves the right to terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including if you breach the Terms of Service. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">12. Limitation of Liability</h2>
            <p className="text-base leading-relaxed">
              To the fullest extent permitted by law, in no event shall Ologywood, its directors, employees, or agents be liable to you for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of or inability to use the Service.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">13. Indemnification</h2>
            <p className="text-base leading-relaxed">
              You agree to indemnify, defend, and hold harmless Ologywood and its officers, directors, employees, and agents from any and all claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or related to your use of the Service or your violation of these Terms of Service.
            </p>
          </section>

          {/* Third-Party Links */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">14. Third-Party Links</h2>
            <p className="text-base leading-relaxed">
              Ologywood's Service may contain links to third-party websites. Ologywood is not responsible for the content, accuracy, or practices of these external sites. Your use of third-party websites is at your own risk and subject to their terms and conditions.
            </p>
          </section>

          {/* Intellectual Property Rights */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">15. Intellectual Property Rights</h2>
            <p className="text-base leading-relaxed">
              The Service and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio) are owned by Ologywood, its licensors, or other providers of such material and are protected by United States and international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">16. Governing Law</h2>
            <p className="text-base leading-relaxed">
              These Terms of Service and your use of the Service are governed by and construed in accordance with the laws of the State of Georgia, United States, without regard to its conflict of law provisions. You agree to submit to the exclusive jurisdiction of the courts located in Georgia.
            </p>
          </section>

          {/* Entire Agreement */}
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">17. Entire Agreement</h2>
            <p className="text-base leading-relaxed">
              These Terms of Service, together with our Privacy Policy and any other policies or guidelines published on the Service, constitute the entire agreement between you and Ologywood regarding your use of the Service and supersede all prior and contemporaneous agreements, understandings, negotiations, and discussions, whether oral or written.
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
          <Link href="/privacy-policy">
            <Button variant="outline" className="w-full sm:w-auto">
              View Privacy Policy
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
