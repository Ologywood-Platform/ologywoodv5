import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Users, DollarSign, Calendar, TrendingUp, Search, Filter, Music, AlertTriangle, RotateCcw, BookOpen, Plus, Pencil, Trash2, Eye, EyeOff, Archive, Upload, ImageIcon, X } from 'lucide-react';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'bookings' | 'payouts' | 'releases' | 'blog'>('overview');
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
            {(['overview', 'users', 'bookings', 'payouts', 'releases', 'blog'] as const).map((tab) => (
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
          {activeTab === 'blog' && <BlogTab />}
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
