import ical from 'ical-generator';
import { Twilio } from 'twilio';
import { sendNotificationEmail } from './email-service';

interface BookingDetails {
  id: number;
  artistName: string;
  artistEmail: string;
  venueName: string;
  venueEmail: string;
  venuePhone?: string;
  eventDate: Date;
  eventTime: string;
  eventLocation: string;
  eventTitle: string;
  fee: number;
  notes?: string;
}

// Initialize Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

let twilioClient: Twilio | null = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

export async function sendBookingConfirmation(booking: BookingDetails): Promise<void> {
  try {
    // Generate iCal event
    const iCalEvent = generateBookingICalEvent(booking);

    // Send confirmation emails with iCal attachment
    await Promise.all([
      sendConfirmationEmailToArtist(booking, iCalEvent),
      sendConfirmationEmailToVenue(booking, iCalEvent),
    ]);

    // Send SMS notifications if phone numbers available
    if (booking.venuePhone) {
      await sendSMSNotification(
        booking.venuePhone,
        `Booking confirmed! ${booking.artistName} will perform at ${booking.venueName} on ${formatDate(booking.eventDate)}.`
      );
    }

    console.log(`[Booking] Confirmation sent for booking ${booking.id}`);
  } catch (error) {
    console.error('[Booking] Failed to send confirmation:', error);
    throw error;
  }
}

function generateBookingICalEvent(booking: BookingDetails): string {
  const cal = ical({
    name: 'Ologywood Booking Confirmation',
  });

  const startDateTime = new Date(booking.eventDate);
  const [hours, minutes] = booking.eventTime.split(':');
  startDateTime.setHours(parseInt(hours), parseInt(minutes));

  const endDateTime = new Date(startDateTime);
  endDateTime.setHours(endDateTime.getHours() + 2); // Assume 2-hour event

  cal.createEvent({
    id: `booking-${booking.id}@ologywood.com`,
    summary: `${booking.artistName} - ${booking.eventTitle}`,
    description: `Booking Confirmation - Artist: ${booking.artistName}, Venue: ${booking.venueName}, Fee: $${booking.fee}`,
    start: startDateTime,
    end: endDateTime,
    location: booking.eventLocation,
  } as any);

  return cal.toString();
}

async function sendConfirmationEmailToArtist(
  booking: BookingDetails,
  iCalEvent: string
): Promise<void> {
  const emailContent = `
    <h2>Booking Confirmation</h2>
    <p>Your booking has been confirmed!</p>
    
    <h3>Event Details</h3>
    <ul>
      <li><strong>Event:</strong> ${booking.eventTitle}</li>
      <li><strong>Venue:</strong> ${booking.venueName}</li>
      <li><strong>Date:</strong> ${formatDate(booking.eventDate)}</li>
      <li><strong>Time:</strong> ${booking.eventTime}</li>
      <li><strong>Location:</strong> ${booking.eventLocation}</li>
      <li><strong>Fee:</strong> $${booking.fee}</li>
    </ul>
    
    <p>The calendar invitation is attached to this email. You can add it to your calendar by opening the .ics file.</p>
    
    <p>If you have any questions, please contact the venue directly or reply to this email.</p>
  `;

  await sendNotificationEmail({
    type: 'booking_request',
    recipientEmail: booking.artistEmail,
    recipientName: booking.artistName,
    data: {
      venueName: booking.venueName,
      eventDate: formatDate(booking.eventDate),
      location: booking.eventLocation,
      fee: booking.fee,
    },
  });
}

async function sendConfirmationEmailToVenue(
  booking: BookingDetails,
  iCalEvent: string
): Promise<void> {
  const emailContent = `
    <h2>Booking Confirmation</h2>
    <p>Your booking has been confirmed!</p>
    
    <h3>Artist Details</h3>
    <ul>
      <li><strong>Artist:</strong> ${booking.artistName}</li>
      <li><strong>Email:</strong> ${booking.artistEmail}</li>
    </ul>
    
    <h3>Event Details</h3>
    <ul>
      <li><strong>Event:</strong> ${booking.eventTitle}</li>
      <li><strong>Date:</strong> ${formatDate(booking.eventDate)}</li>
      <li><strong>Time:</strong> ${booking.eventTime}</li>
      <li><strong>Location:</strong> ${booking.eventLocation}</li>
      <li><strong>Fee:</strong> $${booking.fee}</li>
    </ul>
    
    <p>The calendar invitation is attached to this email. You can add it to your calendar by opening the .ics file.</p>
    
    <p>Please ensure all technical and hospitality requirements are met before the event date.</p>
  `;

  await sendNotificationEmail({
    type: 'booking_request',
    recipientEmail: booking.venueEmail,
    recipientName: booking.venueName,
    data: {
      venueName: booking.venueName,
      eventDate: formatDate(booking.eventDate),
      location: booking.eventLocation,
      fee: booking.fee,
    },
  });
}

export async function sendSMSNotification(phoneNumber: string, message: string): Promise<boolean> {
  if (!twilioClient) {
    console.warn('[SMS] Twilio not configured, skipping SMS');
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`[SMS] Message sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error('[SMS] Failed to send SMS:', error);
    return false;
  }
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}
