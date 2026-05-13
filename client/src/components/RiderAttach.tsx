import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Plus,
  Check,
  Loader2,
  ChevronRight,
  Music,
  Users,
  Headphones,
  Mic2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

interface RiderAttachProps {
  bookingId: number;
  currentUserRole: 'artist' | 'venue';
  hasRider: boolean;
  onRiderAttached?: () => void;
}

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  solo_artist: <Music className="h-5 w-5" />,
  band: <Users className="h-5 w-5" />,
  dj: <Headphones className="h-5 w-5" />,
  speaker: <Mic2 className="h-5 w-5" />,
  custom: <FileText className="h-5 w-5" />,
};

const TEMPLATE_COLORS: Record<string, string> = {
  solo_artist: 'bg-violet-100 text-violet-700',
  band: 'bg-blue-100 text-blue-700',
  dj: 'bg-pink-100 text-pink-700',
  speaker: 'bg-amber-100 text-amber-700',
  custom: 'bg-slate-100 text-slate-700',
};

export function RiderAttach({
  bookingId,
  currentUserRole,
  hasRider,
  onRiderAttached,
}: RiderAttachProps) {
  const [, navigate] = useLocation();
  const [showPicker, setShowPicker] = useState(false);

  // Only artists can attach riders
  if (currentUserRole !== 'artist') return null;

  // If rider is already attached, don't show this component
  if (hasRider) return null;

  const { data: myTemplates, isLoading: templatesLoading } = trpc.rider.getMyTemplates.useQuery(
    undefined,
    { enabled: showPicker }
  );

  const attachMutation = trpc.booking.attachRider.useMutation({
    onSuccess: () => {
      toast.success('Rider attached to booking successfully!');
      setShowPicker(false);
      onRiderAttached?.();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to attach rider');
    },
  });

  const handleAttach = (templateId: number) => {
    attachMutation.mutate({ bookingId, riderTemplateId: templateId });
  };

  return (
    <>
      <Card className="border-dashed border-2 border-purple-200 bg-purple-50/30">
        <CardContent className="py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-purple-900">Attach Your Rider</h3>
                <p className="text-xs text-purple-700/70 mt-0.5">
                  Share your technical and hospitality requirements with the venue
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={() => setShowPicker(true)}
            >
              <Plus className="h-4 w-4" />
              Attach Rider
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rider Picker Dialog */}
      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Select a Rider Template</DialogTitle>
            <DialogDescription>
              Choose one of your saved rider templates to attach to this booking.
            </DialogDescription>
          </DialogHeader>

          {templatesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : !myTemplates || myTemplates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="font-medium text-slate-700 mb-1">No riders yet</p>
              <p className="text-sm text-slate-500 mb-4">
                Create a rider template first, then attach it to bookings.
              </p>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setShowPicker(false);
                  navigate('/rider-builder');
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Go to Rider Builder
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {myTemplates.map((template: any) => {
                const baseType = template.templateType || template.templateData?.baseTemplate || 'custom';
                const isAttaching = attachMutation.isPending;

                return (
                  <button
                    key={template.id}
                    onClick={() => handleAttach(template.id)}
                    disabled={isAttaching}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${TEMPLATE_COLORS[baseType] || TEMPLATE_COLORS.custom}`}>
                      {TEMPLATE_ICONS[baseType] || TEMPLATE_ICONS.custom}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">
                        {template.templateName || 'Unnamed Rider'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {baseType === 'solo_artist' ? 'Solo Artist' :
                         baseType === 'band' ? 'Band' :
                         baseType === 'dj' ? 'DJ' :
                         baseType === 'speaker' ? 'Speaker' : 'Custom'}
                        {template.updatedAt && (
                          <> &middot; Updated {new Date(template.updatedAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    {isAttaching ? (
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}

              <div className="pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  onClick={() => {
                    setShowPicker(false);
                    navigate('/rider-builder');
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create New Rider Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
