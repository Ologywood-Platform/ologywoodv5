import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Users, CheckCircle, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface Ticket {
  id: number;
  subject: string;
  status: string;
  priority: string;
  assignedToId?: number;
  userId: number;
  createdAt: Date;
}

interface SupportTeamMember {
  id: number;
  name: string;
  email: string;
  expertise: string[];
  activeTickets: number;
}

interface TicketAssignmentUIProps {
  ticket: Ticket;
  teamMembers: SupportTeamMember[];
  onAssignmentChange?: (ticketId: number, assignedToId: number) => void;
}

/**
 * Ticket Assignment UI Component
 * Allows admins to assign support tickets to team members
 */
export function TicketAssignmentUI({ ticket, teamMembers, onAssignmentChange }: TicketAssignmentUIProps) {
  const [selectedAssignee, setSelectedAssignee] = useState<string>(ticket.assignedToId?.toString() || '');
  const [isAssigning, setIsAssigning] = useState(false);

  // Mock mutation - replace with actual TRPC call
  const assignTicketMutation = {
    mutate: (data: any) => {
      setIsAssigning(true);
      setTimeout(() => {
        toast.success(`Ticket #${ticket.id} assigned successfully`);
        setIsAssigning(false);
        onAssignmentChange?.(ticket.id, parseInt(selectedAssignee));
      }, 500);
    },
    isPending: isAssigning,
  };

  const handleAssign = () => {
    if (!selectedAssignee) {
      toast.error('Please select a team member');
      return;
    }

    assignTicketMutation.mutate({
      ticketId: ticket.id,
      assignedToId: parseInt(selectedAssignee),
    });
  };

  const currentAssignee = teamMembers.find(
    (member) => member.id === parseInt(selectedAssignee)
  );

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Ticket Assignment</h3>
        </div>

        {/* Ticket Info */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">Ticket ID</p>
              <p className="font-semibold">#{ticket.id}</p>
            </div>
            <Badge className={getPriorityColor(ticket.priority)}>
              {ticket.priority}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600">Subject</p>
            <p className="font-medium">{ticket.subject}</p>
          </div>
        </div>

        {/* Current Assignment */}
        {currentAssignee && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Currently Assigned</p>
              <p className="text-sm text-blue-700">
                {currentAssignee.name} ({currentAssignee.activeTickets} active tickets)
              </p>
            </div>
          </div>
        )}

        {/* Team Member Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium">Assign to Team Member</label>
          <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
            <SelectTrigger>
              <SelectValue placeholder="Select a team member" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span>{member.name}</span>
                    <span className="text-xs text-gray-500">
                      ({member.activeTickets} active)
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Team Member Details */}
        {currentAssignee && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Team Member Details</p>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-gray-600">Email:</span> {currentAssignee.email}
              </p>
              <p>
                <span className="text-gray-600">Active Tickets:</span>{' '}
                {currentAssignee.activeTickets}
              </p>
              <p>
                <span className="text-gray-600">Expertise:</span>{' '}
                {currentAssignee.expertise.join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleAssign}
            disabled={!selectedAssignee || isAssigning}
            className="flex-1"
          >
            {isAssigning ? 'Assigning...' : 'Assign Ticket'}
          </Button>
          <Button variant="outline" className="flex-1">
            Reassign
          </Button>
        </div>

        {/* Info Message */}
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Assigning a ticket will notify the team member via email and add it to their queue.
          </p>
        </div>
      </div>
    </Card>
  );
}
