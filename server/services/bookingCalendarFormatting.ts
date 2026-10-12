import { addCalendarDays, localDateAt } from '../../shared/schedule';
import { getDateOnlyKey } from '../../shared/dateOnly';

export interface CalendarBookingTiming {
  eventDate: Date | string; scheduleStartAt?: number | null; scheduleEndAt?: number | null;
  scheduleTimezone?: string | null; scheduleAllDay?: boolean | number | null;
}
export function icalUtcDate(epoch:number):string {
  return new Date(epoch).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
}
export function bookingCalendarDateLines(booking:CalendarBookingTiming):string[] {
  const timed = booking.scheduleStartAt!=null && booking.scheduleEndAt!=null && !booking.scheduleAllDay;
  if(timed){
    if(!Number.isFinite(Number(booking.scheduleStartAt)) || Number(booking.scheduleEndAt)<=Number(booking.scheduleStartAt)) throw new Error('Invalid stored booking interval');
    return [`DTSTART:${icalUtcDate(Number(booking.scheduleStartAt))}`,`DTEND:${icalUtcDate(Number(booking.scheduleEndAt))}`];
  }
  const zone=booking.scheduleTimezone||'UTC';
  const start=booking.scheduleStartAt!=null?localDateAt(Number(booking.scheduleStartAt),zone):getDateOnlyKey(booking.eventDate);
  if(!start)throw new Error('Invalid booking date');
  const end=booking.scheduleEndAt!=null?localDateAt(Number(booking.scheduleEndAt),zone):addCalendarDays(start,1);
  return [`DTSTART;VALUE=DATE:${start.replace(/-/g,'')}`,`DTEND;VALUE=DATE:${end.replace(/-/g,'')}`];
}
