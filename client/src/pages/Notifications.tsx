import { useState } from 'react';
import { Bell, X, MessageSquare, CreditCard, CheckCircle2, FileText, Star, Trash2, CheckCheck, ShoppingBag } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useLocation } from 'wouter';
import SiteHeader from '@/components/SiteHeader';

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

const typeConfig: Record<string, { icon: React.ReactNode; accent: string; label: string }> = {
  booking: {
    icon: <CheckCircle2 className="h-5 w-5 text-purple-500" />,
    accent: 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-l-purple-400',
    label: 'Booking',
  },
  message: {
    icon: <MessageSquare className="h-5 w-5 text-blue-500" />,
    accent: 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-400',
    label: 'Message',
  },
  payment: {
    icon: <CreditCard className="h-5 w-5 text-green-500" />,
    accent: 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-400',
    label: 'Payment',
  },
  contract: {
    icon: <FileText className="h-5 w-5 text-amber-500" />,
    accent: 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-l-amber-400',
    label: 'Contract',
  },
  review: {
    icon: <Star className="h-5 w-5 text-yellow-500" />,
    accent: 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-400',
    label: 'Review',
  },
};

const merchOrderConfig = {
  icon: <ShoppingBag className="h-5 w-5 text-emerald-600" />,
  accent: 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-l-emerald-500',
  label: 'Merch Order',
};

export default function Notifications() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const { data: listData, isLoading } = trpc.notifications.list.useQuery(
    { limit, offset },
    { staleTime: 10000 }
  );

  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery(undefined, {
    staleTime: 15000,
  });

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

  const notifications = listData?.items || [];
  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n: any) => !n.isRead)
    : notifications;

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) markReadMutation.mutate({ id: n.id });
    if (n.actionUrl) {
      setLocation(n.actionUrl);
    }
  };

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                filter === 'unread'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-2">
              {filteredNotifications.map((n: any) => {
                const cfg = n.title?.startsWith('New merch order')
                  ? merchOrderConfig
                  : typeConfig[n.type] || typeConfig.booking;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer transition hover:shadow-md ${
                      !n.isRead
                        ? cfg.accent
                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markReadMutation.mutate({ id: n.id });
                          }}
                          className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded transition"
                          title="Mark as read"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate({ id: n.id });
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {filter === 'unread'
                  ? 'You\'re all caught up!'
                  : 'Notifications about bookings, messages, and payments will appear here.'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {notifications.length >= limit && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setOffset(offset + limit)}
                className="px-6 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
