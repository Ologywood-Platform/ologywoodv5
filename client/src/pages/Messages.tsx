import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Send,
  Search,
  MoreVertical,
  MessageCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface Conversation {
  id: number;
  participantId: number;
  participantName: string;
  participantRole: string;
  participantPhoto?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  bookingId?: number;
  bookingTitle?: string;
}

export default function Messages() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    // Mock data for conversations
    const mockConversations: Conversation[] = [
      {
        id: 1,
        participantId: 2,
        participantName: "The Venue NYC",
        participantRole: "venue",
        participantPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=venue1",
        lastMessage: "Can you confirm the technical requirements?",
        lastMessageTime: "2 hours ago",
        unreadCount: 2,
        bookingId: 5,
        bookingTitle: "Jazz Night - March 15",
      },
      {
        id: 2,
        participantId: 3,
        participantName: "Jazz Club Downtown",
        participantRole: "venue",
        participantPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=venue2",
        lastMessage: "Perfect! See you on Saturday.",
        lastMessageTime: "1 day ago",
        unreadCount: 0,
        bookingId: 6,
        bookingTitle: "Evening Jazz Set - March 22",
      },
      {
        id: 3,
        participantId: 4,
        participantName: "Riverside Theater",
        participantRole: "venue",
        participantPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=venue3",
        lastMessage: "We're excited to have you perform!",
        lastMessageTime: "3 days ago",
        unreadCount: 0,
        bookingId: 7,
        bookingTitle: "Classical Concert - April 5",
      },
      {
        id: 4,
        participantId: 5,
        participantName: "Downtown Events Center",
        participantRole: "venue",
        participantPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=venue4",
        lastMessage: "Looking forward to working with you",
        lastMessageTime: "1 week ago",
        unreadCount: 0,
        bookingId: 8,
        bookingTitle: "Rock Night - April 12",
      },
      {
        id: 5,
        participantId: 6,
        participantName: "The Grand Ballroom",
        participantRole: "venue",
        participantPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=venue5",
        lastMessage: "Thank you for the amazing performance!",
        lastMessageTime: "2 weeks ago",
        unreadCount: 0,
        bookingId: 9,
        bookingTitle: "Gala Evening - March 8",
      },
    ];

    setConversations(mockConversations);
    setIsLoadingConversations(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    toast.success("Message sent!");
    setMessageText("");
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Mark as read
    setConversations(
      conversations.map((c) =>
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <a className="inline-flex">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </a>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
              <p className="text-slate-600">
                {totalUnread > 0 ? `${totalUnread} unread message${totalUnread !== 1 ? "s" : ""}` : "All caught up!"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-2">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                        selectedConversation?.id === conversation.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <img
                            src={conversation.participantPhoto}
                            alt={conversation.participantName}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="font-semibold text-sm text-slate-900">
                              {conversation.participantName}
                            </p>
                            <p className="text-xs text-slate-600">
                              {conversation.bookingTitle}
                            </p>
                          </div>
                        </div>
                        {conversation.unreadCount && conversation.unreadCount > 0 && (
                          <Badge className="bg-blue-500">{conversation.unreadCount}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {conversation.lastMessage}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {conversation.lastMessageTime}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-600">No conversations found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="h-full flex flex-col">
                <CardHeader className="border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedConversation.participantPhoto}
                        alt={selectedConversation.participantName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h2 className="font-semibold text-slate-900">
                          {selectedConversation.participantName}
                        </h2>
                        <p className="text-xs text-slate-600">
                          {selectedConversation.bookingTitle}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Mock messages */}
                  <div className="space-y-4">
                    <div className="flex justify-start">
                      <div className="bg-slate-100 rounded-lg p-3 max-w-xs">
                        <p className="text-sm text-slate-900">
                          Hi! I wanted to confirm the details for the upcoming event.
                        </p>
                        <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="bg-blue-500 text-white rounded-lg p-3 max-w-xs">
                        <p className="text-sm">
                          Sure! I'm all set. What time should I arrive?
                        </p>
                        <p className="text-xs text-blue-100 mt-1">1 hour ago</p>
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <div className="bg-slate-100 rounded-lg p-3 max-w-xs">
                        <p className="text-sm text-slate-900">
                          Please arrive 30 minutes before the event starts. Looking forward to it!
                        </p>
                        <p className="text-xs text-slate-500 mt-1">45 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <div className="border-t border-slate-200 p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Send
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-2">Select a conversation to start messaging</p>
                  <p className="text-sm text-slate-500">
                    Choose a conversation from the list to view and send messages
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
