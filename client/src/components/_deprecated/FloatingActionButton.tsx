import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Heart,
  Music,
  X
} from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

interface FABAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  href: string;
  color: string;
}

export function FloatingActionButton() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isArtist = user?.role === 'artist';

  const actions: FABAction[] = isArtist ? [
    {
      id: 'availability',
      icon: <Calendar className="h-5 w-5" />,
      label: 'Set Availability',
      href: '/availability',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'riders',
      icon: <FileText className="h-5 w-5" />,
      label: 'Manage Riders',
      href: '/saved-riders',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'messages',
      icon: <MessageSquare className="h-5 w-5" />,
      label: 'Messages',
      href: '/messages',
      color: 'bg-green-500 hover:bg-green-600'
    },
  ] : [
    {
      id: 'browse',
      icon: <Music className="h-5 w-5" />,
      label: 'Browse Artists',
      href: '/browse',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'booking',
      icon: <Plus className="h-5 w-5" />,
      label: 'New Booking',
      href: '/bookings',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'messages',
      icon: <MessageSquare className="h-5 w-5" />,
      label: 'Messages',
      href: '/messages',
      color: 'bg-green-500 hover:bg-green-600'
    },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-40">
      {/* Action Buttons */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {actions.map((action) => (
            <Link key={action.id} href={action.href}>
              <Button
                onClick={() => setIsOpen(false)}
                className={`${action.color} text-white rounded-full h-12 w-12 p-0 shadow-lg flex items-center justify-center`}
                title={action.label}
              >
                {action.icon}
              </Button>
            </Link>
          ))}
        </div>
      )}

      {/* Main FAB Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-full h-14 w-14 p-0 shadow-lg transition-all ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600 rotate-45' 
            : 'bg-primary hover:bg-primary/90'
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>

      {/* Labels on Hover */}
      {isOpen && (
        <div className="absolute bottom-20 right-16 flex flex-col gap-3 pointer-events-none">
          {actions.map((action) => (
            <div
              key={`label-${action.id}`}
              className="text-sm font-medium text-muted-foreground bg-white px-3 py-1 rounded shadow whitespace-nowrap"
            >
              {action.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
