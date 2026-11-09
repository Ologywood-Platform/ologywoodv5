const activeAudio = new Set<HTMLMediaElement>();

export function registerAudioElement(audio: HTMLMediaElement) {
  activeAudio.add(audio);
  return () => activeAudio.delete(audio);
}

export function stopAllAudio() {
  const mediaElements = new Set<HTMLMediaElement>(activeAudio);
  if (typeof document !== 'undefined') {
    document.querySelectorAll<HTMLMediaElement>('audio, video').forEach((element) => mediaElements.add(element));
  }
  for (const audio of mediaElements) {
    try {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    } catch {
      // Media cleanup must never block sign-out.
    }
  }
  activeAudio.clear();
}

export function requestAudioCleanup() {
  stopAllAudio();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ologywood:audio-cleanup'));
  }
}
