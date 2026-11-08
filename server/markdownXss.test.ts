import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const renderer = readFileSync(resolve(process.cwd(), 'client/src/utils/renderMarkdown.ts'), 'utf8');
const blogPost = readFileSync(resolve(process.cwd(), 'client/src/pages/BlogPost.tsx'), 'utf8');
const blogAdmin = readFileSync(resolve(process.cwd(), 'client/src/pages/BlogAdmin.tsx'), 'utf8');

describe('blog Markdown HTML boundary', () => {
  it('escapes raw Markdown source before converting it into HTML', () => {
    expect(renderer).toContain('function escapeMarkdownSource');
    expect(renderer).toContain('const safeMarkdown = escapeMarkdownSource(md);');
    expect(renderer).toContain(".replace(/</g, '&lt;')");
    expect(renderer).toContain(".replace(/>/g, '&gt;')");
  });

  it('sanitizes the converted fragment with an explicit allowlist', () => {
    expect(renderer).toContain("import DOMPurify from 'dompurify';");
    expect(renderer).toContain('DOMPurify.sanitize(html, {');
    expect(renderer).toContain('FORBID_TAGS:');
    expect(renderer).toContain("'script'");
    expect(renderer).toContain('ALLOW_DATA_ATTR: false');
  });

  it('keeps both public posts and admin previews behind the shared renderer', () => {
    expect(blogPost).toContain('renderMarkdown(post.content)');
    expect(blogAdmin).toContain('renderMarkdown(form.content)');
    expect(blogPost).not.toContain('dangerouslySetInnerHTML={{ __html: post.content }}');
    expect(blogAdmin).not.toContain('dangerouslySetInnerHTML={{ __html: form.content }}');
  });
});
