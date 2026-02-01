import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: "1",
    category: "Getting Started",
    question: "How do I create an account on Ologywood?",
    answer:
      "Click 'Get Started' on the homepage and choose whether you're an artist or venue. Fill in your profile information, verify your email, and you're ready to go! Artists can browse venues and create bookings, while venues can browse and book artists.",
  },
  {
    id: "2",
    category: "Getting Started",
    question: "What's the difference between Artist and Venue accounts?",
    answer:
      "Artist accounts are for performers who want to get discovered and book gigs. Venue accounts are for event spaces, clubs, festivals, and other locations looking to book talent. Each account type has features tailored to their needs.",
  },
  {
    id: "3",
    category: "Bookings",
    question: "How do I make a booking?",
    answer:
      "Browse artists or venues using the search and filter tools. Click on a profile you're interested in, review their availability and rates, and send a booking request. The other party will review and confirm. Once confirmed, you'll receive a booking confirmation.",
  },
  {
    id: "4",
    category: "Bookings",
    question: "Can I cancel a booking?",
    answer:
      "Cancellation policies vary by artist or venue. Check the specific cancellation terms when making a booking. For disputes or issues, contact our support team at info@ologywood.com and we'll help mediate.",
  },
  {
    id: "5",
    category: "Payments",
    question: "How do payments work?",
    answer:
      "Payments are processed securely through Stripe. Typically, a 50% deposit is required to confirm a booking, with the remaining balance due 7 days before the event. You can pay by credit card or bank transfer.",
  },
  {
    id: "6",
    category: "Payments",
    question: "Is my payment information secure?",
    answer:
      "Yes! We use industry-standard encryption and Stripe's secure payment processing. We never store your full credit card information on our servers. Your payment data is protected with SSL/TLS encryption.",
  },
  {
    id: "7",
    category: "Riders",
    question: "What is a rider and why do I need one?",
    answer:
      "A rider is a document outlining your technical requirements, hospitality needs, and payment terms. Artists use riders to communicate their setup requirements to venues. You can create a custom rider template in your profile and share it with booking inquiries.",
  },
  {
    id: "8",
    category: "Riders",
    question: "Can I customize my rider template?",
    answer:
      "Absolutely! Use our Rider Template Builder to create a custom rider with sections for technical requirements, hospitality, payment terms, and more. You can download it as a document or share it directly through the platform.",
  },
  {
    id: "9",
    category: "Profile",
    question: "How do I update my profile?",
    answer:
      "Go to your dashboard and click 'Edit Profile'. You can update your bio, photos, rates, availability, and other information. Changes are saved immediately and visible to other users.",
  },
  {
    id: "10",
    category: "Profile",
    question: "Can I have multiple profiles?",
    answer:
      "Each email address can have one account. If you're both an artist and venue owner, you can manage both roles within a single account or create separate accounts with different email addresses.",
  },
  {
    id: "11",
    category: "Support",
    question: "How do I contact support?",
    answer:
      "You can reach our support team via email at info@ologywood.com or call 678-525-0891. We're available Monday-Friday, 9:00 AM - 6:00 PM EST. You can also use the contact form on our website.",
  },
  {
    id: "12",
    category: "Support",
    question: "What should I do if I have a dispute with another user?",
    answer:
      "We encourage direct communication first. If you can't resolve it, contact our support team with details about the issue. We'll review and help mediate to find a fair solution for both parties.",
  },
];

export default function FAQ() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(faqItems.map((item) => item.category)));
  const filteredItems = selectedCategory
    ? faqItems.filter((item) => item.category === selectedCategory)
    : faqItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
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
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground">
            Find answers to common questions about Ologywood. Can't find what you're looking for?{" "}
            <Link href="/contact">
              <span className="text-primary hover:underline cursor-pointer">Contact us</span>
            </Link>
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedCategory === null
                ? "bg-primary text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedCategory === category
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition">
              <button
                onClick={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
                className="w-full px-6 py-4 flex items-start justify-between gap-4 text-left hover:bg-gray-50 transition"
              >
                <div className="flex-1">
                  <div className="text-xs font-semibold text-primary mb-1">
                    {item.category}
                  </div>
                  <h3 className="font-semibold text-foreground">{item.question}</h3>
                </div>
                {expandedId === item.id ? (
                  <ChevronUp className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                )}
              </button>

              {expandedId === item.id && (
                <div className="px-6 py-4 border-t bg-gray-50">
                  <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Need Help */}
        <div className="mt-12 bg-gradient-to-r from-primary to-indigo-600 rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="mb-6">
            Our support team is here to help! Reach out to us and we'll get back to you within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="bg-white text-primary hover:bg-gray-100 w-full sm:w-auto">
                Contact Support
              </Button>
            </Link>
            <a href="mailto:info@ologywood.com">
              <Button variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                Email Us
              </Button>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
