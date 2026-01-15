import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function SupportTicketCreate() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [priority, setPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories = [] } = trpc.support.getCategories.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.support.createTicket.useMutation({
    onSuccess: (result: any) => {
      toast.success("Support ticket created successfully!");
      navigate(`/support/${result.insertId || 1}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create ticket");
      setIsSubmitting(false);
    },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    setIsSubmitting(true);

    createMutation.mutate({
      subject,
      description,
      categoryId: parseInt(categoryId),
      priority: priority as any,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
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
            <h1 className="text-3xl font-bold text-slate-900">Create Support Ticket</h1>
            <p className="text-sm text-slate-600">Tell us how we can help</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>New Support Request</CardTitle>
            <CardDescription>
              Fill out the form below to create a support ticket. Our team will respond as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={255}
                />
                <p className="text-xs text-slate-500">{subject.length}/255</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide detailed information about your issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-slate-500">
                  Provide as much detail as possible to help us resolve your issue faster
                </p>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - General inquiry</SelectItem>
                    <SelectItem value="medium">Medium - Needs attention soon</SelectItem>
                    <SelectItem value="high">High - Urgent issue</SelectItem>
                    <SelectItem value="urgent">Urgent - Critical problem</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || createMutation.isPending}
                  className="flex-1"
                >
                  {isSubmitting || createMutation.isPending ? "Creating..." : "Create Ticket"}
                </Button>
                <Link href="/support">
                  <a className="inline-flex">
                    <Button type="button" variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </a>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">Tips for faster resolution:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific and clear about your issue</li>
              <li>• Include relevant booking or contract IDs if applicable</li>
              <li>• Describe what you've already tried</li>
              <li>• Set appropriate priority level</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
