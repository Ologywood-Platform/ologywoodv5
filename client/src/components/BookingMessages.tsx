import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BookingMessagesProps {
  bookingId: number;
  currentUserId: number;
}

export default function BookingMessages({ bookingId, currentUserId }: BookingMessagesProps) {
  const [messageText, setMessageText] = useState('');
  
  const { data: booking } = trpc.booking.getById.useQuery({ id: bookingId });
  const { data: messages, isLoading, refetch } = trpc.message.getForBooking.useQuery({ bookingId });
  const sendMutation = trpc.message.send.useMutation({
    onSuccess: () => {
      setMessageText('');
      refetch();
      toast.success('Message sent');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  const handleSend = () => {
    if (!messageText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!booking) {
      toast.error('Booking not found');
      return;
    }

    // Determine receiver: if current user is artist, send to venue; otherwise send to artist
    const receiverId = booking.artistId === currentUserId ? booking.venueId : booking.artistId;

    sendMutation.mutate({
      bookingId,
      receiverId,
      messageText: messageText.trim(),
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageCircle className="h-5 w-5" />
          <span>Loading messages...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Messages</h3>
      </div>

      {/* Message List */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {messages && messages.length > 0 ? (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isOwnMessage
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.messageText}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {new Date(message.sentAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Type your message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 min-h-[80px]"
        />
        <Button
          onClick={handleSend}
          disabled={sendMutation.isPending || !messageText.trim()}
          className="self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </Card>
  );
}
