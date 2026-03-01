import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Users, DollarSign, Calendar, TrendingUp, Search, Filter, Music, AlertTriangle, RotateCcw } from 'lucide-react';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'bookings' | 'payouts' | 'releases'>('overview');
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

  const analytics = analyticsQuery.data;
  const health = systemHealthQuery.data;
  const financial = financialQuery.data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform management and analytics</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* System Status */}
        {health && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">System Status</p>
                <p className="text-xs text-green-700 mt-1">
                  {health.status} • {health.uptime} uptime • Database: {health.database}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Last checked: {new Date(health.lastChecked).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        <div className="bg-white border-b border-gray-200 mb-6">
          <div className="flex gap-8">
            {(['overview', 'users', 'bookings', 'payouts', 'releases'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200">
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
    <div className="p-6 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-xs text-gray-500 mt-2">{subtext}</p>
        </div>
        <div className="text-gray-400">{icon}</div>
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
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Summary</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{analytics?.totalUsers || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Bookings This Month</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{analytics?.totalBookings || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">${financial?.totalPaid.toFixed(2) || '0'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Pending Payouts</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">${financial?.pendingPayouts.toFixed(2) || '0'}</p>
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
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500">No users found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{user.email}</td>
                  <td className="py-3 px-4 text-gray-600">{user.name || '—'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
