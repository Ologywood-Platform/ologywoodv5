import { emailService } from './emailService';
import {
  contractSentTemplate,
  signatureRequestTemplate,
  signatureReceivedTemplate,
  contractReminderTemplate,
} from './templates/contractNotificationEmails';

interface ContractNotificationData {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  senderRole?: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  eventTime?: string;
  contractUrl: string;
  signDeadline?: string;
  signerName?: string;
  signedAt?: string;
}

class ContractNotificationService {
  /**
   * Send contract sent notification
   */
  async sendContractSentNotification(data: ContractNotificationData): Promise<boolean> {
    try {
      const htmlContent = contractSentTemplate({
        recipientName: data.recipientName,
        senderName: data.senderName,
        senderRole: data.senderRole || 'Artist',
        artistName: data.artistName,
        venueName: data.venueName,
        eventDate: data.eventDate,
        eventTime: data.eventTime || '00:00',
        contractUrl: data.contractUrl,
        signDeadline: data.signDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      });

      const transporter = (emailService as any).transporter;
      if (!transporter) {
        console.warn('[ContractNotificationService] Email transporter not configured');
        return false;
      }

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@ologywood.com',
        to: data.recipientEmail,
        subject: `📋 Contract Ready for Signature - ${data.artistName} & ${data.venueName}`,
        html: htmlContent,
      });

      console.log(`[ContractNotificationService] Contract sent notification sent to ${data.recipientEmail}`);
      return true;
    } catch (error) {
      console.error('[ContractNotificationService] Error sending contract sent notification:', error);
      return false;
    }
  }

  /**
   * Send signature request notification
   */
  async sendSignatureRequestNotification(data: ContractNotificationData): Promise<boolean> {
    try {
      const htmlContent = signatureRequestTemplate({
        recipientName: data.recipientName,
        senderName: data.senderName,
        artistName: data.artistName,
        venueName: data.venueName,
        eventDate: data.eventDate,
        contractUrl: data.contractUrl,
        signDeadline: data.signDeadline || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      });

      const transporter = (emailService as any).transporter;
      if (!transporter) {
        console.warn('[ContractNotificationService] Email transporter not configured');
        return false;
      }

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@ologywood.com',
        to: data.recipientEmail,
        subject: `⚠️ Action Required: Sign Contract - ${data.artistName} & ${data.venueName}`,
        html: htmlContent,
      });

      console.log(`[ContractNotificationService] Signature request notification sent to ${data.recipientEmail}`);
      return true;
    } catch (error) {
      console.error('[ContractNotificationService] Error sending signature request notification:', error);
      return false;
    }
  }

  /**
   * Send signature received notification
   */
  async sendSignatureReceivedNotification(data: ContractNotificationData): Promise<boolean> {
    try {
      const htmlContent = signatureReceivedTemplate({
        recipientName: data.recipientName,
        signerName: data.signerName || data.senderName,
        signerRole: data.senderRole || 'Artist',
        artistName: data.artistName,
        venueName: data.venueName,
        eventDate: data.eventDate,
        signedAt: data.signedAt || new Date().toLocaleString(),
      });

      const transporter = (emailService as any).transporter;
      if (!transporter) {
        console.warn('[ContractNotificationService] Email transporter not configured');
        return false;
      }

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@ologywood.com',
        to: data.recipientEmail,
        subject: `✓ Contract Signed - ${data.artistName} & ${data.venueName}`,
        html: htmlContent,
      });

      console.log(`[ContractNotificationService] Signature received notification sent to ${data.recipientEmail}`);
      return true;
    } catch (error) {
      console.error('[ContractNotificationService] Error sending signature received notification:', error);
      return false;
    }
  }

  /**
   * Send contract reminder notification
   */
  async sendContractReminderNotification(data: ContractNotificationData & { daysUntilEvent: number }): Promise<boolean> {
    try {
      const htmlContent = contractReminderTemplate({
        recipientName: data.recipientName,
        artistName: data.artistName,
        venueName: data.venueName,
        eventDate: data.eventDate,
        daysUntilEvent: data.daysUntilEvent,
        contractUrl: data.contractUrl,
      });

      const transporter = (emailService as any).transporter;
      if (!transporter) {
        console.warn('[ContractNotificationService] Email transporter not configured');
        return false;
      }

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@ologywood.com',
        to: data.recipientEmail,
        subject: `📋 Contract Reminder - ${data.daysUntilEvent} days until event`,
        html: htmlContent,
      });

      console.log(`[ContractNotificationService] Contract reminder notification sent to ${data.recipientEmail}`);
      return true;
    } catch (error) {
      console.error('[ContractNotificationService] Error sending contract reminder notification:', error);
      return false;
    }
  }

  /**
   * Send contract notifications to both parties
   */
  async sendContractNotificationsToBothParties(data: {
    artistEmail: string;
    artistName: string;
    venueEmail: string;
    venueName: string;
    eventDate: string;
    eventTime: string;
    contractUrl: string;
    notificationType: 'sent' | 'reminder';
    daysUntilEvent?: number;
  }): Promise<{ artist: boolean; venue: boolean }> {
    try {
      let artistResult = false;
      let venueResult = false;

      if (data.notificationType === 'sent') {
        // Send to artist
        artistResult = await this.sendContractSentNotification({
          recipientEmail: data.artistEmail,
          recipientName: data.artistName,
          senderName: data.venueName,
          senderRole: 'Venue',
          artistName: data.artistName,
          venueName: data.venueName,
          eventDate: data.eventDate,
          eventTime: data.eventTime,
          contractUrl: data.contractUrl,
        });

        // Send to venue
        venueResult = await this.sendContractSentNotification({
          recipientEmail: data.venueEmail,
          recipientName: data.venueName,
          senderName: data.artistName,
          senderRole: 'Artist',
          artistName: data.artistName,
          venueName: data.venueName,
          eventDate: data.eventDate,
          eventTime: data.eventTime,
          contractUrl: data.contractUrl,
        });
      } else if (data.notificationType === 'reminder' && data.daysUntilEvent !== undefined) {
        // Send reminder to artist
        artistResult = await this.sendContractReminderNotification({
          recipientEmail: data.artistEmail,
          recipientName: data.artistName,
          senderName: data.venueName,
          artistName: data.artistName,
          venueName: data.venueName,
          eventDate: data.eventDate,
          contractUrl: data.contractUrl,
          daysUntilEvent: data.daysUntilEvent,
        });

        // Send reminder to venue
        venueResult = await this.sendContractReminderNotification({
          recipientEmail: data.venueEmail,
          recipientName: data.venueName,
          senderName: data.artistName,
          artistName: data.artistName,
          venueName: data.venueName,
          eventDate: data.eventDate,
          contractUrl: data.contractUrl,
          daysUntilEvent: data.daysUntilEvent,
        });
      }

      return { artist: artistResult, venue: venueResult };
    } catch (error) {
      console.error('[ContractNotificationService] Error sending notifications to both parties:', error);
      return { artist: false, venue: false };
    }
  }
}

export const contractNotificationService = new ContractNotificationService();
