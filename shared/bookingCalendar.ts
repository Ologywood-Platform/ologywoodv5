export type BookingCalendarInput = {
  id: number;
  venueName?: string | null;
  venueAddress?: string | null;
  eventDetails?: string | null;
  status?: string | null;
  scheduleStartAt?: number | null;
  scheduleEndAt?: number | null;
  scheduleTimezone?: string | null;
  scheduleAllDay?: boolean | null;
  eventDate?: Date | string | null;
};

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function formatUtcDateTime(epoch: number): string {
  const date = new Date(epoch);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function formatLocalDate(epoch: number, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(epoch);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}`;
}

function formatFallbackDate(value: Date | string | null | undefined): string {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

/** Build a downloadable RFC 5545 VCALENDAR for one booking. */
export function buildBookingIcs(booking: BookingCalendarInput, now = new Date()): string {
  const hasSchedule = typeof booking.scheduleStartAt === "number" && typeof booking.scheduleEndAt === "number";
  const timezone = booking.scheduleTimezone || "UTC";
  const allDay = Boolean(booking.scheduleAllDay);
  const summary = "OlogyWood booking";
  const location = [booking.venueName, booking.venueAddress].filter(Boolean).join(", ");
  const description = [
    booking.eventDetails,
    `Booking #${booking.id}`,
    booking.scheduleTimezone ? `Timezone: ${booking.scheduleTimezone}` : null,
  ].filter(Boolean).join("\n");

  let start: string;
  let end: string;
  if (hasSchedule) {
    if (allDay) {
      start = formatLocalDate(booking.scheduleStartAt!, timezone);
      end = formatLocalDate(booking.scheduleEndAt!, timezone);
      // RFC 5545 all-day DTEND is exclusive; the stored schedule end is already exclusive.
    } else {
      start = formatUtcDateTime(booking.scheduleStartAt!);
      end = formatUtcDateTime(booking.scheduleEndAt!);
    }
  } else {
    const date = formatFallbackDate(booking.eventDate);
    start = date;
    end = date;
  }

  const dateProperty = allDay || !hasSchedule ? `DTSTART;VALUE=DATE:${start}\r\nDTEND;VALUE=DATE:${end}` : `DTSTART:${start}\r\nDTEND:${end}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OlogyWood//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:ologywood-booking-${booking.id}@ologywood.com`,
    `DTSTAMP:${formatUtcDateTime(now.getTime())}`,
    dateProperty,
    `SUMMARY:${escapeIcsText(summary)}`,
    ...(location ? [`LOCATION:${escapeIcsText(location)}`] : []),
    ...(description ? [`DESCRIPTION:${escapeIcsText(description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
}
