import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CheckCircle, Search, MessageSquare, CreditCard, TrendingUp, Users, Award, Clock, BarChart3 } from 'lucide-react';

export function HowItWorksSection() {
  const artistSteps = [
    {
      number: 1,
      title: 'Create Your Artist Profile',
      description: 'Sign up and build your artist profile with bio, photos, genres, rates, and availability.',
      icon: Users,
    },
    {
      number: 2,
      title: 'Browse Venue Opportunities',
      description: 'Discover venues and event organizers looking for talent. Filter by location, event type, and budget.',
      icon: Search,
    },
    {
      number: 3,
      title: 'Send Proposals',
      description: 'Respond to booking requests or send proposals to venues that match your style and availability.',
      icon: MessageSquare,
    },
    {
      number: 4,
      title: 'Negotiate & Confirm',
      description: 'Chat with venues to discuss details, rates, technical requirements, and finalize the booking.',
      icon: CheckCircle,
    },
    {
      number: 5,
      title: 'Receive Payment',
      description: 'Get paid securely through Stripe. Deposits upfront, balance before the event.',
      icon: CreditCard,
    },
    {
      number: 6,
      title: 'Perform & Get Reviewed',
      description: 'Deliver an amazing performance and build your reputation through reviews and ratings.',
      icon: TrendingUp,
    },
  ];

  const venueSteps = [
    {
      number: 1,
      title: 'Create Your Venue Profile',
      description: 'Sign up and set up your venue profile with photos, capacity, location, and event types.',
      icon: Users,
    },
    {
      number: 2,
      title: 'Browse & Discover Artists',
      description: 'Search thousands of talented artists. Filter by genre, location, price range, and availability.',
      icon: Search,
    },
    {
      number: 3,
      title: 'Send Booking Requests',
      description: 'Find the perfect artist and send a booking request with your event details and requirements.',
      icon: MessageSquare,
    },
    {
      number: 4,
      title: 'Communicate & Confirm',
      description: 'Chat with artists to discuss details, negotiate terms, and review technical requirements.',
      icon: CheckCircle,
    },
    {
      number: 5,
      title: 'Process Payment Securely',
      description: 'Handle deposits and full payments securely through Stripe with complete transparency.',
      icon: CreditCard,
    },
    {
      number: 6,
      title: 'Review & Build Community',
      description: 'Share your experience with a review and help other venues find great artists.',
      icon: TrendingUp,
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-muted/30">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">How It Works</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            Whether you're an artist looking for gigs or a venue booking talent, our platform makes it simple and secure.
          </p>
        </div>

        <Tabs defaultValue="artists" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="artists" className="text-xs sm:text-sm">For Artists</TabsTrigger>
            <TabsTrigger value="venues" className="text-xs sm:text-sm">For Venues</TabsTrigger>
          </TabsList>

          <TabsContent value="artists">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {artistSteps.map((step) => {
                const IconComponent = step.icon;
                return (
                  <Card key={step.number} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10">
                            <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs sm:text-sm font-semibold text-primary mb-1">Step {step.number}</div>
                          <CardTitle className="text-sm sm:text-base">{step.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs sm:text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="venues">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {venueSteps.map((step) => {
                const IconComponent = step.icon;
                return (
                  <Card key={step.number} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10">
                            <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs sm:text-sm font-semibold text-primary mb-1">Step {step.number}</div>
                          <CardTitle className="text-sm sm:text-base">{step.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs sm:text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
