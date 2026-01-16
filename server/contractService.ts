import * as db from './db';
import fs from 'fs';
import path from 'path';

export interface ContractData {
  // Artist Info
  artistName: string;
  stageName?: string;
  artistEmail: string;
  artistPhone: string;
  artistGenre?: string;

  // Venue Info
  venueName: string;
  venueContactName: string;
  venueEmail: string;
  venuePhone: string;
  venueAddress: string;

  // Event Details
  eventDate: string;
  performanceTime: string;
  loadInTime?: string;
  eventDuration?: number;
  expectedAttendance?: number;
  venueCapacity?: number;

  // Compensation
  baseFee: number;
  travelReimbursement?: number;
  setupAllowance?: number;
  paymentMethod: string;
  paymentTerms: string;
  paymentDueDate?: string;

  // Technical Requirements
  paSystem?: string;
  microphoneCount?: string;
  monitorCount?: string;
  mixerType?: string;
  stageLighting?: string;
  spotlight?: string;
  stageDimensions?: string;
  stageHeight?: number;
  flooring?: string;
  powerOutlets?: string;
  wifiAccess?: string;

  // Recording & Streaming
  recordingPermission?: string;
  liveStreamingPermission?: string;
  videoRecordingPermission?: string;
  audioRecordingPermission?: string;

  // Hospitality
  dressingRoom?: string;
  dressingRoomAmenities?: string;
  mealsProvided?: string;
  beveragesProvided?: string;
  dietaryAccommodations?: string;
  alcoholPolicy?: string;
  parkingProvided?: string;
  parkingLocation?: string;

  // Performance Specs
  setLength?: number;
  intermission?: number;
  encorePolicy?: string;
  strictTiming?: string;
  backingTracks?: string;
  dressCode?: string;
  prohibitedContent?: string;

  // Special Requests
  artistSpecialRequests?: string;
  venueSpecialNotes?: string;
  additionalTerms?: string;

  // URLs
  dashboardUrl?: string;
  websiteUrl?: string;
  privacyUrl?: string;
  termsUrl?: string;
}

class ContractService {
  /**
   * Generate a contract from template with data
   */
  async generateContract(contractData: ContractData, format: 'html' | 'markdown' = 'html'): Promise<string> {
    try {
      const templatePath = path.join(
        __dirname,
        'templates',
        format === 'html' ? 'riderContractTemplate.html' : 'riderContractTemplate.md'
      );

      let template = fs.readFileSync(templatePath, 'utf-8');

      // Replace all placeholders with actual data
      Object.entries(contractData).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        const stringValue = value !== null && value !== undefined ? String(value) : '';
        template = template.replace(placeholder, stringValue);
      });

      // Add contract metadata
      const contractId = `CONTRACT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const generatedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      template = template.replace(/{{contractId}}/g, contractId);
      template = template.replace(/{{generatedDate}}/g, generatedDate);

      // Calculate total fee
      const totalFee =
        (contractData.baseFee || 0) +
        (contractData.travelReimbursement || 0) +
        (contractData.setupAllowance || 0);

      template = template.replace(/{{totalFee}}/g, totalFee.toFixed(2));

      return template;
    } catch (error) {
      console.error('[ContractService] Error generating contract:', error);
      throw new Error('Failed to generate contract');
    }
  }

  /**
   * Save a contract template for an artist
   */
  async saveContractTemplate(artistId: number, templateName: string, contractData: ContractData): Promise<number> {
    try {
      // This is a placeholder - actual implementation would use database
      console.log(`[ContractService] Contract template saved for artist ${artistId}`);
      return Math.floor(Math.random() * 10000);
    } catch (error) {
      console.error('[ContractService] Error saving contract template:', error);
      throw new Error('Failed to save contract template');
    }
  }

  /**
   * Get contract template for an artist
   */
  async getContractTemplate(artistId: number, templateId?: number) {
    try {
      // This is a placeholder - actual implementation would query database
      console.log(`[ContractService] Getting contract template for artist ${artistId}`);
      return null;
    } catch (error) {
      console.error('[ContractService] Error getting contract template:', error);
      throw new Error('Failed to get contract template');
    }
  }

  /**
   * List all contract templates for an artist
   */
  async listContractTemplates(artistId: number) {
    try {
      // This is a placeholder - actual implementation would query database
      console.log(`[ContractService] Listing contract templates for artist ${artistId}`);
      return [];
    } catch (error) {
      console.error('[ContractService] Error listing contract templates:', error);
      throw new Error('Failed to list contract templates');
    }
  }

  /**
   * Attach contract to a booking
   */
  async attachContractToBooking(bookingId: number, contractData: ContractData): Promise<void> {
    try {
      // This would update the booking with contract data
      const riderData = {
        technical: {
          paSystem: contractData.paSystem,
          microphoneCount: contractData.microphoneCount,
          monitorCount: contractData.monitorCount,
          mixerType: contractData.mixerType,
          stageLighting: contractData.stageLighting,
          spotlight: contractData.spotlight,
          stageDimensions: contractData.stageDimensions,
          stageHeight: contractData.stageHeight,
          flooring: contractData.flooring,
          powerOutlets: contractData.powerOutlets,
          wifiAccess: contractData.wifiAccess,
          recordingPermission: contractData.recordingPermission,
          liveStreamingPermission: contractData.liveStreamingPermission,
          videoRecordingPermission: contractData.videoRecordingPermission,
          audioRecordingPermission: contractData.audioRecordingPermission,
        },
        hospitality: {
          dressingRoom: contractData.dressingRoom,
          dressingRoomAmenities: contractData.dressingRoomAmenities,
          mealsProvided: contractData.mealsProvided,
          beveragesProvided: contractData.beveragesProvided,
          dietaryAccommodations: contractData.dietaryAccommodations,
          alcoholPolicy: contractData.alcoholPolicy,
          parkingProvided: contractData.parkingProvided,
          parkingLocation: contractData.parkingLocation,
          setLength: contractData.setLength,
          intermission: contractData.intermission,
          encorePolicy: contractData.encorePolicy,
          strictTiming: contractData.strictTiming,
          backingTracks: contractData.backingTracks,
          dressCode: contractData.dressCode,
        },
        financial: {
          baseFee: contractData.baseFee,
          travelReimbursement: contractData.travelReimbursement,
          setupAllowance: contractData.setupAllowance,
          paymentMethod: contractData.paymentMethod,
          paymentTerms: contractData.paymentTerms,
        },
      };

      // Update booking with contract data
      await db.updateBooking(bookingId, { riderData: riderData as any });
      console.log(`[ContractService] Contract attached to booking ${bookingId}`);
    } catch (error) {
      console.error('[ContractService] Error attaching contract to booking:', error);
      throw new Error('Failed to attach contract to booking');
    }
  }

  /**
   * Export contract as PDF (requires external service)
   */
  async exportContractAsPDF(contractHtml: string, filename: string): Promise<Buffer> {
    try {
      // This would typically use a service like puppeteer or wkhtmltopdf
      // For now, we'll return a placeholder
      console.log(`[ContractService] PDF export requested for: ${filename}`);
      throw new Error('PDF export requires external service configuration');
    } catch (error) {
      console.error('[ContractService] Error exporting contract as PDF:', error);
      throw error;
    }
  }

  /**
   * Create contract from booking details
   */
  async createContractFromBooking(bookingId: number): Promise<ContractData> {
    try {
      const bookingData = await db.getBookingById(bookingId);

      if (!bookingData) {
        throw new Error('Booking not found');
      }

      // Extract contract data from booking
      const eventDate = bookingData.eventDate instanceof Date 
        ? bookingData.eventDate.toISOString().split('T')[0]
        : String(bookingData.eventDate);

      const contractData: ContractData = {
        artistName: 'Artist Name',
        venueName: bookingData.venueName,
        venueContactName: 'Contact Name',
        venueEmail: 'venue@example.com',
        venuePhone: '(555) 123-4567',
        venueAddress: bookingData.venueAddress || '',
        artistEmail: 'artist@example.com',
        artistPhone: '(555) 987-6543',
        eventDate: eventDate,
        performanceTime: bookingData.eventTime || '20:00',
        baseFee: Number(bookingData.totalFee) || 0,
        paymentMethod: 'Bank Transfer',
        paymentTerms: '50% deposit, 50% due day of event',
      };

      return contractData;
    } catch (error) {
      console.error('[ContractService] Error creating contract from booking:', error);
      throw new Error('Failed to create contract from booking');
    }
  }
}

export const contractService = new ContractService();
