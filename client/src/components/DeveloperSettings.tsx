/**
 * Developer Settings — API Key & Webhook management UI.
 * Rendered as a tab inside AccountSettings.
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Key,
  Plus,
  Copy,
  RotateCw,
  Trash2,
  Eye,
  EyeOff,
  Globe,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  Webhook,
  X,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

// ==================== API KEY MANAGEMENT ====================

function ApiKeySection() {
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [rateLimit, setRateLimit] = useState(100);
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>();
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const keysQuery = trpc.apiKeys.list.useQuery();
  const scopesQuery = trpc.apiKeys.getScopes.useQuery();
  const createMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => {
      setNewlyCreatedKey(data.key);
      setShowCreate(false);
      setNewKeyName('');
      setSelectedScopes([]);
      setRateLimit(100);
      setExpiresInDays(undefined);
      keysQuery.refetch();
      toast.success('API key created! Copy it now — it won\'t be shown again.');
    },
    onError: (err) => toast.error(err.message),
  });
  const revokeMutation = trpc.apiKeys.revoke.useMutation({
    onSuccess: () => {
      keysQuery.refetch();
      toast.success('API key revoked');
    },
    onError: (err) => toast.error(err.message),
  });
  const rotateMutation = trpc.apiKeys.rotate.useMutation({
    onSuccess: (data) => {
      setNewlyCreatedKey(data.key);
      keysQuery.refetch();
      toast.success('API key rotated! Copy the new key now.');
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard'));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-5 w-5" /> API Keys
          </h3>
          <p className="text-sm text-muted-foreground">
            Create keys for programmatic access and AI agent integrations.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-1" /> New Key
        </Button>
      </div>

      {/* Newly Created Key Banner */}
      {newlyCreatedKey && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Copy your API key now — it won't be shown again!
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded border flex-1 overflow-hidden text-ellipsis">
                    {showKey ? newlyCreatedKey : `${newlyCreatedKey.substring(0, 15)}${'•'.repeat(40)}`}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => setShowKey(!showKey)}>
                    {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(newlyCreatedKey)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 text-xs"
                  onClick={() => setNewlyCreatedKey(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                placeholder="e.g., My Booking Agent"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <Label>Scopes</Label>
              <p className="text-xs text-muted-foreground mb-2">Select which resources this key can access.</p>
              <div className="grid grid-cols-2 gap-1.5">
                {scopesQuery.data?.map((s) => (
                  <label
                    key={s.scope}
                    className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                      selectedScopes.includes(s.scope)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(s.scope)}
                      onChange={() => toggleScope(s.scope)}
                      className="sr-only"
                    />
                    <Shield className="h-3 w-3 flex-shrink-0" />
                    {s.scope}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rate Limit (req/min)</Label>
                <Input
                  type="number"
                  min={10}
                  max={1000}
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Expires In (days)</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  placeholder="Never"
                  value={expiresInDays ?? ''}
                  onChange={(e) => setExpiresInDays(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  createMutation.mutate({
                    name: newKeyName,
                    scopes: selectedScopes as any,
                    rateLimit,
                    expiresInDays,
                  })
                }
                disabled={!newKeyName || selectedScopes.length === 0 || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Key'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Keys */}
      {keysQuery.data?.length === 0 && !showCreate && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No API keys yet. Create one to get started.</p>
          </CardContent>
        </Card>
      )}

      {keysQuery.data?.map((key) => (
        <Card key={key.id} className={key.revokedAt ? 'opacity-50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{key.name}</span>
                  {key.revokedAt ? (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Revoked</span>
                  ) : key.expiresAt && new Date(key.expiresAt) < new Date() ? (
                    <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Expired</span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Active</span>
                  )}
                </div>
                <code className="text-xs text-muted-foreground">{key.keyPrefix}•••••••</code>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {key.scopes.map((scope: string) => (
                    <span key={scope} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {scope}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created {new Date(key.createdAt).toLocaleDateString()}
                  </span>
                  {key.lastUsedAt && (
                    <span>Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                  )}
                  <span>{key.rateLimit} req/min</span>
                </div>
              </div>
              {!key.revokedAt && (
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Rotate key"
                    onClick={() => rotateMutation.mutate({ id: key.id })}
                    disabled={rotateMutation.isPending}
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Revoke key"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => revokeMutation.mutate({ id: key.id })}
                    disabled={revokeMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ==================== WEBHOOK MANAGEMENT ====================

function WebhookSection() {
  const [showCreate, setShowCreate] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);

  const webhooksQuery = trpc.apiKeys.listWebhooks.useQuery();
  const eventsQuery = trpc.apiKeys.getWebhookEvents.useQuery();
  const createMutation = trpc.apiKeys.createWebhook.useMutation({
    onSuccess: (data) => {
      setNewlyCreatedSecret(data.secret);
      setShowCreate(false);
      setWebhookUrl('');
      setSelectedEvents([]);
      webhooksQuery.refetch();
      toast.success('Webhook endpoint created! Copy the signing secret now.');
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.apiKeys.deleteWebhook.useMutation({
    onSuccess: () => {
      webhooksQuery.refetch();
      toast.success('Webhook endpoint deleted');
    },
    onError: (err) => toast.error(err.message),
  });
  const toggleMutation = trpc.apiKeys.toggleWebhook.useMutation({
    onSuccess: () => {
      webhooksQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard'));
  };

  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Webhook className="h-5 w-5" /> Webhooks
          </h3>
          <p className="text-sm text-muted-foreground">
            Receive real-time event notifications at your endpoint.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-1" /> New Endpoint
        </Button>
      </div>

      {/* Newly Created Secret Banner */}
      {newlyCreatedSecret && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Copy your signing secret now — it won't be shown again!
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded border flex-1 overflow-hidden text-ellipsis">
                    {newlyCreatedSecret}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(newlyCreatedSecret)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 text-xs"
                  onClick={() => setNewlyCreatedSecret(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add Webhook Endpoint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Endpoint URL</Label>
              <Input
                placeholder="https://your-server.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>

            <div>
              <Label>Events</Label>
              <p className="text-xs text-muted-foreground mb-2">Select which events to receive.</p>
              <div className="grid grid-cols-2 gap-1.5">
                {eventsQuery.data?.map((e) => (
                  <label
                    key={e.event}
                    className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                      selectedEvents.includes(e.event)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(e.event)}
                      onChange={() => toggleEvent(e.event)}
                      className="sr-only"
                    />
                    <Globe className="h-3 w-3 flex-shrink-0" />
                    {e.event}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  createMutation.mutate({
                    url: webhookUrl,
                    events: selectedEvents as any,
                  })
                }
                disabled={!webhookUrl || selectedEvents.length === 0 || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Endpoint'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Webhooks */}
      {webhooksQuery.data?.length === 0 && !showCreate && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Webhook className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No webhook endpoints yet.</p>
          </CardContent>
        </Card>
      )}

      {webhooksQuery.data?.map((wh) => (
        <Card key={wh.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <code className="text-xs truncate max-w-[250px]">{wh.url}</code>
                  {wh.isActive ? (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Active</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Paused</span>
                  )}
                  {wh.failureCount > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                      {wh.failureCount} failures
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {wh.events.map((event: string) => (
                    <span key={event} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {event}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-1.5">
                  Created {new Date(wh.createdAt).toLocaleDateString()}
                  {wh.lastDeliveredAt && ` · Last delivery ${new Date(wh.lastDeliveredAt).toLocaleDateString()}`}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  title={wh.isActive ? 'Pause' : 'Resume'}
                  onClick={() => toggleMutation.mutate({ id: wh.id })}
                >
                  {wh.isActive ? <X className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  title="Delete"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => deleteMutation.mutate({ id: wh.id })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export function DeveloperSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" /> Developer Settings
          </CardTitle>
          <CardDescription>
            Manage API keys and webhooks for programmatic access and AI agent integrations.
            Authenticate requests by including your API key in the <code className="text-xs bg-muted px-1 py-0.5 rounded">X-API-Key</code> header.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApiKeySection />
          <WebhookSection />
        </CardContent>
      </Card>
    </div>
  );
}
