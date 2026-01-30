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
      hoursBack: 24,
    });

  const { data: statsData } = trpc.analytics.getGroupStatistics.useQuery({});

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
      setGroupedErrors(Array.isArray(groupedErrorsData) ? groupedErrorsData : []);
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-3 sm:px-4">
        <div className="animate-spin">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-3 sm:px-4">
        <div className="text-center max-w-md w-full">
          <AlertCircle className="w-10 sm:w-12 h-10 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" />
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
            You do not have permission to access this page.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Optimized */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-2 text-xs sm:text-sm"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                Back to Dashboard
              </button>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                Error Analytics Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Monitor deduplicated error groups and system health metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
        <GroupedErrorAnalytics groups={groupedErrors} loading={groupsLoading} />
      </div>

      {/* Footer - Mobile Optimized */}
      <div className="bg-white border-t border-gray-200 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Total Groups</p>
              <p className="text-base sm:text-lg font-bold text-gray-900">
                {groupStats?.totalGroups || 0}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Total Errors</p>
              <p className="text-base sm:text-lg font-bold text-gray-900">
                {groupStats?.totalErrors || 0}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Affected Users</p>
              <p className="text-base sm:text-lg font-bold text-gray-900">
                {groupStats?.totalAffectedUsers || 0}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Dedup. Ratio</p>
              <p className="text-base sm:text-lg font-bold text-gray-900">
                {groupStats?.averageErrorsPerGroup
                  ? (groupStats.averageErrorsPerGroup * 100).toFixed(0)
                  : 0}%
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">
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
