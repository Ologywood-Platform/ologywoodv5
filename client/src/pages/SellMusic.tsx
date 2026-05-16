/**
 * SellMusic — Marketing landing page for White Label Releases.
 * Highlights the 1% fee advantage, tier comparison, and CTA to sign up.
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  Music, Upload, DollarSign, Download, Shield, BarChart3,
  Headphones, CheckCircle2, ArrowRight, Disc3, Zap, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteHeader from "@/components/SiteHeader";
import { JsonLd, buildBreadcrumbJsonLd } from "@/components/JsonLd";
import { setMetaTags, pageMetaTags } from "@/utils/seoMeta";

export default function SellMusic() {
  const [, navigate] = useLocation();

  useEffect(() => {
    setMetaTags(pageMetaTags.sellMusic);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <JsonLd
        id="sell-music"
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Sell Your Music", url: "/sell-music" },
        ])}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <Disc3 className="w-4 h-4 text-purple-300" />
            <span className="text-sm font-medium text-purple-200">White Label Releases</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Sell Your Music.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300">
              Keep 99%.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-purple-200 max-w-2xl mx-auto mb-8">
            Upload singles, set your price, and sell directly from your Ologywood artist profile.
            Just a 1% platform fee — the lowest in the industry.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => navigate("/get-started")}
              size="lg"
              className="bg-white text-purple-900 hover:bg-purple-50 font-semibold px-8 py-3 text-base"
            >
              Start Selling <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => navigate("/pricing")}
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-3 text-base"
            >
              View Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Fee Comparison */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            The Lowest Fee in Music Distribution
          </h2>
          <p className="text-gray-600 mb-10 max-w-xl mx-auto">
            Most platforms take 15–30% of your revenue. Ologywood takes just 1%.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="border rounded-lg p-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Other Platforms</p>
              <p className="text-4xl font-bold text-red-500">15–30%</p>
              <p className="text-xs text-gray-400 mt-1">per sale</p>
            </div>
            <div className="border-2 border-purple-600 rounded-lg p-6 bg-purple-50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                OLOGYWOOD
              </div>
              <p className="text-sm font-medium text-purple-600 mb-2">White Label Releases</p>
              <p className="text-4xl font-bold text-purple-600">1%</p>
              <p className="text-xs text-purple-500 mt-1">per sale</p>
            </div>
            <div className="border rounded-lg p-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Your Earnings</p>
              <p className="text-4xl font-bold text-green-600">99%</p>
              <p className="text-xs text-gray-400 mt-1">goes to you</p>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            On a $10 single, you earn $9.90. On other platforms, you'd earn $7–$8.50.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: <Upload className="w-7 h-7" />,
                title: "Upload",
                description: "Upload your audio file (MP3, WAV, FLAC) and optional cover art to your Release Manager."
              },
              {
                icon: <DollarSign className="w-7 h-7" />,
                title: "Set Your Price",
                description: "Choose a fixed price or enable pay-what-you-want for fans to support you at any level."
              },
              {
                icon: <Globe className="w-7 h-7" />,
                title: "Publish",
                description: "Your single goes live on your artist profile with a 30-second preview player and buy button."
              },
              {
                icon: <Download className="w-7 h-7" />,
                title: "Get Paid",
                description: "Fans purchase and download instantly. Earnings go directly to your Stripe account."
              }
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-purple-600 mb-1">STEP {i + 1}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Everything You Need to Sell Music
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Headphones className="w-5 h-5" />, title: "30-Second Preview", desc: "Built-in audio player with progress bar so fans can sample before buying." },
              { icon: <Shield className="w-5 h-5" />, title: "Secure Downloads", desc: "Presigned URLs with 5-download limit and 1-hour expiry protect your files." },
              { icon: <BarChart3 className="w-5 h-5" />, title: "Sales Analytics", desc: "Track plays, purchases, and revenue from your earnings dashboard." },
              { icon: <Zap className="w-5 h-5" />, title: "Instant Delivery", desc: "Buyers get immediate access to download after checkout completes." },
              { icon: <Music className="w-5 h-5" />, title: "Fan Notifications", desc: "Your followers are automatically notified when you publish a new release." },
              { icon: <CheckCircle2 className="w-5 h-5" />, title: "DMCA Compliant", desc: "Built-in rights certification and takedown process for copyright protection." },
            ].map((feature, i) => (
              <div key={i} className="border rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-3">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tier Comparison */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">
            Choose Your Plan
          </h2>
          <p className="text-gray-600 text-center mb-10">
            White Label Releases are available on Starter and Professional plans.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-white border rounded-lg p-6 text-center opacity-60">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Free</h3>
              <p className="text-3xl font-bold text-gray-400 mb-2">$0</p>
              <p className="text-sm text-gray-500 mb-4">No music releases</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>Artist profile</li>
                <li>2 booking requests/mo</li>
                <li>Messaging</li>
              </ul>
            </div>

            {/* Starter */}
            <div className="bg-white border-2 border-purple-600 rounded-lg p-6 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                POPULAR
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Starter</h3>
              <p className="text-3xl font-bold text-purple-600 mb-2">$9<span className="text-sm font-normal text-gray-500">/mo</span></p>
              <p className="text-sm text-gray-700 mb-4 font-medium">Up to 2 singles</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>Fixed pricing</li>
                <li>30-second previews</li>
                <li>Sales analytics</li>
                <li>Fan notifications</li>
              </ul>
              <Button
                onClick={() => navigate("/pricing")}
                className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-sm"
              >
                Get Starter
              </Button>
            </div>

            {/* Professional */}
            <div className="bg-white border rounded-lg p-6 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Professional</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">$29<span className="text-sm font-normal text-gray-500">/mo</span></p>
              <p className="text-sm text-gray-700 mb-4 font-medium">Unlimited singles</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>Everything in Starter</li>
                <li>Pay-what-you-want pricing</li>
                <li>Advanced analytics</li>
                <li>Priority support</li>
              </ul>
              <Button
                onClick={() => navigate("/pricing")}
                variant="outline"
                className="w-full mt-4 text-sm"
              >
                Go Professional
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Selling?
          </h2>
          <p className="text-purple-200 text-lg mb-8 max-w-xl mx-auto">
            Join Ologywood and start earning from your music today. Set up takes less than 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => navigate("/get-started")}
              size="lg"
              className="bg-white text-purple-700 hover:bg-purple-50 font-semibold px-8"
            >
              Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => navigate("/how-it-works")}
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 font-semibold px-8"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
