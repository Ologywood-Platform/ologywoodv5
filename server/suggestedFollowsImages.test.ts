import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, '../client/src/components/SuggestedFollows.tsx'), 'utf8');

describe('SuggestedFollows image loading', () => {
  it('sizes the LazyImage container so intersection loading can trigger', () => {
    expect(source).toContain('containerClassName="w-full h-full"');
    expect(source).toContain('className="w-full h-full object-cover cursor-pointer"');
  });

  it('keeps an accessible initials fallback when no profile photo exists', () => {
    expect(source).toContain("artist.artistName.charAt(0)");
    expect(source).toContain('bg-gradient-to-br from-purple-400 to-blue-400');
  });
});
