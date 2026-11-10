import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Vitest uses Node and has no DOM renderer dependency. Execute the real pages,
// preserve hook state across renders, invoke their actual event/callback handlers,
// and render the resulting React elements with the existing SSR test convention.
const runtime = vi.hoisted(() => ({
  cells: [] as any[], cursor: 0, effects: [] as Array<() => void>,
  contact: {} as any, evidence: {} as any, status: {} as any,
  contactOptions: {} as any, evidenceOptions: {} as any,
}));
vi.mock('react', async importOriginal => {
  const actual = await importOriginal<typeof import('react')>();
  const hooks = {
    useState(initial: any) {
      const index = runtime.cursor++;
      if (!(index in runtime.cells)) runtime.cells[index] = typeof initial === 'function' ? initial() : initial;
      return [runtime.cells[index], (value: any) => {
        runtime.cells[index] = typeof value === 'function' ? value(runtime.cells[index]) : value;
      }];
    },
    useRef(initial: any) {
      const index = runtime.cursor++;
      if (!(index in runtime.cells)) runtime.cells[index] = { current: initial };
      return runtime.cells[index];
    },
    useMemo(factory: () => any, dependencies: any[]) {
      const index = runtime.cursor++;
      const previous = runtime.cells[index];
      if (!previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
        runtime.cells[index] = { value: factory(), dependencies };
      }
      return runtime.cells[index].value;
    },
    useEffect(effect: () => void, dependencies?: any[]) {
      const index = runtime.cursor++;
      const previous = runtime.cells[index];
      if (!previous || !dependencies || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
        runtime.effects.push(effect);
      }
      runtime.cells[index] = { dependencies };
    },
  };
  return { ...actual, ...hooks, default: { ...actual.default, ...hooks } };
});
vi.mock('@/lib/trpc', () => ({ trpc: {
  contact: { submit: { useMutation: (options: any) => { runtime.contactOptions = options; return runtime.contact; } } },
  edu: {
    getStatus: { useQuery: () => runtime.status },
    submitVerification: { useMutation: (options: any) => { runtime.evidenceOptions = options; return runtime.evidence; } },
  },
} }));
vi.mock('@/components/SiteHeader', () => ({ default: () => null }));
vi.mock('@/utils/seoMeta', () => ({ setMetaTags: vi.fn() }));
vi.mock('wouter', () => ({ Link: ({ children, href, ...props }: any) => React.createElement('a', { href, ...props }, children) }));
import EduApply from '../client/src/pages/EduApply';
import EduVerification from '../client/src/pages/EduVerification';

type Element = React.ReactElement<any>;
function descendants(node: React.ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(descendants);
  if (!React.isValidElement(node)) return [];
  const element = node as Element;
  return [element, ...descendants(element.props.children)];
}
function text(node: React.ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join('');
  if (React.isValidElement(node)) return text((node as Element).props.children);
  return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}
function mount(Page: () => Element) {
  let tree: Element;
  const render = () => {
    runtime.cursor = 0;
    runtime.effects = [];
    tree = Page();
    for (const element of descendants(tree)) {
      if (element.props.ref && typeof element.props.ref === 'object') {
        element.props.ref.current ??= { focus: vi.fn() };
      }
    }
    const effects = runtime.effects.slice();
    effects.forEach(effect => effect());
    return tree;
  };
  const find = (predicate: (element: Element) => boolean) => {
    const result = descendants(tree).find(predicate);
    if (!result) throw new Error('Expected element not found');
    return result;
  };
  render();
  render(); // Apply mount effects (including the ?path=school parameter).
  return {
    render, find,
    html: () => renderToStaticMarkup(tree),
    field: (id: string) => find(element => element.props.id === id),
    change(id: string, value: string) {
      find(element => element.props.id === id).props.onChange({ target: { value } });
      render();
    },
    click(label: string) {
      find(element => element.type === 'button' && text(element.props.children) === label).props.onClick();
      render();
    },
    submit() {
      find(element => element.type === 'form').props.onSubmit({ preventDefault: vi.fn() });
      render();
    },
    success: () => descendants(tree).find(element => element.props['aria-labelledby'] === 'edu-interest-success' || element.props['aria-labelledby'] === 'edu-verification-success'),
  };
}
function mutation() {
  const state = { isPending: false, isError: false, error: null as any, mutate: vi.fn() };
  state.mutate.mockImplementation(() => { state.isPending = true; state.isError = false; state.error = null; });
  return state;
}
function resolveContact() {
  runtime.contact.isPending = false;
  runtime.contactOptions.onSuccess({ success: true }, runtime.contact.mutate.mock.lastCall[0]);
}
function rejectContact(message = 'Interest could not be saved') {
  runtime.contact.isPending = false;
  runtime.contact.isError = true;
  runtime.contact.error = { message };
  runtime.contactOptions.onError(runtime.contact.error);
}
function resolveEvidence(renewalPending: boolean, revision = 1) {
  runtime.evidence.isPending = false;
  runtime.evidenceOptions.onSuccess({ success: true, status: renewalPending ? 'approved' : 'pending', renewalPending, revision });
}
function fillInterest(view: ReturnType<typeof mount>, email = ' student@school.test ') {
  view.change('edu-name', ' Student Name ');
  view.change('edu-email', email);
  view.change('edu-school', ' Example School ');
  view.change('edu-program', ' Creative Arts ');
  view.change('edu-message', ' I want to build a creative portfolio. ');
}
function fillEvidence(view: ReturnType<typeof mount>, method: 'school_email' | 'school_code' = 'school_email') {
  view.change('edu-verify-institution', 'Example School');
  view.change('edu-verify-note', 'Currently enrolled; school can confirm enrollment.');
  if (method === 'school_code') {
    view.find(element => element.type === 'input' && element.props.value === 'school_code').props.onChange();
    view.render();
    view.change('edu-school-code', 'SENSITIVE-COHORT-CODE');
  } else view.change('edu-school-email', 'student@school.test');
  view.find(element => element.type === 'input' && element.props.type === 'checkbox').props.onChange({ target: { checked: true } });
  view.render();
}
function expectAccessibleSuccess(view: ReturnType<typeof mount>) {
  const region = view.success()!;
  expect(region).toBeDefined();
  expect(region.props).toMatchObject({ role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true', tabIndex: -1 });
  expect(region.props.ref.current.focus).toHaveBeenCalledTimes(1);
}

beforeEach(() => {
  runtime.cells = [];
  runtime.cursor = 0;
  runtime.effects = [];
  runtime.contact = mutation();
  runtime.evidence = mutation();
  runtime.status = { data: { verification: null, eligible: false }, refetch: vi.fn(), isLoading: false, isError: false, isFetching: false };
  vi.stubGlobal('window', { location: { search: '' } });
});

describe('EDU interest submission feedback (offline mocked runtime)', () => {
  it('waits for actual success and gives students free-profile, evidence, and status actions', () => {
    const view = mount(EduApply);
    fillInterest(view);
    expect(view.success()).toBeUndefined();
    view.submit();
    expect(runtime.contact.mutate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Student Name', email: 'student@school.test', subject: 'EDU Student Interest', website: '' }));
    expect(view.html()).toContain('Sending...');
    expect(view.success()).toBeUndefined();
    expect(view.find(element => element.type === 'button' && element.props.type === 'submit').props.disabled).toBe(true);
    resolveContact();
    view.render();
    expectAccessibleSuccess(view);
    const html = renderToStaticMarkup(view.success()!);
    expect(html).toContain('Student interest submitted successfully.');
    expect(html).toContain('student@school.test');
    expect(html).toContain('href="/"');
    expect(html).toContain('Create or sign in to a free profile');
    expect(html).toContain('href="/edu/verify"');
    expect(html).toContain('Check your review status on that page');
    expect(html).toContain('did not create an account, approve your eligibility, or charge any payment');
    expect(html).toContain('separate successful checkout');
    expect(html).not.toMatch(/we.{0,10}emailed|email (?:has been|was) sent|within \d+|automatically approved/i);
  });

  it('routes school submissions to team follow-up, never student verification or automatic pilot billing', () => {
    vi.stubGlobal('window', { location: { search: '?path=school' } });
    const view = mount(EduApply);
    fillInterest(view, ' faculty@school.test ');
    view.submit();
    expect(view.success()).toBeUndefined();
    expect(runtime.contact.mutate.mock.lastCall[0].subject).toBe('EDU School Pilot');
    resolveContact();
    view.render();
    expectAccessibleSuccess(view);
    expect(view.html()).toContain('School interest submitted successfully.');
    expect(view.html()).toContain('follow up at');
    expect(view.html()).toContain('faculty@school.test');
    expect(view.html()).toContain('Prepare your cohort goals');
    expect(view.html()).toContain('does not automatically activate a school pilot or start billing');
    expect(view.html()).toContain('href="/edu"');
    expect(view.html()).not.toContain('href="/edu/verify"');
    expect(view.html()).not.toContain('Create or sign in to a free profile');
  });

  it.each(['student', 'school'] as const)('binds late %s success to the completed request and disables conflicting tabs', submittedPath => {
    vi.stubGlobal('window', { location: { search: submittedPath === 'school' ? '?path=school' : '' } });
    const view = mount(EduApply);
    fillInterest(view, ' original@school.test ');
    // Keep a stale tab handler to emulate an interaction queued before pending.
    const otherTab = view.find(element => element.props.role === 'tab' && !element.props['aria-selected']).props.onClick;
    view.submit();
    expect(descendants(view.render()).filter(element => element.props.role === 'tab').every(element => element.props.disabled)).toBe(true);
    // A duplicate pending submit does not send another request.
    view.submit();
    expect(runtime.contact.mutate).toHaveBeenCalledTimes(1);
    otherTab();
    view.render();
    view.change('edu-email', 'later@different.test');
    resolveContact();
    view.render();
    const html = renderToStaticMarkup(view.success()!);
    expect(html).toContain(submittedPath === 'school' ? 'School interest submitted successfully.' : 'Student interest submitted successfully.');
    expect(html).toContain('original@school.test');
    expect(html).not.toContain('later@different.test');
    expect(html.includes('href="/edu/verify"')).toBe(submittedPath === 'student');
    expect(view.find(element => element.props.role === 'tab' && element.props['aria-selected']).props.children).toBe(submittedPath === 'school' ? 'I represent a school' : 'I’m a student');
    expect(view.html().includes('href="/edu/verify"')).toBe(submittedPath === 'student');
  });

  it.each(['student', 'school'] as const)('preserves %s form state on rejection and only confirms a successful retry', path => {
    vi.stubGlobal('window', { location: { search: path === 'school' ? '?path=school' : '' } });
    const view = mount(EduApply);
    fillInterest(view);
    view.change('edu-website', 'bot-honeypot-value');
    view.submit();
    expect(runtime.contact.mutate.mock.lastCall[0].website).toBe('bot-honeypot-value');
    expect(view.success()).toBeUndefined();
    rejectContact();
    view.render();
    expect(view.success()).toBeUndefined();
    expect(view.html()).toContain('role="alert"');
    expect(view.html()).toContain('Interest could not be saved');
    expect(view.field('edu-name').props.value).toBe(' Student Name ');
    expect(view.field('edu-email').props.value).toBe(' student@school.test ');
    expect(view.field('edu-message').props.value).toBe(' I want to build a creative portfolio. ');
    expect(view.field('edu-school').props.value).toBe(' Example School ');
    expect(view.field('edu-program').props.value).toBe(' Creative Arts ');
    expect(view.field('edu-website').props.value).toBe('bot-honeypot-value');
    view.change('edu-website', '');
    view.submit();
    expect(view.success()).toBeUndefined();
    resolveContact();
    view.render();
    expectAccessibleSuccess(view);
    expect(view.html()).not.toContain('Interest could not be saved');
  });

  it('preserves local validation without invoking the mutation', () => {
    const view = mount(EduApply);
    view.submit();
    expect(view.html()).toContain('Please enter your name.');
    view.change('edu-name', 'Student');
    view.submit();
    expect(view.html()).toContain('Please enter your email.');
    view.change('edu-email', 'student@school.test');
    view.submit();
    expect(view.html()).toContain('Please enter your school or program.');
    view.change('edu-school', 'School');
    view.submit();
    expect(view.html()).toContain('Please tell us a little more');
    expect(runtime.contact.mutate).not.toHaveBeenCalled();
    expect(view.success()).toBeUndefined();
  });
});

describe('EDU verification submission feedback (offline mocked runtime)', () => {
  it('confirms only an actual initial success, shows pending despite stale status, and offers refresh/workspace actions', () => {
    const view = mount(EduVerification);
    fillEvidence(view, 'school_code');
    expect(view.success()).toBeUndefined();
    view.submit();
    expect(view.html()).toContain('Submitting...');
    expect(view.success()).toBeUndefined();
    expect(runtime.status.refetch).not.toHaveBeenCalled();
    expect(runtime.evidence.mutate.mock.lastCall[0].schoolCode).toBe('SENSITIVE-COHORT-CODE');
    resolveEvidence(false);
    view.render();
    expectAccessibleSuccess(view);
    expect(view.html()).toContain('Verification evidence submitted successfully.');
    expect(view.html()).toContain('>pending</p>');
    expect(view.html()).not.toContain('No evidence submitted yet.');
    expect(view.html()).toContain('Submission is not eligibility approval.');
    expect(view.html()).toContain('An administrator will manually review');
    expect(view.html()).toContain('status on this page');
    expect(view.html()).toContain('href="/workspace"');
    expect(view.html()).toContain('separate successful checkout are prerequisites');
    expect(view.field('edu-school-code').props.value).toBe('');
    expect(view.html()).not.toContain('SENSITIVE-COHORT-CODE');
    expect(runtime.status.refetch).toHaveBeenCalledTimes(1);
    view.click('Refresh status');
    expect(runtime.status.refetch).toHaveBeenCalledTimes(2);
    runtime.status.isFetching = true;
    view.render();
    expect(view.find(element => element.type === 'button' && text(element.props.children) === 'Refreshing status...').props.disabled).toBe(true);
    // The current server outcome supersedes the local pending snapshot.
    runtime.status.data.verification = { status: 'rejected', revision: 2, verifiedUntil: null, graceUntil: null, rejectionReason: 'Please provide current enrollment proof.' };
    view.render();
    expect(view.html()).toContain('>rejected</p>');
    expect(view.html()).toContain('Please provide current enrollment proof.');
    expect(renderToStaticMarkup(view.success()!)).not.toContain('pending manual review');
    expect(renderToStaticMarkup(view.success()!)).toContain('latest review outcome');
  });

  it.each(['active', 'grace', 'expired'] as const)('confirms renewal without changing existing %s eligibility or grace dates', effective => {
    const future = new Date('2099-01-01T00:00:00Z');
    const past = new Date('2000-01-01T00:00:00Z');
    const original = {
      status: 'approved', revision: 7, verifiedUntil: effective === 'active' ? future : past,
      graceUntil: effective === 'expired' ? past : future, renewalSubmittedAt: null,
    };
    runtime.status.data = { verification: original, eligible: effective !== 'expired' };
    const view = mount(EduVerification);
    fillEvidence(view);
    view.submit();
    expect(view.success()).toBeUndefined();
    resolveEvidence(true, 8);
    view.render();
    expectAccessibleSuccess(view);
    expect(view.html()).toContain('Renewal evidence submitted successfully.');
    expect(view.html()).toContain(`>${effective}</p>`);
    expect(view.html()).toContain('Renewal evidence is pending manual review. Existing dates are unchanged.');
    expect(view.html()).toContain('current eligibility and grace dates are unchanged; renewal has not been approved');
    expect(view.html()).not.toContain('Verification evidence submitted successfully.');
    expect(runtime.status.data.verification).toBe(original);
    expect(view.html()).toContain(`Verification deadline: ${original.verifiedUntil.toLocaleDateString()}`);
    expect(view.html()).toContain(`Grace deadline: ${original.graceUntil.toLocaleDateString()}`);
    expect(view.html().includes('Eligible for discounted checkout')).toBe(effective !== 'expired');
  });

  it('uses the actual renewal response and removes outdated renewal outcomes after a refreshed decision', () => {
    // The server may see an approval newer than the initial client snapshot.
    const view = mount(EduVerification);
    fillEvidence(view);
    view.submit();
    resolveEvidence(true, 8);
    view.render();
    expect(view.html()).toContain('Renewal evidence submitted successfully.');
    expect(view.html()).toContain('Renewal evidence is pending manual review.');
    const approved = { status: 'approved', revision: 7, verifiedUntil: new Date('2099-01-01'), graceUntil: new Date('2099-02-01'), renewalRejectionReason: 'Old renewal decision' };
    runtime.status.data = { verification: approved, eligible: true };
    view.render();
    expect(view.html()).not.toContain('Old renewal decision');
    runtime.status.data.verification = { ...approved, revision: 9, renewalRejectionReason: 'Updated evidence needed' };
    view.render();
    expect(view.html()).toContain('Updated evidence needed');
    expect(view.html()).not.toContain('Renewal evidence is pending manual review.');
    expect(renderToStaticMarkup(view.success()!)).not.toContain('renewal has not been approved');
    expect(renderToStaticMarkup(view.success()!)).toContain('latest review outcome');
  });

  it.each([false, true])('never confirms rejected evidence (renewal=%s) and retains inputs for retry', renewal => {
    if (renewal) runtime.status.data.verification = { status: 'approved', revision: 3, verifiedUntil: new Date('2099-01-01'), graceUntil: new Date('2099-02-01') };
    const view = mount(EduVerification);
    fillEvidence(view, 'school_code');
    view.submit();
    view.submit();
    expect(runtime.evidence.mutate).toHaveBeenCalledTimes(1);
    expect(view.success()).toBeUndefined();
    runtime.evidence.isPending = false;
    runtime.evidence.isError = true;
    runtime.evidence.error = { message: 'Evidence could not be saved' };
    runtime.evidenceOptions.onError(runtime.evidence.error);
    view.render();
    expect(view.success()).toBeUndefined();
    expect(view.html()).toContain('Evidence could not be saved');
    expect(view.field('edu-school-code').props.value).toBe('SENSITIVE-COHORT-CODE');
    expect(view.field('edu-verify-institution').props.value).toBe('Example School');
    expect(view.field('edu-verify-note').props.value).toContain('Currently enrolled');
    expect(view.find(element => element.type === 'input' && element.props.type === 'checkbox').props.checked).toBe(true);
    expect(runtime.status.refetch).not.toHaveBeenCalled();
    view.submit();
    expect(view.success()).toBeUndefined();
    resolveEvidence(renewal, renewal ? 4 : 1);
    view.render();
    expectAccessibleSuccess(view);
    expect(view.html()).not.toContain('Evidence could not be saved');
  });

  it('does not send evidence without acknowledgement or while status is unavailable', () => {
    const view = mount(EduVerification);
    view.submit();
    expect(runtime.evidence.mutate).not.toHaveBeenCalled();
    fillEvidence(view);
    runtime.status.isLoading = true;
    view.render();
    view.submit();
    expect(runtime.evidence.mutate).not.toHaveBeenCalled();
    runtime.status.isLoading = false;
    runtime.status.isError = true;
    runtime.status.data = undefined;
    runtime.status.error = { message: 'Status unavailable' };
    view.render();
    view.submit();
    expect(runtime.evidence.mutate).not.toHaveBeenCalled();
    expect(view.success()).toBeUndefined();
    expect(view.html()).toContain('Status unavailable');
  });
});
