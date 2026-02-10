import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, MessageSquare, Upload, Send } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

interface Dispute {
  id: number;
  bookingId: number;
  initiatedBy: string;
  status: 'open' | 'in_review' | 'resolved' | 'escalated';
  title: string;
  description: string;
  evidence: string[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: Date;
}

export const DisputeResolutionDashboard = () => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'in_review' | 'resolved'>('all');

  useEffect(() => {
    fetchDisputes();
  }, [user?.id]);

  const fetchDisputes = async () => {
    try {
      // Mock data - replace with actual API calls
      setDisputes([
        {
          id: 1,
          bookingId: 101,
          initiatedBy: 'Venue Owner',
          status: 'open',
          title: 'Artist did not show up',
          description: 'The artist failed to appear for the scheduled event on June 15th',
          evidence: ['booking_confirmation.pdf', 'event_photos.zip'],
          messages: [
            {
              id: 1,
              sender: 'Venue Owner',
              content: 'The artist did not show up for our event',
              timestamp: new Date('2026-02-01'),
            },
          ],
          createdAt: new Date('2026-02-01'),
          updatedAt: new Date('2026-02-01'),
        },
        {
          id: 2,
          bookingId: 102,
          initiatedBy: 'Artist',
          status: 'in_review',
          title: 'Venue did not provide agreed equipment',
          description: 'The venue promised a full PA system but only provided basic speakers',
          evidence: ['rider_agreement.pdf', 'equipment_photos.zip'],
          messages: [
            {
              id: 1,
              sender: 'Artist',
              content: 'The venue did not provide the agreed equipment',
              timestamp: new Date('2026-01-28'),
            },
            {
              id: 2,
              sender: 'Ologywood Support',
              content: 'We are reviewing this dispute and will get back to you within 24 hours',
              timestamp: new Date('2026-01-29'),
            },
          ],
          createdAt: new Date('2026-01-28'),
          updatedAt: new Date('2026-01-29'),
        },
      ]);
    } catch (error) {
      console.error('Error fetching disputes:', error);
    }
  };

  const filteredDisputes = disputes.filter((d) => filter === 'all' || d.status === filter);

  const handleSendMessage = async () => {
    if (!selectedDispute || !newMessage.trim()) return;

    try {
      // Add message to selected dispute
      const updatedDispute = {
        ...selectedDispute,
        messages: [
          ...selectedDispute.messages,
          {
            id: selectedDispute.messages.length + 1,
            sender: user?.name || 'You',
            content: newMessage,
            timestamp: new Date(),
          },
        ],
      };

      setSelectedDispute(updatedDispute);
      setNewMessage('');

      // Update disputes list
      setDisputes(disputes.map((d) => (d.id === selectedDispute.id ? updatedDispute : d)));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'escalated':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4" />;
      case 'in_review':
        return <Clock className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dispute Resolution</h1>
          <p className="text-gray-600 mt-2">Manage and resolve booking disputes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Disputes List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              {/* Filter Tabs */}
              <div className="border-b p-4">
                <div className="space-y-2">
                  {(['all', 'open', 'in_review', 'resolved'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`w-full text-left px-4 py-2 rounded ${
                        filter === f
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disputes */}
              <div className="divide-y max-h-96 overflow-y-auto">
                {filteredDisputes.map((dispute) => (
                  <button
                    key={dispute.id}
                    onClick={() => setSelectedDispute(dispute)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                      selectedDispute?.id === dispute.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 truncate">{dispute.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{dispute.initiatedBy}</p>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(dispute.status)}`}>
                        {getStatusIcon(dispute.status)}
                        {dispute.status.replace('_', ' ')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dispute Detail */}
          <div className="lg:col-span-2">
            {selectedDispute ? (
              <div className="bg-white rounded-lg shadow">
                {/* Header */}
                <div className="border-b p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedDispute.title}</h2>
                      <p className="text-gray-600 mt-1">Booking #{selectedDispute.bookingId}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedDispute.status)}`}>
                      {getStatusIcon(selectedDispute.status)}
                      {selectedDispute.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="border-b p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedDispute.description}</p>
                </div>

                {/* Evidence */}
                {selectedDispute.evidence.length > 0 && (
                  <div className="border-b p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Evidence</h3>
                    <div className="space-y-2">
                      {selectedDispute.evidence.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Upload className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-700">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="border-b p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Messages</h3>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {selectedDispute.messages.map((msg) => (
                      <div key={msg.id} className="flex gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{msg.sender}</span>
                            <span className="text-xs text-gray-600">{msg.timestamp.toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-700 mt-1">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reply */}
                <div className="p-6">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a dispute to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputeResolutionDashboard;
