import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

describe('Touring availability security boundaries', () => {
  it('bounds and validates creator availability payloads', () => {
    const source = read('./routers/touring.ts');
    expect(source).toContain('const safeProfileId = z.number().int().safe().positive()');
    expect(source).toContain('const dateValue = z.string().trim().min(1).max(40).refine');
    expect(source).toContain('targetRegions: z.array(boundedLabel).max(20)');
    expect(source).toContain('tourTypes: z.array(boundedLabel).max(20)');
    expect(source).toContain('dateWindows: z.array(dateWindowSchema).max(20)');
    expect(source).toContain('notes: z.string().trim().max(2000)');
    expect(source).toContain('}).strict();');
    expect(source).toContain("Each date window's end date must be after its start date");
  });

  it('bounds public discovery filters and profile lookups', () => {
    const source = read('./routers/touring.ts');
    expect(source).toContain('.input(z.object({ artistProfileId: safeProfileId }).strict())');
    expect(source).toContain('region: z.string().trim().max(100).optional()');
    expect(source).toContain('tourType: boundedLabel.optional()');
  });

  it('caps batch status requests and rejects duplicate IDs', () => {
    const source = read('./routers/touring.ts');
    expect(source).toContain('z.array(safeProfileId).min(1).max(100)');
    expect(source).toContain('Duplicate artist profile IDs are not allowed');
  });
});
