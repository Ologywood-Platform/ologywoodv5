import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';

export default function EduNoticeRecoveryPanel() {
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState('');
  const [decision, setDecision] = useState<'accepted' | 'not_accepted'>('accepted');
  const [evidence, setEvidence] = useState('');
  const [acceptedAt, setAcceptedAt] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [message, setMessage] = useState('');
  const list = trpc.edu.billingNotices.list.useQuery({ offset });
  const resolution = trpc.edu.billingNotices.resolve.useMutation({
    onSuccess: result => { setMessage(result.status === 'notice_confirmed' ? 'Provider acceptance recorded. No email was sent and no billing was changed.' : 'Definitive nonacceptance recorded. The existing scheduled job may now retry this notice; no email was sent here.'); setSelected(''); setEvidence(''); setAcknowledged(false); void list.refetch(); },
    onError: error => setMessage(error.message),
  });
  const time = acceptedAt ? new Date(acceptedAt) : null;
  const valid = acknowledged && evidence.trim().length >= 10 && evidence.length <= 500 && (decision !== 'accepted' || !!time && Number.isFinite(time.getTime()) && time.getTime() <= Date.now());
  return <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5" aria-label="EDU notice delivery review">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">EDU notice delivery review</h2><button type="button" disabled={list.isFetching || resolution.isPending} onClick={() => void list.refetch()} className="text-sm font-semibold text-purple-700 underline">Refresh notices</button></div>
    <p className="mt-2 text-sm text-slate-600">If a send timed out, check SendGrid activity before recording the result. Uncertain delivery is never retried automatically. This review does not send email, refund, cancel, or change a subscription.</p>
    {list.isLoading && <p role="status" className="mt-3 text-sm">Loading uncertain notices...</p>}
    {list.isError && <p role="alert" className="mt-3 text-sm text-red-700">Could not load notices. <button type="button" className="underline" onClick={() => void list.refetch()}>Retry</button></p>}
    {list.data?.notices.length === 0 && <p className="mt-3 text-sm text-slate-600">No uncertain notice deliveries need review.</p>}
    {list.data?.notices.map(notice => <div key={notice.noticeKey} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm">
      <span className="break-all">User {notice.userId} · {notice.kind.replaceAll('_', ' ')} · attempted {new Date(notice.createdAt).toLocaleString()}</span>
      <button type="button" className="font-semibold text-purple-700 underline" disabled={resolution.isPending || Date.now() - new Date(notice.createdAt).getTime() < 120000} onClick={() => { setSelected(notice.noticeKey); setMessage(''); setAcknowledged(false); setEvidence(''); }}>Review provider evidence</button>
    </div>)}
    {(offset > 0 || list.data?.hasMore) && <div className="mt-3 flex gap-4 text-sm"><button type="button" disabled={offset === 0 || list.isFetching} onClick={() => setOffset(Math.max(0, offset - 50))}>Previous notices</button><button type="button" disabled={!list.data?.hasMore || list.isFetching} onClick={() => setOffset(offset + 50)}>Next notices</button></div>}
    {selected && <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 text-sm">
      <p className="break-all text-slate-600">Notice: {selected}</p>
      <label className="block font-semibold">Provider result<select className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" value={decision} onChange={event => { setDecision(event.target.value as typeof decision); setAcknowledged(false); }}><option value="accepted">SendGrid confirms acceptance</option><option value="not_accepted">SendGrid definitively confirms it was not accepted</option></select></label>
      <label className="block font-semibold">Provider evidence (10–500 characters)<textarea rows={2} minLength={10} maxLength={500} value={evidence} onChange={event => setEvidence(event.target.value)} placeholder="Record the provider message ID, activity result, and timestamp. A timeout alone is not evidence." className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" /></label>
      {decision === 'accepted' && <label className="block font-semibold">Confirmed acceptance time (your local timezone)<input type="datetime-local" value={acceptedAt} onChange={event => setAcceptedAt(event.target.value)} className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" /></label>}
      <label className="flex items-start gap-2"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} /><span>I reviewed definitive provider evidence, not an uncertain timeout.</span></label>
      <div className="flex flex-wrap gap-4"><button type="button" className="rounded-lg bg-purple-700 px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={!valid || resolution.isPending || list.isError || list.isFetching} onClick={() => resolution.mutate({ noticeKey: selected, decision, providerEvidence: evidence.trim(), ...(decision === 'accepted' && time ? { acceptedAt: time.toISOString() } : {}) })}>{resolution.isPending ? 'Saving audit...' : 'Save evidence review'}</button><button type="button" disabled={resolution.isPending} onClick={() => setSelected('')}>Cancel review</button></div>
    </div>}
    {message && <p role="status" className="mt-3 text-sm text-slate-700">{message}</p>}
  </section>;
}
