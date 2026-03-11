/**
 * Fan Notification Service
 * Sends email notifications to fans when artists create events or update their profiles.
 * Uses SendGrid for email delivery with branded templates.
 * Respects email preferences and includes unsubscribe links.
 */

import sgMail from '@sendgrid/mail';
import { getDb } from '../db';
import { follows, users, artistProfiles } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@ologywood.com';
const BASE_URL = process.env.BASE_URL || 'https://www.ologywood.com';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface FanNotificationRecipient {
  id: number;
  name: string;
  email: string;
}

/**
 * Get all fans (followers) of an artist with their email addresses
 */
async function getArtistFans(artistUserId: number): Promise<FanNotificationRecipient[]> {
  const db = await getDb();
  if (!db) return [];

  const followerRelations = await db
    .select()
    .from(follows)
    .where(eq(follows.followingId, artistUserId));

  const fans: FanNotificationRecipient[] = [];

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
 * Branded email header
 */
function getEmailHeader(): string {
  return `
    <div style="background: linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/ymRJKMwaOWmPOCjV.png" alt="Ologywood" style="height: 40px; width: auto; margin-bottom: 10px;">
      <p style="color: white; font-size: 14px; margin: 0; font-weight: 500;">Where Artists Meet Opportunities</p>
    </div>
  `;
}

/**
 * Branded email footer with unsubscribe link
 */
function getEmailFooter(userId: number): string {
  const unsubscribeUrl = `${BASE_URL}/unsubscribe?userId=${userId}&type=fan_updates`;
  return `
    <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
        You're receiving this email because you follow this artist on Ologywood.
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
  `;
}

/**
 * Notify all fans when an artist creates a new event
 */
export async function notifyFansNewEvent(
  artistUserId: number,
  eventDetails: {
    eventTitle: string;
    eventDate: string;
    eventLocation?: string;
    eventId?: number;
  }
): Promise<{ sent: number; failed: number }> {
  const result = { sent: 0, failed: 0 };

  if (!process.env.SENDGRID_API_KEY) {
    console.log('[FanNotification] SendGrid not configured, skipping fan notifications');
    return result;
  }

  try {
    const [fans, artistInfo] = await Promise.all([
      getArtistFans(artistUserId),
      getArtistInfo(artistUserId),
    ]);
    const artistName = artistInfo.name;
    const profileId = artistInfo.profileId;

    if (!profileId) {
      console.error(`[FanNotification] Could not find artist profile ID for userId ${artistUserId}, skipping notifications`);
      return result;
    }

    if (fans.length === 0) {
      console.log(`[FanNotification] No fans to notify for artist ${artistUserId}`);
      return result;
    }

    const artistProfileUrl = `${BASE_URL}/artist/${profileId}`;
    const eventUrl = eventDetails.eventId 
      ? `${BASE_URL}/events/${eventDetails.eventId}` 
      : artistProfileUrl;

    for (const fan of fans) {
      try {
        const message = {
          to: fan.email,
          from: SENDGRID_FROM_EMAIL,
          subject: `🎵 ${artistName} has a new event: ${eventDetails.eventTitle}`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              ${getEmailHeader()}
              <div style="padding: 30px 24px;">
                <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${fan.name},</p>
                
                <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                  <strong>${artistName}</strong>, an artist you follow, just announced a new event!
                </p>

                <div style="background: linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%); padding: 24px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6D28D9;">
                  <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 20px;">${eventDetails.eventTitle}</h3>
                  <p style="color: #4b5563; margin: 0 0 8px 0;">
                    <strong>📅 Date:</strong> ${eventDetails.eventDate}
                  </p>
                  ${eventDetails.eventLocation ? `
                    <p style="color: #4b5563; margin: 0;">
                      <strong>📍 Location:</strong> ${eventDetails.eventLocation}
                    </p>
                  ` : ''}
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${eventUrl}" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">View Event Details</a>
                </div>

                <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
                  Don't miss out — check out the event and book your spot!
                </p>
              </div>
              ${getEmailFooter(fan.id)}
            </div>
          `,
        };

        await sgMail.send(message as any);
        result.sent++;
      } catch (error) {
        console.error(`[FanNotification] Failed to send to ${fan.email}:`, error);
        result.failed++;
      }
    }

    console.log(`[FanNotification] New event notification: sent=${result.sent}, failed=${result.failed} for artist ${artistUserId}`);
    return result;
  } catch (error) {
    console.error('[FanNotification] Error notifying fans of new event:', error);
    return result;
  }
}

/**
 * Notify all fans when an artist updates their profile
 */
export async function notifyFansProfileUpdate(
  artistUserId: number,
  updateDetails: {
    updateType: 'bio' | 'photos' | 'availability' | 'general';
    summary: string;
  }
): Promise<{ sent: number; failed: number }> {
  const result = { sent: 0, failed: 0 };

  if (!process.env.SENDGRID_API_KEY) {
    console.log('[FanNotification] SendGrid not configured, skipping fan notifications');
    return result;
  }

  try {
    const [fans, artistInfo] = await Promise.all([
      getArtistFans(artistUserId),
      getArtistInfo(artistUserId),
    ]);
    const artistName = artistInfo.name;
    const profileId = artistInfo.profileId;

    if (!profileId) {
      console.error(`[FanNotification] Could not find artist profile ID for userId ${artistUserId}, skipping notifications`);
      return result;
    }

    if (fans.length === 0) {
      return result;
    }

    const artistProfileUrl = `${BASE_URL}/artist/${profileId}`;

    for (const fan of fans) {
      try {
        const message = {
          to: fan.email,
          from: SENDGRID_FROM_EMAIL,
          subject: `${artistName} updated their profile on Ologywood`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              ${getEmailHeader()}
              <div style="padding: 30px 24px;">
                <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${fan.name},</p>
                
                <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                  <strong>${artistName}</strong>, an artist you follow, has updated their profile.
                </p>

                <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6D28D9;">
                  <p style="color: #4b5563; margin: 0; font-size: 15px;">${updateDetails.summary}</p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${artistProfileUrl}" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">View Profile</a>
                </div>
              </div>
              ${getEmailFooter(fan.id)}
            </div>
          `,
        };

        await sgMail.send(message as any);
        result.sent++;
      } catch (error) {
        console.error(`[FanNotification] Failed to send to ${fan.email}:`, error);
        result.failed++;
      }
    }

    console.log(`[FanNotification] Profile update notification: sent=${result.sent}, failed=${result.failed} for artist ${artistUserId}`);
    return result;
  } catch (error) {
    console.error('[FanNotification] Error notifying fans of profile update:', error);
    return result;
  }
}
