import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { DollarSign, MapPin, Package, Users, ExternalLink, X, Send } from 'lucide-react';

type PackageType = "title_sponsor" | "stage_sponsor" | "bar_sponsor" | "digital_signage" | "event_mention" | "custom";

const PACKAGE_TYPE_LABELS: Record<PackageType, string> = {
  title_sponsor: "Title Sponsor",
  stage_sponsor: "Stage Sponsor",
  bar_sponsor: "Bar Sponsor",
  digital_signage: "Digital Signage",
  event_mention: "Event Mention",
  custom: "Custom",
};

const DURATION_LABELS: Record<string, string> = {
  per_event: "Per Event",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export default function SponsorOpportunities() {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [applyingTo, setApplyingTo] = useState<{ packageId: number; venueName: string; packageName: string } | null>(null);

  // Application form state
  const [appForm, setAppForm] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    companyWebsite: '',
    message: '',
  });

  const { data, isLoading } = trpc.venueSponsor.browseOpportunities.useQuery(
    typeFilter ? { packageType: typeFilter as PackageType } : undefined
  );

  const submitMutation = trpc.venueSponsor.submitApplication.useMutation({
    onSuccess: () => {
      toast.success('Application submitted! The venue will review your request.');
      setApplyingTo(null);
      setAppForm({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', companyWebsite: '', message: '' });
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmitApplication(e: React.FormEvent) {
    e.preventDefault();
    if (!applyingTo) return;
    submitMutation.mutate({
      packageId: applyingTo.packageId,
      companyName: appForm.companyName,
      contactName: appForm.contactName,
      contactEmail: appForm.contactEmail,
      contactPhone: appForm.contactPhone || undefined,
      companyWebsite: appForm.companyWebsite || undefined,
      message: appForm.message || undefined,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Sponsor Opportunities</h1>
          <p className="text-muted-foreground mt-1">Browse available sponsorship packages at venues across the platform</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={typeFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('')}
          >
            All
          </Button>
          {Object.entries(PACKAGE_TYPE_LABELS).map(([key, label]) => (
            <Button
              key={key}
              variant={typeFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-48" />
              </Card>
            ))}
          </div>
        ) : data?.opportunities && data.opportunities.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.opportunities.map(opp => (
              <Card key={opp.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">{opp.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{opp.venueName}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {PACKAGE_TYPE_LABELS[opp.packageType as PackageType]}
                    </Badge>
                  </div>

                  {opp.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{opp.description}</p>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />${opp.price}/{DURATION_LABELS[opp.duration]?.toLowerCase() || opp.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />{opp.availableSlots} slot{opp.availableSlots !== 1 ? 's' : ''} available
                    </span>
                    {(opp.venueCity || opp.venueState) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{[opp.venueCity, opp.venueState].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>

                  {opp.benefits && (opp.benefits as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(opp.benefits as string[]).slice(0, 3).map((b, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{b}</Badge>
                      ))}
                      {(opp.benefits as string[]).length > 3 && (
                        <Badge variant="secondary" className="text-[10px]">+{(opp.benefits as string[]).length - 3} more</Badge>
                      )}
                    </div>
                  )}

                  <Button
                    size="sm"
                    className="w-full mt-2 gap-1"
                    disabled={opp.availableSlots <= 0}
                    onClick={() => setApplyingTo({ packageId: opp.id, venueName: opp.venueName, packageName: opp.name })}
                  >
                    <Send className="h-3 w-3" />
                    {opp.availableSlots > 0 ? 'Apply Now' : 'Fully Booked'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No opportunities found</h3>
            <p className="text-sm text-muted-foreground mt-1">Check back later or try a different filter</p>
          </div>
        )}

        {/* Total count */}
        {data && data.total > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-6">
            Showing {data.opportunities.length} of {data.total} opportunities
          </p>
        )}
      </div>

      {/* Application Modal */}
      {applyingTo && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setApplyingTo(null)}>
          <div className="bg-background rounded-xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Apply for Sponsorship</h3>
                <p className="text-xs text-muted-foreground">{applyingTo.packageName} at {applyingTo.venueName}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setApplyingTo(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmitApplication} className="p-4 space-y-3">
              <div>
                <label className="text-sm font-medium">Company Name *</label>
                <Input
                  value={appForm.companyName}
                  onChange={e => setAppForm(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Your company name"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Contact Name *</label>
                  <Input
                    value={appForm.contactName}
                    onChange={e => setAppForm(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={appForm.contactEmail}
                    onChange={e => setAppForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="email@company.com"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={appForm.contactPhone}
                    onChange={e => setAppForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="(optional)"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Website</label>
                  <Input
                    value={appForm.companyWebsite}
                    onChange={e => setAppForm(prev => ({ ...prev, companyWebsite: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  value={appForm.message}
                  onChange={e => setAppForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Tell the venue why you'd be a great sponsor..."
                  className="w-full mt-1 p-2 border rounded-md text-sm resize-none h-20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setApplyingTo(null)}>Cancel</Button>
                <Button type="submit" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
