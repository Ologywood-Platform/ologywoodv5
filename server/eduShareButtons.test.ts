import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EduShareButtons, { copyEduShareLink } from '../client/src/components/EduShareButtons';
import { EDU_SHARE_URL, EDU_SHARE_TEXT, EDU_SOCIAL_LINKS } from '../shared/eduShare';

function clipboardFallback(result: boolean, throws = false) {
  const field = { value: '', setAttribute: vi.fn(), style: {} as any, select: vi.fn(), remove: vi.fn() };
  const focus = vi.fn();
  const document = { activeElement: { focus }, body: { appendChild: vi.fn() }, createElement: vi.fn(() => field), execCommand: throws ? vi.fn(() => { throw new Error('Browser copy denied'); }) : vi.fn(() => result) };
  vi.stubGlobal('document', document);
  return { field, document, focus };
}
afterEach(() => vi.unstubAllGlobals());

describe('EDU social share controls', () => {
  it('always uses the canonical public EDU URL, never a preview, profile, or verification URL', () => {
    expect(new URL(EDU_SOCIAL_LINKS.facebook).searchParams.get('u')).toBe(EDU_SHARE_URL);
    expect(new URL(EDU_SOCIAL_LINKS.linkedin).searchParams.get('url')).toBe(EDU_SHARE_URL);
    const x = new URL(EDU_SOCIAL_LINKS.x);
    expect(x.searchParams.get('url')).toBe(EDU_SHARE_URL); expect(x.searchParams.get('text')).toBe(EDU_SHARE_TEXT);
    expect(new URL(EDU_SOCIAL_LINKS.facebook).hostname).toBe('www.facebook.com');
    expect(new URL(EDU_SOCIAL_LINKS.linkedin).hostname).toBe('www.linkedin.com');
    expect(x.hostname).toBe('x.com');
  });
  it('renders a compact labeled Facebook, X, LinkedIn and copy row, without SDKs or automatic sharing', () => {
    const html = renderToStaticMarkup(React.createElement(EduShareButtons));
    expect(html).toContain('Share with your classmates'); expect(html).toContain('Facebook'); expect(html).toContain('LinkedIn'); expect(html).toContain('Copy link');
    expect(html.match(/target="_blank"/g)).toHaveLength(3); expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(3);
    expect(html).toContain('aria-label="Share OlogyWood EDU"'); expect(html).toContain('role="status"'); expect(html).toContain('aria-live="polite"');
    expect(html).toContain('type="button"'); expect(html).toContain('min-h-11');
    expect(html).not.toContain('EDU link copied.'); expect(html).not.toContain('<script');
    expect(html).not.toContain('More sharing options on your device');
  });
  it('awaits native clipboard acceptance before resolving success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await copyEduShareLink(); expect(writeText).toHaveBeenCalledOnce(); expect(writeText).toHaveBeenCalledWith(EDU_SHARE_URL);
  });
  it('preserves the EDU URL and cleans up and restores focus after successful legacy copy', async () => {
    vi.stubGlobal('navigator', {}); const fallback = clipboardFallback(true);
    await copyEduShareLink(); expect(fallback.field.value).toBe(EDU_SHARE_URL);
    expect(fallback.document.execCommand).toHaveBeenCalledOnce(); expect(fallback.document.execCommand).toHaveBeenCalledWith('copy');
    expect(fallback.field.remove).toHaveBeenCalledOnce(); expect(fallback.focus).toHaveBeenCalledOnce();
  });
  it('tries the legacy clipboard path if the modern API denies access', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Clipboard denied')) } });
    const fallback = clipboardFallback(true); await copyEduShareLink(); expect(fallback.document.execCommand).toHaveBeenCalledOnce();
  });
  it('never resolves false-success when a browser reports unsuccessful copy', async () => {
    vi.stubGlobal('navigator', {}); const fallback = clipboardFallback(false);
    await expect(copyEduShareLink()).rejects.toThrow('Copy unavailable');
    expect(fallback.field.remove).toHaveBeenCalledOnce(); expect(fallback.focus).toHaveBeenCalledOnce();
  });
  it('cleans up even when legacy copy throws', async () => {
    vi.stubGlobal('navigator', {}); const fallback = clipboardFallback(false, true);
    await expect(copyEduShareLink()).rejects.toThrow('Browser copy denied'); expect(fallback.field.remove).toHaveBeenCalledOnce(); expect(fallback.focus).toHaveBeenCalledOnce();
  });
  it('reports failure when neither browser copy API is available', async () => {
    vi.stubGlobal('navigator', {}); vi.stubGlobal('document', undefined);
    await expect(copyEduShareLink()).rejects.toThrow('Copy unavailable');
  });
});
