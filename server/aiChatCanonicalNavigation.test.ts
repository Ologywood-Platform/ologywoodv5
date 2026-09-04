import { describe, expect, it } from 'vitest';
import {
  getCanonicalNavigationAnswer,
  MY_OLOGY_GUIDANCE,
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

  it('does not bypass the LLM for unrelated platform questions', () => {
    expect(getCanonicalNavigationAnswer('How do I sell tickets?')).toBeNull();
  });
});
