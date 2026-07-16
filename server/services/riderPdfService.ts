/**
 * Rider Contract PDF Generation Service
 * Generates a polished PDF from rider contract data using PDFKit.
 */
import PDFDocument from 'pdfkit';
import { getRiderTemplateById, type RiderContractTemplate, type RiderSection } from './riderContractTemplate';

interface PdfSignature {
  signerRole: string;
  signerName: string;
  signedAt: Date | string | null;
  signatureData?: string;
}

interface GenerateRiderPdfOptions {
  templateId: string;
  data: Record<string, any>;
  signatures?: PdfSignature[];
  contractStatus?: string;
  customHtml?: string;
}

export function generateRiderPdf(options: GenerateRiderPdfOptions): Promise<Buffer> {
  const { templateId, data, signatures = [], contractStatus = 'pending', customHtml } = options;

  // If customHtml is provided (NIL contract), generate a simpler text-based PDF from the contract data
  if (customHtml && data._nilContractHtml) {
    return generateNILContractPdf(data);
  }

  const template = getRiderTemplateById(templateId);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Booking Rider - ${data.artist_name || 'Artist'}`,
          Author: 'Ologywood',
          Subject: `Rider Contract for ${data.event_name || 'Event'}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const purple = '#6c5ce7';
      const darkText = '#1a1a2e';
      const lightGray = '#636e72';
      const pageWidth = doc.page.width - 100; // 50px margins each side

      // ===== HEADER =====
      doc.fontSize(22).fillColor(purple).text('BOOKING RIDER', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(16).fillColor(darkText).text(data.artist_name || 'Artist', { align: 'center' });
      doc.moveDown(0.2);
      doc.fontSize(11).fillColor(lightGray).text(
        `${data.event_name || 'Performance'} · ${data.event_date || 'TBD'}`,
        { align: 'center' }
      );
      doc.moveDown(0.5);

      // Divider line
      doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).strokeColor(purple).lineWidth(2).stroke();
      doc.moveDown(1);

      // ===== SECTIONS =====
      if (template) {
        for (const section of template.sections) {
          const sectionHasData = section.fields.some(
            f => data[f.id] !== undefined && data[f.id] !== '' && data[f.id] !== null
          );
          if (!sectionHasData) continue;

          // Section header
          doc.fontSize(12).fillColor(purple).font('Helvetica-Bold').text(section.title.toUpperCase());
          doc.moveDown(0.3);

          // Section fields
          for (const field of section.fields) {
            const value = data[field.id];
            if (value === undefined || value === '' || value === null) continue;

            let displayValue: string;
            if (typeof value === 'boolean') {
              displayValue = value ? '✓ Yes' : '✗ No';
            } else if (field.unit) {
              displayValue = `${value} ${field.unit}`;
            } else {
              displayValue = String(value);
            }

            const labelWidth = 180;
            const valueWidth = pageWidth - labelWidth - 10;
            const startY = doc.y;

            doc.font('Helvetica-Bold').fontSize(10).fillColor('#555')
              .text(field.label + ':', 50, startY, { width: labelWidth, continued: false });

            doc.font('Helvetica').fontSize(10).fillColor(darkText)
              .text(displayValue, 50 + labelWidth + 10, startY, { width: valueWidth });

            // Ensure we move below the tallest of the two columns
            const afterY = doc.y;
            if (afterY < startY + 14) doc.y = startY + 14;
            doc.moveDown(0.2);
          }

          doc.moveDown(0.5);
          // Light divider between sections
          doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).strokeColor('#eee').lineWidth(1).stroke();
          doc.moveDown(0.8);
        }
      }

      // ===== SIGNATURES SECTION =====
      doc.moveDown(1);
      doc.fontSize(12).fillColor(purple).font('Helvetica-Bold').text('SIGNATURES');
      doc.moveDown(0.5);

      const artistSig = signatures.find(s => s.signerRole === 'artist');
      const venueSig = signatures.find(s => s.signerRole === 'venue');

      const sigStartY = doc.y;
      const halfWidth = pageWidth / 2 - 20;

      // Artist signature column
      doc.font('Helvetica-Bold').fontSize(9).fillColor(purple)
        .text('ARTIST', 50, sigStartY, { width: halfWidth });
      doc.moveDown(0.3);
      if (artistSig) {
        doc.font('Helvetica').fontSize(10).fillColor(darkText)
          .text(artistSig.signerName, 50, doc.y, { width: halfWidth });
        doc.moveDown(0.2);
        const signedDate = artistSig.signedAt
          ? new Date(artistSig.signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : 'Pending';
        doc.fontSize(9).fillColor(lightGray).text(`Signed: ${signedDate}`, 50, doc.y, { width: halfWidth });
      } else {
        doc.font('Helvetica').fontSize(10).fillColor(lightGray)
          .text('Awaiting signature...', 50, doc.y, { width: halfWidth });
      }

      // Venue signature column
      doc.y = sigStartY;
      const venueX = 50 + halfWidth + 40;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(purple)
        .text('VENUE', venueX, sigStartY, { width: halfWidth });
      doc.moveDown(0.3);
      if (venueSig) {
        doc.font('Helvetica').fontSize(10).fillColor(darkText)
          .text(venueSig.signerName, venueX, doc.y, { width: halfWidth });
        doc.moveDown(0.2);
        const signedDate = venueSig.signedAt
          ? new Date(venueSig.signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : 'Pending';
        doc.fontSize(9).fillColor(lightGray).text(`Signed: ${signedDate}`, venueX, doc.y, { width: halfWidth });
      } else {
        doc.font('Helvetica').fontSize(10).fillColor(lightGray)
          .text('Awaiting signature...', venueX, doc.y, { width: halfWidth });
      }

      doc.y = Math.max(doc.y, sigStartY + 60);
      doc.moveDown(2);

      // Status badge
      const statusLabel = contractStatus === 'fully_signed' ? '✓ FULLY SIGNED' :
        contractStatus === 'signed_by_artist' ? '⏳ AWAITING VENUE SIGNATURE' :
        contractStatus === 'signed_by_venue' ? '⏳ AWAITING ARTIST SIGNATURE' : '⏳ PENDING SIGNATURES';
      doc.fontSize(10).fillColor(contractStatus === 'fully_signed' ? '#27ae60' : '#e67e22')
        .font('Helvetica-Bold').text(statusLabel, { align: 'center' });

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).fillColor('#bbb').font('Helvetica')
        .text('Generated by Ologywood · Artist Booking Platform', { align: 'center' });
      doc.text(`Document created: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}


/**
 * Generate a PDF for NIL contracts using PDFDocument (text-based, professional layout)
 */
function generateNILContractPdf(data: Record<string, any>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `NIL Engagement Contract - ${data.artist_name || 'Athlete'}`,
          Author: 'Ologywood',
          Subject: 'NIL Engagement Contract',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const purple = '#6c5ce7';
      const darkText = '#1a1a2e';
      const pageWidth = doc.page.width - 100;

      // Header
      doc.fontSize(10).fillColor(purple).text('OLOGYWOOD™ · OFFICIAL CONTRACT DOCUMENT', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(22).fillColor(darkText).text('NIL ENGAGEMENT CONTRACT', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#636e72').text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
      doc.moveDown(1);

      // Divider
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke(purple);
      doc.moveDown(1);

      // Body text
      doc.fontSize(11).fillColor(darkText).text(
        'This document serves as the official NIL Engagement Contract between the parties listed herein. ' +
        'For the complete formatted contract with all sections (Parties, Engagement Details, Compensation, ' +
        'Travel & Logistics, Security, Equipment, Media Rights, NIL Compliance, Cancellation Terms, and Signatures), ' +
        'please view the contract online through the Ologywood platform.',
        { align: 'left', lineGap: 4 }
      );
      doc.moveDown(1);

      doc.fontSize(12).fillColor(purple).text('Key Terms Summary:', { underline: true });
      doc.moveDown(0.5);

      const fee = data.performance_fee || data.totalFee || 'TBD';
      const event = data.event_name || 'Engagement';
      const artist = data.artist_name || 'Athlete';
      const venue = data.venue_name || 'Booker';

      doc.fontSize(11).fillColor(darkText);
      doc.text(`• Talent: ${artist}`);
      doc.text(`• Booker: ${venue}`);
      doc.text(`• Event: ${event}`);
      doc.text(`• Compensation: $${fee}`);
      doc.text(`• Platform: Ologywood (www.ologywood.com)`);
      doc.moveDown(2);

      doc.fontSize(10).fillColor('#636e72').text(
        'This PDF is a summary document. The full legally binding contract with e-signatures ' +
        'is maintained digitally on the Ologywood platform.',
        { align: 'center' }
      );

      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#eee');
      doc.moveDown(0.5);
      doc.fontSize(8).fillColor('#bbb').text('www.ologywood.com', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
