import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: '1',
    category: 'Getting Started',
    question: 'How do I create an account on Ologywood?',
    answer: 'Click "Sign In" on the homepage and choose whether you\'re an artist or venue. Fill in your profile information, verify your email, and you\'re ready to go! Artists can browse venues and create bookings, while venues can browse and book artists.',
  },
  {
    id: '2',
    category: 'Getting Started',
    question: 'What\'s the difference between Artist and Venue accounts?',
    answer: 'Artist accounts are for performers who want to get discovered and book gigs. Venue accounts are for event spaces, clubs, festivals, and other locations looking to book talent. Each account type has features tailored to their needs.',
  },
  {
    id: '3',
    category: 'Bookings',
    question: 'How do I make a booking?',
    answer: 'Browse artists or venues using the search and filter tools. Click on a profile you\'re interested in, review their availability and rates, and send a booking request. The other party will review and confirm. Once confirmed, you\'ll receive a booking confirmation.',
  },
  {
    id: '4',
    category: 'Payments',
    question: 'How do payments work?',
    answer: 'Payments are processed securely through Stripe. Typically, a 50% deposit is required to confirm a booking, with the remaining balance due 7 days before the event. You can pay by credit card or bank transfer.',
  },
  {
    id: '5',
    category: 'Payments',
    question: 'Is my payment information secure?',
    answer: 'Yes! We use industry-standard encryption and Stripe\'s secure payment processing. We never store your full credit card information on our servers. Your payment data is protected with SSL/TLS encryption.',
  },
  {
    id: '6',
    category: 'Riders',
    question: 'What is a rider and why do I need one?',
    answer: 'A rider is a document outlining your technical requirements, hospitality needs, and payment terms. Artists use riders to communicate their setup requirements to venues. You can create a custom rider template in your profile and share it with booking inquiries.',
  },
  {
    id: '7',
    category: 'Support',
    question: 'How do I contact support?',
    answer: 'You can reach our support team via email at info@ologywood.com. We\'re available Monday-Friday, 9:00 AM - 6:00 PM EST. You can also use the contact form in your account settings.',
  },
  {
    id: '8',
    category: 'Support',
    question: 'What should I do if I have a dispute with another user?',
    answer: 'We encourage direct communication first. If you can\'t resolve it, contact our support team with details about the issue. We\'ll review and help mediate to find a fair solution for both parties.',
  },
];

export function FAQSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = Array.from(new Set(faqItems.map(item => item.category)));

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Frequently Asked Questions</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            Find answers to common questions about using Ologywood.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 px-2">{category}</h3>
              <div className="space-y-3 sm:space-y-4">
                {faqItems
                  .filter(item => item.category === category)
                  .map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-start justify-between gap-3 sm:gap-4">
                          <CardTitle className="text-sm sm:text-base font-semibold text-foreground text-left flex-1">
                            {item.question}
                          </CardTitle>
                          <div className="flex-shrink-0 mt-1">
                            {expandedId === item.id ? (
                              <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            ) : (
                              <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {expandedId === item.id && (
                        <CardContent className="pt-0">
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {item.answer}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-muted/50 rounded-lg text-center">
          <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
            Didn't find what you're looking for?
          </p>
          <a href="mailto:info@ologywood.com" className="text-primary hover:underline font-semibold text-sm sm:text-base">
            Contact our support team
          </a>
        </div>
      </div>
    </section>
  );
}
