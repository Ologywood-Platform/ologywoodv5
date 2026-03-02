import React, { useState } from 'react';
import { MessageSquare, Send, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
}

interface ContractVersion {
  version: number;
  createdAt: Date;
  createdBy: string;
  changes?: string;
}

interface MessagingCollaborationHubProps {
  bookingId: number;
  messages: Message[];
  contractVersions: ContractVersion[];
  onSendMessage: (content: string) => void;
  onUploadContract: (file: File) => void;
  onSignContract: () => void;
}

export const MessagingCollaborationHub: React.FC<MessagingCollaborationHubProps> = ({
  bookingId,
  messages,
  contractVersions,
  onSendMessage,
  onUploadContract,
  onSignContract,
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'contract'>('messages');

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput);
      setMessageInput('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <h1 className="text-2xl font-bold">Booking #{ bookingId} Collaboration</h1>
        <p className="text-blue-100 mt-1">Communicate and finalize contract details</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 px-6 py-4 font-medium transition ${
            activeTab === 'messages'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="inline mr-2" size={18} />
          Messages
        </button>
        <button
          onClick={() => setActiveTab('contract')}
          className={`flex-1 px-6 py-4 font-medium transition ${
            activeTab === 'contract'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="inline mr-2" size={18} />
          Contract
        </button>
      </div>

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="p-6 space-y-4">
          {/* Messages List */}
          <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="mx-auto mb-3 text-gray-400" size={32} />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.isOwn
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    {!msg.isOwn && <p className="text-sm font-semibold">{msg.senderName}</p>}
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Send size={18} />
              Send
            </button>
          </div>
        </div>
      )}

      {/* Contract Tab */}
      {activeTab === 'contract' && (
        <div className="p-6 space-y-6">
          {/* Contract Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-blue-600" size={20} />
              <h3 className="font-bold text-gray-900">Contract Status</h3>
            </div>
            <p className="text-sm text-gray-700">
              Current version: <strong>v{contractVersions.length}</strong> • Pending signature
            </p>
          </div>

          {/* Contract Versions */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Version History</h3>
            <div className="space-y-2">
              {contractVersions.map((version) => (
                <div key={version.version} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">Version {version.version}</p>
                      <p className="text-sm text-gray-600">
                        Created by {version.createdBy} •{' '}
                        {new Date(version.createdAt).toLocaleDateString()}
                      </p>
                      {version.changes && (
                        <p className="text-sm text-gray-700 mt-1">Changes: {version.changes}</p>
                      )}
                    </div>
                    <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-sm">
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Contract */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Upload New Version</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition">
              <FileText className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">PDF or Word documents</p>
            </div>
          </div>

          {/* Sign Contract */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="text-green-600" size={20} />
              <h3 className="font-bold text-gray-900">Ready to Sign?</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Both parties have reviewed the contract. Click below to sign electronically.
            </p>
            <button
              onClick={onSignContract}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Sign Contract
            </button>
          </div>

          {/* Comments Section */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Comments & Suggestions</h3>
            <div className="space-y-3 mb-4">
              <div className="border border-gray-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-900">John Doe</p>
                <p className="text-sm text-gray-700 mt-1">Can we adjust the payment terms?</p>
                <p className="text-xs text-gray-500 mt-2">2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingCollaborationHub;
