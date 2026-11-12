import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({ status: {} as any, list: {} as any, review: {} as any, submit: {} as any, notices: {} as any }));
vi.mock('@/lib/trpc', () => ({ trpc: { edu: {
  getStatus: { useQuery: () => hooks.status },
  adminList: { useQuery: () => hooks.list },
  adminReview: { useMutation: () => hooks.review },
  submitVerification: { useMutation: () => hooks.submit },
  billingNotices: { list: { useQuery: () => hooks.notices }, resolve: { useMutation: () => ({ isPending: false }) } },
} } }));
vi.mock('@/components/SiteHeader', () => ({ default: () => null }));
vi.mock('@/utils/seoMeta', () => ({ setMetaTags: vi.fn() }));
vi.mock('wouter', () => ({ Link: ({ children, href, ...props }: any) => React.createElement('a', { href, ...props }, children) }));
import EduAdmin from '../client/src/pages/EduAdmin';
import EduVerification from '../client/src/pages/EduVerification';

const future = new Date('2099-01-01T00:00:00Z');
const past = new Date('2000-01-01T00:00:00Z');
function verification(overrides = {}) {
  return {
    id: 11, status: 'approved', revision: 3, institution: 'Original School', program: null,
    verificationMethod: 'school_email', schoolEmail: 'student@school.test', schoolCodeLast4: null,
    verificationNote: 'Enrollment evidence', evidenceAcknowledged: true, rejectionReason: null,
    verifiedUntil: future, graceUntil: future, renewalSubmittedAt: null, renewalRejectionReason: null,
    ...overrides,
  };
}

beforeEach(() => {
  hooks.status = { data: { verification: null, eligible: false }, refetch: vi.fn(), isLoading: false, isError: false, isFetching: false };
  hooks.list = { data: [], refetch: vi.fn(), isLoading: false, isError: false, isFetching: false };
  hooks.review = { isPending: false };
  hooks.submit = { isPending: false, isError: false };
  hooks.notices = { data: { notices: [], hasMore: false }, refetch: vi.fn(), isLoading: false, isError: false, isFetching: false };
});

describe('EDU mocked React rendering', () => {
  it('escapes applicant/account/email/code/note evidence and shows distinct renewal proof controls', () => {
    const malicious = '<script>alert("edu")</script>';
    hooks.list.data = [{ user: { name: malicious, email: malicious }, verification: verification({
      renewalSubmittedAt: new Date(), renewalInstitution: malicious, renewalProgram: malicious,
      renewalVerificationMethod: 'school_code', renewalSchoolEmail: malicious,
      renewalSchoolCodeLast4: '<>&"', renewalVerificationNote: malicious, renewalEvidenceAcknowledged: true,
    }) }];
    const html = renderToStaticMarkup(React.createElement(EduAdmin));
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('…&lt;&gt;&amp;&quot;');
    expect(html).toContain('MANUAL EVIDENCE REVIEW');
    expect(html).toContain('School email:');
    expect(html).toContain('ownership not automatically verified');
    expect(html).toContain('Approve renewal');
    expect(html).not.toContain('Approve initial eligibility');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('maxLength="500"');
    expect(html).toContain('current eligibility unchanged');
    expect(html).toContain('href="/edu/verify"');
    expect(html).toContain('View the student verification flow');
  });

  it.each([
    ['active', { verifiedUntil: future, graceUntil: future }],
    ['grace', { verifiedUntil: past, graceUntil: future }],
    ['expired', { verifiedUntil: past, graceUntil: past }],
    ['revoked', { status: 'revoked', verifiedUntil: future, graceUntil: future }],
  ])('renders clear %s student eligibility separately from billing', (label, dates) => {
    hooks.status.data = { verification: verification(dates), eligible: label === 'active' || label === 'grace' };
    const html = renderToStaticMarkup(React.createElement(EduVerification));
    expect(html).toContain(`>${label}</p>`);
    expect(html).toContain('paid activation requires a separate successful checkout');
    expect(html).toContain('email/code entry alone is not verification');
    expect(html).toContain('type="checkbox"');
    if (label !== 'revoked') expect(html).toContain('Submit renewal evidence for manual review');
  });

  it('shows query failures and retry controls instead of an empty success state', () => {
    hooks.status = { ...hooks.status, data: undefined, isError: true, error: { message: 'Student query failed' } };
    hooks.list = { ...hooks.list, data: undefined, isError: true, error: { message: 'Admin query failed' } };
    const student = renderToStaticMarkup(React.createElement(EduVerification));
    const admin = renderToStaticMarkup(React.createElement(EduAdmin));
    expect(student).toContain('role="alert"');
    expect(student).toContain('Student query failed');
    expect(student).toContain('Retry status');
    expect(admin).toContain('Admin query failed');
    expect(admin).toContain('Retry requests');
  });

  it('shows loading and submission errors explicitly', () => {
    hooks.status = { ...hooks.status, data: undefined, isLoading: true };
    hooks.list = { ...hooks.list, data: undefined, isLoading: true };
    hooks.submit = { ...hooks.submit, isError: true, error: { message: 'Evidence save failed' } };
    const student = renderToStaticMarkup(React.createElement(EduVerification));
    const admin = renderToStaticMarkup(React.createElement(EduAdmin));
    expect(student).toContain('Loading EDU status');
    expect(student).toContain('Evidence save failed');
    expect(admin).toContain('Loading verification requests');
  });
});
