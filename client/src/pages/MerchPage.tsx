import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MerchManager } from '@/components/MerchManager';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { SiteHeader } from "@/components/SiteHeader";

export default function MerchPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  if (!user) {
    return null;
  }

  const isVenue = user.role === 'venue';
  const label = isVenue ? 'Shop & Offers' : 'My Merch';

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <div>
            <h1 className="text-lg font-bold">{label}</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {isVenue ? 'Branded items, gift cards, and offers' : 'Your products — linked to your store'}
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <PageBreadcrumb
          className="mb-4"
          segments={[
            { label: 'Dashboard', href: '/dashboard' },
            { label },
          ]}
        />
        <MerchManager userType={isVenue ? 'venue' : 'artist'} />
      </div>
    </div>
  );
}
