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
import { useWebSocketMessaging } from "@/hooks/useWebSocketMessaging";

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

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: Date | string;
  read?: boolean;
}

export default function Messages() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  // Fetch bookings to build conversations
  const { data: bookings } = trpc.booking.getMyArtistBookings.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'artist',
  });

  const { data: venueBookings } = trpc.booking.getMyVenueBookings.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'venue',
  });

  // Fetch messages for selected booking
  const { data: selectedMessages, refetch: refetchMessages } = trpc.message.getForBooking.useQuery(
    { bookingId: selectedConversation?.bookingId || 0 },
    { enabled: !!selectedConversation?.bookingId }
  );

  // Fetch total unread count
  const { data: unreadData } = trpc.message.getTotalUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // WebSocket real-time messaging
  const { isConnected: wsConnected, typingUsers } = useWebSocketMessaging(user?.id);

  // Send message mutation
  const sendMessageMutation = trpc.message.send.useMutation({
    onSuccess: () => {
      toast.success("Message sent!");
      setMessageText("");
      refetchMessages();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  // Mark as read mutation
  const markAsReadMutation = trpc.message.markBookingAsRead.useMutation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);

  // Build conversations from bookings
  useEffect(() => {
    const buildConversations = async () => {
      const allBookings = bookings || venueBookings || [];
      const convos: Conversation[] = [];

      for (const booking of allBookings) {
        // For artists, participant is the venue
        // For venues, participant is the artist
        const isArtist = user?.role === 'artist';
        
        const conversation: Conversation = {
          id: booking.id,
          participantId: isArtist ? booking.venueId : booking.artistId,
          participantName: isArtist ? booking.venueName : 'Artist',
          participantRole: isArtist ? 'venue' : 'artist',
          bookingId: booking.id,
          bookingTitle: `${booking.eventDetails || 'Booking'} - ${new Date(booking.eventDate).toLocaleDateString()}`,
          unreadCount: 0,
        };
        convos.push(conversation);
      }

      setConversations(convos);
    };

    buildConversations();
  }, [bookings, venueBookings, user?.role]);



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
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.bookingTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation?.bookingId) return;

    sendMessageMutation.mutate({
      bookingId: selectedConversation.bookingId,
      receiverId: selectedConversation.participantId,
      messageText: messageText,
    });
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (conversation.bookingId) {
      markAsReadMutation.mutate({ bookingId: conversation.bookingId });
      refetchMessages();
    }
  };

  // Update messages when selectedMessages changes
  useEffect(() => {
    if (selectedMessages && selectedMessages.length > 0) {
      const formattedMessages = selectedMessages.map((msg: any) => ({
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderId === user?.id ? 'You' : 'Participant',
        content: msg.messageText,
        timestamp: msg.sentAt,
        read: msg.readAt !== null,
      }));
      setMessages(formattedMessages);
    } else {
      setMessages([]);
    }
  }, [selectedMessages, user?.id]);

  const totalUnread = unreadData?.count || 0;

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
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-slate-900">
                            {conversation.participantName}
                          </p>
                          <p className="text-xs text-slate-600">
                            {conversation.bookingTitle}
                          </p>
                        </div>
                        {conversation.unreadCount && conversation.unreadCount > 0 && (
                          <Badge className="bg-blue-500">{conversation.unreadCount}</Badge>
                        )}
                      </div>
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
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        {selectedConversation.participantName}
                      </h2>
                      <p className="text-xs text-slate-600">
                        {selectedConversation.bookingTitle}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length > 0 ? (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`rounded-lg p-3 max-w-xs ${
                            msg.senderId === user?.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.senderId === user?.id
                                ? 'text-blue-100'
                                : 'text-slate-500'
                            }`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-600">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  )}
                  {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <span>Participant is typing...</span>
                    </div>
                  )}
                </CardContent>

                <div className="border-t border-slate-200 p-4">
                  <div className="flex gap-2 mb-2">
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
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Send
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-slate-600">
                      {wsConnected ? 'Real-time messaging active' : 'Connecting...'}
                    </span>
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
