import { useState } from "react";
import { GripHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface DraggableCalendarEventProps {
  id: number;
  title: string;
  type: "booking" | "available" | "unavailable";
  status: string;
  date: string;
  onReschedule: (eventId: number, newDate: string) => void;
  isLoading?: boolean;
}

export default function DraggableCalendarEvent({
  id,
  title,
  type,
  status,
  date,
  onReschedule,
  isLoading = false,
}: DraggableCalendarEventProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("eventId", id.toString());
    e.dataTransfer.setData("eventDate", date);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "booking":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "available":
        return "bg-green-100 text-green-800 border-green-300";
      case "unavailable":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        flex items-center gap-2 p-2 rounded-lg border cursor-move transition-all
        ${getEventColor(type)}
        ${isDragging ? "opacity-50 scale-95" : "hover:shadow-md"}
        ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <GripHorizontal className="h-4 w-4 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs opacity-75">{date}</p>
      </div>
      <Badge variant="outline" className="flex-shrink-0">
        {status}
      </Badge>
    </div>
  );
}
