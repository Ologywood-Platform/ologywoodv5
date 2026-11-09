import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import * as db from '../db';
import { notifyFansNewEvent } from '../services/fanNotificationService';

function eventErrorKind(error: unknown): string {
  return error instanceof Error ? error.name : 'UnknownError';
}
import {
  getPortfolioPhotos,
  PORTFOLIO_PHOTO_DEFAULT_LIMIT,
  PORTFOLIO_PHOTO_MAX_LIMIT,
} from '../services/portfolioPhotoService';
import { EVENT_TYPE_VALUES } from '../../shared/eventTypes';

const eventId = z.number().int().safe().positive();
const eventTitle = z.string().trim().min(1).max(200);
const eventDescription = z.string().trim().max(10_000).optional();
const eventLocation = z.string().trim().min(1).max(500);
const eventTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must use HH:MM');
const eventCapacity = z.number().int().min(0).max(2_000_000);
const eventRate = z.string().trim().max(30).regex(/^\d{1,9}(?:\.\d{1,2})?$/, 'Rate must be a non-negative amount with up to two decimals');
const ticketPrice = z.string().trim().max(30).regex(/^(?:free|\$?\d{1,9}(?:,\d{3})*(?:\.\d{1,2})?)$/i, 'Ticket price must be Free or a valid amount');
const publicEventUrl = z.string().trim().url().max(2_000).refine((value) => /^https?:\/\//i.test(value), 'URL must use HTTP(S)');
const eventImageUrl = publicEventUrl.optional();
const dateOnlyString = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD');
const eventPhotoMime = z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const eventPhotoData = z.string().min(1).max(15_000_000);
const eventPhotoFileName = z.string().trim().min(1).max(255).regex(/^[^/\\]+$/, 'Invalid photo filename');

function validateEventPhotoData(fileData: string, mimeType: z.infer<typeof eventPhotoMime>) {
  const match = fileData.match(/^data:([^;]+);base64,([A-Za-z0-9+/=\s]+)$/i);
  if (match && match[1].toLowerCase() !== mimeType) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Photo MIME type does not match the data URL.' });
  const base64 = (match ? match[2] : fileData).replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64) || base64.length % 4 === 1) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid photo data.' });
  const decodedSize = Math.floor(base64.length * 3 / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
  if (decodedSize < 1 || decodedSize > 10_000_000) throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: 'Photo must be no larger than 10 MB.' });
}

// Input validation schemas
const createEventSchema = z.object({
  eventTitle,
  description: eventDescription,
  eventType: z.enum(EVENT_TYPE_VALUES),
  location: eventLocation.optional(),
  eventDate: z.date(),
  eventTime: eventTime.optional(),
  eventEndTime: eventTime.optional(),
  capacity: eventCapacity.optional(),
  audienceType: z.string().trim().max(100).optional(),
  rate: eventRate.optional(), // Stored as decimal string
  isPublic: z.boolean().default(false),
  status: z.enum(['available', 'booked', 'completed', 'cancelled']).default('available'),
}).strict();

const updateEventSchema = createEventSchema.partial().extend({
  id: eventId,
}).strict();

const searchEventsSchema = z.object({
  search: z.string().trim().max(200).optional(),
  eventType: z.enum(EVENT_TYPE_VALUES).optional(),
  location: z.string().trim().max(200).optional(),
  minRate: z.number().finite().min(0).max(1_000_000_000).optional(),
  maxRate: z.number().finite().min(0).max(1_000_000_000).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  artistId: eventId.optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).max(1_000_000).default(0),
}).strict().refine((value) => value.minRate === undefined || value.maxRate === undefined || value.minRate <= value.maxRate, 'Minimum rate cannot exceed maximum rate');

// Simplified schema for artist event posts (fan-facing)
const artistPostSchema = z.object({
  eventTitle,
  eventType: z.enum(EVENT_TYPE_VALUES),
  eventDate: z.date(),
  eventTime: eventTime.optional(),
  eventEndTime: eventTime.optional(),
  location: eventLocation,
  description: eventDescription,
  ticketLink: publicEventUrl.optional().or(z.literal('')),
  coverImageUrl: eventImageUrl,
}).strict();

// Venue event creation schema
const venueEventSchema = z.object({
  eventTitle,
  eventDate: z.date(),
  eventTime: eventTime.optional(),
  eventEndTime: eventTime.optional(),
  location: eventLocation,
  description: eventDescription,
  ticketLink: publicEventUrl.optional().or(z.literal('')),
  coverImageUrl: eventImageUrl,
  eventType: z.enum(EVENT_TYPE_VALUES).default('concert'),
  artistId: eventId,
  bookingId: eventId.optional(),
  ticketPrice: ticketPrice.optional(),
  capacity: eventCapacity.optional(),
}).strict();

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
          if (booking.artistId !== input.artistId) throw new Error('Event artist must match the booking artist');
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
          eventType: input.eventType,
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
        }).catch(err => console.error('[Events] Fan notification failed:', eventErrorKind(err)));

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
          eventType: input.eventType,
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
          }).catch(err => console.error('[Events] Fan notification failed:', eventErrorKind(err)));
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
    .input(z.object({ id: eventId }).strict())
    .query(async ({ input }) => {
      try {
        const event = await db.getEventById(input.id);
        if (!event || !event.isPublic) {
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
    .input(z.object({ slug: z.string().trim().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'Invalid event slug') }).strict())
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
        if (!found || !found.isPublic) return null;
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
    .input(z.object({ artistId: eventId }).strict())
    .query(async ({ input }) => {
      try {
        const events = await db.getArtistEvents(input.artistId);
        return events.filter((event) => event.isPublic);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch events');
      }
    }),

  // Get events by venue ID (public)
  getByVenueId: publicProcedure
    .input(z.object({ venueId: eventId }).strict())
    .query(async ({ input }) => {
      try {
        const events = await db.getEventsByVenueProfileId(input.venueId);
        return events.filter((event) => event.isPublic);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch venue events');
      }
    }),

  // Update event
  update: protectedProcedure
    .input(updateEventSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const existing = await db.getEventById(input.id);
        if (!existing) throw new Error('Event not found');
        if (ctx.user.role !== 'admin') {
          const [artistProfile, venueProfile] = await Promise.all([
            db.getArtistProfileByUserId(ctx.user.id),
            db.getVenueProfileByUserId(ctx.user.id),
          ]);
          const ownsEvent = existing.artistId === artistProfile?.id || existing.venueId === venueProfile?.id;
          if (!ownsEvent) throw new Error('Not authorized to edit this event');
        }
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
    .input(z.object({ id: eventId }).strict())
    .mutation(async ({ input, ctx }) => {
      try {
        const existing = await db.getEventById(input.id);
        if (!existing) throw new Error('Event not found');
        if (ctx.user.role !== 'admin') {
          const [artistProfile, venueProfile] = await Promise.all([
            db.getArtistProfileByUserId(ctx.user.id),
            db.getVenueProfileByUserId(ctx.user.id),
          ]);
          const ownsEvent = existing.artistId === artistProfile?.id || existing.venueId === venueProfile?.id;
          if (!ownsEvent) throw new Error('Not authorized to delete this event');
        }
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
          query: input.search,
          city: input.location,
          category: input.eventType,
          startDate: input.startDate?.toISOString().split('T')[0],
          endDate: input.endDate?.toISOString().split('T')[0],
        });
        const filtered = events.filter((event) => {
          const numericRate = event.rate === null || event.rate === undefined ? null : Number(event.rate);
          return (input.minRate === undefined || (numericRate !== null && numericRate >= input.minRate)) &&
            (input.maxRate === undefined || (numericRate !== null && numericRate <= input.maxRate));
        });
        const paged = filtered.slice(input.offset, input.offset + input.limit);
        // Enrich events with artist profile data for display
        const enriched = await Promise.all(
          paged.map(async (event) => {
            const artistProfile = await db.getArtistProfileById(event.artistId);
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
    .input(z.object({ eventId }).strict())
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
      eventId,
      frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
      endDate: z.date().optional(),
    }).strict())
    .mutation(async ({ input, ctx }) => {
      try {
        const existing = await db.getEventById(input.eventId);
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!existing || !artistProfile || existing.artistId !== artistProfile.id) throw new Error('Not authorized to create recurrence for this event');
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
      artistId: eventId,
    }).strict())
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
      eventHistoryId: eventId,
      photoUrl: publicEventUrl,
      caption: z.string().trim().max(500).optional(),
    }).strict())
    .mutation(async ({ input, ctx }) => {
      try {
        const history = await db.getEventHistoryById(input.eventHistoryId);
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!history || !artistProfile || history.artistId !== artistProfile.id) throw new Error('Not authorized to add photos to this entry');
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
    .input(z.object({ eventHistoryId: eventId }).strict())
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
      eventName: z.string().trim().min(1, 'Event name is required').max(200),
      eventDate: dateOnlyString,
      venueName: z.string().trim().max(200).optional(),
      location: z.string().trim().max(500).optional(),
      attendeeCount: z.number().int().min(0).max(2_000_000).optional(),
      notes: z.string().trim().max(10_000).optional(),
      eventId: eventId.optional(),
      bookingId: eventId.optional(),
      venueId: eventId.optional(),
    }).strict())
    .mutation(async ({ input, ctx }) => {
      try {
        // Look up artist profile to get the correct profile ID (not user ID)
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile) throw new Error('Artist profile not found');
        if (input.eventId) {
          const referencedEvent = await db.getEventById(input.eventId);
          if (!referencedEvent || referencedEvent.artistId !== artistProfile.id) throw new Error('Referenced event does not belong to this artist');
        }
        if (input.bookingId) {
          const referencedBooking = await db.getBookingById(input.bookingId);
          if (!referencedBooking || referencedBooking.artistId !== artistProfile.id) throw new Error('Referenced booking does not belong to this artist');
        }
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
      historyId: eventId,
      eventName: z.string().trim().min(1).max(200).optional(),
      eventDate: dateOnlyString.optional(),
      venueName: z.string().trim().max(200).optional(),
      location: z.string().trim().max(500).optional(),
      attendeeCount: z.number().int().min(0).max(2_000_000).optional(),
      notes: z.string().trim().max(10_000).optional(),
    }).strict())
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
      eventHistoryId: eventId,
      fileData: eventPhotoData,
      fileName: eventPhotoFileName,
      mimeType: eventPhotoMime,
      caption: z.string().trim().max(500).optional(),
    }).strict())
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify ownership
        const historyEntry = await db.getEventHistoryById(input.eventHistoryId);
        if (!historyEntry) throw new Error('History entry not found');
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile || historyEntry.artistId !== artistProfile.id) throw new Error('Not authorized to upload photos to this entry');
        validateEventPhotoData(input.fileData, input.mimeType);
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
    .input(z.object({ photoId: eventId }).strict())
    .mutation(async ({ input, ctx }) => {
      try {
        const photo = await db.getEventPhotoById(input.photoId);
        const history = photo ? await db.getEventHistoryById(photo.eventHistoryId) : null;
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!photo || !history || !artistProfile || history.artistId !== artistProfile.id) throw new Error('Not authorized to delete this photo');
        const deleted = await db.deleteEventPhoto(input.photoId);
        return { success: deleted, message: deleted ? 'Photo deleted' : 'Failed to delete photo' };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to delete photo');
      }
    }),

  // Get portfolio stats for an artist
  getPortfolioStats: publicProcedure
    .input(z.object({ artistId: eventId }).strict())
    .query(async ({ input }) => {
      try {
        return await db.getArtistPortfolioStats(input.artistId);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch portfolio stats');
      }
    }),

  // Get every portfolio photo across an artist's event-history entries.
  getPortfolioPhotos: publicProcedure
    .input(z.object({
      artistId: eventId,
      cursor: z.number().int().positive().optional(),
      // tRPC v11 adds this field to useInfiniteQuery requests.
      direction: z.literal('forward').optional(),
      limit: z.number().int().min(1).max(PORTFOLIO_PHOTO_MAX_LIMIT).default(PORTFOLIO_PHOTO_DEFAULT_LIMIT),
    }).strict())
    .query(async ({ input }) => {
      try {
        return await getPortfolioPhotos(input);
      } catch {
        // Do not expose database state or return a false empty result on outage.
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Portfolio photos are temporarily unavailable. Please try again.',
        });
      }
    }),

  // Get recent portfolio photos for artist profile preview
  getRecentPhotos: publicProcedure
    .input(z.object({ artistId: eventId, limit: z.number().int().min(0).max(1_000_000).optional() }).strict())
    .query(async ({ input }) => {
      try {
        // Keep omitted/zero limits backward compatible while bounding large requests.
        return await db.getArtistRecentPhotos(input.artistId, Math.min(
          PORTFOLIO_PHOTO_MAX_LIMIT,
          Math.max(1, input.limit || 3),
        ));
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch recent photos');
      }
    }),

  // Save event (bookmark/wishlist)
  saveEvent: protectedProcedure
    .input(z.object({ eventId }).strict())
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
    .input(z.object({ eventId }).strict())
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
    .input(z.object({ eventId }).strict())
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
      eventId,
      limit: z.number().int().min(1).max(12).default(6),
    }).strict())
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
      artistId: eventId,
      daysAhead: z.number().int().min(1).max(365).default(90),
    }).strict())
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
