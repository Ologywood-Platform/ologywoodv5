import { describe, expect, it } from 'vitest';
import {
  AI_RELEASE_DISCLOSURE_GUIDANCE,
  CREATOR_SHOP_PURCHASE_GUIDANCE,
  EVENT_TICKETING_GUIDANCE,
  getCanonicalNavigationAnswer,
  MY_OLOGY_GUIDANCE,
  NIL_AGENT_FEE_GUIDANCE,
  NIL_READINESS_GUIDANCE,
  PLATFORM_FEE_GUIDANCE,
  WORKSPACE_GUIDANCE,
} from './routers/aiChat';

describe('AI chat canonical navigation guidance', () => {
  it('answers My Ology questions deterministically with the real route and owned-item scope', () => {
    const answer = getCanonicalNavigationAnswer('Where can I find My Ology?');

    expect(answer).toBe(MY_OLOGY_GUIDANCE);
    expect(answer).toContain('/my-ology');
    expect(answer).toContain('tickets');
    expect(answer).toContain('Creator Shop orders');
    expect(answer).toContain('Ology Live sessions');
    expect(answer).toContain('Fan Club memberships');
  });

  it('answers role-management Workspace questions deterministically', () => {
    const answer = getCanonicalNavigationAnswer('Where do I manage my work in Workspace?');

    expect(answer).toBe(WORKSPACE_GUIDANCE);
    expect(answer).toContain('/workspace');
    expect(answer).toContain('Needs Attention');
    expect(answer).toContain('team-member');
  });

  it('answers song and release AI-disclosure questions deterministically without making a certification claim', () => {
    const answer = getCanonicalNavigationAnswer('How do I add an AI disclosure tag to my release?');

    expect(answer).toBe(AI_RELEASE_DISCLOSURE_GUIDANCE);
    expect(answer).toContain('AI-assisted');
    expect(answer).toContain('primarily AI-generated');
    expect(answer).toContain('creator-provided details');
    expect(answer).toContain('not that OlogyWood verified the release as AI-free');
    expect(answer).toContain('does not certify');
  });

  it('answers NIL Compliance Center questions deterministically with private readiness boundaries', () => {
    const answer = getCanonicalNavigationAnswer('Where can I find my NIL compliance tools and reporting reminders?');

    expect(answer).toBe(NIL_READINESS_GUIDANCE);
    expect(answer).toContain('/nil-compliance');
    expect(answer).toContain('private readiness workspace');
    expect(answer).toContain('does not file disclosures');
    expect(answer).toContain('proposed, not enacted');
  });

  it('answers proposed five-percent fee questions without confusing platform fees with agent compensation', () => {
    const answer = getCanonicalNavigationAnswer('Is the athlete-agent fee capped at five percent?');

    expect(answer).toBe(NIL_AGENT_FEE_GUIDANCE);
    expect(answer).toContain('covered student-athlete endorsement contract');
    expect(answer).toContain('platform service fees and Stripe processing charges are separate');
    expect(answer).toContain('proposed, not enacted');
  });

  it('answers platform fee questions with the current complete fee schedule', () => {
    const answer = getCanonicalNavigationAnswer('What are the current platform fees?');

    expect(answer).toBe(PLATFORM_FEE_GUIDANCE);
    expect(answer).toContain('Fan Club memberships 10%');
    expect(answer).toContain('talent keeps 90%');
    expect(answer).toContain('Ology Live 15%');
    expect(answer).toContain('Stripe processing charges are separate');
  });

  it('answers guest music purchase questions without incorrectly requiring an account', () => {
    const answer = getCanonicalNavigationAnswer('Can I buy a song without creating an account?');

    expect(answer).toContain('No account is required');
    expect(answer).toContain('private payment-success link');
  });

  it('answers merch and eBook account questions with their distinct access rules', () => {
    const answer = getCanonicalNavigationAnswer('Can I buy merch or an eBook without an account?');

    expect(answer).toBe(CREATOR_SHOP_PURCHASE_GUIDANCE);
    expect(answer).toContain('Physical merch and physical books in Creator Shop support guest checkout');
    expect(answer).toContain('Native eBooks are different: sign in or create an account');
  });

  it('answers ticket-selling and venue check-in questions with current guest and door-flow guidance', () => {
    const answer = getCanonicalNavigationAnswer('How do I sell tickets and check guests in at the venue?');

    expect(answer).toBe(EVENT_TICKETING_GUIDANCE);
    expect(answer).toContain('No account is required');
    expect(answer).toContain('venue account');
    expect(answer).toContain('Door Check-In');
    expect(answer).toContain('Sold Out');
    expect(answer).toContain('reopen inventory');
  });
});
