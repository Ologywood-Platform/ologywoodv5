import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ensureOlogyLiveBookingsSchema,
  resetOlogyLiveBookingsSchemaForTests,
} from './services/ologyLiveSchemaService';

const read = (relative: string) => fs.readFileSync(path.resolve(__dirname, '..', relative), 'utf8');

describe('Ology Live My Ology runtime compatibility', () => {
  beforeEach(() => resetOlogyLiveBookingsSchemaForTests());

  it('creates only the established bookings table idempotently with all required fields and indexes', async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const db = { execute };

    await Promise.all([
      ensureOlogyLiveBookingsSchema(db),
      ensureOlogyLiveBookingsSchema(db),
    ]);

    expect(execute).toHaveBeenCalledTimes(1);
    const query = read('server/services/ologyLiveSchemaService.ts');
    for (const fragment of [
      'CREATE TABLE IF NOT EXISTS',
      'ology_live_bookings',
      'experienceId',
      'fanId',
      'talentId',
      'scheduledAt',
      'paymentStatus',
      'joinLink',
      'idx_ology_live_bookings_fan',
    ]) expect(query).toContain(fragment);
  });

  it('repairs the schema before the fan-session select runs', () => {
    const router = read('server/routers/ologyLivePhase2.ts');
    const procedureStart = router.indexOf('getMyFanSessions:');
    const repair = router.indexOf('await ensureOlogyLiveBookingsSchema(db)', procedureStart);
    const select = router.indexOf('const bookings = await db.select', procedureStart);
    expect(procedureStart).toBeGreaterThan(-1);
    expect(repair).toBeGreaterThan(procedureStart);
    expect(select).toBeGreaterThan(repair);
  });

  it('resets the failed readiness promise so a later request can retry', async () => {
    const failing = { execute: vi.fn().mockRejectedValueOnce(new Error('temporary database failure')) };
    await expect(ensureOlogyLiveBookingsSchema(failing)).rejects.toThrow('temporary database failure');

    const succeeding = { execute: vi.fn().mockResolvedValue(undefined) };
    await expect(ensureOlogyLiveBookingsSchema(succeeding)).resolves.toBeUndefined();
    expect(succeeding.execute).toHaveBeenCalledTimes(1);
  });
});
