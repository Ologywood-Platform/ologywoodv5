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

// Simplified schema for artist event posts (fan-facing)
const artistPostSchema = z.object({
  eventTitle: z.string().min(1, 'Event name is required'),
  eventDate: z.date(),
  eventTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  eventEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
  ticketLink: z.string().url().optional().or(z.literal('')),
  coverImageUrl: z.string().optional(),
});

// Venue event creation schema
const venueEventSchema = z.object({
  eventTitle: z.string().min(1, 'Event name is required'),
  eventDate: z.date(),
  eventTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  eventEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
  ticketLink: z.string().url().optional().or(z.literal('')),
  coverImageUrl: z.string().optional(),
  eventType: z.enum(['concert', 'wedding', 'corporate', 'festival', 'other', 'bar_gig', 'private_party']).default('concert'),
  artistId: z.number().int().positive(),
  bookingId: z.number().int().positive().optional(),
  ticketPrice: z.string().optional(),
  capacity: z.number().int().optional(),
});

export const eventsRouter = router({
  // Venue event creation — allows venues to post events tied to confirmed bookings
  createVenueEvent: protectedProcedure
    .input(venueEventSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== 'venue' && ctx.user.role !== 'admin') {
          throw new Error('Only venues can create venue events');
        }
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile) throw new Error('Venue profile not found');

        if (input.bookingId) {
          const booking = await db.getBookingById(input.bookingId);
          if (!booking) throw new Error('Booking not found');
          if (booking.venueId !== venueProfile.id) throw new Error('Booking does not belong to this venue');
          if (booking.status !== 'confirmed' && booking.status !== 'completed') {
            throw new Error('Can only create events for confirmed bookings');
          }
        }

        const event = await db.createEvent({
          eventTitle: input.eventTitle,
          eventDate: input.eventDate,
          eventTime: input.eventTime,
          eventEndTime: input.eventEndTime,
          location: input.location || venueProfile.location || '',
          description: input.description,
          ticketLink: input.ticketLink || undefined,
          coverImageUrl: input.coverImageUrl || undefined,
          eventType: input.eventType,
          eventSource: 'venue_booking',
          isPublic: true,
          status: 'booked',
          artistId: input.artistId,
          venueId: venueProfile.id,
          bookingId: input.bookingId,
          capacity: input.capacity,
          rate: input.ticketPrice,
        });

        return { success: true, event, message: 'Event posted successfully' };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to create event');
      }
    }),

  // Get venue's own events
  getVenueEvents: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      try {
        if (ctx.user.role !== 'venue' && ctx.user.role !== 'admin') {
          throw new Error('Venue access required');
        }
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile) return [];
        const allEvents = await db.getEventsByVenueProfileId(venueProfile.id);
        return allEvents;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch venue events');
      }
    }),

  // Simplified artist event post (fan-facing — no rate, audience type, event type, or capacity)
  createArtistPost: protectedProcedure
    .input(artistPostSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile) throw new Error('Artist profile not found');
        const event = await db.createEvent({
          eventTitle: input.eventTitle,
          eventDate: input.eventDate,
          eventTime: input.eventTime,
          eventEndTime: input.eventEndTime,
          location: input.location,
          description: input.description,
          ticketLink: input.ticketLink || undefined,
          coverImageUrl: input.coverImageUrl || undefined,
          eventType: 'concert', // Default for artist posts
          eventSource: 'artist_post',
          isPublic: true, // Artist posts are always public
          status: 'available',
          artistId: artistProfile.id,
        });

        // Notify fans about the new event
        notifyFansNewEvent(ctx.user.id, {
          eventTitle: input.eventTitle,
          eventDate: input.eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          eventLocation: input.location,
          eventId: event?.id,
        }).catch(err => console.error('[Events] Fan notification failed:', err));

        return {
          success: true,
          event,
          message: 'Event posted successfully',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to post event');
      }
    }),

  // Update an artist event post (simplified fields only)
  updateArtistPost: protectedProcedure
    .input(artistPostSchema.extend({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile) throw new Error('Artist profile not found');
        // Verify ownership
        const existing = await db.getEventById(input.id);
        if (!existing) throw new Error('Event not found');
        if (existing.artistId !== artistProfile.id) throw new Error('Not authorized to edit this event');
        const event = await db.updateEvent(input.id, {
          eventTitle: input.eventTitle,
          eventDate: input.eventDate,
          eventTime: input.eventTime,
          eventEndTime: input.eventEndTime,
          location: input.location,
          description: input.description,
          ticketLink: input.ticketLink || undefined,
          coverImageUrl: input.coverImageUrl || undefined,
        });
        return { success: true, event, message: 'Event updated successfully' };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to update event');
      }
    }),

  // Delete an artist event post (with ownership check)
  deleteArtistPost: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile) throw new Error('Artist profile not found');
        const existing = await db.getEventById(input.id);
        if (!existing) throw new Error('Event not found');
        if (existing.artistId !== artistProfile.id) throw new Error('Not authorized to delete this event');
        await db.deleteEvent(input.id);
        return { success: true, message: 'Event deleted successfully' };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to delete event');
      }
    }),

  // Get artist's own events (for dashboard management)
  getMyEvents: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      try {
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile) throw new Error('Artist profile not found');
        const events = await db.getArtistEvents(artistProfile.id);
        return events;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch your events');
      }
    }),

  // Original create (venue booking style — kept for backward compatibility)
  create: protectedProcedure
    .input(createEventSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Look up artist profile to get the correct profile ID (not user ID)
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile) throw new Error('Artist profile not found');
        const event = await db.createEvent({
          ...input,
          artistId: artistProfile.id,
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
        // Enrich with artist profile data (event.artistId is the profile ID, not user ID)
        const artistProfile = await db.getArtistProfileById(event.artistId);
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

  // Get event by slug (public)
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      try {
        const database = await db.getDb();
        if (!database) return null;
        const { events } = await import('../../drizzle/schema');
        const allEvents = await database.select().from(events);
        const slug = input.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const found = allEvents.find((e: any) => {
          const eSlug = (e.eventTitle || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          return eSlug === slug;
        });
        if (!found) return null;
        // Enrich with artist profile data
        const artistProfile = await db.getArtistProfileById(found.artistId);
        return {
          ...found,
          artistName: artistProfile?.artistName || 'Unknown Artist',
          artistPhoto: artistProfile?.profilePhotoUrl || undefined,
          artistProfileId: artistProfile?.id || undefined,
          artistGenre: Array.isArray(artistProfile?.genre) ? artistProfile.genre.join(', ') : '',
          artistBio: artistProfile?.bio || undefined,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch event by slug');
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

  // Get events by venue ID (public)
  getByVenueId: publicProcedure
    .input(z.object({ venueId: z.number().int().positive() }))
    .query(async ({ input }) => {
      try {
        const events = await db.getEventsByVenueProfileId(input.venueId);
        return events;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch venue events');
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

  // Create event history entry (artist logs a past performance)
  createHistory: protectedProcedure
    .input(z.object({
      eventName: z.string().min(1, 'Event name is required'),
      eventDate: z.string().min(1, 'Event date is required'),
      venueName: z.string().optional(),
      location: z.string().optional(),
      attendeeCount: z.number().int().optional(),
      notes: z.string().optional(),
      eventId: z.number().int().optional(),
      bookingId: z.number().int().optional(),
      venueId: z.number().int().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Look up artist profile to get the correct profile ID (not user ID)
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile) throw new Error('Artist profile not found');
        const history = await db.createEventHistory({
          artistId: artistProfile.id,
          eventDate: new Date(input.eventDate),
          notes: input.notes ? `**${input.eventName}**${input.venueName ? ` at ${input.venueName}` : ''}${input.location ? ` — ${input.location}` : ''}\n\n${input.notes}` : `**${input.eventName}**${input.venueName ? ` at ${input.venueName}` : ''}${input.location ? ` — ${input.location}` : ''}`,
          attendeeCount: input.attendeeCount,
          eventId: input.eventId,
          bookingId: input.bookingId,
          venueId: input.venueId,
        });
        return { success: true, history, message: 'Performance added to portfolio' };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to create history entry');
      }
    }),

  // Update event history entry (artist edits their own entry)
  updateHistory: protectedProcedure
    .input(z.object({
      historyId: z.number().int().positive(),
      eventName: z.string().optional(),
      eventDate: z.string().optional(),
      venueName: z.string().optional(),
      location: z.string().optional(),
      attendeeCount: z.number().int().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const existing = await db.getEventHistoryById(input.historyId);
        if (!existing) throw new Error('History entry not found');
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile || existing.artistId !== artistProfile.id) throw new Error('Not authorized to edit this entry');
        const updateData: any = {};
        if (input.eventDate) updateData.eventDate = input.eventDate;
        if (input.attendeeCount !== undefined) updateData.attendeeCount = input.attendeeCount;
        if (input.notes !== undefined || input.eventName) {
          const name = input.eventName || '';
          const venue = input.venueName ? ` at ${input.venueName}` : '';
          const loc = input.location ? ` — ${input.location}` : '';
          const body = input.notes || '';
          updateData.notes = body ? `**${name}**${venue}${loc}\n\n${body}` : `**${name}**${venue}${loc}`;
        }
        const updated = await db.updateEventHistory(input.historyId, updateData);
        return { success: true, history: updated, message: 'Portfolio entry updated' };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to update history entry');
      }
    }),

  // Delete event history entry (cascade-deletes photos)
  deleteHistory: protectedProcedure
    .input(z.object({ historyId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const existing = await db.getEventHistoryById(input.historyId);
        if (!existing) throw new Error('History entry not found');
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile || existing.artistId !== artistProfile.id) throw new Error('Not authorized to delete this entry');
        const deleted = await db.deleteEventHistory(input.historyId);
        return { success: deleted, message: deleted ? 'Portfolio entry deleted' : 'Failed to delete' };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to delete history entry');
      }
    }),

  // Upload photo to event history entry (base64 → S3)
  uploadEventPhoto: protectedProcedure
    .input(z.object({
      eventHistoryId: z.number().int().positive(),
      fileData: z.string().min(1, 'File data is required'),
      fileName: z.string().min(1, 'File name is required'),
      mimeType: z.string().min(1, 'MIME type is required'),
      caption: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify ownership
        const historyEntry = await db.getEventHistoryById(input.eventHistoryId);
        if (!historyEntry) throw new Error('History entry not found');
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile || historyEntry.artistId !== artistProfile.id) throw new Error('Not authorized to upload photos to this entry');
        // Upload to S3 via existing handler
        const { handlePhotoUpload } = await import('../handlers/imageUploadHandler');
        const uploadResult = await handlePhotoUpload(
          { fileData: input.fileData, fileName: input.fileName, mimeType: input.mimeType },
          ctx.user.id,
          'event-photos'
        );
        // Save photo record
        const photo = await db.addEventPhoto({
          eventHistoryId: input.eventHistoryId,
          photoUrl: uploadResult.url,
          caption: input.caption,
          uploadedBy: ctx.user.id,
        });
        return { success: true, photo, url: uploadResult.url, message: 'Photo uploaded successfully' };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to upload photo');
      }
    }),

  // Delete a photo from event history
  deletePhoto: protectedProcedure
    .input(z.object({ photoId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const deleted = await db.deleteEventPhoto(input.photoId);
        return { success: deleted, message: deleted ? 'Photo deleted' : 'Failed to delete photo' };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to delete photo');
      }
    }),

  // Get portfolio stats for an artist
  getPortfolioStats: publicProcedure
    .input(z.object({ artistId: z.number().int().positive() }))
    .query(async ({ input }) => {
      try {
        return await db.getArtistPortfolioStats(input.artistId);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch portfolio stats');
      }
    }),

  // Get recent portfolio photos for artist profile preview
  getRecentPhotos: publicProcedure
    .input(z.object({ artistId: z.number().int().positive(), limit: z.number().int().optional() }))
    .query(async ({ input }) => {
      try {
        return await db.getArtistRecentPhotos(input.artistId, input.limit || 3);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch recent photos');
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
