import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const mocks = vi.hoisted(() => ({ user: null as any, mutation: vi.fn() }));
vi.mock('@/_core/hooks/useAuth', () => ({ useAuth: () => ({ user: mocks.user, loading: false }) }));
vi.mock('@/lib/trpc', () => ({ trpc: { merchOrders: { createCheckout: { useMutation: () => ({ mutate: mocks.mutation, isPending: false }) } } } }));
vi.mock('@/components/ui/dialog', async () => {
  const React = await import('react');
  const Container = ({ children }: any) => React.createElement('div', null, children);
  return {
    Dialog: Container, DialogContent: Container, DialogFooter: Container, DialogHeader: Container, DialogTitle: Container,
    useDialogComposition: () => ({ justEndedComposing: () => false, setComposing: () => undefined, markCompositionEnd: () => undefined }),
  };
});
vi.mock('@/components/ui/tooltip', async () => {
  const React = await import('react');
  const Container = ({ children }: any) => React.createElement('div', null, children);
  return { Tooltip: Container, TooltipContent: Container, TooltipTrigger: Container };
});

import { MerchCheckoutDialog } from '../client/src/components/MerchCheckoutDialog';

const item = { id: 1, userId: 10, userType: 'artist', title: 'Shirt', priceInCents: 500, variants: [], shippingAvailable: true, imageUrls: [], productCategory: 'merch' };
const render = (changes: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(MerchCheckoutDialog, { item: { ...item, ...changes }, open: true, onOpenChange: () => undefined }));

beforeEach(() => {
  vi.stubGlobal('React', React);
  mocks.user = { id: 20, name: 'Buyer', email: 'buyer@example.test', emailVerified: true };
});

describe('rendered merchandise opt-in eligibility', () => {
  it('verified buyers see artist opt-in, unchecked by default', () => {
    const html = render();
    expect(html).toContain('Follow this creator and receive occasional updates by email.');
    expect(html).toContain('type="checkbox"');
    expect(html).not.toContain('checked=""');
    expect(html).toContain('Continue to secure payment');
  });

  it('venue checkout hides the unsupported artist promise and checkbox', () => {
    const html = render({ userType: 'venue' });
    expect(html).not.toContain('Follow this creator');
    expect(html).not.toContain('type="checkbox"');
    expect(html).toContain('Continue to secure payment');
  });

  it('venue checkout hides artist email verification upsell too', () => {
    mocks.user.emailVerified = false;
    expect(render({ userType: 'venue' })).not.toContain('Verify your email in Settings');
  });

  it.each(['guest', 'unverified', 'self'])('no checkbox for %s accounts', kind => {
    if (kind === 'guest') mocks.user = null;
    if (kind === 'unverified') mocks.user.emailVerified = false;
    if (kind === 'self') mocks.user.id = 10;
    expect(render()).not.toContain('type="checkbox"');
    expect(render()).toContain('Continue to secure payment');
  });
});
