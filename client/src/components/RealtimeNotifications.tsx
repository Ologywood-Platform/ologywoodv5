import { useState, useRef, useEffect } from 'react';
import { Bell, X, MessageSquare, CreditCard, CheckCircle2, FileText, Star } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useLocation } from 'wouter';

function timeAgo(date: string | Date): string {
  const now = new Date();
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

const typeConfig: Record<string, { icon: React.ReactNode; accent: string }> = {
  booking: {
    icon: <CheckCircle2 className="h-4 w-4 text-purple-500" />,
    accent: 'bg-purple-50 dark:bg-purple-900/20',
  },
  message: {
    icon: <MessageSquare className="h-4 w-4 text-blue-500" />,
    accent: 'bg-blue-50 dark:bg-blue-900/20',
  },
  payment: {
    icon: <CreditCard className="h-4 w-4 text-green-500" />,
    accent: 'bg-green-50 dark:bg-green-900/20',
  },
  contract: {
    icon: <FileText className="h-4 w-4 text-amber-500" />,
    accent: 'bg-amber-50 dark:bg-amber-900/20',
  },
  review: {
    icon: <Star className="h-4 w-4 text-yellow-500" />,
    accent: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
};

export default function RealtimeNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // Fetch unread count (polls every 30s)
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
    staleTime: 15000,
  });

  // Fetch full notification list only when dropdown is open
  const { data: listData, refetch: refetchList } = trpc.notifications.list.useQuery(
    { limit: 20, offset: 0 },
    { enabled: isOpen, staleTime: 10000 }
  );

  const utils = trpc.useUtils();

  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Refetch list when opening
  useEffect(() => {
    if (isOpen) refetchList();
  }, [isOpen, refetchList]);

  const notifications = listData?.items || [];

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) markReadMutation.mutate({ id: n.id });
    if (n.actionUrl) {
      setIsOpen(false);
      setLocation(n.actionUrl);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteMutation.mutate({ id });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[480px] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.length > 0 ? (
              notifications.map((n: any) => {
                const cfg = typeConfig[n.type] || typeConfig.booking;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      !n.isRead ? cfg.accent : ''
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, n.id)}
                      className="flex-shrink-0 p-1 text-gray-300 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 rounded"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center">
                <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">No notifications yet</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 5 && (
            <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2.5 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setLocation('/notifications');
                }}
                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
