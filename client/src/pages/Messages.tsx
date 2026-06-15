import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ClearableInput } from "@/components/ui/clearable-input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Send,
  Search,
  MoreVertical,
  MessageCircle,
  ChevronLeft,
  FileText,
  X,
  ClipboardList,
  Download,
  Eye,
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

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  messageType?: string;
  metadata?: any;
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
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [showRiderPicker, setShowRiderPicker] = useState(false);
  const [viewingRider, setViewingRider] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef(0);
  const userIsScrollingRef = useRef(false);

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

  // Fetch rider templates (for artists)
  const { data: riderTemplates } = trpc.rider.getMyTemplates.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'artist',
  });

  // Send rider mutation
  const sendRiderMutation = trpc.message.sendRider.useMutation({
    onSuccess: () => {
      toast.success("Rider sent!");
      setShowRiderPicker(false);
      refetchMessages();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send rider");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated, loading]);

  // Build conversations from bookings
  useEffect(() => {
    const allBookings = bookings || venueBookings || [];
    const convos: Conversation[] = [];

    for (const booking of allBookings) {
      const isArtist = user?.role === 'artist';

      const conversation: Conversation = {
        id: booking.id,
        participantId: isArtist ? booking.venueId : booking.artistId,
        participantName: isArtist ? `Venue #${booking.venueId}` : 'Artist',
        participantRole: isArtist ? 'venue' : 'artist',
        bookingId: booking.id,
        bookingTitle: `Booking - ${new Date(booking.eventDate).toLocaleDateString()}`,
        unreadCount: 0,
      };
      convos.push(conversation);
    }

    setConversations(convos);
  }, [bookings, venueBookings, user?.role]);

  // Update messages when selectedMessages changes
  useEffect(() => {
    if (selectedMessages && selectedMessages.length > 0) {
      const formattedMessages = selectedMessages.map((msg: any) => ({
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderId === user?.id ? 'You' : 'Participant',
        content: msg.messageText || msg.content,
        messageType: msg.messageType || 'text',
        metadata: msg.metadata,
        timestamp: msg.sentAt || msg.createdAt,
        read: msg.readAt !== null,
      }));
      setMessages(formattedMessages);
    } else {
      setMessages([]);
    }
  }, [selectedMessages, user?.id]);

  // Scroll to bottom only when new messages arrive (not on every poll refetch)
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const newCount = messages.length;
    prevMessageCountRef.current = newCount;

    // Auto-scroll on initial load or when new messages arrive
    if (prevCount === 0 || newCount > prevCount) {
      // Only auto-scroll if user is near the bottom (not manually scrolled up)
      if (!userIsScrollingRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: prevCount === 0 ? 'instant' : 'smooth' });
      }
    }
  }, [messages]);

  // Polling for real-time message updates
  useEffect(() => {
    if (!selectedConversation?.bookingId) return;
    const pollInterval = setInterval(() => {
      refetchMessages();
    }, 2000);
    return () => clearInterval(pollInterval);
  }, [selectedConversation?.bookingId, refetchMessages]);

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

  const handleSendRider = (template: any) => {
    if (!selectedConversation?.bookingId) return;
    sendRiderMutation.mutate({
      bookingId: selectedConversation.bookingId,
      receiverId: selectedConversation.participantId,
      riderTemplateId: template.id,
      riderTemplateName: template.templateName,
      riderTemplateData: template.templateData || {},
    });
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMobileShowChat(true);
    // Reset scroll tracking for new conversation
    prevMessageCountRef.current = 0;
    userIsScrollingRef.current = false;
    if (conversation.bookingId) {
      markAsReadMutation.mutate({ bookingId: conversation.bookingId });
      refetchMessages();
    }
  };

  const handleBackToList = () => {
    setMobileShowChat(false);
  };

  const totalUnread = unreadData?.count || 0;

  // ─── Conversation List ───
  const ConversationList = () => (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 sm:p-4 border-b">
        <ClearableInput
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          leftIcon={<Search className="h-4 w-4" />}
          className="h-10"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => handleSelectConversation(conversation)}
              className={`w-full text-left p-3 sm:p-4 border-b transition-colors hover:bg-muted/50 ${
                selectedConversation?.id === conversation.id ? 'bg-primary/5' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    {conversation.participantName.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm truncate">
                      {conversation.participantName}
                    </h3>
                    {conversation.unreadCount && conversation.unreadCount > 0 && (
                      <Badge className="bg-primary text-[10px] h-5 min-w-5 px-1.5">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conversation.bookingTitle}
                  </p>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
             <p className="text-sm text-muted-foreground">No conversations found</p>
             <p className="text-xs text-muted-foreground mt-1">Messages appear here when you have an active booking or inquiry. Start by browsing artists or venues.</p>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Chat Panel ───
  const ChatPanel = () => (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-2 p-3 sm:p-4 border-b bg-background">
        {/* Back button - mobile only */}
        <button
          onClick={handleBackToList}
          className="sm:hidden p-1.5 -ml-1 rounded-lg hover:bg-muted transition-colors"
          aria-label="Back to conversations"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-primary">
            {selectedConversation?.participantName.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">
            {selectedConversation?.participantName}
          </h2>
          <p className="text-[11px] text-muted-foreground truncate">
            {selectedConversation?.bookingTitle}
          </p>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3"
        onScroll={(e) => {
          const el = e.currentTarget;
          const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
          // If user scrolled more than 150px from bottom, they're manually scrolling
          userIsScrollingRef.current = distanceFromBottom > 150;
        }}
      >
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isOwn = msg.senderId === user?.id;
            const isRider = msg.messageType === 'rider';

            if (isRider) {
              // Parse metadata if it's a string
              const parsedMetadata = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata;
              const riderData = parsedMetadata?.riderTemplateData || {};
              const formData = riderData.formData || riderData;
              const riderName = parsedMetadata?.riderTemplateName || 'Rider';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-[85%] sm:max-w-sm border ${
                      isOwn
                        ? 'bg-primary/5 border-primary/20 rounded-br-md'
                        : 'bg-muted/50 border-border rounded-bl-md'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ClipboardList className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-semibold truncate">{riderName}</span>
                    </div>
                    {/* Quick summary */}
                    <div className="text-xs text-muted-foreground space-y-1 mb-3">
                      {formData.stage_size_min && <p>Stage: {formData.stage_size_min}</p>}
                      {formData.sound_system && <p>Sound: {formData.sound_system}</p>}
                      {formData.green_room && <p>Green Room: {formData.green_room}</p>}
                      {formData.deposit_percentage && <p>Deposit: {formData.deposit_percentage}</p>}
                      {formData.performance_duration && <p>Performance: {formData.performance_duration} min</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setViewingRider(parsedMetadata)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Full Rider
                      </Button>
                    </div>
                    <p
                      className="text-[10px] mt-2 text-muted-foreground"
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-2xl px-3.5 py-2.5 max-w-[80%] sm:max-w-xs ${
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Rider Picker Overlay */}
      {showRiderPicker && (
        <div className="border-t bg-background p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Select a Rider Template</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowRiderPicker(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {riderTemplates && riderTemplates.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {riderTemplates.map((template: any) => (
                <button
                  key={template.id}
                  onClick={() => handleSendRider(template)}
                  className="w-full text-left p-2.5 rounded-lg border hover:bg-muted/50 transition-colors flex items-center gap-2"
                  disabled={sendRiderMutation.isPending}
                >
                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{template.templateName}</p>
                    <p className="text-xs text-muted-foreground">
                      {template.templateType || 'Custom'} template
                    </p>
                  </div>
                  <Send className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No rider templates yet. Create one in your Riders page first.
            </p>
          )}
        </div>
      )}

      {/* Message Input */}
      <div className="border-t p-3 sm:p-4 bg-background safe-area-bottom">
        <div className="flex gap-2 items-end">
          {/* Send Rider button - artists only */}
          {user?.role === 'artist' && (
            <Button
              variant={showRiderPicker ? 'secondary' : 'ghost'}
              size="icon"
              className="h-11 w-11 sm:h-10 sm:w-10 flex-shrink-0"
              onClick={() => setShowRiderPicker(!showRiderPicker)}
              title="Send Rider"
            >
              <ClipboardList className="h-4 w-4" />
            </Button>
          )}
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="h-11 sm:h-10 text-sm"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            size="icon"
            className="h-11 w-11 sm:h-10 sm:w-10 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // ─── Empty State ───
  const EmptyChat = () => (
    <div className="hidden sm:flex h-full items-center justify-center">
      <div className="text-center">
        <MessageCircle className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
        <p className="text-sm text-muted-foreground">
          Choose a conversation from the list to start messaging
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - visible on both mobile and desktop */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold">Messages</h1>
                <p className="text-[11px] sm:text-sm text-muted-foreground hidden sm:block">
                  Manage your conversations
                </p>
              </div>
            </div>
            {totalUnread > 0 && (
              <Badge variant="destructive" className="text-xs sm:text-sm px-2 sm:px-3">
                {totalUnread} Unread
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full">
        {/* Desktop: Two-column layout */}
        <div className="hidden sm:grid sm:grid-cols-3 h-[calc(100vh-80px)]">
          {/* Conversation List - always visible on desktop */}
          <div className="col-span-1 border-r overflow-hidden">
            <ConversationList />
          </div>

          {/* Chat Panel or Empty State - desktop */}
          <div className="col-span-2 overflow-hidden">
            {selectedConversation ? <ChatPanel /> : <EmptyChat />}
          </div>
        </div>

        {/* Mobile: Single-column with slide transition */}
        <div className="sm:hidden h-[calc(100vh-60px)] relative overflow-hidden">
          {/* Conversation List - slides out when chat is open */}
          <div
            className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
              mobileShowChat ? '-translate-x-full' : 'translate-x-0'
            }`}
          >
            <ConversationList />
          </div>

          {/* Chat Panel - slides in from right */}
          <div
            className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
              mobileShowChat ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {selectedConversation && <ChatPanel />}
          </div>
        </div>
      </div>

      {/* Rider Viewer Modal */}
      {viewingRider && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setViewingRider(null)}>
          <div className="bg-background rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{viewingRider.riderTemplateName || 'Rider'}</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingRider(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              {(() => {
                const rd = viewingRider.riderTemplateData || {};
                const fd = rd.formData || rd;
                return (
                  <>
                    {/* Technical Requirements */}
                    {(fd.stage_size_min || fd.sound_system || fd.lighting || fd.monitors || fd.microphones) && (
                      <div>
                        <h4 className="text-sm font-semibold text-primary mb-2">Technical Requirements</h4>
                        <div className="space-y-2 text-sm">
                          {fd.stage_size_min && <div><span className="font-medium">Stage Size:</span> {fd.stage_size_min}</div>}
                          {fd.stage_surface && <div><span className="font-medium">Stage Surface:</span> {fd.stage_surface}</div>}
                          {fd.sound_system && <div><span className="font-medium">Sound System:</span> {fd.sound_system}</div>}
                          {fd.monitors && <div><span className="font-medium">Monitors:</span> {fd.monitors}</div>}
                          {fd.microphones && <div><span className="font-medium">Microphones:</span> {fd.microphones}</div>}
                          {fd.di_boxes && <div><span className="font-medium">DI Boxes:</span> {fd.di_boxes}</div>}
                          {fd.lighting && <div><span className="font-medium">Lighting:</span> {fd.lighting}</div>}
                          {fd.power_outlets && <div><span className="font-medium">Power Outlets:</span> {fd.power_outlets}</div>}
                        </div>
                      </div>
                    )}
                    {/* Performance Details */}
                    {(fd.performance_duration || fd.soundcheck_duration || fd.load_in_time) && (
                      <div>
                        <h4 className="text-sm font-semibold text-primary mb-2">Performance Details</h4>
                        <div className="space-y-2 text-sm">
                          {fd.performance_duration && <div><span className="font-medium">Performance Duration:</span> {fd.performance_duration} min</div>}
                          {fd.num_sets && <div><span className="font-medium">Number of Sets:</span> {fd.num_sets}</div>}
                          {fd.set_break_duration && <div><span className="font-medium">Break Duration:</span> {fd.set_break_duration} min</div>}
                          {fd.soundcheck_duration && <div><span className="font-medium">Soundcheck:</span> {fd.soundcheck_duration} min</div>}
                          {fd.load_in_time && <div><span className="font-medium">Load-in Time:</span> {fd.load_in_time} hrs before</div>}
                        </div>
                      </div>
                    )}
                    {/* Hospitality Requirements */}
                    {(fd.green_room || fd.meals || fd.beverages || fd.parking) && (
                      <div>
                        <h4 className="text-sm font-semibold text-primary mb-2">Hospitality Requirements</h4>
                        <div className="space-y-2 text-sm">
                          {fd.green_room && <div><span className="font-medium">Green Room:</span> {fd.green_room}</div>}
                          {fd.meals && <div><span className="font-medium">Meals:</span> {fd.meals}</div>}
                          {fd.beverages && <div><span className="font-medium">Beverages:</span> {fd.beverages}</div>}
                          {fd.towels && <div><span className="font-medium">Towels:</span> Yes</div>}
                          {fd.wifi_required && <div><span className="font-medium">WiFi:</span> Required</div>}
                          {fd.parking && <div><span className="font-medium">Parking:</span> {fd.parking}</div>}
                        </div>
                      </div>
                    )}
                    {/* Financial Terms */}
                    {(fd.deposit_percentage || fd.payment_method || fd.cancellation_policy) && (
                      <div>
                        <h4 className="text-sm font-semibold text-primary mb-2">Financial Terms</h4>
                        <div className="space-y-2 text-sm">
                          {fd.deposit_percentage && <div><span className="font-medium">Deposit:</span> {fd.deposit_percentage}</div>}
                          {fd.deposit_due_date && <div><span className="font-medium">Deposit Due:</span> {fd.deposit_due_date}</div>}
                          {fd.balance_due_date && <div><span className="font-medium">Balance Due:</span> {fd.balance_due_date}</div>}
                          {fd.payment_method && <div><span className="font-medium">Payment Method:</span> {fd.payment_method}</div>}
                          {fd.cancellation_policy && <div><span className="font-medium">Cancellation Policy:</span> {fd.cancellation_policy}</div>}
                        </div>
                      </div>
                    )}
                    {/* Policies */}
                    {(fd.recording_policy || fd.merch_sales) && (
                      <div>
                        <h4 className="text-sm font-semibold text-primary mb-2">Policies</h4>
                        <div className="space-y-2 text-sm">
                          {fd.recording_policy && <div><span className="font-medium">Recording:</span> {fd.recording_policy}</div>}
                          {fd.merch_sales && <div><span className="font-medium">Merch Sales:</span> {fd.merch_sales}</div>}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
