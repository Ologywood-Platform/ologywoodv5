import { sendEmail } from "../email";
import {
  getTicketCreatedTemplate,
  getTicketResponseTemplate,
  getTicketResolvedTemplate,
  getTicketAssignedTemplate,
} from "./email-templates";

export interface TicketNotificationData {
  ticketId: number;
  ticketSubject: string;
  userEmail: string;
  userName: string;
}

export interface TicketResponseNotificationData {
  ticketId: number;
  ticketSubject: string;
  userEmail: string;
  userName: string;
  responderName: string;
  responseMessage: string;
  isStaffResponse: boolean;
}

export interface TicketResolvedNotificationData {
  ticketId: number;
  ticketSubject: string;
  userEmail: string;
  userName: string;
}

/**
 * Send email notification when a new support ticket is created
 */
export async function sendTicketCreatedEmail(data: TicketNotificationData) {
  try {
    const ticketUrl = `${process.env.VITE_APP_URL || 'https://ologywood.com'}/support/${data.ticketId}`;
    const template = getTicketCreatedTemplate(
      data.ticketId,
      data.ticketSubject,
      data.userName,
      ticketUrl
    );

    await sendEmail({
      to: data.userEmail,
      subject: template.subject,
      html: template.html,
    });

    console.log(`✅ Ticket created email sent to ${data.userEmail}`);
  } catch (error) {
    console.error("Failed to send ticket created email:", error);
    throw error;
  }
}

/**
 * Send email notification when a response is added to a ticket
 */
export async function sendTicketResponseEmail(data: TicketResponseNotificationData) {
  try {
    const ticketUrl = `${process.env.VITE_APP_URL || 'https://ologywood.com'}/support/${data.ticketId}`;
    const template = getTicketResponseTemplate(
      data.ticketId,
      data.ticketSubject,
      data.userName,
      data.responseMessage,
      ticketUrl
    );

    await sendEmail({
      to: data.userEmail,
      subject: template.subject,
      html: template.html,
    });

    console.log(`✅ Ticket response email sent to ${data.userEmail}`);
  } catch (error) {
    console.error("Failed to send ticket response email:", error);
    throw error;
  }
}

/**
 * Send email notification when a ticket is resolved
 */
export async function sendTicketResolvedEmail(data: TicketResolvedNotificationData) {
  try {
    const ticketUrl = `${process.env.VITE_APP_URL || 'https://ologywood.com'}/support/${data.ticketId}`;
    const template = getTicketResolvedTemplate(
      data.ticketId,
      data.ticketSubject,
      data.userName,
      'Your ticket has been resolved by our support team.',
      ticketUrl
    );

    await sendEmail({
      to: data.userEmail,
      subject: template.subject,
      html: template.html,
    });

    console.log(`✅ Ticket resolved email sent to ${data.userEmail}`);
  } catch (error) {
    console.error("Failed to send ticket resolved email:", error);
    throw error;
  }
}

/**
 * Send email notification when a ticket is closed
 */
export async function sendTicketClosedEmail(data: TicketResolvedNotificationData) {
  try {
    const subject = `Ticket Closed: ${data.ticketSubject}`;
    const html = `
      <h2>Your Support Ticket Has Been Closed</h2>
      <p>Hi ${data.userName},</p>
      <p>Your support ticket has been closed. If you need to reopen it or have related questions, please create a new ticket.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Ticket ID:</strong> #${data.ticketId}</p>
        <p><strong>Subject:</strong> ${data.ticketSubject}</p>
        <p><strong>Status:</strong> <span style="color: #6c757d; font-weight: bold;">Closed</span></p>
      </div>
      
      <p>Thank you for using Ologywood support!<br/>Support Team</p>
    `;

    await sendEmail({
      to: data.userEmail,
      subject,
      html,
    });

    console.log(`✅ Ticket closed email sent to ${data.userEmail}`);
  } catch (error) {
    console.error("Failed to send ticket closed email:", error);
    throw error;
  }
}
