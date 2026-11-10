import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Loader2, ShieldAlert, X } from 'lucide-react';
import { Link } from 'wouter';
import SiteHeader from '@/components/SiteHeader';
import { trpc } from '@/lib/trpc';
import { setMetaTags } from '@/utils/seoMeta';
import EduNoticeRecoveryPanel from '@/components/EduNoticeRecoveryPanel';
import { EDU_MANUAL_REVIEW_STATEMENT, getEffectiveEduStatus, getPermittedEduReviewActions, type EduReviewDecision } from '@shared/eduPolicy';

const date = (value: Date | string | null) => value ? new Date(value).toLocaleString() : 'not set';
const labels: Record<EduReviewDecision, string> = { approve: 'Approve initial eligibility', renew: 'Approve renewal', reject: 'Reject evidence', revoke: 'Revoke eligibility' };

export default function EduAdmin() {
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [proof, setProof] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const list = trpc.edu.adminList.useQuery();
  const review = trpc.edu.adminReview.useMutation({
    onSuccess: (_, input) => {
      setMessage('Review and audit saved. Eligibility approval is not paid activation.');
      setError('');
      setNotes(current => ({ ...current, [input.verificationId]: '' }));
      setProof(current => ({ ...current, [`${input.verificationId}:${input.expectedRevision}`]: false }));
      void list.refetch();
    },
    onError: error => {
      setError(error.message || 'We could not save the review.');
      if (error.data?.code === 'CONFLICT') {
        setProof({});
        void list.refetch();
      }
    },
  });
  useEffect(() => setMetaTags({ title: 'EDU verification review', description: 'Manually review OlogyWood EDU enrollment evidence.', canonical: '/admin/edu' }), []);
  const act = (verificationId: number, expectedRevision: number, decision: EduReviewDecision) => {
    if (review.isPending || list.isFetching || list.isError) return;
    const note = (notes[verificationId] || '').trim();
    setMessage('');
    if (note.length < 3 || note.length > 500) return setError('Enter a review note between 3 and 500 characters.');
    const proofConfirmed = !!proof[`${verificationId}:${expectedRevision}`];
    if ((decision === 'approve' || decision === 'renew') && !proofConfirmed) return setError('Confirm manual review of documented enrollment proof before approval.');
    setError('');
    review.mutate({ verificationId, expectedRevision, decision, note, manualProofConfirmed: proofConfirmed });
  };

  return <div className="min-h-screen bg-slate-50 text-slate-900"><SiteHeader /><main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div>
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700"><ArrowLeft className="h-4 w-4" /> Back to Admin Dashboard</Link>
      <h1 className="mt-4 text-3xl font-bold">EDU manual evidence review</h1>
      <p className="mt-1 text-slate-600">Approve only documented enrollment proof. Eligibility permits a 50% Starter/Professional discount at a separate checkout; approval never activates a paid plan or applies a coupon by itself.</p>
      <p className="mt-2 text-sm text-slate-600">{EDU_MANUAL_REVIEW_STATEMENT}</p>
    </div><ShieldAlert className="h-9 w-9 text-purple-700" /></div>
    {list.isError && <div role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"><p>{list.error.message || 'We could not load EDU requests.'}</p><button type="button" disabled={list.isFetching} onClick={() => void list.refetch()} className="mt-2 underline">Retry requests</button></div>}
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    <div className="mt-8 space-y-4">
      {list.isLoading && <p role="status" className="text-sm text-slate-600">Loading verification requests...</p>}
      {list.data?.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">No EDU verification requests yet.</div>}
      {list.data?.map(({ verification, user }) => {
        const actions = getPermittedEduReviewActions(verification);
        const proofKey = `${verification.id}:${verification.revision}`;
        const renewal = !!verification.renewalSubmittedAt;
        const evidence = renewal ? {
          institution: verification.renewalInstitution, program: verification.renewalProgram,
          method: verification.renewalVerificationMethod, email: verification.renewalSchoolEmail,
          code: verification.renewalSchoolCodeLast4, note: verification.renewalVerificationNote,
          acknowledged: verification.renewalEvidenceAcknowledged,
        } : {
          institution: verification.institution, program: verification.program,
          method: verification.verificationMethod, email: verification.schoolEmail,
          code: verification.schoolCodeLast4, note: verification.verificationNote,
          acknowledged: verification.evidenceAcknowledged,
        };
        const noteLength = (notes[verification.id] || '').trim().length;
        return <article key={`${verification.id}:${verification.revision}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4"><div>
            <h2 className="font-semibold">{user?.name || 'Unnamed account'} <span className="font-normal text-slate-500">({user?.email || 'no email'})</span></h2>
            <p className="mt-1 text-sm text-slate-600">Current record: {verification.institution}{verification.program ? ` · ${verification.program}` : ''} · revision {verification.revision}</p>
            <p className="mt-1 text-xs text-slate-500">Verified until {date(verification.verifiedUntil)} · Grace until {date(verification.graceUntil)}</p>
          </div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize">{getEffectiveEduStatus(verification)}{renewal ? ' · renewal pending' : ''}</span></div>
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
            <h3 className="font-semibold">{renewal ? 'Pending renewal evidence (current eligibility unchanged)' : 'Submitted evidence'} · MANUAL EVIDENCE REVIEW</h3>
            <p className="mt-1">Institution: {evidence.institution || 'not provided'}{evidence.program ? ` · ${evidence.program}` : ''}</p>
            <p className="mt-1">Evidence route: {evidence.method?.replace('_', ' ') || 'not provided'}</p>
            <p className="mt-1 break-all">School email: {evidence.email || 'not provided'} (ownership not automatically verified)</p>
            <p className="mt-1">School code suffix: {evidence.code ? `…${evidence.code}` : 'not provided'} (not automatically validated)</p>
            <p className="mt-2 whitespace-pre-wrap break-words">{evidence.note || 'No evidence note provided.'}</p>
            <p className="mt-2 text-xs text-slate-500">Applicant acknowledged manual review: {evidence.acknowledged ? 'yes' : 'no (legacy submission)'}</p>
          </div>
          {verification.renewalRejectionReason && <p className="mt-3 text-sm text-red-700">Last renewal rejected: {verification.renewalRejectionReason}</p>}
          {verification.rejectionReason && <p className="mt-3 text-sm text-red-700">Review reason: {verification.rejectionReason}</p>}
          {actions.length > 0 ? <div className="mt-4 space-y-3">
            <label className="block text-sm font-semibold">Review note (3–500 characters)<textarea value={notes[verification.id] || ''} onChange={e => setNotes(current => ({ ...current, [verification.id]: e.target.value }))} minLength={3} maxLength={500} rows={2} placeholder="Document the enrollment proof you manually reviewed, or why the evidence was declined." className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label>
            {(actions.includes('approve') || actions.includes('renew')) && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={!!proof[proofKey]} onChange={e => setProof(current => ({ ...current, [proofKey]: e.target.checked }))} className="mt-1" /><span>I manually reviewed documented current enrollment proof. A supplied school email/code alone is not sufficient proof. This decision approves eligibility, not paid activation.</span></label>}
            <div className="flex flex-wrap gap-2">{actions.map(decision => <button key={decision} type="button" onClick={() => act(verification.id, verification.revision, decision)} disabled={review.isPending || list.isFetching || list.isError || noteLength < 3 || noteLength > 500 || ((decision === 'approve' || decision === 'renew') && !proof[proofKey])} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 ${decision === 'revoke' ? 'bg-red-600' : decision === 'reject' ? 'bg-slate-700' : 'bg-emerald-600'}`}>{decision === 'approve' || decision === 'renew' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}{decision === 'reject' && renewal ? 'Reject renewal (keep current eligibility)' : labels[decision]}</button>)}</div>
          </div> : <p className="mt-4 text-sm text-slate-500">A new student evidence submission is required before another approval review.</p>}
        </article>;
      })}
    </div>
    {review.isPending && <p role="status" className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Saving review and audit...</p>}
    <EduNoticeRecoveryPanel />
  </main></div>;
}
