import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Edit2, Check, X, Clock } from 'lucide-react';

interface Message {
  id: string;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: string[];
}

interface ContractVersion {
  version: number;
  createdBy: string;
  createdAt: Date;
  changes?: string;
}

interface MessagingHubProps {
  bookingId: number;
  participantName: string;
  contractStatus?: 'draft' | 'pending_review' | 'accepted' | 'signed';
  onSendMessage?: (message: string) => void;
  onUpdateContract?: (content: string) => void;
}

export function MessagingHub({
  bookingId,
  participantName,
  contractStatus = 'draft',
  onSendMessage,
  onUpdateContract,
}: MessagingHubProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showContractEditor, setShowContractEditor] = useState(false);
  const [contractContent, setContractContent] = useState('');
  const [contractVersions, setContractVersions] = useState<ContractVersion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: 1, // Current user ID
      senderName: 'You',
      content: newMessage,
      timestamp: new Date(),
      isRead: false,
    };

    setMessages([...messages, message]);
    onSendMessage?.(newMessage);
    setNewMessage('');
  };

  const handleUpdateContract = () => {
    if (!contractContent.trim()) return;

    const newVersion: ContractVersion = {
      version: contractVersions.length + 1,
      createdBy: 'You',
      createdAt: new Date(),
      changes: 'Updated terms',
    };

    setContractVersions([...contractVersions, newVersion]);
    onUpdateContract?.(contractContent);
    setShowContractEditor(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'signed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{participantName}</h3>
            <p className="text-sm text-gray-600">Booking #{bookingId}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contractStatus)}`}>
            {contractStatus === 'pending_review' && <Clock className="h-4 w-4 inline mr-1" />}
            {contractStatus === 'signed' && <Check className="h-4 w-4 inline mr-1" />}
            {contractStatus.replace('_', ' ').charAt(0).toUpperCase() + contractStatus.slice(1).replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-gray-500 mb-2">No messages yet</p>
              <p className="text-sm text-gray-400">Start the conversation below</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === 1 ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
                  msg.senderId === 1
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm font-medium mb-1">{msg.senderName}</p>
                <p className="text-sm break-words">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.senderId === 1 ? 'text-purple-100' : 'text-gray-500'}`}>
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Contract Section */}
      <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Edit2 className="h-4 w-4" />
            Contract Negotiation
          </h4>
          <button
            onClick={() => setShowContractEditor(!showContractEditor)}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            {showContractEditor ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {showContractEditor ? (
          <div className="space-y-3">
            <textarea
              value={contractContent}
              onChange={(e) => setContractContent(e.target.value)}
              placeholder="Enter or edit contract terms..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpdateContract}
                className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                Save Version
              </button>
              <button
                onClick={() => setShowContractEditor(false)}
                className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            {contractVersions.length === 0 ? (
              <p>No contract versions yet. Click Edit to create one.</p>
            ) : (
              <div>
                <p className="mb-2">
                  <strong>{contractVersions.length}</strong> version{contractVersions.length !== 1 ? 's' : ''} created
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {contractVersions.map((v, idx) => (
                    <div key={idx} className="text-xs bg-white p-2 rounded border border-gray-200">
                      <p className="font-medium">v{v.version} - {v.createdBy}</p>
                      <p className="text-gray-500">{v.createdAt.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
        <div className="flex gap-2">
          <button
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
            title="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
