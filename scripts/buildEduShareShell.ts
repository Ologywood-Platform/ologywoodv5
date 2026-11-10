import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { injectEduShareMeta } from '../server/services/eduShareMetadata';

// Run AFTER Vite so this shell always references the current hashed assets and
// retains all runtime/debug/analytics wiring from the actual production build.
const publicDirectory = resolve(process.cwd(), 'dist/public');
const shell = injectEduShareMeta(readFileSync(resolve(publicDirectory, 'index.html'), 'utf8'));
mkdirSync(resolve(publicDirectory, 'edu'), { recursive: true });
writeFileSync(resolve(publicDirectory, 'edu/index.html'), shell);
console.log('[EDU sharing] Generated EDU static shells using the current SPA assets.');
