import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve(__dirname, '../client/src/pages/MyMusic.tsx'), 'utf8');

describe('My Music playback teardown', () => {
  it('removes media handlers before clearing the source', () => {
    expect(source).toContain('function disposeAudio(audio: HTMLAudioElement | null)');
    expect(source).toContain('audio.onerror = null;');
    expect(source).toContain('audio.removeAttribute("src");');
    expect(source).toContain('audio.load();');
  });

  it('ignores stale media errors from a replaced audio element', () => {
    expect(source).toContain('if (audioRef.current !== audio) return;');
  });
});
