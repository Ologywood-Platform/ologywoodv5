import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import type { ValidationState } from '@/hooks/useContractValidation';

interface ContractFormValidationProps {
  validationState: ValidationState;
  showProgress?: boolean;
}

/**
 * Displays a progress bar and summary of contract form completion.
 * Place at the top of the contract/rider form.
 */
export function ContractFormProgress({ validationState, showProgress = true }: ContractFormValidationProps) {
  const { completionPercent, completedFields, totalFields, isValid, errors, warnings } = validationState;
  const errorCount = Object.keys(errors).length;
  const warningCount = Object.keys(warnings).length;

  const progressColor = completionPercent === 100 && isValid
    ? 'bg-green-600'
    : completionPercent >= 60
    ? 'bg-amber-500'
    : 'bg-red-500';

  if (!showProgress) return null;

  return (
    <div className="space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Form Completion
        </span>
        <span className="text-xs font-semibold">
          {completedFields}/{totalFields} required fields
        </span>
      </div>
      <Progress value={completionPercent} className="h-2" />
      <div className="flex items-center gap-3 flex-wrap">
        {isValid && completionPercent === 100 && (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 text-xs gap-1">
            <CheckCircle2 className="h-3 w-3" /> Ready to submit
          </Badge>
        )}
        {errorCount > 0 && (
          <Badge variant="destructive" className="text-xs gap-1">
            <XCircle className="h-3 w-3" /> {errorCount} {errorCount === 1 ? 'error' : 'errors'}
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 text-xs gap-1">
            <AlertTriangle className="h-3 w-3" /> {warningCount} {warningCount === 1 ? 'suggestion' : 'suggestions'}
          </Badge>
        )}
      </div>
    </div>
  );
}

/**
 * Inline field error/warning message component.
 * Place below each form field.
 */
export function FieldValidationMessage({
  error,
  warning,
}: {
  error?: string | null;
  warning?: string | null;
}) {
  if (!error && !warning) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1 duration-200">
          <XCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
      {warning && !error && (
        <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 animate-in fade-in slide-in-from-top-1 duration-200">
          <Info className="h-3 w-3 shrink-0" />
          {warning}
        </p>
      )}
    </div>
  );
}

/**
 * NIL Compliance checklist that shows which compliance items are met.
 */
export function NILComplianceChecklist({ formData }: { formData: Record<string, any> }) {
  const checks = [
    {
      label: 'Parties clearly identified',
      met: !!(formData.athlete_name && formData.venue_name),
    },
    {
      label: 'Compensation defined',
      met: !!(formData.appearance_fee && Number(formData.appearance_fee) > 0),
    },
    {
      label: 'Event date and duration set',
      met: !!(formData.event_date && formData.appearance_duration),
    },
    {
      label: 'Cancellation policy specified',
      met: !!formData.cancellation_policy,
    },
    {
      label: 'Media/photo policy defined',
      met: !!formData.photo_policy,
    },
    {
      label: 'Social media disclosure addressed',
      met: !!formData.social_media_tag,
    },
  ];

  const metCount = checks.filter((c) => c.met).length;

  return (
    <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900/50 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
          NIL Compliance Checklist
        </span>
        <span className="text-xs text-muted-foreground">{metCount}/{checks.length}</span>
      </div>
      <div className="space-y-1">
        {checks.map((check, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            {check.met ? (
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
            ) : (
              <div className="h-3 w-3 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
            )}
            <span className={check.met ? 'text-foreground' : 'text-muted-foreground'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
