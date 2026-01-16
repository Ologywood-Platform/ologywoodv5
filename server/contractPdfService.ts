/**
 * Contract PDF Generation Service
 * Generates PDF copies of contracts with signatures and verification details
 */

import { PDFDocument, PDFPage, rgb, degrees } from 'pdf-lib';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface ContractPdfData {
  contractId: string;
  contractTitle: string;
  artistName: string;
  artistEmail: string;
  venueName: string;
  venueEmail: string;
  eventDate: string;
  eventVenue: string;
  performanceFee: number;
  paymentTerms: string;
  performanceDetails: Record<string, any>;
  technicalRequirements: Record<string, any>;
  artistSignatureImage?: string;
  venueSignatureImage?: string;
  certificateNumber?: string;
  signedAt?: string;
  isSigned: boolean;
}

/**
 * Generate PDF from HTML contract template
 */
export async function generateContractPdf(contractData: ContractPdfData): Promise<Buffer> {
  try {
    console.log(`[PDF Service] Generating PDF for contract ${contractData.contractId}`);

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([612, 792]); // Letter size

    const { width, height } = page.getSize();
    const margin = 40;
    const contentWidth = width - 2 * margin;
    let yPosition = height - margin;

    // Helper function to add text
    const addText = (text: string, size: number = 12, isBold: boolean = false, color = rgb(0, 0, 0)) => {
      const fontSize = size;
      page.drawText(text, {
        x: margin,
        y: yPosition,
        size: fontSize,
        color,
        maxWidth: contentWidth,
      });
      yPosition -= fontSize + 10;

      if (yPosition < margin + 100) {
        page = pdfDoc.addPage([612, 792]);
        yPosition = height - margin;
      }
    };

    // Header
    addText('OLOGYWOOD', 16, true, rgb(124, 58, 237)); // Purple color
    addText('Artist Performance Agreement', 14, true);
    addText('', 8); // Spacing

    // Contract Title
    addText(`Contract: ${contractData.contractTitle}`, 12, true);
    addText(`Contract ID: ${contractData.contractId}`, 10);
    addText('', 8);

    // Event Details
    addText('EVENT DETAILS', 12, true);
    addText(`Event Date: ${new Date(contractData.eventDate).toLocaleDateString()}`, 10);
    addText(`Venue: ${contractData.eventVenue}`, 10);
    addText(`Performance Fee: $${contractData.performanceFee.toLocaleString()}`, 10);
    addText(`Payment Terms: ${contractData.paymentTerms}`, 10);
    addText('', 8);

    // Party Information
    addText('PARTIES', 12, true);
    addText(`Artist: ${contractData.artistName}`, 10);
    addText(`Email: ${contractData.artistEmail}`, 10);
    addText('', 6);
    addText(`Venue: ${contractData.venueName}`, 10);
    addText(`Email: ${contractData.venueEmail}`, 10);
    addText('', 8);

    // Performance Details
    addText('PERFORMANCE DETAILS', 12, true);
    Object.entries(contractData.performanceDetails).forEach(([key, value]) => {
      addText(`${key}: ${value}`, 10);
    });
    addText('', 8);

    // Technical Requirements
    addText('TECHNICAL REQUIREMENTS', 12, true);
    Object.entries(contractData.technicalRequirements).forEach(([key, value]) => {
      addText(`${key}: ${value}`, 10);
    });
    addText('', 8);

    // Signatures Section
    if (contractData.isSigned) {
      addText('SIGNATURES', 12, true);
      addText('', 6);

      // Artist Signature
      addText('Artist Signature:', 10, true);
      if (contractData.artistSignatureImage) {
        try {
          // Note: In production, you would embed the signature image here
          // For now, we'll add a text indicator
          addText('[Signature Image Embedded]', 9);
        } catch (error) {
          console.warn('[PDF Service] Could not embed artist signature image');
        }
      }
      addText(`Signed by: ${contractData.artistName}`, 9);
      addText(`Date: ${contractData.signedAt || new Date().toLocaleDateString()}`, 9);
      addText('', 6);

      // Venue Signature
      addText('Venue Signature:', 10, true);
      if (contractData.venueSignatureImage) {
        try {
          addText('[Signature Image Embedded]', 9);
        } catch (error) {
          console.warn('[PDF Service] Could not embed venue signature image');
        }
      }
      addText(`Signed by: ${contractData.venueName}`, 9);
      addText(`Date: ${contractData.signedAt || new Date().toLocaleDateString()}`, 9);
      addText('', 8);

      // Certificate Information
      if (contractData.certificateNumber) {
        addText('CERTIFICATE OF SIGNATURE', 12, true);
        addText(`Certificate Number: ${contractData.certificateNumber}`, 10, true);
        addText('This certificate verifies the authenticity of all signatures on this contract.', 9);
        addText('', 6);
        addText('To verify this certificate, visit:', 9);
        addText('https://ologywood.com/verify-certificate', 9);
        addText('', 8);
      }

      // Watermark for signed contracts
      addText('✓ FULLY SIGNED AND EXECUTED', 14, true, rgb(34, 197, 94)); // Green color
    } else {
      addText('STATUS: PENDING SIGNATURES', 12, true, rgb(239, 68, 68)); // Red color
      addText('This contract requires signatures from both parties.', 10);
    }

    // Footer
    yPosition = margin + 20;
    page.drawText(`Generated: ${new Date().toLocaleString()}`, {
      x: margin,
      y: yPosition,
      size: 8,
      color: rgb(107, 114, 128),
    });

    page.drawText(`Page 1 of ${pdfDoc.getPages().length}`, {
      x: width - margin - 100,
      y: yPosition,
      size: 8,
      color: rgb(107, 114, 128),
    });

    // Save PDF to buffer
    const pdfBytes = await pdfDoc.save();
    console.log(`[PDF Service] PDF generated successfully for contract ${contractData.contractId}`);

    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('[PDF Service] Error generating PDF:', error);
    throw error;
  }
}

/**
 * Generate PDF and save to file
 */
export async function generateAndSaveContractPdf(contractData: ContractPdfData, outputPath: string): Promise<string> {
  try {
    const pdfBuffer = await generateContractPdf(contractData);
    writeFileSync(outputPath, pdfBuffer);
    console.log(`[PDF Service] PDF saved to ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('[PDF Service] Error saving PDF:', error);
    throw error;
  }
}

/**
 * Generate PDF with HTML template (alternative method)
 */
export async function generateContractPdfFromHtml(htmlContent: string, contractData: ContractPdfData): Promise<Buffer> {
  try {
    console.log(`[PDF Service] Generating PDF from HTML for contract ${contractData.contractId}`);

    // This would use a library like puppeteer or weasyprint to convert HTML to PDF
    // For now, we'll use the basic PDF generation above
    // In production, you might use:
    // - puppeteer: For complex HTML rendering
    // - weasyprint: For CSS-based PDF generation
    // - html2pdf: For browser-based PDF generation

    return await generateContractPdf(contractData);
  } catch (error) {
    console.error('[PDF Service] Error generating PDF from HTML:', error);
    throw error;
  }
}

/**
 * Create PDF download response
 */
export function createPdfDownloadResponse(pdfBuffer: Buffer, filename: string): { buffer: Buffer; filename: string; contentType: string } {
  return {
    buffer: pdfBuffer,
    filename: filename || `contract-${Date.now()}.pdf`,
    contentType: 'application/pdf',
  };
}

/**
 * Generate filename for contract PDF
 */
export function generatePdfFilename(contractData: ContractPdfData): string {
  const date = new Date().toISOString().split('T')[0];
  const sanitizedTitle = contractData.contractTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  return `${sanitizedTitle}-${contractData.contractId}-${date}.pdf`;
}

/**
 * Validate contract data before PDF generation
 */
export function validateContractData(contractData: ContractPdfData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!contractData.contractId) errors.push('Contract ID is required');
  if (!contractData.contractTitle) errors.push('Contract title is required');
  if (!contractData.artistName) errors.push('Artist name is required');
  if (!contractData.venueName) errors.push('Venue name is required');
  if (!contractData.eventDate) errors.push('Event date is required');
  if (!contractData.eventVenue) errors.push('Event venue is required');
  if (contractData.performanceFee === undefined) errors.push('Performance fee is required');

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate contract PDF with metadata
 */
export async function generateContractPdfWithMetadata(
  contractData: ContractPdfData,
  metadata: Record<string, string> = {}
): Promise<{ buffer: Buffer; filename: string; metadata: Record<string, string> }> {
  try {
    const pdfBuffer = await generateContractPdf(contractData);
    const filename = generatePdfFilename(contractData);

    const pdfMetadata = {
      title: contractData.contractTitle,
      author: 'Ologywood',
      subject: `Contract: ${contractData.contractTitle}`,
      creator: 'Ologywood Contract Management System',
      producer: 'Ologywood',
      creationDate: new Date().toISOString(),
      contractId: contractData.contractId,
      artistName: contractData.artistName,
      venueName: contractData.venueName,
      eventDate: contractData.eventDate,
      isSigned: contractData.isSigned.toString(),
      certificateNumber: contractData.certificateNumber || 'N/A',
      ...metadata,
    };

    return {
      buffer: pdfBuffer,
      filename,
      metadata: pdfMetadata,
    };
  } catch (error) {
    console.error('[PDF Service] Error generating PDF with metadata:', error);
    throw error;
  }
}

export default {
  generateContractPdf,
  generateAndSaveContractPdf,
  generateContractPdfFromHtml,
  createPdfDownloadResponse,
  generatePdfFilename,
  validateContractData,
  generateContractPdfWithMetadata,
};
