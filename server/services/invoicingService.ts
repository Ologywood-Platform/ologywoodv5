import PDFDocument from 'pdfkit';
import { db } from '../db';
import { bookings, users, artists, venues } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

interface InvoiceData {
  bookingId: number;
  artistId: number;
  venueId: number;
  amount: number;
  tax: number;
  platformFee: number;
  total: number;
  eventDate: Date;
  eventDetails: string;
}

export const invoicingService = {
  async generateInvoice(bookingId: number): Promise<string> {
    // Fetch booking details
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });

    if (!booking) throw new Error('Booking not found');

    // Fetch artist and venue details
    const artist = await db.query.users.findFirst({
      where: eq(users.id, booking.artistId),
    });

    const venue = await db.query.users.findFirst({
      where: eq(users.id, booking.venueId),
    });

    if (!artist || !venue) throw new Error('Artist or venue not found');

    // Calculate invoice amounts
    const subtotal = booking.budget || 0;
    const platformFee = subtotal * 0.05; // 5% platform fee
    const tax = (subtotal + platformFee) * 0.08; // 8% tax
    const total = subtotal + platformFee + tax;

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    // Generate filename
    const invoiceNumber = `INV-${bookingId}-${Date.now()}`;
    const invoicePath = path.join(process.cwd(), 'invoices', `${invoiceNumber}.pdf`);

    // Ensure invoices directory exists
    if (!fs.existsSync(path.join(process.cwd(), 'invoices'))) {
      fs.mkdirSync(path.join(process.cwd(), 'invoices'), { recursive: true });
    }

    // Create write stream
    const stream = fs.createWriteStream(invoicePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', 50, 50);
    doc.fontSize(10).font('Helvetica').text(`Invoice #: ${invoiceNumber}`, 50, 80);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 95);
    doc.text(`Event Date: ${booking.eventDate.toLocaleDateString()}`, 50, 110);

    // Company Info
    doc.fontSize(12).font('Helvetica-Bold').text('Ologywood', 50, 150);
    doc.fontSize(10).font('Helvetica')
      .text('Artist Booking Platform', 50, 170)
      .text('support@ologywood.com', 50, 185)
      .text('www.ologywood.com', 50, 200);

    // Bill To
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, 250);
    doc.fontSize(10).font('Helvetica')
      .text(venue.name || 'Venue', 50, 270)
      .text(venue.email || '', 50, 285);

    // Performer Info
    doc.fontSize(12).font('Helvetica-Bold').text('Performer:', 300, 250);
    doc.fontSize(10).font('Helvetica')
      .text(artist.name || 'Artist', 300, 270)
      .text(artist.email || '', 300, 285);

    // Line items table
    const tableTop = 330;
    const col1 = 50;
    const col2 = 250;
    const col3 = 400;
    const col4 = 500;

    // Table header
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Description', col1, tableTop);
    doc.text('Quantity', col2, tableTop);
    doc.text('Unit Price', col3, tableTop);
    doc.text('Amount', col4, tableTop);

    // Separator line
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Line items
    doc.fontSize(10).font('Helvetica');
    let currentY = tableTop + 30;

    doc.text('Performance Services', col1, currentY);
    doc.text('1', col2, currentY);
    doc.text(`$${subtotal.toFixed(2)}`, col3, currentY);
    doc.text(`$${subtotal.toFixed(2)}`, col4, currentY);

    currentY += 25;

    doc.text('Platform Fee (5%)', col1, currentY);
    doc.text('-', col2, currentY);
    doc.text('-', col3, currentY);
    doc.text(`$${platformFee.toFixed(2)}`, col4, currentY);

    currentY += 25;

    doc.text('Tax (8%)', col1, currentY);
    doc.text('-', col2, currentY);
    doc.text('-', col3, currentY);
    doc.text(`$${tax.toFixed(2)}`, col4, currentY);

    // Separator line
    currentY += 20;
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();

    // Total
    currentY += 15;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('TOTAL', col1, currentY);
    doc.text(`$${total.toFixed(2)}`, col4, currentY);

    // Event Details
    currentY += 50;
    doc.fontSize(11).font('Helvetica-Bold').text('Event Details:', 50, currentY);
    currentY += 20;
    doc.fontSize(10).font('Helvetica')
      .text(booking.eventDetails || 'No additional details', 50, currentY, { width: 500 });

    // Footer
    doc.fontSize(8).font('Helvetica')
      .text('Thank you for your business!', 50, 700)
      .text('Payment terms: Due upon receipt', 50, 715)
      .text('For questions, contact support@ologywood.com', 50, 730);

    // Finalize PDF
    doc.end();

    // Return promise that resolves when stream finishes
    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(invoicePath));
      stream.on('error', reject);
      doc.on('error', reject);
    });
  },

  async getInvoiceHistory(userId: number): Promise<any[]> {
    // Get all bookings for the user (as artist or venue)
    const userBookings = await db.query.bookings.findMany({
      where: (bookings, { or, eq }) =>
        or(
          eq(bookings.artistId, userId),
          eq(bookings.venueId, userId)
        ),
    });

    return userBookings.map((booking) => ({
      id: booking.id,
      date: booking.createdAt,
      amount: booking.budget,
      status: booking.status,
      invoiceGenerated: true,
    }));
  },

  async downloadInvoice(bookingId: number): Promise<Buffer> {
    // Check if invoice exists
    const invoiceDir = path.join(process.cwd(), 'invoices');
    const files = fs.readdirSync(invoiceDir);
    const invoiceFile = files.find((f) => f.includes(`INV-${bookingId}`));

    if (!invoiceFile) {
      // Generate new invoice
      await this.generateInvoice(bookingId);
      const newFiles = fs.readdirSync(invoiceDir);
      const newInvoiceFile = newFiles.find((f) => f.includes(`INV-${bookingId}`));
      if (!newInvoiceFile) throw new Error('Failed to generate invoice');
      return fs.readFileSync(path.join(invoiceDir, newInvoiceFile));
    }

    return fs.readFileSync(path.join(invoiceDir, invoiceFile));
  },

  async emailInvoice(bookingId: number, recipientEmail: string): Promise<boolean> {
    try {
      const invoicePath = await this.generateInvoice(bookingId);
      
      // In production, this would use SendGrid or similar
      console.log(`[Invoice] Emailing invoice to ${recipientEmail}`);
      console.log(`[Invoice] Invoice path: ${invoicePath}`);
      
      return true;
    } catch (error) {
      console.error('Failed to email invoice:', error);
      return false;
    }
  },
};
