import { describe, expect, it } from 'vitest';
import { scheduleAppointmentSchema, scheduleTimingSchema } from '../shared/schedule';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const routerSource = readFileSync(resolve(process.cwd(), 'server/routers/schedule.ts'), 'utf8');
const sharedSource = readFileSync(resolve(process.cwd(), 'shared/schedule.ts'), 'utf8');

const validAppointment = {
  date: '2026-11-10',
  startTime: '09:00',
  endTime: '10:00',
  allDay: false,
  timezone: 'America/New_York',
  preparationMinutes: 15,
  travelMinutes: 20,
  title: 'Radio interview',
  category: 'radio_interview' as const,
  location: 'Studio A',
  notes: 'Bring the new single.',
  reminderMinutes: 30,
};

describe('schedule input security', () => {
  it('uses safe positive IDs and strict owner/revision objects', () => {
    expect(routerSource).toContain('const safeId = z.number().int().safe().positive()');
    expect(routerSource).toContain("z.object({ ownerUserId: safeId.optional() }).strict()");
    expect(routerSource).toContain('expectedRevision: safeId').toContain('}).strict()');
    expect(routerSource).not.toContain('z.number().int().positive()');
  });

  it('rejects unknown fields in appointment and timing payloads', () => {
    expect(() => scheduleAppointmentSchema.parse({ ...validAppointment, injected: true })).toThrow();
    expect(scheduleTimingSchema.parse({
      date: validAppointment.date,
      startTime: validAppointment.startTime,
      endTime: validAppointment.endTime,
      allDay: false,
      timezone: validAppointment.timezone,
      injected: true,
    })).toMatchObject({ date: validAppointment.date, timezone: validAppointment.timezone });
  });

  it('keeps schedule text, category, and buffer bounds enforced', () => {
    expect(() => scheduleAppointmentSchema.parse({ ...validAppointment, title: '' })).toThrow();
    expect(() => scheduleAppointmentSchema.parse({ ...validAppointment, title: 'x'.repeat(201) })).toThrow();
    expect(() => scheduleAppointmentSchema.parse({ ...validAppointment, preparationMinutes: 721 })).toThrow();
    expect(() => scheduleAppointmentSchema.parse({ ...validAppointment, reminderMinutes: 10081 })).toThrow();
  });

  it('rejects malformed dates, times, timezones, and categories', () => {
    expect(() => scheduleAppointmentSchema.parse({ ...validAppointment, date: '2026-02-30' })).toThrow();
    expect(() => scheduleAppointmentSchema.parse({ ...validAppointment, startTime: '25:00' })).toThrow();
    expect(() => scheduleAppointmentSchema.parse({ ...validAppointment, timezone: 'Not/AZone' })).toThrow();
    expect(() => scheduleAppointmentSchema.parse({ ...validAppointment, category: 'unknown' })).toThrow();
  });

  it('retains cross-date and non-overlap validation in the shared schedule service contract', () => {
    expect(sharedSource).toContain('End date must not be before the start date.');
    expect(sharedSource).toContain('End time must be after the start time.');
    expect(sharedSource).toContain('Schedule commitments may span at most 31 calendar days.');
  });

  it('does not expose a raw schedule failure to clients', () => {
    expect(routerSource).toContain("message: 'Schedule is temporarily unavailable. Please try again.'");
    expect(routerSource).not.toContain('message: error.message');
  });
});
