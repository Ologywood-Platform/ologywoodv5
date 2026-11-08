import { describe, expect, it } from "vitest";
import { buildBookingIcs } from "../shared/bookingCalendar";

describe("booking calendar export", () => {
  it("exports a timed schedule in UTC with booking details", () => {
    const ics = buildBookingIcs({
      id: 42,
      venueName: "The Hall, Main Room",
      venueAddress: "1 Test St",
      eventDetails: "Radio interview\nBring rider",
      scheduleStartAt: Date.parse("2026-11-10T20:00:00Z"),
      scheduleEndAt: Date.parse("2026-11-10T21:30:00Z"),
      scheduleTimezone: "America/New_York",
      scheduleAllDay: false,
    }, new Date("2026-11-01T00:00:00Z"));

    expect(ics).toContain("UID:ologywood-booking-42@ologywood.com");
    expect(ics).toContain("DTSTART:20261110T200000Z");
    expect(ics).toContain("DTEND:20261110T213000Z");
    expect(ics).toContain("LOCATION:The Hall\\, Main Room\\, 1 Test St");
    expect(ics).toContain("DESCRIPTION:Radio interview\\nBring rider");
  });

  it("exports all-day schedules with the exclusive end date", () => {
    const ics = buildBookingIcs({
      id: 7,
      scheduleStartAt: Date.parse("2026-11-12T05:00:00Z"),
      scheduleEndAt: Date.parse("2026-11-14T05:00:00Z"),
      scheduleTimezone: "America/New_York",
      scheduleAllDay: true,
    });

    expect(ics).toContain("DTSTART;VALUE=DATE:20261112");
    expect(ics).toContain("DTEND;VALUE=DATE:20261114");
  });

  it("falls back to the booking event date when no workspace schedule exists", () => {
    const ics = buildBookingIcs({ id: 9, eventDate: "2026-12-03T15:00:00Z" });

    expect(ics).toContain("DTSTART;VALUE=DATE:20261203");
    expect(ics).toContain("DTEND;VALUE=DATE:20261203");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
