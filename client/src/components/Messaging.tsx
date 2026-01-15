import React, { useState, useEffect, useRef } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Send, Phone, Video, MoreVertical, Search } from 'lucide-react';
import { toast } from 'sonner';


interface Conversation {
  id: number;
  participantName: string;
  participantRole: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  bookingId?: number;
}

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export function Messaging() {
  const user = { id: 1, name: 'You', role: 'artist' }; // Mock user
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data - in production, these would be real API calls
  const mockConversations: Conversation[] = [
    {
      id: 1,
      participantName: 'The Venue NYC',
      participantRole: 'venue',
      lastMessage: 'Can you confirm the technical requirements?',
      lastMessageTime: '2 hours ago',
      unreadCount: 2,
      bookingId: 101,
    },
    {
      id: 2,
      participantName: 'Jazz Club Downtown',
      participantRole: 'venue',
      lastMessage: 'Perfect! See you on Saturday.',
      lastMessageTime: '1 day ago',
      unreadCount: 0,
      bookingId: 102,
    },
  ];

  const mockMessages: Message[] = [
    {
      id: 1,
      senderId: 2,
      senderName: 'The Venue NYC',
      senderRole: 'venue',
      content: 'Hi! We received your rider. Can you confirm the technical requirements?',
      timestamp: '2 hours ago',
      isRead: true,
    },
    {
      id: 2,
      senderId: user?.id || 1,
      senderName: user?.name || 'You',
      senderRole: 'artist',
      content: 'Sure! We need a 40x25 stage with full PA system. See attached rider for details.',
      timestamp: '1 hour ago',
      isRead: true,
    },
    {
      id: 3,
      senderId: 2,
      senderName: 'The Venue NYC',
      senderRole: 'venue',
      content: 'Can you confirm the technical requirements?',
      timestamp: '30 minutes ago',
      isRead: false,
    },
  ];

  useEffect(() => {
    setConversations(mockConversations);
    if (mockConversations.length > 0) {
      setSelectedConversation(mockConversations[0]);
      setMessages(mockMessages);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    setLoading(true);
    try {
      const newMessage: Message = {
        id: messages.length + 1,
        senderId: user?.id || 1,
        senderName: user?.name || 'You',
        senderRole: user?.role || 'artist',
        content: messageText,
        timestamp: 'now',
        isRead: true,
      };

      setMessages([...messages, newMessage]);
      setMessageText('');
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card className="p-4 flex flex-col">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredConversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedConversation?.id === conv.id
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : 'border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{conv.participantName}</p>
                  <p className="text-xs text-gray-600 truncate">{conv.lastMessage}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <Badge className="bg-red-500 ml-2">{conv.unreadCount}</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{conv.lastMessageTime}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Messages View */}
      {selectedConversation ? (
        <div className="col-span-2 flex flex-col">
          {/* Header */}
          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedConversation.participantName}</h3>
                <p className="text-xs text-gray-600">
                  {selectedConversation.participantRole === 'venue' ? 'Venue' : 'Artist'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Video className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Messages */}
          <Card className="flex-1 p-4 mb-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.senderId === user?.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </Card>

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSendMessage();
                }
              }}
              rows={3}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !messageText.trim()}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Card className="col-span-2 flex items-center justify-center text-gray-500">
          <p>Select a conversation to start messaging</p>
        </Card>
      )}
    </div>
  );
}
