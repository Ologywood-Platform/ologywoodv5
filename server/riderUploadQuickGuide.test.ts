import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getCanonicalNavigationAnswer, RIDER_UPLOAD_GUIDANCE } from './routers/aiChat';
const guide=readFileSync(resolve('client/src/components/RiderUploadQuickGuide.tsx'),'utf8');
const library=readFileSync(resolve('client/src/components/UploadedRiderLibrary.tsx'),'utf8');
const help=readFileSync(resolve('client/src/pages/Help.tsx'),'utf8');
describe('uploaded rider quick guide',()=>{
 it('uses an existing accessible popover without querying, uploading, or mutating any data',()=>{
  for(const text of ['PopoverTrigger asChild','type="button"','aria-label="How this works: uploaded PDF riders"','aria-labelledby={headingId}','useId()'])expect(guide).toContain(text);
  expect(guide).not.toMatch(/trpc|useQuery|useMutation|fetch\(|storageGet|storagePut|localStorage/);
 });
 it('explains actual controls, limits, plans, manager permission, privacy and retained versions',()=>{
  for(const text of ['Upload PDF','Save Upload','Set default','Attach PDF','Manage Riders','Team Workspace','Starter-or-higher','10 MB and 100 pages','plain PDF','Existing bookings do not change automatically','older booking PDFs stay unchanged','not historical booking attachments','does not sign a contract'])expect(guide).toContain(text);
 });
 it('is mounted beside upload only after the existing context/permission checks',()=>{
  expect(library).toContain('<RiderUploadQuickGuide />');
  expect(library.indexOf('if (!context.canManage)')).toBeLessThan(library.indexOf('<RiderUploadQuickGuide />'));
  expect(library).toContain('flex w-full flex-wrap items-center gap-2');
  expect(library).toContain('disabled={isBusy || !context.planAllowed}');
 });
 it('bounds the touch popover to the viewport and keeps it above existing notices',()=>{
  for(const text of ['--radix-popover-content-available-height','collisionPadding={16}','z-[71]','max-w-[calc(100vw-2rem)]','max-h-[calc(100dvh-2rem)]','overflow-y-auto'])expect(guide).toContain(text);
 });
 it('links to the exact existing Help article in a safe, explicitly labeled new tab',()=>{
  expect(guide).toContain('/help?article=rider-upload-guide#rider-upload-guide');
  expect(guide).toContain('rel="noopener noreferrer"');expect(guide).toContain('(opens in a new tab)');
  expect(help).toContain("id: 'rider-upload-guide'");expect(help).toContain('How this works beside Upload PDF opens a quick guide');
  expect(help).not.toContain('Upload My Rider');expect(RIDER_UPLOAD_GUIDANCE).not.toContain('Upload My Rider');
 });
 it.each(['How do I upload my rider?','Where is the rider quick guide?','Help with PDF riders'])('answers %s through the deterministic guide',message=>{
  expect(getCanonicalNavigationAnswer(message)).toBe(RIDER_UPLOAD_GUIDANCE);expect(RIDER_UPLOAD_GUIDANCE).toContain('How this works beside Upload PDF');
 });
});
