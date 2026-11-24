import { Link } from "wouter";
import { ArrowLeft, Compass, Users, Heart, Key, Landmark, Sparkles, Globe, Cpu, BookOpen, Crown, Lightbulb, Handshake, Linkedin } from "lucide-react";
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
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
            <p className="text-lg md:text-xl text-purple-900 font-medium italic">
              "Creators own their audience. Creators choose where their content lives. OlogyWood powers everything that makes that content profitable."
            </p>
            <p className="text-sm text-purple-700 mt-3">
              We are the monetization layer for creators. Host your movie on YouTube. Stream your music on Spotify. Teach your course anywhere. OlogyWood handles discovery, ticketing, fan relationships, and revenue — so you can focus on creating.
            </p>
          </div>
        </div>
      </section>

      {/* Founder Story */}
      <section className="border-y border-purple-100 bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-20">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 md:grid-cols-[0.8fr_1.4fr] md:items-start">
          <div>
            <figure className="relative mx-auto max-w-sm md:mx-0">
              <div className="overflow-hidden rounded-2xl bg-gray-900 shadow-2xl ring-1 ring-purple-200">
                <img
                  src="/manus-storage/492020597_9629250343808138_7224572203166570567_n_958a6533.jpg"
                  alt="Gary Chisolm, founder of OlogyWood"
                  className="aspect-[7/8] w-full object-cover grayscale"
                  loading="lazy"
                  decoding="async"
                  width="840"
                  height="960"
                />
              </div>
              <div className="absolute -bottom-6 -right-4 w-28 overflow-hidden rounded-xl border-4 border-white bg-black shadow-xl sm:w-36">
                <img
                  src="/manus-storage/486320892_9430608620338979_462807889778603020_n_819d60bd.jpg"
                  alt="Illustrated portrait of Gary Chisolm"
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  width="600"
                  height="600"
                />
              </div>
              <figcaption className="mt-9 text-sm font-medium text-gray-600">Gary Chisolm · Founder, OlogyWood</figcaption>
              <div className="mt-4 flex flex-wrap gap-3" aria-label="Gary Chisolm social profiles">
                <a
                  href="https://www.linkedin.com/in/gary-chisolm-ab835241/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-purple-800 transition-colors hover:border-purple-400 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  aria-label="Connect with Gary Chisolm on LinkedIn (opens in a new tab)"
                >
                  <Linkedin className="h-4 w-4" aria-hidden="true" />
                  LinkedIn
                </a>
                <a
                  href="https://x.com/ChizoWorldwide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-purple-800 transition-colors hover:border-purple-400 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  aria-label="Follow Gary Chisolm on X (opens in a new tab)"
                >
                  <span className="text-sm font-bold" aria-hidden="true">𝕏</span>
                  X
                </a>
              </div>
            </figure>
            <p className="mt-10 mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-purple-700">The founder's story</p>
            <h2 className="text-3xl font-bold leading-tight text-gray-900 md:text-4xl">Built from experience.</h2>
            <p className="mt-5 text-lg leading-8 text-gray-600">From singing in Jacksonville to building behind the scenes, OlogyWood grew from a lifetime in entertainment.</p>
          </div>
          <div className="space-y-5 text-base leading-8 text-gray-700">
            <p>My journey to building OlogyWood began long before I thought about creating a platform. I started as a singer in Jacksonville, Florida, where music introduced me to performers, musicians, producers, and the people working behind the scenes to bring creative projects to life.</p>
            <p>I later became part of the group Mamado and She, where I played keyboards, sang background vocals, and shared lead vocals on “R.U.N. 2 Me.” Those early experiences gave me my first real understanding of the music business—not only as a performer, but as someone learning how many people and skills are required to create opportunities.</p>
            <p>After moving to Atlanta, I continued writing and producing. I worked with Tommy Henderson and had the opportunity to produce interludes for 4th Avenue. Through those connections, I was introduced to other professionals in the entertainment industry and spent time developing songs and creative projects at UpFront Entertainment, including writing sessions with Akon.</p>
            <p>As my career evolved, I moved deeper into audio engineering, live production, corporate events, and entertainment technology. I learned how to support artists and productions from behind the scenes, solve technical problems, and help turn ideas into experiences that audiences could connect with.</p>
            <p>Those experiences shaped the idea for OlogyWood. I saw how difficult it can be for independent artists and creators to manage their profiles, promote their work, find opportunities, connect with fans, sell products, and organize the business side of their careers. Too often, these functions are scattered across different platforms, each with its own limitations.</p>
            <p>OlogyWood is designed to bring together artist profiles, booking, music, events, ticketing, fan support, merchandise, and creator opportunities in one place. The goal is to give artists and creators better tools to present their work, build professional connections, and create more ownership around their careers.</p>
            <p>For a long time, building a platform like this would have required a large development team and resources that were out of reach. As technology made software development more accessible, I realized I could begin turning the vision in my head into something real.</p>
            <p className="text-xl font-semibold leading-8 text-purple-900">So I started.</p>
            <p>OlogyWood is the result of my experiences as an artist, songwriter, producer, engineer, and builder. It is also a reflection of what I believe the entertainment industry can become: more accessible, more connected, and more empowering for people who may not have access to traditional pathways.</p>
            <p>I have been fortunate to have people recognize the vision and encourage me along the way, including John Christmas, my legal advisor, who has supported what I am building and introduced me to people who are now part of the OlogyWood community.</p>
            <p>This is not just a technology project to me. It is a platform built from years of experience, curiosity, problem-solving, and a belief that talented people deserve better ways to be discovered, booked, supported, and paid.</p>
            <p>It has been a long journey, but I feel like I am just getting started.</p>
            <p className="font-semibold text-gray-900">— Gary Chisolm, Founder</p>
          </div>
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
