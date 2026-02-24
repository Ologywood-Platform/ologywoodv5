/**
 * Calendar Sync Integration
 * Handles two-way sync with Google Calendar and Outlook
 */

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  isBooked: boolean;
  bookingId?: string;
}

export interface CalendarSyncStatus {
  provider: 'google' | 'outlook' | 'none';
  isConnected: boolean;
  lastSync: Date | null;
  syncEnabled: boolean;
  nextSyncTime?: Date;
}

/**
 * Google Calendar OAuth Configuration
 */
export const GOOGLE_CALENDAR_CONFIG = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  scope: 'https://www.googleapis.com/auth/calendar',
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
  redirectUri: `${window.location.origin}/auth/google/callback`
};

/**
 * Outlook Calendar OAuth Configuration
 */
export const OUTLOOK_CALENDAR_CONFIG = {
  clientId: process.env.REACT_APP_OUTLOOK_CLIENT_ID || '',
  authority: 'https://login.microsoftonline.com/common',
  redirectUri: `${window.location.origin}/auth/outlook/callback`,
  scopes: ['Calendars.ReadWrite']
};

/**
 * Initialize Google Calendar API
 */
export async function initializeGoogleCalendar(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      (window as any).gapi.load('client:auth2', () => {
        (window as any).gapi.client
          .init({
            apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
            clientId: GOOGLE_CALENDAR_CONFIG.clientId,
            scope: GOOGLE_CALENDAR_CONFIG.scope,
            discoveryDocs: GOOGLE_CALENDAR_CONFIG.discoveryDocs
          })
          .then(() => resolve())
          .catch((error: any) => reject(error));
      });
    };
    script.onerror = () => reject(new Error('Failed to load Google API'));
    document.head.appendChild(script);
  });
}

/**
 * Authenticate with Google Calendar
 */
export async function authenticateGoogle(): Promise<string> {
  try {
    const auth2 = (window as any).gapi.auth2.getAuthInstance();
    const googleUser = await auth2.signIn();
    const authResponse = googleUser.getAuthResponse();
    return authResponse.id_token;
  } catch (error) {
    console.error('Google authentication failed:', error);
    throw error;
  }
}

/**
 * Authenticate with Outlook Calendar
 */
export async function authenticateOutlook(): Promise<string> {
  try {
    // This would typically use MSAL (Microsoft Authentication Library)
    // For now, returning a placeholder
    const response = await fetch('/api/auth/outlook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data.accessToken;
  } catch (error) {
    console.error('Outlook authentication failed:', error);
    throw error;
  }
}

/**
 * Fetch events from Google Calendar
 */
export async function fetchGoogleCalendarEvents(
  accessToken: string,
  calendarId: string = 'primary',
  timeMin?: Date,
  timeMax?: Date
): Promise<CalendarEvent[]> {
  try {
    const response = await (window as any).gapi.client.calendar.events.list({
      calendarId,
      timeMin: timeMin?.toISOString(),
      timeMax: timeMax?.toISOString(),
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime'
    });

    return response.result.items.map((item: any) => ({
      id: item.id,
      title: item.summary,
      description: item.description || '',
      startTime: new Date(item.start.dateTime || item.start.date),
      endTime: new Date(item.end.dateTime || item.end.date),
      location: item.location,
      attendees: item.attendees?.map((a: any) => a.email) || [],
      isBooked: item.extendedProperties?.private?.isBooked === 'true',
      bookingId: item.extendedProperties?.private?.bookingId
    }));
  } catch (error) {
    console.error('Failed to fetch Google Calendar events:', error);
    throw error;
  }
}

/**
 * Fetch events from Outlook Calendar
 */
export async function fetchOutlookCalendarEvents(
  accessToken: string,
  timeMin?: Date,
  timeMax?: Date
): Promise<CalendarEvent[]> {
  try {
    const query = new URLSearchParams();
    if (timeMin) query.append('startDateTime', timeMin.toISOString());
    if (timeMax) query.append('endDateTime', timeMax.toISOString());

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarview?${query}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    return data.value.map((item: any) => ({
      id: item.id,
      title: item.subject,
      description: item.bodyPreview || '',
      startTime: new Date(item.start.dateTime),
      endTime: new Date(item.end.dateTime),
      location: item.location?.displayName,
      attendees: item.attendees?.map((a: any) => a.emailAddress.address) || [],
      isBooked: item.categories?.includes('booked') || false,
      bookingId: item.extensions?.find((e: any) => e.id === 'bookingId')?.value
    }));
  } catch (error) {
    console.error('Failed to fetch Outlook Calendar events:', error);
    throw error;
  }
}

/**
 * Create event in Google Calendar
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  event: CalendarEvent,
  calendarId: string = 'primary'
): Promise<string> {
  try {
    const response = await (window as any).gapi.client.calendar.events.insert({
      calendarId,
      resource: {
        summary: event.title,
        description: event.description,
        start: { dateTime: event.startTime.toISOString() },
        end: { dateTime: event.endTime.toISOString() },
        location: event.location,
        attendees: event.attendees?.map(email => ({ email })),
        extendedProperties: {
          private: {
            isBooked: event.isBooked.toString(),
            bookingId: event.bookingId || ''
          }
        }
      }
    });

    return response.result.id;
  } catch (error) {
    console.error('Failed to create Google Calendar event:', error);
    throw error;
  }
}

/**
 * Create event in Outlook Calendar
 */
export async function createOutlookCalendarEvent(
  accessToken: string,
  event: CalendarEvent
): Promise<string> {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: event.title,
        bodyPreview: event.description,
        start: { dateTime: event.startTime.toISOString() },
        end: { dateTime: event.endTime.toISOString() },
        location: { displayName: event.location },
        attendees: event.attendees?.map(email => ({
          emailAddress: { address: email },
          type: 'required'
        })),
        categories: event.isBooked ? ['booked'] : []
      })
    });

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Failed to create Outlook Calendar event:', error);
    throw error;
  }
}

/**
 * Update event in Google Calendar
 */
export async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  event: Partial<CalendarEvent>,
  calendarId: string = 'primary'
): Promise<void> {
  try {
    await (window as any).gapi.client.calendar.events.update({
      calendarId,
      eventId,
      resource: {
        summary: event.title,
        description: event.description,
        start: event.startTime ? { dateTime: event.startTime.toISOString() } : undefined,
        end: event.endTime ? { dateTime: event.endTime.toISOString() } : undefined,
        location: event.location
      }
    });
  } catch (error) {
    console.error('Failed to update Google Calendar event:', error);
    throw error;
  }
}

/**
 * Update event in Outlook Calendar
 */
export async function updateOutlookCalendarEvent(
  accessToken: string,
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<void> {
  try {
    await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: event.title,
        bodyPreview: event.description,
        start: event.startTime ? { dateTime: event.startTime.toISOString() } : undefined,
        end: event.endTime ? { dateTime: event.endTime.toISOString() } : undefined,
        location: event.location ? { displayName: event.location } : undefined
      })
    });
  } catch (error) {
    console.error('Failed to update Outlook Calendar event:', error);
    throw error;
  }
}

/**
 * Delete event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = 'primary'
): Promise<void> {
  try {
    await (window as any).gapi.client.calendar.events.delete({
      calendarId,
      eventId
    });
  } catch (error) {
    console.error('Failed to delete Google Calendar event:', error);
    throw error;
  }
}

/**
 * Delete event from Outlook Calendar
 */
export async function deleteOutlookCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  try {
    await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Failed to delete Outlook Calendar event:', error);
    throw error;
  }
}

/**
 * Detect conflicts between local bookings and calendar events
 */
export function detectConflicts(
  bookingStart: Date,
  bookingEnd: Date,
  calendarEvents: CalendarEvent[]
): CalendarEvent[] {
  return calendarEvents.filter(event => {
    // Check for overlap
    return (
      (bookingStart >= event.startTime && bookingStart < event.endTime) ||
      (bookingEnd > event.startTime && bookingEnd <= event.endTime) ||
      (bookingStart <= event.startTime && bookingEnd >= event.endTime)
    );
  });
}

/**
 * Sync booking to calendar
 */
export async function syncBookingToCalendar(
  provider: 'google' | 'outlook',
  accessToken: string,
  booking: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    attendees?: string[];
  }
): Promise<string> {
  const event: CalendarEvent = {
    id: booking.id,
    title: booking.title,
    description: `Booking ID: ${booking.id}`,
    startTime: booking.startTime,
    endTime: booking.endTime,
    location: booking.location,
    attendees: booking.attendees,
    isBooked: true,
    bookingId: booking.id
  };

  if (provider === 'google') {
    return createGoogleCalendarEvent(accessToken, event);
  } else {
    return createOutlookCalendarEvent(accessToken, event);
  }
}

/**
 * Enable automatic sync
 */
export function enableAutoSync(
  provider: 'google' | 'outlook',
  interval: number = 300000 // 5 minutes
): NodeJS.Timeout {
  return setInterval(() => {
    // Trigger sync
    
  }, interval);
}

/**
 * Disable automatic sync
 */
export function disableAutoSync(syncInterval: NodeJS.Timeout): void {
  clearInterval(syncInterval);
}
