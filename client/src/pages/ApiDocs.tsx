/**
 * API Documentation Page
 * Auto-generated reference for the Ologywood public API.
 */
import React, { useState, useEffect } from 'react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Book,
  Key,
  Globe,
  Shield,
  Zap,
  Code,
  Copy,
  ChevronDown,
  ChevronRight,
  Search,
  Music,
  Calendar,
  MessageSquare,
  CreditCard,
  Users,
  Disc3,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';

interface EndpointDoc {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  scope: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  response?: string;
  example?: string;
}

interface EndpointGroup {
  name: string;
  icon: React.ReactNode;
  description: string;
  endpoints: EndpointDoc[];
}

const API_GROUPS: EndpointGroup[] = [
  {
    name: 'Artists',
    icon: <Music className="h-4 w-4" />,
    description: 'Browse and manage artist profiles.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/artists',
        description: 'List all public artist profiles with optional filters.',
        scope: 'artists:read',
        params: [
          { name: 'genre', type: 'string', required: false, description: 'Filter by genre' },
          { name: 'location', type: 'string', required: false, description: 'Filter by city or region' },
          { name: 'minFee', type: 'number', required: false, description: 'Minimum booking fee' },
          { name: 'maxFee', type: 'number', required: false, description: 'Maximum booking fee' },
          { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
          { name: 'limit', type: 'number', required: false, description: 'Results per page (default: 20, max: 100)' },
        ],
        response: '{ artists: Artist[], total: number, page: number }',
        example: 'curl -H "X-API-Key: olo_your_key" https://ologywood.com/api/v1/artists?genre=hip-hop&limit=10',
      },
      {
        method: 'GET',
        path: '/api/v1/artists/:id',
        description: 'Get a single artist profile by ID.',
        scope: 'artists:read',
        params: [{ name: 'id', type: 'number', required: true, description: 'Artist profile ID' }],
        response: '{ artist: Artist }',
        example: 'curl -H "X-API-Key: olo_your_key" https://ologywood.com/api/v1/artists/42',
      },
    ],
  },
  {
    name: 'Bookings',
    icon: <Calendar className="h-4 w-4" />,
    description: 'Create and manage booking requests.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/bookings',
        description: 'List bookings for the authenticated user.',
        scope: 'bookings:read',
        params: [
          { name: 'status', type: 'string', required: false, description: 'Filter by status: pending, confirmed, completed, cancelled' },
          { name: 'page', type: 'number', required: false, description: 'Page number' },
        ],
        response: '{ bookings: Booking[], total: number }',
      },
      {
        method: 'POST',
        path: '/api/v1/bookings',
        description: 'Create a new booking request.',
        scope: 'bookings:write',
        params: [
          { name: 'artistId', type: 'number', required: true, description: 'ID of the artist to book' },
          { name: 'venueId', type: 'number', required: false, description: 'Venue ID (if applicable)' },
          { name: 'eventDate', type: 'string', required: true, description: 'ISO 8601 date string' },
          { name: 'eventType', type: 'string', required: true, description: 'Type of event' },
          { name: 'budget', type: 'number', required: false, description: 'Proposed budget in USD' },
          { name: 'message', type: 'string', required: false, description: 'Message to the artist' },
        ],
        response: '{ booking: Booking }',
        example: `curl -X POST -H "X-API-Key: olo_your_key" -H "Content-Type: application/json" \\
  -d '{"artistId": 42, "eventDate": "2026-04-15", "eventType": "concert", "budget": 5000}' \\
  https://ologywood.com/api/v1/bookings`,
      },
      {
        method: 'PUT',
        path: '/api/v1/bookings/:id/status',
        description: 'Update booking status (confirm, cancel).',
        scope: 'bookings:write',
        params: [
          { name: 'id', type: 'number', required: true, description: 'Booking ID' },
          { name: 'status', type: 'string', required: true, description: 'New status: confirmed, cancelled' },
        ],
        response: '{ booking: Booking }',
      },
    ],
  },
  {
    name: 'Events',
    icon: <Globe className="h-4 w-4" />,
    description: 'Browse and manage public events.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/events',
        description: 'List public events with optional filters.',
        scope: 'events:read',
        params: [
          { name: 'city', type: 'string', required: false, description: 'Filter by city' },
          { name: 'dateFrom', type: 'string', required: false, description: 'Start date (ISO 8601)' },
          { name: 'dateTo', type: 'string', required: false, description: 'End date (ISO 8601)' },
          { name: 'page', type: 'number', required: false, description: 'Page number' },
        ],
        response: '{ events: Event[], total: number }',
      },
      {
        method: 'POST',
        path: '/api/v1/events',
        description: 'Create a new event.',
        scope: 'events:write',
        params: [
          { name: 'title', type: 'string', required: true, description: 'Event title' },
          { name: 'date', type: 'string', required: true, description: 'Event date (ISO 8601)' },
          { name: 'venueId', type: 'number', required: false, description: 'Venue ID' },
          { name: 'description', type: 'string', required: false, description: 'Event description' },
        ],
        response: '{ event: Event }',
      },
    ],
  },
  {
    name: 'Messages',
    icon: <MessageSquare className="h-4 w-4" />,
    description: 'Send and receive in-platform messages.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/messages/conversations',
        description: 'List all conversations for the authenticated user.',
        scope: 'messages:read',
        response: '{ conversations: Conversation[] }',
      },
      {
        method: 'POST',
        path: '/api/v1/messages',
        description: 'Send a message in a conversation.',
        scope: 'messages:write',
        params: [
          { name: 'recipientId', type: 'number', required: true, description: 'User ID of the recipient' },
          { name: 'content', type: 'string', required: true, description: 'Message content' },
        ],
        response: '{ message: Message }',
      },
    ],
  },
  {
    name: 'Releases',
    icon: <Disc3 className="h-4 w-4" />,
    description: 'Manage White Label music releases.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/releases',
        description: 'List releases for the authenticated artist.',
        scope: 'releases:read',
        response: '{ releases: Release[] }',
      },
      {
        method: 'POST',
        path: '/api/v1/releases',
        description: 'Create a new music release.',
        scope: 'releases:write',
        params: [
          { name: 'title', type: 'string', required: true, description: 'Release title' },
          { name: 'price', type: 'number', required: true, description: 'Price in USD (min $0.50)' },
          { name: 'description', type: 'string', required: false, description: 'Release description' },
        ],
        response: '{ release: Release }',
      },
    ],
  },
  {
    name: 'Profile',
    icon: <Users className="h-4 w-4" />,
    description: 'Read and update the authenticated user\'s profile.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/profile',
        description: 'Get the authenticated user\'s profile.',
        scope: 'profile:read',
        response: '{ user: User, artistProfile?: ArtistProfile, venueProfile?: VenueProfile }',
      },
      {
        method: 'PUT',
        path: '/api/v1/profile',
        description: 'Update the authenticated user\'s profile.',
        scope: 'profile:write',
        params: [
          { name: 'name', type: 'string', required: false, description: 'Display name' },
          { name: 'bio', type: 'string', required: false, description: 'Bio or description' },
        ],
        response: '{ user: User }',
      },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function EndpointCard({ endpoint }: { endpoint: EndpointDoc }) {
  const [expanded, setExpanded] = useState(false);

  const copyExample = () => {
    if (endpoint.example) {
      navigator.clipboard.writeText(endpoint.example);
      toast.success('Copied to clipboard');
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${METHOD_COLORS[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="text-sm font-mono flex-1">{endpoint.path}</code>
        <span className="text-xs text-muted-foreground hidden sm:inline">{endpoint.scope}</span>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t bg-muted/20 space-y-3">
          <p className="text-sm text-muted-foreground pt-3">{endpoint.description}</p>

          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Parameters</h4>
              <div className="space-y-1">
                {endpoint.params.map((p) => (
                  <div key={p.name} className="flex items-start gap-2 text-sm">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{p.name}</code>
                    <span className="text-xs text-muted-foreground">{p.type}</span>
                    {p.required && <span className="text-xs text-red-500">required</span>}
                    <span className="text-xs text-muted-foreground">— {p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {endpoint.response && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Response</h4>
              <code className="text-xs bg-muted px-2 py-1 rounded block font-mono">{endpoint.response}</code>
            </div>
          )}

          {endpoint.example && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Example</h4>
                <Button size="sm" variant="ghost" onClick={copyExample} className="h-6 px-2">
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto font-mono whitespace-pre-wrap">
                {endpoint.example}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApiDocs() {
  useEffect(() => {
    setMetaTags(pageMetaTags['api-docs']);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(API_GROUPS.map((g) => g.name)));

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const filteredGroups = API_GROUPS.map((group) => ({
    ...group,
    endpoints: group.endpoints.filter(
      (ep) =>
        !searchQuery ||
        ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.scope.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((g) => g.endpoints.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12 sm:py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Book className="h-8 w-8 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold">API Documentation</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Build integrations and AI agents with the Ologywood REST API. Authenticate with API keys,
            receive real-time webhooks, and access every platform feature programmatically.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-4xl py-8 space-y-8">
        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" /> Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
                <div>
                  <p className="text-sm font-medium">Create an API key</p>
                  <p className="text-xs text-muted-foreground">Go to Account Settings → Developer → New Key. Select the scopes you need.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
                <div>
                  <p className="text-sm font-medium">Authenticate requests</p>
                  <p className="text-xs text-muted-foreground">Include your key in the <code className="bg-muted px-1 rounded">X-API-Key</code> header.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
                <div>
                  <p className="text-sm font-medium">Make your first request</p>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded mt-1 overflow-x-auto font-mono">
{`curl -H "X-API-Key: olo_your_key_here" \\
  https://ologywood.com/api/v1/artists?limit=5`}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" /> Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              All API requests require authentication via an API key. Include your key in the
              <code className="bg-muted px-1.5 py-0.5 rounded mx-1">X-API-Key</code> request header.
            </p>
            <p>
              Keys are scoped — each key only has access to the resources you explicitly grant during creation.
              Keys can be rotated or revoked at any time from the Developer Settings.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                <Shield className="h-3.5 w-3.5 inline mr-1" />
                Never share your API key in client-side code or public repositories. Store it securely as an environment variable.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" /> Rate Limiting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              API keys have configurable rate limits (10–1,000 requests per minute). The default is 100 req/min.
              Rate limit headers are included in every response:
            </p>
            <div className="space-y-1 font-mono text-xs">
              <p><code className="bg-muted px-1.5 py-0.5 rounded">X-RateLimit-Limit</code> — Maximum requests per window</p>
              <p><code className="bg-muted px-1.5 py-0.5 rounded">X-RateLimit-Remaining</code> — Requests remaining</p>
              <p><code className="bg-muted px-1.5 py-0.5 rounded">X-RateLimit-Reset</code> — Window reset time (Unix timestamp)</p>
            </div>
            <p>When the limit is exceeded, the API returns <code className="bg-muted px-1.5 py-0.5 rounded">429 Too Many Requests</code>.</p>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" /> Webhooks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Register webhook endpoints in Developer Settings to receive real-time notifications when events occur.
              Each delivery includes an <code className="bg-muted px-1.5 py-0.5 rounded">X-Webhook-Signature</code> header
              for verification using your endpoint's signing secret.
            </p>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Available Events</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {['booking.created', 'booking.updated', 'booking.cancelled', 'booking.confirmed',
                  'message.received', 'payment.completed', 'payment.failed',
                  'event.created', 'event.updated', 'release.published'].map((event) => (
                  <code key={event} className="text-xs bg-muted px-2 py-1 rounded">{event}</code>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Endpoint Groups */}
        {filteredGroups.map((group) => (
          <div key={group.name}>
            <button
              className="flex items-center gap-2 mb-3 w-full text-left"
              onClick={() => toggleGroup(group.name)}
            >
              {expandedGroups.has(group.name) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {group.icon}
              <h2 className="text-lg font-semibold">{group.name}</h2>
              <span className="text-xs text-muted-foreground ml-1">— {group.description}</span>
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded ml-auto">{group.endpoints.length}</span>
            </button>

            {expandedGroups.has(group.name) && (
              <div className="space-y-2 ml-6">
                {group.endpoints.map((ep) => (
                  <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} />
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No endpoints match your search.</p>
          </div>
        )}

        {/* Error Codes */}
        <Card>
          <CardHeader>
            <CardTitle>Error Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Code</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2">Description</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">400</td><td className="pr-4">Bad Request</td><td>Invalid parameters or missing required fields</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">401</td><td className="pr-4">Unauthorized</td><td>Missing or invalid API key</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">403</td><td className="pr-4">Forbidden</td><td>API key lacks required scope</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">404</td><td className="pr-4">Not Found</td><td>Resource does not exist</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-mono">429</td><td className="pr-4">Too Many Requests</td><td>Rate limit exceeded</td></tr>
                  <tr><td className="py-2 pr-4 font-mono">500</td><td className="pr-4">Internal Error</td><td>Server error — please report if persistent</td></tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* SDKs & Support */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              For questions about the API, reach out via the <a href="/contact" className="text-primary underline">Contact page</a> or
              check the <a href="/help" className="text-primary underline">Help Center</a>.
            </p>
            <p className="text-muted-foreground">
              SDKs for Python, Node.js, and other languages are coming soon.
            </p>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
