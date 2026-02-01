import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, Users, BarChart3, AlertTriangle } from 'lucide-react';

interface TestingMetrics {
  totalTesters: number;
  activeTesters: number;
  completedTests: number;
  failedTests: number;
  errorRate: number;
  averageSessionTime: number;
}

interface FeatureStatus {
  name: string;
  status: 'working' | 'broken' | 'partial';
  testersReporting: number;
  errorCount: number;
  lastUpdated: string;
}

interface ErrorLog {
  id: string;
  feature: string;
  error: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  testerCount: number;
  timestamp: string;
}

export default function TestingDashboard() {
  const [metrics, setMetrics] = useState<TestingMetrics>({
    totalTesters: 0,
    activeTesters: 0,
    completedTests: 0,
    failedTests: 0,
    errorRate: 0,
    averageSessionTime: 0,
  });

  const [featureStatus, setFeatureStatus] = useState<FeatureStatus[]>([
    { name: 'Artist Profile', status: 'working', testersReporting: 0, errorCount: 0, lastUpdated: new Date().toISOString() },
    { name: 'Venue Profile', status: 'working', testersReporting: 0, errorCount: 0, lastUpdated: new Date().toISOString() },
    { name: 'Bookings', status: 'working', testersReporting: 0, errorCount: 0, lastUpdated: new Date().toISOString() },
    { name: 'Messaging', status: 'working', testersReporting: 0, errorCount: 0, lastUpdated: new Date().toISOString() },
    { name: 'Riders', status: 'working', testersReporting: 0, errorCount: 0, lastUpdated: new Date().toISOString() },
    { name: 'Payments', status: 'working', testersReporting: 0, errorCount: 0, lastUpdated: new Date().toISOString() },
    { name: 'Calendar Sync', status: 'working', testersReporting: 0, errorCount: 0, lastUpdated: new Date().toISOString() },
    { name: 'Notifications', status: 'working', testersReporting: 0, errorCount: 0, lastUpdated: new Date().toISOString() },
  ]);

  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'text-green-600';
      case 'broken':
        return 'text-red-600';
      case 'partial':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'broken':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'partial':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            Testing Dashboard
          </h1>
          <p className="text-slate-600">
            Real-time monitoring of global tester activity and platform health
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Testers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{metrics.totalTesters}</div>
              <p className="text-xs text-slate-500 mt-1">{metrics.activeTesters} currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Tests Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{metrics.completedTests}</div>
              <p className="text-xs text-slate-500 mt-1">{metrics.failedTests} failed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Error Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${metrics.errorRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                {metrics.errorRate.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">Avg session: {metrics.averageSessionTime}m</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Feature Status</TabsTrigger>
            <TabsTrigger value="errors">Error Log</TabsTrigger>
            <TabsTrigger value="guide">Testing Guide</TabsTrigger>
          </TabsList>

          {/* Feature Status Tab */}
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feature Status</CardTitle>
                <CardDescription>Real-time status of all platform features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {featureStatus.map((feature) => (
                    <div key={feature.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(feature.status)}
                        <div>
                          <p className="font-medium text-slate-900">{feature.name}</p>
                          <p className="text-xs text-slate-500">
                            {feature.testersReporting} testers reporting • {feature.errorCount} errors
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold capitalize ${getStatusColor(feature.status)}`}>
                          {feature.status}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(feature.lastUpdated).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Error Log Tab */}
          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Error Log</CardTitle>
                <CardDescription>Critical issues reported by testers</CardDescription>
              </CardHeader>
              <CardContent>
                {errorLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <p className="text-slate-600">No errors reported yet!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {errorLogs.map((log) => (
                      <div key={log.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-slate-900">{log.feature}</p>
                            <p className="text-sm text-slate-600 mt-1">{log.error}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(log.severity)}`}>
                            {log.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {log.testerCount} testers affected • {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Guide Tab */}
          <TabsContent value="guide" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Testing Guide for Global Testers</CardTitle>
                <CardDescription>How to effectively test the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Critical User Flows to Test</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>✓ Sign up as Artist and Venue</li>
                    <li>✓ Complete profile setup</li>
                    <li>✓ Upload photos and media</li>
                    <li>✓ Create and manage bookings</li>
                    <li>✓ Send and receive messages</li>
                    <li>✓ Create and share riders</li>
                    <li>✓ Manage availability and calendar</li>
                    <li>✓ Test payment processing</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">What to Report</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Buttons that don't work</li>
                    <li>• Forms that won't submit</li>
                    <li>• Text overlapping on mobile</li>
                    <li>• Missing error messages</li>
                    <li>• Slow loading times</li>
                    <li>• Broken links or navigation</li>
                    <li>• Data not saving</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">How to Report Issues</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Use the Support Ticket feature in the app to report any issues. Include:
                  </p>
                  <ul className="space-y-1 text-sm text-slate-600">
                    <li>• What you were trying to do</li>
                    <li>• What happened instead</li>
                    <li>• Your device and browser</li>
                    <li>• Screenshots if possible</li>
                  </ul>
                </div>

                <Button className="w-full mt-4">
                  View Full Testing Documentation
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
