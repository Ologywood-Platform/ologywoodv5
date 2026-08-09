import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SiteHeader } from "@/components/SiteHeader";

/**
 * ArtistTaxReporting Page - DISABLED
 * This page references non-existent 'taxReporting' router.
 * To be re-enabled when taxReporting router is implemented.
 */
export default function ArtistTaxReporting() {
  const [, navigate] = useLocation();
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-4">
      <SiteHeader />
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Button>
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          <strong>Tax Reporting:</strong> This feature is currently disabled. 
          The tax reporting router needs to be implemented.
        </p>
      </div>
    </div>
  );
}
