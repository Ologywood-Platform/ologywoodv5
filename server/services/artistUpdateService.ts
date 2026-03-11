/**
 * Artist Update Service
 * Allows paid-tier artists to compose and send custom email blasts to their fan list.
 * Rate limited to 1 update per day per artist.
 */

import sgMail from '@sendgrid/mail';
import { getDb } from '../db';
import { follows, users, artistProfiles, artistUpdates } from '../../drizzle/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@ologywood.com';
const BASE_URL = process.env.BASE_URL || 'https://www.ologywood.com';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface FanRecipient {
  id: number;
  name: string;
  email: string;
}

/**
 * Get all fans (followers) of an artist with their email addresses
 */
async function getArtistFans(artistUserId: number): Promise<FanRecipient[]> {
  const db = await getDb();
  if (!db) return [];

  const followerRelations = await db
    .select()
    .from(follows)
    .where(eq(follows.followingId, artistUserId));

  const fans: FanRecipient[] = [];

  for (const relation of followerRelations) {
    const userResult = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, relation.followerId))
      .limit(1);

    if (userResult.length > 0 && userResult[0].email) {
      fans.push({
        id: userResult[0].id,
        name: userResult[0].name || 'Fan',
        email: userResult[0].email,
      });
    }
  }

  return fans;
}

/**
 * Get the artist's display name and profile ID from their profile
 */
async function getArtistInfo(artistUserId: number): Promise<{ name: string; profileId: number | null }> {
  const db = await getDb();
  if (!db) return { name: 'Artist', profileId: null };

  const profile = await db
    .select({ id: artistProfiles.id, artistName: artistProfiles.artistName })
    .from(artistProfiles)
    .where(eq(artistProfiles.userId, artistUserId))
    .limit(1);

  if (profile.length > 0) {
    return { name: profile[0].artistName || 'Artist', profileId: profile[0].id };
  }
  return { name: 'Artist', profileId: null };
}

/**
 * Check if artist can send an update (rate limit: 1 per day)
 */
export async function canSendUpdate(artistUserId: number): Promise<{ allowed: boolean; nextAllowedAt?: Date; lastSentAt?: Date }> {
  const db = await getDb();
  if (!db) return { allowed: false };

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentUpdates = await db
    .select()
    .from(artistUpdates)
    .where(
      and(
        eq(artistUpdates.artistId, artistUserId),
        gte(artistUpdates.sentAt, oneDayAgo)
      )
    )
    .orderBy(desc(artistUpdates.sentAt))
    .limit(1);

  if (recentUpdates.length > 0) {
    const lastSent = recentUpdates[0].sentAt;
    const nextAllowed = new Date(lastSent.getTime() + 24 * 60 * 60 * 1000);
    return { allowed: false, nextAllowedAt: nextAllowed, lastSentAt: lastSent };
  }

  return { allowed: true };
}

/**
 * Get update history for an artist
 */
export async function getUpdateHistory(artistUserId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  const updates = await db
    .select()
    .from(artistUpdates)
    .where(eq(artistUpdates.artistId, artistUserId))
    .orderBy(desc(artistUpdates.sentAt))
    .limit(limit)
    .offset(offset);

  return updates;
}

/**
 * Build the branded email HTML for an artist update
 */
function buildUpdateEmail(
  fanName: string,
  fanId: number,
  artistName: string,
  artistProfileId: number,
  subject: string,
  body: string
): string {
  const artistProfileUrl = `${BASE_URL}/artist/${artistProfileId}`;
  const unsubscribeUrl = `${BASE_URL}/unsubscribe?userId=${fanId}&type=fan_updates`;

  // Convert plain text body to HTML paragraphs (preserve line breaks)
  const htmlBody = body
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p style="color: #374151; font-size: 15px; margin: 0 0 16px 0; line-height: 1.6;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/ymRJKMwaOWmPOCjV.png" alt="Ologywood" style="height: 40px; width: auto; margin-bottom: 10px;">
        <p style="color: white; font-size: 14px; margin: 0; font-weight: 500;">Where Artists Meet Opportunities</p>
      </div>
      <div style="padding: 30px 24px;">
        <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${fanName},</p>
        
        <p style="color: #374151; font-size: 16px; margin: 0 0 8px 0;">
          <strong>${artistName}</strong> sent you an update:
        </p>

        <div style="background: linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%); padding: 24px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6D28D9;">
          <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px;">${subject}</h3>
          ${htmlBody}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${artistProfileUrl}" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">View Artist Profile</a>
        </div>
      </div>
      <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
          You're receiving this email because you follow ${artistName} on Ologywood.
        </p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          <a href="${unsubscribeUrl}" style="color: #6D28D9; text-decoration: none;">Unsubscribe from artist updates</a> | 
          <a href="${BASE_URL}/settings" style="color: #6D28D9; text-decoration: none;">Manage preferences</a> | 
          <a href="${BASE_URL}/privacy" style="color: #6D28D9; text-decoration: none;">Privacy Policy</a>
        </p>
        <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
          &copy; 2026 Ologywood. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

/**
 * Send an update email blast to all fans
 */
export async function sendArtistUpdate(
  artistUserId: number,
  subject: string,
  body: string
): Promise<{ updateId: number; recipientCount: number; sentCount: number; failedCount: number }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get fans and artist info
  const [fans, artistInfo] = await Promise.all([
    getArtistFans(artistUserId),
    getArtistInfo(artistUserId),
  ]);
  const artistName = artistInfo.name;
  const artistProfileId = artistInfo.profileId;

  if (!artistProfileId) {
    console.error(`[ArtistUpdate] Could not find artist profile ID for userId ${artistUserId}, aborting update`);
    throw new Error('Artist profile not found');
  }

  // Create the update record
  const insertResult = await db.insert(artistUpdates).values({
    artistId: artistUserId,
    subject,
    body,
    recipientCount: fans.length,
    sentCount: 0,
    failedCount: 0,
    status: 'sending',
  });

  const updateId = (insertResult as any)[0]?.insertId || (insertResult as any).insertId || 0;

  if (fans.length === 0) {
    // No fans to send to
    await db
      .update(artistUpdates)
      .set({ status: 'sent', sentCount: 0, failedCount: 0 })
      .where(eq(artistUpdates.id, updateId));

    return { updateId, recipientCount: 0, sentCount: 0, failedCount: 0 };
  }

  let sentCount = 0;
  let failedCount = 0;

  if (!process.env.SENDGRID_API_KEY) {
    console.log('[ArtistUpdate] SendGrid not configured, skipping email delivery');
    await db
      .update(artistUpdates)
      .set({ status: 'sent', sentCount: 0, failedCount: fans.length })
      .where(eq(artistUpdates.id, updateId));

    return { updateId, recipientCount: fans.length, sentCount: 0, failedCount: fans.length };
  }

  // Send emails to each fan
  for (const fan of fans) {
    try {
      const html = buildUpdateEmail(fan.name, fan.id, artistName, artistProfileId, subject, body);
      const message = {
        to: fan.email,
        from: SENDGRID_FROM_EMAIL,
        subject: `${artistName}: ${subject}`,
        html,
      };

      await sgMail.send(message as any);
      sentCount++;
    } catch (error) {
      console.error(`[ArtistUpdate] Failed to send to ${fan.email}:`, error);
      failedCount++;
    }
  }

  // Update the record with final counts
  const finalStatus = failedCount === fans.length ? 'failed' : 'sent';
  await db
    .update(artistUpdates)
    .set({ status: finalStatus as any, sentCount, failedCount })
    .where(eq(artistUpdates.id, updateId));

  console.log(`[ArtistUpdate] Blast complete: sent=${sentCount}, failed=${failedCount} for artist ${artistUserId}`);

  return { updateId, recipientCount: fans.length, sentCount, failedCount };
}
