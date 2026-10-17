/** Automatic creator news emails use the same explicit consent rules as Send Update. */
import { sendEmail } from '../email';
import { getDb, createNotification } from '../db';
import { follows, users, artistProfiles } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { getEmailLogoImage } from '../../shared/emailBranding';
import { ENV } from '../_core/env';
import { getEligibleFanEmailRecipients, withEligibleFanEmailRecipient } from './fanEmailConsentService';
import { escapeFanEmailHtml as escapeHtml, fanEmailDeliveryOptions } from './fanEmailFormatting';

const BASE_URL = ENV.baseUrl || 'https://www.ologywood.com';

async function getArtistInfo(artistUserId: number): Promise<{ name: string; profileId: number | null }> {
  const db = await getDb();
  if (!db) throw new Error('Fan notifications temporarily unavailable.');
  const profiles = await db.select({ id: artistProfiles.id, name: artistProfiles.artistName }).from(artistProfiles).where(eq(artistProfiles.userId, artistUserId)).limit(1);
  return { name: profiles[0]?.name || 'Creator', profileId: profiles[0]?.id ?? null };
}

/** Following still enables in-app news; it does not require email/contact sharing. */
async function getInAppFans(artistUserId: number): Promise<Array<{ id: number }>> {
  const db = await getDb();
  if (!db) throw new Error('Follower notifications temporarily unavailable.');
  const rows = await db.select({ id: users.id }).from(follows).innerJoin(users, eq(users.id, follows.followerId)).where(eq(follows.followingId, artistUserId));
  return [...new Map(rows.map(row => [row.id, row])).values()];
}

function getEmailHeader(): string {
  return `<div style="background:linear-gradient(135deg,#6D28D9,#00D9FF);padding:30px;text-align:center">${getEmailLogoImage({ size: 88, marginBottom: 12 })}<p style="color:white;font-size:14px">Where Artists Meet Opportunities</p></div>`;
}

function getEmailFooter(unsubscribeUrl: string): string {
  return `<div style="background:#f9fafb;padding:20px;font-size:12px;color:#6b7280">
    <p>You're receiving this email because you explicitly opted in to updates from this creator on Ologywood.</p>
    <p><a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe from this creator's updates</a> |
    <a href="${escapeHtml(BASE_URL)}/settings">Manage preferences</a> |
    <a href="${escapeHtml(BASE_URL)}/privacy-policy">Privacy Policy</a></p>
    <p>OlogyWood · 171 Prestwick Dr, Hoschton, GA 30548 · &copy; ${new Date().getFullYear()} Ologywood</p>
  </div>`;
}

export async function notifyFansNewEvent(artistUserId: number, eventDetails: { eventTitle: string; eventDate: string; eventLocation?: string; eventId?: number }): Promise<{ sent: number; failed: number }> {
  const result = { sent: 0, failed: 0 };
  let artistInfo: { name: string; profileId: number | null };
  try { artistInfo = await getArtistInfo(artistUserId); }
  catch { console.error('[FanNotification] Creator news source unavailable'); return result; }
  if (!artistInfo.profileId) return result;
  const artistProfileUrl = `${BASE_URL}/artist/${artistInfo.profileId}`;
  const eventUrl = eventDetails.eventId ? `${BASE_URL}/events/${eventDetails.eventId}` : artistProfileUrl;

  // This path deliberately does not inspect, disclose, or export follower email addresses.
  try {
    for (const fan of await getInAppFans(artistUserId)) {
      try {
        await createNotification({ userId: fan.id, type: 'booking', title: `${artistInfo.name} has a new event`,
          message: `${eventDetails.eventTitle} — ${eventDetails.eventDate}${eventDetails.eventLocation ? ` at ${eventDetails.eventLocation}` : ''}`,
          actionUrl: eventDetails.eventId ? `/events/${eventDetails.eventId}` : `/artist/${artistInfo.profileId}` });
      } catch { console.error('[FanNotification] Could not create follower in-app notice'); }
    }
  } catch { console.error('[FanNotification] In-app follower source unavailable'); }

  try {
    const fans = await getEligibleFanEmailRecipients(artistUserId, 10000, 0);
    for (const fan of fans) {
      try {
        const checked = await withEligibleFanEmailRecipient(artistUserId, fan.id, fan.consentRevision, async (current, unsubscribeUrl) => {
          const html = `<div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
            ${getEmailHeader()}<div style="padding:30px 24px"><p>Hi ${escapeHtml(current.name)},</p>
            <p><strong>${escapeHtml(artistInfo.name)}</strong>, a creator you follow, just announced a new event!</p>
            <div style="background:#f5f3ff;padding:24px;border-left:4px solid #6D28D9"><h3>${escapeHtml(eventDetails.eventTitle)}</h3>
            <p><strong>Date:</strong> ${escapeHtml(eventDetails.eventDate)}</p>
            ${eventDetails.eventLocation ? `<p><strong>Location:</strong> ${escapeHtml(eventDetails.eventLocation)}</p>` : ''}</div>
            <p><a href="${escapeHtml(eventUrl)}">View Event Details</a></p></div>${getEmailFooter(unsubscribeUrl)}</div>`;
          return sendEmail({ to: current.email, subject: `${artistInfo.name} has a new event: ${eventDetails.eventTitle}`, html }, fanEmailDeliveryOptions(unsubscribeUrl));
        });
        if (!checked.eligible) continue;
        if (checked.value) result.sent++; else result.failed++;
      } catch { result.failed++; console.error('[FanNotification] Could not verify event email delivery'); }
    }
  } catch { console.error('[FanNotification] Eligible email recipients unavailable; no emails sent'); }
  return result;
}

export async function notifyFansProfileUpdate(artistUserId: number, updateDetails: { updateType: 'bio' | 'photos' | 'availability' | 'general'; summary: string }): Promise<{ sent: number; failed: number }> {
  const result = { sent: 0, failed: 0 };
  try {
    const [fans, artistInfo] = await Promise.all([getEligibleFanEmailRecipients(artistUserId, 10000, 0), getArtistInfo(artistUserId)]);
    if (!artistInfo.profileId) return result;
    const artistProfileUrl = `${BASE_URL}/artist/${artistInfo.profileId}`;
    for (const fan of fans) {
      try {
        const checked = await withEligibleFanEmailRecipient(artistUserId, fan.id, fan.consentRevision, async (current, unsubscribeUrl) => {
          const html = `<div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
            ${getEmailHeader()}<div style="padding:30px 24px"><p>Hi ${escapeHtml(current.name)},</p>
            <p><strong>${escapeHtml(artistInfo.name)}</strong>, a creator you follow, has updated their profile.</p>
            <div style="background:#f5f3ff;padding:20px;border-left:4px solid #6D28D9">${escapeHtml(updateDetails.summary)}</div>
            <p><a href="${escapeHtml(artistProfileUrl)}">View Profile</a></p></div>${getEmailFooter(unsubscribeUrl)}</div>`;
          return sendEmail({ to: current.email, subject: `${artistInfo.name} updated their profile on Ologywood`, html }, fanEmailDeliveryOptions(unsubscribeUrl));
        });
        if (!checked.eligible) continue;
        if (checked.value) result.sent++; else result.failed++;
      } catch { result.failed++; console.error('[FanNotification] Could not verify profile email delivery'); }
    }
  } catch { console.error('[FanNotification] Eligible email recipients unavailable; no emails sent'); }
  return result;
}
