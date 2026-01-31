import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarProvider {
  name: string;
  icon: string;
  connected: boolean;
  lastSync?: string;
  email?: string;
}

export function CalendarSyncManager() {
  const [providers, setProviders] = useState<CalendarProvider[]>([
    {
      name: 'Google Calendar',
      icon: '📅',
      connected: false,
    },
    {
      name: 'Outlook Calendar',
      icon: '📆',
      connected: false,
    },
    {
      name: 'Apple Calendar',
      icon: '🍎',
      connected: false,
    },
  ]);

  const [syncing, setSyncing] = useState<string | null>(null);

  const handleConnect = async (providerName: string) => {
    setSyncing(providerName);
    try {
      // Simulate OAuth flow
      toast.success(`Connected to ${providerName}!`);
      
      setProviders(providers.map(p =>
        p.name === providerName
          ? {
              ...p,
              connected: true,
              lastSync: new Date().toISOString(),
              email: 'artist@example.com',
            }
          : p
      ));
    } catch (error) {
      toast.error(`Failed to connect to ${providerName}`);
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = (providerName: string) => {
    setProviders(providers.map(p =>
      p.name === providerName
        ? {
            ...p,
            connected: false,
            lastSync: undefined,
            email: undefined,
          }
        : p
    ));
    toast.success(`Disconnected from ${providerName}`);
  };

  const handleSync = async (providerName: string) => {
    setSyncing(providerName);
    try {
      toast.success(`Syncing with ${providerName}...`);
      
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProviders(providers.map(p =>
        p.name === providerName
          ? {
              ...p,
              lastSync: new Date().toISOString(),
            }
          : p
      ));
      
      toast.success(`Successfully synced with ${providerName}`);
    } catch (error) {
      toast.error(`Failed to sync with ${providerName}`);
    } finally {
      setSyncing(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Sync
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-6">
          Connect your calendar to automatically sync your availability with your bookings
        </p>

        <div className="space-y-4">
          {providers.map((provider) => (
            <div
              key={provider.name}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{provider.icon}</span>
                <div>
                  <p className="font-semibold">{provider.name}</p>
                  {provider.connected && provider.email && (
                    <p className="text-sm text-muted-foreground">{provider.email}</p>
                  )}
                  {provider.lastSync && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {new Date(provider.lastSync).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {provider.connected && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}

                {provider.connected ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync(provider.name)}
                      disabled={syncing === provider.name}
                    >
                      {syncing === provider.name ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        'Sync Now'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnect(provider.name)}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleConnect(provider.name)}
                    disabled={syncing === provider.name}
                  >
                    {syncing === provider.name ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect'
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Pro Tip</p>
            <p>
              Syncing your calendar helps prevent double-bookings and keeps your availability
              automatically updated across all platforms.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
