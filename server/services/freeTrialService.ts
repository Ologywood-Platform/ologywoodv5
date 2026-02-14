import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const MAX_BETA_USERS = 20;
const TRIAL_DURATION_MS = 3 * 30 * 24 * 60 * 60 * 1000; // 3 months in milliseconds

// In-memory counter for beta user IDs (in production, this would be in database)
let betaUserCounter = 0;

export class FreeTrialService {
  /**
   * Assign free trial to a new user if they're within the first 20
   */
  static async assignFreeTrialIfEligible(userId: number): Promise<{
    isTrialUser: boolean;
    tier: "free" | "basic" | "premium";
    trialEndDate?: Date;
  }> {
    try {
      betaUserCounter++;

      if (betaUserCounter <= MAX_BETA_USERS) {
        // This user gets the free trial
        const trialEndDate = new Date(Date.now() + TRIAL_DURATION_MS);

        // Store in user metadata or a separate table (for now, we'll use a simple approach)
        // In production, you'd want to persist this to database
        return {
          isTrialUser: true,
          tier: "premium", // Give premium tier during trial
          trialEndDate,
        };
      }

      // User is beyond the first 20, gets free tier
      return {
        isTrialUser: false,
        tier: "free",
      };
    } catch (error) {
      console.error("Error assigning free trial:", error);
      return {
        isTrialUser: false,
        tier: "free",
      };
    }
  }

  /**
   * Check if a user is currently on a free trial
   */
  static async getUserTrialStatus(userId: number): Promise<{
    isActive: boolean;
    daysRemaining?: number;
    tier: "free" | "basic" | "premium";
  }> {
    try {
      const db = await getDb();
      if (!db) {
        return { isActive: false, tier: "free" };
      }

      // Get user from database
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!userResult || userResult.length === 0) {
        return { isActive: false, tier: "free" };
      }

      const user = userResult[0];

      // Check if user was created within the first 20 signups
      // This is a simple heuristic based on user ID
      if (user.id <= MAX_BETA_USERS) {
        const createdAt = user.createdAt || new Date();
        const trialEndDate = new Date(
          createdAt.getTime() + TRIAL_DURATION_MS
        );
        const now = new Date();

        if (now < trialEndDate) {
          const daysRemaining = Math.ceil(
            (trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
          );
          return {
            isActive: true,
            daysRemaining: Math.max(0, daysRemaining),
            tier: "premium",
          };
        }
      }

      return {
        isActive: false,
        tier: "free",
      };
    } catch (error) {
      console.error("Error checking trial status:", error);
      return { isActive: false, tier: "free" };
    }
  }

  /**
   * Get user's current subscription tier
   */
  static async getUserTier(userId: number): Promise<"free" | "basic" | "premium"> {
    const trialStatus = await this.getUserTrialStatus(userId);
    if (trialStatus.isActive) {
      return trialStatus.tier;
    }
    return "free"; // Default to free tier
  }
}
