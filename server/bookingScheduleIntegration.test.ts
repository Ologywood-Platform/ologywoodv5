import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { resolveScheduleInterval, scheduleIntervalsOverlap, localTimeToEpoch, addCalendarDays } from '../shared/schedule';
import { bookingCalendarDateLines } from './services/bookingCalendarFormatting';

const f=vi.hoisted(()=>({row:{id:91,artistId:11,venueId:17,bookingSource:'venue_booking',status:'pending',paymentStatus:'unpaid',eventDate:'2026-11-02',scheduleStartAt:1793642400000,scheduleEndAt:1793646000000,scheduleTimezone:'UTC',scheduleAllDay:false,preparationMinutes:0,travelMinutes:0} as Record<string,any>,conflict:false,execute:vi.fn(),lock:vi.fn(),check:vi.fn(),cancel:vi.fn(),guard:vi.fn()}));
vi.mock('./db',()=>({getDb:vi.fn(async()=>({})),getPool:()=>({execute:f.execute})}));
vi.mock('./services/scheduleSchemaService',()=>({ensureScheduleSchema:f.guard}));
vi.mock('./services/scheduleService',()=>({
 withScheduleLock:f.lock, assertNoScheduleConflict:f.check,
 getBookingScheduleInterval:(b:any,timezone:string)=>b.scheduleStartAt!=null?{startAt:Number(b.scheduleStartAt),endAt:Number(b.scheduleEndAt),timezone:b.scheduleTimezone||timezone,allDay:!!b.scheduleAllDay,date:b.eventDate,preparationMinutes:b.preparationMinutes||0,travelMinutes:b.travelMinutes||0}:resolveScheduleInterval({date:b.eventDate,timezone,allDay:true}),
}));
vi.mock('./services/bookingCancellation',()=>({cancelBooking:f.cancel}));
import { bookingScheduleFields, confirmScheduledBooking, cancelScheduledBooking, applyScheduledBookingPayment, getBookingResourceUserIds, setScheduledAvailability, setVenueScheduledDates, setVenueScheduledRecurringBlock } from './services/bookingScheduleService';

beforeEach(()=>{
 vi.clearAllMocks();f.row.status='pending';f.row.paymentStatus='unpaid';delete f.row.depositPaidAt;delete f.row.finalPaidAt;f.conflict=false;
 f.execute.mockImplementation(async(sql:string,args:any[])=>{
  if(sql.includes('FROM artist_profiles'))return [[{userId:7}],[]];
  if(sql.includes('FROM venue_profiles'))return [[{userId:8}],[]];
  if(sql.includes('SELECT artistId,venueId'))return [[f.row],[]];
  if(sql.includes('SELECT * FROM bookings'))return [[{...f.row}],[]];
  if(sql.startsWith('SELECT'))return [[],[]];
  if(sql.includes("SET status='confirmed'")){f.row.status='confirmed';return [{affectedRows:1},[]];}
  return [{affectedRows:1,insertId:101},[]];
 });
 f.lock.mockImplementation(async(ids,fn)=>fn({execute:f.execute}));
 f.check.mockImplementation(async()=>{if(f.conflict)throw new TRPCError({code:'CONFLICT',message:'This time overlaps an existing commitment.'});});
 f.cancel.mockResolvedValue({success:true});
});

describe('timezone-safe appointment contract',()=>{
 it('supports several distinct timed commitments in the same local day',()=>{
  const a=resolveScheduleInterval({date:'2026-11-02',startTime:'09:00',endTime:'09:30',timezone:'America/New_York'});
  const b=resolveScheduleInterval({date:'2026-11-02',startTime:'10:00',endTime:'11:00',timezone:'America/New_York'});
  expect(scheduleIntervalsOverlap(a,b)).toBe(false);
 });
 it('permits touching boundaries but reserves preparation before and travel after',()=>{
  const a=resolveScheduleInterval({date:'2026-11-02',startTime:'09:00',endTime:'10:00',timezone:'UTC',travelMinutes:15});
  const b=resolveScheduleInterval({date:'2026-11-02',startTime:'10:15',endTime:'11:00',timezone:'UTC'});
  expect(scheduleIntervalsOverlap(a,b)).toBe(false);expect(scheduleIntervalsOverlap(a,{...b,preparationMinutes:1})).toBe(true);
 });
 it('rejects nonexistent and ambiguous daylight saving wall times',()=>{
  expect(()=>localTimeToEpoch('2026-03-08','02:30','America/New_York')).toThrow(/clocks change/);
  expect(()=>localTimeToEpoch('2026-11-01','01:30','America/New_York')).toThrow(/clocks change/);
 });
 it('all-day commitments follow 23-hour and 25-hour local days',()=>{
  const a=resolveScheduleInterval({date:'2026-03-08',timezone:'America/New_York',allDay:true});
  const b=resolveScheduleInterval({date:'2026-11-01',timezone:'America/New_York',allDay:true});
  expect(a.endAt-a.startAt).toBe(23*3600000);expect(b.endAt-b.startAt).toBe(25*3600000);
 });
 it('requires explicit overnight end date rather than guessing a duration',()=>{
  expect(()=>resolveScheduleInterval({date:'2026-11-02',startTime:'23:00',endTime:'01:00',timezone:'UTC'})).toThrow(/End time/);
  const i=resolveScheduleInterval({date:'2026-11-02',endDate:addCalendarDays('2026-11-02',1),startTime:'23:00',endTime:'01:00',timezone:'UTC'});
  expect(i.endAt-i.startAt).toBe(2*3600000);
 });
 it('keeps legacy requests unchanged and binds timed request to its booking date',()=>{
  expect(bookingScheduleFields('2026-11-02')).toEqual({});
  expect(()=>bookingScheduleFields('2026-11-02',{date:'2026-11-03',allDay:true,timezone:'UTC'})).toThrow(/must match/);
 });
});

describe('shared booking reservation integration',()=>{
 it('locks artist and actual venue owners, then checks and writes on the same connection',async()=>{
  expect(await confirmScheduledBooking(91,7,'artist')).toEqual({changed:true});
  expect(f.lock).toHaveBeenCalledWith([7,8],expect.any(Function));expect(f.check).toHaveBeenCalledWith(expect.anything(),[7,8],expect.objectContaining({allDay:false}),{bookingId:91});
  expect(f.execute.mock.calls.some(([sql])=>sql.includes('INSERT INTO availability'))).toBe(false);
 });
 it('rejects overlaps before status mutation',async()=>{
  f.conflict=true;await expect(confirmScheduledBooking(91,7,'artist')).rejects.toMatchObject({code:'CONFLICT'});
  expect(f.row.status).toBe('pending');
 });
 it('does not confirm cancelled or completed states or duplicate receipts',async()=>{
  f.row.status='cancelled';await expect(confirmScheduledBooking(91,7,'artist')).rejects.toMatchObject({code:'BAD_REQUEST'});
  f.row.status='confirmed';expect(await confirmScheduledBooking(91,7,'artist')).toEqual({changed:false});expect(f.check).not.toHaveBeenCalled();
 });
 it('checks actual party ownership, not profile/user-ID collisions',async()=>{
  await expect(confirmScheduledBooking(91,8,'artist')).rejects.toMatchObject({code:'FORBIDDEN'});
  f.row.bookingSource='client_booking';expect(await getBookingResourceUserIds(11,17,'client_booking')).toEqual([7,17]);f.row.bookingSource='venue_booking';
 });
 it('cancellation keeps the existing refund service but supplies its locked booking and connection',async()=>{
  expect(await cancelScheduledBooking(91,7,'artist')).toEqual({changed:true});
  expect(f.cancel).toHaveBeenCalledWith(91,'artist',undefined,{booking:expect.objectContaining({id:91}),connection:expect.objectContaining({execute:f.execute})});
 });
 it('paid conflicts record payment without falsely confirming or overwriting cancelled status',async()=>{
  f.conflict=true;await applyScheduledBookingPayment(91,'deposit_paid','cs_proof','deposit');
  const update=f.execute.mock.calls.find(([sql])=>sql.startsWith('UPDATE bookings SET `paymentStatus`'));
  expect(update?.[0]).not.toContain('`status`');expect(update?.[1]).toContain('deposit_paid');
  expect(f.execute.mock.calls.filter(([sql])=>sql.includes('INSERT INTO notifications'))).toHaveLength(2);
 });
 it('database failures fail closed instead of being mislabelled conflicts',async()=>{
  f.check.mockRejectedValueOnce(new Error('database offline'));
  await expect(applyScheduledBookingPayment(91,'deposit_paid','cs_proof','deposit')).rejects.toThrow('database offline');
  expect(f.execute.mock.calls.some(([sql])=>sql.startsWith('UPDATE bookings SET `paymentStatus`'))).toBe(false);
 });
 it('never reopens refunded bookings on stale payment events',async()=>{
  f.row.paymentStatus='refunded';await applyScheduledBookingPayment(91,'deposit_paid','cs_old','deposit');expect(f.check).not.toHaveBeenCalled();
 });
 it('checks new whole-day availability blocks even when there is no previous availability row',async()=>{
  await setScheduledAvailability(7,11,['2026-11-02'],'unavailable','UTC');expect(f.check).toHaveBeenCalled();
 });
});

describe('calendar feed exact timing',()=>{
 it('exports untimed legacy bookings as dates, not invented two-hour events',()=>{
  expect(bookingCalendarDateLines({eventDate:'2026-11-02'})).toEqual(['DTSTART;VALUE=DATE:20261102','DTEND;VALUE=DATE:20261103']);
 });
 it('exports timed commitments as timezone-independent UTC instants',()=>{
  const interval=resolveScheduleInterval({date:'2026-11-02',startTime:'09:00',endTime:'09:30',timezone:'America/New_York'});
  expect(bookingCalendarDateLines({eventDate:'2026-11-02',scheduleStartAt:interval.startAt,scheduleEndAt:interval.endAt,scheduleTimezone:interval.timezone,scheduleAllDay:false})).toEqual(['DTSTART:20261102T140000Z','DTEND:20261102T143000Z']);
 });
});

describe('whole-day closure and DST edges',()=>{
 it('uses the first actual local instant on a day where midnight is skipped',()=>{
  const i=resolveScheduleInterval({date:'2018-11-04',allDay:true,timezone:'America/Sao_Paulo'});
  expect(new Date(i.startAt).toISOString()).toBe('2018-11-04T03:00:00.000Z');expect(i.endAt-i.startAt).toBe(23*3600000);
 });
 it('permits 31 calendar dates across a 25-hour day but not 32 dates',()=>{
  expect(()=>resolveScheduleInterval({date:'2026-10-12',endDate:'2026-11-11',allDay:true,timezone:'America/New_York'})).not.toThrow();
  expect(()=>resolveScheduleInterval({date:'2026-10-12',endDate:'2026-11-12',allDay:true,timezone:'America/New_York'})).toThrow(/31 calendar/);
 });
 it('venue closure checks reservations before inserting and never overrides a timed commitment',async()=>{
  f.conflict=true;await expect(setVenueScheduledDates(8,17,['2026-11-02'],true)).rejects.toMatchObject({code:'CONFLICT'});
  expect(f.lock).toHaveBeenCalledWith([8],expect.any(Function));expect(f.execute.mock.calls.some(([q])=>q.startsWith('INSERT INTO venue_blocked_dates'))).toBe(false);
 });
 it('denies venue calendar mutation by another owner',async()=>{
  await expect(setVenueScheduledDates(7,17,['2026-11-02'],true)).rejects.toMatchObject({code:'FORBIDDEN'});expect(f.check).not.toHaveBeenCalled();
 });
 it('atomic recurring closures allow no downgrade or arbitrary fractional weekday',async()=>{
  await expect(setVenueScheduledRecurringBlock(8,17,1.5,true)).rejects.toMatchObject({code:'BAD_REQUEST'});
  await setVenueScheduledRecurringBlock(8,17,1,false);expect(f.lock).toHaveBeenCalledWith([8],expect.any(Function));expect(f.execute.mock.calls.some(([q])=>q.startsWith('DELETE FROM venue_recurring_blocks'))).toBe(true);
 });
});
