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
  ArrowLeft,
  Plus,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface Ticket {
  id: number;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export default function SupportTickets() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tickets = [], isLoading: ticketsLoading } = trpc.support.getMyTickets.useQuery(
    {
      status: statusFilter === "all" ? undefined : (statusFilter as any),
      limit: 50,
    },
    { enabled: isAuthenticated }
  );

  const { data: stats } = trpc.support.getTicketStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const filteredTickets = tickets.filter((ticket: any) =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "waiting_user":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
          <Link href="/dashboard" className="inline-flex">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">Support Tickets</h1>
              <p className="text-sm text-slate-600">Manage your support requests</p>
            </div>
          </div>
          <Link href="/support/create" className="inline-flex">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 sm:mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">{stats.total}</p>
                  <p className="text-sm text-slate-600">Total Tickets</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-500">{stats.open}</p>
                  <p className="text-sm text-slate-600">Open</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-500">{stats.inProgress}</p>
                  <p className="text-sm text-slate-600">In Progress</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-500">{stats.resolved}</p>
                  <p className="text-sm text-slate-600">Resolved</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-500">{stats.closed}</p>
                  <p className="text-sm text-slate-600">Closed</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="waiting_user">Waiting for You</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {ticketsLoading ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-slate-600">Loading tickets...</p>
              </CardContent>
            </Card>
          ) : filteredTickets.length > 0 ? (
            filteredTickets.map((ticket: any) => (
              <Link key={ticket.id} href={`/support/${ticket.id}`} className="block">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900 text-lg">
                              {ticket.subject}
                            </h3>
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>
                              Created: {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                            <span>
                              Updated: {new Date(ticket.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(ticket.status)}
                            <Badge variant="outline">
                              {getStatusLabel(ticket.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              </Link>
            ))
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No tickets found</p>
                  <Link href="/support/create" className="inline-flex">
                    <Button>Create Your First Ticket</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
