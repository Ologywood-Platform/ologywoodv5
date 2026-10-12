import { Temporal } from '@js-temporal/polyfill';
import { TRPCError } from '@trpc/server';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getDb, getPool } from '../db';
import { ensureScheduleSchema } from './scheduleSchemaService';
import { assertNoScheduleConflict, withScheduleLock, getBookingScheduleInterval, type ScheduleConnection } from './scheduleService';
import { resolveScheduleInterval, scheduleDateSchema, bufferedInterval, localDateAt, addCalendarDays, type ScheduleTimingInput } from '../../shared/schedule';
import { getDateOnlyKey } from '../../shared/dateOnly';
import type { InsertBooking } from '../../drizzle/schema';

export async function getBookingResourceUserIds(artistId: number, venueId: number, source?: string | null): Promise<number[]> {
  await getDb(); const pool = getPool();
  if (!pool) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Schedule is unavailable. Please try again.' });
  const [artists] = await pool.execute<RowDataPacket[]>('SELECT userId FROM artist_profiles WHERE id=? LIMIT 1', [artistId]);
  // Physical table names follow the schema, not the exported TypeScript identifier.
  if (!artists[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found.' });
  let otherUserId: number | undefined;
  if ((source === 'client_booking' || source === 'client')) otherUserId = venueId;
  else {
    const [venues] = await pool.execute<RowDataPacket[]>('SELECT userId FROM venue_profiles WHERE id=? LIMIT 1', [venueId]);
    otherUserId = venues[0]?.userId;
  }
  return [...new Set([Number(artists[0].userId), otherUserId ? Number(otherUserId) : null].filter((v): v is number => v !== null))].sort((a,b)=>a-b);
}
export function bookingScheduleFields(eventDate: string, timing?: ScheduleTimingInput): Partial<InsertBooking> {
  scheduleDateSchema.parse(eventDate);
  if (!timing) return {};
  if (timing.date !== eventDate) throw new TRPCError({ code: 'BAD_REQUEST', message: 'The booking date and schedule date must match.' });
  try {
    const interval = resolveScheduleInterval(timing);
    return { scheduleStartAt: interval.startAt, scheduleEndAt: interval.endAt, scheduleTimezone: interval.timezone,
      scheduleAllDay: interval.allDay, preparationMinutes: interval.preparationMinutes, travelMinutes: interval.travelMinutes };
  } catch (error) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: error instanceof Error ? error.message : 'Check the booking start/end times and timezone.' });
  }
}
/** Requests are tentative: validate against existing reservations but do not consume the interval until acceptance. */
export async function checkBookingScheduleRequest(input: {artistId:number;venueId:number;bookingSource?:string;eventDate:string;schedule?:ScheduleTimingInput}): Promise<Partial<InsertBooking>> {
  await ensureScheduleSchema();
  const fields = bookingScheduleFields(input.eventDate, input.schedule);
  const owners = await getBookingResourceUserIds(input.artistId, input.venueId, input.bookingSource);
  const interval = getBookingScheduleInterval({ eventDate: input.eventDate, ...fields }, input.schedule?.timezone || 'UTC');
  await withScheduleLock(owners, async conn => { await assertNoScheduleConflict(conn, owners, interval); });
  return fields;
}
function authorizeBooking(booking: RowDataPacket, actorUserId: number, party: 'artist'|'venue', ownerIds: number[]) {
  // Caller already resolved its own artist/venue profile; actor must also be an actual resource participant.
  if (!ownerIds.includes(actorUserId) || (party === 'venue' && ['client_booking','client'].includes(booking.bookingSource) && Number(booking.venueId) !== actorUserId)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You cannot change this booking.' });
  }
}
async function assertPartyOnConnection(conn: ScheduleConnection, booking: RowDataPacket, actorUserId:number, party:'artist'|'venue') {
  if (party === 'venue' && ['client_booking','client'].includes(booking.bookingSource)) {
    if (Number(booking.venueId) !== actorUserId) throw new TRPCError({code:'FORBIDDEN',message:'You cannot change this booking.'});
    return;
  }
  const table = party === 'artist' ? 'artist_profiles' : 'venue_profiles';
  const id = party === 'artist' ? booking.artistId : booking.venueId;
  const [rows] = await conn.execute<RowDataPacket[]>(`SELECT userId FROM ${table} WHERE id=? LIMIT 1`, [id]);
  if (Number(rows[0]?.userId) !== actorUserId) throw new TRPCError({code:'FORBIDDEN',message:'You cannot change this booking.'});
}
/** Called under resource locks; recompute only a booking-generated day flag and never clear an explicit unavailable day. */
export async function reconcileBookingDayAvailability(conn: ScheduleConnection, artistId:number, eventDate:unknown):Promise<void> {
  const date = getDateOnlyKey(eventDate as string | Date);
  if (!date) return;
  const [availability] = await conn.execute<RowDataPacket[]>('SELECT id,status FROM availability WHERE artistId=? AND date=? FOR UPDATE', [artistId,date]);
  if (availability.some(row => row.status === 'unavailable')) return;
  const [remaining] = await conn.execute<RowDataPacket[]>("SELECT id FROM bookings WHERE artistId=? AND eventDate=? AND status IN ('confirmed','completed') AND (scheduleStartAt IS NULL OR scheduleEndAt IS NULL OR scheduleAllDay=1) LIMIT 1", [artistId,date]);
  if (remaining.length) {
    if (availability.length) await conn.execute("UPDATE availability SET status='booked' WHERE artistId=? AND date=? AND status<>'unavailable'", [artistId,date]);
    else await conn.execute("INSERT INTO availability (artistId,date,status) VALUES (?,?,'booked')", [artistId,date]);
  } else if (availability.some(row=>row.status==='booked')) {
    await conn.execute("UPDATE availability SET status='available' WHERE artistId=? AND date=? AND status='booked'", [artistId,date]);
  }
}
export async function confirmScheduledBooking(bookingId:number, actorUserId:number, party:'artist'|'venue'):Promise<{changed:boolean}> {
  await ensureScheduleSchema(); await getDb(); const pool=getPool();
  if (!pool) throw new TRPCError({code:'INTERNAL_SERVER_ERROR',message:'Schedule is unavailable.'});
  const [initial] = await pool.execute<RowDataPacket[]>('SELECT artistId,venueId,bookingSource FROM bookings WHERE id=? LIMIT 1',[bookingId]);
  if(!initial[0]) throw new TRPCError({code:'NOT_FOUND',message:'Booking not found.'});
  const owners=await getBookingResourceUserIds(initial[0].artistId,initial[0].venueId,initial[0].bookingSource);
  return withScheduleLock(owners,async conn=>{
    const [rows]=await conn.execute<RowDataPacket[]>('SELECT * FROM bookings WHERE id=? FOR UPDATE',[bookingId]);
    const booking=rows[0]; if(!booking) throw new TRPCError({code:'NOT_FOUND',message:'Booking not found.'});
    authorizeBooking(booking,actorUserId,party,owners); await assertPartyOnConnection(conn,booking,actorUserId,party);
    if(booking.status==='confirmed') return {changed:false};
    if(booking.status!=='pending') throw new TRPCError({code:'BAD_REQUEST',message:'Only a pending request can be confirmed.'});
    const interval=getBookingScheduleInterval(booking,booking.scheduleTimezone||'UTC');
    await assertNoScheduleConflict(conn,owners,interval,{bookingId});
    const [result]=await conn.execute<ResultSetHeader>("UPDATE bookings SET status='confirmed' WHERE id=? AND status='pending'",[bookingId]);
    if(result.affectedRows!==1) throw new TRPCError({code:'CONFLICT',message:'This booking changed. Please refresh.'});
    // Timed reservations never mark the whole day as booked.
    if(interval.allDay) await reconcileBookingDayAvailability(conn,booking.artistId,booking.eventDate);
    return {changed:true};
  });
}
export async function cancelScheduledBooking(bookingId:number,actorUserId:number,party:'artist'|'venue'):Promise<{changed:boolean}> {
  await ensureScheduleSchema(); await getDb();const pool=getPool();
  if(!pool) throw new TRPCError({code:'INTERNAL_SERVER_ERROR',message:'Schedule is unavailable.'});
  const [initial]=await pool.execute<RowDataPacket[]>('SELECT artistId,venueId,bookingSource FROM bookings WHERE id=? LIMIT 1',[bookingId]);
  if(!initial[0]) throw new TRPCError({code:'NOT_FOUND',message:'Booking not found.'});
  const owners=await getBookingResourceUserIds(initial[0].artistId,initial[0].venueId,initial[0].bookingSource);
  return withScheduleLock(owners,async conn=>{
    const [rows]=await conn.execute<RowDataPacket[]>('SELECT * FROM bookings WHERE id=? FOR UPDATE',[bookingId]);
    const booking=rows[0];if(!booking) throw new TRPCError({code:'NOT_FOUND',message:'Booking not found.'});
    authorizeBooking(booking,actorUserId,party,owners);await assertPartyOnConnection(conn,booking,actorUserId,party);
    if(booking.status==='cancelled') return {changed:false};
    if(booking.status==='completed') throw new TRPCError({code:'BAD_REQUEST',message:'Completed bookings cannot be cancelled.'});
    const {cancelBooking}=await import('./bookingCancellation');
    await cancelBooking(bookingId,party,undefined,{booking,connection:conn});
    // Release only this reservation. Existing confirmed all-day bookings retain the booked flag.
    if(booking.scheduleStartAt==null||booking.scheduleAllDay) await reconcileBookingDayAvailability(conn,booking.artistId,booking.eventDate);
    return {changed:true};
  });
}

/** Verified payment events preserve paid records, but cannot override a cancelled booking or double-book a calendar. */
export async function applyScheduledBookingPayment(bookingId:number,paymentStatus:string,stripeSessionId?:string,paymentType?:string):Promise<void> {
  await ensureScheduleSchema();await getDb();const pool=getPool();
  if(!pool) throw new Error('Schedule database unavailable');
  const [initial]=await pool.execute<RowDataPacket[]>('SELECT artistId,venueId,bookingSource FROM bookings WHERE id=? LIMIT 1',[bookingId]);
  if(!initial[0]) return;
  const owners=await getBookingResourceUserIds(initial[0].artistId,initial[0].venueId,initial[0].bookingSource);
  await withScheduleLock(owners,async conn=>{
    const [rows]=await conn.execute<RowDataPacket[]>('SELECT * FROM bookings WHERE id=? FOR UPDATE',[bookingId]);
    const booking=rows[0];if(!booking||booking.paymentStatus==='refunded') return;
    const updates: Record<string,unknown>={paymentStatus};
    const deposit=paymentType==='deposit',final=paymentType==='final_payment'||paymentType==='final';
    const alreadyRecorded=deposit?!!booking.depositPaidAt:final?!!booking.finalPaidAt:booking.paymentStatus===paymentStatus;
    if(deposit){updates.depositPaidAt=booking.depositPaidAt||new Date();if(stripeSessionId)updates.stripeDepositPaymentIntentId=stripeSessionId;}
    else if(final){updates.finalPaidAt=booking.finalPaidAt||new Date();if(stripeSessionId)updates.stripeFinalPaymentIntentId=stripeSessionId;}
    else if(stripeSessionId)updates.stripePaymentIntentId=stripeSessionId;
    let conflict=false;
    if((deposit||final)&&booking.status==='pending'){
      try {
        await assertNoScheduleConflict(conn,owners,getBookingScheduleInterval(booking,booking.scheduleTimezone||'UTC'),{bookingId});
        updates.status=final?'completed':'confirmed';
      } catch(error) {
        if(!(error instanceof TRPCError)||error.code!=='CONFLICT') throw error;
        conflict=true; // Payment remains real; acceptance needs owner review instead of silently overriding another commitment.
      }
    }else if(final&&booking.status==='confirmed')updates.status='completed';
    if(booking.status==='cancelled') conflict=true;
    const keys=Object.keys(updates);
    await conn.execute(`UPDATE bookings SET ${keys.map(key=>'`'+key+'`=?').join(',')} WHERE id=?`,[...keys.map(key=>updates[key]),bookingId]);
    if(updates.status==='confirmed'||updates.status==='completed'){
      const interval=getBookingScheduleInterval(booking,booking.scheduleTimezone||'UTC');
      if(interval.allDay)await reconcileBookingDayAvailability(conn,booking.artistId,booking.eventDate);
    }
    if(conflict&&!alreadyRecorded){
      for(const userId of owners)await conn.execute("INSERT INTO notifications (userId,type,title,message,actionUrl,isRead) VALUES (?,'payment','Payment received — schedule review required',?,?,0)",[userId,'Payment was recorded, but this booking could not be automatically confirmed. Review its current status and schedule before proceeding.',`/booking/${bookingId}`]);
    }
  });
}

export async function setScheduledAvailability(userId:number,artistId:number,dates:string[],status:'available'|'booked'|'unavailable',timezone='UTC'):Promise<void>{
  if(!dates.length||dates.length>91)throw new TRPCError({code:'BAD_REQUEST',message:'Choose at most 91 calendar days.'});
  dates.forEach(date=>scheduleDateSchema.parse(date));
  await withScheduleLock([userId],async conn=>{
    const [artists]=await conn.execute<RowDataPacket[]>('SELECT userId FROM artist_profiles WHERE id=?',[artistId]);
    if(Number(artists[0]?.userId)!==userId)throw new TRPCError({code:'FORBIDDEN',message:'You cannot edit this calendar.'});
    for(const date of dates){
      const [rows]=await conn.execute<RowDataPacket[]>('SELECT id,status FROM availability WHERE artistId=? AND date=? FOR UPDATE',[artistId,date]);
      if(status!=='available'&&!(rows.length&&rows.every(row=>row.status===status))){
        const interval=resolveScheduleInterval({date,timezone,allDay:true});
        await assertNoScheduleConflict(conn,[userId],interval,{availabilityId:rows[0]?.id});
      }
      if(rows.length)await conn.execute('UPDATE availability SET status=? WHERE artistId=? AND date=?',[status,artistId,date]);
      else await conn.execute('INSERT INTO availability (artistId,date,status) VALUES (?,?,?)',[artistId,date,status]);
      if(status==='available')await reconcileBookingDayAvailability(conn,artistId,date);
    }
  });
}
export async function deleteScheduledAvailability(userId:number,artistId:number,ids:number[]):Promise<void>{
  await withScheduleLock([userId],async conn=>{
    const [artists]=await conn.execute<RowDataPacket[]>('SELECT userId FROM artist_profiles WHERE id=?',[artistId]);
    if(Number(artists[0]?.userId)!==userId)throw new TRPCError({code:'FORBIDDEN',message:'You cannot edit this calendar.'});
    for(const id of ids){
      const [rows]=await conn.execute<RowDataPacket[]>('SELECT id,date FROM availability WHERE id=? AND artistId=? FOR UPDATE',[id,artistId]);
      if(!rows[0])throw new TRPCError({code:'NOT_FOUND',message:'Availability entry not found.'});
      await conn.execute('DELETE FROM availability WHERE id=? AND artistId=?',[id,artistId]);
      await reconcileBookingDayAvailability(conn,artistId,rows[0].date);
    }
  });
}

export async function setVenueScheduledDates(userId:number,venueId:number,dates:string[],blocked:boolean,reason?:string,timezone='UTC'):Promise<void>{
  if(!dates.length||dates.length>91)throw new TRPCError({code:'BAD_REQUEST',message:'Choose at most 91 calendar days.'});
  dates.forEach(date=>scheduleDateSchema.parse(date));
  await withScheduleLock([userId],async conn=>{
    const [venues]=await conn.execute<RowDataPacket[]>('SELECT userId FROM venue_profiles WHERE id=?',[venueId]);
    if(Number(venues[0]?.userId)!==userId)throw new TRPCError({code:'FORBIDDEN',message:'You cannot edit this calendar.'});
    for(const date of dates){
      const [rows]=await conn.execute<RowDataPacket[]>('SELECT id FROM venue_blocked_dates WHERE venueId=? AND date=? FOR UPDATE',[venueId,date]);
      if(blocked){
        if(!rows.length){await assertNoScheduleConflict(conn,[userId],resolveScheduleInterval({date,timezone,allDay:true}));await conn.execute('INSERT INTO venue_blocked_dates (venueId,date,reason) VALUES (?,?,?)',[venueId,date,reason||null]);}
        else await conn.execute('UPDATE venue_blocked_dates SET reason=? WHERE venueId=? AND date=?',[reason||null,venueId,date]);
      }else await conn.execute('DELETE FROM venue_blocked_dates WHERE venueId=? AND date=?',[venueId,date]);
    }
  });
}

export async function setVenueScheduledRecurringBlock(userId:number,venueId:number,dayOfWeek:number,blocked:boolean,reason?:string,timezone='UTC'){
  if(!Number.isInteger(dayOfWeek)||dayOfWeek<0||dayOfWeek>6)throw new TRPCError({code:'BAD_REQUEST',message:'Choose a valid weekday.'});
  return withScheduleLock([userId],async conn=>{
    const [venues]=await conn.execute<RowDataPacket[]>('SELECT userId FROM venue_profiles WHERE id=?',[venueId]);
    if(Number(venues[0]?.userId)!==userId)throw new TRPCError({code:'FORBIDDEN',message:'You cannot edit this calendar.'});
    if(!blocked){await conn.execute('DELETE FROM venue_recurring_blocks WHERE venueId=? AND dayOfWeek=?',[venueId,dayOfWeek]);return null;}
    const [existing]=await conn.execute<RowDataPacket[]>('SELECT * FROM venue_recurring_blocks WHERE venueId=? AND dayOfWeek=? FOR UPDATE',[venueId,dayOfWeek]);
    if(!existing.some(row=>!!row.isActive)){
      const now=Date.now(),today=localDateAt(now,timezone);
      const [appointments]=await conn.execute<RowDataPacket[]>('SELECT * FROM schedule_appointments WHERE ownerUserId=? AND status=\'active\' AND endAt+travelMinutes*60000>? LIMIT 2001',[userId,now]);
      const [bookings]=await conn.execute<RowDataPacket[]>("SELECT b.*, DATE_FORMAT(b.eventDate,'%Y-%m-%d') AS eventDate FROM bookings b LEFT JOIN artist_profiles ap ON ap.id=b.artistId LEFT JOIN venue_profiles vp ON vp.id=b.venueId AND COALESCE(b.bookingSource,'') NOT IN ('client_booking','client') WHERE (ap.userId=? OR vp.userId=? OR (b.bookingSource IN ('client_booking','client') AND b.venueId=?)) AND b.status IN ('confirmed','completed') AND (b.scheduleEndAt+b.travelMinutes*60000>? OR (b.scheduleStartAt IS NULL AND b.eventDate>=?)) LIMIT 2001",[userId,userId,userId,now,today]);
      const [live]=await conn.execute<RowDataPacket[]>("SELECT UNIX_TIMESTAMP(s.startTime)*1000 AS startAt, UNIX_TIMESTAMP(s.endTime)*1000 AS endAt FROM ology_live_time_slots s JOIN ology_live_experiences e ON e.id=s.experienceId WHERE (s.talentId=? OR EXISTS(SELECT 1 FROM ology_live_bookings b WHERE b.experienceId=s.experienceId AND b.scheduledAt=s.startTime AND b.fanId=? AND b.status IN ('pending','confirmed'))) AND s.endTime>FROM_UNIXTIME(?/1000) AND ((e.isActive=1 AND s.isAvailable=1) OR s.spotsTaken>0 OR EXISTS(SELECT 1 FROM ology_live_bookings b WHERE b.experienceId=s.experienceId AND b.scheduledAt=s.startTime AND b.status IN ('pending','confirmed'))) LIMIT 2001",[userId,userId,now]);
      if([appointments,bookings,live].some(rows=>rows.length>2000))throw new TRPCError({code:'BAD_REQUEST',message:'This calendar has too many commitments for a recurring closure. Use individual day blocks instead.'});
      const intervals=[...appointments.map(row=>({...row,startAt:Number(row.startAt),endAt:Number(row.endAt),preparationMinutes:Number(row.preparationMinutes||0),travelMinutes:Number(row.travelMinutes||0)})),...bookings.map(row=>getBookingScheduleInterval(row,timezone)),...live.map(row=>({...row,startAt:Number(row.startAt),endAt:Number(row.endAt),preparationMinutes:0,travelMinutes:0}))];
      for(const interval of intervals){const r=bufferedInterval(interval);for(let date=localDateAt(r.startAt,timezone);date<=localDateAt(r.endAt-1,timezone);date=addCalendarDays(date,1)){
        if(Temporal.PlainDate.from(date).dayOfWeek%7===dayOfWeek)throw new TRPCError({code:'CONFLICT',message:'This recurring closure overlaps an existing commitment. Review your Schedule first.'});
      }}
    }
    if(existing.length){await conn.execute('UPDATE venue_recurring_blocks SET isActive=1,reason=? WHERE venueId=? AND dayOfWeek=?',[reason||null,venueId,dayOfWeek]);return {...existing[0],isActive:true,reason};}
    const [result]=await conn.execute('INSERT INTO venue_recurring_blocks (venueId,dayOfWeek,reason,isActive) VALUES (?,?,?,1)',[venueId,dayOfWeek,reason||null]);return {id:Number((result as any).insertId),venueId,dayOfWeek,reason,isActive:true};
  });
}
