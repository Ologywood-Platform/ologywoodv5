import { sendEmail } from "../email";

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
    const subject = `Support Ticket Created: ${data.ticketSubject}`;
    const html = `
      <h2>Your Support Ticket Has Been Created</h2>
      <p>Hi ${data.userName},</p>
      <p>Thank you for contacting Ologywood support. We've received your ticket and will review it shortly.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Ticket ID:</strong> #${data.ticketId}</p>
        <p><strong>Subject:</strong> ${data.ticketSubject}</p>
      </div>
      
      <p>You can track the status of your ticket by logging into your Ologywood account and visiting the Support section.</p>
      
      <p>Our support team typically responds within 24 hours during business days.</p>
      
      <p>Best regards,<br/>Ologywood Support Team</p>
    `;

    await sendEmail({
      to: data.userEmail,
      subject,
      html,
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
    const subject = data.isStaffResponse
      ? `Support Team Response: ${data.ticketSubject}`
      : `Your Response to Ticket #${data.ticketId}`;

    const html = `
      <h2>${data.isStaffResponse ? "Support Team Response" : "Response Added"}</h2>
      <p>Hi ${data.userName},</p>
      
      ${
        data.isStaffResponse
          ? `<p>Our support team has responded to your ticket:</p>`
          : `<p>Your response has been added to the ticket:</p>`
      }
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Ticket ID:</strong> #${data.ticketId}</p>
        <p><strong>Subject:</strong> ${data.ticketSubject}</p>
        <p><strong>From:</strong> ${data.responderName}</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
        <p>${data.responseMessage.replace(/\n/g, "<br/>")}</p>
      </div>
      
      <p>Log into your Ologywood account to view the full conversation and reply.</p>
      
      <p>Best regards,<br/>Ologywood Support Team</p>
    `;

    await sendEmail({
      to: data.userEmail,
      subject,
      html,
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
    const subject = `Ticket Resolved: ${data.ticketSubject}`;
    const html = `
      <h2>Your Support Ticket Has Been Resolved</h2>
      <p>Hi ${data.userName},</p>
      <p>Great news! Your support ticket has been marked as resolved.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Ticket ID:</strong> #${data.ticketId}</p>
        <p><strong>Subject:</strong> ${data.ticketSubject}</p>
        <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Resolved</span></p>
      </div>
      
      <p>If you have any further questions or concerns, please don't hesitate to create a new support ticket.</p>
      
      <p>We'd love to hear your feedback! If you have a moment, please let us know how we did by replying to this email.</p>
      
      <p>Thank you for using Ologywood!<br/>Support Team</p>
    `;

    await sendEmail({
      to: data.userEmail,
      subject,
      html,
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
