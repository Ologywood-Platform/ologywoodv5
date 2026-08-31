import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { setMetaTags } from "@/utils/seoMeta";

export default function Disclaimer() {
  useEffect(() => {
    setMetaTags({
      title: "Disclaimer | OlogyWood",
      description: "Platform disclaimer and legal notices for OlogyWood.",
    });
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-6 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-8">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <h1 className="text-3xl font-bold text-gray-900">Platform Disclaimer</h1>
        </div>

        <p className="text-sm text-gray-500 mb-8">Last updated: August 30, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          {/* General Disclaimer */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">General Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              OlogyWood ("the Platform") is an online marketplace that connects talent — including music artists, visual artists, authors and writers, athletes, creators, entertainers, filmmakers, and influencers — with venues, event organizers, brands, readers, and fans. The Platform serves as a facilitator and intermediary for bookings, communications, products, and transactions between independent parties. OlogyWood does not employ, manage, represent, or publish talent listed on the Platform.
            </p>
          </section>

          {/* No Endorsement */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">No Endorsement of Users or Content</h2>
            <p className="text-gray-700 leading-relaxed">
              OlogyWood does not endorse, guarantee, or verify the accuracy, completeness, or reliability of user-generated content, including profiles, biographies, books, eBooks, cover art, product details, photos, videos, reviews, ratings, event listings, or promotional materials. Users are solely responsible for the content and product information they publish. OlogyWood may remove content that violates Platform policies but assumes no obligation to pre-screen every listing.
            </p>
          </section>

          {/* Booking & Contracts */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Booking & Contractual Relationships</h2>
            <p className="text-gray-700 leading-relaxed">
              All bookings, contracts, and agreements made through OlogyWood are between the booking party and the talent or venue directly. OlogyWood is not a party to any contract formed between users. While the Platform provides tools to facilitate agreements (including rider templates, contract forms, and payment processing), OlogyWood does not guarantee performance, attendance, or fulfillment of any booking. Disputes between parties should be resolved directly or through our optional dispute resolution process.
            </p>
          </section>

          {/* Payment Processing */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Payment Processing</h2>
            <p className="text-gray-700 leading-relaxed">
              Payment processing on OlogyWood is handled by Stripe, a third-party payment processor. OlogyWood does not store credit card information directly. All financial transactions are subject to Stripe's terms of service and privacy policy. OlogyWood is not responsible for payment processing errors, delays, or failures caused by third-party services. Refund policies are outlined in our Terms of Use.
            </p>
          </section>

          {/* NIL Compliance */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Creator Shop, Books, and eBooks</h2>
            <p className="text-gray-700 leading-relaxed">
              Physical books and other goods are sold and fulfilled by the listing creator, who is responsible for inventory, condition, shipping, pickup, signed-copy claims, returns, and product accuracy. OlogyWood facilitates checkout and order records but is not the publisher, printer, distributor, or fulfillment provider. eBook files are supplied by the seller and released only after verified purchase access. Sellers are responsible for confirming all copyright, publishing, cover-art, contributor, and distribution rights. Buyers receive a limited personal-use license, not ownership of copyright or redistribution rights.
            </p>
          </section>

          {/* NIL Compliance */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">NIL (Name, Image, Likeness) Compliance</h2>
            <p className="text-gray-700 leading-relaxed">
              OlogyWood provides tools and features to support athletes in managing their Name, Image, and Likeness (NIL) opportunities. However, OlogyWood does not provide legal advice regarding NIL compliance. Athletes are solely responsible for ensuring that their use of the Platform and any deals or agreements they enter into comply with applicable NCAA, NAIA, conference, institutional, and state-level NIL regulations. OlogyWood strongly recommends that athletes consult with their compliance office or a qualified attorney before entering into NIL agreements.
            </p>
          </section>

          {/* Ology Live */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Ology Live Virtual Sessions</h2>
            <p className="text-gray-700 leading-relaxed">
              Ology Live sessions are virtual experiences hosted by independent talent on the Platform. Content shared during sessions — including Q&A responses, advice, demonstrations, or commentary — represents the personal opinions and knowledge of the host and does not constitute professional advice (legal, medical, financial, or otherwise). OlogyWood is not responsible for the content, quality, or outcomes of any Ology Live session. Session recordings, if any, are subject to the host's policies.
            </p>
          </section>

          {/* Age Requirement */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Age Requirement</h2>
            <p className="text-gray-700 leading-relaxed">
              You must be at least 18 years of age to create an account, make purchases, or enter into agreements on OlogyWood. By using the Platform, you represent and warrant that you meet this age requirement. Users under 18 may browse public content but may not register, transact, or participate in Ology Live sessions.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Intellectual Property & Copyright</h2>
            <p className="text-gray-700 leading-relaxed">
              Users retain ownership of their original content uploaded to OlogyWood. By uploading content, users grant OlogyWood a non-exclusive, royalty-free license to store, display, and deliver that content within the Platform for the purpose of providing requested services. Users are solely responsible for ensuring they have the rights to all uploaded content, including books, manuscripts, cover art, music, images, and videos. OlogyWood will respond to valid DMCA takedown notices in accordance with applicable law.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, OLOGYWOOD SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM: (A) YOUR USE OR INABILITY TO USE THE PLATFORM; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE PLATFORM; (C) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR CONTENT; OR (D) ANY BOOKING, TRANSACTION, OR AGREEMENT BETWEEN USERS.
            </p>
          </section>

          {/* No Warranty */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">No Warranty</h2>
            <p className="text-gray-700 leading-relaxed">
              The Platform is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. OlogyWood does not warrant that the Platform will be uninterrupted, secure, or error-free.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this disclaimer, please contact us through our{" "}
              <Link href="/help" className="text-purple-600 hover:text-purple-700 underline">
                Help Center
              </Link>{" "}
              or email us at support@ologywood.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
