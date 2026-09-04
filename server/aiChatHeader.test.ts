import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const chatSource = readFileSync(new URL('../client/src/components/AIChatWidget.tsx', import.meta.url), 'utf8');
const headerSource = readFileSync(new URL('../client/src/components/SiteHeader.tsx', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../client/src/App.tsx', import.meta.url), 'utf8');
const adminSource = readFileSync(new URL('../client/src/pages/AdminDashboard.tsx', import.meta.url), 'utf8');
const blogAdminSource = readFileSync(new URL('../client/src/pages/BlogAdmin.tsx', import.meta.url), 'utf8');
const faqSource = readFileSync(new URL('../client/src/pages/FAQ.tsx', import.meta.url), 'utf8');
const helpSource = readFileSync(new URL('../client/src/pages/Help.tsx', import.meta.url), 'utf8');

describe('OlogyWood AI header launcher', () => {
  it('shares one chat state between global headers and the persistent conversation panel', () => {
    expect(chatSource).toContain('export function AIChatProvider');
    expect(chatSource).toContain('export function AIChatTrigger');
    expect(appSource).toContain('<AIChatProvider>');
    expect(appSource).toContain('<AIChatWidget />');
  });

  it('uses a distinct accessible sparkle utility in desktop, mobile, and admin headers', () => {
    expect(chatSource).toContain('<Sparkles className="h-5 w-5"');
    expect(chatSource).toContain("'Open OlogyWood AI chat'");
    expect(chatSource).toContain('aria-controls="ologywood-ai-chat-panel"');
    expect(headerSource.match(/<AIChatTrigger/g)).toHaveLength(2);
    expect(adminSource).toContain('<AIChatTrigger />');
    expect(blogAdminSource).toContain('<AIChatTrigger />');
  });

  it('removes the lower-right launcher while preserving a responsive closable panel', () => {
    expect(chatSource).not.toContain('buttonBottom');
    expect(chatSource).not.toContain('bottom-20');
    expect(chatSource).toContain('chatWindowTop');
    expect(chatSource).toContain('aria-label="Close OlogyWood AI chat"');
    expect(chatSource).toContain("event.key === 'Escape'");
  });

  it('updates support guidance to direct users to the header icon', () => {
    expect(faqSource).toContain('OlogyWood AI sparkle icon in the header');
    expect(helpSource).toContain('OlogyWood AI sparkle icon in the header');
    expect(faqSource).not.toContain('bottom-right corner');
    expect(helpSource).not.toContain('bottom-right corner');
  });
});
