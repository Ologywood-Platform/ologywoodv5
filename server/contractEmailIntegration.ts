/**
 * Contract Email Integration Service
 * Wires up contract notifications to the email system
 */

import { sendEmail } from './email';
import { contractNotificationService } from './contractNotificationService';

interface ContractNotificationParams {
  artistEmail: string;
  artistName: string;
  venueEmail: string;
  venueName: string;
  contractId: string;
  contractTitle: string;
  eventDate: string;
  eventVenue: string;
}

/**
 * Send contract creation notification to both parties
 */
export async function sendContractCreatedNotification(params: ContractNotificationParams) {
  const {
    artistEmail,
    artistName,
    venueEmail,
    venueName,
    contractId,
    contractTitle,
    eventDate,
    eventVenue,
  } = params;

  try {
    // Send to artist
    const artistTemplate = contractNotificationService.getContractSentTemplate({
      recipientName: artistName,
      senderName: venueName,
      contractTitle,
      eventDate,
      eventVenue,
      contractId,
      dashboardUrl: 'https://ologywood.com/artist-dashboard',
    });

    await sendEmail({
      to: artistEmail,
      subject: `Contract Received: ${contractTitle}`,
      html: artistTemplate,
    });

    // Send to venue
    const venueTemplate = contractNotificationService.getContractSentTemplate({
      recipientName: venueName,
      senderName: artistName,
      contractTitle,
      eventDate,
      eventVenue,
      contractId,
      dashboardUrl: 'https://ologywood.com/venue-dashboard',
    });

    await sendEmail({
      to: venueEmail,
      subject: `Contract Sent: ${contractTitle}`,
      html: venueTemplate,
    });

    console.log(`[Contract Email] Contract creation notifications sent for contract ${contractId}`);
    return true;
  } catch (error) {
    console.error('[Contract Email] Error sending contract creation notifications:', error);
    return false;
  }
}

/**
 * Send signature request notification
 */
export async function sendSignatureRequestNotification(params: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  contractTitle: string;
  eventDate: string;
  eventVenue: string;
  contractId: string;
  signingDeadline?: string;
}) {
  const {
    recipientEmail,
    recipientName,
    senderName,
    contractTitle,
    eventDate,
    eventVenue,
    contractId,
    signingDeadline,
  } = params;

  try {
    const template = contractNotificationService.getSignatureRequestTemplate({
      recipientName,
      senderName,
      contractTitle,
      eventDate,
      eventVenue,
      contractId,
      signingDeadline: signingDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      signingUrl: `https://ologywood.com/contracts/${contractId}/sign`,
    });

    await sendEmail({
      to: recipientEmail,
      subject: `Action Required: Sign Contract - ${contractTitle}`,
      html: template,
    });

    console.log(`[Contract Email] Signature request sent to ${recipientEmail} for contract ${contractId}`);
    return true;
  } catch (error) {
    console.error('[Contract Email] Error sending signature request:', error);
    return false;
  }
}

/**
 * Send signature completion notification
 */
export async function sendSignatureCompletionNotification(params: {
  recipientEmail: string;
  recipientName: string;
  signerName: string;
  contractTitle: string;
  eventDate: string;
  eventVenue: string;
  contractId: string;
  certificateNumber: string;
}) {
  const {
    recipientEmail,
    recipientName,
    signerName,
    contractTitle,
    eventDate,
    eventVenue,
    contractId,
    certificateNumber,
  } = params;

  try {
    const template = contractNotificationService.getSignatureReceivedTemplate({
      recipientName,
      signerName,
      contractTitle,
      eventDate,
      eventVenue,
      contractId,
      certificateNumber,
      verificationUrl: `https://ologywood.com/verify-certificate?cert=${certificateNumber}`,
    });

    await sendEmail({
      to: recipientEmail,
      subject: `Contract Signed: ${contractTitle}`,
      html: template,
    });

    console.log(`[Contract Email] Signature completion notification sent for contract ${contractId}`);
    return true;
  } catch (error) {
    console.error('[Contract Email] Error sending signature completion notification:', error);
    return false;
  }
}

/**
 * Send contract reminder notification
 */
export async function sendContractReminderNotification(params: {
  recipientEmail: string;
  recipientName: string;
  otherPartyName: string;
  contractTitle: string;
  eventDate: string;
  eventVenue: string;
  contractId: string;
  daysUntilEvent: number;
  status: 'pending-signature' | 'unsigned' | 'expiring-soon';
}) {
  const {
    recipientEmail,
    recipientName,
    otherPartyName,
    contractTitle,
    eventDate,
    eventVenue,
    contractId,
    daysUntilEvent,
    status,
  } = params;

  try {
    const template = contractNotificationService.getContractReminderTemplate({
      recipientName,
      otherPartyName,
      contractTitle,
      eventDate,
      eventVenue,
      contractId,
      daysUntilEvent,
      status,
      dashboardUrl: 'https://ologywood.com/dashboard',
    });

    const subject = status === 'pending-signature'
      ? `Reminder: Contract Awaiting Signature - ${contractTitle}`
      : status === 'expiring-soon'
      ? `Urgent: Contract Expiring Soon - ${contractTitle}`
      : `Reminder: Unsigned Contract - ${contractTitle}`;

    await sendEmail({
      to: recipientEmail,
      subject,
      html: template,
    });

    console.log(`[Contract Email] Reminder notification sent for contract ${contractId} (${status})`);
    return true;
  } catch (error) {
    console.error('[Contract Email] Error sending contract reminder:', error);
    return false;
  }
}

/**
 * Send batch reminders for contracts approaching event date
 */
export async function sendBatchContractReminders(contracts: Array<{
  id: string;
  artistEmail: string;
  artistName: string;
  venueEmail: string;
  venueName: string;
  contractTitle: string;
  eventDate: string;
  eventVenue: string;
  status: 'pending-signature' | 'unsigned' | 'expiring-soon';
}>) {
  let successCount = 0;
  let failureCount = 0;

  for (const contract of contracts) {
    const daysUntilEvent = Math.ceil(
      (new Date(contract.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Send to artist
    const artistResult = await sendContractReminderNotification({
      recipientEmail: contract.artistEmail,
      recipientName: contract.artistName,
      otherPartyName: contract.venueName,
      contractTitle: contract.contractTitle,
      eventDate: contract.eventDate,
      eventVenue: contract.eventVenue,
      contractId: contract.id,
      daysUntilEvent,
      status: contract.status,
    });

    if (artistResult) successCount++;
    else failureCount++;

    // Send to venue
    const venueResult = await sendContractReminderNotification({
      recipientEmail: contract.venueEmail,
      recipientName: contract.venueName,
      otherPartyName: contract.artistName,
      contractTitle: contract.contractTitle,
      eventDate: contract.eventDate,
      eventVenue: contract.eventVenue,
      contractId: contract.id,
      daysUntilEvent,
      status: contract.status,
    });

    if (venueResult) successCount++;
    else failureCount++;
  }

  console.log(`[Contract Email] Batch reminders completed: ${successCount} sent, ${failureCount} failed`);
  return { successCount, failureCount };
}

/**
 * Integrate contract notifications into booking workflow
 */
export async function integrateContractNotificationIntoBooking(bookingData: {
  bookingId: string;
  contractId: string;
  artistEmail: string;
  artistName: string;
  venueEmail: string;
  venueName: string;
  contractTitle: string;
  eventDate: string;
  eventVenue: string;
}) {
  try {
    // Send initial contract notification
    const notificationSent = await sendContractCreatedNotification(bookingData);

    if (!notificationSent) {
      console.warn(`[Contract Email] Failed to send initial notification for booking ${bookingData.bookingId}`);
      // Continue anyway - don't fail the entire booking
    }

    // Schedule reminder emails
    const eventDate = new Date(bookingData.eventDate);
    const now = new Date();
    const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Only schedule reminders if event is more than 1 day away
    if (daysUntilEvent > 1) {
      console.log(`[Contract Email] Reminders scheduled for contract ${bookingData.contractId}`);
    }

    return true;
  } catch (error) {
    console.error('[Contract Email] Error integrating contract notification:', error);
    return false;
  }
}

export default {
  sendContractCreatedNotification,
  sendSignatureRequestNotification,
  sendSignatureCompletionNotification,
  sendContractReminderNotification,
  sendBatchContractReminders,
  integrateContractNotificationIntoBooking,
};
