import { useState } from 'react';
import { Clock } from 'lucide-react';

export type DaySchedule = {
  open: string;
  close: string;
  closed: boolean;
};

export type OperatingHoursSchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const DEFAULT_SCHEDULE: OperatingHoursSchedule = {
  monday: { open: '18:00', close: '02:00', closed: false },
  tuesday: { open: '18:00', close: '02:00', closed: false },
  wednesday: { open: '18:00', close: '02:00', closed: false },
  thursday: { open: '18:00', close: '02:00', closed: false },
  friday: { open: '18:00', close: '02:00', closed: false },
  saturday: { open: '18:00', close: '02:00', closed: false },
  sunday: { open: '18:00', close: '02:00', closed: true },
};

interface OperatingHoursEditorProps {
  value?: OperatingHoursSchedule | null;
  onChange: (schedule: OperatingHoursSchedule) => void;
}

export function OperatingHoursEditor({ value, onChange }: OperatingHoursEditorProps) {
  const schedule = value || DEFAULT_SCHEDULE;

  const updateDay = (day: keyof OperatingHoursSchedule, field: keyof DaySchedule, val: string | boolean) => {
    const updated = {
      ...schedule,
      [day]: { ...schedule[day], [field]: val },
    };
    onChange(updated);
  };

  const toggleClosed = (day: keyof OperatingHoursSchedule) => {
    updateDay(day, 'closed', !schedule[day].closed);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Operating Hours</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Set your venue's hours for each day. Toggle off days you're closed.</p>
      
      <div className="space-y-1.5">
        {DAYS.map((day) => (
          <div key={day} className="flex items-center gap-2 py-1.5">
            {/* Day label */}
            <span className="w-10 text-xs font-medium text-foreground">{DAY_LABELS[day]}</span>
            
            {/* Closed toggle */}
            <button
              type="button"
              onClick={() => toggleClosed(day)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                !schedule[day].closed
                  ? 'bg-purple-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  !schedule[day].closed ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>

            {/* Time inputs */}
            {!schedule[day].closed ? (
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  type="time"
                  value={schedule[day].open}
                  onChange={(e) => updateDay(day, 'open', e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border rounded-md bg-background text-foreground border-input focus:ring-1 focus:ring-purple-500"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="time"
                  value={schedule[day].close}
                  onChange={(e) => updateDay(day, 'close', e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border rounded-md bg-background text-foreground border-input focus:ring-1 focus:ring-purple-500"
                />
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic flex-1">Closed</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Format an OperatingHoursSchedule into a human-readable display string.
 */
export function formatOperatingHours(schedule: OperatingHoursSchedule | null | undefined): string {
  if (!schedule) return '';
  
  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const lines: string[] = [];
  for (const day of DAYS) {
    const d = schedule[day];
    if (d.closed) {
      lines.push(`${DAY_LABELS[day]}: Closed`);
    } else {
      lines.push(`${DAY_LABELS[day]}: ${formatTime(d.open)} - ${formatTime(d.close)}`);
    }
  }
  return lines.join('\n');
}

export { DEFAULT_SCHEDULE };
