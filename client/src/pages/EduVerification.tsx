import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, Loader2, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';
import SiteHeader from '@/components/SiteHeader';
import { trpc } from '@/lib/trpc';
import { setMetaTags } from '@/utils/seoMeta';

export default function EduVerification() {
  const [institution, setInstitution] = useState('');
  const [program, setProgram] = useState('');
  const [method, setMethod] = useState<'school_email' | 'school_code' | 'manual'>('school_email');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const statusQuery = trpc.edu.getStatus.useQuery();
  const submit = trpc.edu.submitVerification.useMutation({
    onSuccess: () => { setMessage('Submitted for review. We will update your EDU status after verification.'); statusQuery.refetch(); },
    onError: error => setMessage(error.message || 'We could not submit your verification request.'),
  });

  useEffect(() => setMetaTags({ title: 'Verify OlogyWood EDU eligibility', description: 'Submit student eligibility information for OlogyWood EDU review.', canonical: '/edu/verify' }), []);

  const current = statusQuery.data?.verification;
  const submitForm = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    submit.mutate({
      institution: institution.trim(),
      program: program.trim() || undefined,
      verificationMethod: method,
      schoolEmail: method === 'school_email' ? schoolEmail.trim() : undefined,
      schoolCode: method === 'school_code' ? schoolCode.trim() : undefined,
      verificationNote: note.trim(),
    });
  };

  return <div className="min-h-screen bg-slate-50 text-slate-900"><SiteHeader /><main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-20">
    <Link href="/edu" className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-900"><ArrowLeft className="h-4 w-4" /> Back to OlogyWood EDU</Link>
    <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <section><p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-700">Student verification</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Request your EDU eligibility review.</h1><p className="mt-5 leading-7 text-slate-600">Verification is separate from billing. Submitting this form does not create a paid subscription, change your plan, or charge your card. Once approved, eligible students can apply the 50% discount to Starter or Professional checkout for up to 12 months, plus the documented renewal grace period.</p><div className="mt-6 space-y-3 text-sm text-slate-600"><div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-purple-700" />We store only the verification details needed for review and audit.</div><div className="flex gap-3"><Clock3 className="h-5 w-5 shrink-0 text-purple-700" />School-email, school-code, and manual review paths are supported.</div></div></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-bold">Your current status</h2>{current && <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50 p-4"><p className="font-semibold capitalize text-purple-950">{current.status}</p><p className="mt-1 text-sm text-purple-900">{current.status === 'approved' ? `Eligible through ${new Date(current.verifiedUntil || '').toLocaleDateString()}.` : current.status === 'pending' ? 'Your request is waiting for an EDU review.' : current.rejectionReason || 'You may submit updated information below.'}</p></div>}{statusQuery.data?.eligible && <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-5 w-5" /> EDU discount eligibility is active for approved checkout.</div>}
      <form className="mt-6 space-y-4" onSubmit={submitForm}><div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edu-verify-institution">School or institution</label><input id="edu-verify-institution" required maxLength={200} value={institution} onChange={e => setInstitution(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" /></div><div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edu-verify-program">Program or department <span className="font-normal text-slate-500">(optional)</span></label><input id="edu-verify-program" maxLength={200} value={program} onChange={e => setProgram(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" /></div><fieldset><legend className="mb-2 text-sm font-semibold">Verification method</legend><div className="grid gap-2 sm:grid-cols-3">{([['school_email', 'School email'], ['school_code', 'School code'], ['manual', 'Manual review']] as const).map(([value, label]) => <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="radio" name="edu-method" value={value} checked={method === value} onChange={() => setMethod(value)} />{label}</label>)}</div></fieldset>{method === 'school_email' && <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edu-school-email">School email</label><input id="edu-school-email" type="email" required maxLength={320} value={schoolEmail} onChange={e => setSchoolEmail(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" /></div>}{method === 'school_code' && <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edu-school-code">School code</label><input id="edu-school-code" required maxLength={64} value={schoolCode} onChange={e => setSchoolCode(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" /></div>}<div><label className="mb-1.5 block text-sm font-semibold" htmlFor="edu-verify-note">Tell us how you are connected to the school</label><textarea id="edu-verify-note" required minLength={10} maxLength={1000} rows={4} value={note} onChange={e => setNote(e.target.value)} className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5" /></div>{message && <p role="status" className="rounded-lg bg-purple-50 px-3 py-2.5 text-sm text-purple-900">{message}</p>}<button disabled={submit.isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-purple-700 px-4 py-3 font-semibold text-white hover:bg-purple-800 disabled:opacity-60">{submit.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : 'Submit for review'}</button><p className="text-xs leading-5 text-slate-500">The EDU discount is not applied until an admin approves your request. Existing subscriptions and account access are unchanged.</p></form></section>
    </div>
  </main></div>;
}
