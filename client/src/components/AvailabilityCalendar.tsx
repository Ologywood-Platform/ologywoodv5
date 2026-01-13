import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type AvailabilityStatus = 'available' | 'booked' | 'unavailable';

interface DateAvailability {
  date: string; // YYYY-MM-DD format
  status: AvailabilityStatus;
}

interface AvailabilityCalendarProps {
  availability?: DateAvailability[];
  onDateClick?: (date: string, currentStatus?: AvailabilityStatus) => void;
  readOnly?: boolean;
}

export default function AvailabilityCalendar({ 
  availability = [], 
  onDateClick,
  readOnly = false 
}: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getMonthData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of week for first day (0 = Sunday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Total days in month
    const daysInMonth = lastDay.getDate();
    
    return { year, month, firstDayOfWeek, daysInMonth };
  };

  const { year, month, firstDayOfWeek, daysInMonth } = getMonthData(currentDate);
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const formatDate = (day: number) => {
    const d = new Date(year, month, day);
    return d.toISOString().split('T')[0];
  };

  const getDateStatus = (day: number): AvailabilityStatus | undefined => {
    const dateStr = formatDate(day);
    const avail = availability.find(a => a.date === dateStr);
    return avail?.status;
  };

  const getStatusColor = (status?: AvailabilityStatus) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300';
      case 'booked':
        return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300';
      case 'unavailable':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300';
      default:
        return 'bg-white hover:bg-gray-50 border-gray-200';
    }
  };

  const handleDateClick = (day: number) => {
    if (readOnly || !onDateClick) return;
    
    const dateStr = formatDate(day);
    const currentStatus = getDateStatus(day);
    onDateClick(dateStr, currentStatus);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isPast = (day: number) => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Generate calendar grid
  const calendarDays = [];
  
  // Empty cells before first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-16" />);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const status = getDateStatus(day);
    const past = isPast(day);
    const today = isToday(day);
    
    calendarDays.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        disabled={readOnly || past}
        className={cn(
          "h-16 border rounded-lg transition-colors relative",
          getStatusColor(status),
          past && "opacity-40 cursor-not-allowed",
          !readOnly && !past && "cursor-pointer",
          readOnly && "cursor-default",
          today && "ring-2 ring-primary"
        )}
      >
        <span className="text-sm font-medium">{day}</span>
        {status && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              status === 'available' && "bg-green-600",
              status === 'booked' && "bg-red-600",
              status === 'unavailable' && "bg-gray-600"
            )} />
          </div>
        )}
      </button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {monthNames[month]} {year}
            </CardTitle>
            {!readOnly && (
              <CardDescription>
                Click dates to mark availability
              </CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-600" />
            <span>Unavailable</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays}
        </div>
      </CardContent>
    </Card>
  );
}
