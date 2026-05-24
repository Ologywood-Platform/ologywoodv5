/**
 * Notification Service
 * 
 * Centralized helper to create in-app notifications for business events.
 * Each function is fire-and-forget safe — errors are caught and logged,
 * never thrown, so they won't break the calling flow.
 */
import * as db from "../db";

type NotificationType = "booking" | "message" | "payment" | "contract" | "review";

// ============= CORE =============

async function notify(
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  actionUrl?: string
): Promise<void> {
  try {
    // Check user preferences before creating notification
    const prefs = await db.getNotificationPreferences(userId);
    if (prefs) {
      if (type === "booking" && !prefs.bookingNotifications) return;
      if (type === "message" && !prefs.messageNotifications) return;
      if (type === "review" && !prefs.reviewNotifications) return;
      if (type === "contract" && !prefs.riderNotifications) return;
    }
    await db.createNotification({ userId, type, title, message, actionUrl });
  } catch (err) {
    console.error(`[NotificationService] Failed to create notification for user ${userId}:`, err);
  }
}

// ============= BOOKING NOTIFICATIONS =============

export async function notifyBookingRequest(params: {
  artistUserId: number;
  venueName: string;
  bookingId: number;
  eventDate?: string;
}): Promise<void> {
  const dateStr = params.eventDate ? ` on ${params.eventDate}` : "";
  await notify(
    params.artistUserId,
    "booking",
    "New Booking Request",
    `${params.venueName} sent you a booking request${dateStr}.`,
    `/booking/${params.bookingId}`
  );
}

export async function notifyBookingConfirmed(params: {
  recipientUserId: number;
  otherPartyName: string;
  bookingId: number;
}): Promise<void> {
  await notify(
    params.recipientUserId,
    "booking",
    "Booking Confirmed",
    `Your booking with ${params.otherPartyName} has been confirmed.`,
    `/booking/${params.bookingId}`
  );
}

export async function notifyBookingCancelled(params: {
  recipientUserId: number;
  otherPartyName: string;
  bookingId: number;
  cancelledBy: string;
}): Promise<void> {
  await notify(
    params.recipientUserId,
    "booking",
    "Booking Cancelled",
    `${params.cancelledBy} cancelled the booking with ${params.otherPartyName}.`,
    `/booking/${params.bookingId}`
  );
}

export async function notifyBookingStatusChange(params: {
  recipientUserId: number;
  bookingId: number;
  newStatus: string;
  otherPartyName: string;
}): Promise<void> {
  const statusLabels: Record<string, string> = {
    confirmed: "confirmed",
    declined: "declined",
    completed: "marked as completed",
    pending: "set to pending",
  };
  const label = statusLabels[params.newStatus] || params.newStatus;
  await notify(
    params.recipientUserId,
    "booking",
    "Booking Updated",
    `Your booking with ${params.otherPartyName} has been ${label}.`,
    `/booking/${params.bookingId}`
  );
}

// ============= MESSAGE NOTIFICATIONS =============

export async function notifyNewMessage(params: {
  recipientUserId: number;
  senderName: string;
  preview: string;
  bookingId?: number;
}): Promise<void> {
  const truncated = params.preview.length > 80 ? params.preview.slice(0, 80) + "..." : params.preview;
  const url = params.bookingId ? `/messages/${params.bookingId}` : "/messages";
  await notify(
    params.recipientUserId,
    "message",
    `New Message from ${params.senderName}`,
    truncated,
    url
  );
}

// ============= CONTRACT NOTIFICATIONS =============

export async function notifyContractReadyToSign(params: {
  recipientUserId: number;
  otherPartyName: string;
  bookingId: number;
}): Promise<void> {
  await notify(
    params.recipientUserId,
    "contract",
    "Contract Ready to Sign",
    `${params.otherPartyName} has signed the rider contract. Please review and countersign.`,
    `/booking/${params.bookingId}`
  );
}

export async function notifyContractFullySigned(params: {
  recipientUserId: number;
  bookingId: number;
}): Promise<void> {
  await notify(
    params.recipientUserId,
    "contract",
    "Contract Fully Signed",
    "Both parties have signed the rider contract. The agreement is now in effect.",
    `/booking/${params.bookingId}`
  );
}

// ============= PAYMENT NOTIFICATIONS =============

export async function notifyPaymentReceived(params: {
  artistUserId: number;
  amount: string;
  venueName: string;
  bookingId: number;
}): Promise<void> {
  await notify(
    params.artistUserId,
    "payment",
    "Payment Received",
    `${params.venueName} paid ${params.amount} for your booking.`,
    `/booking/${params.bookingId}`
  );
}

export async function notifyPaymentSent(params: {
  venueUserId: number;
  amount: string;
  artistName: string;
  bookingId: number;
}): Promise<void> {
  await notify(
    params.venueUserId,
    "payment",
    "Payment Confirmed",
    `Your payment of ${params.amount} to ${params.artistName} has been processed.`,
    `/booking/${params.bookingId}`
  );
}

export async function notifyRefundIssued(params: {
  recipientUserId: number;
  amount: string;
  bookingId: number;
}): Promise<void> {
  await notify(
    params.recipientUserId,
    "payment",
    "Refund Issued",
    `A refund of ${params.amount} has been issued for your booking.`,
    `/booking/${params.bookingId}`
  );
}

// ============= REVIEW NOTIFICATIONS =============

export async function notifyNewReview(params: {
  recipientUserId: number;
  reviewerName: string;
  rating: number;
  bookingId?: number;
}): Promise<void> {
  const stars = "★".repeat(params.rating) + "☆".repeat(5 - params.rating);
  await notify(
    params.recipientUserId,
    "review",
    "New Review",
    `${params.reviewerName} left you a ${stars} review.`,
    params.bookingId ? `/booking/${params.bookingId}` : undefined
  );
}

export async function notifyReviewResponse(params: {
  recipientUserId: number;
  responderName: string;
}): Promise<void> {
  await notify(
    params.recipientUserId,
    "review",
    "Review Response",
    `${params.responderName} responded to your review.`
  );
}

// ============= FOLLOW NOTIFICATIONS =============

export async function notifyNewFollower(params: {
  artistUserId: number;
  followerName: string;
}): Promise<void> {
  await notify(
    params.artistUserId,
    "booking", // reuse booking type since there's no "social" type
    "New Follower",
    `${params.followerName} started following you.`
  );
}

// ============= VENUE CONTRACT NOTIFICATIONS =============

export async function notifyVenueContractSent(params: {
  artistUserId: number;
  venueName: string;
  contractTitle: string;
  bookingId: number;
}): Promise<void> {
  await notify(
    params.artistUserId,
    "contract",
    "New Venue Contract to Review",
    `${params.venueName} sent you a venue agreement: "${params.contractTitle}". Please review and sign.`,
    `/booking/${params.bookingId}`
  );
}

export async function notifyVenueContractSigned(params: {
  venueUserId: number;
  artistName: string;
  contractTitle: string;
  bookingId: number;
}): Promise<void> {
  await notify(
    params.venueUserId,
    "contract",
    "Venue Contract Signed",
    `${params.artistName} signed your venue agreement: "${params.contractTitle}".`,
    `/booking/${params.bookingId}`
  );
}

export async function notifyVenueContractDeclined(params: {
  venueUserId: number;
  artistName: string;
  contractTitle: string;
  bookingId: number;
}): Promise<void> {
  await notify(
    params.venueUserId,
    "contract",
    "Venue Contract Declined",
    `${params.artistName} declined your venue agreement: "${params.contractTitle}". You may want to discuss terms.`,
    `/booking/${params.bookingId}`
  );
}

export async function notifyVenueContractFullySigned(params: {
  recipientUserId: number;
  contractTitle: string;
  bookingId: number;
}): Promise<void> {
  await notify(
    params.recipientUserId,
    "contract",
    "Venue Agreement Fully Executed",
    `The venue agreement "${params.contractTitle}" has been signed by both parties and is now in effect.`,
    `/booking/${params.bookingId}`
  );
}

export async function notifyVenueContractExpiring(params: {
  artistUserId: number;
  venueName: string;
  contractTitle: string;
  bookingId: number;
  hoursRemaining: number;
}): Promise<void> {
  await notify(
    params.artistUserId,
    "contract",
    "Contract Expiring Soon",
    `The venue agreement "${params.contractTitle}" from ${params.venueName} expires in ${params.hoursRemaining} hours. Please review and sign.`,
    `/booking/${params.bookingId}`
  );
}

// ============= PERFORMANCE REQUEST NOTIFICATIONS =============

export async function notifyPerformanceRequest(params: {
  venueUserId: number;
  artistName: string;
  eventName: string;
  eventDate: string;
  actionUrl?: string;
}): Promise<void> {
  await notify(
    params.venueUserId,
    "booking",
    "Performance Request",
    `${params.artistName} wants to perform at your venue — "${params.eventName}" on ${params.eventDate}`,
    params.actionUrl || "/dashboard"
  );
}
