import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { FileText, Clock, CheckCircle, XCircle, Eye, Send, AlertCircle, ChevronRight, Filter } from 'lucide-react';

type ContractStatus = 'draft' | 'sent' | 'viewed' | 'signed_by_venue' | 'signed_by_artist' | 'fully_signed' | 'declined';

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: FileText },
  sent: { label: 'Sent', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Send },
  viewed: { label: 'Viewed', color: 'text-indigo-600', bgColor: 'bg-indigo-100', icon: Eye },
  signed_by_venue: { label: 'Awaiting Artist', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock },
  signed_by_artist: { label: 'Awaiting You', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: AlertCircle },
  fully_signed: { label: 'Fully Signed', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  declined: { label: 'Declined', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
};

function StatusBadge({ status }: { status: ContractStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

type FilterOption = 'all' | 'pending' | 'signed' | 'declined';

export function VenueContractsDashboard() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<FilterOption>('all');
  
  const { data: contracts, isLoading } = trpc.venueContract.getMyContracts.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Venue Contracts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const allContracts = contracts || [];
  
  // Calculate stats
  const stats = {
    total: allContracts.length,
    pending: allContracts.filter(c => ['draft', 'sent', 'viewed', 'signed_by_venue', 'signed_by_artist'].includes(c.status)).length,
    signed: allContracts.filter(c => c.status === 'fully_signed').length,
    declined: allContracts.filter(c => c.status === 'declined').length,
  };

  // Filter contracts
  const filteredContracts = allContracts.filter(contract => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['draft', 'sent', 'viewed', 'signed_by_venue', 'signed_by_artist'].includes(contract.status);
    if (filter === 'signed') return contract.status === 'fully_signed';
    if (filter === 'declined') return contract.status === 'declined';
    return true;
  });

  const formatDate = (date: string | Date | null) => {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-amber-600" />
            Venue Contracts
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate('/contracts')}>
            View All <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`text-center p-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-gray-200 ring-1 ring-gray-300' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <p className="text-lg font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`text-center p-2 rounded-lg transition-colors ${filter === 'pending' ? 'bg-yellow-100 ring-1 ring-yellow-300' : 'bg-yellow-50 hover:bg-yellow-100'}`}
          >
            <p className="text-lg font-bold text-yellow-700">{stats.pending}</p>
            <p className="text-xs text-yellow-600">Pending</p>
          </button>
          <button
            onClick={() => setFilter('signed')}
            className={`text-center p-2 rounded-lg transition-colors ${filter === 'signed' ? 'bg-green-100 ring-1 ring-green-300' : 'bg-green-50 hover:bg-green-100'}`}
          >
            <p className="text-lg font-bold text-green-700">{stats.signed}</p>
            <p className="text-xs text-green-600">Signed</p>
          </button>
          <button
            onClick={() => setFilter('declined')}
            className={`text-center p-2 rounded-lg transition-colors ${filter === 'declined' ? 'bg-red-100 ring-1 ring-red-300' : 'bg-red-50 hover:bg-red-100'}`}
          >
            <p className="text-lg font-bold text-red-700">{stats.declined}</p>
            <p className="text-xs text-red-600">Declined</p>
          </button>
        </div>

        {/* Contract List */}
        {filteredContracts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            {allContracts.length === 0 ? (
              <div className="space-y-2">
                <FileText className="h-10 w-10 mx-auto text-gray-300" />
                <p className="text-sm">No contracts yet</p>
                <p className="text-xs">Create a contract from any booking detail page</p>
              </div>
            ) : (
              <p className="text-sm">No contracts match this filter</p>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredContracts.slice(0, 10).map(contract => (
              <div
                key={contract.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/booking/${contract.bookingId}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{contract.title}</p>
                    <StatusBadge status={contract.status as ContractStatus} />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-muted-foreground">
                      Artist: <span className="font-medium">{contract.artistName}</span>
                    </p>
                    {contract.eventDate && (
                      <p className="text-xs text-muted-foreground">
                        Event: {formatDate(contract.eventDate)}
                      </p>
                    )}
                    {(contract as any).expiresAt && (
                      <p className={`text-xs ${new Date((contract as any).expiresAt) < new Date() ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                        {new Date((contract as any).expiresAt) < new Date() ? '⚠ Expired' : `Due: ${formatDate((contract as any).expiresAt)}`}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
              </div>
            ))}
            {filteredContracts.length > 10 && (
              <button
                onClick={() => navigate('/contracts')}
                className="w-full text-center py-2 text-sm text-primary hover:underline"
              >
                View all {filteredContracts.length} contracts →
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
