import sgMail from '@sendgrid/mail';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface NotificationPayload {
  type: 'booking_request' | 'message' | 'contract_update' | 'payment' | 'review';
  recipientEmail: string;
  recipientName: string;
  data: Record<string, any>;
}

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@ologywood.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export async function sendNotificationEmail(payload: NotificationPayload): Promise<boolean> {
  try {
    if (!SENDGRID_API_KEY) {
      console.warn('[Email] SendGrid API key not configured, skipping email');
      return false;
    }

    const template = getEmailTemplate(payload.type, payload.data);

    const msg = {
      to: payload.recipientEmail,
      from: SENDER_EMAIL,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    await sgMail.send(msg);
    console.log(`[Email] Notification sent to ${payload.recipientEmail}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send notification:', error);
    return false;
  }
}

function getEmailTemplate(type: string, data: Record<string, any>): EmailTemplate {
  switch (type) {
    case 'booking_request':
      return getBookingRequestTemplate(data);
    case 'message':
      return getMessageTemplate(data);
    case 'contract_update':
      return getContractUpdateTemplate(data);
    case 'payment':
      return getPaymentTemplate(data);
    case 'review':
      return getReviewTemplate(data);
    default:
      return getDefaultTemplate();
  }
}

function getBookingRequestTemplate(data: Record<string, any>): EmailTemplate {
  return {
    subject: `New Booking Request from ${data.venueName}`,
    text: `You have a new booking request from ${data.venueName} for ${data.eventDate}. 
    
Event Details:
- Date: ${data.eventDate}
- Venue: ${data.venueName}
- Location: ${data.location}
- Fee: $${data.fee}

Please log in to Ologywood to review and respond to this booking request.`,
    html: `
      <h2>New Booking Request</h2>
      <p>You have a new booking request from <strong>${data.venueName}</strong></p>
      
      <h3>Event Details</h3>
      <ul>
        <li><strong>Date:</strong> ${data.eventDate}</li>
        <li><strong>Venue:</strong> ${data.venueName}</li>
        <li><strong>Location:</strong> ${data.location}</li>
        <li><strong>Fee:</strong> $${data.fee}</li>
      </ul>
      
      <p><a href="${process.env.FRONTEND_URL}/bookings" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Booking Request
      </a></p>
    `,
  };
}

function getMessageTemplate(data: Record<string, any>): EmailTemplate {
  return {
    subject: `New Message from ${data.senderName}`,
    text: `You have a new message from ${data.senderName}:

"${data.messagePreview}"

Log in to Ologywood to view the full conversation.`,
    html: `
      <h2>New Message</h2>
      <p><strong>${data.senderName}</strong> sent you a message:</p>
      
      <blockquote style="border-left: 4px solid #007bff; padding-left: 15px; margin: 20px 0;">
        ${data.messagePreview}
      </blockquote>
      
      <p><a href="${process.env.FRONTEND_URL}/messages" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Message
      </a></p>
    `,
  };
}

function getContractUpdateTemplate(data: Record<string, any>): EmailTemplate {
  return {
    subject: `Contract Update: ${data.contractTitle}`,
    text: `There has been an update to your contract: ${data.contractTitle}

Status: ${data.status}

Log in to Ologywood to review the contract details.`,
    html: `
      <h2>Contract Update</h2>
      <p>There has been an update to your contract: <strong>${data.contractTitle}</strong></p>
      
      <p><strong>Status:</strong> ${data.status}</p>
      
      <p><a href="${process.env.FRONTEND_URL}/contracts/${data.contractId}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Contract
      </a></p>
    `,
  };
}

function getPaymentTemplate(data: Record<string, any>): EmailTemplate {
  return {
    subject: `Payment Received: $${data.amount}`,
    text: `You have received a payment of $${data.amount} for booking: ${data.bookingTitle}

Payment Date: ${data.paymentDate}
Transaction ID: ${data.transactionId}

Log in to Ologywood to view payment details.`,
    html: `
      <h2>Payment Received</h2>
      <p>You have received a payment of <strong>$${data.amount}</strong></p>
      
      <p><strong>Booking:</strong> ${data.bookingTitle}</p>
      <p><strong>Payment Date:</strong> ${data.paymentDate}</p>
      <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
      
      <p><a href="${process.env.FRONTEND_URL}/payments" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Payment Details
      </a></p>
    `,
  };
}

function getReviewTemplate(data: Record<string, any>): EmailTemplate {
  return {
    subject: `New Review from ${data.reviewerName}`,
    text: `You have received a new review from ${data.reviewerName}:

Rating: ${data.rating} stars
Review: ${data.reviewText}

Log in to Ologywood to view your reviews.`,
    html: `
      <h2>New Review</h2>
      <p><strong>${data.reviewerName}</strong> left you a review:</p>
      
      <p><strong>Rating:</strong> ${'⭐'.repeat(data.rating)}</p>
      
      <blockquote style="border-left: 4px solid #007bff; padding-left: 15px; margin: 20px 0;">
        ${data.reviewText}
      </blockquote>
      
      <p><a href="${process.env.FRONTEND_URL}/reviews" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View All Reviews
      </a></p>
    `,
  };
}

function getDefaultTemplate(): EmailTemplate {
  return {
    subject: 'Notification from Ologywood',
    text: 'You have a new notification. Log in to Ologywood to view details.',
    html: `
      <h2>Notification</h2>
      <p>You have a new notification from Ologywood.</p>
      
      <p><a href="${process.env.FRONTEND_URL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Notification
      </a></p>
    `,
  };
}

// Queue system for batch sending
const emailQueue: NotificationPayload[] = [];
let isProcessing = false;

export async function queueNotificationEmail(payload: NotificationPayload): Promise<void> {
  emailQueue.push(payload);
  processEmailQueue();
}

async function processEmailQueue(): Promise<void> {
  if (isProcessing || emailQueue.length === 0) return;

  isProcessing = true;

  while (emailQueue.length > 0) {
    const payload = emailQueue.shift();
    if (payload) {
      await sendNotificationEmail(payload);
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  isProcessing = false;
}

// Batch send emails
export async function sendBatchNotifications(payloads: NotificationPayload[]): Promise<number> {
  let successCount = 0;

  for (const payload of payloads) {
    const success = await sendNotificationEmail(payload);
    if (success) successCount++;
    // Add delay between sends
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return successCount;
}
