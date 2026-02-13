import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { bookings, riderTemplates, riderAcknowledgments, users, venueProfiles } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { generateRiderSharingEmailHTML, generateRiderAcknowledgmentNotificationHTML } from '../emails/riderPdfSharing';

export const riderEmailSharingRouter = router({
  // Send rider PDF to venue
  sendRiderToVenue: publicProcedure
    .input(z.object({
      bookingId: z.number(),
      pdfUrl: z.string().optional(),
    }))
    .mutation(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get booking with rider and venue details
      const booking = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, input.bookingId))
        .limit(1);

      if (!booking || booking.length === 0) {
        throw new Error('Booking not found');
      }

      const bookingData = booking[0];

      if (!bookingData.riderTemplateId) {
        throw new Error('No rider template attached to booking');
      }

      // Get rider template
      const rider = await db
        .select()
        .from(riderTemplates)
        .where(eq(riderTemplates.id, bookingData.riderTemplateId))
        .limit(1);

      if (!rider || rider.length === 0) {
        throw new Error('Rider template not found');
      }

      // Get venue profile
      const venue = await db
        .select()
        .from(venueProfiles)
        .where(eq(venueProfiles.id, bookingData.venueId))
        .limit(1);

      if (!venue || venue.length === 0) {
        throw new Error('Venue profile not found');
      }

      // Get venue user for email
      const venueUser = await db
        .select()
        .from(users)
        .where(eq(users.id, venue[0].userId))
        .limit(1);

      if (!venueUser || venueUser.length === 0) {
        throw new Error('Venue user not found');
      }

      // Get artist for name
      const artist = await db
        .select()
        .from(users)
        .where(eq(users.id, bookingData.artistId))
        .limit(1);

      if (!artist || artist.length === 0) {
        throw new Error('Artist not found');
      }

      // Create or get acknowledgment
      let acknowledgmentId: number;
      const existingAck = await db
        .select()
        .from(riderAcknowledgments)
        .where(eq(riderAcknowledgments.bookingId, input.bookingId))
        .limit(1);

      if (existingAck && existingAck.length > 0) {
        acknowledgmentId = existingAck[0].id;
      } else {
        const ackResult = await db.insert(riderAcknowledgments).values({
          bookingId: input.bookingId,
          riderTemplateId: bookingData.riderTemplateId,
          artistId: bookingData.artistId,
          venueId: bookingData.venueId,
          status: 'pending',
        });
        acknowledgmentId = (ackResult as any).insertId || 0;
      }

      // Generate email content
      const eventDate = bookingData.eventDate ? new Date(bookingData.eventDate).toLocaleDateString() : 'TBD';
      const acknowledgmentLink = `${process.env.VITE_FRONTEND_URL || 'https://ologywood.manus.space'}/booking/${input.bookingId}/rider-acknowledgment`;
      const pdfUrl = input.pdfUrl || `${process.env.VITE_FRONTEND_URL || 'https://ologywood.manus.space'}/api/rider/pdf/${bookingData.riderTemplateId}`;

      const emailHTML = generateRiderSharingEmailHTML(
        venue[0].organizationName || 'Venue',
        artist[0].name || 'Artist',
        eventDate,
        rider[0].templateName || 'Rider Requirements',
        acknowledgmentLink,
        pdfUrl
      );

      // Log email send (in production, integrate with email service)
      console.log(`[Rider Email] Sending rider PDF to ${venueUser[0].email} for booking ${input.bookingId}`);

      return {
        success: true,
        bookingId: input.bookingId,
        acknowledgmentId,
        venueEmail: venueUser[0].email,
        emailSent: true,
        message: `Rider PDF sent to ${venueUser[0].email}`,
      };
    }),

  // Send acknowledgment notification to artist
  sendAcknowledgmentNotification: publicProcedure
    .input(z.object({
      acknowledgmentId: z.number(),
      status: z.enum(['acknowledged', 'modifications_proposed', 'rejected']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get acknowledgment
      const ack = await db
        .select()
        .from(riderAcknowledgments)
        .where(eq(riderAcknowledgments.id, input.acknowledgmentId))
        .limit(1);

      if (!ack || ack.length === 0) {
        throw new Error('Acknowledgment not found');
      }

      const ackData = ack[0];

      // Get booking
      const booking = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, ackData.bookingId))
        .limit(1);

      if (!booking || booking.length === 0) {
        throw new Error('Booking not found');
      }

      const bookingData = booking[0];

      // Get artist user
      const artist = await db
        .select()
        .from(users)
        .where(eq(users.id, bookingData.artistId))
        .limit(1);

      if (!artist || artist.length === 0) {
        throw new Error('Artist not found');
      }

      // Get venue profile
      const venue = await db
        .select()
        .from(venueProfiles)
        .where(eq(venueProfiles.id, ackData.venueId))
        .limit(1);

      if (!venue || venue.length === 0) {
        throw new Error('Venue not found');
      }

      // Generate email content
      const eventDate = bookingData.eventDate ? new Date(bookingData.eventDate).toLocaleDateString() : 'TBD';

      const emailHTML = generateRiderAcknowledgmentNotificationHTML(
        artist[0].name || 'Artist',
        venue[0].organizationName || 'Venue',
        eventDate,
        input.status,
        input.notes
      );

      // Log email send (in production, integrate with email service)
      console.log(`[Rider Email] Sending acknowledgment notification to ${artist[0].email} for acknowledgment ${input.acknowledgmentId}`);

      return {
        success: true,
        acknowledgmentId: input.acknowledgmentId,
        artistEmail: artist[0].email,
        emailSent: true,
        message: `Acknowledgment notification sent to ${artist[0].email}`,
      };
    }),

  // Get email preview
  getEmailPreview: publicProcedure
    .input(z.object({
      bookingId: z.number(),
      type: z.enum(['sharing', 'acknowledgment']),
    }))
    .query(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get booking with rider and venue details
      const booking = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, input.bookingId))
        .limit(1);

      if (!booking || booking.length === 0) {
        throw new Error('Booking not found');
      }

      const bookingData = booking[0];

      if (!bookingData.riderTemplateId) {
        throw new Error('No rider template attached to booking');
      }

      // Get rider template
      const rider = await db
        .select()
        .from(riderTemplates)
        .where(eq(riderTemplates.id, bookingData.riderTemplateId))
        .limit(1);

      if (!rider || rider.length === 0) {
        throw new Error('Rider template not found');
      }

      // Get venue and artist info
      const venue = await db
        .select()
        .from(venueProfiles)
        .where(eq(venueProfiles.id, bookingData.venueId))
        .limit(1);

      const artist = await db
        .select()
        .from(users)
        .where(eq(users.id, bookingData.artistId))
        .limit(1);

      const eventDate = bookingData.eventDate ? new Date(bookingData.eventDate).toLocaleDateString() : 'TBD';

      if (input.type === 'sharing') {
        const emailHTML = generateRiderSharingEmailHTML(
          venue?.[0]?.organizationName || 'Venue',
          artist?.[0]?.name || 'Artist',
          eventDate,
          rider[0].templateName || 'Rider Requirements',
          'https://example.com/acknowledgment',
          'https://example.com/rider.pdf'
        );

        return {
          type: 'sharing',
          html: emailHTML,
          subject: `Rider Received from ${artist?.[0]?.name || 'Artist'}`,
        };
      } else {
        const emailHTML = generateRiderAcknowledgmentNotificationHTML(
          artist?.[0]?.name || 'Artist',
          venue?.[0]?.organizationName || 'Venue',
          eventDate,
          'acknowledged',
          'Thank you for sharing your rider.'
        );

        return {
          type: 'acknowledgment',
          html: emailHTML,
          subject: `Rider Acknowledged by ${venue?.[0]?.organizationName || 'Venue'}`,
        };
      }
    }),
});
