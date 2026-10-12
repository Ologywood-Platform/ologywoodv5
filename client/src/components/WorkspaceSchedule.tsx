import { Temporal } from '@js-temporal/polyfill';
import { Link } from 'wouter';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import {
  SCHEDULE_CATEGORIES,
  addCalendarDays,
  formatScheduleTime,
  localDateAt,
  resolveScheduleInterval,
  scheduleAppointmentSchema,
  type ScheduleAppointmentInput,
  type ScheduleEntry,
} from '@shared/schedule';

type ScheduleCategory = keyof typeof SCHEDULE_CATEGORIES;
type RangeMode = 'day' | 'week';
type ReminderValue = 'off' | '0' | '15' | '30' | '60' | '1440';

type AppointmentDraft = {
  title: string;
  category: ScheduleCategory;
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  timezone: string;
  preparationMinutes: string;
  travelMinutes: string;
  location: string;
  notes: string;
  reminder: ReminderValue;
  nextDay: boolean;
};

export type WorkspaceScheduleProps = {
  /** The creator owner selected by the existing team-workspace context, if applicable. */
  ownerUserId?: number;
};

const CATEGORY_OPTIONS = Object.entries(SCHEDULE_CATEGORIES) as Array<[ScheduleCategory, string]>;
const REMINDER_OPTIONS: Array<{ value: ReminderValue; label: string }> = [
  { value: 'off', label: 'Off' },
  { value: '0', label: 'At start time' },
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '1440', label: '1 day before' },
];

function browserTimezone() {
  const candidate = Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate });
    return candidate;
  } catch {
    return 'UTC';
  }
}

function timezoneLabel(timezone: string) {
  const labels: Record<string, string> = {
    UTC: 'UTC — Coordinated Universal Time',
    'America/Los_Angeles': 'Pacific Time — Los Angeles',
    'America/Denver': 'Mountain Time — Denver',
    'America/Chicago': 'Central Time — Chicago',
    'America/New_York': 'Eastern Time — New York',
    'Europe/London': 'United Kingdom — London',
    'Europe/Paris': 'Central Europe — Paris',
    'Africa/Lagos': 'West Africa — Lagos',
    'Africa/Johannesburg': 'South Africa — Johannesburg',
    'Asia/Dubai': 'Gulf Time — Dubai',
    'Asia/Kolkata': 'India — Kolkata',
    'Asia/Tokyo': 'Japan — Tokyo',
    'Asia/Singapore': 'Singapore',
  };
  return labels[timezone] || timezone.replaceAll('_', ' ');
}

function timezoneOptions(currentTimezone: string) {
  return Array.from(new Set([
    currentTimezone,
    'UTC',
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'Europe/London',
    'Europe/Paris',
    'Africa/Lagos',
    'Africa/Johannesburg',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Tokyo',
    'Asia/Singapore',
  ]));
}

function dateStartAt(date: string, timezone: string) {
  return Temporal.PlainDate.from(date).toZonedDateTime({ timeZone: timezone, plainTime: '00:00' }).epochMilliseconds;
}

function localTimeValue(epoch: number, timezone: string) {
  return Temporal.Instant.fromEpochMilliseconds(epoch).toZonedDateTimeISO(timezone).toPlainTime().toString({ smallestUnit: 'minute' });
}

function endDateForEntry(entry: ScheduleEntry) {
  if (entry.allDay) return localDateAt(entry.endAt - 1, entry.timezone);
  return localDateAt(entry.endAt, entry.timezone);
}

function isSafeInternalPath(value: string | null): value is string {
  return Boolean(value && value.startsWith('/') && !value.startsWith('//'));
}

function sourceLabel(source: ScheduleEntry['source']) {
  if (source === 'appointment') return 'Private appointment';
  if (source === 'booking') return 'Booking';
  if (source === 'live') return 'Ology Live';
  return 'All-day block';
}

function sourceBadgeClass(source: ScheduleEntry['source']) {
  if (source === 'appointment') return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200';
  if (source === 'booking') return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200';
  if (source === 'live') return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200';
  return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';
}

function hasEntryOnDate(entry: ScheduleEntry, date: string, timezone: string) {
  const from = dateStartAt(date, timezone);
  const to = dateStartAt(addCalendarDays(date, 1), timezone);
  return entry.startAt < to && entry.endAt > from;
}

function toDraft(entry: ScheduleEntry, fallbackTimezone: string): AppointmentDraft {
  const endDate = endDateForEntry(entry);
  return {
    title: entry.title,
    category: (entry.category in SCHEDULE_CATEGORIES ? entry.category : 'other') as ScheduleCategory,
    date: entry.date,
    endDate,
    startTime: entry.allDay ? '09:00' : localTimeValue(entry.startAt, entry.timezone),
    endTime: entry.allDay ? '10:00' : localTimeValue(entry.endAt, entry.timezone),
    allDay: entry.allDay,
    timezone: entry.timezone || fallbackTimezone,
    preparationMinutes: String(entry.preparationMinutes),
    travelMinutes: String(entry.travelMinutes),
    location: entry.location,
    notes: entry.notes,
    reminder: entry.reminderMinutes === null ? 'off' : String(entry.reminderMinutes) as ReminderValue,
    nextDay: endDate === addCalendarDays(entry.date, 1),
  };
}

function blankDraft(date: string, timezone: string): AppointmentDraft {
  return {
    title: '',
    category: 'other',
    date,
    endDate: date,
    startTime: '09:00',
    endTime: '10:00',
    allDay: false,
    timezone,
    preparationMinutes: '0',
    travelMinutes: '0',
    location: '',
    notes: '',
    reminder: '30',
    nextDay: false,
  };
}

function friendlyError(error: unknown) {
  return error instanceof Error ? error.message : 'Schedule is temporarily unavailable. Please try again.';
}

function dateHeading(date: string, timezone: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .format(dateStartAt(date, timezone));
}

function timeLabel(entry: ScheduleEntry, viewTimezone: string) {
  if (entry.allDay) {
    const endDate = endDateForEntry(entry);
    return entry.date === endDate
      ? `All day · ${timezoneLabel(entry.timezone)}`
      : `All day ${entry.date}–${endDate} · ${timezoneLabel(entry.timezone)}`;
  }
  const display = `${formatScheduleTime(entry.startAt, viewTimezone)} – ${formatScheduleTime(entry.endAt, viewTimezone)}`;
  return entry.timezone === viewTimezone ? display : `${display} · originally ${timezoneLabel(entry.timezone)}`;
}

function entryFormInput(draft: AppointmentDraft): ScheduleAppointmentInput {
  const preparationMinutes = draft.allDay ? 0 : Number(draft.preparationMinutes);
  const travelMinutes = draft.allDay ? 0 : Number(draft.travelMinutes);
  return {
    title: draft.title.trim(),
    category: draft.category,
    date: draft.date,
    endDate: draft.endDate,
    allDay: draft.allDay,
    timezone: draft.timezone,
    preparationMinutes,
    travelMinutes,
    location: draft.location.trim(),
    notes: draft.notes.trim(),
    reminderMinutes: draft.reminder === 'off' ? null : Number(draft.reminder),
    ...(draft.allDay ? {} : { startTime: draft.startTime, endTime: draft.endTime }),
  };
}

export function WorkspaceSchedule({ ownerUserId }: WorkspaceScheduleProps) {
  const [browserZone] = useState(browserTimezone);
  const [viewTimezone, setViewTimezone] = useState(browserZone);
  const [selectedDate, setSelectedDate] = useState(() => localDateAt(Date.now(), browserZone));
  const [rangeMode, setRangeMode] = useState<RangeMode>('week');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
  const [draft, setDraft] = useState<AppointmentDraft>(() => blankDraft(localDateAt(Date.now(), browserZone), browserZone));
  const [formError, setFormError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const dialogSession = useRef(0);
  const utils = trpc.useUtils();

  const contextQuery = trpc.schedule.context.useQuery(
    ownerUserId ? { ownerUserId } : undefined,
    { retry: false },
  );
  const effectiveOwnerUserId = contextQuery.data?.isCollaborator ? contextQuery.data.ownerUserId : ownerUserId;
  const rangeEnd = useMemo(
    () => rangeMode === 'week' ? addCalendarDays(selectedDate, 6) : selectedDate,
    [rangeMode, selectedDate],
  );
  const agendaInput = useMemo(() => ({
    fromDate: selectedDate,
    toDate: rangeEnd,
    timezone: viewTimezone,
    ...(effectiveOwnerUserId ? { ownerUserId: effectiveOwnerUserId } : {}),
  }), [effectiveOwnerUserId, rangeEnd, selectedDate, viewTimezone]);
  const agendaQuery = trpc.schedule.agenda.useQuery(agendaInput, {
    enabled: contextQuery.data?.canManage === true,
    retry: false,
    refetchInterval: 45_000,
  });

  const createMutation = trpc.schedule.create.useMutation();
  const updateMutation = trpc.schedule.update.useMutation();
  const cancelMutation = trpc.schedule.cancel.useMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const refreshSchedule = useCallback(async () => {
    await Promise.all([
      utils.schedule.agenda.invalidate(),
      utils.notifications.unreadCount.invalidate(),
      utils.notifications.list.invalidate(),
    ]);
  }, [utils]);

  const visibleDates = useMemo(() => {
    const dates: string[] = [];
    for (let date = selectedDate; date <= rangeEnd; date = addCalendarDays(date, 1)) dates.push(date);
    return dates;
  }, [rangeEnd, selectedDate]);

  const openCreate = () => {
    dialogSession.current += 1;
    setEditingEntry(null);
    setDraft(blankDraft(selectedDate, viewTimezone));
    setFormError(null);
    setMutationError(null);
    setDialogOpen(true);
  };

  const openEdit = (entry: ScheduleEntry) => {
    dialogSession.current += 1;
    setEditingEntry(entry);
    setDraft(toDraft(entry, viewTimezone));
    setFormError(null);
    setMutationError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (isSubmitting) return;
    setDialogOpen(false);
    setFormError(null);
    setMutationError(null);
  };

  const moveRange = (amount: number) => {
    setSelectedDate((date) => addCalendarDays(date, rangeMode === 'week' ? amount * 7 : amount));
  };

  const submitAppointment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setMutationError(null);

    let appointment: ScheduleAppointmentInput;
    try {
      appointment = entryFormInput(draft);
      scheduleAppointmentSchema.parse(appointment);
      resolveScheduleInterval(appointment);
    } catch (error) {
      setFormError(friendlyError(error));
      return;
    }

    const sessionAtSubmit = dialogSession.current;
    const owner = effectiveOwnerUserId ? { ownerUserId: effectiveOwnerUserId } : {};
    const success = async () => {
      await refreshSchedule();
      if (dialogSession.current === sessionAtSubmit) {
        setDialogOpen(false);
        setFormError(null);
      }
    };
    const failed = (error: unknown) => setMutationError(friendlyError(error));

    if (editingEntry) {
      updateMutation.mutate({ ...appointment, ...owner, id: editingEntry.sourceId, expectedRevision: editingEntry.revision }, { onSuccess: success, onError: failed });
    } else {
      createMutation.mutate({ ...appointment, ...owner }, { onSuccess: success, onError: failed });
    }
  };

  const cancelAppointment = (entry: ScheduleEntry) => {
    setMutationError(null);
    const owner = effectiveOwnerUserId ? { ownerUserId: effectiveOwnerUserId } : {};
    cancelMutation.mutate({ id: entry.sourceId, expectedRevision: entry.revision, ...owner }, {
      onSuccess: async () => {
        await refreshSchedule();
        if (editingEntry?.id === entry.id) closeDialog();
      },
      onError: (error) => setMutationError(friendlyError(error)),
    });
  };

  const agenda = agendaQuery.data;
  const canManage = contextQuery.data?.canManage === true;

  return (
    <section id="schedule" className="scroll-mt-24 space-y-5" aria-labelledby="schedule-heading">
      <Card className="overflow-hidden border-violet-200/80 dark:border-violet-900/60">
        <CardHeader className="gap-4 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white pb-5 dark:border-violet-900/50 dark:from-violet-950/30 dark:to-slate-900">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CalendarDays className="h-5 w-5 shrink-0 text-violet-700 dark:text-violet-300" />
                <CardTitle id="schedule-heading" role="heading" aria-level={2} className="text-xl">Schedule</CardTitle>
                {contextQuery.data?.isCollaborator && <Badge variant="outline">{contextQuery.data.name}&rsquo;s calendar</Badge>}
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-5 text-muted-foreground">
                Keep private commitments beside bookings and Ology Live. This is a planning calendar, not checkout; private calendar details are shared only with authorized team members who can manage the calendar.
              </p>
            </div>
            {canManage && <Button onClick={openCreate} className="w-full shrink-0 sm:w-auto"><Plus className="mr-2 h-4 w-4" />Add private appointment</Button>}
          </div>
          <p className="rounded-lg border border-violet-100 bg-white/75 px-3 py-2 text-xs leading-5 text-slate-600 dark:border-violet-900/60 dark:bg-slate-950/40 dark:text-slate-300">
            Reminders are in-app notices refreshed while OlogyWood is open. No background delivery is guaranteed.
          </p>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {contextQuery.isLoading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading calendar access…</div>
          ) : contextQuery.isError ? (
            <ScheduleError title="Calendar access could not be checked" detail={friendlyError(contextQuery.error)} onRetry={() => void contextQuery.refetch()} />
          ) : !canManage ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100">
              <div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><h3 className="font-semibold">Calendar access is not granted</h3><p className="mt-1 text-sm leading-5">You can see that you support {contextQuery.data?.name || 'this account'}, but its owner has not granted the existing <strong>manage calendar</strong> permission. No calendar details are shown.</p></div></div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div className="flex flex-wrap items-center gap-2" aria-label="Schedule range controls">
                  <Button type="button" variant="outline" size="icon" onClick={() => moveRange(-1)} aria-label="Previous schedule range"><ChevronLeft className="h-4 w-4" /></Button>
                  <Input aria-label="Agenda start date" type="date" value={selectedDate} onChange={(event) => { if (event.target.value) setSelectedDate(event.target.value); }} className="w-[154px] bg-background" />
                  <Button type="button" variant="outline" size="icon" onClick={() => moveRange(1)} aria-label="Next schedule range"><ChevronRight className="h-4 w-4" /></Button>
                  <div className="flex rounded-lg border bg-muted/30 p-1" aria-label="Agenda range">
                    <Button type="button" size="sm" variant={rangeMode === 'day' ? 'default' : 'ghost'} onClick={() => setRangeMode('day')}>Day</Button>
                    <Button type="button" size="sm" variant={rangeMode === 'week' ? 'default' : 'ghost'} onClick={() => setRangeMode('week')}>Week</Button>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedDate(localDateAt(Date.now(), viewTimezone))}>Today</Button>
                </div>
                <div className="min-w-0 sm:w-[300px]">
                  <Label htmlFor="schedule-view-timezone" className="mb-1.5 block text-xs text-muted-foreground">Viewing in timezone</Label>
                  <Select value={viewTimezone} onValueChange={setViewTimezone}>
                    <SelectTrigger id="schedule-view-timezone" className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>{timezoneOptions(browserZone).map((timezone) => <SelectItem key={timezone} value={timezone}>{timezone === browserZone ? `Browser timezone — ${timezoneLabel(timezone)}` : timezoneLabel(timezone)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {agendaQuery.isLoading ? (
                <div className="flex items-center gap-2 rounded-xl border border-dashed p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading agenda…</div>
              ) : agendaQuery.isError ? (
                <ScheduleError title="Agenda could not be loaded" detail={friendlyError(agendaQuery.error)} onRetry={() => void agendaQuery.refetch()} />
              ) : agenda ? (
                <div className="space-y-5">
                  {visibleDates.map((date) => {
                    const dayEntries = agenda.entries.filter((entry) => hasEntryOnDate(entry, date, viewTimezone));
                    const allDayEntries = dayEntries.filter((entry) => entry.allDay);
                    const timedEntries = dayEntries.filter((entry) => !entry.allDay);
                    return (
                      <section key={date} className="min-w-0 rounded-xl border bg-card" aria-label={dateHeading(date, viewTimezone)}>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-4 py-3"><h3 className="font-semibold">{dateHeading(date, viewTimezone)}</h3>{dayEntries.length > 0 && <span className="text-xs text-muted-foreground">{dayEntries.length} commitment{dayEntries.length === 1 ? '' : 's'}</span>}</div>
                        {dayEntries.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">Nothing scheduled.</p> : <div className="divide-y">
                          {allDayEntries.length > 0 && <AgendaList entries={allDayEntries} viewTimezone={viewTimezone} canManage={canManage} onEdit={openEdit} onCancel={cancelAppointment} cancellingId={cancelMutation.variables?.id} isCancelling={cancelMutation.isPending} />}
                          {timedEntries.length > 0 && <AgendaList entries={timedEntries} viewTimezone={viewTimezone} canManage={canManage} onEdit={openEdit} onCancel={cancelAppointment} cancellingId={cancelMutation.variables?.id} isCancelling={cancelMutation.isPending} />}
                        </div>}
                      </section>
                    );
                  })}
                </div>
              ) : null}
              {mutationError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{mutationError}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="z-[10004] max-h-[90dvh] max-w-2xl overflow-y-auto p-4 sm:p-6" overlayClassName="z-[10003]" showCloseButton={!isSubmitting}>
          <DialogHeader className="pr-8">
            <DialogTitle>{editingEntry ? 'Edit private appointment' : 'Add private appointment'}</DialogTitle>
            <DialogDescription>Bookings and Ology Live sessions remain managed from their own pages. Times are saved in the timezone selected below.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={submitAppointment}>
            <div className="space-y-2"><Label htmlFor="appointment-title">Title</Label><Input id="appointment-title" maxLength={200} required value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Radio interview prep" /></div>
            <fieldset className="space-y-2"><legend className="text-sm font-medium">Category</legend><RadioGroup value={draft.category} onValueChange={(category) => setDraft((current) => ({ ...current, category: category as ScheduleCategory }))} className="grid gap-2 sm:grid-cols-2">
              {CATEGORY_OPTIONS.map(([value, label]) => <Label key={value} htmlFor={`category-${value}`} className="flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm font-normal hover:bg-muted/40"><RadioGroupItem value={value} id={`category-${value}`} />{label}</Label>)}
            </RadioGroup></fieldset>

            <div className="flex items-center justify-between rounded-lg border p-3"><div><Label htmlFor="appointment-all-day">All day</Label><p className="text-xs text-muted-foreground">All-day appointments include the final date.</p></div><input id="appointment-all-day" type="checkbox" checked={draft.allDay} onChange={(event) => setDraft((current) => ({ ...current, allDay: event.target.checked }))} className="h-4 w-4 accent-violet-600" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="appointment-date">Start date</Label><Input id="appointment-date" type="date" required value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value || current.date, endDate: event.target.value ? (current.nextDay ? addCalendarDays(event.target.value, 1) : event.target.value) : current.endDate }))} /></div>
              <div className="space-y-2"><Label htmlFor="appointment-end-date">{draft.allDay ? 'Last day (inclusive)' : 'End date'}</Label><Input id="appointment-end-date" type="date" required min={draft.date} value={draft.endDate} onChange={(event) => setDraft((current) => ({ ...current, endDate: event.target.value, nextDay: event.target.value === addCalendarDays(current.date, 1) }))} /></div>
            </div>
            {!draft.allDay && <>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.nextDay} onChange={(event) => setDraft((current) => ({ ...current, nextDay: event.target.checked, endDate: event.target.checked ? addCalendarDays(current.date, 1) : current.date }))} className="h-4 w-4 accent-violet-600" />Ends next day (for overnight appointments)</label>
              <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="appointment-start-time">Start time</Label><Input id="appointment-start-time" type="time" required value={draft.startTime} onChange={(event) => setDraft((current) => ({ ...current, startTime: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="appointment-end-time">End time</Label><Input id="appointment-end-time" type="time" required value={draft.endTime} onChange={(event) => setDraft((current) => ({ ...current, endTime: event.target.value }))} /></div></div>
              <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="appointment-prep">Preparation before (minutes)</Label><Input id="appointment-prep" type="number" min="0" max="720" step="1" value={draft.preparationMinutes} onChange={(event) => setDraft((current) => ({ ...current, preparationMinutes: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="appointment-travel">Travel after (minutes)</Label><Input id="appointment-travel" type="number" min="0" max="720" step="1" value={draft.travelMinutes} onChange={(event) => setDraft((current) => ({ ...current, travelMinutes: event.target.value }))} /></div></div>
            </>}
            <div className="space-y-2"><Label htmlFor="appointment-timezone">Appointment timezone</Label><Select value={draft.timezone} onValueChange={(timezone) => setDraft((current) => ({ ...current, timezone }))}><SelectTrigger id="appointment-timezone"><SelectValue /></SelectTrigger><SelectContent>{timezoneOptions(browserZone).concat(draft.timezone).filter((value, index, values) => values.indexOf(value) === index).map((timezone) => <SelectItem key={timezone} value={timezone}>{timezoneLabel(timezone)}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="appointment-location">Location or meeting details</Label><Input id="appointment-location" maxLength={500} value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Shown as plain text" /></div><div className="space-y-2"><Label htmlFor="appointment-reminder">In-app reminder</Label><Select value={draft.reminder} onValueChange={(reminder) => setDraft((current) => ({ ...current, reminder: reminder as ReminderValue }))}><SelectTrigger id="appointment-reminder"><SelectValue /></SelectTrigger><SelectContent>{REMINDER_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="space-y-2"><Label htmlFor="appointment-notes">Notes (optional)</Label><Textarea id="appointment-notes" maxLength={2000} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Private planning notes" /></div>
            {formError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
            {mutationError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{mutationError}</p>}
            <DialogFooter className="sticky bottom-0 -mx-4 gap-2 border-t bg-background px-4 py-4 shadow-[0_-8px_16px_-16px_rgba(15,23,42,0.45)] sm:-mx-6 sm:px-6 sm:items-center">
              {editingEntry && <Button type="button" variant="destructive" className="sm:mr-auto" disabled={isSubmitting || cancelMutation.isPending} onClick={() => cancelAppointment(editingEntry)}>{cancelMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Cancel appointment</Button>}
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={closeDialog}>Discard</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingEntry ? 'Save changes' : 'Save appointment'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ScheduleError({ title, detail, onRetry }: { title: string; detail: string; onRetry: () => void }) {
  return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{detail}</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></div>;
}

function AgendaList({ entries, viewTimezone, canManage, onEdit, onCancel, isCancelling, cancellingId }: {
  entries: ScheduleEntry[];
  viewTimezone: string;
  canManage: boolean;
  onEdit: (entry: ScheduleEntry) => void;
  onCancel: (entry: ScheduleEntry) => void;
  isCancelling: boolean;
  cancellingId?: number;
}) {
  return <>{entries.map((entry) => <article key={entry.id} className="flex min-w-0 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={sourceBadgeClass(entry.source)}>{sourceLabel(entry.source)}</Badge>{entry.source==='live' && entry.status==='available' && <Badge variant="outline" className="max-w-full whitespace-normal">Available slot — reserves this time</Badge>}{entry.status === 'pending' && <Badge variant="outline" className="max-w-full whitespace-normal border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">Tentative — does not block schedule</Badge>}<Badge variant="outline" className="capitalize">{SCHEDULE_CATEGORIES[entry.category as ScheduleCategory] || entry.category.replaceAll('_', ' ')}</Badge></div><h4 className="mt-2 break-words font-semibold">{entry.title}</h4><p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" />{timeLabel(entry, viewTimezone)}</p>{(entry.preparationMinutes>0 || entry.travelMinutes>0) && <p className="mt-1 text-xs text-muted-foreground">Preparation: {entry.preparationMinutes} min before · Travel: {entry.travelMinutes} min after</p>}{entry.location && <p className="mt-1 flex items-start gap-1.5 break-words text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{entry.location}</p>}{entry.notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{entry.notes}</p>}</div>
    <div className="flex shrink-0 flex-wrap gap-2">{entry.source === 'appointment' && canManage && <><Button type="button" variant="outline" size="sm" onClick={() => onEdit(entry)}><Edit3 className="mr-1.5 h-3.5 w-3.5" />Edit</Button><Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={isCancelling && cancellingId === entry.sourceId} onClick={() => onCancel(entry)}>{isCancelling && cancellingId === entry.sourceId ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}Cancel</Button></>}{entry.source !== 'appointment' && isSafeInternalPath(entry.href) && <Link href={entry.href}><Button type="button" variant="outline" size="sm">Open {entry.source === 'booking' ? 'booking' : entry.source === 'availability' ? 'calendar' : 'Live'}<ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Button></Link>}</div>
  </article>)}</>;
}
