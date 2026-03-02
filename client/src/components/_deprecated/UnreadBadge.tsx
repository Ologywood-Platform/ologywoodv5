import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";

interface UnreadBadgeProps {
  bookingId: number;
}

export default function UnreadBadge({ bookingId }: UnreadBadgeProps) {
  const { data: unreadData } = trpc.message.getUnreadCount.useQuery(
    { bookingId },
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  if (!unreadData || unreadData.count === 0) {
    return null;
  }

  return (
    <Badge variant="destructive" className="ml-2">
      {unreadData.count} new {unreadData.count === 1 ? 'message' : 'messages'}
    </Badge>
  );
}
