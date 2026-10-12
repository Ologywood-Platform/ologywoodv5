import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { localDateAt, resolveScheduleInterval } from "../shared/schedule";

const projectRoot = new URL("..", import.meta.url);
const source = (relativePath: string) =>
  readFileSync(new URL(relativePath, projectRoot), "utf8");

describe("ordinary booking schedule UI", () => {
  it("renders explicit date-level/timed controls and typed timing inputs", () => {
    const fields = source("client/src/components/BookingScheduleFields.tsx");

    expect(fields).toContain("Date-level reservation");
    expect(fields).toContain("Timed appointment");
    expect(fields).toContain('name="scheduleDate"');
    expect(fields).toContain('name="scheduleStartTime"');
    expect(fields).toContain('name="scheduleEndTime"');
    expect(fields).toContain('name="scheduleTimezone"');
    expect(fields).toContain('name="preparationMinutes"');
    expect(fields).toContain('name="travelMinutes"');
    expect(fields).toContain("Next Day");
    expect(fields).toContain("localDateAt(Date.now(), schedule.timezone)");
    expect(fields).not.toContain("toISOString().split");
  });

  it("wires the same controlled component and schedule payload into every ordinary booking request", () => {
    for (const relativePath of [
      "client/src/pages/BookingCreate.tsx",
      "client/src/pages/ClientBooking.tsx",
      "client/src/components/QuickBookingModal.tsx",
    ]) {
      const file = source(relativePath);
      expect(file).toContain("BookingScheduleFields");
      expect(file).toContain("resolveScheduleInterval");
      expect(file).toMatch(
        /schedule(?:\s*:\s*(formData\.schedule|form\.schedule|schedule)|\s*,)/
      );
    }
  });

  it("resolves all-day and overnight timed booking intervals without guessing a duration", () => {
    const allDay = resolveScheduleInterval({
      date: "2030-05-15",
      allDay: true,
      timezone: "America/New_York",
      preparationMinutes: 120,
      travelMinutes: 30,
    });
    expect(allDay.allDay).toBe(true);
    expect(allDay.preparationMinutes).toBe(0);
    expect(allDay.travelMinutes).toBe(0);
    expect(localDateAt(allDay.startAt, allDay.timezone)).toBe("2030-05-15");
    expect(localDateAt(allDay.endAt - 1, allDay.timezone)).toBe("2030-05-15");

    const overnight = resolveScheduleInterval({
      date: "2030-05-15",
      endDate: "2030-05-16",
      startTime: "22:30",
      endTime: "01:15",
      allDay: false,
      timezone: "America/New_York",
      preparationMinutes: 45,
      travelMinutes: 30,
    });
    expect(overnight.endAt).toBeGreaterThan(overnight.startAt);
    expect(overnight.preparationMinutes).toBe(45);
    expect(overnight.travelMinutes).toBe(30);
  });

  it("rejects incomplete and non-overnight timed schedules before a request could mutate", () => {
    expect(() =>
      resolveScheduleInterval({
        date: "2030-05-15",
        allDay: false,
        timezone: "America/New_York",
        preparationMinutes: 0,
        travelMinutes: 0,
      })
    ).toThrow();

    expect(() =>
      resolveScheduleInterval({
        date: "2030-05-15",
        startTime: "20:00",
        endTime: "19:00",
        allDay: false,
        timezone: "America/New_York",
        preparationMinutes: 0,
        travelMinutes: 0,
      })
    ).toThrow("For overnight appointments");
  });
});
