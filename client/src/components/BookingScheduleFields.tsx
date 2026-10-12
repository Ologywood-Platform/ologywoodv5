import { useState } from "react";
import {
  addCalendarDays,
  localDateAt,
  type ScheduleTimingInput,
} from "@shared/schedule";

const MAJOR_TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export interface BookingScheduleFieldsProps {
  /** The parent owns this value so a submit error never clears the schedule. */
  value: ScheduleTimingInput;
  onChange: (value: ScheduleTimingInput) => void;
  disabled?: boolean;
  /** Retained only for legacy booking requests which supplied a start time without an interval. */
  legacyEventTime?: string;
  idPrefix?: string;
  className?: string;
}

/**
 * Explicit timing controls shared by every ordinary booking request surface.
 * Date values intentionally remain calendar strings (YYYY-MM-DD), never UTC dates.
 */
export function BookingScheduleFields({
  value,
  onChange,
  disabled = false,
  legacyEventTime,
  idPrefix = "booking-schedule",
  className = "",
}: BookingScheduleFieldsProps) {
  // Lazy browser lookup avoids module-time access to browser-only Intl settings.
  const [browserTimezone] = useState(getBrowserTimezone);
  const schedule = {
    date: value.date || "",
    endDate: value.endDate,
    startTime: value.startTime || "",
    endTime: value.endTime || "",
    allDay: value.allDay ?? true,
    timezone: value.timezone || browserTimezone,
    preparationMinutes: value.preparationMinutes ?? 0,
    travelMinutes: value.travelMinutes ?? 0,
  };
  const timezoneOptions = MAJOR_TIMEZONES.includes(
    browserTimezone as (typeof MAJOR_TIMEZONES)[number]
  )
    ? MAJOR_TIMEZONES
    : [browserTimezone, ...MAJOR_TIMEZONES];
  const minimumDate = localDateAt(Date.now(), schedule.timezone);
  const displayedEndDate = schedule.endDate || schedule.date;
  const nextDay = schedule.date ? addCalendarDays(schedule.date, 1) : "";
  const isNextDay = Boolean(nextDay && displayedEndDate === nextDay);

  const update = (patch: Partial<ScheduleTimingInput>) => {
    onChange({ ...schedule, ...patch });
  };

  const updateStartDate = (date: string) => {
    let endDate = schedule.endDate;
    if (endDate && endDate < date) endDate = date;
    update({ date, endDate });
  };

  const updateEndDate = (endDate: string) => {
    // An omitted end date is the canonical same-day form in the shared contract.
    update({
      endDate: !endDate || endDate === schedule.date ? undefined : endDate,
    });
  };

  const updateMinutes = (
    field: "preparationMinutes" | "travelMinutes",
    raw: string
  ) => {
    const numberValue = Number(raw);
    update({
      [field]: Number.isFinite(numberValue)
        ? Math.max(0, Math.min(720, Math.trunc(numberValue)))
        : 0,
    });
  };

  return (
    <fieldset
      disabled={disabled}
      className={`space-y-4 rounded-lg border border-border bg-muted/20 p-4 ${className}`}
    >
      <legend className="px-1 text-sm font-semibold text-foreground">
        Booking timing
      </legend>
      <p className="text-xs text-muted-foreground">
        Select a date-level reservation or a timed appointment. Times are
        interpreted in the selected timezone.
      </p>

      <div
        className="grid gap-3 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Booking timing type"
      >
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${schedule.allDay ? "border-primary bg-primary/5" : "border-border"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <input
            type="radio"
            name={`${idPrefix}-timing-kind`}
            value="all-day"
            checked={schedule.allDay}
            onChange={() => update({ allDay: true })}
            disabled={disabled}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium">
              Date-level reservation
            </span>
            <span className="block text-xs text-muted-foreground">
              All day; no duration is assumed.
            </span>
          </span>
        </label>
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${!schedule.allDay ? "border-primary bg-primary/5" : "border-border"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <input
            type="radio"
            name={`${idPrefix}-timing-kind`}
            value="timed"
            checked={!schedule.allDay}
            onChange={() => update({ allDay: false })}
            disabled={disabled}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium">Timed appointment</span>
            <span className="block text-xs text-muted-foreground">
              Start and end times are required.
            </span>
          </span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${idPrefix}-date`} className="text-sm font-medium">
            {schedule.allDay ? "Reservation date" : "Start date"}{" "}
            <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${idPrefix}-date`}
            name="scheduleDate"
            type="date"
            value={schedule.date}
            min={minimumDate}
            onChange={event => updateStartDate(event.target.value)}
            disabled={disabled}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor={`${idPrefix}-timezone`}
            className="text-sm font-medium"
          >
            Timezone <span aria-hidden="true">*</span>
          </label>
          <select
            id={`${idPrefix}-timezone`}
            name="scheduleTimezone"
            value={schedule.timezone}
            onChange={event => update({ timezone: event.target.value })}
            disabled={disabled}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {timezoneOptions.map(timezone => (
              <option key={timezone} value={timezone}>
                {timezone === browserTimezone
                  ? `Browser timezone (${timezone})`
                  : timezone}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            All dates and times shown here are in this timezone.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor={`${idPrefix}-end-date`}
            className="text-sm font-medium"
          >
            {schedule.allDay ? "Ends on" : "End date"}
          </label>
          <input
            id={`${idPrefix}-end-date`}
            name="scheduleEndDate"
            type="date"
            value={displayedEndDate}
            min={schedule.date || minimumDate}
            onChange={event => updateEndDate(event.target.value)}
            disabled={disabled || !schedule.date}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground">
            Leave on the same date for a one-day reservation.
          </p>
        </div>
        {!schedule.allDay && (
          <div className="flex items-end pb-1">
            <label
              className={`flex cursor-pointer items-center gap-2 text-sm ${disabled || !schedule.date ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                id={`${idPrefix}-next-day`}
                name="scheduleNextDay"
                type="checkbox"
                checked={isNextDay}
                onChange={event =>
                  update({
                    endDate:
                      event.target.checked && schedule.date
                        ? addCalendarDays(schedule.date, 1)
                        : undefined,
                  })
                }
                disabled={disabled || !schedule.date}
              />
              <span>
                <strong>Next Day</strong> (overnight)
              </span>
            </label>
          </div>
        )}
      </div>

      {!schedule.allDay && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor={`${idPrefix}-start-time`}
                className="text-sm font-medium"
              >
                Start time <span aria-hidden="true">*</span>
              </label>
              <input
                id={`${idPrefix}-start-time`}
                name="scheduleStartTime"
                type="time"
                value={schedule.startTime}
                onChange={event => update({ startTime: event.target.value })}
                disabled={disabled}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor={`${idPrefix}-end-time`}
                className="text-sm font-medium"
              >
                End time <span aria-hidden="true">*</span>
              </label>
              <input
                id={`${idPrefix}-end-time`}
                name="scheduleEndTime"
                type="time"
                value={schedule.endTime}
                onChange={event => update({ endTime: event.target.value })}
                disabled={disabled}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor={`${idPrefix}-preparation`}
                className="text-sm font-medium"
              >
                Preparation before (minutes)
              </label>
              <input
                id={`${idPrefix}-preparation`}
                name="preparationMinutes"
                type="number"
                min="0"
                max="720"
                step="1"
                value={schedule.preparationMinutes}
                onChange={event =>
                  updateMinutes("preparationMinutes", event.target.value)
                }
                disabled={disabled}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor={`${idPrefix}-travel`}
                className="text-sm font-medium"
              >
                Travel after (minutes)
              </label>
              <input
                id={`${idPrefix}-travel`}
                name="travelMinutes"
                type="number"
                min="0"
                max="720"
                step="1"
                value={schedule.travelMinutes}
                onChange={event =>
                  updateMinutes("travelMinutes", event.target.value)
                }
                disabled={disabled}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </>
      )}

      {schedule.allDay && legacyEventTime && (
        <p className="rounded-md bg-background p-2 text-xs text-muted-foreground">
          Legacy start time <strong>{legacyEventTime}</strong> is informational
          only; this remains a date-level reservation.
        </p>
      )}
    </fieldset>
  );
}

export default BookingScheduleFields;
