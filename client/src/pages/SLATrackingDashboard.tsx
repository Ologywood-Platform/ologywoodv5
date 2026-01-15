import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Clock, CheckCircle2, TrendingDown, AlertTriangle } from 'lucide-react';

interface TicketSLA {
  id: number;
  ticketId: number;
  subject: string;
  priority: string;
  status: string;
  assignedTo: string;
  createdAt: string;
  hoursRemaining: number;
  percentComplete: number;
  escalationLevel: 0 | 1 | 2;
  isOverdue: boolean;
}

export default function SLATrackingDashboard() {
  const [tickets] = useState<TicketSLA[]>([
    {
      id: 1,
      ticketId: 101,
      subject: 'Cannot book artist for event',
      priority: 'high',
      status: 'open',
      assignedTo: 'Sarah Johnson',
      createdAt: '2 hours ago',
      hoursRemaining: 2,
      percentComplete: 50,
      escalationLevel: 0,
      isOverdue: false,
    },
    {
      id: 2,
      ticketId: 102,
      subject: 'Payment processing error',
      priority: 'urgent',
      status: 'open',
      assignedTo: 'Mike Chen',
      createdAt: '45 minutes ago',
      hoursRemaining: 0.25,
      percentComplete: 92,
      escalationLevel: 1,
      isOverdue: false,
    },
    {
      id: 3,
      ticketId: 103,
      subject: 'Rider template not downloading',
      priority: 'medium',
      status: 'open',
      assignedTo: 'Emma Davis',
      createdAt: '8 hours ago',
      hoursRemaining: 0,
      percentComplete: 100,
      escalationLevel: 2,
      isOverdue: true,
    },
    {
      id: 4,
      ticketId: 104,
      subject: 'Contract signature issue',
      priority: 'high',
      status: 'in_progress',
      assignedTo: 'Sarah Johnson',
      createdAt: '1 hour ago',
      hoursRemaining: 3,
      percentComplete: 25,
      escalationLevel: 0,
      isOverdue: false,
    },
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEscalationIcon = (level: number) => {
    switch (level) {
      case 2:
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 1:
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getProgressColor = (percentComplete: number) => {
    if (percentComplete >= 100) return 'bg-red-500';
    if (percentComplete >= 75) return 'bg-orange-500';
    if (percentComplete >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const overdueTickets = tickets.filter(t => t.isOverdue).length;
  const escalatedTickets = tickets.filter(t => t.escalationLevel > 0).length;
  const onTrackTickets = tickets.filter(t => !t.isOverdue && t.escalationLevel === 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">SLA Tracking Dashboard</h1>
          <p className="text-slate-600">Monitor ticket SLA compliance and escalation status</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-1">On Track</p>
                <p className="text-3xl font-bold text-blue-600">{onTrackTickets}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-1">Escalated</p>
                <p className="text-3xl font-bold text-orange-600">{escalatedTickets}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-1">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{overdueTickets}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-1">Compliance</p>
                <p className="text-3xl font-bold text-green-600">
                  {Math.round(((tickets.length - overdueTickets) / tickets.length) * 100)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SLA Policies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>SLA Response Time Policies</CardTitle>
            <CardDescription>Service level agreements by ticket priority</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { priority: 'Urgent', response: '1 hour', resolution: '4 hours', color: 'bg-red-50 border-red-200' },
                { priority: 'High', response: '4 hours', resolution: '24 hours', color: 'bg-orange-50 border-orange-200' },
                { priority: 'Medium', response: '8 hours', resolution: '48 hours', color: 'bg-yellow-50 border-yellow-200' },
                { priority: 'Low', response: '24 hours', resolution: '72 hours', color: 'bg-green-50 border-green-200' },
              ].map((policy) => (
                <div key={policy.priority} className={`p-4 rounded-lg border ${policy.color}`}>
                  <p className="font-semibold text-slate-900 mb-2">{policy.priority}</p>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-slate-600">Response:</span> <span className="font-medium">{policy.response}</span>
                    </p>
                    <p>
                      <span className="text-slate-600">Resolution:</span> <span className="font-medium">{policy.resolution}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Tickets</CardTitle>
            <CardDescription>Showing {tickets.length} tickets with SLA tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">#{ticket.ticketId}</span>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      {ticket.isOverdue && (
                        <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                      )}
                    </div>
                    <p className="text-slate-700">{ticket.subject}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {ticket.assignedTo} • Created {ticket.createdAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getEscalationIcon(ticket.escalationLevel)}
                    {ticket.escalationLevel === 2 && (
                      <span className="text-xs font-semibold text-red-600">Level 2</span>
                    )}
                    {ticket.escalationLevel === 1 && (
                      <span className="text-xs font-semibold text-orange-600">Level 1</span>
                    )}
                  </div>
                </div>

                {/* SLA Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-600">SLA Progress</span>
                    <span className="text-xs font-semibold text-slate-900">
                      {ticket.hoursRemaining > 0
                        ? `${ticket.hoursRemaining.toFixed(1)}h remaining`
                        : 'Overdue'}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, ticket.percentComplete)}
                    className="h-2"
                  />
                  <div className="text-xs text-slate-500">
                    {ticket.percentComplete.toFixed(0)}% of SLA time used
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Escalation Rules Info */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-2">Automatic Escalation Rules</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Level 1:</strong> When 50% of response time SLA is used</li>
                  <li>• <strong>Level 2:</strong> When 75% of response time SLA is used</li>
                  <li>• <strong>Critical:</strong> When SLA response time is exceeded</li>
                  <li>• Escalated tickets are automatically assigned to senior support staff</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
