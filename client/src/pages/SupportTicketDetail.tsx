import { useState, useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function SupportTicketDetail() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/support/:id");
  const ticketId = params?.id ? parseInt(params.id) : null;
  const [responseText, setResponseText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: ticketData, isLoading: ticketLoading, refetch } = trpc.support.getTicketDetail.useQuery(
    { ticketId: ticketId || 0 },
    { enabled: !!ticketId && isAuthenticated }
  );

  const addResponseMutation = trpc.support.addTicketResponse.useMutation({
    onSuccess: () => {
      toast.success("Response added successfully!");
      setResponseText("");
      setIsSubmitting(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add response");
      setIsSubmitting(false);
    },
  });

  const closeTicketMutation = trpc.support.closeTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket closed successfully!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to close ticket");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);

  if (loading || ticketLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user || !ticketData) {
    return null;
  }

  const { ticket, responses } = ticketData;

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
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "waiting_user":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleAddResponse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!responseText.trim()) {
      toast.error("Please enter a response");
      return;
    }

    setIsSubmitting(true);

    addResponseMutation.mutate({
      ticketId: ticket.id,
      message: responseText,
    });
  };

  const handleCloseTicket = () => {
    if (confirm("Are you sure you want to close this ticket?")) {
      closeTicketMutation.mutate({ ticketId: ticket.id });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/support">
            <a className="inline-flex">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </a>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Support Ticket #{ticket.id}</h1>
            <p className="text-sm text-slate-600">View and manage your support request</p>
          </div>
        </div>

        {/* Ticket Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{ticket.subject}</h2>
                <div className="flex gap-2 mb-4">
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getStatusIcon(ticket.status)}
                    {getStatusLabel(ticket.status)}
                  </Badge>
                </div>
              </div>
              {ticket.status !== "closed" && ticket.status !== "resolved" && (
                <Button
                  variant="outline"
                  onClick={handleCloseTicket}
                  disabled={closeTicketMutation.isPending}
                >
                  Close Ticket
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              <div>
                <p className="text-xs text-slate-600">Created</p>
                <p className="font-semibold text-slate-900">
                  {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Last Updated</p>
                <p className="font-semibold text-slate-900">
                  {new Date(ticket.updatedAt).toLocaleString()}
                </p>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <p className="text-xs text-slate-600">Resolved</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(ticket.resolvedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>
              {responses.length} {responses.length === 1 ? "response" : "responses"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {responses.length > 0 ? (
              responses.map((response: any) => (
                <div
                  key={response.id}
                  className={`p-4 rounded-lg ${
                    response.isStaffResponse
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-slate-50 border border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {response.isStaffResponse ? "Support Team" : "You"}
                      </p>
                      <p className="text-xs text-slate-600">
                        {new Date(response.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {response.isStaffResponse && (
                      <Badge className="bg-blue-500">Staff Response</Badge>
                    )}
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{response.message}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-600 py-8">
                No responses yet. Our team will respond soon.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Add Response */}
        {ticket.status !== "closed" && (
          <Card>
            <CardHeader>
              <CardTitle>Add Response</CardTitle>
              <CardDescription>Reply to your support ticket</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddResponse} className="space-y-4">
                <Textarea
                  placeholder="Type your response here..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting || addResponseMutation.isPending}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting || addResponseMutation.isPending ? "Sending..." : "Send Response"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
