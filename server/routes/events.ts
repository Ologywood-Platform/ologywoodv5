import { Router, Request, Response } from 'express';
import {
  createEvent,
  getEventById,
  getArtistEvents,
  getArtistPublicEvents,
  getArtistUpcomingEvents,
  searchPublicEvents,
  updateEvent,
  deleteEvent,
  createEventRecurrence,
  getEventRecurrence,
  deleteEventRecurrence,
  createEventHistory,
  getEventHistoryById,
  getArtistEventHistory,
  addEventPhoto,
  getEventPhotos,
  getEventPhotoById,
  deleteEventPhoto,
  saveEvent,
  getUserSavedEvents,
  isEventSaved,
  removeSavedEvent,
} from '../db';
import { dateOnlyToUtcDate } from '../../shared/dateOnly';
import type { EventTypeValue } from '../../shared/eventTypes';
import { validateEventBody, validateHistoryBody, validatePhotoBody, validateRecurrenceBody } from './eventInput';
import { positiveRouteId, singleQueryString } from './routeInput';

// Middleware to check if user is authenticated
const requireAuth = (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

const router = Router();

const NUMERIC_EVENT_PARAMS = ['id', 'artistId', 'eventId', 'historyId', 'photoId'] as const;
for (const parameter of NUMERIC_EVENT_PARAMS) {
  router.param(parameter, (req, res, next, value) => {
    const parsed = positiveRouteId(value);
    if (parsed === null) {
      return res.status(400).json({ error: `Invalid ${parameter}` });
    }
    req.params[parameter] = String(parsed);
    next();
  });
}

// ============= EVENT CRUD ROUTES =============

/**
 * POST /api/events - Create a new event
 * Only artists can create events
 */
router.post('/api/events', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'artist') {
      return res.status(403).json({ error: 'Only artists can create events' });
    }

    const validated = validateEventBody(req.body);
    if (validated.error) return res.status(400).json({ error: validated.error });
    const input = validated.value!;

    const event = await createEvent({
      artistId: user.id,
      eventTitle: input.eventTitle as string,
      eventType: input.eventType as EventTypeValue,
      eventDate: dateOnlyToUtcDate(input.eventDate as string),
      eventTime: input.eventTime as string | null | undefined,
      eventEndTime: input.eventEndTime as string | null | undefined,
      location: input.location as string | null | undefined,
      capacity: input.capacity as number | null | undefined,
      audienceType: input.audienceType as string | null | undefined,
      rate: input.rate as string | null | undefined,
      description: input.description as string | null | undefined,
      isPublic: input.isPublic as boolean,
    });

    res.json(event);
  } catch (error) {
    console.error('Error creating event', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * GET /api/events/:id - Get event by ID
 */
router.get('/api/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await getEventById(Number(id));

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

/**
 * GET /api/events/artist/:artistId - Get all events for an artist
 */
router.get('/api/events/artist/:artistId', async (req: Request, res: Response) => {
  try {
    const { artistId } = req.params;
    const events = await getArtistEvents(Number(artistId));
    res.json(events);
  } catch (error) {
    console.error('Error fetching artist events', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * GET /api/events/artist/:artistId/public - Get public events for an artist
 */
router.get('/api/events/artist/:artistId/public', async (req: Request, res: Response) => {
  try {
    const { artistId } = req.params;
    const events = await getArtistPublicEvents(Number(artistId));
    res.json(events);
  } catch (error) {
    console.error('Error fetching public events', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to fetch public events' });
  }
});

/**
 * GET /api/events/artist/:artistId/upcoming - Get upcoming events for an artist
 */
router.get('/api/events/artist/:artistId/upcoming', async (req: Request, res: Response) => {
  try {
    const { artistId } = req.params;
    const { daysAhead } = req.query;
    const events = await getArtistUpcomingEvents(Number(artistId));
    // Note: daysAhead filter can be applied in application code if needed
    res.json(events);
  } catch (error) {
    console.error('Error fetching upcoming events', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

/**
 * GET /api/events/search - Search for public events with filters
 */
router.get('/api/events/search', async (req: Request, res: Response) => {
  try {
    const { search, query, eventType, location, startDate, endDate } = req.query;
    const searchText = singleQueryString(search, 200) ?? singleQueryString(query, 200);
    const eventTypeText = singleQueryString(eventType, 80);
    const locationText = singleQueryString(location, 160);
    const startDateText = singleQueryString(startDate, 40);
    const endDateText = singleQueryString(endDate, 40);

    const events = await searchPublicEvents({
      query: searchText ?? undefined,
      category: eventTypeText ?? undefined,
      city: locationText ?? undefined,
      startDate: startDateText ?? undefined,
      endDate: endDateText ?? undefined,
    });

    res.json(events);
  } catch (error) {
    console.error('Error searching events', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to search events' });
  }
});

/**
 * PUT /api/events/:id - Update an event
 */
router.put('/api/events/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Verify ownership
    const event = await getEventById(Number(id));
    if (!event || event.artistId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const validated = validateEventBody(req.body, true);
    if (validated.error) return res.status(400).json({ error: validated.error });
    const input = validated.value!;
    const updatedEvent = await updateEvent(Number(id), {
      ...input,
      ...(input.eventDate ? { eventDate: dateOnlyToUtcDate(input.eventDate as string) } : {}),
    });
    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to update event' });
  }
});

/**
 * DELETE /api/events/:id - Delete an event
 */
router.delete('/api/events/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Verify ownership
    const event = await getEventById(Number(id));
    if (!event || event.artistId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await deleteEvent(Number(id));
    if (result) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to delete event' });
    }
  } catch (error) {
    console.error('Error deleting event', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// ============= EVENT RECURRENCE ROUTES =============

/**
 * POST /api/events/:eventId/recurrence - Create recurring event
 */
router.post('/api/events/:eventId/recurrence', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { eventId } = req.params;
    const validated = validateRecurrenceBody(req.body);
    if (validated.error) return res.status(400).json({ error: validated.error });
    const { frequency, daysOfWeek, endDate } = validated.value!;

    // Verify ownership
    const event = await getEventById(Number(eventId));
    if (!event || event.artistId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const recurrence = await createEventRecurrence({
      eventId: Number(eventId),
      frequency: frequency as any,
      daysOfWeek: daysOfWeek as string | null,
      endDate: endDate ? dateOnlyToUtcDate(endDate as string) : undefined,
    });

    res.json(recurrence);
  } catch (error) {
    console.error('Error creating recurrence', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to create recurrence' });
  }
});

/**
 * GET /api/events/:eventId/recurrence - Get event recurrence
 */
router.get('/api/events/:eventId/recurrence', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const recurrence = await getEventRecurrence(Number(eventId));
    res.json(recurrence || {});
  } catch (error) {
    console.error('Error fetching recurrence', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to fetch recurrence' });
  }
});

/**
 * DELETE /api/events/:eventId/recurrence - Delete event recurrence
 */
router.delete('/api/events/:eventId/recurrence', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { eventId } = req.params;

    // Verify ownership
    const event = await getEventById(Number(eventId));
    if (!event || event.artistId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const success = await deleteEventRecurrence(Number(eventId));
    res.json({ success });
  } catch (error) {
    console.error('Error deleting recurrence', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to delete recurrence' });
  }
});

// ============= EVENT HISTORY ROUTES =============

/**
 * POST /api/events/:eventId/history - Create event history (post-event recap)
 */
router.post('/api/events/:eventId/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { eventId } = req.params;
    const validated = validateHistoryBody(req.body);
    if (validated.error) return res.status(400).json({ error: validated.error });
    const { bookingId, venueId, eventDate, attendeeCount, notes } = validated.value!;

    // Verify ownership
    const event = await getEventById(Number(eventId));
    if (!event || event.artistId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const history = await createEventHistory({
      eventId: Number(eventId),
      bookingId: bookingId as number | null | undefined,
      artistId: user.id,
      venueId: venueId as number | null | undefined,
      eventDate: dateOnlyToUtcDate(eventDate as string),
      attendeeCount: attendeeCount as number | null | undefined,
      notes: notes as string | null | undefined,
    });

    res.json(history);
  } catch (error) {
    console.error('Error creating event history', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to create event history' });
  }
});

/**
 * GET /api/events/history/:historyId - Get event history
 */
router.get('/api/events/history/:historyId', async (req: Request, res: Response) => {
  try {
    const { historyId } = req.params;
    const history = await getEventHistoryById(Number(historyId));

    if (!history) {
      return res.status(404).json({ error: 'Event history not found' });
    }

    res.json(history);
  } catch (error) {
    console.error('Error fetching event history', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to fetch event history' });
  }
});

/**
 * GET /api/artists/:artistId/history - Get artist's event history (portfolio)
 */
router.get('/api/artists/:artistId/history', async (req: Request, res: Response) => {
  try {
    const { artistId } = req.params;
    const history = await getArtistEventHistory(Number(artistId));
    res.json(history);
  } catch (error) {
    console.error('Error fetching artist history', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to fetch artist history' });
  }
});

// ============= EVENT PHOTOS ROUTES =============

/**
 * POST /api/events/history/:historyId/photos - Add photo to event history
 */
router.post('/api/events/history/:historyId/photos', requireAuth, async (req: Request, res: Response) => {
  try {
    const { historyId } = req.params;
    const history = await getEventHistoryById(Number(historyId));
    if (!history || history.artistId !== (req as any).user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const validated = validatePhotoBody(req.body);
    if (validated.error) return res.status(400).json({ error: validated.error });
    const { photoUrl, caption } = validated.value!;

    const photo = await addEventPhoto({
      eventHistoryId: Number(historyId),
      photoUrl: photoUrl as string,
      caption: caption as string | null | undefined,
      uploadedBy: (req as any).user.id,
    });

    res.json(photo);
  } catch (error) {
    console.error('Error adding photo', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to add photo' });
  }
});

/**
 * GET /api/events/history/:historyId/photos - Get photos for event history
 */
router.get('/api/events/history/:historyId/photos', async (req: Request, res: Response) => {
  try {
    const { historyId } = req.params;
    const photos = await getEventPhotos(Number(historyId));
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

/**
 * DELETE /api/events/photos/:photoId - Delete event photo
 */
router.delete('/api/events/photos/:photoId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { photoId } = req.params;
    const photo = await getEventPhotoById(Number(photoId));
    if (!photo) return res.status(404).json({ error: 'Photo not found' });
    const history = await getEventHistoryById(photo.eventHistoryId);
    if (!history || history.artistId !== (req as any).user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const success = await deleteEventPhoto(Number(photoId));
    res.json({ success });
  } catch (error) {
    console.error('Error deleting photo', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// ============= SAVED EVENTS ROUTES =============

/**
 * POST /api/events/:eventId/save - Save event for later
 */
router.post('/api/events/:eventId/save', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { eventId } = req.params;

    // Check if already saved
    const alreadySaved = await isEventSaved(user.id, Number(eventId));
    if (alreadySaved) {
      return res.status(400).json({ error: 'Event already saved' });
    }

    const saved = await saveEvent(user.id, Number(eventId));
    res.json(saved);
  } catch (error) {
    console.error('Error saving event', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to save event' });
  }
});

/**
 * GET /api/user/saved-events - Get user's saved events
 */
router.get('/api/user/saved-events', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const events = await getUserSavedEvents(user.id);
    res.json(events);
  } catch (error) {
    console.error('Error fetching saved events', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to fetch saved events' });
  }
});

/**
 * DELETE /api/events/:eventId/save - Remove saved event
 */
router.delete('/api/events/:eventId/save', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { eventId } = req.params;

    const success = await removeSavedEvent(user.id, Number(eventId));
    res.json({ success });
  } catch (error) {
    console.error('Error removing saved event', { kind: error instanceof Error ? error.name : 'UnknownError' });
    res.status(500).json({ error: 'Failed to remove saved event' });
  }
});

export default router;
