import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { trpc } from '../lib/trpc';
import GroupedErrorAnalytics from '../components/GroupedErrorAnalytics';
import { useToastContext } from '../components/ErrorToast';
import { AdminRoute } from '../components/ProtectedRoute';

/**
 * Admin Analytics Dashboard Page
 * Displays deduplicated error groups with intelligent pattern matching
 */
const AdminAnalyticsContent: React.FC = () => {
  const navigate = useNavigate();
  const { addError } = useToastContext();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [groupedErrors, setGroupedErrors] = useState<any[]>([]);
  const [groupStats, setGroupStats] = useState<any>(null);

  // Fetch grouped errors
  const { data: groupedErrorsData, isLoading: groupsLoading } =
    trpc.analytics.getGroupedErrors.useQuery({
      limit: 100,
    });

  const { data: statsData } = trpc.analytics.getGroupStatistics.useQuery();

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(false);
        // In a real app, you would check the user's role from the context or API
        // For now, we'll assume admin access is granted if the page is accessible
        setIsAdmin(true);
      } catch (error) {
        addError(
          'Access Denied',
          'You do not have permission to access this page',
          {
            label: 'Go Back',
            onClick: () => navigate('/dashboard'),
          }
        );
        navigate('/dashboard');
      }
    };

    checkAdminStatus();
  }, [navigate, addError]);

  // Update grouped errors when data changes
  useEffect(() => {
    if (groupedErrorsData) {
      setGroupedErrors(groupedErrorsData);
    }
  }, [groupedErrorsData]);

  // Update stats when data changes
  useEffect(() => {
    if (statsData) {
      setGroupStats(statsData);
    }
  }, [statsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You do not have permission to access this page.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                Error Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor deduplicated error groups and system health metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GroupedErrorAnalytics groups={groupedErrors} loading={groupsLoading} />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Total Groups</p>
              <p className="text-lg font-bold text-gray-900">
                {groupStats?.totalGroups || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Errors</p>
              <p className="text-lg font-bold text-gray-900">
                {groupStats?.totalErrors || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Affected Users</p>
              <p className="text-lg font-bold text-gray-900">
                {groupStats?.totalAffectedUsers || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Dedup. Ratio</p>
              <p className="text-lg font-bold text-gray-900">
                {groupStats?.averageErrorsPerGroup
                  ? (groupStats.averageErrorsPerGroup * 100).toFixed(0)
                  : 0}%
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This dashboard displays deduplicated error groups using intelligent pattern matching.
            Similar errors are automatically grouped to reduce alert fatigue.
            Data is automatically cleaned up after 72 hours.
          </p>
        </div>
      </div>
    </div>
  );
};

export const AdminAnalytics: React.FC = () => {
  return (
    <AdminRoute>
      <AdminAnalyticsContent />
    </AdminRoute>
  );
};

export default AdminAnalytics;
