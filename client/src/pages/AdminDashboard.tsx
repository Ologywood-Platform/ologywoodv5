/**
 * Admin Dashboard Page
 * Displays Socket.io metrics and system monitoring for administrators
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { SocketMetricsDashboard } from '@/components/SocketMetricsDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Check if user has admin role
    const isAdmin = user.role === 'admin' || (user as any).isAdmin;
    setIsAuthorized(isAdmin);
    setIsLoading(false);
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-b-2 border-primary mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-3 sm:px-4">
        <Card className="border-destructive w-full max-w-md">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Please log in to access the admin dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-3 sm:px-4">
        <Card className="border-destructive w-full max-w-md">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              You do not have permission to access the admin dashboard. Only administrators can view this page.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Your role: <span className="font-semibold capitalize">{user.role}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 sm:mt-2">
            System monitoring and performance metrics for Ologywood
          </p>
          <div className="flex items-center gap-2 mt-3 sm:mt-4">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-muted-foreground truncate">
              Logged in as: <span className="font-semibold">{user.name}</span>
            </span>
          </div>
        </div>

        {/* Admin Info Cards - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <Card className="flex flex-col">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">User Role</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-lg sm:text-xl md:text-2xl font-bold capitalize">{user.role}</p>
              <p className="text-xs text-muted-foreground mt-1">Current account role</p>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">User ID</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-lg sm:text-xl md:text-2xl font-bold break-all">{user.id}</p>
              <p className="text-xs text-muted-foreground mt-1">Unique identifier</p>
            </CardContent>
          </Card>

          <Card className="flex flex-col sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Last Signed In</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-xs sm:text-sm font-mono break-all">
                {new Date((user as any).lastSignedIn).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Last login time</p>
            </CardContent>
          </Card>
        </div>

        {/* Socket.io Metrics Dashboard - Mobile Optimized */}
        <div className="bg-card border rounded-lg p-3 sm:p-4 md:p-8 overflow-x-auto">
          <SocketMetricsDashboard />
        </div>

        {/* Footer - Mobile Optimized */}
        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-muted-foreground">
          <p className="break-words">
            Admin Dashboard • Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
