import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { GRANT_BILLING_NOTICE } from '@shared/complimentaryAccess';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ComplimentaryTier = 'starter' | 'professional' | 'enterprise';
type DialogStep = 'form' | 'review' | 'revoke';

type AdminUser = {
  id: number;
  name?: string | null;
  email: string;
};

const MAX_EXPIRY = new Date(Date.UTC(2038, 0, 1));

const formatDate = (value: Date | string | null | undefined, includeTime = false) => {
  if (!value) return 'No expiry';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' });
};

/** Converts an ISO/Date value to the local format expected by datetime-local. */
const toLocalDateTimeValue = (value: Date | string) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export function AdminComplimentaryAccess({
  user,
  canManage,
  onOpenChange,
  onSuccess,
}: {
  user: AdminUser;
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (message: string) => void;
}) {
  const utils = trpc.useUtils();
  const [step, setStep] = useState<DialogStep>('form');
  const [tier, setTier] = useState<ComplimentaryTier>('enterprise');
  const [expiresAtLocal, setExpiresAtLocal] = useState('');
  const [reason, setReason] = useState('');
  const [billingAcknowledged, setBillingAcknowledged] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  // This is frozen when the owner begins review. Writes must never use a newer
  // revision that arrived during review, because that could approve unseen data.
  const [reviewExpectedRevision, setReviewExpectedRevision] = useState<number | null>(null);

  // Inspection is intentionally enabled only for the one user selected in the table.
  const inspectQuery = trpc.complimentaryAccess.inspect.useQuery(
    { userId: user.id },
    { enabled: canManage, retry: false },
  );
  const inspected = inspectQuery.data;
  const grant = inspected?.grant ?? null;

  useEffect(() => {
    setStep('form');
    setTier('enterprise');
    setExpiresAtLocal('');
    setReason('');
    setBillingAcknowledged(false);
    setRevokeReason('');
    setFormError(null);
    setReviewExpectedRevision(null);
  }, [user.id]);

  const minExpiry = useMemo(() => toLocalDateTimeValue(new Date()), []);
  const maxExpiry = useMemo(() => toLocalDateTimeValue(MAX_EXPIRY), []);
  // The server knows whether a cancelled record still has a future period end or
  // is otherwise unverified. Do not infer that cancelled Stripe billing is safe.
  const hasBlockingStripeSubscription = inspected?.billing.blocksComplimentary === true;
  const inspectUnavailable = !inspected || inspectQuery.isError || inspectQuery.isFetching;

  // If a foreground/background refresh sees a changed grant while it is under
  // review, make the owner return to the form and take a new revision snapshot.
  useEffect(() => {
    if (
      (step === 'review' || step === 'revoke')
      && reviewExpectedRevision !== null
      && (grant?.revision ?? 0) !== reviewExpectedRevision
    ) {
      setFormError('This grant changed while you were reviewing it. Your draft was kept; review the latest account state before confirming.');
      setStep('form');
      setReviewExpectedRevision(null);
    }
  }, [grant?.revision, reviewExpectedRevision, step]);

  const invalidateAccessData = async () => {
    await Promise.all([
      utils.complimentaryAccess.inspect.invalidate({ userId: user.id }),
      utils.pricing.getCurrentTier.invalidate(),
      utils.subscription.getMy.invalidate(),
      utils.admin.getUsers.invalidate(),
      utils.admin.getAdmins.invalidate(),
      utils.admin.getAnalytics.invalidate(),
    ]);
  };

  const handleMutationError = (error: any) => {
    const code = error?.data?.code;
    const isConflict = code === 'CONFLICT' || /revision|stale|conflict/i.test(error?.message || '');
    const isBillingRace = code === 'PRECONDITION_FAILED';
    if (isConflict || isBillingRace) {
      setFormError(isBillingRace
        ? 'Billing changed while this grant was being prepared. Your draft was kept; the latest account state was reloaded. Review it again before confirming.'
        : 'This grant was changed elsewhere. Your draft was kept; the latest record was reloaded. Review it again before confirming.');
      setStep('form');
      setReviewExpectedRevision(null);
      void inspectQuery.refetch();
      return;
    }
    setFormError(error?.message || 'The complimentary-access change could not be completed.');
  };

  const grantMutation = trpc.complimentaryAccess.grant.useMutation({
    onSuccess: async () => {
      await invalidateAccessData();
      await inspectQuery.refetch();
      setStep('form');
      setReason('');
      setExpiresAtLocal('');
      setBillingAcknowledged(false);
      setFormError(null);
      setReviewExpectedRevision(null);
      onSuccess(`Complimentary ${tier} access was ${grant ? 'replaced' : 'granted'} for ${user.name || user.email}.`);
    },
    onError: handleMutationError,
  });

  const revokeMutation = trpc.complimentaryAccess.revoke.useMutation({
    onSuccess: async () => {
      await invalidateAccessData();
      await inspectQuery.refetch();
      setStep('form');
      setRevokeReason('');
      setFormError(null);
      setReviewExpectedRevision(null);
      onSuccess(`Complimentary access was revoked for ${user.name || user.email}. Audit history was retained.`);
    },
    onError: handleMutationError,
  });

  const validateExpiry = () => {
    if (!expiresAtLocal) return true;
    const expiry = new Date(expiresAtLocal);
    if (!Number.isFinite(expiry.getTime())) {
      setFormError('Enter a valid expiry date and time, or leave expiry blank.');
      return false;
    }
    if (expiry.getTime() <= Date.now()) {
      setFormError('Expiry must be later than the current time.');
      return false;
    }
    if (expiry.getTime() > MAX_EXPIRY.getTime()) {
      setFormError('Expiry must be on or before January 1, 2038.');
      return false;
    }
    return true;
  };

  const validateGrantDraft = () => {
    if (inspectUnavailable) {
      setFormError('The latest account details are still loading or could not be verified. Retry the inspection before reviewing this grant.');
      return false;
    }
    const trimmedReason = reason.trim();
    if (hasBlockingStripeSubscription) {
      setFormError('Active, period-end or unverified cancelled Stripe billing blocks grants. Resolve billing separately before granting complimentary access.');
      return false;
    }
    if (trimmedReason.length < 3 || trimmedReason.length > 500) {
      setFormError('Provide a reason between 3 and 500 characters.');
      return false;
    }
    if (!billingAcknowledged) {
      setFormError('The billing acknowledgement is required before granting access.');
      return false;
    }
    if (!validateExpiry()) return false;
    setFormError(null);
    setReviewExpectedRevision(grant?.revision ?? 0);
    setStep('review');
    return true;
  };

  const submitGrant = () => {
    if (inspectUnavailable || reviewExpectedRevision === null) {
      setFormError('The account state needs to be reloaded before this grant can be confirmed. Review it again before continuing.');
      setStep('form');
      setReviewExpectedRevision(null);
      return;
    }
    const expiresAt = expiresAtLocal ? new Date(expiresAtLocal) : null;
    if (!validateExpiry()) {
      setStep('form');
      setReviewExpectedRevision(null);
      return;
    }
    grantMutation.mutate({
      userId: user.id,
      tier,
      expiresAt,
      reason: reason.trim(),
      expectedRevision: reviewExpectedRevision,
      billingAcknowledged: true,
    });
  };

  const beginRevoke = () => {
    if (inspectUnavailable || !grant) {
      setFormError('The latest account details are still loading or could not be verified. Retry before revoking access.');
      return;
    }
    setFormError(null);
    setReviewExpectedRevision(grant.revision);
    setStep('revoke');
  };

  const submitRevoke = () => {
    const trimmedReason = revokeReason.trim();
    if (trimmedReason.length < 3 || trimmedReason.length > 500) {
      setFormError('Provide a revocation reason between 3 and 500 characters.');
      return;
    }
    if (inspectUnavailable || reviewExpectedRevision === null || !grant) {
      setFormError('No grant is available to revoke. Reload the record and try again.');
      setStep('form');
      setReviewExpectedRevision(null);
      return;
    }
    revokeMutation.mutate({
      userId: user.id,
      expectedRevision: reviewExpectedRevision,
      reason: trimmedReason,
    });
  };

  const pending = grantMutation.isPending || revokeMutation.isPending;
  const activeGrant = grant?.effectiveStatus === 'active';

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent overlayClassName="z-[70]" className="z-[71] flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl" showCloseButton={!pending}>
        <DialogHeader className="shrink-0 border-b border-slate-200 px-6 py-5 pr-12">
          <DialogTitle>Manage complimentary access</DialogTitle>
          <DialogDescription>
            {user.name || user.email} <span className="text-slate-400">•</span> {user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {inspectQuery.isLoading && (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading access and billing details…
            </div>
          )}

          {inspectQuery.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-medium">Could not load complimentary-access details.</p>
              <p className="mt-1">{(inspectQuery.error as any)?.message || 'Please retry before making a change.'}</p>
              <button
                type="button"
                onClick={() => inspectQuery.refetch()}
                className="mt-3 inline-flex items-center gap-1 rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-red-100"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          {inspected && !inspectQuery.isLoading && (
            <div className="space-y-5">
              {inspected.isOwner && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <p><strong>Enterprise — Owner</strong>. Owner access is protected and cannot be modified here.</p>
                  </div>
                </div>
              )}

              <section aria-labelledby="current-grant-heading" className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 id="current-grant-heading" className="text-sm font-semibold text-slate-900">Current complimentary grant</h3>
                {grant ? (
                  <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-slate-500">Tier</dt><dd className="font-medium capitalize text-slate-900">{grant.tier}</dd></div>
                    <div><dt className="text-slate-500">Effective status</dt><dd className="font-medium capitalize text-slate-900">{grant.effectiveStatus}</dd></div>
                    <div><dt className="text-slate-500">Expires</dt><dd className="font-medium text-slate-900">{formatDate(grant.expiresAt, true)}</dd></div>
                    <div><dt className="text-slate-500">Revision</dt><dd className="font-medium text-slate-900">{grant.revision}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-slate-500">Grant reason</dt><dd className="mt-0.5 text-slate-800">{grant.reason}</dd></div>
                  </dl>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">No complimentary grant exists for this account.</p>
                )}
              </section>

              <section aria-labelledby="billing-heading" className="rounded-lg border border-slate-200 p-4">
                <h3 id="billing-heading" className="text-sm font-semibold text-slate-900">Raw billing status</h3>
                <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                  <div><dt className="text-slate-500">Tier</dt><dd className="font-medium capitalize text-slate-900">{inspected.billing.tier || 'free'}</dd></div>
                  <div><dt className="text-slate-500">Status</dt><dd className="font-medium capitalize text-slate-900">{inspected.billing.status || 'inactive'}</dd></div>
                  <div><dt className="text-slate-500">Stripe subscription</dt><dd className="font-medium text-slate-900">{inspected.billing.hasStripeSubscription ? 'Present' : 'None'}</dd></div>
                  {inspected.billing.currentPeriodEnd && (
                    <div><dt className="text-slate-500">Period end</dt><dd className="font-medium text-slate-900">{formatDate(inspected.billing.currentPeriodEnd, true)}</dd></div>
                  )}
                </dl>
                {hasBlockingStripeSubscription && (
                  <p className="mt-3 flex items-start gap-2 rounded-md bg-red-50 p-3 text-xs leading-relaxed text-red-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    Active, period-end or unverified cancelled Stripe billing blocks grants; resolve billing separately. This tool never cancels Stripe on the account’s behalf.
                  </p>
                )}
              </section>

              {formError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{formError}</div>
              )}

              {!inspected.isOwner && step === 'form' && (
                <section aria-labelledby="grant-details-heading" className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 id="grant-details-heading" className="text-sm font-semibold text-slate-900">Grant details</h3>
                    {activeGrant && (
                      <button type="button" onClick={beginRevoke} disabled={pending} className="text-xs font-medium text-red-700 hover:text-red-800 disabled:opacity-50">
                        Revoke current access
                      </button>
                    )}
                  </div>
                  <div>
                    <label htmlFor="complimentary-tier" className="mb-1.5 block text-sm font-medium text-slate-700">Complimentary tier</label>
                    <select
                      id="complimentary-tier"
                      value={tier}
                      onChange={(event) => setTier(event.target.value as ComplimentaryTier)}
                      disabled={hasBlockingStripeSubscription || pending}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
                    >
                      <option value="starter">Starter</option>
                      <option value="professional">Professional</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="complimentary-expiry" className="mb-1.5 block text-sm font-medium text-slate-700">Expiry (optional)</label>
                    <input
                      id="complimentary-expiry"
                      type="datetime-local"
                      min={minExpiry}
                      value={expiresAtLocal}
                      onChange={(event) => setExpiresAtLocal(event.target.value)}
                      disabled={hasBlockingStripeSubscription || pending}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
                    />
                    <p className="mt-1 text-xs text-slate-500">Leave blank for no expiry. Times are entered in your local time and saved as a Date.</p>
                  </div>
                  <div>
                    <label htmlFor="complimentary-reason" className="mb-1.5 block text-sm font-medium text-slate-700">Reason</label>
                    <textarea
                      id="complimentary-reason"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      minLength={3}
                      maxLength={500}
                      rows={3}
                      disabled={hasBlockingStripeSubscription || pending}
                      placeholder="Why is complimentary access being granted?"
                      className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
                    />
                    <p className="mt-1 text-right text-xs text-slate-500">{reason.length}/500</p>
                  </div>
                  <label htmlFor="complimentary-billing-warning" className="flex cursor-pointer items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <input
                      id="complimentary-billing-warning"
                      type="checkbox"
                      checked={billingAcknowledged}
                      onChange={(event) => setBillingAcknowledged(event.target.checked)}
                      disabled={hasBlockingStripeSubscription || pending}
                      className="mt-0.5 h-4 w-4 rounded border-amber-400"
                    />
                    <span>I understand this does not cancel Stripe billing or waive transaction fees.</span>
                  </label>
                  <p className="text-xs leading-relaxed text-slate-600">{GRANT_BILLING_NOTICE}</p>
                  {grant && activeGrant && (
                    <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">
                      Replacing active access applies the new grant immediately and replaces the current active grant; audit history is preserved.
                    </p>
                  )}
                </section>
              )}

              {!inspected.isOwner && step === 'review' && (
                <section aria-labelledby="review-heading" className="space-y-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                  <h3 id="review-heading" className="text-sm font-semibold text-indigo-950">Review complimentary grant</h3>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-indigo-700">Tier</dt><dd className="font-medium capitalize text-indigo-950">{tier}</dd></div>
                    <div><dt className="text-indigo-700">Expiry</dt><dd className="font-medium text-indigo-950">{expiresAtLocal ? formatDate(new Date(expiresAtLocal), true) : 'No expiry'}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-indigo-700">Reason</dt><dd className="font-medium text-indigo-950">{reason.trim()}</dd></div>
                  </dl>
                  {activeGrant && <p className="text-xs text-indigo-800">This will replace the active {grant?.tier} grant at revision {grant?.revision}. The current grant display will update after confirmation.</p>}
                </section>
              )}

              {!inspected.isOwner && step === 'revoke' && (
                <section aria-labelledby="revoke-heading" className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <h3 id="revoke-heading" className="text-sm font-semibold text-red-950">Confirm revocation</h3>
                  <p className="text-sm text-red-900">This removes complimentary access. It does not delete grant history or change Stripe billing.</p>
                  <div>
                    <label htmlFor="complimentary-revoke-reason" className="mb-1.5 block text-sm font-medium text-red-950">Revocation reason</label>
                    <textarea
                      id="complimentary-revoke-reason"
                      value={revokeReason}
                      onChange={(event) => setRevokeReason(event.target.value)}
                      minLength={3}
                      maxLength={500}
                      rows={3}
                      disabled={pending}
                      placeholder="Why is this access being revoked?"
                      className="w-full resize-y rounded-md border border-red-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                    <p className="mt-1 text-right text-xs text-red-700">{revokeReason.length}/500</p>
                  </div>
                </section>
              )}

              <section aria-labelledby="audit-history-heading">
                <h3 id="audit-history-heading" className="mb-2 text-sm font-semibold text-slate-900">Audit history</h3>
                {inspected.events.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">No complimentary-access events have been recorded.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full min-w-[620px] text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 font-medium">When</th>
                          <th className="px-3 py-2 font-medium">Action</th>
                          <th className="px-3 py-2 font-medium">Tier</th>
                          <th className="px-3 py-2 font-medium">Expiry</th>
                          <th className="px-3 py-2 font-medium">Reason</th>
                          <th className="px-3 py-2 font-medium">Actor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inspected.events.slice(0, 50).map((event) => (
                          <tr key={event.id} className="align-top">
                            <td className="whitespace-nowrap px-3 py-2 text-slate-600">{formatDate(event.createdAt, true)}</td>
                            <td className="px-3 py-2 font-medium capitalize text-slate-900">{event.action}</td>
                            <td className="px-3 py-2 capitalize text-slate-700">{event.tier}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-700">{formatDate(event.expiresAt)}</td>
                            <td className="max-w-64 px-3 py-2 text-slate-700">{event.reason}</td>
                            <td className="px-3 py-2 text-slate-600">#{event.actorUserId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-200 px-6 py-4 sm:justify-between">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          {inspected && !inspected.isOwner && !inspectQuery.isError && (
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {step === 'review' && (
                <>
                  <button type="button" onClick={() => setStep('form')} disabled={pending} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Edit</button>
                  <button
                    type="button"
                    onClick={submitGrant}
                    disabled={pending || inspectUnavailable || reviewExpectedRevision === null}
                    className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {grantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {activeGrant ? 'Confirm replace' : 'Confirm grant'}
                  </button>
                </>
              )}
              {step === 'revoke' && (
                <>
                  <button type="button" onClick={() => setStep('form')} disabled={pending} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Back</button>
                  <button
                    type="button"
                    onClick={submitRevoke}
                    disabled={pending || inspectUnavailable || reviewExpectedRevision === null}
                    className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {revokeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm revoke
                  </button>
                </>
              )}
              {step === 'form' && (
                <button
                  type="button"
                  onClick={validateGrantDraft}
                  disabled={hasBlockingStripeSubscription || inspectUnavailable || pending}
                  className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Review {activeGrant ? 'replacement' : 'grant'}
                </button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
