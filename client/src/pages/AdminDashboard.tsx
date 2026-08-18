import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Users, DollarSign, Calendar, TrendingUp, Search, Filter, Music, AlertTriangle, RotateCcw, BookOpen, Plus, Pencil, Trash2, Eye, EyeOff, Archive, Upload, ImageIcon, X, MessageSquareOff, Shield, CheckCircle, XCircle, Clock, FileText, ChevronDown, ChevronUp, ClipboardList, Video, Crown, Flag } from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect bloggers to their dedicated dashboard
  if (user?.role === 'blogger') {
    navigate('/blogger-dashboard', { replace: true });
    return null;
  }
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'bookings' | 'payouts' | 'releases' | 'blog' | 'feedback' | 'disputes' | 'audit_log' | 'activity' | 'videos'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch analytics
  const analyticsQuery = trpc.admin.getAnalytics.useQuery();
  const systemHealthQuery = trpc.admin.getSystemHealth.useQuery();
  const financialQuery = trpc.admin.getFinancialOverview.useQuery();

  // Fetch data for different tabs
  const usersQuery = trpc.admin.getUsers.useQuery({ search: searchQuery, limit: 50 });
  const bookingsQuery = trpc.admin.getBookings.useQuery({ limit: 50 });
  const payoutsQuery = trpc.admin.getPayouts.useQuery({ limit: 50 });
  const releasesQuery = trpc.admin.getReleases.useQuery({ limit: 50 });
  const feedbackQuery = trpc.admin.getUnsubscribeFeedback.useQuery();
  const disputesQuery = trpc.dispute.adminGetAll.useQuery();
  const [auditSearch, setAuditSearch] = useState('');
  const auditLogQuery = trpc.admin.getAuditLog.useQuery({ search: auditSearch, limit: 50, offset: 0 });
  const [activityCategory, setActivityCategory] = useState<'all' | 'users' | 'bookings' | 'payouts' | 'blog' | 'disputes' | 'releases' | 'settings'>('all');
  const [activitySearch, setActivitySearch] = useState('');
  const [activityPage, setActivityPage] = useState(1);
  const activityLogQuery = trpc.admin.getActivityLog.useQuery({ page: activityPage, limit: 30, category: activityCategory, search: activitySearch });
  const activityStatsQuery = trpc.admin.getActivityStats.useQuery();
  const flaggedVideosQuery = trpc.admin.getFlaggedVideos.useQuery();
  const flaggedVideoCountQuery = trpc.admin.getFlaggedVideoCount.useQuery();

  const analytics = analyticsQuery.data;
  const health = systemHealthQuery.data;
  const financial = financialQuery.data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Platform management and analytics</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Music className="h-4 w-4" />
              Back to Artist
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-8">
        {/* System Status */}
        {health && (
          <div className="mb-4 sm:mb-8 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-900">System Status</p>
                <p className="text-[10px] sm:text-xs text-green-700 mt-0.5 sm:mt-1">
                  {health.status} • {health.uptime} uptime • Database: {health.database}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] sm:text-xs text-gray-500">Last checked: {new Date(health.lastChecked).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <MetricCard
              icon={<Users className="w-6 h-6" />}
              label="Total Users"
              value={analytics.totalUsers}
              subtext={`${analytics.artistCount} artists, ${analytics.venueCount} venues`}
            />
            <MetricCard
              icon={<Calendar className="w-6 h-6" />}
              label="Total Bookings"
              value={analytics.totalBookings}
              subtext={`${analytics.completedBookings} completed (${analytics.completionRate}%)`}
            />
            <MetricCard
              icon={<DollarSign className="w-6 h-6" />}
              label="Total Paid Out"
              value={`$${analytics.totalPaid.toFixed(2)}`}
              subtext={`Avg: $${analytics.averageBookingValue}/booking`}
            />
            <MetricCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="Financial"
              value={financial ? `$${financial.totalPaid.toFixed(2)}` : '$0'}
              subtext={financial ? `Pending: $${financial.pendingPayouts.toFixed(2)}` : 'Loading...'}
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 mb-4 sm:mb-6 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
          <div className="flex gap-2 sm:gap-4 md:gap-8 overflow-x-auto scrollbar-hide pb-px">
            {(['overview', 'users', 'bookings', 'payouts', 'releases', 'blog', 'feedback', 'disputes', 'videos', 'audit_log', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 sm:px-4 py-3 sm:py-4 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-1">
                  {tab === 'disputes' && <Shield className="w-4 h-4" />}
                  {tab === 'videos' && <Video className="w-4 h-4" />}
                  {tab === 'audit_log' && <ClipboardList className="w-4 h-4" />}
                  {tab === 'activity' && <FileText className="w-4 h-4" />}
                  {tab === 'audit_log' ? 'Audit Log' : tab === 'activity' ? 'Activity' : tab === 'videos' ? 'Videos' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'disputes' && disputesQuery.data && disputesQuery.data.filter((d: any) => d.status === 'open' || d.status === 'under_review').length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {disputesQuery.data.filter((d: any) => d.status === 'open' || d.status === 'under_review').length}
                    </span>
                  )}
                  {tab === 'videos' && (flaggedVideoCountQuery.data ?? 0) > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {flaggedVideoCountQuery.data}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {activeTab === 'overview' && <OverviewTab analytics={analytics} financial={financial} />}
          {activeTab === 'users' && (
            <UsersTab
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              users={usersQuery.data?.users || []}
              isLoading={usersQuery.isLoading}
            />
          )}
          {activeTab === 'bookings' && (
            <BookingsTab bookings={bookingsQuery.data?.bookings || []} isLoading={bookingsQuery.isLoading} />
          )}
          {activeTab === 'payouts' && (
            <PayoutsTab payouts={payoutsQuery.data?.payouts || []} isLoading={payoutsQuery.isLoading} />
          )}
          {activeTab === 'releases' && (
            <ReleasesTab releases={releasesQuery.data || []} isLoading={releasesQuery.isLoading} refetch={releasesQuery.refetch} />
          )}
          {activeTab === 'blog' && (
            <div className="p-8 text-center">
              <BookOpen className="w-10 h-10 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Blog Management</h3>
              <p className="text-sm text-gray-500 mb-4">Create, edit, and manage all blog posts from the dedicated blog admin panel.</p>
              <a
                href="/admin/blog"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <BookOpen className="w-4 h-4" /> Open Blog Admin
              </a>
            </div>
          )}
          {activeTab === 'feedback' && (
            <FeedbackTab
              feedback={feedbackQuery.data?.feedback || []}
              stats={feedbackQuery.data?.stats || []}
              totalCount={feedbackQuery.data?.totalCount || 0}
              isLoading={feedbackQuery.isLoading}
            />
          )}
          {activeTab === 'disputes' && (
            <DisputesTab
              disputes={disputesQuery.data || []}
              isLoading={disputesQuery.isLoading}
              refetch={disputesQuery.refetch}
            />
          )}
          {activeTab === 'audit_log' && (
            <AuditLogTab
              entries={auditLogQuery.data?.entries || []}
              total={auditLogQuery.data?.total || 0}
              isLoading={auditLogQuery.isLoading}
              search={auditSearch}
              setSearch={setAuditSearch}
            />
          )}
          {activeTab === 'videos' && (
            <VideoModerationTab
              videos={flaggedVideosQuery.data || []}
              isLoading={flaggedVideosQuery.isLoading}
              refetch={() => { flaggedVideosQuery.refetch(); flaggedVideoCountQuery.refetch(); }}
            />
          )}
          {activeTab === 'activity' && (
            <ActivityTab
              entries={activityLogQuery.data?.entries || []}
              total={activityLogQuery.data?.total || 0}
              totalPages={activityLogQuery.data?.totalPages || 1}
              page={activityPage}
              setPage={setActivityPage}
              category={activityCategory}
              setCategory={setActivityCategory}
              search={activitySearch}
              setSearch={setActivitySearch}
              stats={activityStatsQuery.data}
              isLoading={activityLogQuery.isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext: string;
}) {
  return (
    <div className="p-3 sm:p-6 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{label}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">{value}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 truncate">{subtext}</p>
        </div>
        <div className="text-gray-400 hidden sm:block">{icon}</div>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({
  analytics,
  financial,
}: {
  analytics: any;
  financial: any;
}) {
  return (
    <div className="p-3 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Platform Summary</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-gray-50 rounded">
            <p className="text-xs sm:text-sm text-gray-600">Active Users</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{analytics?.totalUsers || 0}</p>
          </div>
          <div className="p-3 sm:p-4 bg-gray-50 rounded">
            <p className="text-xs sm:text-sm text-gray-600">Bookings This Month</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{analytics?.totalBookings || 0}</p>
          </div>
          <div className="p-3 sm:p-4 bg-gray-50 rounded">
            <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">${financial?.totalPaid.toFixed(2) || '0'}</p>
          </div>
          <div className="p-3 sm:p-4 bg-gray-50 rounded">
            <p className="text-xs sm:text-sm text-gray-600">Pending Payouts</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">${financial?.pendingPayouts.toFixed(2) || '0'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Users Tab
function UsersTab({
  searchQuery,
  setSearchQuery,
  users,
  isLoading,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  users: any[];
  isLoading: boolean;
}) {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [confirmAction, setConfirmAction] = useState<{ user: any; newRole: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const utils = trpc.useUtils();

  // Check if current user is the owner (for display purposes)
  const isOwnerQuery = trpc.admin.isOwner.useQuery();
  const isOwner = isOwnerQuery.data?.isOwner || false;

  // Get current admins
  const adminsQuery = trpc.admin.getAdmins.useQuery();

  // Change role mutation (new unified endpoint)
  const changeRoleMutation = trpc.admin.changeRole.useMutation({
    onSuccess: (data) => {
      utils.admin.getUsers.invalidate();
      utils.admin.getAdmins.invalidate();
      utils.admin.getAnalytics.invalidate();
      if (data.changed) {
        const roleLabels: Record<string, string> = { admin: 'Admin', artist: 'Artist', venue: 'Venue', user: 'User' };
        setSuccessMessage(`Role changed from ${roleLabels[data.previousRole] || data.previousRole} to ${roleLabels[data.newRole] || data.newRole}. Email notification sent.`);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
      setConfirmAction(null);
    },
    onError: (error) => {
      setSuccessMessage(null);
      alert(error.message);
      setConfirmAction(null);
    },
  });

  // Filter users by role
  const filteredUsers = roleFilter === 'all' ? users : users.filter((u: any) => u.role === roleFilter);

  // Check if a user is the owner
  const ownerUserId = adminsQuery.data?.owner?.id;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'blogger': return 'bg-pink-100 text-pink-700';
      case 'artist': return 'bg-blue-100 text-blue-700';
      case 'venue': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const roleOptions = [
    { value: 'admin', label: 'Admin', color: 'text-purple-700' },
    { value: 'blogger', label: 'Blogger', color: 'text-pink-700' },
    { value: 'artist', label: 'Artist', color: 'text-blue-700' },
    { value: 'venue', label: 'Venue', color: 'text-green-700' },
    { value: 'user', label: 'User', color: 'text-gray-700' },
  ];

  const roleDescriptions: Record<string, string> = {
    admin: 'Full admin access: user management, booking oversight, blog management, and financial data.',
    blogger: 'Blog management access: create, edit, publish, and manage blog posts on Ologywood.',
    artist: 'Artist access: create profile, manage bookings, set availability, upload releases, connect with venues.',
    venue: 'Venue access: create profile, browse artists, send booking requests, manage events.',
    user: 'Standard access: browse artists, follow favorites, book artists for events, purchase music.',
  };

  return (
    <div className="p-3 sm:p-6">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-2 text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Summary */}
      {adminsQuery.data && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-purple-900">Admin Team</h4>
          </div>
          <div className="flex flex-wrap gap-3">
            {adminsQuery.data.owner && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-purple-200">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span className="text-sm text-gray-700">{adminsQuery.data.owner.name || adminsQuery.data.owner.email}</span>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">Owner</span>
              </div>
            )}
            {adminsQuery.data.admins.map((admin: any) => (
              admin.id !== ownerUserId && (
                <div key={admin.id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-purple-200">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span className="text-sm text-gray-700">{admin.name || admin.email}</span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Admin</span>
                </div>
              )
            ))}
            {adminsQuery.data.admins.filter((a: any) => a.id !== ownerUserId).length === 0 && (
              <p className="text-sm text-purple-600">No other admins yet. Use the Change Role dropdown below to add team members.</p>
            )}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="artist">Artists</option>
          <option value="venue">Venues</option>
          <option value="blogger">Bloggers</option>
          <option value="user">Users</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading users...</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-gray-500">No users found</p>
      ) : (
        <>
          <div className="overflow-x-auto -mx-3 sm:-mx-6 px-3 sm:px-6">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Joined</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Change Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: any) => {
                  const isUserOwner = user.id === ownerUserId;
                  return (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">
                        <div className="flex items-center gap-2">
                          {user.email}
                          {isUserOwner && (
                            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Owner</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user.name || '\u2014'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${isUserOwner ? 'bg-yellow-100 text-yellow-700' : getRoleBadgeColor(user.role)}`}>
                          {isUserOwner ? 'Owner' : user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.emailVerified ? (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">Verified</span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">Pending Verification</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        {isUserOwner ? (
                          <span className="text-xs text-gray-400 italic">Protected</span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) => {
                              const newRole = e.target.value;
                              if (newRole !== user.role) {
                                setConfirmAction({ user, newRole });
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg bg-white hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
                          >
                            {roleOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Confirmation Dialog */}
          {confirmAction && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Change User Role</h3>
                    <p className="text-sm text-gray-500">{confirmAction.user.name || confirmAction.user.email}</p>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Current Role</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(confirmAction.user.role)}`}>
                      {confirmAction.user.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-center my-2">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">New Role</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(confirmAction.newRole)}`}>
                      {confirmAction.newRole}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  {roleDescriptions[confirmAction.newRole] || 'Role access will be updated.'}
                </p>

                <p className="text-xs text-gray-400 mb-6">
                  An email notification will be sent to {confirmAction.user.email} about this change.
                </p>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      changeRoleMutation.mutate({
                        userId: confirmAction.user.id,
                        newRole: confirmAction.newRole as 'admin' | 'artist' | 'venue' | 'user' | 'blogger',
                      });
                    }}
                    disabled={changeRoleMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {changeRoleMutation.isPending ? 'Changing...' : 'Confirm Change'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Bookings Tab
function BookingsTab({ bookings, isLoading }: { bookings: any[]; isLoading: boolean }) {
  return (
    <div className="p-6">
      {isLoading ? (
        <p className="text-gray-500">Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p className="text-gray-500">No bookings found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Booking ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">#{booking.id}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{new Date(booking.eventDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-gray-600">{new Date(booking.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Releases Tab (Admin Moderation)
function ReleasesTab({ releases, isLoading, refetch }: { releases: any[]; isLoading: boolean; refetch: () => void }) {
  const [takedownReason, setTakedownReason] = useState('');
  const [selectedRelease, setSelectedRelease] = useState<number | null>(null);
  const takedownMutation = trpc.admin.takedownRelease.useMutation({
    onSuccess: () => { refetch(); setSelectedRelease(null); setTakedownReason(''); },
  });
  const restoreMutation = trpc.admin.restoreRelease.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Music className="w-5 h-5" /> White Label Releases
        </h3>
        <span className="text-sm text-gray-500">{releases.length} total</span>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading releases...</p>
      ) : releases.length === 0 ? (
        <p className="text-gray-500">No releases found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Genre</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Price</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Sales</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Revenue</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {releases.map((release: any) => (
                <tr key={release.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">#{release.id}</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">{release.title}</td>
                  <td className="py-3 px-4 text-gray-600">{release.genre || '—'}</td>
                  <td className="py-3 px-4 text-gray-900">${(release.priceInCents / 100).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      release.status === 'published' ? 'bg-green-100 text-green-700' :
                      release.status === 'taken_down' ? 'bg-red-100 text-red-700' :
                      release.status === 'archived' ? 'bg-gray-100 text-gray-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {release.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{release.totalSales}</td>
                  <td className="py-3 px-4 text-gray-900">${(release.totalRevenueCents / 100).toFixed(2)}</td>
                  <td className="py-3 px-4 text-gray-600">{new Date(release.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    {release.status === 'published' && (
                      <button
                        onClick={() => setSelectedRelease(release.id)}
                        className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100"
                      >
                        <AlertTriangle className="w-3 h-3" /> Takedown
                      </button>
                    )}
                    {release.status === 'taken_down' && (
                      <button
                        onClick={() => restoreMutation.mutate({ releaseId: release.id })}
                        disabled={restoreMutation.isPending}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100"
                      >
                        <RotateCcw className="w-3 h-3" /> Restore
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Takedown Modal */}
      {selectedRelease && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">DMCA Takedown</h4>
            <p className="text-sm text-gray-600 mb-4">This will immediately remove the release from public view.</p>
            <textarea
              value={takedownReason}
              onChange={(e) => setTakedownReason(e.target.value)}
              placeholder="Reason for takedown (min 10 characters)..."
              className="w-full p-3 border border-gray-300 rounded-lg text-sm mb-4"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setSelectedRelease(null); setTakedownReason(''); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => takedownMutation.mutate({ releaseId: selectedRelease, reason: takedownReason })}
                disabled={takedownReason.length < 10 || takedownMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {takedownMutation.isPending ? 'Processing...' : 'Confirm Takedown'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Blog Tab
function BlogTab() {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editId, setEditId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'draft' | 'published' | 'archived' | undefined>(undefined);

  const postsQuery = trpc.blog.adminList.useQuery({ limit: 50, status: statusFilter });
  const editPostQuery = trpc.blog.adminGetById.useQuery({ id: editId! }, { enabled: !!editId });
  const createMutation = trpc.blog.create.useMutation({ onSuccess: () => { postsQuery.refetch(); setView('list'); } });
  const updateMutation = trpc.blog.update.useMutation({ onSuccess: () => { postsQuery.refetch(); setView('list'); setEditId(null); } });
  const setStatusMutation = trpc.blog.setStatus.useMutation({ onSuccess: () => postsQuery.refetch() });
  const deleteMutation = trpc.blog.delete.useMutation({ onSuccess: () => postsQuery.refetch() });

  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', content: '', coverImageUrl: '',
    category: 'announcement' as 'announcement' | 'guide' | 'news' | 'update' | 'tutorial',
    tags: '',
    status: 'draft' as 'draft' | 'published',
  });
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const uploadCoverMutation = trpc.blog.uploadCoverImage.useMutation({
    onSuccess: (data) => {
      setForm(prev => ({ ...prev, coverImageUrl: data.url }));
      setIsUploadingCover(false);
    },
    onError: () => setIsUploadingCover(false),
  });

  const handleCoverImageSelect = async (file: File, postId?: number) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setCoverPreview(base64);

      // If editing an existing post, upload immediately
      if (postId) {
        setIsUploadingCover(true);
        uploadCoverMutation.mutate({
          postId,
          fileData: base64,
          fileName: file.name,
          mimeType: file.type,
        });
      } else {
        // For new posts, store base64 in form for upload after creation
        setForm(prev => ({ ...prev, coverImageUrl: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const removeCoverImage = () => {
    setCoverPreview(null);
    setForm(prev => ({ ...prev, coverImageUrl: '' }));
  };

  const resetForm = () => { setForm({ title: '', slug: '', excerpt: '', content: '', coverImageUrl: '', category: 'announcement', tags: '', status: 'draft' }); setCoverPreview(null); };

  const handleCreate = () => {
    createMutation.mutate({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      coverImageUrl: form.coverImageUrl || undefined,
    });
  };

  const handleUpdate = () => {
    if (!editId) return;
    updateMutation.mutate({
      id: editId,
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      coverImageUrl: form.coverImageUrl || undefined,
    });
  };

  const startEdit = (post: any) => {
    setEditId(post.id);
    setCoverPreview(null);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.coverImageUrl || '',
      category: post.category,
      tags: (post.tags || []).join(', '),
      status: post.status === 'published' ? 'published' : 'draft',
    });
    setView('edit');
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  if (view === 'create' || view === 'edit') {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {view === 'create' ? 'New Blog Post' : 'Edit Blog Post'}
          </h3>
          <button onClick={() => { setView('list'); setEditId(null); resetForm(); }} className="text-sm text-gray-600 hover:text-gray-900">
            Cancel
          </button>
        </div>
        <div className="space-y-4 max-w-3xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text" value={form.title}
              onChange={(e) => { setForm({ ...form, title: e.target.value, slug: view === 'create' ? generateSlug(e.target.value) : form.slug }); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Post title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text" value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="url-friendly-slug"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="announcement">Announcement</option>
                <option value="guide">Guide</option>
                <option value="news">News</option>
                <option value="update">Update</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text" value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="music, release, feature"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
            {(coverPreview || form.coverImageUrl) ? (
              <div className="relative">
                <img
                  src={coverPreview || form.coverImageUrl}
                  alt="Cover preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  {isUploadingCover && (
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Uploading...</span>
                  )}
                  <button
                    type="button"
                    onClick={removeCoverImage}
                    className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    title="Remove cover image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <label className="mt-2 flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                  <Upload className="w-4 h-4" /> Replace image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverImageSelect(file, editId || undefined);
                    }}
                  />
                </label>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleCoverImageSelect(file, editId || undefined);
                }}
              >
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Click or drag an image to upload</span>
                <span className="text-xs text-gray-400 mt-1">JPEG, PNG, or WebP (max 5MB)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverImageSelect(file, editId || undefined);
                  }}
                />
              </label>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={2}
              placeholder="Short summary shown on the blog listing page"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown)</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              rows={16}
              placeholder="Write your blog post in Markdown..."
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="status" checked={form.status === 'draft'} onChange={() => setForm({ ...form, status: 'draft' })} />
              Save as Draft
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="status" checked={form.status === 'published'} onChange={() => setForm({ ...form, status: 'published' })} />
              Publish Now
            </label>
          </div>
          <button
            onClick={view === 'create' ? handleCreate : handleUpdate}
            disabled={!form.title || !form.slug || !form.excerpt || !form.content || createMutation.isPending || updateMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : view === 'create' ? 'Create Post' : 'Update Post'}
          </button>
        </div>
      </div>
    );
  }

  const posts = postsQuery.data?.posts || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Blog Posts
        </h3>
        <button
          onClick={() => { resetForm(); setView('create'); }}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        {[undefined, 'draft', 'published', 'archived'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s as any)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {postsQuery.isLoading ? (
        <p className="text-gray-500">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-500">No blog posts found. Create your first post!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Published</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post: any) => (
                <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900 font-medium max-w-xs truncate">{post.title}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {post.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      post.status === 'published' ? 'bg-green-100 text-green-700' :
                      post.status === 'archived' ? 'bg-gray-100 text-gray-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(post)} className="p-1 text-gray-500 hover:text-blue-600" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {post.status === 'draft' && (
                        <button
                          onClick={() => setStatusMutation.mutate({ id: post.id, status: 'published' })}
                          className="p-1 text-gray-500 hover:text-green-600" title="Publish"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {post.status === 'published' && (
                        <button
                          onClick={() => setStatusMutation.mutate({ id: post.id, status: 'draft' })}
                          className="p-1 text-gray-500 hover:text-yellow-600" title="Unpublish"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      )}
                      {post.status !== 'archived' && (
                        <button
                          onClick={() => setStatusMutation.mutate({ id: post.id, status: 'archived' })}
                          className="p-1 text-gray-500 hover:text-gray-800" title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => { if (confirm('Delete this post permanently?')) deleteMutation.mutate({ id: post.id }); }}
                        className="p-1 text-gray-500 hover:text-red-600" title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Feedback Tab
const REASON_LABELS: Record<string, string> = {
  too_many_emails: 'Too many emails',
  not_relevant: 'Content not relevant',
  no_longer_using: 'No longer using platform',
  found_alternative: 'Found an alternative',
  privacy_concerns: 'Privacy concerns',
  other: 'Other',
};

const REASON_COLORS: Record<string, string> = {
  too_many_emails: 'bg-red-100 text-red-700',
  not_relevant: 'bg-orange-100 text-orange-700',
  no_longer_using: 'bg-gray-100 text-gray-700',
  found_alternative: 'bg-blue-100 text-blue-700',
  privacy_concerns: 'bg-purple-100 text-purple-700',
  other: 'bg-yellow-100 text-yellow-700',
};

function FeedbackTab({
  feedback,
  stats,
  totalCount,
  isLoading,
}: {
  feedback: any[];
  stats: { reason: string; count: number }[];
  totalCount: number;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="p-6 text-gray-500">Loading feedback data...</div>;
  }

  if (totalCount === 0) {
    return (
      <div className="p-6 text-center">
        <MessageSquareOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No unsubscribe feedback yet</p>
        <p className="text-gray-400 text-sm mt-1">Feedback will appear here when users unsubscribe from emails.</p>
      </div>
    );
  }

  const maxCount = stats.length > 0 ? stats[0].count : 1;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquareOff className="w-5 h-5" /> Unsubscribe Feedback
        </h3>
        <span className="text-sm text-gray-500">{totalCount} total response{totalCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Reason breakdown */}
      <div className="mb-8">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Top Reasons for Unsubscribing</h4>
        <div className="space-y-3">
          {stats.map((stat) => {
            const pct = Math.round((stat.count / totalCount) * 100);
            return (
              <div key={stat.reason} className="flex items-center gap-4">
                <div className="w-40 text-sm text-gray-700 truncate">
                  {REASON_LABELS[stat.reason] || stat.reason}
                </div>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${(stat.count / maxCount) * 100}%` }}
                  />
                </div>
                <div className="w-20 text-right text-sm">
                  <span className="font-medium text-gray-900">{stat.count}</span>
                  <span className="text-gray-400 ml-1">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent feedback table */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">Recent Feedback</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Reason</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Comment</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map((item: any) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-gray-900">{item.email || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${REASON_COLORS[item.reason] || 'bg-gray-100 text-gray-700'}`}>
                      {REASON_LABELS[item.reason] || item.reason}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{item.comment || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Payouts Tab
function PayoutsTab({ payouts, isLoading }: { payouts: any[]; isLoading: boolean }) {
  return (
    <div className="p-6">
      {isLoading ? (
        <p className="text-gray-500">Loading payouts...</p>
      ) : payouts.length === 0 ? (
        <p className="text-gray-500">No payouts found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Payout ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">#{payout.id}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">${payout.amount.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        payout.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : payout.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {payout.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{new Date(payout.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// Dispute type/status labels and colors
const DISPUTE_TYPE_LABELS: Record<string, string> = {
  payment_issue: 'Payment Issue',
  no_show: 'No Show',
  contract_violation: 'Contract Violation',
  quality_issue: 'Quality Issue',
  cancellation_dispute: 'Cancellation Dispute',
  harassment: 'Harassment',
  other: 'Other',
};

const DISPUTE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'Open', color: 'bg-red-100 text-red-700', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3.5 h-3.5" /> },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  dismissed: { label: 'Dismissed', color: 'bg-gray-100 text-gray-600', icon: <XCircle className="w-3.5 h-3.5" /> },
};

function DisputesTab({
  disputes,
  isLoading,
  refetch,
}: {
  disputes: any[];
  isLoading: boolean;
  refetch: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [resolveForm, setResolveForm] = useState<{
    id: number;
    status: 'under_review' | 'resolved' | 'dismissed';
    resolution: string;
    adminNotes: string;
  } | null>(null);

  const resolveMutation = trpc.dispute.adminResolve.useMutation({
    onSuccess: () => {
      setResolveForm(null);
      setExpandedId(null);
      refetch();
    },
  });

  const filtered = statusFilter === 'all'
    ? disputes
    : disputes.filter((d) => d.status === statusFilter);

  // Stats
  const openCount = disputes.filter((d) => d.status === 'open').length;
  const reviewCount = disputes.filter((d) => d.status === 'under_review').length;
  const resolvedCount = disputes.filter((d) => d.status === 'resolved').length;
  const dismissedCount = disputes.filter((d) => d.status === 'dismissed').length;

  if (isLoading) {
    return <div className="p-6 text-gray-500">Loading disputes...</div>;
  }

  if (disputes.length === 0) {
    return (
      <div className="p-6 text-center">
        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No disputes filed yet</p>
        <p className="text-gray-400 text-sm mt-1">Disputes will appear here when users report issues with bookings.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5" /> Dispute Management
        </h3>
        <span className="text-sm text-gray-500">{disputes.length} total dispute{disputes.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => setStatusFilter('open')}
          className={`p-3 rounded-lg border text-left transition-colors ${statusFilter === 'open' ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-red-700">
            <AlertTriangle className="w-4 h-4" /> Open
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{openCount}</p>
        </button>
        <button
          onClick={() => setStatusFilter('under_review')}
          className={`p-3 rounded-lg border text-left transition-colors ${statusFilter === 'under_review' ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'}`}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-yellow-700">
            <Clock className="w-4 h-4" /> Under Review
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{reviewCount}</p>
        </button>
        <button
          onClick={() => setStatusFilter('resolved')}
          className={`p-3 rounded-lg border text-left transition-colors ${statusFilter === 'resolved' ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-green-700">
            <CheckCircle className="w-4 h-4" /> Resolved
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{resolvedCount}</p>
        </button>
        <button
          onClick={() => setStatusFilter(statusFilter === 'dismissed' ? 'all' : 'dismissed')}
          className={`p-3 rounded-lg border text-left transition-colors ${statusFilter === 'dismissed' ? 'border-gray-300 bg-gray-50' : 'border-gray-200 hover:bg-gray-50'}`}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <XCircle className="w-4 h-4" /> Dismissed
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{dismissedCount}</p>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <span className="text-sm text-gray-500">
          Showing {filtered.length} of {disputes.length}
        </span>
      </div>

      {/* Disputes list */}
      <div className="space-y-3">
        {filtered.map((dispute) => {
          const statusConfig = DISPUTE_STATUS_CONFIG[dispute.status] || DISPUTE_STATUS_CONFIG.open;
          const isExpanded = expandedId === dispute.id;
          const isResolving = resolveForm?.id === dispute.id;

          return (
            <div key={dispute.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Dispute row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : dispute.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${statusConfig.color}`}>
                    {statusConfig.icon} {statusConfig.label}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      #{dispute.id} — {DISPUTE_TYPE_LABELS[dispute.type] || dispute.type}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Booking #{dispute.bookingId} • Reported by {dispute.reporterName} ({dispute.reporterEmail})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left: Dispute details */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Dispute Details</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>{' '}
                          <span className="font-medium">{DISPUTE_TYPE_LABELS[dispute.type] || dispute.type}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Reporter:</span>{' '}
                          <span className="font-medium">{dispute.reporterName}</span>
                          <span className="text-gray-400 ml-1">({dispute.reporterEmail})</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Respondent:</span>{' '}
                          <span className="font-medium">{dispute.respondentName}</span>
                          <span className="text-gray-400 ml-1">({dispute.respondentEmail})</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Filed:</span>{' '}
                          <span className="font-medium">{new Date(dispute.createdAt).toLocaleString()}</span>
                        </div>
                        {dispute.resolvedAt && (
                          <div>
                            <span className="text-gray-500">Resolved:</span>{' '}
                            <span className="font-medium">{new Date(dispute.resolvedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">Description</h4>
                      <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                        {dispute.description}
                      </p>

                      {dispute.evidenceUrls && dispute.evidenceUrls.length > 0 && (
                        <>
                          <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">Evidence ({dispute.evidenceUrls.length})</h4>
                          <div className="flex gap-2 flex-wrap">
                            {dispute.evidenceUrls.map((url: string, i: number) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-blue-600 hover:bg-blue-50"
                              >
                                <FileText className="w-3 h-3" /> Evidence {i + 1}
                              </a>
                            ))}
                          </div>
                        </>
                      )}

                      {dispute.resolution && (
                        <>
                          <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">Resolution</h4>
                          <p className="text-sm text-gray-700 bg-green-50 p-3 rounded border border-green-200">
                            {dispute.resolution}
                          </p>
                        </>
                      )}

                      {dispute.adminNotes && (
                        <>
                          <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">Admin Notes</h4>
                          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded border border-blue-200">
                            {dispute.adminNotes}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Right: Booking context + Actions */}
                    <div>
                      {dispute.booking && (
                        <>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Booking Context</h4>
                          <div className="bg-white p-3 rounded border border-gray-200 space-y-2 text-sm">
                            <div>
                              <span className="text-gray-500">Booking ID:</span>{' '}
                              <span className="font-medium">#{dispute.booking.id}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Event Date:</span>{' '}
                              <span className="font-medium">
                                {dispute.booking.eventDate
                                  ? new Date(dispute.booking.eventDate).toLocaleDateString()
                                  : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Total Fee:</span>{' '}
                              <span className="font-medium">
                                ${dispute.booking.totalFee ? Number(dispute.booking.totalFee).toFixed(2) : '0.00'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Booking Status:</span>{' '}
                              <span className="font-medium capitalize">{dispute.booking.status}</span>
                            </div>
                            {dispute.booking.eventDetails && (
                              <div>
                                <span className="text-gray-500">Event:</span>{' '}
                                <span className="font-medium">{dispute.booking.eventDetails}</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Admin Actions */}
                      {(dispute.status === 'open' || dispute.status === 'under_review') && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Admin Actions</h4>

                          {!isResolving ? (
                            <div className="flex gap-2">
                              {dispute.status === 'open' && (
                                <button
                                  onClick={() =>
                                    setResolveForm({
                                      id: dispute.id,
                                      status: 'under_review',
                                      resolution: '',
                                      adminNotes: '',
                                    })
                                  }
                                  className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600"
                                >
                                  <Clock className="w-4 h-4" /> Start Review
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  setResolveForm({
                                    id: dispute.id,
                                    status: 'resolved',
                                    resolution: '',
                                    adminNotes: '',
                                  })
                                }
                                className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4" /> Resolve
                              </button>
                              <button
                                onClick={() =>
                                  setResolveForm({
                                    id: dispute.id,
                                    status: 'dismissed',
                                    resolution: '',
                                    adminNotes: '',
                                  })
                                }
                                className="flex items-center gap-1.5 px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600"
                              >
                                <XCircle className="w-4 h-4" /> Dismiss
                              </button>
                            </div>
                          ) : resolveForm && (
                            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                {resolveForm.status === 'under_review' && (
                                  <><Clock className="w-4 h-4 text-yellow-600" /> Mark as Under Review</>
                                )}
                                {resolveForm.status === 'resolved' && (
                                  <><CheckCircle className="w-4 h-4 text-green-600" /> Resolve Dispute</>
                                )}
                                {resolveForm.status === 'dismissed' && (
                                  <><XCircle className="w-4 h-4 text-gray-600" /> Dismiss Dispute</>
                                )}
                              </div>

                              {(resolveForm.status === 'resolved' || resolveForm.status === 'dismissed') && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Resolution {resolveForm.status === 'resolved' ? '(required)' : '(optional)'}
                                  </label>
                                  <textarea
                                    value={resolveForm.resolution}
                                    onChange={(e) =>
                                      setResolveForm({ ...resolveForm, resolution: e.target.value })
                                    }
                                    placeholder="Describe the resolution or reason for dismissal..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                  />
                                </div>
                              )}

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Admin Notes (internal, not visible to users)
                                </label>
                                <textarea
                                  value={resolveForm.adminNotes}
                                  onChange={(e) =>
                                    setResolveForm({ ...resolveForm, adminNotes: e.target.value })
                                  }
                                  placeholder="Internal notes about this dispute..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  rows={2}
                                />
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    resolveMutation.mutate({
                                      id: resolveForm.id,
                                      status: resolveForm.status,
                                      resolution: resolveForm.resolution || undefined,
                                      adminNotes: resolveForm.adminNotes || undefined,
                                    });
                                  }}
                                  disabled={
                                    resolveMutation.isPending ||
                                    (resolveForm.status === 'resolved' && !resolveForm.resolution.trim())
                                  }
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {resolveMutation.isPending ? 'Saving...' : 'Confirm'}
                                </button>
                                <button
                                  onClick={() => setResolveForm(null)}
                                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                                >
                                  Cancel
                                </button>
                              </div>

                              {resolveMutation.isError && (
                                <p className="text-sm text-red-600">
                                  Error: {resolveMutation.error?.message || 'Failed to update dispute'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── Audit Log Tab ───────────────────────────────────────────────────────────
function AuditLogTab({
  entries,
  total,
  isLoading,
  search,
  setSearch,
}: {
  entries: any[];
  total: number;
  isLoading: boolean;
  search: string;
  setSearch: (s: string) => void;
}) {
  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      owner: 'bg-yellow-100 text-yellow-800',
      artist: 'bg-blue-100 text-blue-800',
      venue: 'bg-green-100 text-green-800',
      user: 'bg-gray-100 text-gray-800',
      blogger: 'bg-pink-100 text-pink-800',
      fan: 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Role Change Audit Log
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {total} total {total === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-72"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading audit log...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No audit log entries</h3>
          <p className="text-sm text-gray-500">
            {search ? 'No entries match your search.' : 'Role changes will be recorded here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">User Changed</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Previous Role</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4"></th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">New Role</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Changed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry: any) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(entry.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.targetName || '—'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.targetEmail || '—'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getRoleBadge(entry.previousRole)}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-center">
                    →
                  </td>
                  <td className="py-3 px-4">
                    {getRoleBadge(entry.newRole)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.changedByName || '—'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.changedByEmail || '—'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// Activity Tab Component - tracks all admin actions
function ActivityTab({
  entries,
  total,
  totalPages,
  page,
  setPage,
  category,
  setCategory,
  search,
  setSearch,
  stats,
  isLoading,
}: {
  entries: any[];
  total: number;
  totalPages: number;
  page: number;
  setPage: (p: number) => void;
  category: string;
  setCategory: (c: any) => void;
  search: string;
  setSearch: (s: string) => void;
  stats: any;
  isLoading: boolean;
}) {
  const actionLabels: Record<string, string> = {
    role_change: 'Role Change',
    booking_update: 'Booking Update',
    booking_cancel: 'Booking Cancelled',
    payout_processed: 'Payout Processed',
    payout_rejected: 'Payout Rejected',
    blog_published: 'Blog Published',
    blog_deleted: 'Blog Deleted',
    blog_updated: 'Blog Updated',
    user_suspended: 'User Suspended',
    user_unsuspended: 'User Unsuspended',
    dispute_resolved: 'Dispute Resolved',
    dispute_escalated: 'Dispute Escalated',
    release_takedown: 'Release Takedown',
    release_restored: 'Release Restored',
    settings_updated: 'Settings Updated',
  };

  const categoryColors: Record<string, string> = {
    users: 'bg-blue-100 text-blue-800',
    bookings: 'bg-green-100 text-green-800',
    payouts: 'bg-yellow-100 text-yellow-800',
    blog: 'bg-purple-100 text-purple-800',
    disputes: 'bg-red-100 text-red-800',
    releases: 'bg-indigo-100 text-indigo-800',
    settings: 'bg-gray-100 text-gray-800',
  };

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'users', label: 'Users' },
    { value: 'bookings', label: 'Bookings' },
    { value: 'payouts', label: 'Payouts' },
    { value: 'blog', label: 'Blog' },
    { value: 'disputes', label: 'Disputes' },
    { value: 'releases', label: 'Releases' },
    { value: 'settings', label: 'Settings' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalActions}</p>
                <p className="text-sm text-gray-500">Total Actions</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.todayActions}</p>
                <p className="text-sm text-gray-500">Today's Actions</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.byCategory?.length || 0}</p>
                <p className="text-sm text-gray-500">Active Categories</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by admin, action, or target..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Activity Log Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading activity log...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">No activity recorded yet</p>
          <p className="text-sm mt-1">Admin actions will appear here as they occur.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Admin</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Target</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry: any) => {
                  let parsedDetails: any = null;
                  try {
                    if (entry.details) parsedDetails = JSON.parse(entry.details);
                  } catch {}

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-gray-900">{entry.adminName || '—'}</div>
                        <div className="text-xs text-gray-500">{entry.adminEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-900">
                          {actionLabels[entry.action] || entry.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[entry.category] || 'bg-gray-100 text-gray-800'}`}>
                          {entry.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">{entry.targetLabel || '—'}</div>
                        {entry.targetType && (
                          <div className="text-xs text-gray-500">{entry.targetType} #{entry.targetId}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                        {parsedDetails ? (
                          <span title={entry.details}>
                            {Object.entries(parsedDetails).map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </span>
                        ) : (
                          entry.details || '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((page - 1) * 30) + 1}–{Math.min(page * 30, total)} of {total} entries
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


// Video Moderation Tab (Community Flagging)
function VideoModerationTab({
  videos,
  isLoading,
  refetch,
}: {
  videos: any[];
  isLoading: boolean;
  refetch: () => void;
}) {
  const [expandedVideo, setExpandedVideo] = useState<number | null>(null);

  const dismissMutation = trpc.admin.dismissVideoFlags.useMutation({
    onSuccess: () => {
      refetch();
      setExpandedVideo(null);
    },
  });

  const takeDownMutation = trpc.admin.takeDownVideo.useMutation({
    onSuccess: () => {
      refetch();
      setExpandedVideo(null);
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading flagged videos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Flag className="w-5 h-5 text-red-500" />
          Flagged Videos
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Videos reported by the community. Videos with 3+ flags are auto-hidden until reviewed.
        </p>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-500">No flagged videos — all clear!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video: any) => (
            <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Music className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{video.artistName || 'Unknown Artist'}</p>
                    <p className="text-xs text-gray-500">
                      Profile #{video.id}
                      {video.performanceVideoUploadedAt && ` — Uploaded ${new Date(video.performanceVideoUploadedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    video.performanceVideoStatus === 'flagged' ? 'bg-red-100 text-red-800' :
                    video.performanceVideoStatus === 'taken_down' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    <Flag className="w-3 h-3" />
                    {video.performanceVideoFlagCount} flag{video.performanceVideoFlagCount !== 1 ? 's' : ''}
                    {video.performanceVideoStatus === 'flagged' && ' (auto-hidden)'}
                    {video.performanceVideoStatus === 'taken_down' && ' (taken down)'}
                  </span>
                  <button
                    onClick={() => setExpandedVideo(expandedVideo === video.id ? null : video.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedVideo === video.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {expandedVideo === video.id && (
                <div className="p-4 space-y-4">
                  {/* Video Player */}
                  {video.performanceVideoUrl && (
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-w-2xl mx-auto">
                      <video
                        src={video.performanceVideoUrl}
                        controls
                        preload="metadata"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Flag details */}
                  {video.flags && video.flags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Reports:</p>
                      {video.flags.map((flag: any, idx: number) => (
                        <div key={idx} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-red-800 capitalize">{flag.reason}</span>
                            <span className="text-xs text-gray-500">{new Date(flag.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Reported by: {flag.flaggedByEmail}</p>
                          {flag.details && <p className="text-xs text-gray-600 mt-1">{flag.details}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Admin actions */}
                  {video.performanceVideoStatus !== 'taken_down' && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => dismissMutation.mutate({ artistProfileId: video.id })}
                        disabled={dismissMutation.isPending}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Dismiss Flags & Restore
                      </button>
                      <button
                        onClick={() => takeDownMutation.mutate({ artistProfileId: video.id })}
                        disabled={takeDownMutation.isPending}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Take Down Video
                      </button>
                    </div>
                  )}

                  {video.performanceVideoStatus === 'taken_down' && (
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <p className="text-sm text-gray-600">This video has been taken down.</p>
                      <button
                        onClick={() => dismissMutation.mutate({ artistProfileId: video.id })}
                        disabled={dismissMutation.isPending}
                        className="mt-2 flex items-center gap-2 px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Restore Video
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
