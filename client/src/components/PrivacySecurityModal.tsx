import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Download, Trash2, Lock } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface PrivacySecurityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'visibility' | 'download' | 'delete';
}

export function PrivacySecurityModal({ open, onOpenChange, type }: PrivacySecurityModalProps) {
  const [visibility, setVisibility] = useState<'public' | 'private' | 'hidden'>('public');
  const [allowMessages, setAllowMessages] = useState(true);
  const [allowBookingRequests, setAllowBookingRequests] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const updateVisibilityMutation = trpc.privacy.updateProfileVisibility.useMutation();
  const exportDataMutation = trpc.privacy.exportUserData.useMutation();
  const deleteAccountMutation = trpc.privacy.deleteAccount.useMutation();
  const getPrivacySettingsMutation = trpc.privacy.getPrivacySettings.useQuery();

  // Load current settings when modal opens
  React.useEffect(() => {
    if (open && type === 'visibility' && getPrivacySettingsMutation.data) {
      const settings = getPrivacySettingsMutation.data;
      setVisibility(settings.profileVisibility as 'public' | 'private' | 'hidden');
      setAllowMessages(settings.allowMessages);
      setAllowBookingRequests(settings.allowBookingRequests);
      setShowEmail(settings.showEmail);
      setShowPhone(settings.showPhone);
    }
  }, [open, type, getPrivacySettingsMutation.data]);

  const handleConfigureVisibility = async () => {
    setIsLoading(true);
    try {
      await updateVisibilityMutation.mutateAsync({
        visibility,
        allowMessages,
        allowBookingRequests,
        showEmail,
        showPhone,
      });
      toast.success('Privacy settings updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update privacy settings');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadData = async () => {
    setIsLoading(true);
    try {
      const data = await exportDataMutation.mutateAsync();
      
      // Create JSON file
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `ologywood-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Your data has been downloaded');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to download data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm || !password) {
      toast.error('Please confirm deletion and enter your password');
      return;
    }

    setIsLoading(true);
    try {
      await deleteAccountMutation.mutateAsync({
        password,
        confirmation: deleteConfirm,
      });
      toast.success('Account deleted successfully');
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      toast.error('Failed to delete account');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {type === 'visibility' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Profile Visibility
              </DialogTitle>
              <DialogDescription>
                Control who can see your profile and contact information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="visibility">Profile Visibility</Label>
                <Select value={visibility} onValueChange={(val) => setVisibility(val as any)}>
                  <SelectTrigger id="visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Everyone can see</SelectItem>
                    <SelectItem value="private">Private - Only connections</SelectItem>
                    <SelectItem value="hidden">Hidden - Only you</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="messages"
                    checked={allowMessages}
                    onCheckedChange={(checked) => setAllowMessages(checked as boolean)}
                  />
                  <Label htmlFor="messages" className="font-normal cursor-pointer">
                    Allow direct messages
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="bookings"
                    checked={allowBookingRequests}
                    onCheckedChange={(checked) => setAllowBookingRequests(checked as boolean)}
                  />
                  <Label htmlFor="bookings" className="font-normal cursor-pointer">
                    Allow booking requests
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="email"
                    checked={showEmail}
                    onCheckedChange={(checked) => setShowEmail(checked as boolean)}
                  />
                  <Label htmlFor="email" className="font-normal cursor-pointer">
                    Show email address
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="phone"
                    checked={showPhone}
                    onCheckedChange={(checked) => setShowPhone(checked as boolean)}
                  />
                  <Label htmlFor="phone" className="font-normal cursor-pointer">
                    Show phone number
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfigureVisibility} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </>
        )}

        {type === 'download' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Your Data
              </DialogTitle>
              <DialogDescription>
                Export all your personal data in JSON format (GDPR compliant)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Your data includes profile information, privacy settings, and account details. This export is for your records.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleDownloadData} disabled={isLoading}>
                {isLoading ? 'Downloading...' : 'Download Data'}
              </Button>
            </DialogFooter>
          </>
        )}

        {type === 'delete' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. All your data will be permanently deleted.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">Warning</p>
                  <p>Deleting your account will:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    <li>Remove all profile information</li>
                    <li>Cancel all pending bookings</li>
                    <li>Delete all messages and data</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="password" className="text-sm">
                    Enter your password to confirm
                  </Label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="confirm"
                    checked={deleteConfirm}
                    onCheckedChange={(checked) => setDeleteConfirm(checked as boolean)}
                  />
                  <Label htmlFor="confirm" className="font-normal cursor-pointer text-sm">
                    I understand this action is permanent and cannot be reversed
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount} 
                disabled={isLoading || !deleteConfirm || !password}
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
