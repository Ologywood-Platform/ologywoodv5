import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle,
  X,
  BookOpen,
  MessageCircle,
  FileText,
  ChevronDown,
  Play,
  Clock,
} from 'lucide-react';
import { getAllTutorials, getTutorialsByCategory } from '@/lib/tutorials';

interface HelpMenuProps {
  onTutorialSelect?: (tutorialId: string) => void;
}

export function HelpMenu({ onTutorialSelect }: HelpMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const allTutorials = getAllTutorials();
  const onboardingTutorials = getTutorialsByCategory('onboarding');
  const featureTutorials = getTutorialsByCategory('feature');

  const faqs = [
    {
      id: 'faq-1',
      question: 'How do I create my profile?',
      answer:
        'Click on your account menu and select "Profile Settings". Follow the step-by-step form to add your information, photos, and preferences. You can also access the tutorial from the Help menu for guided assistance.',
    },
    {
      id: 'faq-2',
      question: 'How long does it take to get a response to my booking request?',
      answer:
        'Most artists and venues respond within 24-48 hours. You\'ll receive an email notification when they respond. If you don\'t hear back within 48 hours, you can send a follow-up message.',
    },
    {
      id: 'faq-3',
      question: 'Can I cancel a booking?',
      answer:
        'Yes, you can cancel a booking from your Bookings dashboard. Cancellation policies depend on how close the event date is. Please review the cancellation terms before confirming a booking.',
    },
    {
      id: 'faq-4',
      question: 'How do I update my rates?',
      answer:
        'Go to your Profile Settings and look for the Rates section. You can set different rates for different event types. Changes take effect immediately.',
    },
    {
      id: 'faq-5',
      question: 'How do I share my profile on social media?',
      answer:
        'Click the Share button on your profile. Select the social media platform you want to share to (Facebook, Twitter, LinkedIn, WhatsApp, or Email). Your profile will be shared with a direct link.',
    },
    {
      id: 'faq-6',
      question: 'How do I view my analytics?',
      answer:
        'Go to your Dashboard and click on the Analytics tab. You\'ll see metrics like profile views, inquiries, bookings, and ratings. There\'s a tutorial available to help you understand the dashboard.',
    },
    {
      id: 'faq-7',
      question: 'What payment methods do you accept?',
      answer:
        'We use Stripe for secure payments. We accept all major credit cards (Visa, Mastercard, American Express) and other payment methods supported by Stripe.',
    },
    {
      id: 'faq-8',
      question: 'How do I leave a review?',
      answer:
        'After a booking is completed, you\'ll have the option to leave a review. Go to your Bookings history and click "Leave Review" on the completed booking.',
    },
  ];

  const handleTutorialClick = (tutorialId: string) => {
    onTutorialSelect?.(tutorialId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Help Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        title="Help & Support"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      {/* Help Menu Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setIsOpen(false)} />
      )}

      {isOpen && (
        <div className="fixed right-4 top-16 z-50 w-96 max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-top-2">
          <Card className="shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Help & Support
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <Tabs defaultValue="tutorials" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tutorials" className="text-xs">
                    <BookOpen className="h-4 w-4 mr-1" />
                    Tutorials
                  </TabsTrigger>
                  <TabsTrigger value="faqs" className="text-xs">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    FAQs
                  </TabsTrigger>
                  <TabsTrigger value="support" className="text-xs">
                    <FileText className="h-4 w-4 mr-1" />
                    Support
                  </TabsTrigger>
                </TabsList>

                {/* Tutorials Tab */}
                <TabsContent value="tutorials" className="space-y-4 mt-4">
                  {/* Onboarding Tutorials */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Badge variant="secondary">Getting Started</Badge>
                    </h4>
                    <div className="space-y-2">
                      {onboardingTutorials.map(tutorial => (
                        <button
                          key={tutorial.id}
                          onClick={() => handleTutorialClick(tutorial.id)}
                          className="w-full text-left p-3 rounded-lg border hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{tutorial.title}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                {tutorial.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {tutorial.estimatedTime}m
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feature Tutorials */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Badge variant="outline">Features</Badge>
                    </h4>
                    <div className="space-y-2">
                      {featureTutorials.map(tutorial => (
                        <button
                          key={tutorial.id}
                          onClick={() => handleTutorialClick(tutorial.id)}
                          className="w-full text-left p-3 rounded-lg border hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm flex items-center gap-2">
                                <Play className="h-3 w-3 text-blue-600" />
                                {tutorial.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {tutorial.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {tutorial.estimatedTime}m
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* FAQs Tab */}
                <TabsContent value="faqs" className="space-y-2 mt-4">
                  {faqs.map(faq => (
                    <div key={faq.id} className="border rounded-lg">
                      <button
                        onClick={() =>
                          setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                        }
                        className="w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between"
                      >
                        <p className="font-medium text-sm">{faq.question}</p>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            expandedFaq === faq.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="px-3 pb-3 pt-0 border-t bg-gray-50">
                          <p className="text-sm text-gray-700">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>

                {/* Support Tab */}
                <TabsContent value="support" className="space-y-4 mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-sm">Need More Help?</h4>
                    <p className="text-sm text-gray-700">
                      Can't find what you're looking for? Our support team is here to help!
                    </p>

                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          window.location.href = 'mailto:support@ologywood.com';
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Email Support
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          window.open('https://help.ologywood.com', '_blank');
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Knowledge Base
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          window.open('https://status.ologywood.com', '_blank');
                        }}
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        System Status
                      </Button>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-600">
                        📧 support@ologywood.com
                        <br />
                        ⏰ Response time: Usually within 24 hours
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2">Quick Tips</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Complete your profile to get more inquiries</li>
                      <li>• Respond quickly to booking requests</li>
                      <li>• Share your profile on social media</li>
                      <li>• Check your analytics regularly</li>
                      <li>• Keep your availability calendar updated</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
