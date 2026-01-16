import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { trpc } from '../lib/trpc';
import ErrorAnalyticsDashboard from '../components/ErrorAnalyticsDashboard';
import { useToastContext } from '../components/ErrorToast';

/**
 * Admin Analytics Dashboard Page
 * Displays error metrics, trends, and system health
 */
export const AdminAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { addError } = useToastContext();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [navigate, addError]);

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
                Monitor system errors, trends, and performance metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorAnalyticsDashboard />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This dashboard displays real-time error analytics and system health metrics.
            Data is automatically cleaned up after 72 hours.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
