/** Paid creators can send one update per 24 hours to explicitly opted-in fans. */
import { TRPCError } from '@trpc/server';
import { sendEmail } from '../email';
import { getDb } from '../db';
import { artistProfiles, artistUpdates } from '../../drizzle/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { getEmailLogoImage } from '../../shared/emailBranding';
import { ENV } from '../_core/env';
import { assertFanEmailCreator } from './fanEmailAccessService';
import { hasFeatureAccess } from './pricingTierService';
import { getEligibleFanEmailRecipients, withEligibleFanEmailRecipient, withFanEmailUserLock } from './fanEmailConsentService';
import { escapeFanEmailHtml as escapeHtml, fanEmailDeliveryOptions } from './fanEmailFormatting';

const BASE_URL = ENV.baseUrl || 'https://www.ologywood.com';
const DAY = 24 * 60 * 60 * 1000;

export async function canSendUpdate(artistUserId: number): Promise<{ allowed: boolean; nextAllowedAt?: Date; lastSentAt?: Date }> {
  const db = await getDb();
  if (!db) return { allowed: false };
  const recentUpdates = await db.select().from(artistUpdates)
    .where(and(eq(artistUpdates.artistId, artistUserId), gte(artistUpdates.sentAt, new Date(Date.now() - DAY))))
    .orderBy(desc(artistUpdates.sentAt)).limit(1);
  if (recentUpdates.length) {
    const lastSent = recentUpdates[0].sentAt;
    return { allowed: false, lastSentAt: lastSent, nextAllowedAt: new Date(lastSent.getTime() + DAY) };
  }
  return { allowed: true };
}

export async function getUpdateHistory(artistUserId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error('Fan updates are temporarily unavailable.');
  return db.select().from(artistUpdates).where(eq(artistUpdates.artistId, artistUserId)).orderBy(desc(artistUpdates.sentAt)).limit(limit).offset(offset);
}

export function buildUpdateEmail(fanName: string, artistName: string, artistProfileId: number, subject: string, body: string, unsubscribeUrl: string): string {
  const artistProfileUrl = `${BASE_URL}/artist/${artistProfileId}`;
  const htmlBody = body.split('\n\n').map(p => p.trim()).filter(Boolean)
    .map(p => `<p style="color:#374151;font-size:15px;margin:0 0 16px">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
  return `<div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#6D28D9,#00D9FF);padding:30px;text-align:center">
      ${getEmailLogoImage({ size: 88, marginBottom: 12 })}
      <p style="color:white;font-size:14px">Where Artists Meet Opportunities</p>
    </div>
    <div style="padding:30px 24px">
      <p>Hi ${escapeHtml(fanName)},</p><p><strong>${escapeHtml(artistName)}</strong> sent you an update:</p>
      <div style="background:#f5f3ff;padding:24px;border-left:4px solid #6D28D9">
        <h3>${escapeHtml(subject)}</h3>${htmlBody}
      </div>
      <p style="text-align:center;margin:30px 0"><a href="${escapeHtml(artistProfileUrl)}" style="color:#6D28D9">View Artist Profile</a></p>
    </div>
    <div style="background:#f9fafb;padding:20px;font-size:12px;color:#6b7280">
      <p>You're receiving this email because you opted in to updates from ${escapeHtml(artistName)} on Ologywood.</p>
      <p><a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe from this creator's updates</a> |
      <a href="${escapeHtml(BASE_URL)}/settings">Manage preferences</a> |
      <a href="${escapeHtml(BASE_URL)}/privacy-policy">Privacy Policy</a></p>
      <p>OlogyWood · 171 Prestwick Dr, Hoschton, GA 30548 · &copy; ${new Date().getFullYear()} Ologywood</p>
    </div>
  </div>`;
}

/** Reserve the daily send before provider calls, preventing concurrent duplicate campaigns. */
async function reserveUpdate(artistUserId: number, subject: string, body: string, recipientCount: number): Promise<number> {
  return withFanEmailUserLock(artistUserId, async connection => {
    const [recent] = await connection.execute('SELECT id FROM artist_updates WHERE artistId = ? AND sentAt >= ? ORDER BY sentAt DESC LIMIT 1', [artistUserId, new Date(Date.now() - DAY)]);
    if ((recent as any[]).length) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'You can only send one update per day. Try again later.' });
    const [inserted] = await connection.execute('INSERT INTO artist_updates (artistId, subject, body, recipientCount, sentCount, failedCount, status) VALUES (?, ?, ?, ?, 0, 0, ?)', [artistUserId, subject, body, recipientCount, 'sending']);
    const updateId = Number((inserted as any).insertId);
    if (!Number.isSafeInteger(updateId) || updateId < 1) throw new Error('Could not reserve fan update.');
    return updateId;
  });
}

export async function sendArtistUpdate(artistUserId: number, subject: string, body: string): Promise<{ updateId: number; recipientCount: number; sentCount: number; failedCount: number; skippedCount: number }> {
  await assertFanEmailCreator(artistUserId);
  if (!await hasFeatureAccess(artistUserId, 'riderBuilder')) throw new TRPCError({ code: 'FORBIDDEN', message: 'Upgrade to Starter tier or higher to send updates.' });
  const db = await getDb();
  if (!db) throw new Error('Fan updates are temporarily unavailable.');
  const [fans, profiles] = await Promise.all([
    getEligibleFanEmailRecipients(artistUserId, 10000, 0),
    db.select({ id: artistProfiles.id, name: artistProfiles.artistName }).from(artistProfiles).where(eq(artistProfiles.userId, artistUserId)).limit(1),
  ]);
  if (!profiles.length) throw new TRPCError({ code: 'FORBIDDEN', message: 'Creator profile not found.' });
  if (fans.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No eligible opted-in fans. Following or buying does not automatically subscribe fans to email.' });
  const updateId = await reserveUpdate(artistUserId, subject, body, fans.length);
  const artistName = profiles[0].name || 'Creator';
  let sentCount = 0, failedCount = 0, skippedCount = 0;
  for (const fan of fans) {
    try {
      const checked = await withEligibleFanEmailRecipient(artistUserId, fan.id, fan.consentRevision, async (current, unsubscribeUrl) => {
        const html = buildUpdateEmail(current.name, artistName, profiles[0].id, subject, body, unsubscribeUrl);
        return sendEmail({ to: current.email, subject: `${artistName}: ${subject}`, html }, fanEmailDeliveryOptions(unsubscribeUrl));
      });
      if (!checked.eligible) skippedCount++;
      else if (checked.value) sentCount++;
      else {
        console.error('[ArtistUpdate] sendEmail returned false for a recipient');
        failedCount++;
      }
    } catch {
      // Consent/preferences/source failures fail closed: never fall back to the old follower list.
      console.error('[ArtistUpdate] Recipient delivery could not be verified');
      failedCount++;
    }
  }
  const finalStatus = sentCount > 0 ? 'sent' : 'failed';
  await db.update(artistUpdates).set({ status: finalStatus, sentCount, failedCount }).where(eq(artistUpdates.id, updateId));
  // sentCount means provider accepted, not delivered or read. Skips are derivable for history.
  return { updateId, recipientCount: fans.length, sentCount, failedCount, skippedCount };
}
