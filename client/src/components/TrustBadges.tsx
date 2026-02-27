import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Shield, Lock, Users, Award, CheckCircle, Zap } from 'lucide-react';

export function TrustBadges() {
  const badges = [
    {
      icon: Shield,
      title: 'Verified Artists',
      description: 'All artists are verified and reviewed by our community.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Lock,
      title: 'Secure Payments',
      description: 'Industry-standard encryption and Stripe payment processing.',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Users,
      title: 'Trusted Community',
      description: 'Artists and venues trust Ologywood for their bookings.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Award,
      title: 'Quality Guaranteed',
      description: 'Ratings and reviews ensure quality bookings every time.',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      icon: CheckCircle,
      title: 'Dedicated Support',
      description: 'Our team is available Monday through Friday to help with any questions.',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: Zap,
      title: 'Fast & Easy',
      description: 'Book artists in minutes with our streamlined platform.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Why Trust Ologywood?</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            We're committed to providing a safe, secure, and reliable platform for artists and venues.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {badges.map((badge, index) => {
            const IconComponent = badge.icon;
            return (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className={`${badge.bgColor} w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center mb-3 sm:mb-4`}>
                    <IconComponent className={`h-6 w-6 sm:h-7 sm:w-7 ${badge.color}`} />
                  </div>
                  <CardTitle className="text-base sm:text-lg">{badge.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-muted-foreground">{badge.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 sm:mt-12 p-6 sm:p-8 bg-white rounded-lg border border-muted">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Secure Transactions</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">M-F</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Dedicated Support</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">SSL</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Encrypted Data</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
