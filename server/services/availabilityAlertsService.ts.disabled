import { getDb } from "../db";
import { availability, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import * as email from "../email";

interface AvailabilityAlert {
  id: number;
  userId: number;
  artistId: number;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Subscribe user to availability alerts for an artist
 */
export async function subscribeToAvailabilityAlerts(
  userId: number,
  artistId: number
): Promise<AvailabilityAlert> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  // Check if already subscribed
  const existing = await database
    .select()
    .from(availability)
    .where(
      and(
        eq(availability.userId as any, userId),
        eq(availability.artistId as any, artistId)
      )
    );

  if (existing.length > 0) {
    throw new Error("Already subscribed to alerts for this artist");
  }

  // Create subscription
  const result = await database.insert(availability).values({
    userId,
    artistId,
    isActive: true,
    createdAt: new Date(),
  } as any);

  return {
    id: (result as any).insertId,
    userId,
    artistId,
    isActive: true,
    createdAt: new Date(),
  };
}

/**
 * Unsubscribe user from availability alerts
 */
export async function unsubscribeFromAvailabilityAlerts(
  userId: number,
  artistId: number
): Promise<void> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  await database
    .delete(availability)
    .where(
      and(
        eq(availability.userId as any, userId),
        eq(availability.artistId as any, artistId)
      )
    );
}

/**
 * Send availability alerts to all subscribed users
 */
export async function sendAvailabilityAlerts(artistId: number): Promise<void> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  // Get all users subscribed to this artist
  const subscribers = await database
    .select()
    .from(availability)
    .where(
      and(
        eq(availability.artistId as any, artistId),
        eq(availability.isActive as any, true)
      )
    );

  if (subscribers.length === 0) return;

  // Get artist details
  const artistProfiles = await database
    .select()
    .from(users)
    .where(eq(users.id, artistId));

  const artist = artistProfiles[0];
  if (!artist) return;

  // Send emails to all subscribers
  for (const subscriber of subscribers) {
    const subscriberUser = await database
      .select()
      .from(users)
      .where(eq(users.id, subscriber.userId as any));

    if (subscriberUser.length > 0) {
      const user = subscriberUser[0];
      
      // Send email notification
      await email.send({
        to: user.email,
        subject: `${artist.name} just added new availability!`,
        html: `
          <h2>Great News! 🎉</h2>
          <p><strong>${artist.name}</strong> just added new available dates for bookings.</p>
          <p>Check out their availability and book them now before the dates fill up!</p>
          <a href="${process.env.FRONTEND_URL}/artist/${artistId}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Availability
          </a>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            You're receiving this because you subscribed to availability alerts for ${artist.name}.
            <a href="${process.env.FRONTEND_URL}/settings/alerts">Manage your alerts</a>
          </p>
        `,
      });
    }
  }
}

/**
 * Get all active subscriptions for a user
 */
export async function getUserAlertSubscriptions(userId: number): Promise<AvailabilityAlert[]> {
  const database = await getDb();
  if (!database) return [];

  const subscriptions = await database
    .select()
    .from(availability)
    .where(
      and(
        eq(availability.userId as any, userId),
        eq(availability.isActive as any, true)
      )
    );

  return subscriptions.map((sub) => ({
    id: sub.id,
    userId: sub.userId as any,
    artistId: sub.artistId as any,
    isActive: sub.isActive as any,
    createdAt: sub.createdAt as any,
  }));
}

/**
 * Get subscriber count for an artist
 */
export async function getArtistSubscriberCount(artistId: number): Promise<number> {
  const database = await getDb();
  if (!database) return 0;

  const subscribers = await database
    .select()
    .from(availability)
    .where(
      and(
        eq(availability.artistId as any, artistId),
        eq(availability.isActive as any, true)
      )
    );

  return subscribers.length;
}
