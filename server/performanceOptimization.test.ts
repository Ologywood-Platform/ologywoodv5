import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appSource = readFileSync(resolve(process.cwd(), 'client/src/App.tsx'), 'utf8');
const viteSource = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');

describe('production performance safeguards', () => {
  it('keeps the homepage out of the application shell chunk', () => {
    expect(appSource).toContain('const Home = lazy(() => import("./pages/Home"));');
    expect(appSource).not.toContain('import Home from "./pages/Home";');
  });

  it('limits the Manus preview runtime to Vite serve mode', () => {
    expect(viteSource).toContain('apply: "serve" as const');
    expect(viteSource).toContain('plugins: [...basePlugins, manusPreviewRuntime]');
    expect(viteSource).toContain('injects a large inline script');
  });
});
