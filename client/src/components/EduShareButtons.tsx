import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Facebook, Linkedin, Share2 } from 'lucide-react';
import { Link } from 'wouter';
import { EDU_SHARE_URL, EDU_SHARE_TEXT, EDU_SOCIAL_LINKS } from '@shared/eduShare';

/** Copy only the public EDU URL. A failed copy must never look successful. */
export async function copyEduShareLink(): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(EDU_SHARE_URL); return; } catch { /* Try the browser's legacy copy path. */ }
  }
  if (typeof document === 'undefined') throw new Error('Copy unavailable');
  const previousFocus = document.activeElement as HTMLElement | null;
  const field = document.createElement('textarea');
  field.value = EDU_SHARE_URL;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed'; field.style.opacity = '0';
  document.body.appendChild(field);
  try {
    field.select();
    if (typeof document.execCommand !== 'function' || !document.execCommand('copy')) throw new Error('Copy unavailable');
  } finally { field.remove(); previousFocus?.focus?.(); }
}

const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-colors hover:border-purple-300/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 disabled:cursor-wait disabled:opacity-60';
export default function EduShareButtons() {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [notice, setNotice] = useState('');
  const [manualCopy, setManualCopy] = useState(false);
  const [nativeSupported, setNativeSupported] = useState(false);
  const [sharing, setSharing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyBusy = useRef(false);
  const shareBusy = useRef(false);
  useEffect(() => {
    setNativeSupported(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);
  const copy = async () => {
    if (copyBusy.current) return;
    copyBusy.current = true; setCopying(true); setNotice(''); setCopied(false);
    try {
      await copyEduShareLink(); setCopied(true); setManualCopy(false); setNotice('EDU link copied.');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch { setManualCopy(true); setNotice('Copy was unavailable. Select and copy the link below.'); }
    finally { copyBusy.current = false; setCopying(false); }
  };
  const deviceShare = async () => {
    if (shareBusy.current) return;
    if (typeof navigator.share !== 'function') return copy();
    shareBusy.current = true; setSharing(true); setNotice('');
    try { await navigator.share({ title: 'OlogyWood EDU', text: EDU_SHARE_TEXT, url: EDU_SHARE_URL }); }
    catch (error) {
      if (!(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')) setNotice('Could not open device sharing. Try Copy link.');
    } finally { shareBusy.current = false; setSharing(false); }
  };
  return <div className="mt-6" role="group" aria-label="Share OlogyWood EDU">
    <p className="mb-2 text-sm text-slate-300">Share with your classmates</p>
    <div className="flex flex-wrap gap-2">
      <a className={buttonClass} href={EDU_SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Share OlogyWood EDU on Facebook (opens a new tab)"><Facebook className="h-4 w-4" aria-hidden="true" />Facebook</a>
      <a className={buttonClass} href={EDU_SOCIAL_LINKS.x} target="_blank" rel="noopener noreferrer" aria-label="Share OlogyWood EDU on X (opens a new tab)">X</a>
      <a className={buttonClass} href={EDU_SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Share OlogyWood EDU on LinkedIn (opens a new tab)"><Linkedin className="h-4 w-4" aria-hidden="true" />LinkedIn</a>
      <button type="button" className={buttonClass} onClick={copy} disabled={copying}>{copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied ? 'Copied' : copying ? 'Copying…' : 'Copy link'}</button>
      {nativeSupported && <button type="button" className={buttonClass} onClick={deviceShare} disabled={sharing} aria-label="More sharing options on your device"><Share2 className="h-4 w-4" aria-hidden="true" />{sharing ? 'Sharing…' : 'More'}</button>}
    </div>
    <p role="status" aria-live="polite" className={notice && !copied ? 'mt-2 text-sm text-purple-200' : 'sr-only'}>{notice}</p>
    {manualCopy && <input aria-label="EDU link to copy manually" readOnly value={EDU_SHARE_URL} onFocus={event => event.currentTarget.select()} className="mt-2 block w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-300" />}
    <Link href="/help?article=edu-sharing-guide" className="mt-2 inline-block text-xs text-purple-300 underline underline-offset-4 hover:text-purple-200">Sharing help</Link>
  </div>;
}
