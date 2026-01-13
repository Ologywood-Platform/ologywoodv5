import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MessageSquare } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

export default function VenueCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [, navigate] = useLocation();
  const [messageDialog, setMessageDialog] = useState<{ open: boolean; artistId?: number; artistName?: string; date?: string }>({ open: false });
  const [messageText, setMessageText] = useState('');
  
  // Calculate month range
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Fetch bookings for current month
  const { data: bookings } = trpc.calendar.getVenueBookings.useQuery({
    startDate: firstDayOfMonth.toISOString(),
    endDate: lastDayOfMonth.toISOString(),
  });
  
  // Fetch favorited artists' availability
  const { data: availability } = trpc.calendar.getFavoritedArtistsAvailability.useQuery({
    startDate: firstDayOfMonth.toISOString(),
    endDate: lastDayOfMonth.toISOString(),
  });
  
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Build calendar grid
  const daysInMonth = lastDayOfMonth.getDate();
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  
  // Get events for a specific day
  const getEventsForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    
    const dayBookings = bookings?.filter(b => {
      if (!b.eventDate) return false;
      const bookingDateStr = new Date(b.eventDate).toISOString().split('T')[0];
      return bookingDateStr === dateStr;
    }) || [];
    
    const dayAvailability = availability?.filter(a => {
      if (!a.date) return false;
      const availDateStr = new Date(a.date).toISOString().split('T')[0];
      return availDateStr === dateStr;
    }) || [];
    
    return { bookings: dayBookings, availability: dayAvailability };
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };
  
  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar View
            </CardTitle>
            <CardDescription>Your bookings and favorited artists' availability</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-semibold min-w-[200px] text-center">
              {monthName}
            </div>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
            <span>Artist Available</span>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-sm py-2 text-muted-foreground">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-[120px] bg-gray-50 rounded-lg"></div>;
            }
            
            const { bookings: dayBookings, availability: dayAvailability } = getEventsForDay(day);
            const isTodayDate = isToday(day);
            
            return (
              <div
                key={day}
                className={`min-h-[120px] border rounded-lg p-2 ${
                  isTodayDate ? 'border-primary border-2 bg-primary/5' : 'border-gray-200'
                }`}
              >
                <div className={`text-sm font-semibold mb-2 ${isTodayDate ? 'text-primary' : ''}`}>
                  {day}
                </div>
                
                <div className="space-y-1">
                  {/* Bookings */}
                  {dayBookings.map(booking => (
                    <div
                      key={booking.id}
                      onClick={() => navigate(`/booking/${booking.id}`)}
                      className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 border ${getStatusColor(booking.status)}`}
                    >
                      <div className="font-medium truncate">Booking #{booking.id}</div>
                      {booking.eventTime && (
                        <div className="text-[10px]">{booking.eventTime}</div>
                      )}
                    </div>
                  ))}
                  
                  {/* Artist availability */}
                  {dayAvailability.map((avail, idx) => (
                    <div
                      key={`avail-${idx}`}
                      className="text-xs p-1 rounded bg-purple-100 text-purple-800 border border-purple-300 group relative"
                    >
                      <div className="font-medium truncate">{avail.artistName}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-[10px]">Available</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toLocaleDateString();
                            setMessageDialog({ 
                              open: true, 
                              artistId: avail.artistId, 
                              artistName: avail.artistName,
                              date: dateStr
                            });
                            setMessageText(`Hi! I saw you're available on ${dateStr}. I'd like to discuss a potential booking.`);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MessageSquare className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
    
    {/* Message Dialog */}
    <MessageDialog
      open={messageDialog.open}
      artistId={messageDialog.artistId}
      artistName={messageDialog.artistName}
      date={messageDialog.date}
      messageText={messageText}
      setMessageText={setMessageText}
      onClose={() => {
        setMessageDialog({ open: false });
        setMessageText('');
      }}
    />
  </>);
}

// Separate component for message dialog
function MessageDialog({ 
  open, 
  artistId, 
  artistName, 
  date, 
  messageText, 
  setMessageText, 
  onClose 
}: { 
  open: boolean; 
  artistId?: number; 
  artistName?: string; 
  date?: string; 
  messageText: string; 
  setMessageText: (text: string) => void; 
  onClose: () => void; 
}) {
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  
  const sendMessage = trpc.message.sendQuickMessage.useMutation({
    onSuccess: (data) => {
      toast.success('Message sent successfully!');
      utils.message.invalidate();
      onClose();
      // Navigate to the booking conversation
      if (data.bookingId) {
        navigate(`/booking/${data.bookingId}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });
  
  const handleSend = () => {
    if (!artistId || !messageText.trim()) return;
    
    sendMessage.mutate({
      artistId,
      message: messageText,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message {artistName}</DialogTitle>
          <DialogDescription>
            Send a quick message about their availability on {date}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              rows={5}
              className="mt-2"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={!messageText.trim() || sendMessage.isPending}
            >
              {sendMessage.isPending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
