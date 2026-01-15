interface AvailabilityBlock {
  id: number;
  artistId: number;
  startDate: Date;
  endDate: Date;
  reason: string;
  recurring?: {
    pattern: 'daily' | 'weekly' | 'monthly';
    endDate?: Date;
    daysOfWeek?: number[];
  };
  createdAt: Date;
}

interface BlockedDateRange {
  startDate: Date;
  endDate: Date;
  reason: string;
}

// In-memory storage for availability blocks (in production, use database)
const availabilityBlocks: Map<number, AvailabilityBlock[]> = new Map();

export function createAvailabilityBlock(
  artistId: number,
  startDate: Date,
  endDate: Date,
  reason: string,
  recurring?: AvailabilityBlock['recurring']
): AvailabilityBlock {
  const block: AvailabilityBlock = {
    id: Math.random(),
    artistId,
    startDate,
    endDate,
    reason,
    recurring,
    createdAt: new Date(),
  };

  if (!availabilityBlocks.has(artistId)) {
    availabilityBlocks.set(artistId, []);
  }

  availabilityBlocks.get(artistId)!.push(block);
  console.log(`[Availability] Block created for artist ${artistId}: ${startDate} - ${endDate}`);

  return block;
}

export function getAvailabilityBlocks(artistId: number): AvailabilityBlock[] {
  return availabilityBlocks.get(artistId) || [];
}

export function deleteAvailabilityBlock(artistId: number, blockId: number): boolean {
  const blocks = availabilityBlocks.get(artistId);
  if (!blocks) return false;

  const index = blocks.findIndex(b => b.id === blockId);
  if (index === -1) return false;

  blocks.splice(index, 1);
  console.log(`[Availability] Block deleted for artist ${artistId}`);
  return true;
}

export function isDateBlocked(artistId: number, date: Date): boolean {
  const blocks = getAvailabilityBlocks(artistId);

  for (const block of blocks) {
    // Check if date falls within block range
    if (date >= block.startDate && date <= block.endDate) {
      return true;
    }

    // Check recurring blocks
    if (block.recurring) {
      if (isRecurringDateBlocked(date, block.recurring, block.startDate, block.endDate)) {
        return true;
      }
    }
  }

  return false;
}

export function getBlockedDates(artistId: number, startDate: Date, endDate: Date): BlockedDateRange[] {
  const blocks = getAvailabilityBlocks(artistId);
  const blockedRanges: BlockedDateRange[] = [];

  for (const block of blocks) {
    // Check overlapping date range
    if (block.endDate >= startDate && block.startDate <= endDate) {
      blockedRanges.push({
        startDate: new Date(Math.max(block.startDate.getTime(), startDate.getTime())),
        endDate: new Date(Math.min(block.endDate.getTime(), endDate.getTime())),
        reason: block.reason,
      });
    }

    // Check recurring blocks
    if (block.recurring) {
      const recurringRanges = getRecurringBlockedDates(
        startDate,
        endDate,
        block.recurring,
        block.startDate,
        block.endDate,
        block.reason
      );
      blockedRanges.push(...recurringRanges);
    }
  }

  return blockedRanges;
}

function isRecurringDateBlocked(
  date: Date,
  recurring: AvailabilityBlock['recurring'],
  blockStart: Date,
  blockEnd: Date
): boolean {
  if (!recurring) return false;

  // Check if date is within recurring block period
  if (recurring.endDate && date > recurring.endDate) return false;
  if (date < blockStart) return false;

  const dayOfWeek = date.getDay();

  switch (recurring.pattern) {
    case 'daily':
      return true;

    case 'weekly':
      if (recurring.daysOfWeek) {
        return recurring.daysOfWeek.includes(dayOfWeek);
      }
      return dayOfWeek === blockStart.getDay();

    case 'monthly':
      return date.getDate() === blockStart.getDate();

    default:
      return false;
  }
}

function getRecurringBlockedDates(
  startDate: Date,
  endDate: Date,
  recurring: AvailabilityBlock['recurring'],
  blockStart: Date,
  blockEnd: Date,
  reason: string
): BlockedDateRange[] {
  const ranges: BlockedDateRange[] = [];

  if (!recurring) return ranges;

  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (isRecurringDateBlocked(currentDate, recurring, blockStart, blockEnd)) {
      // Find the end of this blocked period
      let blockEndDate = new Date(currentDate);

      switch (recurring.pattern) {
        case 'daily':
          blockEndDate.setDate(blockEndDate.getDate() + 1);
          break;
        case 'weekly':
          blockEndDate.setDate(blockEndDate.getDate() + 1);
          break;
        case 'monthly':
          blockEndDate.setDate(blockEndDate.getDate() + 1);
          break;
      }

      ranges.push({
        startDate: new Date(currentDate),
        endDate: new Date(Math.min(blockEndDate.getTime(), endDate.getTime())),
        reason,
      });

      currentDate = blockEndDate;
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return ranges;
}

export function canBookArtist(artistId: number, eventDate: Date, eventEndDate: Date): boolean {
  let currentDate = new Date(eventDate);

  while (currentDate <= eventEndDate) {
    if (isDateBlocked(artistId, currentDate)) {
      return false;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return true;
}

export function syncBlocksWithCalendar(artistId: number, calendarEvents: any[]): void {
  // In production, sync with external calendar (Google Calendar, iCal, etc.)
  console.log(`[Availability] Syncing ${calendarEvents.length} calendar events for artist ${artistId}`);

  for (const event of calendarEvents) {
    if (event.type === 'blocked' || event.title.includes('Unavailable')) {
      createAvailabilityBlock(
        artistId,
        new Date(event.start),
        new Date(event.end),
        event.description || 'Calendar block'
      );
    }
  }
}

export function exportBlocksAsICalEvents(artistId: number): string {
  const blocks = getAvailabilityBlocks(artistId);
  let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Ologywood//Artist Availability Blocks//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

  for (const block of blocks) {
    const startDate = formatDateForIcal(block.startDate);
    const endDate = formatDateForIcal(block.endDate);

    icalContent += `BEGIN:VEVENT
UID:block-${block.id}@ologywood.com
DTSTAMP:${formatDateForIcal(new Date())}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:Unavailable - ${block.reason}
DESCRIPTION:${block.reason}
STATUS:CONFIRMED
END:VEVENT
`;
  }

  icalContent += `END:VCALENDAR`;
  return icalContent;
}

function formatDateForIcal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}
