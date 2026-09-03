export type UnifiedLifecycleStage = 'draft' | 'live' | 'pending' | 'confirmed' | 'in_progress' | 'fulfilled' | 'cancelled';

const STAGE_LABELS: Record<UnifiedLifecycleStage, string> = {
  draft: 'Draft',
  live: 'Live',
  pending: 'Pending',
  confirmed: 'Confirmed / Paid',
  in_progress: 'In progress',
  fulfilled: 'Fulfilled / Completed',
  cancelled: 'Cancelled / Refunded',
};

const STAGE_STYLES: Record<UnifiedLifecycleStage, string> = {
  draft: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
  live: 'border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200',
  pending: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  confirmed: 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
  in_progress: 'border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-200',
  fulfilled: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  cancelled: 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200',
};

const normalize = (value?: string | null) => value?.trim().toLowerCase().replace(/[\s-]+/g, '_') || '';

export function getUnifiedLifecycleStage(status?: string | null, paymentStatus?: string | null): UnifiedLifecycleStage {
  const values = [normalize(status), normalize(paymentStatus)].filter(Boolean);

  if (values.some((value) => ['cancelled', 'canceled', 'refunded', 'failed', 'declined', 'taken_down'].includes(value))) return 'cancelled';
  if (values.some((value) => ['completed', 'fulfilled', 'delivered', 'downloaded'].includes(value))) return 'fulfilled';
  if (values.some((value) => ['processing', 'in_progress', 'ready_for_pickup', 'shipped', 'scheduled'].includes(value))) return 'in_progress';
  if (values.some((value) => ['confirmed', 'paid', 'succeeded', 'approved', 'accepted'].includes(value))) return 'confirmed';
  if (values.some((value) => ['published', 'active', 'live'].includes(value))) return 'live';
  if (values.some((value) => ['draft', 'unpublished', 'archived'].includes(value))) return 'draft';
  return 'pending';
}

export function getUnifiedLifecycleLabel(stage: UnifiedLifecycleStage) {
  return STAGE_LABELS[stage];
}

export function getUnifiedLifecycleStyle(stage: UnifiedLifecycleStage) {
  return STAGE_STYLES[stage];
}

