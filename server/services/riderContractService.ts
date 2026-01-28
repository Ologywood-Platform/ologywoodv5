import PDFDocument from 'pdfkit';

export interface RiderContractData {
  artistName: string;
  artistEmail: string;
  artistPhone?: string;
  venueName: string;
  venueAddress: string;
  eventDate: string;
  eventTime: string;
  eventDuration?: number;
  totalFee: number;
  depositAmount?: number;
  technical?: {
    soundSystem?: string;
    lightingSystem?: string;
    stage?: string;
    parking?: string;
    loadIn?: string;
    soundCheck?: string;
    additionalRequirements?: string[];
  };
  hospitality?: {
    greenRoom?: string;
    meals?: string;
    dressing?: string;
    parking?: string;
    accommodations?: string;
    additionalRequirements?: string[];
  };
  financial?: {
    paymentTerms?: string;
    cancellationPolicy?: string;
    insuranceRequired?: boolean;
    taxId?: string;
    additionalTerms?: string[];
  };
  specialRequests?: string;
  notes?: string;
}

export class RiderContractGenerator {
  /**
   * Generate a professional PDF rider contract
   */
  static generatePDF(contractData: RiderContractData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        this.addHeader(doc, contractData);

        // Event Details Section
        this.addSection(doc, 'Event Details');
        this.addEventDetails(doc, contractData);

        // Technical Requirements
        if (contractData.technical) {
          this.addSection(doc, 'Technical Requirements');
          this.addTechnicalRequirements(doc, contractData.technical);
        }

        // Hospitality Requirements
        if (contractData.hospitality) {
          this.addSection(doc, 'Hospitality Requirements');
          this.addHospitalityRequirements(doc, contractData.hospitality);
        }

        // Financial Terms
        if (contractData.financial) {
          this.addSection(doc, 'Financial Terms');
          this.addFinancialTerms(doc, contractData.financial, contractData.totalFee, contractData.depositAmount);
        }

        // Special Requests
        if (contractData.specialRequests) {
          this.addSection(doc, 'Special Requests');
          doc.fontSize(11).text(contractData.specialRequests, { align: 'left' });
          doc.moveDown();
        }

        // Notes
        if (contractData.notes) {
          this.addSection(doc, 'Additional Notes');
          doc.fontSize(11).text(contractData.notes, { align: 'left' });
          doc.moveDown();
        }

        // Signature Section
        this.addSignatureSection(doc, contractData);

        // Footer
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static addHeader(doc: any, contractData: RiderContractData): void {
    doc.fontSize(24).font('Helvetica-Bold').text('ARTIST RIDER CONTRACT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`${contractData.venueName}`, { align: 'center' });
    doc.fontSize(11).text(`${contractData.eventDate} at ${contractData.eventTime}`, { align: 'center' });
    doc.moveDown(1);

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
  }

  private static addSection(doc: any, title: string): void {
    doc.fontSize(14).font('Helvetica-Bold').text(title);
    doc.fontSize(11).font('Helvetica');
    doc.moveDown(0.3);
  }

  private static addEventDetails(doc: any, contractData: RiderContractData): void {
    const details = [
      [`Artist:`, contractData.artistName],
      [`Email:`, contractData.artistEmail],
      [`Phone:`, contractData.artistPhone || 'N/A'],
      [`Venue:`, contractData.venueName],
      [`Address:`, contractData.venueAddress],
      [`Event Date:`, contractData.eventDate],
      [`Event Time:`, contractData.eventTime],
      [`Duration:`, contractData.eventDuration ? `${contractData.eventDuration} minutes` : 'TBD'],
    ];

    this.addTable(doc, details);
    doc.moveDown();
  }

  private static addTechnicalRequirements(doc: any, technical: RiderContractData['technical']): void {
    if (technical?.soundSystem) {
      doc.fontSize(11).font('Helvetica-Bold').text('Sound System:');
      doc.fontSize(10).font('Helvetica').text(technical.soundSystem, { indent: 20 });
    }

    if (technical?.lightingSystem) {
      doc.fontSize(11).font('Helvetica-Bold').text('Lighting System:');
      doc.fontSize(10).font('Helvetica').text(technical.lightingSystem, { indent: 20 });
    }

    if (technical?.stage) {
      doc.fontSize(11).font('Helvetica-Bold').text('Stage Requirements:');
      doc.fontSize(10).font('Helvetica').text(technical.stage, { indent: 20 });
    }

    if (technical?.parking) {
      doc.fontSize(11).font('Helvetica-Bold').text('Parking:');
      doc.fontSize(10).font('Helvetica').text(technical.parking, { indent: 20 });
    }

    if (technical?.loadIn) {
      doc.fontSize(11).font('Helvetica-Bold').text('Load-In Time:');
      doc.fontSize(10).font('Helvetica').text(technical.loadIn, { indent: 20 });
    }

    if (technical?.soundCheck) {
      doc.fontSize(11).font('Helvetica-Bold').text('Sound Check:');
      doc.fontSize(10).font('Helvetica').text(technical.soundCheck, { indent: 20 });
    }

    if (technical?.additionalRequirements && technical.additionalRequirements.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').text('Additional Requirements:');
      technical.additionalRequirements.forEach((req) => {
        doc.fontSize(10).font('Helvetica').text(`• ${req}`, { indent: 20 });
      });
    }

    doc.moveDown();
  }

  private static addHospitalityRequirements(doc: any, hospitality: RiderContractData['hospitality']): void {
    if (hospitality?.greenRoom) {
      doc.fontSize(11).font('Helvetica-Bold').text('Green Room:');
      doc.fontSize(10).font('Helvetica').text(hospitality.greenRoom, { indent: 20 });
    }

    if (hospitality?.meals) {
      doc.fontSize(11).font('Helvetica-Bold').text('Meals:');
      doc.fontSize(10).font('Helvetica').text(hospitality.meals, { indent: 20 });
    }

    if (hospitality?.dressing) {
      doc.fontSize(11).font('Helvetica-Bold').text('Dressing Room:');
      doc.fontSize(10).font('Helvetica').text(hospitality.dressing, { indent: 20 });
    }

    if (hospitality?.parking) {
      doc.fontSize(11).font('Helvetica-Bold').text('Parking:');
      doc.fontSize(10).font('Helvetica').text(hospitality.parking, { indent: 20 });
    }

    if (hospitality?.accommodations) {
      doc.fontSize(11).font('Helvetica-Bold').text('Accommodations:');
      doc.fontSize(10).font('Helvetica').text(hospitality.accommodations, { indent: 20 });
    }

    if (hospitality?.additionalRequirements && hospitality.additionalRequirements.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').text('Additional Requirements:');
      hospitality.additionalRequirements.forEach((req) => {
        doc.fontSize(10).font('Helvetica').text(`• ${req}`, { indent: 20 });
      });
    }

    doc.moveDown();
  }

  private static addFinancialTerms(
    doc: any,
    financial: RiderContractData['financial'],
    totalFee: number,
    depositAmount?: number
  ): void {
    const details = [
      ['Total Fee:', `$${totalFee.toFixed(2)}`],
      ['Deposit Required:', depositAmount ? `$${depositAmount.toFixed(2)}` : 'None'],
      ['Balance Due:', depositAmount ? `$${(totalFee - depositAmount).toFixed(2)}` : `$${totalFee.toFixed(2)}`],
    ];

    this.addTable(doc, details);

    if (financial?.paymentTerms) {
      doc.fontSize(11).font('Helvetica-Bold').text('Payment Terms:');
      doc.fontSize(10).font('Helvetica').text(financial.paymentTerms, { indent: 20 });
    }

    if (financial?.cancellationPolicy) {
      doc.fontSize(11).font('Helvetica-Bold').text('Cancellation Policy:');
      doc.fontSize(10).font('Helvetica').text(financial.cancellationPolicy, { indent: 20 });
    }

    if (financial?.insuranceRequired) {
      doc.fontSize(11).font('Helvetica-Bold').text('Insurance:');
      doc.fontSize(10).font('Helvetica').text('Insurance required for this event', { indent: 20 });
    }

    if (financial?.taxId) {
      doc.fontSize(11).font('Helvetica-Bold').text('Tax ID:');
      doc.fontSize(10).font('Helvetica').text(financial.taxId, { indent: 20 });
    }

    if (financial?.additionalTerms && financial.additionalTerms.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').text('Additional Terms:');
      financial.additionalTerms.forEach((term) => {
        doc.fontSize(10).font('Helvetica').text(`• ${term}`, { indent: 20 });
      });
    }

    doc.moveDown();
  }

  private static addTable(doc: any, rows: any[]): void {
    const labelWidth = 150;
    const valueWidth = 350;

    rows.forEach(([label, value]: any[]) => {
      doc.fontSize(10).font('Helvetica-Bold').text(label, 50, doc.y, { width: labelWidth });
      doc.fontSize(10).font('Helvetica').text(value, 50 + labelWidth, doc.y - 12, { width: valueWidth });
      doc.moveDown(1);
    });
  }

  private static addSignatureSection(doc: any, contractData: RiderContractData): void {
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('Signatures');
    doc.moveDown(1);

    doc.fontSize(11).font('Helvetica').text(
      'By signing below, both parties agree to the terms and conditions outlined in this rider contract.'
    );
    doc.moveDown(2);

    // Artist signature
    doc.fontSize(11).font('Helvetica-Bold').text('Artist:');
    doc.moveTo(50, doc.y + 30).lineTo(250, doc.y + 30).stroke();
    doc.fontSize(10).font('Helvetica').text('Signature', 50, doc.y + 35);
    doc.moveDown(3);

    doc.fontSize(10).font('Helvetica').text(`${contractData.artistName}`, 50);
    doc.fontSize(10).font('Helvetica').text('Printed Name');
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica').text('_________________');
    doc.fontSize(10).font('Helvetica').text('Date');
    doc.moveDown(2);

    // Venue signature
    doc.fontSize(11).font('Helvetica-Bold').text('Venue Representative:');
    doc.moveTo(50, doc.y + 30).lineTo(250, doc.y + 30).stroke();
    doc.fontSize(10).font('Helvetica').text('Signature', 50, doc.y + 35);
    doc.moveDown(3);

    doc.fontSize(10).font('Helvetica').text(`${contractData.venueName}`);
    doc.fontSize(10).font('Helvetica').text('Organization Name');
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica').text('_________________');
    doc.fontSize(10).font('Helvetica').text('Date');
  }

  private static addFooter(doc: any): void {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 1; i <= pageCount; i++) {
      doc.switchToPage(i - 1);
      doc.fontSize(8).font('Helvetica').text(
        `Page ${i} of ${pageCount}`,
        50,
        doc.page.height - 30,
        { align: 'center' }
      );
    }
  }
}

/**
 * Generate a simple text version of the rider contract
 */
export function generateRiderContractText(contractData: RiderContractData): string {
  let text = `ARTIST RIDER CONTRACT\n`;
  text += `${'='.repeat(80)}\n\n`;

  text += `EVENT DETAILS\n`;
  text += `-`.repeat(80) + '\n';
  text += `Artist: ${contractData.artistName}\n`;
  text += `Email: ${contractData.artistEmail}\n`;
  if (contractData.artistPhone) text += `Phone: ${contractData.artistPhone}\n`;
  text += `Venue: ${contractData.venueName}\n`;
  text += `Address: ${contractData.venueAddress}\n`;
  text += `Date: ${contractData.eventDate}\n`;
  text += `Time: ${contractData.eventTime}\n`;
  if (contractData.eventDuration) text += `Duration: ${contractData.eventDuration} minutes\n`;
  text += '\n';

  if (contractData.technical) {
    text += `TECHNICAL REQUIREMENTS\n`;
    text += `-`.repeat(80) + '\n';
    if (contractData.technical.soundSystem) text += `Sound System: ${contractData.technical.soundSystem}\n`;
    if (contractData.technical.lightingSystem) text += `Lighting: ${contractData.technical.lightingSystem}\n`;
    if (contractData.technical.stage) text += `Stage: ${contractData.technical.stage}\n`;
    if (contractData.technical.parking) text += `Parking: ${contractData.technical.parking}\n`;
    if (contractData.technical.loadIn) text += `Load-In: ${contractData.technical.loadIn}\n`;
    if (contractData.technical.soundCheck) text += `Sound Check: ${contractData.technical.soundCheck}\n`;
    if (contractData.technical.additionalRequirements) {
      text += `Additional:\n`;
      contractData.technical.additionalRequirements.forEach((req) => {
        text += `  • ${req}\n`;
      });
    }
    text += '\n';
  }

  if (contractData.hospitality) {
    text += `HOSPITALITY REQUIREMENTS\n`;
    text += `-`.repeat(80) + '\n';
    if (contractData.hospitality.greenRoom) text += `Green Room: ${contractData.hospitality.greenRoom}\n`;
    if (contractData.hospitality.meals) text += `Meals: ${contractData.hospitality.meals}\n`;
    if (contractData.hospitality.dressing) text += `Dressing Room: ${contractData.hospitality.dressing}\n`;
    if (contractData.hospitality.parking) text += `Parking: ${contractData.hospitality.parking}\n`;
    if (contractData.hospitality.accommodations) text += `Accommodations: ${contractData.hospitality.accommodations}\n`;
    if (contractData.hospitality.additionalRequirements) {
      text += `Additional:\n`;
      contractData.hospitality.additionalRequirements.forEach((req) => {
        text += `  • ${req}\n`;
      });
    }
    text += '\n';
  }

  if (contractData.financial) {
    text += `FINANCIAL TERMS\n`;
    text += `-`.repeat(80) + '\n';
    text += `Total Fee: $${contractData.totalFee.toFixed(2)}\n`;
    if (contractData.depositAmount) {
      text += `Deposit: $${contractData.depositAmount.toFixed(2)}\n`;
      text += `Balance: $${(contractData.totalFee - contractData.depositAmount).toFixed(2)}\n`;
    }
    if (contractData.financial.paymentTerms) text += `Payment Terms: ${contractData.financial.paymentTerms}\n`;
    if (contractData.financial.cancellationPolicy) text += `Cancellation: ${contractData.financial.cancellationPolicy}\n`;
    if (contractData.financial.insuranceRequired) text += `Insurance Required: Yes\n`;
    if (contractData.financial.taxId) text += `Tax ID: ${contractData.financial.taxId}\n`;
    text += '\n';
  }

  if (contractData.specialRequests) {
    text += `SPECIAL REQUESTS\n`;
    text += `-`.repeat(80) + '\n';
    text += contractData.specialRequests + '\n\n';
  }

  if (contractData.notes) {
    text += `NOTES\n`;
    text += `-`.repeat(80) + '\n';
    text += contractData.notes + '\n\n';
  }

  return text;
}
