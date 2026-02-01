import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  X,
  Send,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Search,
  Clock,
  CheckCheck,
  Check
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'file' | 'image';
  fileUrl?: string;
}

interface ChatConversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantRole: 'artist' | 'venue';
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  messages: ChatMessage[];
}

export function LiveChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mock data - replace with actual WebSocket connection
  useEffect(() => {
    const mockConversations: ChatConversation[] = [
      {
        id: '1',
        participantId: 'artist-1',
        participantName: 'Sarah Johnson',
        participantRole: 'artist',
        lastMessage: 'What time should I arrive for soundcheck?',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
        unreadCount: 2,
        isOnline: true,
        messages: [
          {
            id: 'm1',
            senderId: 'artist-1',
            senderName: 'Sarah Johnson',
            content: 'Hi! I\'m excited about the booking!',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            read: true,
            type: 'text'
          },
          {
            id: 'm2',
            senderId: user?.id.toString() || 'user',
            senderName: user?.name || 'You',
            content: 'Great! Looking forward to having you perform.',
            timestamp: new Date(Date.now() - 1000 * 60 * 25),
            read: true,
            type: 'text'
          },
          {
            id: 'm3',
            senderId: 'artist-1',
            senderName: 'Sarah Johnson',
            content: 'What time should I arrive for soundcheck?',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            read: false,
            type: 'text'
          }
        ]
      },
      {
        id: '2',
        participantId: 'venue-1',
        participantName: 'Downtown Jazz Club',
        participantRole: 'venue',
        lastMessage: 'We\'re all set for next weekend!',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 120),
        unreadCount: 0,
        isOnline: false,
        messages: [
          {
            id: 'm4',
            senderId: 'venue-1',
            senderName: 'Downtown Jazz Club',
            content: 'We\'re all set for next weekend!',
            timestamp: new Date(Date.now() - 1000 * 60 * 120),
            read: true,
            type: 'text'
          }
        ]
      }
    ];
    setConversations(mockConversations);
  }, [user]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages]);

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeConversation) return;

    const newMessage: ChatMessage = {
      id: `m${Date.now()}`,
      senderId: user?.id.toString() || 'user',
      senderName: user?.name || 'You',
      content: messageInput,
      timestamp: new Date(),
      read: false,
      type: 'text'
    };

    setConversations(convs =>
      convs.map(conv =>
        conv.id === activeConversation.id
          ? { ...conv, messages: [...conv.messages, newMessage] }
          : conv
      )
    );

    setActiveConversation(prev =>
      prev ? { ...prev, messages: [...prev.messages, newMessage] } : null
    );

    setMessageInput('');
    toast.success('Message sent');
  };

  const handleSelectConversation = (conv: ChatConversation) => {
    setActiveConversation(conv);
    setConversations(convs =>
      convs.map(c =>
        c.id === conv.id ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition relative"
        title="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-red-500">{unreadCount}</Badge>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-96 max-h-96 bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div>
          <h3 className="font-bold">Messages</h3>
          <p className="text-xs opacity-90">{conversations.length} conversations</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-blue-600"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      {!activeConversation ? (
        <div className="flex flex-col h-full">
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {filteredConversations.length > 0 ? (
                filteredConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className="w-full text-left p-3 hover:bg-gray-100 rounded-lg transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{conv.participantName}</p>
                          {conv.isOnline && (
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {conv.lastMessage}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(conv.lastMessageTime, { addSuffix: true })}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-blue-600 flex-shrink-0">{conv.unreadCount}</Badge>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Conversation Header */}
          <div className="border-b p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveConversation(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ←
              </button>
              <div>
                <p className="font-medium text-sm">{activeConversation.participantName}</p>
                <p className="text-xs text-muted-foreground">
                  {activeConversation.isOnline ? 'Active now' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 p-3">
            <div className="space-y-3">
              {activeConversation.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === user?.id.toString() ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      msg.senderId === user?.id.toString()
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-foreground'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <p className="text-xs opacity-70">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {msg.senderId === user?.id.toString() && (
                        msg.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-3 py-2 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-3 space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 h-9"
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Paperclip className="h-4 w-4 mr-1" />
                Attach
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
