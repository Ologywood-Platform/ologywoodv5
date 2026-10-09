import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { getCanonicalNavigationAnswer, COMPLIMENTARY_ACCESS_GUIDANCE } from './routers/aiChat';
describe('Complimentary plan support guidance',()=>{
 it.each(['How can I grant free access?', 'Where is complimentary access?', 'Does complimentary access waive fees?'])('answers %s using current verified-owner directions',query=>{
  expect(getCanonicalNavigationAnswer(query)).toBe(COMPLIMENTARY_ACCESS_GUIDANCE);
  expect(COMPLIMENTARY_ACCESS_GUIDANCE).toContain('Admin → Users → Manage complimentary access');
  expect(COMPLIMENTARY_ACCESS_GUIDANCE).toContain('does not cancel Stripe billing');
  expect(COMPLIMENTARY_ACCESS_GUIDANCE).toContain('does not give admin permissions');
  expect(COMPLIMENTARY_ACCESS_GUIDANCE).toContain('period-end or unverified cancelled');
 });
 it('documents expiry, no automatic charges and no public redemption codes in Help',()=>{
  const help=readFileSync(new URL('../client/src/pages/Help.tsx',import.meta.url),'utf8');
  expect(help).toContain('Manage complimentary access');
  expect(help).toContain('no paid subscription is started automatically');
  expect(help).toContain('There is no public redemption code');
 });
});
