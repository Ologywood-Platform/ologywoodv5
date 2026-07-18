import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Flag, CheckCircle2, Loader2 } from 'lucide-react';
import { Link } from 'wouter';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or misleading content' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'impersonation', label: 'Impersonation or fake profile' },
  { value: 'inappropriate', label: 'Inappropriate or offensive content' },
  { value: 'ip_violation', label: 'Intellectual property violation' },
  { value: 'fraud', label: 'Fraud or scam' },
  { value: 'other', label: 'Other' },
];

interface ReportContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: 'profile' | 'venue' | 'content';
  contentName?: string;
}

export function ReportContentModal({ open, onOpenChange, contentType, contentName }: ReportContentModalProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    // Simulate submission (in production, this would call an API endpoint)
    await new Promise(resolve => setTimeout(resolve, 800));
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setReason('');
      setDetails('');
      setSubmitted(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold">Report Submitted</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Thank you for helping keep OlogyWood® safe. Our team will review your report within 24–48 hours.
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              For more details, see our{' '}
              <Link href="/community-guidelines" className="text-primary hover:underline">
                Community Guidelines
              </Link>
            </p>
            <Button onClick={handleClose} className="mt-4">
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-destructive" />
                Report {contentType === 'venue' ? 'Venue' : contentType === 'profile' ? 'Profile' : 'Content'}
              </DialogTitle>
              <DialogDescription>
                {contentName && <span className="font-medium">{contentName}</span>}
                {contentName && ' — '}
                Select a reason for your report. All reports are reviewed by our team.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
                {REPORT_REASONS.map((r) => (
                  <div key={r.value} className="flex items-center space-x-3 rounded-md border p-3 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
                    <Label htmlFor={`reason-${r.value}`} className="flex-1 cursor-pointer text-sm">
                      {r.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div>
                <Label htmlFor="report-details" className="text-sm">
                  Additional details <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="report-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any additional context that may help our review..."
                  className="mt-1.5 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{details.length}/500</p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!reason || submitting}
                  variant="destructive"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
