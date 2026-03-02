import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { AlertCircle, MessageSquare, Plus, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Ticket {
  id: number;
  title: string;
  category: 'payment' | 'contract' | 'booking' | 'other';
  status: 'open' | 'in-progress' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  messages: number;
}

interface SupportTicketSystemProps {
  bookingId?: number;
  onTicketCreated?: (ticket: Ticket) => void;
}

export function SupportTicketSystem({ bookingId, onTicketCreated }: SupportTicketSystemProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Ticket['category']>('other');
  const [priority, setPriority] = useState<Ticket['priority']>('medium');
  const [loading, setLoading] = useState(false);

  const statusColors = {
    open: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    escalated: 'bg-red-100 text-red-800',
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  const handleCreateTicket = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const newTicket: Ticket = {
        id: Math.random(),
        title,
        category,
        status: 'open',
        priority,
        createdAt: new Date().toLocaleDateString(),
        updatedAt: new Date().toLocaleDateString(),
        messages: 0,
      };

      setTickets([newTicket, ...tickets]);
      setTitle('');
      setDescription('');
      setCategory('other');
      setPriority('medium');
      setShowForm(false);
      toast.success('Support ticket created');
      onTicketCreated?.(newTicket);
    } catch (error) {
      toast.error('Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: Ticket['category']) => {
    const labels = {
      payment: 'Payment Issue',
      contract: 'Contract Dispute',
      booking: 'Booking Problem',
      other: 'Other',
    };
    return labels[category];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Support Tickets
        </h3>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        )}
      </div>

      {/* Create Ticket Form */}
      {showForm && (
        <Card className="p-6 border-blue-200 bg-blue-50">
          <h4 className="font-semibold mb-4">Create Support Ticket</h4>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              placeholder="Brief description of your issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              placeholder="Provide detailed information about your issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="payment">Payment Issue</option>
                <option value="contract">Contract Dispute</option>
                <option value="booking">Booking Problem</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleCreateTicket}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Tickets List */}
      <div className="space-y-3">
        {tickets.length > 0 ? (
          tickets.map(ticket => (
            <Card
              key={ticket.id}
              className="p-4 cursor-pointer hover:shadow-md transition"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-semibold mb-1">{ticket.title}</div>
                  <div className="text-sm text-gray-600">
                    Ticket #{Math.floor(ticket.id)} • Created {ticket.createdAt}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Badge className={priorityColors[ticket.priority]}>
                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                  </Badge>
                  <Badge className={statusColors[ticket.status]}>
                    {ticket.status === 'in-progress' ? 'In Progress' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{getCategoryLabel(ticket.category)}</span>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {ticket.messages} messages
                </div>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No support tickets. Everything looks good!
          </p>
        )}
      </div>

      {/* Selected Ticket Detail */}
      {selectedTicket && (
        <Card className="p-6 border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">{selectedTicket.title}</h4>
              <div className="flex gap-2">
                <Badge className={priorityColors[selectedTicket.priority]}>
                  {selectedTicket.priority}
                </Badge>
                <Badge className={statusColors[selectedTicket.status]}>
                  {selectedTicket.status}
                </Badge>
              </div>
            </div>
            <button
              onClick={() => setSelectedTicket(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Category</label>
              <p>{getCategoryLabel(selectedTicket.category)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Created</label>
              <p>{selectedTicket.createdAt}</p>
            </div>
          </div>

          {/* Messages Section */}
          <div className="border-t pt-4">
            <h5 className="font-semibold mb-3">Messages ({selectedTicket.messages})</h5>
            <div className="space-y-3 mb-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">No messages yet. Add a message to get support.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button>Send</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Info Box */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900 mb-1">Support Response Times</p>
            <p className="text-sm text-amber-800">
              Urgent issues: 2 hours • High priority: 6 hours • Medium: 24 hours • Low: 48 hours
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
