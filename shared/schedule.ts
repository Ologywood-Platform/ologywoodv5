import { Temporal } from '@js-temporal/polyfill';
import { z } from 'zod';

export const SCHEDULE_CATEGORIES = {
  radio_interview: 'Radio interview', podcast: 'Podcast interview', appearance: 'Appearance',
  rehearsal: 'Rehearsal', performance: 'Performance', virtual_session: 'Virtual session',
  personal: 'Private commitment', other: 'Other',
} as const;
export const scheduleCategorySchema = z.enum(Object.keys(SCHEDULE_CATEGORIES) as [keyof typeof SCHEDULE_CATEGORIES, ...(keyof typeof SCHEDULE_CATEGORIES)[]]);
export const scheduleDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  try { return Temporal.PlainDate.from(value).toString() === value; } catch { return false; }
}, 'Choose a valid calendar date.');
export const scheduleTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const scheduleTimezoneSchema = z.string().max(100).refine(value => {
  if (/^[+-]/.test(value)) return false;
  try { new Intl.DateTimeFormat('en-US', { timeZone: value }); return true; } catch { return false; }
}, 'Choose a valid named timezone.');
export const scheduleTimingSchema = z.object({
  date: scheduleDateSchema, endDate: scheduleDateSchema.optional(),
  startTime: scheduleTimeSchema.optional(), endTime: scheduleTimeSchema.optional(),
  allDay: z.boolean().default(false), timezone: scheduleTimezoneSchema,
  preparationMinutes: z.number().int().min(0).max(720).default(0),
  travelMinutes: z.number().int().min(0).max(720).default(0),
});
export const scheduleAppointmentSchema = scheduleTimingSchema.extend({
  title: z.string().trim().min(1).max(200), category: scheduleCategorySchema,
  location: z.string().trim().max(500).default(''), notes: z.string().trim().max(2000).default(''),
  reminderMinutes: z.number().int().min(0).max(10080).nullable().default(30),
});
export type ScheduleTimingInput = z.input<typeof scheduleTimingSchema>;
export type ScheduleAppointmentInput = z.input<typeof scheduleAppointmentSchema>;
export interface ScheduleInterval { startAt: number; endAt: number; timezone: string; allDay: boolean; date: string; preparationMinutes: number; travelMinutes: number }
export interface ScheduleContext { ownerUserId: number; name: string; canManage: boolean; isCollaborator: boolean; timezone: string }
export interface ScheduleEntry extends ScheduleInterval {
  id: string; source: 'appointment' | 'booking' | 'live' | 'availability'; sourceId: number;
  title: string; status: string; category: string; location: string; notes: string;
  revision: number; reminderMinutes: number | null; href: string | null;
}
export function localDateAt(epoch: number, timezone: string): string {
  return Temporal.Instant.fromEpochMilliseconds(epoch).toZonedDateTimeISO(timezone).toPlainDate().toString();
}
export function addCalendarDays(date: string, days: number): string {
  return Temporal.PlainDate.from(date).add({ days }).toString();
}
export function localTimeToEpoch(date: string, time: string, timezone: string): number {
  scheduleDateSchema.parse(date); scheduleTimeSchema.parse(time); scheduleTimezoneSchema.parse(timezone);
  try {
    return Temporal.PlainDateTime.from(`${date}T${time}`).toZonedDateTime(timezone, { disambiguation: 'reject' }).epochMilliseconds;
  } catch {
    throw new Error('This local time is missing or occurs twice because the clocks change. Choose an unambiguous time.');
  }
}
export function resolveScheduleInterval(raw: ScheduleTimingInput): ScheduleInterval {
  const input = scheduleTimingSchema.parse(raw);
  const lastDate = input.endDate || input.date;
  if (lastDate < input.date) throw new Error('End date must not be before the start date.');
  const startAt = input.allDay ? Temporal.PlainDate.from(input.date).toZonedDateTime(input.timezone).epochMilliseconds
    : localTimeToEpoch(input.date, input.startTime || '', input.timezone);
  const endAt = input.allDay ? Temporal.PlainDate.from(addCalendarDays(lastDate, 1)).toZonedDateTime(input.timezone).epochMilliseconds
    : localTimeToEpoch(lastDate, input.endTime || '', input.timezone);
  if (endAt <= startAt) throw new Error('End time must be after the start time. For overnight appointments, choose the next day as the end date.');
  if (Temporal.PlainDate.from(input.date).until(Temporal.PlainDate.from(lastDate)).days >= 31) throw new Error('Schedule commitments may span at most 31 calendar days.');
  return { startAt, endAt, timezone: input.timezone, allDay: input.allDay, date: input.date,
    preparationMinutes: input.allDay ? 0 : input.preparationMinutes,
    travelMinutes: input.allDay ? 0 : input.travelMinutes };
}
export function bufferedInterval(interval: Pick<ScheduleInterval, 'startAt' | 'endAt' | 'preparationMinutes' | 'travelMinutes'>) {
  return { startAt: interval.startAt - interval.preparationMinutes * 60000, endAt: interval.endAt + interval.travelMinutes * 60000 };
}
export function scheduleIntervalsOverlap(a: Pick<ScheduleInterval, 'startAt' | 'endAt' | 'preparationMinutes' | 'travelMinutes'>, b: Pick<ScheduleInterval, 'startAt' | 'endAt' | 'preparationMinutes' | 'travelMinutes'>): boolean {
  const x = bufferedInterval(a), y = bufferedInterval(b);
  return x.startAt < y.endAt && y.startAt < x.endAt;
}
export function formatScheduleTime(epoch: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(epoch);
}
