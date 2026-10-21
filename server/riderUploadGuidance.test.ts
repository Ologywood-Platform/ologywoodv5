import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { getCanonicalNavigationAnswer, RIDER_UPLOAD_GUIDANCE, MUSIC_SINGLE_MANAGEMENT_GUIDANCE } from './routers/aiChat';
describe('uploaded rider guidance',()=>{
 it.each(['How do I upload my rider?','Can my manager add a PDF rider?','How do I replace a ryder document?','Who can view my private rider?','Set a default rider'])('answers %s without a model call',message=>expect(getCanonicalNavigationAnswer(message)).toBe(RIDER_UPLOAD_GUIDANCE));
 it('explains opt-in manager authority, private versions, paid creation and non-signing behavior',()=>{
  for(const text of ['10 MB','100 pages','Manage Riders','Team Workspace','Starter-or-higher','old booking attachments','not historical PDFs','after a plan downgrade','automatically sign','move payments'])expect(RIDER_UPLOAD_GUIDANCE).toContain(text);
 });
 it('keeps existing single-edit/sharing guidance unchanged',()=>expect(getCanonicalNavigationAnswer('How do I share a single?')).toBe(MUSIC_SINGLE_MANAGEMENT_GUIDANCE));
 it('adds a directly linkable Help article within Booking & Contracts',()=>{
  const help=readFileSync(new URL('../client/src/pages/Help.tsx',import.meta.url),'utf8');expect(help).toContain("id: 'rider-upload-guide'");expect(help).toContain('versions already attached to bookings remain unchanged');expect(help).toContain('does not erase historical booking attachments');expect(help).toContain('role or Upload Media permission alone is not enough');
 });
});
