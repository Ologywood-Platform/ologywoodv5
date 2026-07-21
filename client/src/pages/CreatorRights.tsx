import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Shield, Heart, Eye, Cpu, Handshake, Fingerprint, Users, Scale, Sparkles } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { setMetaTags } from "@/utils/seoMeta";

const rights = [
  {
    icon: Heart,
    title: "Inherent Dignity",
    description: "Every creator possesses inherent dignity that technology must respect.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Eye,
    title: "Ownership, Transparency & Fairness",
    description: "Ownership, transparency, and fairness are foundational — not optional.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Cpu,
    title: "AI That Amplifies",
    description: "AI should amplify human creativity while preserving authorship, attribution, and consent.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Handshake,
    title: "Trust Through Openness",
    description: "Trust grows through openness, accountability, and consistent ethical behavior.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Fingerprint,
    title: "Identity Protection",
    description: "Professional identity and reputation are valuable assets that deserve protection.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    icon: Users,
    title: "Empowered Communities",
    description: "Communities thrive when creators are empowered rather than controlled.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    icon: Scale,
    title: "Rights & Responsibilities",
    description: "Rights and responsibilities are inseparable.",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    icon: Sparkles,
    title: "Protect Those Who Build",
    description: "The strongest platforms are those that consistently protect the people who make them possible.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
];

export default function CreatorRights() {
  useEffect(() => {
    setMetaTags({
      title: "Creator Bill of Rights | OlogyWood",
      description: "Every creator on OlogyWood has fundamental rights. We believe in ownership, transparency, and empowering talent.",
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
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-purple-200 hover:text-white mb-8 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Shield className="w-4 h-4 text-purple-300" />
              <span className="text-sm font-medium text-purple-200">From the Founder's Blueprint</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              The OlogyWood<sup>®</sup><br />Creator Bill of Rights
            </h1>
            <p className="text-lg sm:text-xl text-purple-200 max-w-2xl mx-auto leading-relaxed">
              We believe creators deserve a platform built to serve them — not exploit them. These rights are the foundation of everything we build.
            </p>
          </div>
        </div>
      </div>

      {/* Rights Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            The 8 Principles
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            These aren't just words — they're commitments backed by how our platform is built, how our policies are written, and how we operate every day.
          </p>
        </div>

        <div className="space-y-6">
          {rights.map((right, index) => (
            <div
              key={index}
              className={`flex flex-col sm:flex-row items-start gap-5 p-6 sm:p-8 rounded-2xl ${right.bg} border border-gray-100`}
            >
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm`}>
                <right.icon className={`w-6 h-6 ${right.color}`} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {index + 1}. {right.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {right.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Values Section */}
      <div className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Our Brand Values
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Every decision we make is guided by these principles.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {["Trust", "Creativity", "Opportunity", "Authenticity", "Transparency", "Professionalism", "Community", "Innovation", "Ownership", "Respect"].map((value) => (
              <div key={value} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                <span className="text-sm font-semibold text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg sm:text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
            OlogyWood<sup>®</sup> exists to become the world's most trusted operating system for talent — empowering artists, athletes, entertainers, creators, venues, organizations, and communities with the infrastructure, relationships, and opportunities they need to build meaningful, sustainable careers and lasting legacies.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/get-started" className="inline-flex items-center justify-center px-6 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition">
              Join OlogyWood
            </Link>
            <Link href="/about" className="inline-flex items-center justify-center px-6 py-3 border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition">
              Our Story
            </Link>
          </div>
        </div>
      </div>

      {/* IP Notice */}
      <div className="border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>
              OlogyWood® is a registered trademark of OlogyWood LLC. Ology Live™, Ology Fan Club™, and Ology Experiences™ are trademarks of OlogyWood LLC.
            </p>
            <p>
              <Link href="/terms-of-service" className="text-purple-600 hover:underline">Terms of Service</Link>
              {" · "}
              <Link href="/disclaimer" className="text-purple-600 hover:underline">Disclaimer</Link>
              {" · "}
              <Link href="/privacy-policy" className="text-purple-600 hover:underline">Privacy Policy</Link>
              {" · "}
              <Link href="/community-guidelines" className="text-purple-600 hover:underline">Community Guidelines</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
