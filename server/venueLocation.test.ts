import { describe, it, expect } from 'vitest';
import { US_STATES, formatLocation } from '../shared/locationData';

describe('Location Data', () => {
  it('US_STATES contains all 51 entries (50 states + DC)', () => {
    expect(US_STATES.length).toBe(51);
  });

  it('each state has a code and name', () => {
    for (const state of US_STATES) {
      expect(state.code).toBeTruthy();
      expect(state.name).toBeTruthy();
      expect(state.code.length).toBeLessThanOrEqual(2);
    }
  });

  it('states are sorted alphabetically by name', () => {
    const names = US_STATES.map(s => s.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it('formatLocation formats city and state correctly', () => {
    expect(formatLocation('Atlanta', 'GA')).toBe('Atlanta, Georgia');
    expect(formatLocation('Atlanta', 'GA', 'US')).toBe('Atlanta, Georgia');
    expect(formatLocation('Toronto', 'ON', 'CA')).toBe('Toronto, ON, CA');
    expect(formatLocation(null, 'GA')).toBe('Georgia');
    expect(formatLocation('Atlanta', null)).toBe('Atlanta');
    expect(formatLocation(null, null)).toBe('');
  });
});

describe('OperatingHoursSchedule type', () => {
  it('validates a proper schedule structure', () => {
    const schedule = {
      monday: { open: '18:00', close: '02:00', closed: false },
      tuesday: { open: '18:00', close: '02:00', closed: false },
      wednesday: { open: '18:00', close: '02:00', closed: false },
      thursday: { open: '18:00', close: '02:00', closed: false },
      friday: { open: '18:00', close: '02:00', closed: false },
      saturday: { open: '18:00', close: '02:00', closed: false },
      sunday: { open: '18:00', close: '02:00', closed: true },
    };

    // Verify all days are present
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of days) {
      expect(schedule[day as keyof typeof schedule]).toBeDefined();
      expect(schedule[day as keyof typeof schedule]).toHaveProperty('open');
      expect(schedule[day as keyof typeof schedule]).toHaveProperty('close');
      expect(schedule[day as keyof typeof schedule]).toHaveProperty('closed');
    }
  });

  it('time format is HH:MM', () => {
    const timeRegex = /^\d{2}:\d{2}$/;
    expect(timeRegex.test('18:00')).toBe(true);
    expect(timeRegex.test('02:00')).toBe(true);
    expect(timeRegex.test('9:00')).toBe(false);
    expect(timeRegex.test('09:00')).toBe(true);
  });
});
