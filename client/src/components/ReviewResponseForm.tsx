import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

interface ReviewResponseFormProps {
  reviewId: number;
  existingResponse?: string | null;
  onResponseSubmitted?: () => void;
}

export default function ReviewResponseForm({
  reviewId,
  existingResponse,
  onResponseSubmitted,
}: ReviewResponseFormProps) {
  const [response, setResponse] = useState(existingResponse || "");
  const [isEditing, setIsEditing] = useState(!existingResponse);

  const respondMutation = trpc.review.respondToReview.useMutation({
    onSuccess: () => {
      toast.success("Response posted successfully!");
      setIsEditing(false);
      onResponseSubmitted?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to post response");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim()) {
      toast.error("Please enter a response");
      return;
    }
    respondMutation.mutate({ reviewId, response: response.trim() });
  };

  if (existingResponse && !isEditing) {
    return (
      <Card className="p-4 bg-accent/50 border-l-4 border-l-primary">
        <div className="flex items-start gap-3">
          <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-sm mb-1">Artist Response:</p>
            <p className="text-sm text-muted-foreground">{existingResponse}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-accent/50">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm font-medium flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4" />
            {existingResponse ? "Edit Your Response" : "Respond to this Review"}
          </label>
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Thank the venue, address feedback, or provide context..."
            className="min-h-[100px]"
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {response.length}/1000 characters
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={respondMutation.isPending || !response.trim()}
          >
            {respondMutation.isPending ? "Posting..." : existingResponse ? "Update Response" : "Post Response"}
          </Button>
          {existingResponse && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setResponse(existingResponse);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
