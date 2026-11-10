import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, Loader2, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';
import SiteHeader from '@/components/SiteHeader';
import { trpc } from '@/lib/trpc';
import { setMetaTags } from '@/utils/seoMeta';
import { EDU_MANUAL_REVIEW_STATEMENT, getEffectiveEduStatus } from '@shared/eduPolicy';

const fieldClass = 'w-full rounded-lg border border-slate-300 px-3 py-2.5';
const date = (value: Date | string | null | undefined) => value ? new Date(value).toLocaleDateString() : 'not set';

export default function EduVerification() {
  const [institution, setInstitution] = useState('');
  const [program, setProgram] = useState('');
  const [method, setMethod] = useState<'school_email' | 'school_code' | 'manual'>('school_email');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [note, setNote] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmation, setConfirmation] = useState<{ renewal: boolean; revision: number } | null>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const statusQuery = trpc.edu.getStatus.useQuery();
  const submit = trpc.edu.submitVerification.useMutation({
    onSuccess: result => {
      setConfirmation({ renewal: result.renewalPending, revision: result.revision });
      setSchoolCode('');
      void statusQuery.refetch();
    },
    onError: () => setConfirmation(null),
  });
  useEffect(() => setMetaTags({ title: 'Verify OlogyWood EDU eligibility', description: 'Submit student eligibility evidence for manual OlogyWood EDU review.', canonical: '/edu/verify' }), []);
  useEffect(() => {
    if (confirmation) successRef.current?.focus();
  }, [confirmation]);

  const current = statusQuery.data?.verification;
  // Until refetch catches up, the successful response is newer than cached status.
  const awaitingSubmittedStatus = confirmation && (!current || current.revision < confirmation.revision);
  const effectiveStatus = awaitingSubmittedStatus && !confirmation.renewal ? 'pending' : getEffectiveEduStatus(current);
  const renewal = current?.status === 'approved';
  const renewalReviewPending = !!(current?.renewalSubmittedAt || (awaitingSubmittedStatus && confirmation.renewal));
  const submittedReviewPending = confirmation?.renewal ? renewalReviewPending : effectiveStatus === 'pending';
  const descriptions = {
    not_submitted: 'No evidence submitted yet.',
    pending: 'Your evidence is waiting for manual review.',
    active: `Eligibility is active through ${date(current?.verifiedUntil)}. Approval is not paid activation.`,
    grace: `Your verification period ended. Renewal grace is available through ${date(current?.graceUntil)}; submit updated evidence below.`,
    expired: 'Your verification and renewal grace have ended. Submit updated evidence for manual renewal review. Your account and creative work are retained.',
    rejected: current?.rejectionReason || 'Your evidence was not approved. You may submit updated evidence.',
    revoked: current?.rejectionReason || 'EDU eligibility was revoked. You may submit updated evidence for a new manual review.',
  };
  const submitForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (!acknowledged || submit.isPending || statusQuery.isLoading || statusQuery.isError) return;
    setConfirmation(null);
    submit.mutate({
      institution: institution.trim(), program: program.trim() || undefined, verificationMethod: method,
      schoolEmail: method === 'school_email' ? schoolEmail.trim() : undefined,
      schoolCode: method === 'school_code' ? schoolCode.trim() : undefined,
      verificationNote: note.trim(), evidenceAcknowledged: true,
    });
  };

  return <div className="min-h-screen bg-slate-50 text-slate-900"><SiteHeader /><main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-20">
    <Link href="/edu" className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-900"><ArrowLeft className="h-4 w-4" /> Back to OlogyWood EDU</Link>
    <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-700">Student eligibility · manual evidence review</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Request your EDU eligibility review.</h1>
        <p className="mt-5 leading-7 text-slate-600">Submitting or approving evidence does not create a paid subscription, change your plan, or charge your card. Eligible students can request 50% off Starter or Professional at checkout, subject to the verification deadline. Eligibility lasts 12 months with a 30-day renewal grace period; paid activation requires a separate successful checkout.</p>
        <div className="mt-6 space-y-3 text-sm text-slate-600">
          <div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-purple-700" />We retain review details and only the last four characters of a school code.</div>
          <div className="flex gap-3"><Clock3 className="h-5 w-5 shrink-0 text-purple-700" />{EDU_MANUAL_REVIEW_STATEMENT}</div>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold">Your current status</h2>
        {statusQuery.isLoading && <p role="status" className="mt-4 flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Loading EDU status...</p>}
        {statusQuery.isError && <div role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"><p>{statusQuery.error.message || 'We could not load your status. Sign in if needed and retry.'}</p><button type="button" onClick={() => void statusQuery.refetch()} disabled={statusQuery.isFetching} className="mt-2 underline">Retry status</button></div>}
        {statusQuery.data && <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50 p-4">
          <p className="font-semibold capitalize text-purple-950">{effectiveStatus.replace('_', ' ')}</p>
          <p className="mt-1 text-sm text-purple-900">{descriptions[effectiveStatus]}</p>
          {renewal && <p className="mt-2 text-xs text-purple-900">Verification deadline: {date(current.verifiedUntil)} · Grace deadline: {date(current.graceUntil)}</p>}
          {renewalReviewPending && <p className="mt-2 text-sm font-semibold">Renewal evidence is pending manual review. Existing dates are unchanged.</p>}
          {current?.renewalRejectionReason && !awaitingSubmittedStatus && <p className="mt-2 text-sm">Renewal not approved: {current.renewalRejectionReason}. Current eligibility dates remain unchanged.</p>}
        </div>}
        {statusQuery.data?.eligible && <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-5 w-5" />Eligible for discounted checkout; paid plan status is separate.</div>}
        {confirmation && <div ref={successRef} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true" aria-labelledby="edu-verification-success" className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 outline-none focus:ring-2 focus:ring-emerald-600">
          <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-emerald-600" />
          <h3 id="edu-verification-success" className="mt-3 text-xl font-bold text-emerald-950">{confirmation.renewal ? 'Renewal evidence submitted successfully.' : 'Verification evidence submitted successfully.'}</h3>
          <p className="mt-2 text-sm leading-6 text-emerald-900">{submittedReviewPending ? confirmation.renewal ? 'Your renewal evidence is pending manual review. Your current eligibility and grace dates are unchanged; renewal has not been approved.' : 'Your evidence is pending manual review. Submission is not eligibility approval.' : 'Your evidence was received for manual review. See Your current status above for the latest review outcome; submission itself is not approval.'}</p>
          <h4 className="mt-4 font-semibold text-emerald-950">What happens next</h4>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-emerald-900">
            <li>{submittedReviewPending ? 'An administrator will manually review your enrollment evidence.' : 'An administrator reviews enrollment evidence manually.'} A school email or code alone is not verification.</li>
            <li>Check Your current status on this page for the review outcome. Use Refresh status below to check again.</li>
            <li>Continue building your free profile and creative work in your workspace{submittedReviewPending ? ' while review is pending.' : '.'}</li>
          </ol>
          <p className="mt-4 text-sm font-semibold leading-6 text-emerald-950">This submission does not change your paid plan or charge a payment. Approved, current eligibility and a separate successful checkout are prerequisites for discounted paid activation; approval alone does not apply a discount to an existing subscription.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => void statusQuery.refetch()} disabled={statusQuery.isFetching} className="rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-60">{statusQuery.isFetching ? 'Refreshing status...' : 'Refresh status'}</button>
            <Link href="/workspace" className="inline-flex rounded-lg border border-purple-700 px-4 py-2.5 text-sm font-semibold text-purple-800 hover:bg-purple-50">Continue in your workspace</Link>
          </div>
        </div>}
        <form className="mt-6 space-y-4" onSubmit={submitForm}>
          <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edu-verify-institution">School or institution</label><input id="edu-verify-institution" required minLength={2} maxLength={200} value={institution} onChange={e => setInstitution(e.target.value)} className={fieldClass} /></div>
          <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edu-verify-program">Program or department <span className="font-normal text-slate-500">(optional)</span></label><input id="edu-verify-program" maxLength={200} value={program} onChange={e => setProgram(e.target.value)} className={fieldClass} /></div>
          <fieldset><legend className="mb-2 text-sm font-semibold">Evidence for manual review</legend><div className="grid gap-2 sm:grid-cols-3">{([['school_email', 'School email evidence'], ['school_code', 'School code evidence'], ['manual', 'Other evidence']] as const).map(([value, label]) => <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="radio" name="edu-method" value={value} checked={method === value} onChange={() => setMethod(value)} />{label}</label>)}</div></fieldset>
          {method === 'school_email' && <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edu-school-email">School email (not automatically ownership-verified)</label><input id="edu-school-email" type="email" required maxLength={320} value={schoolEmail} onChange={e => setSchoolEmail(e.target.value)} className={fieldClass} /></div>}
          {method === 'school_code' && <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edu-school-code">School code (not automatically validated)</label><input id="edu-school-code" required minLength={4} maxLength={64} autoComplete="off" value={schoolCode} onChange={e => setSchoolCode(e.target.value)} className={fieldClass} /><p className="mt-1 text-xs text-slate-500">Only the suffix is retained. Do not put the full code in your evidence note.</p></div>}
          <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edu-verify-note">Describe your enrollment evidence and connection to the school</label><textarea id="edu-verify-note" required minLength={10} maxLength={1000} rows={4} value={note} onChange={e => setNote(e.target.value)} className={`${fieldClass} resize-y`} /><p className="mt-1 text-xs text-slate-500">Describe current enrollment and how a reviewer can confirm it. Do not include passwords or sensitive identity documents.</p></div>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} className="mt-1" /><span>I confirm this evidence is accurate and understand that email/code entry alone is not verification; an administrator must manually review enrollment proof.</span></label>
          {submit.isError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{submit.error.message || 'We could not submit your evidence. Please retry.'}</p>}
          <button disabled={!acknowledged || submit.isPending || statusQuery.isLoading || statusQuery.isError} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-purple-700 px-4 py-3 font-semibold text-white hover:bg-purple-800 disabled:opacity-60">{submit.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : renewal ? 'Submit renewal evidence for manual review' : 'Submit evidence for manual review'}</button>
          <p className="text-xs leading-5 text-slate-500">Renewal submissions do not clear current eligibility or grace. Approval alone never activates a discount on an existing paid subscription.</p>
        </form>
        <Link href="/help?article=edu-enrollment-guide" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-purple-700 underline">EDU enrollment and renewal help (opens a new tab)</Link>
      </section>
    </div>
  </main></div>;
}
