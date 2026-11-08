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
    expect(sendBlock).toContain('venueProfile?.userId');
    expect(sendBlock).toContain('artistProfile?.userId');
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
});
