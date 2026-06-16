import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/ErrorToast';
import { Crown, Plus, Trash2, Edit2, GripVertical, ExternalLink, Eye, BarChart3, Loader2, X, Check, Image as ImageIcon } from 'lucide-react';

interface SponsorSlot {
  id: number;
  sponsorName: string;
  sponsorLogoUrl: string;
  sponsorWebsite: string | null;
  sponsorDescription: string | null;
  displayOrder: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
}

export function SponsorManagement() {
  const toastCtx = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    sponsorName: '',
    sponsorLogoUrl: '',
    sponsorWebsite: '',
    sponsorDescription: '',
  });

  const { data: sponsors, isLoading, refetch } = (trpc.sponsor as any).getMySponsors.useQuery(undefined, { retry: false });

  const createMutation = (trpc.sponsor as any).create.useMutation({
    onSuccess: () => {
      toastCtx.addSuccess('Sponsor added', 'Your sponsor has been added to your showcase.');
      resetForm();
      refetch();
    },
    onError: (err: any) => {
      toastCtx.addError('Error', err?.message || 'Could not add sponsor.');
    },
  });

  const updateMutation = (trpc.sponsor as any).update.useMutation({
    onSuccess: () => {
      toastCtx.addSuccess('Sponsor updated', 'Sponsor details have been saved.');
      resetForm();
      refetch();
    },
    onError: (err: any) => {
      toastCtx.addError('Error', err?.message || 'Could not update sponsor.');
    },
  });

  const deleteMutation = (trpc.sponsor as any).delete.useMutation({
    onSuccess: () => {
      toastCtx.addSuccess('Sponsor removed', 'Sponsor has been removed from your showcase.');
      refetch();
    },
    onError: (err: any) => {
      toastCtx.addError('Error', err?.message || 'Could not remove sponsor.');
    },
  });

  const resetForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ sponsorName: '', sponsorLogoUrl: '', sponsorWebsite: '', sponsorDescription: '' });
  };

  const handleSubmit = () => {
    if (!formData.sponsorName || !formData.sponsorLogoUrl) {
      toastCtx.addError('Missing fields', 'Sponsor name and logo URL are required.');
      return;
    }
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        sponsorName: formData.sponsorName,
        sponsorLogoUrl: formData.sponsorLogoUrl,
        sponsorWebsite: formData.sponsorWebsite || null,
        sponsorDescription: formData.sponsorDescription || null,
      });
    } else {
      createMutation.mutate({
        sponsorName: formData.sponsorName,
        sponsorLogoUrl: formData.sponsorLogoUrl,
        sponsorWebsite: formData.sponsorWebsite || undefined,
        sponsorDescription: formData.sponsorDescription || undefined,
      });
    }
  };

  const startEdit = (sponsor: SponsorSlot) => {
    setEditingId(sponsor.id);
    setShowAddForm(true);
    setFormData({
      sponsorName: sponsor.sponsorName,
      sponsorLogoUrl: sponsor.sponsorLogoUrl,
      sponsorWebsite: sponsor.sponsorWebsite || '',
      sponsorDescription: sponsor.sponsorDescription || '',
    });
  };

  const toggleActive = (sponsor: SponsorSlot) => {
    updateMutation.mutate({ id: sponsor.id, isActive: !sponsor.isActive });
  };

  const sponsorList: SponsorSlot[] = sponsors || [];
  const slotsUsed = sponsorList.length;
  const maxSlots = 5;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          <span className="ml-2 text-gray-600">Loading sponsors...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">Sponsor Showcase</CardTitle>
          </div>
          <span className="text-sm text-gray-500">{slotsUsed}/{maxSlots} slots used</span>
        </div>
        <CardDescription>
          Manage your sponsors. They'll appear on your public profile, event pages, and media kit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sponsor List */}
        {sponsorList.length > 0 && (
          <div className="space-y-3">
            {sponsorList.map((sponsor) => (
              <div
                key={sponsor.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  sponsor.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
                }`}
              >
                <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {sponsor.sponsorLogoUrl ? (
                    <img src={sponsor.sponsorLogoUrl} alt={sponsor.sponsorName} className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{sponsor.sponsorName}</p>
                  {sponsor.sponsorWebsite && (
                    <a href={sponsor.sponsorWebsite} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Website
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(sponsor)} title={sponsor.isActive ? 'Deactivate' : 'Activate'}>
                    <Eye className={`h-4 w-4 ${sponsor.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(sponsor)}>
                    <Edit2 className="h-4 w-4 text-gray-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: sponsor.id })}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {sponsorList.length === 0 && !showAddForm && (
          <div className="text-center py-8 border border-dashed border-amber-200 rounded-lg bg-amber-50/50">
            <Crown className="h-10 w-10 text-amber-400 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">No sponsors yet</h3>
            <p className="text-sm text-gray-600 mb-4">Add your sponsors to showcase them on your profile and events.</p>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{editingId ? 'Edit Sponsor' : 'Add New Sponsor'}</h4>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Sponsor Name *</label>
                <Input
                  value={formData.sponsorName}
                  onChange={(e) => setFormData(prev => ({ ...prev, sponsorName: e.target.value }))}
                  placeholder="e.g., Nike, Red Bull"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Logo URL *</label>
                <Input
                  value={formData.sponsorLogoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, sponsorLogoUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Website URL</label>
                <Input
                  value={formData.sponsorWebsite}
                  onChange={(e) => setFormData(prev => ({ ...prev, sponsorWebsite: e.target.value }))}
                  placeholder="https://sponsor.com"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Description</label>
                <Input
                  value={formData.sponsorDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, sponsorDescription: e.target.value }))}
                  placeholder="Brief description of partnership"
                  maxLength={500}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-amber-600 hover:bg-amber-700">
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {editingId ? 'Save Changes' : 'Add Sponsor'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Add Button */}
        {!showAddForm && slotsUsed < maxSlots && (
          <Button
            variant="outline"
            onClick={() => setShowAddForm(true)}
            className="w-full border-dashed border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Sponsor ({slotsUsed}/{maxSlots})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
