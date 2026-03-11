import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { bookings, users, artistProfiles, venueProfiles } from '../../drizzle/schema';
import { eq, and, or } from 'drizzle-orm';
import { generateInvoicePDF } from '../invoice-service';

const router = Router();

/**
 * GET /api/invoice/:bookingId/download
 * Generate and download a PDF invoice for a booking.
 * Requires the user to be either the artist or venue on the booking.
 * Auth is verified via the session cookie.
 */
router.get('/:bookingId/download', async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    // Get user from session (check cookie-based auth)
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database unavailable' });
    }

    // Fetch the booking
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify user is either the artist or venue on this booking
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check authorization: user must be the artist or venue on this booking
    let isAuthorized = false;
    if (booking.venueId === userId) {
      isAuthorized = true;
    }
    // Check if user is the artist (artistId on booking is the profile ID, need to check)
    if (booking.artistId) {
      const [artistProfile] = await db.select().from(artistProfiles)
        .where(and(eq(artistProfiles.id, booking.artistId), eq(artistProfiles.userId, userId)))
        .limit(1);
      if (artistProfile) {
        isAuthorized = true;
      }
    }
    // Admin can also download
    if (user.role === 'admin') {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You are not authorized to download this invoice' });
    }

    // Get artist info
    let artistName = 'Artist';
    let artistEmail = '';
    if (booking.artistId) {
      const [artistProfile] = await db.select().from(artistProfiles)
        .where(eq(artistProfiles.id, booking.artistId)).limit(1);
      if (artistProfile) {
        artistName = artistProfile.artistName || 'Artist';
        const [artistUser] = await db.select().from(users)
          .where(eq(users.id, artistProfile.userId)).limit(1);
        if (artistUser) {
          artistEmail = artistUser.email || '';
        }
      }
    }

    // Get venue info
    let venueName = 'Venue';
    let venueEmail = '';
    if (booking.venueId) {
      const [venueUser] = await db.select().from(users)
        .where(eq(users.id, booking.venueId)).limit(1);
      if (venueUser) {
        venueEmail = venueUser.email || '';
        venueName = venueUser.name || 'Venue';
      }
      // Try to get venue profile name
      const [venueProfile] = await db.select().from(venueProfiles)
        .where(eq(venueProfiles.userId, booking.venueId)).limit(1);
      if (venueProfile) {
        venueName = venueProfile.organizationName || venueName;
      }
    }

    const totalFee = parseFloat(String(booking.totalFee || '0'));
    const depositAmount = parseFloat(String(booking.depositAmount || '0')) || totalFee * 0.5;
    const eventDate = booking.eventDate ? new Date(booking.eventDate) : new Date();
    // Calculate due dates based on event date (deposit due 30 days before, final due 7 days before)
    const depositDueDate = new Date(eventDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const finalDueDate = new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    const invoiceData = {
      id: booking.id,
      bookingId: booking.id,
      artistName,
      artistEmail,
      venueName,
      venueEmail,
      eventDate,
      eventTitle: booking.eventDetails || `Booking #${booking.id}`,
      amount: totalFee,
      depositAmount,
      depositDueDate,
      finalDueDate,
      paymentTerms: 'Payment is due according to the agreed schedule. 50% deposit required to confirm booking, remaining balance due before the event date.',
      notes: undefined,
    };

    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Set response headers for PDF download
    const filename = `Ologywood-Invoice-${booking.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('[Invoice Download] Error:', error);
    res.status(500).json({ error: 'Failed to generate invoice PDF' });
  }
});

export default router;
