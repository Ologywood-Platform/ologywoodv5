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
  deleteEventPhoto,
  saveEvent,
  getUserSavedEvents,
  isEventSaved,
  removeSavedEvent,
} from '../db';

// Middleware to check if user is authenticated
const requireAuth = (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

const router = Router();

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

    const { eventTitle, eventType, eventDate, eventTime, eventEndTime, location, capacity, audienceType, rate, description, isPublic } = req.body;

    if (!eventTitle || !eventType || !eventDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const event = await createEvent({
      artistId: user.id,
      eventTitle,
      eventType,
      eventDate: new Date(eventDate),
      eventTime,
      eventEndTime,
      location,
      capacity: capacity ? parseInt(capacity) : undefined,
      audienceType,
      rate: rate ? parseFloat(rate).toString() : undefined,
      description,
      isPublic: isPublic || false,
    });

    res.json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * GET /api/events/:id - Get event by ID
 */
router.get('/api/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await getEventById(parseInt(id));

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

/**
 * GET /api/events/artist/:artistId - Get all events for an artist
 */
router.get('/api/events/artist/:artistId', async (req: Request, res: Response) => {
  try {
    const { artistId } = req.params;
    const events = await getArtistEvents(parseInt(artistId));
    res.json(events);
  } catch (error) {
    console.error('Error fetching artist events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * GET /api/events/artist/:artistId/public - Get public events for an artist
 */
router.get('/api/events/artist/:artistId/public', async (req: Request, res: Response) => {
  try {
    const { artistId } = req.params;
    const events = await getArtistPublicEvents(parseInt(artistId));
    res.json(events);
  } catch (error) {
    console.error('Error fetching public events:', error);
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
    const events = await getArtistUpcomingEvents(parseInt(artistId), daysAhead ? parseInt(daysAhead as string) : 90);
    res.json(events);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

/**
 * GET /api/events/search - Search for public events with filters
 */
router.get('/api/events/search', async (req: Request, res: Response) => {
  try {
    const { eventType, location, minRate, maxRate, startDate, endDate, limit, offset } = req.query;

    const events = await searchPublicEvents({
      eventType: eventType as string,
      location: location as string,
      minRate: minRate ? parseFloat(minRate as string) : undefined,
      maxRate: maxRate ? parseFloat(maxRate as string) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(events);
  } catch (error) {
    console.error('Error searching events:', error);
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
    const event = await getEventById(parseInt(id));
    if (!event || event.artistId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedEvent = await updateEvent(parseInt(id), req.body);
    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
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
    const event = await getEventById(parseInt(id));
    if (!event || event.artistId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const success = await deleteEvent(parseInt(id));
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to delete event' });
    }
  } catch (error) {
    console.error('Error deleting event:', error);
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
    const { frequency, daysOfWeek, endDate } = req.body;

    // Verify ownership
    const event = await getEventById(parseInt(eventId));
    if (!event || event.artistId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const recurrence = await createEventRecurrence({
      eventId: parseInt(eventId),
      frequency,
      daysOfWeek,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    res.json(recurrence);
  } catch (error) {
    console.error('Error creating recurrence:', error);
    res.status(500).json({ error: 'Failed to create recurrence' });
  }
});

/**
 * GET /api/events/:eventId/recurrence - Get event recurrence
 */
router.get('/api/events/:eventId/recurrence', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const recurrence = await getEventRecurrence(parseInt(eventId));
    res.json(recurrence || {});
  } catch (error) {
    console.error('Error fetching recurrence:', error);
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
    const event = await getEventById(parseInt(eventId));
    if (!event || event.artistId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const success = await deleteEventRecurrence(parseInt(eventId));
    res.json({ success });
  } catch (error) {
    console.error('Error deleting recurrence:', error);
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
    const { bookingId, venueId, eventDate, attendeeCount, notes } = req.body;

    // Verify ownership
    const event = await getEventById(parseInt(eventId));
    if (!event || event.artistId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const history = await createEventHistory({
      eventId: parseInt(eventId),
      bookingId,
      artistId: user.id,
      venueId,
      eventDate: new Date(eventDate),
      attendeeCount,
      notes,
    });

    res.json(history);
  } catch (error) {
    console.error('Error creating event history:', error);
    res.status(500).json({ error: 'Failed to create event history' });
  }
});

/**
 * GET /api/events/history/:historyId - Get event history
 */
router.get('/api/events/history/:historyId', async (req: Request, res: Response) => {
  try {
    const { historyId } = req.params;
    const history = await getEventHistoryById(parseInt(historyId));

    if (!history) {
      return res.status(404).json({ error: 'Event history not found' });
    }

    res.json(history);
  } catch (error) {
    console.error('Error fetching event history:', error);
    res.status(500).json({ error: 'Failed to fetch event history' });
  }
});

/**
 * GET /api/artists/:artistId/history - Get artist's event history (portfolio)
 */
router.get('/api/artists/:artistId/history', async (req: Request, res: Response) => {
  try {
    const { artistId } = req.params;
    const history = await getArtistEventHistory(parseInt(artistId));
    res.json(history);
  } catch (error) {
    console.error('Error fetching artist history:', error);
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
    const { photoUrl, caption } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ error: 'Photo URL is required' });
    }

    const photo = await addEventPhoto({
      eventHistoryId: parseInt(historyId),
      photoUrl,
      caption,
      uploadedBy: (req as any).user.id,
    });

    res.json(photo);
  } catch (error) {
    console.error('Error adding photo:', error);
    res.status(500).json({ error: 'Failed to add photo' });
  }
});

/**
 * GET /api/events/history/:historyId/photos - Get photos for event history
 */
router.get('/api/events/history/:historyId/photos', async (req: Request, res: Response) => {
  try {
    const { historyId } = req.params;
    const photos = await getEventPhotos(parseInt(historyId));
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

/**
 * DELETE /api/events/photos/:photoId - Delete event photo
 */
router.delete('/api/events/photos/:photoId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { photoId } = req.params;
    const success = await deleteEventPhoto(parseInt(photoId));
    res.json({ success });
  } catch (error) {
    console.error('Error deleting photo:', error);
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
    const alreadySaved = await isEventSaved(user.id, parseInt(eventId));
    if (alreadySaved) {
      return res.status(400).json({ error: 'Event already saved' });
    }

    const saved = await saveEvent(user.id, parseInt(eventId));
    res.json(saved);
  } catch (error) {
    console.error('Error saving event:', error);
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
    console.error('Error fetching saved events:', error);
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

    const success = await removeSavedEvent(user.id, parseInt(eventId));
    res.json({ success });
  } catch (error) {
    console.error('Error removing saved event:', error);
    res.status(500).json({ error: 'Failed to remove saved event' });
  }
});

export default router;
