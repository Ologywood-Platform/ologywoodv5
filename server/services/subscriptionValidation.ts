import { getDb } from "../db";
import { users, riderTemplates, bookings } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export type SubscriptionTier = "free" | "basic" | "premium";

export interface SubscriptionLimits {
  maxProfiles: number;
  maxRiders: number;
  maxMonthlyBookings: number;
  maxTeamMembers: number;
  pdfExportsPerMonth: number;
  apiAccess: boolean;
  customBranding: boolean;
}

const tierLimits: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxProfiles: 1,
    maxRiders: 1,
    maxMonthlyBookings: 2,
    maxTeamMembers: 1,
    pdfExportsPerMonth: 1,
    apiAccess: false,
    customBranding: false,
  },
  basic: {
    maxProfiles: Infinity,
    maxRiders: 5,
    maxMonthlyBookings: 20,
    maxTeamMembers: 3,
    pdfExportsPerMonth: 10,
    apiAccess: true,
    customBranding: true,
  },
  premium: {
    maxProfiles: Infinity,
    maxRiders: Infinity,
    maxMonthlyBookings: Infinity,
    maxTeamMembers: Infinity,
    pdfExportsPerMonth: Infinity,
    apiAccess: true,
    customBranding: true,
  },
};

export class SubscriptionValidationService {
  /**
   * Get subscription tier for a user
   */
  static async getUserTier(userId: number): Promise<SubscriptionTier> {
    try {
      const db = await getDb();
      if (!db) return "free";

      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const user = result[0];
      // Default to free tier - subscriptionTier would be added in schema extension
      return (user ? "free" : "free") as SubscriptionTier;
    } catch (error) {
      return "free";
    }
  }

  /**
   * Get tier limits for a user
   */
  static async getUserLimits(userId: number): Promise<SubscriptionLimits> {
    const tier = await this.getUserTier(userId);
    return tierLimits[tier];
  }

  /**
   * Check if user can create a new rider template
   */
  static async canCreateRider(userId: number): Promise<{
    allowed: boolean;
    reason?: string;
    current: number;
    limit: number;
  }> {
    try {
      const tier = await this.getUserTier(userId);
      const limits = tierLimits[tier];
      const db = await getDb();

      if (!db) {
        return { allowed: true, current: 0, limit: limits.maxRiders };
      }

      const riderCount = await db
        .select()
        .from(riderTemplates)
        .where(eq(riderTemplates.artistId, userId));

      const current = riderCount.length;
      const limit = limits.maxRiders;

      if (current >= limit) {
        return {
          allowed: false,
          reason: `You have reached the maximum of ${limit} rider templates for your ${tier} plan.`,
          current,
          limit,
        };
      }

      return { allowed: true, current, limit };
    } catch (error) {
      return { allowed: true, current: 0, limit: Infinity };
    }
  }

  /**
   * Check if user can create a booking request
   */
  static async canCreateBooking(userId: number): Promise<{
    allowed: boolean;
    reason?: string;
    current: number;
    limit: number;
  }> {
    try {
      const tier = await this.getUserTier(userId);
      const limits = tierLimits[tier];
      const db = await getDb();

      if (!db) {
        return { allowed: true, current: 0, limit: limits.maxMonthlyBookings };
      }

      // Get current month's bookings
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthlyBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.venueId, userId),
            gte(bookings.createdAt, monthStart),
            lte(bookings.createdAt, monthEnd)
          )
        );

      const current = monthlyBookings.length;
      const limit = limits.maxMonthlyBookings;

      if (current >= limit) {
        return {
          allowed: false,
          reason: `You have reached the maximum of ${limit} booking requests for this month on your ${tier} plan.`,
          current,
          limit,
        };
      }

      return { allowed: true, current, limit };
    } catch (error) {
      return { allowed: true, current: 0, limit: Infinity };
    }
  }

  /**
   * Check if user can add team members
   */
  static async canAddTeamMember(userId: number): Promise<{
    allowed: boolean;
    reason?: string;
    current: number;
    limit: number;
  }> {
    try {
      const tier = await this.getUserTier(userId);
      const limits = tierLimits[tier];

      const current = 1; // Placeholder - would need actual team table
      const limit = limits.maxTeamMembers;

      if (current >= limit) {
        return {
          allowed: false,
          reason: `You have reached the maximum of ${limit} team members for your ${tier} plan.`,
          current,
          limit,
        };
      }

      return { allowed: true, current, limit };
    } catch (error) {
      return { allowed: true, current: 0, limit: Infinity };
    }
  }

  /**
   * Check if user can export PDF
   */
  static async canExportPDF(userId: number): Promise<{
    allowed: boolean;
    reason?: string;
    current: number;
    limit: number;
  }> {
    try {
      const tier = await this.getUserTier(userId);
      const limits = tierLimits[tier];

      const current = 0; // Placeholder - would need actual tracking
      const limit = limits.pdfExportsPerMonth;

      if (current >= limit) {
        return {
          allowed: false,
          reason: `You have reached the maximum of ${limit} PDF exports for this month on your ${tier} plan.`,
          current,
          limit,
        };
      }

      return { allowed: true, current, limit };
    } catch (error) {
      return { allowed: true, current: 0, limit: Infinity };
    }
  }

  /**
   * Check if user has API access
   */
  static async hasAPIAccess(userId: number): Promise<boolean> {
    try {
      const tier = await this.getUserTier(userId);
      return tierLimits[tier].apiAccess;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user can use custom branding
   */
  static async canUseCustomBranding(userId: number): Promise<boolean> {
    try {
      const tier = await this.getUserTier(userId);
      return tierLimits[tier].customBranding;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get usage statistics for user
   */
  static async getUserUsageStats(userId: number): Promise<{
    tier: SubscriptionTier;
    riders: { used: number; limit: number };
    bookings: { used: number; limit: number };
    teamMembers: { used: number; limit: number };
    pdfExports: { used: number; limit: number };
  }> {
    try {
      const tier = await this.getUserTier(userId);
      const limits = tierLimits[tier];
      const db = await getDb();

      let riderCount = 0;
      let bookingCount = 0;

      if (db) {
        const riders = await db
          .select()
          .from(riderTemplates)
          .where(eq(riderTemplates.artistId, userId));
        riderCount = riders.length;

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const bookingsList = await db
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.venueId, userId),
              gte(bookings.createdAt, monthStart),
              lte(bookings.createdAt, monthEnd)
            )
          );
        bookingCount = bookingsList.length;
      }

      return {
        tier,
        riders: {
          used: riderCount,
          limit: limits.maxRiders,
        },
        bookings: {
          used: bookingCount,
          limit: limits.maxMonthlyBookings,
        },
        teamMembers: {
          used: 1,
          limit: limits.maxTeamMembers,
        },
        pdfExports: {
          used: 0,
          limit: limits.pdfExportsPerMonth,
        },
      };
    } catch (error) {
      return {
        tier: "free",
        riders: { used: 0, limit: 1 },
        bookings: { used: 0, limit: 2 },
        teamMembers: { used: 1, limit: 1 },
        pdfExports: { used: 0, limit: 1 },
      };
    }
  }

  /**
   * Validate subscription tier change
   */
  static async validateTierChange(
    userId: number,
    newTier: SubscriptionTier
  ): Promise<{
    valid: boolean;
    warnings: string[];
  }> {
    try {
      const currentTier = await this.getUserTier(userId);
      const currentLimits = tierLimits[currentTier];
      const newLimits = tierLimits[newTier];
      const warnings: string[] = [];
      const db = await getDb();

      // Check if downgrading
      const tierHierarchy = { free: 0, basic: 1, premium: 2 };
      if (tierHierarchy[newTier] < tierHierarchy[currentTier]) {
        // Check for data that would be lost
        if (db) {
          const riderCount = await db
            .select()
            .from(riderTemplates)
            .where(eq(riderTemplates.artistId, userId));

          if (riderCount.length > newLimits.maxRiders) {
            warnings.push(
              `You have ${riderCount.length} rider templates but the ${newTier} plan only allows ${newLimits.maxRiders}. Excess riders will be archived.`
            );
          }
        }
      }

      return {
        valid: true,
        warnings,
      };
    } catch (error) {
      return {
        valid: true,
        warnings: [],
      };
    }
  }
}
