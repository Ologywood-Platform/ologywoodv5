import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Search, MoreVertical } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: Date | string;
  read?: boolean;
}

interface Conversation {
  id: number;
  participantId: number;
  participantName: string;
  participantRole: string;
  participantPhoto?: string;
  lastMessage?: string;
  lastMessageTime?: Date | string;
  unreadCount?: number;
  status?: string;
}

export default function MessagesDetail() {
  const { user, isAuthenticated } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const conversationId = id ? parseInt(id, 10) : 0;

  // Mock data for demonstration
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    
    // Simulate loading conversation data
    setTimeout(() => {
      setConversation({
        id: conversationId,
        participantId: 2,
        participantName: "Sarah Johnson",
        participantRole: "artist",
        participantPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        lastMessage: "Looking forward to the event!",
        lastMessageTime: new Date(),
        unreadCount: 0,
        status: "active",
      });

      setMessages([
        {
          id: 1,
          senderId: 1,
          senderName: "You",
          senderRole: "venue",
          content: "Hi Sarah, I wanted to confirm the details for the upcoming event on March 15th.",
          timestamp: new Date(Date.now() - 3600000),
          read: true,
        },
        {
          id: 2,
          senderId: 2,
          senderName: "Sarah Johnson",
          senderRole: "artist",
          content: "Hi! Yes, I'm all set for March 15th. What time should I arrive?",
          timestamp: new Date(Date.now() - 3000000),
          read: true,
        },
        {
          id: 3,
          senderId: 1,
          senderName: "You",
          senderRole: "venue",
          content: "Please arrive by 6:00 PM for sound check. The event starts at 7:00 PM.",
          timestamp: new Date(Date.now() - 2400000),
          read: true,
        },
        {
          id: 4,
          senderId: 2,
          senderName: "Sarah Johnson",
          senderRole: "artist",
          content: "Perfect! I'll be there at 5:45 PM. Looking forward to the event!",
          timestamp: new Date(Date.now() - 1800000),
          read: true,
        },
      ]);

      setIsLoading(false);
    }, 500);
  }, [isAuthenticated, user, conversationId]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    const newMessage: Message = {
      id: messages.length + 1,
      senderId: user.id,
      senderName: "You",
      senderRole: user.role,
      content: messageText,
      timestamp: new Date(),
      read: true,
    };

    setMessages([...messages, newMessage]);
    setMessageText("");
    toast.success("Message sent");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (time: Date | string) => {
    const date = typeof time === "string" ? new Date(time) : time;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading conversation...</p>
        </Card>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Conversation not found</p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <img
                  src={conversation.participantPhoto}
                  alt={conversation.participantName}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {conversation.participantName}
                  </h1>
                  <p className="text-sm text-gray-600 capitalize">
                    {conversation.participantRole}
                  </p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === user.id
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-900 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.senderId === user.id ? "text-blue-100" : "text-gray-600"
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conversation Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Conversation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Participant</p>
                <p className="font-semibold text-gray-900">{conversation.participantName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <Badge className="capitalize">{conversation.participantRole}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className="bg-green-100 text-green-800 capitalize">
                  {conversation.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Messages</p>
                <p className="font-semibold text-gray-900">{messages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/dashboard">
            <Button variant="outline" className="w-full">
              Back to Dashboard
            </Button>
          </Link>
          <Button variant="outline" className="w-full">
            View Booking Details
          </Button>
        </div>
      </div>
    </div>
  );
}
