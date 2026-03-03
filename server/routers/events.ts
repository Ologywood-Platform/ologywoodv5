import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import * as db from '../db';
import { notifyFansNewEvent } from '../services/fanNotificationService';

// Input validation schemas
const createEventSchema = z.object({
  eventTitle: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  eventType: z.enum(['concert', 'wedding', 'corporate', 'festival', 'other', 'bar_gig', 'private_party']),
  location: z.string().optional(),
  eventDate: z.date(),
  eventTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  eventEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  capacity: z.number().int().optional(),
  audienceType: z.string().optional(),
  rate: z.string().optional(), // Stored as decimal string
  isPublic: z.boolean().default(false),
  status: z.enum(['available', 'booked', 'completed', 'cancelled']).default('available'),
});

const updateEventSchema = createEventSchema.partial().extend({
  id: z.number().int().positive(),
});

const searchEventsSchema = z.object({
  eventType: z.string().optional(),
  location: z.string().optional(),
  minRate: z.number().optional(),
  maxRate: z.number().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  artistId: z.number().int().optional(),
  limit: z.number().int().default(20),
  offset: z.number().int().default(0),
});

export const eventsRouter = router({
  // Create new event
  create: protectedProcedure
    .input(createEventSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const event = await db.createEvent({
          ...input,
          artistId: ctx.user.id,
        });

        // Notify fans about the new event (fire-and-forget, don't block response)
        if (input.isPublic) {
          notifyFansNewEvent(ctx.user.id, {
            eventTitle: input.eventTitle,
            eventDate: input.eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            eventLocation: input.location,
            eventId: event?.id,
          }).catch(err => console.error('[Events] Fan notification failed:', err));
        }

        return {
          success: true,
          event,
          message: 'Event created successfully',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to create event');
      }
    }),

  // Get event by ID (enriched with artist data)
  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      try {
        const event = await db.getEventById(input.id);
        if (!event) {
          throw new Error('Event not found');
        }
        // Enrich with artist profile data
        const artistProfile = await db.getArtistProfileByUserId(event.artistId);
        return {
          ...event,
          artistName: artistProfile?.artistName || 'Unknown Artist',
          artistPhoto: artistProfile?.profilePhotoUrl || undefined,
          artistProfileId: artistProfile?.id || undefined,
          artistGenre: Array.isArray(artistProfile?.genre) ? artistProfile.genre.join(', ') : '',
          artistBio: artistProfile?.bio || undefined,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch event');
      }
    }),

  // Get all events for an artist
  getByArtistId: publicProcedure
    .input(z.object({ artistId: z.number().int().positive() }))
    .query(async ({ input }) => {
      try {
        const events = await db.getArtistEvents(input.artistId);
        return events;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch events');
      }
    }),

  // Update event
  update: protectedProcedure
    .input(updateEventSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const event = await db.updateEvent(input.id, input);
        return {
          success: true,
          event,
          message: 'Event updated successfully',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to update event');
      }
    }),

  // Delete event
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await db.deleteEvent(input.id);
        return {
          success: true,
          message: 'Event deleted successfully',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to delete event');
      }
    }),

  // Search public events with filters (enriched with artist data)
  search: publicProcedure
    .input(searchEventsSchema)
    .query(async ({ input }) => {
      try {
        const events = await db.searchPublicEvents({
          query: input.eventType || input.location,
          city: input.location,
          category: input.eventType,
          startDate: input.startDate?.toISOString().split('T')[0],
          endDate: input.endDate?.toISOString().split('T')[0],
        });
        // Enrich events with artist profile data for display
        const enriched = await Promise.all(
          events.map(async (event) => {
            const artistProfile = await db.getArtistProfileByUserId(event.artistId);
            return {
              ...event,
              artistName: artistProfile?.artistName || 'Unknown Artist',
              artistPhoto: artistProfile?.profilePhotoUrl || undefined,
              artistProfileId: artistProfile?.id || undefined,
            };
          })
        );
        return enriched;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to search events');
      }
    }),

  // Get event recurrence details
  getRecurrence: publicProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .query(async ({ input }) => {
      try {
        const recurrence = await db.getEventRecurrence(input.eventId);
        return recurrence;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch recurrence');
      }
    }),

  // Create event recurrence
  createRecurrence: protectedProcedure
    .input(z.object({
      eventId: z.number().int().positive(),
      frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const recurrence = await db.createEventRecurrence(input);
        return {
          success: true,
          recurrence,
          message: 'Recurrence created successfully',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to create recurrence');
      }
    }),

  // Get event history (past events)
  getHistory: publicProcedure
    .input(z.object({ 
      artistId: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      try {
        const history = await db.getArtistEventHistory(input.artistId);
        return history;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch history');
      }
    }),

  // Add photo to event
  addPhoto: protectedProcedure
    .input(z.object({
      eventHistoryId: z.number().int().positive(),
      photoUrl: z.string().url(),
      caption: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const photo = await db.addEventPhoto(input);
        return {
          success: true,
          photo,
          message: 'Photo added successfully',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to add photo');
      }
    }),

  // Get event photos
  getPhotos: publicProcedure
    .input(z.object({ eventHistoryId: z.number().int().positive() }))
    .query(async ({ input }) => {
      try {
        const photos = await db.getEventPhotos(input.eventHistoryId);
        return photos;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch photos');
      }
    }),

  // Save event (bookmark/wishlist)
  saveEvent: protectedProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const saved = await db.saveEvent(input.eventId, ctx.user.id);
        return {
          success: true,
          saved,
          message: 'Event saved successfully',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to save event');
      }
    }),

  // Unsave (remove) a saved event
  unsaveEvent: protectedProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const removed = await db.removeSavedEvent(ctx.user.id, input.eventId);
        return {
          success: removed,
          message: removed ? 'Event unsaved' : 'Event was not saved',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to unsave event');
      }
    }),

  // Check if event is saved
  isEventSaved: protectedProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      try {
        const saved = await db.isEventSaved(ctx.user.id, input.eventId);
        return saved;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to unsave event');
      }
    }),

  // Get saved events for user
  getSavedEvents: protectedProcedure
    .input(z.object({}))
    .query(async ({ input, ctx }) => {
      try {
        const events = await db.getUserSavedEvents(ctx.user.id);
        return events;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch saved events');
      }
    }),

  // Get similar events for the event detail page
  getSimilar: publicProcedure
    .input(z.object({
      eventId: z.number().int().positive(),
      limit: z.number().int().min(1).max(12).default(6),
    }))
    .query(async ({ input }) => {
      try {
        const similarEvents = await db.getSimilarEvents(input.eventId, {
          limit: input.limit,
        });
        return similarEvents;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch similar events');
      }
    }),

  // Get upcoming events for an artist
  getUpcomingEvents: publicProcedure
    .input(z.object({
      artistId: z.number().int().positive(),
      daysAhead: z.number().int().default(90),
    }))
    .query(async ({ input }) => {
      try {
        const events = await db.getArtistUpcomingEvents(input.artistId);
        // Note: daysAhead can be applied in application code if needed
        return events;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch events');
      }
    }),
});
