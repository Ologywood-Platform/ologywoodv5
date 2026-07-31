import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { artistTeamMembers, artistTeamInvitations, artistTeamActivityLog, users } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import * as db from "../db";
import crypto from "crypto";
// Email sending is done via dynamic import of '../email'

// Default permissions by role
const DEFAULT_PERMISSIONS = {
  owner: {
    editProfile: true,
    manageBookings: true,
    sendMessages: true,
    manageCalendar: true,
    uploadMedia: true,
    viewEarnings: true,
    manageTeam: true,
  },
  manager: {
    editProfile: true,
    manageBookings: true,
    sendMessages: true,
    manageCalendar: true,
    uploadMedia: true,
    viewEarnings: true,
    manageTeam: false,
  },
  team_member: {
    editProfile: false,
    manageBookings: false,
    sendMessages: false,
    manageCalendar: false,
    uploadMedia: true,
    viewEarnings: false,
    manageTeam: false,
  },
};

// Middleware: ensure user is artist or has team access
const teamAccessProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'artist' && ctx.user.role !== 'admin') {
    // Check if user is a team member of any artist
    const database = await getDb();
    if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    const membership = await database.select().from(artistTeamMembers)
      .where(eq(artistTeamMembers.userId, ctx.user.id))
      .limit(1);
    if (membership.length === 0) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Artist or team member access required' });
    }
  }
  return next({ ctx });
});

export const teamRouter = router({
  // Public: Get invitation preview (email, inviter name, role) without requiring login
  getInvitationPreview: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const [invitation] = await database.select().from(artistTeamInvitations)
        .where(eq(artistTeamInvitations.token, input.token))
        .limit(1);

      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation not found' });
      }

      // Check if expired
      const expired = invitation.status === 'expired' || new Date() > invitation.expiresAt;

      // Get inviter name
      const inviter = await db.getUserById(invitation.invitedByUserId);

      // Get artist profile name
      const artistProfile = await db.getArtistProfileById(invitation.artistProfileId);

      // Partially mask email for privacy (show first 2 chars + domain)
      const emailParts = invitation.email.split('@');
      const maskedLocal = emailParts[0].substring(0, 2) + '***';
      const maskedEmail = `${maskedLocal}@${emailParts[1]}`;

      return {
        email: maskedEmail,
        fullEmail: invitation.email, // Full email so user knows exactly what to use
        inviterName: inviter?.name || 'A team owner',
        artistName: artistProfile?.artistName || 'an artist',
        role: invitation.role === 'manager' ? 'Manager' : 'Team Member',
        expired,
        status: invitation.status,
      };
    }),

  // Get team members for the current artist's profile
  getMembers: teamAccessProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return [];

    const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
    if (!artistProfile) {
      // Check if user is a team member
      const membership = await database.select().from(artistTeamMembers)
        .where(eq(artistTeamMembers.userId, ctx.user.id))
        .limit(1);
      if (membership.length === 0) return [];
      // Get members for the artist profile they belong to
      const members = await database.select().from(artistTeamMembers)
        .where(eq(artistTeamMembers.artistProfileId, membership[0].artistProfileId));
      // Enrich with user info
      const enriched = await Promise.all(members.map(async (m) => {
        const user = await db.getUserById(m.userId);
        return { ...m, userName: user?.name || 'Unknown', userEmail: user?.email || '', userAvatar: user?.avatarUrl || user?.customAvatarUrl || null };
      }));
      return enriched;
    }

    const members = await database.select().from(artistTeamMembers)
      .where(eq(artistTeamMembers.artistProfileId, artistProfile.id));
    // Enrich with user info
    const enriched = await Promise.all(members.map(async (m) => {
      const user = await db.getUserById(m.userId);
      return { ...m, userName: user?.name || 'Unknown', userEmail: user?.email || '', userAvatar: user?.avatarUrl || user?.customAvatarUrl || null };
    }));
    return enriched;
  }),

  // Get pending invitations
  getPendingInvitations: teamAccessProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return [];

    const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
    if (!artistProfile) return [];

    const invitations = await database.select().from(artistTeamInvitations)
      .where(and(
        eq(artistTeamInvitations.artistProfileId, artistProfile.id),
        eq(artistTeamInvitations.status, 'pending')
      ))
      .orderBy(desc(artistTeamInvitations.createdAt));
    return invitations;
  }),

  // Invite a team member by email
  invite: teamAccessProcedure
    .input(z.object({
      email: z.string().email(),
      role: z.enum(["manager", "team_member"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });

      // Check if user has permission to manage team
      const membership = await database.select().from(artistTeamMembers)
        .where(and(
          eq(artistTeamMembers.artistProfileId, artistProfile.id),
          eq(artistTeamMembers.userId, ctx.user.id)
        ))
        .limit(1);

      if (membership.length > 0 && !membership[0].permissions?.manageTeam) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to manage the team' });
      }

      // Check if already a team member
      const [existingUser] = await database.select().from(users)
        .where(eq(users.email, input.email))
        .limit(1);
      if (existingUser) {
        const existingMember = await database.select().from(artistTeamMembers)
          .where(and(
            eq(artistTeamMembers.artistProfileId, artistProfile.id),
            eq(artistTeamMembers.userId, existingUser.id)
          ))
          .limit(1);
        if (existingMember.length > 0) {
          throw new TRPCError({ code: 'CONFLICT', message: 'This person is already a team member' });
        }
      }

      // Check for existing pending invitation
      const existingInvite = await database.select().from(artistTeamInvitations)
        .where(and(
          eq(artistTeamInvitations.artistProfileId, artistProfile.id),
          eq(artistTeamInvitations.email, input.email),
          eq(artistTeamInvitations.status, 'pending')
        ))
        .limit(1);
      if (existingInvite.length > 0) {
        throw new TRPCError({ code: 'CONFLICT', message: 'An invitation is already pending for this email' });
      }

      // Create invitation token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await database.insert(artistTeamInvitations).values({
        artistProfileId: artistProfile.id,
        email: input.email,
        role: input.role,
        token,
        status: 'pending',
        invitedByUserId: ctx.user.id,
        expiresAt,
      });

      // Log the activity
      await database.insert(artistTeamActivityLog).values({
        artistProfileId: artistProfile.id,
        userId: ctx.user.id,
        action: 'team_member_invited',
        details: { email: input.email, role: input.role },
      });

      // Send invitation email (best effort)
      try {
        const { sendEmail } = await import('../email');
        const baseUrl = process.env.BASE_URL || 'https://www.ologywood.com';
        const inviteLink = `${baseUrl}/team/accept?token=${token}`;
        const roleName = input.role === 'manager' ? 'Manager' : 'Team Member';
        await sendEmail({
          to: input.email,
          subject: `You're invited to join ${artistProfile.artistName || 'an artist'}'s team on Ologywood`,
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Team Invitation</h2>
            <p><strong>${ctx.user.name || 'Someone'}</strong> has invited you to join <strong>${artistProfile.artistName || 'an artist'}</strong>'s team as a <strong>${roleName}</strong> on Ologywood.</p>
            <p>As a ${roleName}, you'll be able to help manage their profile and bookings.</p>
            <p style="margin: 24px 0;"><a href="${inviteLink}" style="background: #6d28d9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Accept Invitation</a></p>
            <p style="color: #666; font-size: 14px;">This invitation expires in 7 days.</p>
          </div>`,
        });
      } catch (e) {
        console.error('[Team] Failed to send invitation email:', e);
      }

      return { success: true, message: 'Invitation sent' };
    }),

  // Accept an invitation (by token)
  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const [invitation] = await database.select().from(artistTeamInvitations)
        .where(and(
          eq(artistTeamInvitations.token, input.token),
          eq(artistTeamInvitations.status, 'pending')
        ))
        .limit(1);

      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation not found or already used' });
      }

      if (new Date() > invitation.expiresAt) {
        await database.update(artistTeamInvitations)
          .set({ status: 'expired' })
          .where(eq(artistTeamInvitations.id, invitation.id));
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This invitation has expired' });
      }

      // Check email matches
      if (ctx.user.email !== invitation.email) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'This invitation was sent to a different email address' });
      }

      // Add as team member
      const permissions = DEFAULT_PERMISSIONS[invitation.role];
      await database.insert(artistTeamMembers).values({
        artistProfileId: invitation.artistProfileId,
        userId: ctx.user.id,
        role: invitation.role,
        permissions,
        invitedByUserId: invitation.invitedByUserId,
      });

      // Update invitation status
      await database.update(artistTeamInvitations)
        .set({ status: 'accepted', acceptedAt: new Date() })
        .where(eq(artistTeamInvitations.id, invitation.id));

      // Log activity
      await database.insert(artistTeamActivityLog).values({
        artistProfileId: invitation.artistProfileId,
        userId: ctx.user.id,
        action: 'team_member_joined',
        details: { role: invitation.role },
      });

      return { success: true, artistProfileId: invitation.artistProfileId };
    }),

  // Decline an invitation
  declineInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const [invitation] = await database.select().from(artistTeamInvitations)
        .where(and(
          eq(artistTeamInvitations.token, input.token),
          eq(artistTeamInvitations.status, 'pending')
        ))
        .limit(1);

      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation not found' });
      }

      await database.update(artistTeamInvitations)
        .set({ status: 'declined' })
        .where(eq(artistTeamInvitations.id, invitation.id));

      return { success: true };
    }),

  // Update a team member's role
  updateRole: teamAccessProcedure
    .input(z.object({
      memberId: z.number(),
      role: z.enum(["manager", "team_member"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });

      // Verify the member belongs to this artist
      const [member] = await database.select().from(artistTeamMembers)
        .where(and(
          eq(artistTeamMembers.id, input.memberId),
          eq(artistTeamMembers.artistProfileId, artistProfile.id)
        ))
        .limit(1);

      if (!member) throw new TRPCError({ code: 'NOT_FOUND', message: 'Team member not found' });
      if (member.role === 'owner') throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot change the owner role' });

      const permissions = DEFAULT_PERMISSIONS[input.role];
      await database.update(artistTeamMembers)
        .set({ role: input.role, permissions })
        .where(eq(artistTeamMembers.id, input.memberId));

      // Log activity
      await database.insert(artistTeamActivityLog).values({
        artistProfileId: artistProfile.id,
        userId: ctx.user.id,
        action: 'team_member_role_updated',
        details: { memberId: input.memberId, newRole: input.role },
      });

      return { success: true };
    }),

  // Remove a team member
  removeMember: teamAccessProcedure
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });

      const [member] = await database.select().from(artistTeamMembers)
        .where(and(
          eq(artistTeamMembers.id, input.memberId),
          eq(artistTeamMembers.artistProfileId, artistProfile.id)
        ))
        .limit(1);

      if (!member) throw new TRPCError({ code: 'NOT_FOUND', message: 'Team member not found' });
      if (member.role === 'owner') throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot remove the owner' });

      await database.delete(artistTeamMembers)
        .where(eq(artistTeamMembers.id, input.memberId));

      // Log activity
      await database.insert(artistTeamActivityLog).values({
        artistProfileId: artistProfile.id,
        userId: ctx.user.id,
        action: 'team_member_removed',
        details: { removedUserId: member.userId },
      });

      return { success: true };
    }),

  // Resend a pending invitation (regenerate token, reset expiry, re-send email)
  resendInvitation: teamAccessProcedure
    .input(z.object({ invitationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });

      const [invitation] = await database.select().from(artistTeamInvitations)
        .where(and(
          eq(artistTeamInvitations.id, input.invitationId),
          eq(artistTeamInvitations.artistProfileId, artistProfile.id),
          eq(artistTeamInvitations.status, 'pending')
        ))
        .limit(1);

      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pending invitation not found' });
      }

      // Regenerate token and reset expiry
      const newToken = crypto.randomBytes(32).toString('hex');
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await database.update(artistTeamInvitations)
        .set({ token: newToken, expiresAt: newExpiresAt })
        .where(eq(artistTeamInvitations.id, invitation.id));

      // Re-send email
      try {
        const { sendEmail } = await import('../email');
        const baseUrl = process.env.BASE_URL || 'https://www.ologywood.com';
        const inviteLink = `${baseUrl}/team/accept?token=${newToken}`;
        const roleName = invitation.role === 'manager' ? 'Manager' : 'Team Member';
        await sendEmail({
          to: invitation.email,
          subject: `Reminder: You're invited to join ${artistProfile.artistName || 'an artist'}'s team on Ologywood`,
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Team Invitation Reminder</h2>
            <p><strong>${ctx.user.name || 'Someone'}</strong> has re-sent your invitation to join <strong>${artistProfile.artistName || 'an artist'}</strong>'s team as a <strong>${roleName}</strong> on Ologywood.</p>
            <p style="margin: 24px 0;"><a href="${inviteLink}" style="background: #6d28d9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Accept Invitation</a></p>
            <p style="color: #666; font-size: 14px;">This invitation expires in 7 days.</p>
          </div>`,
        });
      } catch (e) {
        console.error('[Team] Failed to resend invitation email:', e);
      }

      return { success: true, message: 'Invitation resent' };
    }),

  // Cancel a pending invitation
  cancelInvitation: teamAccessProcedure
    .input(z.object({ invitationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });

      await database.update(artistTeamInvitations)
        .set({ status: 'expired' })
        .where(and(
          eq(artistTeamInvitations.id, input.invitationId),
          eq(artistTeamInvitations.artistProfileId, artistProfile.id)
        ));

      return { success: true };
    }),

  // Get profiles the current user can manage (for profile switcher)
  getManagedProfiles: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return [];

    // Get all team memberships for this user
    const memberships = await database.select().from(artistTeamMembers)
      .where(eq(artistTeamMembers.userId, ctx.user.id));

    if (memberships.length === 0) return [];

    // Enrich with artist profile info
    const profiles = await Promise.all(memberships.map(async (m) => {
      const profile = await db.getArtistProfileById(m.artistProfileId);
      return {
        artistProfileId: m.artistProfileId,
        artistName: profile?.artistName || 'Unknown Artist',
        artistPhoto: profile?.profilePhotoUrl || null,
        role: m.role,
        permissions: m.permissions,
      };
    }));

    return profiles;
  }),

  // Get activity log for an artist profile
  getActivityLog: teamAccessProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) return [];

      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile) return [];

      const logs = await database.select().from(artistTeamActivityLog)
        .where(eq(artistTeamActivityLog.artistProfileId, artistProfile.id))
        .orderBy(desc(artistTeamActivityLog.createdAt))
        .limit(input.limit);

      // Enrich with user names
      const enriched = await Promise.all(logs.map(async (log) => {
        const user = await db.getUserById(log.userId);
        return { ...log, userName: user?.name || 'Unknown' };
      }));

      return enriched;
    }),
});
