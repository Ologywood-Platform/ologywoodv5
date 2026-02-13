import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, BorderStyle, convertInchesToTwip } from 'docx';
import { getDb } from '../db';
import { invoices, bookings, artistProfiles, venueProfiles, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export const invoicePdfService = {
  /**
   * Generate invoice PDF for a booking
   */
  async generateInvoicePdf(bookingId: number, invoiceId: number) {
    try {
      const db = await getDb();

      // Get invoice data
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, invoiceId),
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Get booking details
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Get artist profile
      const artist = await db.query.users.findFirst({
        where: eq(users.id, invoice.artistId),
      });

      // Get venue profile
      const venue = await db.query.users.findFirst({
        where: eq(users.id, invoice.venueId),
      });

      // Create document
      const doc = new Document({
        sections: [
          {
            children: [
              // Header
              new Paragraph({
                text: 'INVOICE',
                bold: true,
                size: 32,
                alignment: 'center',
              }),

              new Paragraph({
                text: '',
              }),

              // Invoice details
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({
                            text: 'Invoice Number:',
                            bold: true,
                          }),
                          new Paragraph({
                            text: invoice.invoiceNumber,
                          }),
                        ],
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            text: 'Invoice Date:',
                            bold: true,
                          }),
                          new Paragraph({
                            text: new Date(invoice.createdAt).toLocaleDateString(),
                          }),
                        ],
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            text: 'Due Date:',
                            bold: true,
                          }),
                          new Paragraph({
                            text: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon Receipt',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              new Paragraph({ text: '' }),

              // From/To section
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({
                            text: 'FROM (Artist):',
                            bold: true,
                          }),
                          new Paragraph({
                            text: artist?.name || 'Artist Name',
                          }),
                          new Paragraph({
                            text: artist?.email || '',
                          }),
                        ],
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            text: 'TO (Venue):',
                            bold: true,
                          }),
                          new Paragraph({
                            text: venue?.name || 'Venue Name',
                          }),
                          new Paragraph({
                            text: venue?.email || '',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              new Paragraph({ text: '' }),

              // Event details
              new Paragraph({
                text: 'Event Details',
                bold: true,
                size: 24,
              }),

              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph('Event Date:')],
                      }),
                      new TableCell({
                        children: [new Paragraph(new Date(booking.eventDate).toLocaleDateString())],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph('Event Time:')],
                      }),
                      new TableCell({
                        children: [new Paragraph(booking.eventTime || 'TBD')],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph('Event Details:')],
                      }),
                      new TableCell({
                        children: [new Paragraph(booking.eventDetails || 'N/A')],
                      }),
                    ],
                  }),
                ],
              }),

              new Paragraph({ text: '' }),

              // Line items
              new Paragraph({
                text: 'Payment Breakdown',
                bold: true,
                size: 24,
              }),

              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ text: 'Description', bold: true })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: 'Amount', bold: true })],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph('Booking Fee')],
                      }),
                      new TableCell({
                        children: [new Paragraph(`$${invoice.amount}`)],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph('Platform Fee')],
                      }),
                      new TableCell({
                        children: [new Paragraph(`-$${invoice.platformFee}`)],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ text: 'Total', bold: true })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: `$${invoice.total}`, bold: true })],
                      }),
                    ],
                  }),
                ],
              }),

              new Paragraph({ text: '' }),

              // Notes
              new Paragraph({
                text: 'Notes:',
                bold: true,
              }),
              new Paragraph({
                text: invoice.notes || 'Thank you for your business!',
              }),

              new Paragraph({ text: '' }),

              // Footer
              new Paragraph({
                text: 'This invoice was generated by Ologywood Artist Booking Platform',
                italics: true,
                size: 16,
                alignment: 'center',
              }),
            ],
          },
        ],
      });

      // Generate PDF buffer
      const buffer = await Packer.toBuffer(doc);

      // Save to file
      const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `invoice-${invoice.invoiceNumber}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);

      // Update invoice with PDF URL
      const pdfUrl = `/uploads/invoices/${fileName}`;
      await db
        .update(invoices)
        .set({ pdfUrl })
        .where(eq(invoices.id, invoiceId));

      return {
        pdfUrl,
        filePath,
        fileName,
      };
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw error;
    }
  },

  /**
   * Get invoice PDF
   */
  async getInvoicePdf(invoiceId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      const invoiceResults = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
      const invoice = invoiceResults.length > 0 ? invoiceResults[0] : null;

      if (!invoice || !invoice.pdfUrl) {
        throw new Error('Invoice PDF not found');
      }

      return invoice.pdfUrl;
    } catch (error) {
      console.error('Error getting invoice PDF:', error);
      throw error;
    }
  },

  /**
   * Mark invoice as sent
   */
  async markInvoiceAsSent(invoiceId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      await db
        .update(invoices)
        .set({
          status: 'sent',
          sentAt: new Date(),
        })
        .where(eq(invoices.id, invoiceId));

      return true;
    } catch (error) {
      console.error('Error marking invoice as sent:', error);
      throw error;
    }
  },

  /**
   * Mark invoice as paid
   */
  async markInvoiceAsPaid(invoiceId: number) {
    try {
      const db = await getDb();
      await db
        .update(invoices)
        .set({
          status: 'paid',
          paidAt: new Date(),
        })
        .where(eq(invoices.id, invoiceId));

      return true;
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      throw error;
    }
  },
};
