import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  DollarSign,
  Users,
  Clock,
  Package,
  ExternalLink,
  Eye,
  Handshake,
} from 'lucide-react';

type PackageType = "title_sponsor" | "stage_sponsor" | "bar_sponsor" | "digital_signage" | "event_mention" | "custom";
type Duration = "per_event" | "weekly" | "monthly" | "quarterly" | "yearly";

const PACKAGE_TYPE_LABELS: Record<PackageType, string> = {
  title_sponsor: "Title Sponsor",
  stage_sponsor: "Stage Sponsor",
  bar_sponsor: "Bar Sponsor",
  digital_signage: "Digital Signage",
  event_mention: "Event Mention",
  custom: "Custom",
};

const DURATION_LABELS: Record<Duration, string> = {
  per_event: "Per Event",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export default function VenueSponsorManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingApplications, setViewingApplications] = useState(false);
  const [approveModal, setApproveModal] = useState<{ id: number; companyName: string } | null>(null);
  const [approveStartDate, setApproveStartDate] = useState('');
  const [approveEndDate, setApproveEndDate] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    packageType: 'custom' as PackageType,
    tier: 'custom' as string,
    category: '' as string,
    price: '',
    duration: 'monthly' as Duration,
    benefits: [''],
    maxSlots: 1,
  });

  // Queries
  const { data: packages, refetch: refetchPackages } = trpc.venueSponsor.getMyPackages.useQuery();
  const { data: activeSponsors, refetch: refetchSponsors } = trpc.venueSponsor.getMyActiveSponsors.useQuery();
  const { data: applications, refetch: refetchApplications } = trpc.venueSponsor.getMyApplications.useQuery();
  const { data: stats } = trpc.venueSponsor.getStats.useQuery();

  // Mutations
  const createMutation = trpc.venueSponsor.createPackage.useMutation({
    onSuccess: () => {
      toast.success('Sponsor package created!');
      setShowCreateForm(false);
      resetForm();
      refetchPackages();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.venueSponsor.updatePackage.useMutation({
    onSuccess: () => {
      toast.success('Package updated');
      setEditingId(null);
      refetchPackages();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.venueSponsor.deletePackage.useMutation({
    onSuccess: () => {
      toast.success('Package deleted');
      refetchPackages();
    },
    onError: (e) => toast.error(e.message),
  });

  const approveMutation = trpc.venueSponsor.approveApplication.useMutation({
    onSuccess: () => {
      toast.success('Sponsor approved!');
      setApproveModal(null);
      refetchApplications();
      refetchSponsors();
      refetchPackages();
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = trpc.venueSponsor.rejectApplication.useMutation({
    onSuccess: () => {
      toast.success('Application rejected');
      refetchApplications();
    },
    onError: (e) => toast.error(e.message),
  });

  const deactivateMutation = trpc.venueSponsor.deactivateSponsor.useMutation({
    onSuccess: () => {
      toast.success('Sponsor deactivated');
      refetchSponsors();
      refetchPackages();
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      packageType: 'custom',
      tier: 'custom',
      category: '',
      price: '',
      duration: 'monthly',
      benefits: [''],
      maxSlots: 1,
    });
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filteredBenefits = formData.benefits.filter(b => b.trim());
    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      packageType: formData.packageType,
      tier: (formData.tier || undefined) as "custom" | "bronze" | "silver" | "gold" | "platinum" | undefined,
      category: formData.category || undefined,
      price: formData.price,
      duration: formData.duration,
      benefits: filteredBenefits.length > 0 ? filteredBenefits : undefined,
      maxSlots: formData.maxSlots,
    });
  }

  function addBenefit() {
    setFormData(prev => ({ ...prev, benefits: [...prev.benefits, ''] }));
  }

  function removeBenefit(index: number) {
    setFormData(prev => ({ ...prev, benefits: prev.benefits.filter((_, i) => i !== index) }));
  }

  function updateBenefit(index: number, value: string) {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map((b, i) => i === index ? value : b),
    }));
  }

  const pendingApps = applications?.filter(a => a.status === 'pending') || [];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.totalPackages || 0}</p>
            <p className="text-xs text-muted-foreground">Packages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Handshake className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.activeSponsors || 0}</p>
            <p className="text-xs text-muted-foreground">Active Sponsors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.pendingApplications || 0}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">${stats?.estimatedRevenue?.toFixed(0) || '0'}</p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Applications Alert */}
      {pendingApps.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">{pendingApps.length} pending sponsor application{pendingApps.length > 1 ? 's' : ''}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setViewingApplications(true)}>
                Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Sponsors */}
      {activeSponsors && activeSponsors.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Sponsors</CardTitle>
            <CardDescription>Currently displayed on your venue profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSponsors.map(sponsor => (
                <div key={sponsor.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  {sponsor.companyLogoUrl ? (
                    <img src={sponsor.companyLogoUrl} alt={sponsor.companyName} className="w-10 h-10 rounded object-contain bg-muted" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{sponsor.companyName.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sponsor.companyName}</p>
                    {sponsor.companyWebsite && (
                      <a href={sponsor.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> Website
                      </a>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deactivateMutation.mutate({ id: sponsor.id })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sponsor Packages */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Sponsor Packages</CardTitle>
              <CardDescription>Define what sponsorship opportunities you offer</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowCreateForm(true)} className="gap-1">
              <Plus className="h-4 w-4" /> Add Package
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {packages && packages.length > 0 ? (
            <div className="space-y-3">
              {packages.map(pkg => (
                <div key={pkg.id} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold">{pkg.name}</h4>
                        <Badge variant="outline" className="text-[10px]">{PACKAGE_TYPE_LABELS[pkg.packageType as PackageType]}</Badge>
                        {(pkg as any).tier && (pkg as any).tier !== 'custom' && <Badge className="text-[10px] capitalize">{(pkg as any).tier}</Badge>}
                        {(pkg as any).category && <Badge variant="secondary" className="text-[10px]">{(pkg as any).category}</Badge>}
                        {!pkg.isActive && <Badge variant="destructive" className="text-[10px]">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{pkg.description || 'No description'}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${pkg.price}/{DURATION_LABELS[pkg.duration as Duration]?.toLowerCase()}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{pkg.filledSlots}/{pkg.maxSlots} slots filled</span>
                      </div>
                      {pkg.benefits && (pkg.benefits as string[]).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(pkg.benefits as string[]).map((b, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">{b}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateMutation.mutate({ id: pkg.id, isActive: !pkg.isActive })}
                        title={pkg.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => {
                          if (confirm('Delete this package?')) deleteMutation.mutate({ id: pkg.id });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No sponsor packages yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create a package to start attracting sponsors</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Package Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCreateForm(false)}>
          <div className="bg-background rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold">Create Sponsor Package</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCreateForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Package Name *</label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Main Stage Banner"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what the sponsor gets..."
                  className="w-full mt-1 p-2 border rounded-md text-sm resize-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Type *</label>
                  <select
                    value={formData.packageType}
                    onChange={e => setFormData(prev => ({ ...prev, packageType: e.target.value as PackageType }))}
                    className="w-full mt-1 p-2 border rounded-md text-sm bg-background"
                  >
                    {Object.entries(PACKAGE_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Duration *</label>
                  <select
                    value={formData.duration}
                    onChange={e => setFormData(prev => ({ ...prev, duration: e.target.value as Duration }))}
                    className="w-full mt-1 p-2 border rounded-md text-sm bg-background"
                  >
                    {Object.entries(DURATION_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Tier</label>
                  <select
                    value={formData.tier}
                    onChange={e => setFormData(prev => ({ ...prev, tier: e.target.value }))}
                    className="w-full mt-1 p-2 border rounded-md text-sm bg-background"
                  >
                    <option value="platinum">Platinum</option>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="bronze">Bronze</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g. Food & Beverage, Tech, Music"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Price ($) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="500.00"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Slots</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.maxSlots}
                    onChange={e => setFormData(prev => ({ ...prev, maxSlots: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Benefits</label>
                <div className="space-y-2 mt-1">
                  {formData.benefits.map((benefit, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={benefit}
                        onChange={e => updateBenefit(i, e.target.value)}
                        placeholder={`Benefit ${i + 1}`}
                        className="flex-1"
                      />
                      {formData.benefits.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeBenefit(i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addBenefit} className="text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Add Benefit
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Package'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Applications Review Modal */}
      {viewingApplications && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setViewingApplications(false)}>
          <div className="bg-background rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold">Sponsor Applications</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingApplications(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-3">
              {applications && applications.length > 0 ? (
                applications.map(app => (
                  <div key={app.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold">{app.companyName}</h4>
                          <Badge
                            variant={app.status === 'approved' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}
                            className="text-[10px]"
                          >
                            {app.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{app.contactName} &middot; {app.contactEmail}</p>
                        {app.message && <p className="text-xs mt-2 text-muted-foreground italic">"{app.message}"</p>}
                        {app.companyWebsite && (
                          <a href={app.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> {app.companyWebsite}
                          </a>
                        )}
                        {/* Logo & Promo Materials */}
                        {(app.companyLogoUrl || (app as any).promoMaterialUrls?.length > 0) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {app.companyLogoUrl && (
                              <div className="flex items-center gap-2 bg-muted/50 rounded px-2 py-1">
                                <img src={app.companyLogoUrl} alt="Logo" className="w-8 h-8 object-contain rounded" />
                                <span className="text-[10px] text-muted-foreground">Logo</span>
                              </div>
                            )}
                            {(app as any).promoMaterialUrls?.map((url: string, idx: number) => (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1 text-[10px] text-primary hover:underline">
                                {url.endsWith('.pdf') ? '📄' : '🖼️'} Material {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      {app.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs gap-1"
                            onClick={() => setApproveModal({ id: app.id, companyName: app.companyName })}
                          >
                            <Check className="h-3 w-3" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-destructive"
                            onClick={() => rejectMutation.mutate({ applicationId: app.id })}
                            disabled={rejectMutation.isPending}
                          >
                            <X className="h-3 w-3" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No applications yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={() => setApproveModal(null)}>
          <div className="bg-background rounded-xl max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 space-y-4">
              <h3 className="font-semibold">Approve {approveModal.companyName}</h3>
              <div>
                <label className="text-sm font-medium">Start Date *</label>
                <Input
                  type="date"
                  value={approveStartDate}
                  onChange={e => setApproveStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date (optional)</label>
                <Input
                  type="date"
                  value={approveEndDate}
                  onChange={e => setApproveEndDate(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setApproveModal(null)}>Cancel</Button>
                <Button
                  onClick={() => {
                    if (!approveStartDate) { toast.error('Start date required'); return; }
                    approveMutation.mutate({
                      applicationId: approveModal.id,
                      startDate: approveStartDate,
                      endDate: approveEndDate || undefined,
                    });
                  }}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? 'Approving...' : 'Approve'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
