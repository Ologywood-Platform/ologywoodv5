import { Link } from "wouter";
import { ArrowLeft, Compass, Users, Heart, Key, Landmark, Sparkles, Globe, Cpu, BookOpen, Crown, Lightbulb, Handshake } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export default function About() {
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
      {/* Back Button */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Hero - Mission Statement */}
      <section className="max-w-5xl mx-auto px-4 pt-12 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Story</h1>
        <div className="max-w-3xl mx-auto">
          <p className="text-xl md:text-2xl text-gray-700 leading-relaxed font-light">
            OlogyWood<sup>®</sup> exists to become the world's most trusted operating system for talent—empowering artists, athletes, entertainers, creators, venues, organizations, and communities with the infrastructure, relationships, and opportunities they need to build meaningful, sustainable careers and lasting legacies.
          </p>
        </div>
      </section>

      {/* The Five Principles */}
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-purple-200 text-sm font-semibold uppercase tracking-widest mb-3">The Founder's Blueprint</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">The Five Principles</h2>
            <p className="text-purple-200 text-lg max-w-2xl mx-auto">The values that guide every decision we make.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { icon: Compass, title: "Opportunity", subtitle: "Before Popularity", desc: "We prioritize access and opportunity over algorithms and virality." },
              { icon: Users, title: "People", subtitle: "Before Platforms", desc: "Human connection and dignity come before technology and scale." },
              { icon: Heart, title: "Community", subtitle: "Before Competition", desc: "We build together, not against each other." },
              { icon: Key, title: "Ownership", subtitle: "Before Dependency", desc: "Creators own their work, their brand, and their future." },
              { icon: Landmark, title: "Legacy", subtitle: "Before Virality", desc: "We build for lasting impact, not fleeting attention." },
            ].map((principle, i) => (
              <div key={i} className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <principle.icon className="w-8 h-8 text-purple-300 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg">{principle.title}</h3>
                <p className="text-purple-200 text-sm font-medium mb-3">{principle.subtitle}</p>
                <p className="text-purple-300 text-xs leading-relaxed">{principle.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Responsibility */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Responsibility</h2>
            <p className="text-gray-600 text-lg">We hold ourselves to a higher standard.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              "Every feature is a moral decision.",
              "Technology should reduce barriers, not create them.",
              "Every profile represents a human life.",
              "Stewardship matters more than scale.",
              "Innovation carries responsibility.",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5 bg-white rounded-lg border border-gray-100">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">{i + 1}</span>
                <p className="text-gray-800 font-medium pt-1">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Future We Believe In */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">The Future We Believe In</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Our vision for what technology and community can achieve together.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Sparkles, text: "The future is shaped by values as much as by innovation." },
              { icon: Cpu, text: "Artificial intelligence should elevate human potential, not replace human purpose." },
              { icon: Globe, text: "Opportunity should become more accessible with every technological advance." },
              { icon: Users, text: "Communities become increasingly valuable in an increasingly digital world." },
              { icon: BookOpen, text: "Lifelong learning is essential." },
              { icon: Crown, text: "Leadership requires wisdom, integrity, and empathy." },
              { icon: Lightbulb, text: "Technology should adapt to humanity rather than expecting humanity to adapt to technology." },
              { icon: Handshake, text: "Leave the world more capable, more connected, and more hopeful than you found it." },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-xl border border-gray-100 hover:border-purple-200 transition-colors bg-white">
                <item.icon className="w-6 h-6 text-purple-600 mb-4" />
                <p className="text-gray-700 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creator Bill of Rights CTA */}
      <section className="py-16 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">The Creator Bill of Rights</h2>
          <p className="text-gray-600 mb-8">Our commitment to protecting and empowering every creator on our platform.</p>
          <Link href="/creator-rights" className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
            Read the Full Creator Bill of Rights
          </Link>
        </div>
      </section>

      {/* Closing */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm italic">
            The Founder's Principles are intended to serve as OlogyWood's enduring compass, guiding decisions, leadership, product development, and culture as the company evolves.
          </p>
        </div>
      </section>
    </div>
  );
}
