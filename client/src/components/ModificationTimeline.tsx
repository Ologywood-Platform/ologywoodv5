import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, MessageSquare } from 'lucide-react';

interface ModificationEvent {
  id: number;
  timestamp: Date;
  type: 'proposed' | 'approved' | 'rejected' | 'counter_proposed';
  fieldName: string;
  originalValue: string;
  proposedValue: string;
  reason?: string;
  changedBy: string;
  changedByRole: 'artist' | 'venue';
  notes?: string;
}

interface ModificationTimelineProps {
  events: ModificationEvent[];
  currentUserRole: 'artist' | 'venue';
}

const getStatusIcon = (type: string) => {
  switch (type) {
    case 'approved':
      return <CheckCircle2 className="h-6 w-6 text-green-600" />;
    case 'rejected':
      return <XCircle className="h-6 w-6 text-red-600" />;
    case 'proposed':
      return <Clock className="h-6 w-6 text-yellow-600" />;
    case 'counter_proposed':
      return <MessageSquare className="h-6 w-6 text-blue-600" />;
    default:
      return <Clock className="h-6 w-6 text-gray-600" />;
  }
};

const getStatusBadgeVariant = (type: string): any => {
  switch (type) {
    case 'approved':
      return 'default';
    case 'rejected':
      return 'destructive';
    case 'proposed':
      return 'secondary';
    case 'counter_proposed':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusLabel = (type: string) => {
  switch (type) {
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'proposed':
      return 'Proposed';
    case 'counter_proposed':
      return 'Counter-Proposed';
    default:
      return 'Pending';
  }
};

export function ModificationTimeline({ events, currentUserRole }: ModificationTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No modifications yet</p>
        </CardContent>
      </Card>
    );
  }

  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 to-pink-200" />

        {/* Events */}
        <div className="space-y-6">
          {sortedEvents.map((event, index) => (
            <div key={event.id} className="relative pl-20">
              {/* Timeline dot */}
              <div className="absolute left-0 top-2">
                {getStatusIcon(event.type)}
              </div>

              {/* Event card */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-base">
                          {event.fieldName}
                        </CardTitle>
                        <Badge variant={getStatusBadgeVariant(event.type)}>
                          {getStatusLabel(event.type)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()} • {event.changedBy} ({event.changedByRole})
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Original vs Proposed values */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Original Value</p>
                      <div className="bg-gray-50 p-2 rounded text-sm font-mono break-words">
                        {event.originalValue}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Proposed Value</p>
                      <div className="bg-purple-50 p-2 rounded text-sm font-mono break-words">
                        {event.proposedValue}
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  {event.reason && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Reason</p>
                      <p className="text-sm text-gray-700 italic">"{event.reason}"</p>
                    </div>
                  )}

                  {/* Notes */}
                  {event.notes && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{event.notes}</p>
                    </div>
                  )}

                  {/* Status indicator */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <div className={`h-2 w-2 rounded-full ${
                      event.type === 'approved' ? 'bg-green-600' :
                      event.type === 'rejected' ? 'bg-red-600' :
                      event.type === 'proposed' ? 'bg-yellow-600' :
                      'bg-blue-600'
                    }`} />
                    <p className="text-xs text-muted-foreground">
                      {event.type === 'approved' && 'This modification has been approved'}
                      {event.type === 'rejected' && 'This modification was rejected'}
                      {event.type === 'proposed' && 'Awaiting response'}
                      {event.type === 'counter_proposed' && 'A counter-proposal has been made'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
