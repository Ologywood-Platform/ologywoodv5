import { useState, useMemo, useRef } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { DollarSign, MapPin, Package, Users, X, Send, Search, ArrowUpDown, Upload, Image, FileText, Loader2 } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';

type PackageType = "title_sponsor" | "stage_sponsor" | "bar_sponsor" | "digital_signage" | "event_mention" | "custom";
type SortOption = "newest" | "price_low" | "price_high" | "slots_available";

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

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "slots_available", label: "Most Available" },
];

export default function SponsorOpportunities() {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
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

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [promoFiles, setPromoFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const promoInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = trpc.venueSponsor.browseOpportunities.useQuery(
    typeFilter ? { packageType: typeFilter as PackageType } : undefined
  );

  const submitMutation = trpc.venueSponsor.submitApplication.useMutation({
    onSuccess: () => {
      toast.success('Application submitted! The venue will review your request.');
      setApplyingTo(null);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setAppForm({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', companyWebsite: '', message: '' });
    setLogoFile(null);
    setLogoPreview('');
    setPromoFiles([]);
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file for your logo');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be under 5MB');
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handlePromoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    const validFiles = files.filter(f => {
      if (!validTypes.includes(f.type)) {
        toast.error(`${f.name}: Only images and PDFs are accepted`);
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name}: Must be under 10MB`);
        return false;
      }
      return true;
    });
    setPromoFiles(prev => [...prev, ...validFiles].slice(0, 5));
  }

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url;
  }

  async function handleSubmitApplication(e: React.FormEvent) {
    e.preventDefault();
    if (!applyingTo) return;

    setUploading(true);
    try {
      let companyLogoUrl: string | undefined;
      let promoMaterialUrls: string[] = [];

      // Upload logo if provided
      if (logoFile) {
        companyLogoUrl = await uploadFile(logoFile);
      }

      // Upload promo materials if provided
      if (promoFiles.length > 0) {
        const uploads = await Promise.all(promoFiles.map(f => uploadFile(f)));
        promoMaterialUrls = uploads;
      }

      submitMutation.mutate({
        packageId: applyingTo.packageId,
        companyName: appForm.companyName,
        contactName: appForm.contactName,
        contactEmail: appForm.contactEmail,
        contactPhone: appForm.contactPhone || undefined,
        companyWebsite: appForm.companyWebsite || undefined,
        message: appForm.message || undefined,
        companyLogoUrl,
        promoMaterialUrls: promoMaterialUrls.length > 0 ? promoMaterialUrls : undefined,
      });
    } catch (err) {
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  // Client-side search and sort
  const filteredAndSorted = useMemo(() => {
    if (!data?.opportunities) return [];
    let results = [...data.opportunities];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(opp =>
        opp.name.toLowerCase().includes(q) ||
        opp.venueName.toLowerCase().includes(q) ||
        (opp.description && opp.description.toLowerCase().includes(q)) ||
        (opp.venueCity && opp.venueCity.toLowerCase().includes(q)) ||
        (opp.venueState && opp.venueState.toLowerCase().includes(q))
      );
    }

    // Tier filter
    if (tierFilter) {
      results = results.filter(opp => (opp as any).tier === tierFilter);
    }

    // Sort
    switch (sortBy) {
      case 'price_low':
        results.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price_high':
        results.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'slots_available':
        results.sort((a, b) => b.availableSlots - a.availableSlots);
        break;
      case 'newest':
      default:
        // Already sorted by newest from API
        break;
    }

    return results;
  }, [data?.opportunities, searchQuery, sortBy, tierFilter]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Sponsor Opportunities</h1>
          <p className="text-muted-foreground mt-1">Browse available sponsorship packages at venues across the platform</p>
        </div>

        {/* Search + Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by venue, package name, or location..."
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="text-sm border rounded-md px-3 py-2 bg-background"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={typeFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('')}
          >
            All Types
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

        {/* Tier Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={tierFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTierFilter('')}
          >
            All Tiers
          </Button>
          {['platinum', 'gold', 'silver', 'bronze', 'custom'].map(tier => (
            <Button
              key={tier}
              variant={tierFilter === tier ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTierFilter(tier)}
              className="capitalize"
            >
              {tier}
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
        ) : filteredAndSorted.length > 0 ? (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              {filteredAndSorted.length} opportunit{filteredAndSorted.length === 1 ? 'y' : 'ies'} found
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredAndSorted.map(opp => (
                <Card key={opp.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">{opp.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{opp.venueName}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Badge variant="outline" className="text-[10px]">
                          {PACKAGE_TYPE_LABELS[opp.packageType as PackageType]}
                        </Badge>
                        {(opp as any).tier && (opp as any).tier !== 'custom' && (
                          <Badge className="text-[10px] capitalize">{(opp as any).tier}</Badge>
                        )}
                      </div>
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
          </>
        ) : (
          <div className="text-center py-16">
            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {searchQuery ? 'No matching opportunities' : 'No opportunities found'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? 'Try a different search term or filter' : 'Check back later or try a different filter'}
            </p>
            {searchQuery && (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Application Modal */}
      {applyingTo && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setApplyingTo(null)}>
          <div className="bg-background rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between z-10">
              <div>
                <h3 className="font-semibold text-sm">Apply for Sponsorship</h3>
                <p className="text-xs text-muted-foreground">{applyingTo.packageName} at {applyingTo.venueName}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setApplyingTo(null); resetForm(); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmitApplication} className="p-4 space-y-4">
              {/* Company Info */}
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

              {/* Company Logo Upload */}
              <div>
                <label className="text-sm font-medium">Company Logo</label>
                <p className="text-xs text-muted-foreground mb-2">Upload your logo to display on the venue's sponsor section</p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
                {logoPreview ? (
                  <div className="flex items-center gap-3">
                    <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain border rounded" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{logoFile?.name}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs mt-1 h-7"
                        onClick={() => { setLogoFile(null); setLogoPreview(''); }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Image className="h-3.5 w-3.5" />
                    Upload Logo
                  </Button>
                )}
              </div>

              {/* Promo Materials Upload */}
              <div>
                <label className="text-sm font-medium">Promo Materials</label>
                <p className="text-xs text-muted-foreground mb-2">Upload images or PDFs (up to 5 files, max 10MB each)</p>
                <input
                  ref={promoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  multiple
                  onChange={handlePromoSelect}
                  className="hidden"
                />
                {promoFiles.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {promoFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1">
                        {file.type === 'application/pdf' ? (
                          <FileText className="h-3 w-3 text-red-500" />
                        ) : (
                          <Image className="h-3 w-3 text-blue-500" />
                        )}
                        <span className="flex-1 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setPromoFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {promoFiles.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => promoInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Add Files ({promoFiles.length}/5)
                  </Button>
                )}
              </div>

              {/* Message */}
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
                <Button type="button" variant="outline" onClick={() => { setApplyingTo(null); resetForm(); }}>Cancel</Button>
                <Button type="submit" disabled={submitMutation.isPending || uploading} className="gap-1">
                  {(submitMutation.isPending || uploading) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {uploading ? 'Uploading...' : submitMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
