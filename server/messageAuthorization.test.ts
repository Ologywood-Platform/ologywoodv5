import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const routerSource = readFileSync(resolve(process.cwd(), 'server/routers.ts'), 'utf8');
const dbSource = readFileSync(resolve(process.cwd(), 'server/db.ts'), 'utf8');

describe('booking message authorization', () => {
  it('restricts ordinary messages to the other booking participant', () => {
    const sendBlock = routerSource.slice(
      routerSource.indexOf('    // Send message'),
      routerSource.indexOf('    // Send rider template as a message'),
    );

    expect(sendBlock).toContain('const allowedRecipientIds = [');
    expect(sendBlock).toContain('const bookingVenueProfile = isArtistParty ? await db.getVenueProfileById(booking.venueId) : null;');
    expect(sendBlock).toContain('const bookingArtistProfile = isVenueParty ? await db.getArtistProfileById(booking.artistId) : null;');
    expect(sendBlock).toContain('bookingVenueProfile?.userId');
    expect(sendBlock).toContain('bookingArtistProfile?.userId');
    expect(sendBlock).toContain("Messages can only be sent to the other booking participant");
    expect(sendBlock).toContain('allowedRecipientIds.includes(input.receiverId)');
  });

  it('applies the same recipient check to rider messages', () => {
    const riderBlock = routerSource.slice(
      routerSource.indexOf('    // Send rider template as a message'),
      routerSource.indexOf('    // Mark message as read'),
    );

    expect(riderBlock).toContain('allowedRecipientIds.includes(input.receiverId)');
    expect(riderBlock).toContain('Messages can only be sent to the other booking participant');
  });

  it('only lets the recipient mark one message as read', () => {
    const readBlock = routerSource.slice(
      routerSource.indexOf('    // Mark message as read'),
      routerSource.indexOf('    // Mark all messages in a booking as read'),
    );

    expect(readBlock).toContain('db.getMessageById(input.id)');
    expect(readBlock).toContain('message.recipientId !== ctx.user.id');
    expect(readBlock).toContain('Only the message recipient can mark it as read');
  });

  it('scopes bulk read updates to the authenticated recipient', () => {
    const routerReadBlock = routerSource.slice(
      routerSource.indexOf('    // Mark all messages in a booking as read'),
      routerSource.indexOf('    // Get unread message count for a specific booking'),
    );
    const dbReadBlock = dbSource.slice(
      dbSource.indexOf('export async function markMessagesAsRead'),
      dbSource.indexOf('export async function getTotalUnreadMessageCount'),
    );

    expect(routerReadBlock).toContain('db.getBookingById(input.bookingId)');
    expect(routerReadBlock).toContain('db.markMessagesAsRead(input.bookingId, ctx.user.id)');
    expect(dbReadBlock).toContain('recipientUserId?: number');
    expect(dbReadBlock).toContain('messages.recipientId');
  });

  it('rejects malformed identifiers and unbounded rider names at the procedure boundary', () => {
    const messageBlock = routerSource.slice(
      routerSource.indexOf('  message: router({'),
      routerSource.indexOf('  // Subscription Management'),
    );
    expect(messageBlock).not.toContain('z.number().int().positive()');
    expect(messageBlock).toContain('getForBooking: protectedProcedure');
    expect(messageBlock).toContain('bookingId: bookingIdInput');
    expect(messageBlock).toContain('receiverId: z.number().int().safe().positive()');
    expect(messageBlock).toContain('riderTemplateName: legacyRiderTemplateName');
    expect(messageBlock).toContain('riderTemplateData: legacyRiderTemplateData');
    expect(messageBlock).toContain("message: z.string().trim().min(1).max(5_000)");
  });

  it('party-scopes unread-count reads', () => {
    const unreadBlock = routerSource.slice(
      routerSource.indexOf('    // Get unread message count for a specific booking'),
      routerSource.indexOf('    // Get total unread message count for current user'),
    );
    expect(unreadBlock).toContain('db.getBookingById(input.bookingId)');
    expect(unreadBlock).toContain("code: 'FORBIDDEN'");
    expect(unreadBlock).toContain('db.getUnreadMessageCountByBooking(input.bookingId, ctx.user.id)');
  });
});
