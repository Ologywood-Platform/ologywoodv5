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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="border-destructive max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-destructive" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please log in to access the admin dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="border-destructive max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You do not have permission to access the admin dashboard. Only administrators can view this page.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Your role: <span className="font-semibold capitalize">{user.role}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            System monitoring and performance metrics for Ologywood
          </p>
          <div className="flex items-center gap-2 mt-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm text-muted-foreground">
              Logged in as: <span className="font-semibold">{user.name}</span>
            </span>
          </div>
        </div>

        {/* Admin Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">User Role</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold capitalize">{user.role}</p>
              <p className="text-xs text-muted-foreground mt-1">Current account role</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">User ID</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{user.id}</p>
              <p className="text-xs text-muted-foreground mt-1">Unique identifier</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Last Signed In</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-mono">
                {new Date((user as any).lastSignedIn).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Last login time</p>
            </CardContent>
          </Card>
        </div>

        {/* Socket.io Metrics Dashboard */}
        <div className="bg-card border rounded-lg p-8">
          <SocketMetricsDashboard />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Admin Dashboard • Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
