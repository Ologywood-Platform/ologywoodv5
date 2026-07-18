import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Users, AlertTriangle, ShieldCheck, Ban, Flag, Heart } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { setMetaTags } from "@/utils/seoMeta";

export default function CommunityGuidelines() {
  useEffect(() => {
    setMetaTags({
      title: "Community Guidelines | OlogyWood",
      description: "OlogyWood community guidelines — our standards for a safe, respectful, and professional platform for all users.",
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

        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Community Guidelines</h1>
        </div>
        <p className="text-gray-600 mb-8 max-w-2xl">
          OlogyWood is a professional platform built on trust, respect, and opportunity. These guidelines ensure a safe and productive environment for all users — talent, venues, fans, and partners.
        </p>

        <p className="text-sm text-gray-500 mb-10">Last updated: July 17, 2026</p>

        <div className="space-y-10">
          {/* Our Standards */}
          <section className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Our Standards</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              We expect all members of the OlogyWood community to uphold these standards in every interaction — whether booking talent, hosting sessions, engaging with fans, or communicating through the platform.
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                <span><strong>Be Authentic</strong> — Represent yourself honestly. Use real names, accurate credentials, and genuine content.</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                <span><strong>Be Professional</strong> — Treat every interaction as a business relationship. Communicate clearly, honor commitments, and respect deadlines.</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                <span><strong>Be Respectful</strong> — Treat all users with dignity regardless of their background, genre, sport, or audience size.</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                <span><strong>Be Honest</strong> — Provide accurate information in profiles, bookings, reviews, and communications.</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                <span><strong>Be Supportive</strong> — Help build a community where talent can grow and fans can connect meaningfully.</span>
              </li>
            </ul>
          </section>

          {/* Prohibited Activities */}
          <section className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Ban className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">Prohibited Activities</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              The following activities are strictly prohibited on OlogyWood and may result in content removal, account suspension, or permanent ban:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Fraud & Deception</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Fake artist or athlete profiles</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Impersonation of any person or entity</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Fraudulent bookings or transactions</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Fake sponsorships or endorsements</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Unauthorized venue listings</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Manipulation of reviews or ratings</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Harmful Behavior</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Harassment or threats toward any user</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Hate speech or discrimination</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Spam or unsolicited commercial messages</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Identity theft or data harvesting</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Unauthorized recordings of sessions</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Circumventing platform fees</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Intellectual Property</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Copyright infringement</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Counterfeit merchandise</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Unauthorized use of logos or branding</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Uploading content you don't own</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Platform Abuse</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Automated scraping or data extraction</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Interfering with platform infrastructure</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Creating multiple accounts to evade bans</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> Using the platform for illegal activities</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Content Standards */}
          <section className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">Content Standards</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              All content uploaded to OlogyWood — including profiles, music, videos, photos, event listings, merchandise, and Ology Live sessions — must meet these standards:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span>You must own or have explicit permission to use all content you upload.</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span>Content must not contain illegal material or promote illegal activities.</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span>Explicit content must be clearly labeled where applicable.</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span>AI-generated content should be reviewed before publication. Users are responsible for ensuring rights to AI-assisted content.</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span>Profile information must be accurate and not misleading.</span>
              </li>
            </ul>
          </section>

          {/* Enforcement */}
          <section className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-semibold text-gray-900">Enforcement</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              OlogyWood takes violations seriously. Depending on the severity and frequency of violations, enforcement actions may include:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                <h3 className="font-medium text-gray-900 mb-2">First Offense</h3>
                <p className="text-sm text-gray-700">Warning notification with explanation of the violation and guidance on compliance.</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                <h3 className="font-medium text-gray-900 mb-2">Repeated Violations</h3>
                <p className="text-sm text-gray-700">Content removal, temporary account suspension, or feature restrictions.</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <h3 className="font-medium text-gray-900 mb-2">Severe Violations</h3>
                <p className="text-sm text-gray-700">Permanent account termination and potential referral to appropriate authorities.</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h3 className="font-medium text-gray-900 mb-2">Appeals</h3>
                <p className="text-sm text-gray-700">Users may appeal enforcement decisions through our Help Center within 30 days.</p>
              </div>
            </div>
          </section>

          {/* Reporting */}
          <section className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Flag className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold text-gray-900">Reporting Violations</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              If you encounter content or behavior that violates these guidelines, please report it using the "Report an Issue" feature available on profiles, bookings, and sessions. You can also contact us through our{" "}
              <Link href="/help" className="text-purple-600 hover:underline">Help Center</Link>.
              All reports are reviewed by our team and handled confidentially.
            </p>
          </section>
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            These guidelines work alongside our{" "}
            <Link href="/terms-of-service" className="text-purple-600 hover:underline">Terms of Service</Link>,{" "}
            <Link href="/disclaimer" className="text-purple-600 hover:underline">Disclaimer</Link>, and{" "}
            <Link href="/creator-rights" className="text-purple-600 hover:underline">Creator Bill of Rights</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
