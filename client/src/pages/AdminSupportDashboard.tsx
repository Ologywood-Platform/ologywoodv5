import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

export default function AdminSupportDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState("open");

  // Check if user is admin
  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Support Dashboard</h1>
            <p className="text-sm text-slate-600">Manage support tickets and team performance</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600">Open Tickets</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">24</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600">In Progress</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">12</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600">Resolved Today</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">8</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600">Avg Response Time</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">2.4h</p>
                </div>
                <Zap className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tickets" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="team">Team Performance</TabsTrigger>
            <TabsTrigger value="sla">SLA Compliance</TabsTrigger>
          </TabsList>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Support Tickets</CardTitle>
                    <CardDescription>Manage all support tickets</CardDescription>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="waiting_user">Waiting for User</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Sample Tickets */}
                  {[
                    {
                      id: 1,
                      subject: "Cannot create booking",
                      priority: "high",
                      status: "open",
                      user: "John Smith",
                      created: "2 hours ago",
                    },
                    {
                      id: 2,
                      subject: "Payment processing issue",
                      priority: "urgent",
                      status: "in_progress",
                      user: "Sarah Johnson",
                      created: "30 minutes ago",
                    },
                    {
                      id: 3,
                      subject: "Profile update not saving",
                      priority: "medium",
                      status: "open",
                      user: "Mike Davis",
                      created: "1 hour ago",
                    },
                  ].map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{ticket.subject}</h4>
                        <p className="text-sm text-slate-600">
                          {ticket.user} • {ticket.created}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            ticket.priority === "urgent"
                              ? "bg-red-500"
                              : ticket.priority === "high"
                              ? "bg-orange-500"
                              : "bg-yellow-500"
                          }
                        >
                          {ticket.priority}
                        </Badge>
                        <Badge variant="outline">{ticket.status}</Badge>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Performance Tab */}
          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Support team member statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: "Alice Chen",
                      resolved: 45,
                      avgTime: "1.2h",
                      satisfaction: "4.8/5",
                    },
                    {
                      name: "Bob Wilson",
                      resolved: 38,
                      avgTime: "1.8h",
                      satisfaction: "4.6/5",
                    },
                    {
                      name: "Carol Martinez",
                      resolved: 52,
                      avgTime: "1.1h",
                      satisfaction: "4.9/5",
                    },
                  ].map((member) => (
                    <div
                      key={member.name}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-300" />
                        <div>
                          <p className="font-semibold text-slate-900">{member.name}</p>
                          <p className="text-sm text-slate-600">Support Specialist</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-6 text-right">
                        <div>
                          <p className="text-xs text-slate-600">Resolved</p>
                          <p className="font-semibold text-slate-900">{member.resolved}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Avg Time</p>
                          <p className="font-semibold text-slate-900">{member.avgTime}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Satisfaction</p>
                          <p className="font-semibold text-slate-900">{member.satisfaction}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SLA Compliance Tab */}
          <TabsContent value="sla" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SLA Compliance</CardTitle>
                <CardDescription>Service Level Agreement performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      tier: "Free Users",
                      responseTime: "48 hours",
                      compliance: "92%",
                      status: "good",
                    },
                    {
                      tier: "Basic Subscribers",
                      responseTime: "24 hours",
                      compliance: "98%",
                      status: "excellent",
                    },
                    {
                      tier: "Premium Subscribers",
                      responseTime: "4 hours",
                      compliance: "95%",
                      status: "good",
                    },
                  ].map((sla) => (
                    <div
                      key={sla.tier}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{sla.tier}</p>
                        <p className="text-sm text-slate-600">
                          Target Response: {sla.responseTime}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-600">Compliance</p>
                          <p className="text-2xl font-bold text-slate-900">{sla.compliance}</p>
                        </div>
                        <Badge
                          className={
                            sla.status === "excellent"
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }
                        >
                          {sla.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
