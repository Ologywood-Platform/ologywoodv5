import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface EventStatusBadgeProps {
  status: 'available' | 'booked' | 'completed' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function EventStatusBadge({
  status,
  size = 'md',
  showIcon = true,
}: EventStatusBadgeProps) {
  const statusConfig = {
    available: {
      label: 'Available',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
    },
    booked: {
      label: 'Booked',
      color: 'bg-blue-100 text-blue-800',
      icon: Clock,
    },
    completed: {
      label: 'Completed',
      color: 'bg-slate-100 text-slate-800',
      icon: CheckCircle,
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-800',
      icon: XCircle,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <Badge className={`${config.color} ${sizeClasses[size]} flex items-center gap-1 w-fit`}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
