import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, MessageCircle, ClipboardList, Eye, X } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface BookingMessagesProps {
  bookingId: number;
  currentUserId: number;
}

export default function BookingMessages({ bookingId, currentUserId }: BookingMessagesProps) {
  const [messageText, setMessageText] = useState('');
  const [viewingRider, setViewingRider] = useState<any>(null);
  
  const { data: booking } = trpc.booking.getById.useQuery({ id: bookingId });
  const { data: messages, isLoading, refetch } = trpc.message.getForBooking.useQuery({ bookingId });
  const markAsReadMutation = trpc.message.markBookingAsRead.useMutation();
  
  // Mark messages as read when component mounts or messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      markAsReadMutation.mutate({ bookingId });
    }
  }, [messages?.length, bookingId]);
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
    <>
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
              const isRider = message.messageType === 'rider';

              if (isRider) {
                // Parse metadata
                const parsedMetadata = typeof message.metadata === 'string'
                  ? JSON.parse(message.metadata)
                  : message.metadata;
                const riderData = parsedMetadata?.riderTemplateData || {};
                const formData = riderData.formData || riderData;
                const riderName = parsedMetadata?.riderTemplateName || 'Rider';

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl p-4 border ${
                        isOwnMessage
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-muted/50 border-border'
                      }`}
                    >
                      {/* Rider Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <ClipboardList className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-semibold">{riderName}</span>
                      </div>

                      {/* Quick Summary */}
                      <div className="text-xs text-muted-foreground space-y-1 mb-3">
                        {formData.stage_size_min && <p>Stage: {formData.stage_size_min}</p>}
                        {formData.sound_system && <p>Sound: {formData.sound_system}</p>}
                        {formData.green_room && <p>Green Room: {formData.green_room}</p>}
                        {formData.deposit_percentage && <p>Deposit: {formData.deposit_percentage}</p>}
                        {formData.performance_duration && <p>Performance: {formData.performance_duration} min</p>}
                      </div>

                      {/* View Full Rider Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setViewingRider(parsedMetadata)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Full Rider
                      </Button>

                      <p className="text-xs mt-2 text-muted-foreground">
                        {new Date(message.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              }

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
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleString('en-US', {
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
    </>
  );
}
