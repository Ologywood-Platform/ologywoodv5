import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, MessageCircle, Paperclip, X, CheckCircle2 } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface BookingMessagesProps {
  bookingId: number;
  currentUserId: number;
}

interface MessageWithAttachment {
  id: number;
  senderId: number;
  content: string;
  createdAt: string;
  attachmentUrl?: string;
  attachmentType?: 'contract' | 'rider' | 'document' | 'image';
  attachmentName?: string;
  isRead?: boolean;
}

export default function BookingMessagesEnhanced({ bookingId, currentUserId }: BookingMessagesProps) {
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'contract' | 'rider' | 'document' | 'image'>('document');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: booking } = trpc.booking.getById.useQuery({ id: bookingId });
  const { data: messages, isLoading, refetch } = trpc.message.getForBooking.useQuery({ bookingId });
  const markAsReadMutation = trpc.message.markBookingAsRead.useMutation();
  
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      toast.success(`File selected: ${file.name}`);
    }
  };

  const handleSend = () => {
    if (!messageText.trim() && !selectedFile) {
      toast.error('Please enter a message or select a file');
      return;
    }

    if (!booking) {
      toast.error('Booking not found');
      return;
    }

    const receiverId = booking.artistId === currentUserId ? booking.venueId : booking.artistId;

    sendMutation.mutate({
      bookingId,
      receiverId,
      messageText: messageText.trim(),
      attachmentType: selectedFile ? fileType : undefined,
      attachmentName: selectedFile ? selectedFile.name : undefined,
    });

    if (selectedFile) {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
        <h3 className="font-semibold text-lg">Messages & File Sharing</h3>
      </div>

      {/* Message List */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {messages && messages.length > 0 ? (
          messages.map((message: any) => {
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
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* File Attachment Display */}
                  {message.attachmentUrl && (
                    <div className="mt-2 p-2 bg-white/10 rounded flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      <a
                        href={message.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline hover:opacity-80"
                      >
                        {message.attachmentName || `${message.attachmentType || 'file'}`}
                      </a>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 mt-1">
                    {message.isRead && <CheckCircle2 className="h-3 w-3" />}
                    <p
                      className={`text-xs ${
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

      {/* File Type Selector */}
      {selectedFile && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            <span className="text-sm font-medium">{selectedFile.name}</span>
          </div>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value as any)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="contract">Contract</option>
            <option value="rider">Rider</option>
            <option value="document">Document</option>
            <option value="image">Image</option>
          </select>
          <button
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
        <div className="flex flex-col gap-2 self-end">
          <Button
            onClick={handleSend}
            disabled={sendMutation.isPending || (!messageText.trim() && !selectedFile)}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Press Enter to send, Shift+Enter for new line • Attach files up to 10MB
      </p>
    </Card>
  );
}
