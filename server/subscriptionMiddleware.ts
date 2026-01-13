import { TRPCError } from "@trpc/server";
import * as db from "./db";

/**
 * Check if an artist has an active subscription
 */
export async function checkArtistSubscription(userId: number): Promise<boolean> {
  const subscription = await db.getSubscriptionByUserId(userId);
  
  if (!subscription) {
    return false;
  }

  // Allow access if subscription is active or in trial period
  return subscription.status === 'active' || subscription.status === 'trialing';
}

/**
 * Middleware to require active subscription for artists
 * Use this in protected procedures that require subscription
 */
export async function requireSubscription(userId: number, userRole: string) {
  // Only check subscription for artists
  if (userRole !== 'artist') {
    return;
  }

  const hasSubscription = await checkArtistSubscription(userId);
  
  if (!hasSubscription) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Active subscription required. Please subscribe to access this feature.',
    });
  }
}
