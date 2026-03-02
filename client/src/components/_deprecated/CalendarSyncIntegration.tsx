import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CalendarProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  isConnected: boolean;
  lastSync?: string;
}

export default function CalendarSyncIntegration() {
  const [providers, setProviders] = useState<CalendarProvider[]>([
    {
      id: "google",
      name: "Google Calendar",
      icon: "🔵",
      description: "Sync with your Google Calendar account",
      isConnected: false,
    },
    {
      id: "outlook",
      name: "Microsoft Outlook",
      icon: "📧",
      description: "Sync with your Outlook calendar",
      isConnected: false,
    },
    {
      id: "apple",
      name: "Apple Calendar",
      icon: "🍎",
      description: "Sync with your Apple Calendar",
      isConnected: false,
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CalendarProvider | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleConnect = (provider: CalendarProvider) => {
    setSelectedProvider(provider);
    setIsDialogOpen(true);
  };

  const handleConfirmConnect = async () => {
    if (!selectedProvider) return;

    setIsSyncing(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setProviders((prev) =>
        prev.map((p) =>
          p.id === selectedProvider.id
            ? { ...p, isConnected: true, lastSync: new Date().toLocaleString() }
            : p
        )
      );

      toast.success(`Successfully connected to ${selectedProvider.name}`);
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(`Failed to connect to ${selectedProvider.name}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = (provider: CalendarProvider) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === provider.id ? { ...p, isConnected: false, lastSync: undefined } : p
      )
    );
    toast.success(`Disconnected from ${provider.name}`);
  };

  const handleSync = async (provider: CalendarProvider) => {
    setIsSyncing(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setProviders((prev) =>
        prev.map((p) =>
          p.id === provider.id ? { ...p, lastSync: new Date().toLocaleString() } : p
        )
      );

      toast.success(`Synced with ${provider.name}`);
    } catch (error) {
      toast.error(`Failed to sync with ${provider.name}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Sync
          </CardTitle>
          <CardDescription>Connect your external calendars to sync bookings and availability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{provider.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">{provider.name}</h3>
                    <p className="text-sm text-slate-600">{provider.description}</p>
                    {provider.isConnected && provider.lastSync && (
                      <p className="text-xs text-slate-500 mt-1">Last synced: {provider.lastSync}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {provider.isConnected ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <Badge variant="outline" className="bg-green-50">
                        Connected
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSync(provider)}
                        disabled={isSyncing}
                        className="gap-2"
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          "Sync Now"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDisconnect(provider)}
                        disabled={isSyncing}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-slate-400" />
                      <Badge variant="outline">Not Connected</Badge>
                      <Button
                        size="sm"
                        onClick={() => handleConnect(provider)}
                        disabled={isSyncing}
                      >
                        Connect
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Pro Tip:</strong> Connect your external calendars to automatically sync your availability and
              bookings. Events created on Ologywood will be added to your connected calendars.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Connection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {selectedProvider?.name}</DialogTitle>
            <DialogDescription>
              You'll be redirected to {selectedProvider?.name} to authorize the connection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium text-slate-900 mb-2">What we'll access:</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>✓ View your calendar events</li>
                <li>✓ Create new events</li>
                <li>✓ Update existing events</li>
                <li>✗ Delete events (read-only)</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSyncing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmConnect}
                disabled={isSyncing}
                className="flex-1 gap-2"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Authorize Connection"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
