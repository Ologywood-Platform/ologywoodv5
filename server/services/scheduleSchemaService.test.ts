import { describe, expect, it, vi } from 'vitest';
import { ensureScheduleSchema } from './scheduleSchemaService';
import { getTableConfig } from 'drizzle-orm/mysql-core';
import { bookings, notifications, ologyLiveTimeSlots, scheduleAppointments, scheduleReminderReceipts } from '../../drizzle/schema';

const timingNames = ['scheduleStartAt', 'scheduleEndAt', 'scheduleTimezone', 'scheduleAllDay', 'preparationMinutes', 'travelMinutes'];
function dbFixture(existing: string[] = [], missingLive = false) {
  const execute = vi.fn(async (query: string): Promise<any> => {
    if (query.includes('SHOW COLUMNS FROM `bookings`')) return [existing.map(Field => ({ Field })), []];
    if (query.includes('SHOW COLUMNS FROM `ology_live_time_slots`')) {
      if (missingLive) throw Object.assign(new Error('missing optional table'), { code: 'ER_NO_SUCH_TABLE', errno: 1146 });
      return [[{ Field: 'id' }], []];
    }
    return [{ affectedRows: 0 }, []];
  });
  return { execute };
}

describe('approved additive schedule schema', () => {
  it('declares UTC numeric BIGINTs, date-string calendar date, nullable timing, no notifications enum changes', () => {
    const bookingColumns = getTableConfig(bookings).columns;
    expect(bookingColumns.filter(column => ['scheduleStartAt', 'scheduleEndAt'].includes(column.name)).every(column => column.dataType === 'number' && !column.notNull)).toBe(true);
    expect(bookingColumns.find(column => column.name === 'scheduleAllDay')?.notNull).toBe(false);
    expect(getTableConfig(ologyLiveTimeSlots).columns.find(column => column.name === 'scheduleTimezone')?.notNull).toBe(false);
    const appointmentColumns = getTableConfig(scheduleAppointments).columns;
    expect(appointmentColumns.find(column => column.name === 'date')?.dataType).toBe('string');
    expect(appointmentColumns.find(column => column.name === 'revision')?.default).toBe(1);
    expect(getTableConfig(scheduleReminderReceipts).columns.find(column => column.name === 'dedupKey')?.isUnique).toBe(true);
    expect(getTableConfig(notifications).columns.find(column => column.name === 'type')?.enumValues).toEqual(['booking', 'message', 'payment', 'contract', 'review']);
  });
  it('SHOWs explicit columns before approved ALTERs and creates only its two new tables', async () => {
    const db = dbFixture(); await ensureScheduleSchema(db as any);
    const statements = db.execute.mock.calls.map(([query]) => query);
    expect(statements[0]).toBe('SHOW COLUMNS FROM `bookings`');
    expect(statements.filter(query => query.startsWith('ALTER TABLE `bookings`'))).toHaveLength(6);
    expect(statements.some(query => query.includes('ADD COLUMN IF NOT EXISTS'))).toBe(false);
    expect(statements.filter(query => query.includes('CREATE TABLE IF NOT EXISTS')).map(query => query.match(/`(.*?)`/)?.[1])).toEqual(['ology_live_time_slots', 'schedule_appointments', 'schedule_reminder_receipts']);
    expect(statements.some(query => /^(INSERT|UPDATE|DELETE|DROP|TRUNCATE)/.test(query))).toBe(false);
  });
  it('does not alter already-present columns and creates approved missing legacy Live slots', async () => {
    const db = dbFixture(timingNames, true); await ensureScheduleSchema(db as any);
    expect(db.execute.mock.calls.some(([query]) => query.startsWith('ALTER'))).toBe(false);
    expect(db.execute.mock.calls.filter(([query]) => query.startsWith('CREATE'))).toHaveLength(3);
    const liveCreate = db.execute.mock.calls.find(([query]) => query.startsWith('CREATE TABLE IF NOT EXISTS `ology_live_time_slots`'))?.[0];
    expect(liveCreate).toContain('`startTime` timestamp NOT NULL');
    expect(liveCreate).toContain('`scheduleTimezone` varchar(100) NULL');
    expect(liveCreate).toContain('`spotsTaken` int NOT NULL DEFAULT 0');
  });
  it('allows concurrent duplicate-column repairs but never suppresses unrelated errors', async () => {
    const db = dbFixture(); const original = db.execute.getMockImplementation()!;
    db.execute.mockImplementation(async query => {
      if (query.startsWith('ALTER')) throw Object.assign(new Error('race'), { code: 'ER_DUP_FIELDNAME', errno: 1060 });
      return original(query);
    });
    await expect(ensureScheduleSchema(db as any)).resolves.toBeUndefined();
    const failed = { execute: vi.fn(async () => { throw Object.assign(new Error('permission denied'), { code: 'ER_TABLEACCESS_DENIED_ERROR' }); }) };
    await expect(ensureScheduleSchema(failed as any)).rejects.toThrow('permission denied');
  });
});
