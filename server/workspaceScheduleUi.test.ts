import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const scheduleSource = readFileSync(resolve(import.meta.dirname, '../client/src/components/WorkspaceSchedule.tsx'), 'utf8');
const workspaceSource = readFileSync(resolve(import.meta.dirname, '../client/src/pages/Workspace.tsx'), 'utf8');
const liveDashboardSource = readFileSync(resolve(import.meta.dirname, '../client/src/pages/OlogyLiveDashboard.tsx'), 'utf8');

describe('Workspace Schedule UI', () => {
  it('renders a responsive day/week agenda and an unobscured, scrollable appointment dialog', () => {
    expect(scheduleSource).toContain("type RangeMode = 'day' | 'week'");
    expect(scheduleSource).toContain("setRangeMode('day')");
    expect(scheduleSource).toContain("setRangeMode('week')");
    expect(scheduleSource).toContain('max-h-[90dvh]');
    expect(scheduleSource).toContain('z-[10004]');
    expect(scheduleSource).toContain('overlayClassName="z-[10003]"');
    expect(scheduleSource).toContain('sticky bottom-0');
    expect(scheduleSource).toContain('showCloseButton={!isSubmitting}');
    expect(scheduleSource).toContain('w-full shrink-0 sm:w-auto');
    expect(scheduleSource).toContain('min-w-0');
    expect(scheduleSource).toContain('id="schedule-heading" role="heading" aria-level={2}');
    expect(workspaceSource).toContain('grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-');
    expect(workspaceSource).toContain('className="min-w-0 space-y-6"');
  });

  it('keeps Schedule inside Workspace and gives every signed-in account a contextual route', () => {
    expect(workspaceSource).toContain("import { WorkspaceSchedule } from '@/components/WorkspaceSchedule'");
    expect(workspaceSource).toContain('<WorkspaceSchedule ownerUserId={scheduleOwnerUserId} />');
    expect(workspaceSource).toContain('/workspace?section=schedule#schedule');
    expect(workspaceSource).not.toContain("if (loading || role === 'fan')");
    expect(workspaceSource).not.toContain("navigate('/my-ology'");
  });

  it('does not expose collaborator agenda data when manage-calendar permission is denied', () => {
    expect(scheduleSource).toContain('enabled: contextQuery.data?.canManage === true');
    expect(scheduleSource).toContain('Calendar access is not granted');
    expect(scheduleSource).toContain('No calendar details are shown.');
    expect(scheduleSource).toContain('manage calendar');
    expect(scheduleSource).toContain('effectiveOwnerUserId');
  });

  it('uses the typed schedule context and agenda contract with a stable timezone-aware range', () => {
    expect(scheduleSource).toContain('trpc.schedule.context.useQuery');
    expect(scheduleSource).toContain('trpc.schedule.agenda.useQuery(agendaInput');
    expect(scheduleSource).toContain('fromDate: selectedDate');
    expect(scheduleSource).toContain('toDate: rangeEnd');
    expect(scheduleSource).toContain('timezone: viewTimezone');
    expect(scheduleSource).toContain('ownerUserId: effectiveOwnerUserId');
    expect(scheduleSource).toContain('refetchInterval: 45_000');
    expect(scheduleSource).toContain('localDateAt(Date.now(), browserZone)');
  });

  it('submits private appointment revisions only from event handlers, never render', () => {
    expect(scheduleSource).toContain('const submitAppointment = (event: React.FormEvent<HTMLFormElement>) =>');
    expect(scheduleSource).toContain('const cancelAppointment = (entry: ScheduleEntry) =>');
    expect(scheduleSource).toContain('expectedRevision: editingEntry.revision');
    expect(scheduleSource).toContain('expectedRevision: entry.revision');
    expect(scheduleSource).toContain('updateMutation.mutate({ ...appointment, ...owner, id: editingEntry.sourceId, expectedRevision: editingEntry.revision }');
    expect(scheduleSource).toContain('cancelMutation.mutate({ id: entry.sourceId, expectedRevision: entry.revision, ...owner }');
    expect(scheduleSource).not.toContain('useMemo(() => createMutation.mutate');
    expect(scheduleSource).not.toContain('useMemo(() => updateMutation.mutate');
    expect(scheduleSource).not.toContain('useMemo(() => cancelMutation.mutate');
  });

  it('renders booking and Live records as separate external-edit links while appointment records retain edit/cancel', () => {
    expect(scheduleSource).toContain("if (source === 'appointment') return 'Private appointment'");
    expect(scheduleSource).toContain("if (source === 'booking') return 'Booking'");
    expect(scheduleSource).toContain("if (source === 'live') return 'Ology Live'");
    expect(scheduleSource).toContain("return 'All-day block'");
    expect(scheduleSource).toContain("entry.source === 'appointment' && canManage");
    expect(scheduleSource).toContain("entry.source !== 'appointment' && isSafeInternalPath(entry.href)");
    expect(scheduleSource).toContain('Open {entry.source === \'booking\' ? \'booking\' : entry.source === \'availability\' ? \'calendar\' : \'Live\'}');
    expect(scheduleSource).toContain('Available slot — reserves this time');
    expect(scheduleSource).toContain('max-w-full whitespace-normal');
    expect(scheduleSource).toContain('Tentative — does not block schedule');
  });

  it('distinguishes temporary Live checkout holds from paid reservations ready for confirmation', () => {
    expect(liveDashboardSource).toContain('Temporary checkout hold — awaiting verified payment');
    expect(liveDashboardSource).toContain('Payment verified — ready for confirmation');
    expect(liveDashboardSource).toContain('disabled={confirmBooking.isPending || booking.paymentStatus !== "paid"}');
    expect(liveDashboardSource).toContain('"Awaiting payment"');
    expect(liveDashboardSource).toContain('refetchInterval: 45_000');
  });
});
