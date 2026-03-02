import React, { useState } from 'react';
import { AlertCircle, FileText, Clock, CheckCircle, MessageSquare, Upload } from 'lucide-react';

interface Dispute {
  id: string;
  bookingId: number;
  reason: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  evidence: string[];
}

interface DisputeResolutionCenterProps {
  disputes: Dispute[];
  onCreateDispute: (reason: string, description: string, evidence: string[]) => void;
  onUploadEvidence: (disputeId: string, files: File[]) => void;
}

export const DisputeResolutionCenter: React.FC<DisputeResolutionCenterProps> = ({
  disputes,
  onCreateDispute,
  onUploadEvidence,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
  });
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);

  const handleCreateDispute = () => {
    if (formData.reason && formData.description) {
      onCreateDispute(formData.reason, formData.description, []);
      setFormData({ reason: '', description: '' });
      setShowCreateForm(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dispute Resolution Center</h1>
        <p className="text-gray-600 mt-2">
          Securely resolve booking disputes with escrow protection and mediation support
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
        <div>
          <p className="text-sm text-blue-900 font-medium">How Escrow Works</p>
          <p className="text-sm text-blue-800 mt-1">
            Payments are held securely until the event is completed. If a dispute arises, our mediation
            team will help resolve it fairly.
          </p>
        </div>
      </div>

      {/* Create Dispute Button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
        >
          + Report a Dispute
        </button>
      )}

      {/* Create Dispute Form */}
      {showCreateForm && (
        <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Report a Dispute</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Select a reason</option>
                <option value="payment_issue">Payment Issue</option>
                <option value="cancellation">Cancellation Dispute</option>
                <option value="quality_issue">Quality/Performance Issue</option>
                <option value="contract_breach">Contract Breach</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the issue in detail..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent h-32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Evidence</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-red-500 transition">
                <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PDF, images, or documents up to 10MB</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateDispute}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Submit Dispute
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disputes List */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Disputes</h2>

        {disputes.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <CheckCircle className="mx-auto text-green-600 mb-3" size={32} />
            <p className="text-gray-600">No disputes reported. Great!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div
                key={dispute.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
                onClick={() => setSelectedDispute(selectedDispute === dispute.id ? null : dispute.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getPriorityIcon(dispute.priority)}</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{dispute.reason}</h3>
                      <p className="text-sm text-gray-600">Booking #{dispute.bookingId}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dispute.status)}`}>
                    {dispute.status.replace('_', ' ')}
                  </span>
                </div>

                {selectedDispute === dispute.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
                      <p className="text-gray-600">{dispute.description}</p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} />
                      <span>Created {new Date(dispute.createdAt).toLocaleDateString()}</span>
                    </div>

                    {dispute.status === 'under_review' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-sm text-yellow-900">
                          <strong>Status:</strong> Our mediation team is reviewing your case. You'll be
                          notified when a mediator is assigned.
                        </p>
                      </div>
                    )}

                    {dispute.status === 'resolved' && (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-sm text-green-900">
                          <strong>Resolved!</strong> Check your messages for the resolution details.
                        </p>
                      </div>
                    )}

                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2">
                      <MessageSquare size={16} />
                      View Mediation Chat
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Escrow Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex gap-4">
          <FileText className="text-blue-600 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Escrow Protection</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ All payments held securely until event completion</li>
              <li>✓ Automatic release upon mutual agreement</li>
              <li>✓ 30-day dispute window if issues arise</li>
              <li>✓ Free mediation for all disputes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputeResolutionCenter;
