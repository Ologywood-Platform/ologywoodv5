import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Ticket, Plus, Pencil, Trash2, DollarSign, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface TicketTierManagerProps {
  eventId: number;
  eventTitle: string;
}

export function TicketTierManager({ eventId, eventTitle }: TicketTierManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    maxPerOrder: '10',
  });

  const utils = trpc.useUtils();
  const { data: tiers, isLoading } = trpc.ticketing.getManagementTiers.useQuery({ eventId });
  const createTierMutation = trpc.ticketing.createTier.useMutation({
    onSuccess: () => {
      toast.success('Ticket tier created!');
      utils.ticketing.getManagementTiers.invalidate({ eventId });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });
  const updateTierMutation = trpc.ticketing.updateTier.useMutation({
    onSuccess: () => {
      toast.success('Ticket tier updated!');
      utils.ticketing.getManagementTiers.invalidate({ eventId });
      setEditingTier(null);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteTierMutation = trpc.ticketing.deleteTier.useMutation({
    onSuccess: () => {
      toast.success('Ticket tier deleted');
      utils.ticketing.getManagementTiers.invalidate({ eventId });
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', quantity: '', maxPerOrder: '10' });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) { toast.error('Tier name is required'); return; }
    if (!formData.price && formData.price !== '0') { toast.error('Price is required'); return; }
    if (!formData.quantity) { toast.error('Quantity is required'); return; }

    const priceInCents = Math.round(parseFloat(formData.price) * 100);
    const quantity = parseInt(formData.quantity);
    const maxPerOrder = parseInt(formData.maxPerOrder) || 10;

    if (isNaN(priceInCents) || priceInCents < 0) { toast.error('Invalid price'); return; }
    if (isNaN(quantity) || quantity < 1) { toast.error('Invalid quantity'); return; }

    if (editingTier) {
      updateTierMutation.mutate({
        id: editingTier.id,
        name: formData.name,
        description: formData.description || undefined,
        price: priceInCents,
        quantity,
        maxPerOrder,
      });
    } else {
      createTierMutation.mutate({
        eventId,
        name: formData.name,
        description: formData.description || undefined,
        price: priceInCents,
        quantity,
        maxPerOrder,
      });
    }
  };

  const handleEdit = (tier: any) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      description: tier.description || '',
      price: (tier.price / 100).toFixed(2),
      quantity: tier.quantity.toString(),
      maxPerOrder: tier.maxPerOrder.toString(),
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (tier: any) => {
    if (confirm(`Delete "${tier.name}" tier? This cannot be undone.`)) {
      deleteTierMutation.mutate({ id: tier.id });
    }
  };

  const handleToggleActive = (tier: any) => {
    updateTierMutation.mutate({
      id: tier.id,
      isActive: !tier.isActive,
    });
  };

  const totalCapacity = tiers?.reduce((sum: number, t: any) => sum + t.quantity, 0) || 0;
  const totalSold = tiers?.reduce((sum: number, t: any) => sum + t.quantitySold, 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {tiers && tiers.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <p className="text-2xl font-bold">{tiers.length}</p>
              <p className="text-xs text-muted-foreground">Ticket Tiers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <p className="text-2xl font-bold">{totalSold}/{totalCapacity}</p>
              <p className="text-xs text-muted-foreground">Tickets Sold</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <p className="text-2xl font-bold">
                ${((tiers.reduce((sum: number, t: any) => sum + (t.quantitySold * t.price), 0)) / 100).toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tier List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Ticket Tiers
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) { setEditingTier(null); resetForm(); }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Tier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTier ? 'Edit Ticket Tier' : 'Add Ticket Tier'}</DialogTitle>
                <DialogDescription>
                  {editingTier ? 'Update this ticket tier' : `Create a new ticket tier for "${eventTitle}"`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="tierName">Tier Name *</Label>
                  <Input
                    id="tierName"
                    placeholder="e.g., General Admission, VIP, Early Bird"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="tierDesc">Description</Label>
                  <Textarea
                    id="tierDesc"
                    placeholder="What's included with this ticket?"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="tierPrice">Price ($) *</Label>
                    <Input
                      id="tierPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="25.00"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Set to 0 for free tickets</p>
                  </div>
                  <div>
                    <Label htmlFor="tierQty">Total Quantity *</Label>
                    <Input
                      id="tierQty"
                      type="number"
                      min="1"
                      placeholder="100"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tierMax">Max Per Order</Label>
                  <Input
                    id="tierMax"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.maxPerOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxPerOrder: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={createTierMutation.isPending || updateTierMutation.isPending}
                  className="w-full"
                >
                  {(createTierMutation.isPending || updateTierMutation.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {editingTier ? 'Update Tier' : 'Create Tier'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {!tiers || tiers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No ticket tiers yet</p>
              <p className="text-sm">Add ticket tiers to start selling tickets for this event</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tiers.map((tier: any) => (
                <div
                  key={tier.id}
                  className={`border rounded-lg p-4 ${!tier.isActive ? 'opacity-60 bg-muted/30' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{tier.name}</h4>
                        {!tier.isActive && <Badge variant="secondary">Inactive</Badge>}
                        {tier.quantitySold >= tier.quantity && <Badge variant="destructive">Sold Out</Badge>}
                      </div>
                      {tier.description && (
                        <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          {tier.price === 0 ? 'Free' : `$${(tier.price / 100).toFixed(2)}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {tier.quantitySold}/{tier.quantity} sold
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={tier.isActive}
                        onCheckedChange={() => handleToggleActive(tier)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(tier)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {tier.quantitySold === 0 && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(tier)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, (tier.quantitySold / tier.quantity) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Fee Notice */}
      <p className="text-xs text-muted-foreground text-center">
        Platform fee: $0.99 per ticket sold + Stripe processing (2.9% + $0.30).
        You receive the ticket price minus these fees.
      </p>
    </div>
  );
}
