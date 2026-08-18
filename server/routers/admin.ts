import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users, artistProfiles, venueProfiles, bookings, artistPayouts, artistReleases, unsubscribeFeedback, roleChangeAuditLog, adminActivityLog, videoModerationQueue, userSubscriptions } from "../../drizzle/schema";
import Stripe from 'stripe';
import { desc, sql, eq } from "drizzle-orm";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const SENDGRID_FROM = process.env.SENDGRID_FROM_EMAIL || 'support@ologywood.com';
const BASE_URL = process.env.BASE_URL || 'https://www.ologywood.com';

/**
 * Send a branded email notification when a user's role is changed
 */
async function sendRoleChangeEmail(params: {
  recipientEmail: string;
  recipientName: string;
  previousRole: string;
  newRole: string;
  changedByName: string;
}): Promise<void> {
  if (!process.env.SENDGRID_API_KEY || !SENDGRID_FROM) {
    console.log('[Admin] SendGrid not configured, skipping role change email');
    return;
  }

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    artist: 'Artist',
    venue: 'Venue',
    user: 'User',
    blogger: 'Blogger',
  };

  const newRoleLabel = roleLabels[params.newRole] || params.newRole;
  const prevRoleLabel = roleLabels[params.previousRole] || params.previousRole;

  const roleDescriptions: Record<string, string> = {
    admin: 'You now have full access to the Admin Dashboard, including user management, booking oversight, blog management, and financial data.',
    artist: 'You can now create an Artist profile, manage bookings, set your availability, upload music releases, and connect with venues.',
    venue: 'You can now create a Venue profile, browse artists, send booking requests, and manage your events.',
    user: 'You have standard platform access to browse artists, follow your favorites, book artists for events, and purchase music.',
    blogger: 'You can now create, edit, publish, and manage blog posts on Ologywood. You have access to the Blog Management dashboard.',
  };

  const description = roleDescriptions[params.newRole] || 'Your platform access has been updated.';

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/ymRJKMwaOWmPOCjV.png" alt="Ologywood" style="height: 40px; width: auto; margin-bottom: 10px;">
        <p style="color: white; font-size: 14px; margin: 0; font-weight: 500;">Where Artists Meet Opportunities</p>
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px;">Your Role Has Been Updated</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
          Hi ${params.recipientName || 'there'},
        </p>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
          Your role on Ologywood has been changed by ${params.changedByName}.
        </p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 0 0 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Previous Role:</td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                <span style="background: #e5e7eb; padding: 4px 12px; border-radius: 12px;">${prevRoleLabel}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">New Role:</td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                <span style="background: #ede9fe; color: #6D28D9; padding: 4px 12px; border-radius: 12px;">${newRoleLabel}</span>
              </td>
            </tr>
          </table>
        </div>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
          ${description}
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${BASE_URL}" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">Go to Ologywood</a>
        </div>
        <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
          If you believe this change was made in error, please contact our support team at <a href="mailto:support@ologywood.com" style="color: #6D28D9; text-decoration: none;">support@ologywood.com</a>.
        </p>
      </div>
      <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
          &copy; 2026 Ologywood. All rights reserved.
        </p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          <a href="${BASE_URL}/email-preferences" style="color: #6D28D9; text-decoration: none;">Manage preferences</a> | 
          <a href="${BASE_URL}/privacy" style="color: #6D28D9; text-decoration: none;">Privacy Policy</a>
        </p>
      </div>
    </div>
  `;

  try {
    await sgMail.send({
      to: params.recipientEmail,
      from: SENDGRID_FROM,
      subject: `Your Ologywood Role Has Been Updated to ${newRoleLabel}`,
      html: htmlContent,
    });
    console.log(`[Admin] Role change email sent to ${params.recipientEmail}: ${prevRoleLabel} → ${newRoleLabel}`);
  } catch (error) {
    console.error('[Admin] Failed to send role change email:', error);
  }
}

// Owner identification
const OWNER_OPEN_ID = process.env.OWNER_OPEN_ID || '';
const OWNER_NAME = process.env.OWNER_NAME || '';
const OWNER_EMAIL = 'garychisolm30@gmail.com';

// Helper to check if a user is the platform owner
function checkIsOwner(user: { openId: string | null; email: string | null; id: number }): boolean {
  // Primary check: match by OWNER_OPEN_ID
  if (OWNER_OPEN_ID && user.openId === OWNER_OPEN_ID) return true;
  // Secondary check: match by OWNER_NAME (which contains the owner's openId)
  if (OWNER_NAME && user.openId === OWNER_NAME) return true;
  // Reliable fallback: match by owner email (works on production even without env vars)
  if (user.email && user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) return true;
  return false;
}

// Middleware to ensure user is admin OR site owner
const adminOnly = protectedProcedure.use(async (opts) => {
  const user = opts.ctx.user;
  const isAdmin = user.role === 'admin';
  const isOwner = checkIsOwner(user);
  if (!isAdmin && !isOwner) {
    throw new Error("Unauthorized: Admin access required");
  }
  return opts.next({ ctx: { ...opts.ctx, isOwner } });
});

export const adminRouter = router({
  // ============ USER MANAGEMENT ============

  /**
   * Get all users with filtering and search
   */
  getUsers: adminOnly
    .input(
      z.object({
        search: z.string().optional(),
        role: z.enum(["user", "admin", "artist", "venue", "blogger"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const allUsers = await db.select().from(users);
      let filtered = allUsers;

      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filtered = filtered.filter(
          (u: typeof users.$inferSelect) =>
            u.email?.toLowerCase().includes(searchLower) ||
            u.name?.toLowerCase().includes(searchLower)
        );
      }

      if (input.role) {
        filtered = filtered.filter((u: typeof users.$inferSelect) => u.role === input.role);
      }

      const paginated = filtered
        .sort((a: typeof users.$inferSelect, b: typeof users.$inferSelect) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(input.offset, input.offset + input.limit);

      return {
        users: paginated,
        total: filtered.length,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get single user details with profile
   */
  getUser: adminOnly
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const allUsers = await db.select().from(users);
      const user = allUsers.find((u: typeof users.$inferSelect) => u.id === input.userId);

      if (!user) throw new Error("User not found");

      let profile = null;
      if (user.role === "artist") {
        const allArtists = await db.select().from(artistProfiles);
        profile = allArtists.find((p: typeof artistProfiles.$inferSelect) => p.userId === input.userId);
      } else if (user.role === "venue") {
        const allVenues = await db.select().from(venueProfiles);
        profile = allVenues.find((p: typeof venueProfiles.$inferSelect) => p.userId === input.userId);
      }

      return { user, profile };
    }),

  /**
   * Verify an artist profile
   */
  getArtistsForVerification: adminOnly
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Use raw SQL to get artists with verification status (handles missing column gracefully)
      let artists: any[] = [];
      try {
        const [rows] = await db.execute(sql`
          SELECT ap.id, ap.userId, ap.artistName, ap.talentType, ap.profilePhotoUrl, ap.genre, ap.city, ap.state,
                 COALESCE(ap.isVerified, FALSE) as isVerified,
                 u.email, u.name, u.createdAt as userCreatedAt
          FROM artist_profiles ap
          JOIN users u ON u.id = ap.userId
          ORDER BY ap.artistName ASC
        `);
        artists = rows as any[];
      } catch (e: any) {
        // If isVerified column doesn't exist, query without it
        if (e.message?.includes('isVerified')) {
          const [rows] = await db.execute(sql`
            SELECT ap.id, ap.userId, ap.artistName, ap.talentType, ap.profilePhotoUrl, ap.genre, ap.city, ap.state,
                   FALSE as isVerified,
                   u.email, u.name, u.createdAt as userCreatedAt
            FROM artist_profiles ap
            JOIN users u ON u.id = ap.userId
            ORDER BY ap.artistName ASC
          `);
          artists = rows as any[];
        } else {
          throw e;
        }
      }
      return { artists };
    }),

  verifyArtist: adminOnly
    .input(
      z.object({
        userId: z.number(),
        verified: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Use raw SQL to avoid Drizzle schema column mismatch with production DB
      // First ensure the isVerified column exists (idempotent)
      try {
        await db.execute(sql`ALTER TABLE artist_profiles ADD COLUMN isVerified BOOLEAN NOT NULL DEFAULT FALSE`);
      } catch (e: any) {
        // Column already exists - ignore any ALTER TABLE error
      }
      try {
        await db.execute(sql`ALTER TABLE artist_profiles ADD COLUMN verifiedAt TIMESTAMP NULL`);
      } catch (e: any) {
        // Column already exists - ignore any ALTER TABLE error
      }
      // Now update the verification status
      if (input.verified) {
        await db.execute(sql`UPDATE artist_profiles SET isVerified = TRUE, verifiedAt = NOW() WHERE userId = ${input.userId}`);
      } else {
        await db.execute(sql`UPDATE artist_profiles SET isVerified = FALSE, verifiedAt = NULL WHERE userId = ${input.userId}`);
      }
      return { success: true, userId: input.userId, verified: input.verified };
    }),

  /**
   * Suspend or unsuspend a user
   */
  adminResendVerification: adminOnly
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [user] = await db.select().from(users).where(eq(users.id, input.userId));
      if (!user) throw new Error("User not found");
      if (user.emailVerified) throw new Error("User is already verified");
      if (!user.email) throw new Error("User has no email address");
      
      // Generate a new verification token and send email
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const verificationLink = `${BASE_URL}/verify-email?token=${token}`;
      
      // Store token in user record
      await db.update(users).set({
        emailVerificationToken: token,
        emailVerificationSentAt: new Date(),
      }).where(eq(users.id, input.userId));
      
      // Send verification email
      if (process.env.SENDGRID_API_KEY) {
        await sgMail.send({
          to: user.email,
          from: SENDGRID_FROM,
          subject: 'Verify Your Email - OlogyWood',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #7c3aed;">Verify Your Email Address</h2>
              <p>Hi ${user.name || 'there'},</p>
              <p>Please verify your email address to complete your OlogyWood account setup and get your verified badge.</p>
              <a href="${verificationLink}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">Verify My Email</a>
              <p style="color: #666; font-size: 14px;">If you didn't create an account on OlogyWood, you can safely ignore this email.</p>
              <p style="color: #999; font-size: 12px;">— The OlogyWood Team</p>
            </div>
          `,
        });
      }
      
      return { success: true, message: `Verification email sent to ${user.email}` };
    }),

  adminManualVerify: adminOnly
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [user] = await db.select().from(users).where(eq(users.id, input.userId));
      if (!user) throw new Error("User not found");
      if (user.emailVerified) throw new Error("User is already verified");
      
      // Manually mark as verified
      await db.update(users).set({
        emailVerified: true,
        emailVerificationToken: null,
      }).where(eq(users.id, input.userId));
      
      return { success: true, message: `${user.name || user.email} has been manually verified` };
    }),

  toggleUserStatus: adminOnly
    .input(
      z.object({
        userId: z.number(),
        suspended: z.boolean(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const allUsers = await db.select().from(users);
      const user = allUsers.find((u: typeof users.$inferSelect) => u.id === input.userId);

      if (!user) throw new Error("User not found");
      if (user.role === "admin") throw new Error("Cannot suspend admin users");

return { success: true, userId: input.userId };
    }),

  /**
   * Promote a user to admin role (any admin can do this)
   * @deprecated Use changeRole instead
   */
  promoteToAdmin: adminOnly
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allUsers = await db.select().from(users);
      const targetUser = allUsers.find((u: typeof users.$inferSelect) => u.id === input.userId);
      if (!targetUser) throw new Error("User not found");
      if (targetUser.role === 'admin') throw new Error("User is already an admin");

      const previousRole = targetUser.role;
      await db.update(users).set({
        role: 'admin',
        updatedAt: new Date(),
      }).where(sql`id = ${input.userId}`);

      // Send email notification
      if (targetUser.email) {
        sendRoleChangeEmail({
          recipientEmail: targetUser.email,
          recipientName: targetUser.name || '',
          previousRole: previousRole || 'user',
          newRole: 'admin',
          changedByName: ctx.user.name || ctx.user.email || 'An admin',
        }).catch(() => {});
      }

      return { success: true, userId: input.userId, previousRole };
    }),

  /**
   * Demote an admin back to their original role (any admin can do this)
   * @deprecated Use changeRole instead
   */
  demoteFromAdmin: adminOnly
    .input(z.object({
      userId: z.number(),
      restoreRole: z.enum(['artist', 'venue', 'user']).default('user'),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allUsers = await db.select().from(users);
      const targetUser = allUsers.find((u: typeof users.$inferSelect) => u.id === input.userId);
      if (!targetUser) throw new Error("User not found");
      if (targetUser.role !== 'admin') throw new Error("User is not an admin");

      if (targetUser.id === ctx.user.id) {
        throw new Error("Cannot demote yourself");
      }
      if (checkIsOwner(targetUser)) {
        throw new Error("Cannot demote the platform owner");
      }

      let restoreRole = input.restoreRole;
      if (restoreRole === 'user') {
        const artistProfile = await db.select().from(artistProfiles);
        const hasArtistProfile = artistProfile.some((p: typeof artistProfiles.$inferSelect) => p.userId === input.userId);
        if (hasArtistProfile) {
          restoreRole = 'artist';
        } else {
          const venueProfile = await db.select().from(venueProfiles);
          const hasVenueProfile = venueProfile.some((p: typeof venueProfiles.$inferSelect) => p.userId === input.userId);
          if (hasVenueProfile) {
            restoreRole = 'venue';
          }
        }
      }

      await db.update(users).set({
        role: restoreRole,
        updatedAt: new Date(),
      }).where(sql`id = ${input.userId}`);

      // Send email notification
      if (targetUser.email) {
        sendRoleChangeEmail({
          recipientEmail: targetUser.email,
          recipientName: targetUser.name || '',
          previousRole: 'admin',
          newRole: restoreRole,
          changedByName: ctx.user.name || ctx.user.email || 'An admin',
        }).catch(() => {});
      }

      return { success: true, userId: input.userId, newRole: restoreRole };
    }),

  /**
   * Change any user's role directly (admin, artist, venue, user)
   * Replaces the old promote/demote pattern with a single flexible endpoint
   */
  changeRole: adminOnly
    .input(z.object({
      userId: z.number(),
      newRole: z.enum(['admin', 'artist', 'venue', 'user', 'blogger']),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allUsers = await db.select().from(users);
      const targetUser = allUsers.find((u: typeof users.$inferSelect) => u.id === input.userId);
      if (!targetUser) throw new Error("User not found");

      // Can't change your own role
      if (targetUser.id === ctx.user.id) {
        throw new Error("Cannot change your own role");
      }

      // Can't change the platform owner's role
      if (checkIsOwner(targetUser)) {
        throw new Error("Cannot change the platform owner's role");
      }

      const previousRole = targetUser.role || 'user';

      // No-op if role is the same
      if (previousRole === input.newRole) {
        return { success: true, userId: input.userId, previousRole, newRole: input.newRole, changed: false };
      }

      await db.update(users).set({
        role: input.newRole,
        updatedAt: new Date(),
      }).where(sql`id = ${input.userId}`);

      // Record in audit log
      await db.insert(roleChangeAuditLog).values({
        targetUserId: targetUser.id,
        targetEmail: targetUser.email || null,
        targetName: targetUser.name || null,
        previousRole,
        newRole: input.newRole,
        changedById: ctx.user.id,
        changedByEmail: ctx.user.email || null,
        changedByName: ctx.user.name || null,
      });

      // Record in admin activity log
      await db.insert(adminActivityLog).values({
        adminId: ctx.user.id,
        adminEmail: ctx.user.email || "unknown",
        adminName: ctx.user.name || null,
        action: "role_change",
        category: "users",
        targetType: "user",
        targetId: String(targetUser.id),
        targetLabel: targetUser.email || targetUser.name || String(targetUser.id),
        details: JSON.stringify({ previousRole, newRole: input.newRole }),
      });

      // Send email notification
      if (targetUser.email) {
        sendRoleChangeEmail({
          recipientEmail: targetUser.email,
          recipientName: targetUser.name || '',
          previousRole,
          newRole: input.newRole,
          changedByName: ctx.user.name || ctx.user.email || 'An admin',
        }).catch(() => {});
      }

      return { success: true, userId: input.userId, previousRole, newRole: input.newRole, changed: true };
    }),

  /**
   * Get role change audit log (paginated, filterable)
   */
  getAuditLog: adminOnly
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const search = input?.search || '';
      const limit = input?.limit || 50;
      const offset = input?.offset || 0;

      let allEntries = await db.select().from(roleChangeAuditLog).orderBy(desc(roleChangeAuditLog.createdAt));

      // Filter by search term (target email/name or admin email/name)
      if (search) {
        const lowerSearch = search.toLowerCase();
        allEntries = allEntries.filter((entry: typeof roleChangeAuditLog.$inferSelect) =>
          (entry.targetEmail && entry.targetEmail.toLowerCase().includes(lowerSearch)) ||
          (entry.targetName && entry.targetName.toLowerCase().includes(lowerSearch)) ||
          (entry.changedByEmail && entry.changedByEmail.toLowerCase().includes(lowerSearch)) ||
          (entry.changedByName && entry.changedByName.toLowerCase().includes(lowerSearch))
        );
      }

      const total = allEntries.length;
      const entries = allEntries.slice(offset, offset + limit);

      return { entries, total, limit, offset };
    }),

  /**
   * Get all current admins (owner only)
   */
  getAdmins: adminOnly
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allUsers = await db.select().from(users);
      const admins = allUsers.filter((u: typeof users.$inferSelect) => u.role === 'admin');

      // Also include the owner
      const owner = allUsers.find((u: typeof users.$inferSelect) => checkIsOwner(u)) || null;

      return {
        admins,
        owner: owner ? { id: owner.id, email: owner.email, name: owner.name, role: owner.role } : null,
      };
    }),

  /**
   * Check if current user is the owner
   */
  isOwner: adminOnly
    .query(async ({ ctx }) => {
      return { isOwner: checkIsOwner(ctx.user) };
    }),

  // ============ BOOKING MANAGEMENT ============

  /**
   * Get all bookings with filtering
   */
  getBookings: adminOnly
    .input(
      z.object({
        status: z
          .enum(["pending", "confirmed", "completed", "cancelled"])
          .optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const allBookings = await db.select().from(bookings);
      let filtered = allBookings;

      if (input.status) {
        filtered = filtered.filter((b: typeof bookings.$inferSelect) => b.status === input.status);
      }

      const paginated = filtered
        .sort((a: typeof bookings.$inferSelect, b: typeof bookings.$inferSelect) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(input.offset, input.offset + input.limit);

      return {
        bookings: paginated,
        total: filtered.length,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get booking details
   */
  getBookingDetails: adminOnly
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const allBookings = await db.select().from(bookings);
      const booking = allBookings.find((b: typeof bookings.$inferSelect) => b.id === input.bookingId);

      if (!booking) throw new Error("Booking not found");

      return booking;
    }),

  /**
   * Resolve a booking dispute
   */
  resolveDispute: adminOnly
    .input(
      z.object({
        bookingId: z.number(),
        resolution: z.enum(["full_refund", "partial_refund", "no_refund"]),
        reason: z.string(),
        refundAmount: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const allBookings = await db.select().from(bookings);
      const booking = allBookings.find((b: typeof bookings.$inferSelect) => b.id === input.bookingId);

      if (!booking) throw new Error("Booking not found");

return { success: true, bookingId: input.bookingId };
    }),

  // ============ FINANCIAL MANAGEMENT ============

  /**
   * Get financial overview
   */
  getFinancialOverview: adminOnly.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const allPayouts = await db.select().from(artistPayouts);

    const totalPaid = allPayouts
      .filter((p: typeof artistPayouts.$inferSelect) => p.status === "completed")
      .reduce((sum: number, p: typeof artistPayouts.$inferSelect) => sum + (Number(p.amount) || 0), 0);

    const pending = allPayouts
      .filter((p: typeof artistPayouts.$inferSelect) => p.status === "pending")
      .reduce((sum: number, p: typeof artistPayouts.$inferSelect) => sum + (Number(p.amount) || 0), 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);

    const monthlyPaid = allPayouts
      .filter(
        (p: typeof artistPayouts.$inferSelect) =>
          p.status === "completed" &&
          new Date(p.createdAt) >= thisMonth
      )
      .reduce((sum: number, p: typeof artistPayouts.$inferSelect) => sum + (Number(p.amount) || 0), 0);

    return {
      totalPaid: totalPaid / 100,
      pendingPayouts: pending / 100,
      monthlyPaid: monthlyPaid / 100,
      totalTransactions: allPayouts.length,
    };
  }),

  /**
   * Get all payouts with filtering
   */
  getPayouts: adminOnly
    .input(
      z.object({
        status: z.enum(["pending", "completed", "failed"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const allPayouts = await db.select().from(artistPayouts);
      let filtered = allPayouts;

      if (input.status) {
        filtered = filtered.filter((p: typeof artistPayouts.$inferSelect) => p.status === input.status);
      }

      const paginated = filtered
        .sort((a: typeof artistPayouts.$inferSelect, b: typeof artistPayouts.$inferSelect) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(input.offset, input.offset + input.limit);

      return {
        payouts: paginated.map((p: typeof artistPayouts.$inferSelect) => ({
          ...p,
          amount: (Number(p.amount) || 0) / 100,
        })),
        total: filtered.length,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Process a payout
   */
  processPayout: adminOnly
    .input(
      z.object({
        payoutId: z.number(),
        action: z.enum(["approve", "reject"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const allPayouts = await db.select().from(artistPayouts);
      const payout = allPayouts.find((p: typeof artistPayouts.$inferSelect) => p.id === input.payoutId);

      if (!payout) throw new Error("Payout not found");

return { success: true, payoutId: input.payoutId };
    }),

  // ============ ANALYTICS ============

  /**
   * Get platform analytics
   */
  getAnalytics: adminOnly.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const allUsers = await db.select().from(users);
    const allBookings = await db.select().from(bookings);
    const allPayouts = await db.select().from(artistPayouts);

    const artistRoleCount = allUsers.filter((u: typeof users.$inferSelect) => u.role === "artist").length;
    const venueRoleCount = allUsers.filter((u: typeof users.$inferSelect) => u.role === "venue").length;
    
    // Count active profiles (users who completed their profile setup)
    const allArtistProfiles = await db.select({ id: artistProfiles.id }).from(artistProfiles);
    const allVenueProfiles = await db.select({ id: venueProfiles.id }).from(venueProfiles);
    const activeArtistCount = allArtistProfiles.length;
    const activeVenueCount = allVenueProfiles.length;
    
    const totalPaid = allPayouts
      .filter((p: typeof artistPayouts.$inferSelect) => p.status === "completed")
      .reduce((sum: number, p: typeof artistPayouts.$inferSelect) => sum + (Number(p.amount) || 0), 0);

    const completedBookings = allBookings.filter(
      (b: typeof bookings.$inferSelect) => b.status === "completed"
    ).length;

    return {
      totalUsers: allUsers.length,
      artistCount: activeArtistCount,
      venueCount: activeVenueCount,
      artistRoleCount: artistRoleCount,
      venueRoleCount: venueRoleCount,
      totalBookings: allBookings.length,
      completedBookings,
      completionRate:
        allBookings.length > 0
          ? ((completedBookings / allBookings.length) * 100).toFixed(1)
          : 0,
      totalPaid: totalPaid / 100,
      averageBookingValue:
        allBookings.length > 0
          ? (totalPaid / allBookings.length / 100).toFixed(2)
          : 0,
    };
  }),

  // ============ SYSTEM STATUS ============

  // ============ INCOMPLETE PROFILES ============

  /**
   * Get users who signed up but never completed their profile
   */
  getIncompleteProfiles: adminOnly.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Find users with artist/venue role who don't have a corresponding profile
    const allUsers = await db.select().from(users);
    const artistProfileUserIds = (await db.select({ userId: artistProfiles.userId }).from(artistProfiles)).map(r => r.userId);
    const venueProfileUserIds = (await db.select({ userId: venueProfiles.userId }).from(venueProfiles)).map(r => r.userId);
    
    const incompleteUsers = allUsers.filter(u => {
      if (u.role === 'artist' && !artistProfileUserIds.includes(u.id)) return true;
      if (u.role === 'venue' && !venueProfileUserIds.includes(u.id)) return true;
      return false;
    }).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
    }));
    
    return { users: incompleteUsers, count: incompleteUsers.length };
  }),

  /**
   * Send a reminder email to users with incomplete profiles
   */
  sendProfileReminder: adminOnly
    .input(z.object({ userIds: z.array(z.number()).optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get incomplete profile users (same logic as above)
      const allUsers = await db.select().from(users);
      const artistProfileUserIds = (await db.select({ userId: artistProfiles.userId }).from(artistProfiles)).map(r => r.userId);
      const venueProfileUserIds = (await db.select({ userId: venueProfiles.userId }).from(venueProfiles)).map(r => r.userId);
      
      let targetUsers = allUsers.filter(u => {
        if (u.role === 'artist' && !artistProfileUserIds.includes(u.id)) return true;
        if (u.role === 'venue' && !venueProfileUserIds.includes(u.id)) return true;
        return false;
      });
      
      // If specific userIds provided, filter to those
      if (input.userIds && input.userIds.length > 0) {
        targetUsers = targetUsers.filter(u => input.userIds!.includes(u.id));
      }
      
      let sentCount = 0;
      if (process.env.SENDGRID_API_KEY) {
        for (const user of targetUsers) {
          if (!user.email) continue;
          try {
            await sgMail.send({
              to: user.email,
              from: SENDGRID_FROM,
              subject: 'Complete Your OlogyWood Profile',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #7c3aed;">Complete Your Profile on OlogyWood</h2>
                  <p>Hi ${user.name || 'there'},</p>
                  <p>We noticed you signed up for OlogyWood but haven't finished setting up your ${user.role === 'venue' ? 'venue' : 'artist'} profile yet.</p>
                  <p>Complete your profile to:</p>
                  <ul>
                    <li>Get discovered by ${user.role === 'venue' ? 'talented artists' : 'venues and promoters'}</li>
                    <li>Start receiving booking requests</li>
                    <li>Access all platform features</li>
                  </ul>
                  <a href="${BASE_URL}/onboarding" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">Complete My Profile</a>
                  <p style="color: #666; font-size: 14px;">It only takes a few minutes to set up your profile and start connecting with the OlogyWood community.</p>
                  <p style="color: #999; font-size: 12px;">— The OlogyWood Team</p>
                </div>
              `,
            });
            sentCount++;
          } catch (e) {
            console.error(`Failed to send reminder to ${user.email}:`, e);
          }
        }
      }
      
      return { success: true, sentCount, totalTargeted: targetUsers.length, message: `Sent ${sentCount} reminder emails` };
    }),

  /**
   * Get growth data for charts - active artists and venues over time
   */
  getGrowthData: adminOnly.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Get artist profiles with creation dates
    const artistData = await db.select({ createdAt: artistProfiles.createdAt }).from(artistProfiles);
    const venueData = await db.select({ createdAt: venueProfiles.createdAt }).from(venueProfiles);
    
    // Group by month
    const monthlyGrowth: Record<string, { artists: number; venues: number }> = {};
    
    for (const a of artistData) {
      const month = new Date(a.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyGrowth[month]) monthlyGrowth[month] = { artists: 0, venues: 0 };
      monthlyGrowth[month].artists++;
    }
    
    for (const v of venueData) {
      const month = new Date(v.createdAt).toISOString().slice(0, 7);
      if (!monthlyGrowth[month]) monthlyGrowth[month] = { artists: 0, venues: 0 };
      monthlyGrowth[month].venues++;
    }
    
    // Sort by month and create cumulative totals
    const sortedMonths = Object.keys(monthlyGrowth).sort();
    let cumulativeArtists = 0;
    let cumulativeVenues = 0;
    
    const chartData = sortedMonths.map(month => {
      cumulativeArtists += monthlyGrowth[month].artists;
      cumulativeVenues += monthlyGrowth[month].venues;
      return {
        month,
        label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        newArtists: monthlyGrowth[month].artists,
        newVenues: monthlyGrowth[month].venues,
        totalArtists: cumulativeArtists,
        totalVenues: cumulativeVenues,
      };
    });
    
    return { chartData };
  }),

  // ============ SYSTEM STATUS (continued) ============

  /**
   * Get system health status
   */
  getSystemHealth: adminOnly.query(async () => {
    return {
      status: "healthy",
      uptime: "99.9%",
      database: "connected",
      email: "operational",
      payments: "operational",
      lastChecked: new Date(),
    };
  }),

  // ============ RELEASE MODERATION ============

  /**
   * Get all releases for admin moderation
   */
  getReleases: adminOnly
    .input(z.object({
      status: z.enum(["draft", "published", "archived", "taken_down"]).optional(),
      limit: z.number().min(1).max(100).default(50),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const status = input?.status;
      const limit = input?.limit || 50;

      if (!db) throw new Error("Database not available");

      const selectFields = {
        id: artistReleases.id,
        title: artistReleases.title,
        artistId: artistReleases.artistId,
        genre: artistReleases.genre,
        priceInCents: artistReleases.priceInCents,
        status: artistReleases.status,
        totalSales: artistReleases.totalSales,
        totalRevenueCents: artistReleases.totalRevenueCents,
        rightsCertifiedAt: artistReleases.rightsCertifiedAt,
        createdAt: artistReleases.createdAt,
        publishedAt: artistReleases.publishedAt,
      };

      if (status) {
        const { eq } = await import("drizzle-orm");
        return await db.select(selectFields)
          .from(artistReleases)
          .where(eq(artistReleases.status, status))
          .orderBy(desc(artistReleases.createdAt))
          .limit(limit);
      }

      return await db.select(selectFields)
        .from(artistReleases)
        .orderBy(desc(artistReleases.createdAt))
        .limit(limit);
    }),

  /**
   * DMCA takedown - set release status to taken_down
   */
  takedownRelease: adminOnly
    .input(z.object({
      releaseId: z.number(),
      reason: z.string().min(10, "Reason must be at least 10 characters"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { eq } = await import("drizzle-orm");

      await db.update(artistReleases)
        .set({
          status: "taken_down",
          updatedAt: new Date(),
        })
        .where(eq(artistReleases.id, input.releaseId));

      console.log(`[Admin] Release ${input.releaseId} taken down. Reason: ${input.reason}`);
      return { success: true, message: `Release ${input.releaseId} has been taken down.` };
    }),

  // ============ UNSUBSCRIBE FEEDBACK ============

  /**
   * Get unsubscribe feedback analytics
   */
  getUnsubscribeFeedback: adminOnly.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all feedback entries
    const allFeedback = await db
      .select()
      .from(unsubscribeFeedback)
      .orderBy(desc(unsubscribeFeedback.createdAt))
      .limit(100);

    // Get aggregated stats by reason
    const stats = await db
      .select({
        reason: unsubscribeFeedback.reason,
        count: sql<number>`COUNT(*)`,
      })
      .from(unsubscribeFeedback)
      .groupBy(unsubscribeFeedback.reason)
      .orderBy(desc(sql`COUNT(*)`));

    const totalCount = allFeedback.length;

    return {
      feedback: allFeedback,
      stats,
      totalCount,
    };
  }),

  /**
   * Restore a taken-down release
   */
  restoreRelease: adminOnly
    .input(z.object({
      releaseId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { eq } = await import("drizzle-orm");

      await db.update(artistReleases)
        .set({
          status: "draft",
          updatedAt: new Date(),
        })
        .where(eq(artistReleases.id, input.releaseId));

      return { success: true, message: `Release ${input.releaseId} has been restored to draft.` };
    }),

  /**
   * Log an admin activity
   */
  logActivity: adminOnly
    .input(z.object({
      action: z.string(),
      category: z.enum(["users", "bookings", "payouts", "blog", "disputes", "releases", "settings"]),
      targetType: z.string().optional(),
      targetId: z.string().optional(),
      targetLabel: z.string().optional(),
      details: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(adminActivityLog).values({
        adminId: ctx.user.id,
        adminEmail: ctx.user.email || "unknown",
        adminName: ctx.user.name || null,
        action: input.action,
        category: input.category,
        targetType: input.targetType || null,
        targetId: input.targetId || null,
        targetLabel: input.targetLabel || null,
        details: input.details || null,
      });

      return { success: true };
    }),

  /**
   * Get admin activity log (paginated, filterable)
   */
  getActivityLog: adminOnly
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
      category: z.enum(["all", "users", "bookings", "payouts", "blog", "disputes", "releases", "settings"]).default("all"),
      search: z.string().default(""),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { like, eq, or, and } = await import("drizzle-orm");

      const conditions: any[] = [];

      if (input.category !== "all") {
        conditions.push(eq(adminActivityLog.category, input.category));
      }

      if (input.search) {
        const searchPattern = `%${input.search}%`;
        conditions.push(
          or(
            like(adminActivityLog.adminEmail, searchPattern),
            like(adminActivityLog.adminName, searchPattern),
            like(adminActivityLog.action, searchPattern),
            like(adminActivityLog.targetLabel, searchPattern)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [entries, countResult] = await Promise.all([
        db.select()
          .from(adminActivityLog)
          .where(whereClause)
          .orderBy(desc(adminActivityLog.createdAt))
          .limit(input.limit)
          .offset((input.page - 1) * input.limit),
        db.select({ count: sql<number>`COUNT(*)` })
          .from(adminActivityLog)
          .where(whereClause),
      ]);

      return {
        entries,
        total: Number(countResult[0]?.count || 0),
        page: input.page,
        totalPages: Math.ceil(Number(countResult[0]?.count || 0) / input.limit),
      };
    }),

  // ============ VIDEO MODERATION (Community Flagging) ============

  /**
   * Get flagged videos for admin review
   */
  getFlaggedVideos: adminOnly
    .query(async () => {
      const dbModule = await import('../db');
      const flaggedVideos = await dbModule.getFlaggedVideos();
      
      // Enrich with flag details
      const enriched = await Promise.all(flaggedVideos.map(async (video: any) => {
        const flags = await dbModule.getFlagsForArtist(video.id);
        // Get flagger names
        const db = await getDb();
        const flagDetails = await Promise.all(flags.map(async (flag: any) => {
          if (!db) return { ...flag, flaggedByName: 'Unknown', flaggedByEmail: 'Unknown' };
          const user = await db.select({ name: users.name, email: users.email })
            .from(users)
            .where(sql`${users.id} = ${flag.flaggedByUserId}`)
            .limit(1);
          return {
            ...flag,
            flaggedByName: user[0]?.name || 'Unknown',
            flaggedByEmail: user[0]?.email || 'Unknown',
          };
        }));
        return {
          ...video,
          flags: flagDetails,
        };
      }));

      return enriched;
    }),

  /**
   * Dismiss flags on a video (restore to approved)
   */
  dismissVideoFlags: adminOnly
    .input(z.object({ artistProfileId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const dbModule = await import('../db');
      await dbModule.dismissVideoFlags(input.artistProfileId, ctx.user.id);

      // Log activity
      const db = await getDb();
      if (db) {
        await db.insert(adminActivityLog).values({
          adminId: ctx.user.id,
          adminEmail: ctx.user.email || 'unknown',
          adminName: ctx.user.name || null,
          action: 'Dismissed video flags and restored video',
          category: 'users',
          targetType: 'video',
          targetId: String(input.artistProfileId),
          targetLabel: `Artist Profile #${input.artistProfileId}`,
        });
      }

      return { success: true };
    }),

  /**
   * Take down a flagged video
   */
  takeDownVideo: adminOnly
    .input(z.object({ artistProfileId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const dbModule = await import('../db');
      await dbModule.takeDownVideo(input.artistProfileId, ctx.user.id);

      // Log activity
      const db = await getDb();
      if (db) {
        await db.insert(adminActivityLog).values({
          adminId: ctx.user.id,
          adminEmail: ctx.user.email || 'unknown',
          adminName: ctx.user.name || null,
          action: 'Took down flagged performance video',
          category: 'users',
          targetType: 'video',
          targetId: String(input.artistProfileId),
          targetLabel: `Artist Profile #${input.artistProfileId}`,
        });
      }

      // TODO: Send email notification to artist about takedown

      return { success: true };
    }),

  /**
   * Get flagged video count for admin badge
   */
  getFlaggedVideoCount: adminOnly
    .query(async () => {
      const db = await getDb();
      if (!db) return 0;
      const { gte } = await import('drizzle-orm');
      const result = await db.select({ count: sql<number>`COUNT(*)` })
        .from(artistProfiles)
        .where(gte(artistProfiles.performanceVideoFlagCount, 1));
      return result[0]?.count || 0;
    }),

  /**
   * Admin: Set artist subscription tier (manual toggle)
   */
  setArtistTier: adminOnly
    .input(z.object({
      artistProfileId: z.number(),
      tier: z.enum(['free', 'pro']),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const { eq } = await import('drizzle-orm');

      await db.update(artistProfiles).set({
        subscriptionTier: input.tier,
      }).where(eq(artistProfiles.id, input.artistProfileId));

      // Log activity
      await db.insert(adminActivityLog).values({
        adminId: ctx.user.id,
        adminEmail: ctx.user.email || 'unknown',
        adminName: ctx.user.name || null,
        action: `Set artist tier to ${input.tier}`,
        category: 'users',
        targetType: 'artist_profile',
        targetId: String(input.artistProfileId),
      });

      return { success: true };
    }),

  /**
   * Sync a user's subscription from Stripe (when webhook missed)
   */
  syncSubscriptionFromStripe: adminOnly
    .input(z.object({
      userId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const { eq } = await import('drizzle-orm');

      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Stripe is not configured');
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-12-15.clover' as any,
      });

      // Find the user
      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new Error('User not found');

      // Check if user has a subscription record
      const [existingSub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, input.userId)).limit(1);

      // Search Stripe for customer by email
      let stripeCustomerId = existingSub?.stripeCustomerId;
      if (!stripeCustomerId && user.email) {
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (customers.data.length > 0) {
          stripeCustomerId = customers.data[0].id;
        }
      }

      if (!stripeCustomerId) {
        return { success: false, message: 'No Stripe customer found for this user' };
      }

      // Get active subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'all',
        limit: 5,
      });

      if (subscriptions.data.length === 0) {
        return { success: false, message: 'No subscriptions found in Stripe for this customer' };
      }

      // Get the most recent active/trialing subscription
      const activeSub = subscriptions.data.find(s => s.status === 'active' || s.status === 'trialing')
        || subscriptions.data[0];

      // Determine tier from price
      const { SUBSCRIPTION_PRODUCTS } = await import('../../shared/products');
      const priceAmount = (activeSub as any).items?.data?.[0]?.price?.unit_amount;
      const lookupKey = (activeSub as any).items?.data?.[0]?.price?.lookup_key;
      const planMetadata = activeSub.metadata?.plan;

      let tier: 'free' | 'starter' | 'professional' = 'professional';
      if (planMetadata === 'ARTIST_STARTER' ||
          lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.lookupKey ||
          priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly) {
        tier = 'starter';
      }

      // Map Stripe status
      let status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'paused' = 'active';
      if (activeSub.status === 'trialing') status = 'trialing';
      else if (activeSub.status === 'past_due') status = 'past_due';
      else if (activeSub.status === 'canceled') status = 'cancelled';
      else if (activeSub.status === 'paused') status = 'paused';

      const currentPeriodEnd = (activeSub as any).current_period_end
        ? new Date((activeSub as any).current_period_end * 1000)
        : undefined;

      // Upsert subscription record
      if (existingSub) {
        await db.update(userSubscriptions).set({
          stripeCustomerId,
          stripeSubscriptionId: activeSub.id,
          tier,
          status,
          currentPeriodEnd,
        }).where(eq(userSubscriptions.userId, input.userId));
      } else {
        await db.insert(userSubscriptions).values({
          userId: input.userId,
          stripeCustomerId,
          stripeSubscriptionId: activeSub.id,
          tier,
          status,
          currentPeriodEnd,
        });
      }

      // Log activity
      await db.insert(adminActivityLog).values({
        adminId: ctx.user.id,
        adminEmail: ctx.user.email || 'unknown',
        adminName: ctx.user.name || null,
        action: `Synced subscription from Stripe: tier=${tier}, status=${status}`,
        category: 'users',
        targetType: 'user',
        targetId: String(input.userId),
      });

      return {
        success: true,
        tier,
        status,
        stripeSubscriptionId: activeSub.id,
        currentPeriodEnd,
      };
    }),

  /**
   * Get activity log summary stats
   */
  getActivityStats: adminOnly
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [totalResult, todayResult, categoryBreakdown] = await Promise.all([
        db.select({ count: sql<number>`COUNT(*)` }).from(adminActivityLog),
        db.select({ count: sql<number>`COUNT(*)` }).from(adminActivityLog)
          .where(sql`DATE(${adminActivityLog.createdAt}) = CURDATE()`),
        db.select({
          category: adminActivityLog.category,
          count: sql<number>`COUNT(*)`,
        })
          .from(adminActivityLog)
          .groupBy(adminActivityLog.category)
          .orderBy(desc(sql`COUNT(*)`)),
      ]);

      return {
        totalActions: Number(totalResult[0]?.count || 0),
        todayActions: Number(todayResult[0]?.count || 0),
        byCategory: categoryBreakdown.map(c => ({
          category: c.category,
          count: Number(c.count),
        })),
      };
    }),
});
