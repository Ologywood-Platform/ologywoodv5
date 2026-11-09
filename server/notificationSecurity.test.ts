import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const router = readFileSync(resolve(__dirname, 'routers/notifications.ts'), 'utf8');

describe('notification security boundaries', () => {
  it('bounds pagination and uses safe integer notification IDs', () => {
    expect(router).toContain('const notificationId = z.number().int().safe().positive()');
    expect(router).toContain('const notificationPage = z.object({');
    expect(router).toContain('limit: z.number().int().safe().min(1).max(100).default(30)');
    expect(router).toContain('offset: z.number().int().safe().min(0).max(1_000_000).default(0)');
    expect(router).toContain('.input(notificationPage.optional())');
    expect(router).toContain('.input(z.object({ id: notificationId }).strict())');
  });

  it('keeps every notification mutation scoped to the authenticated user', () => {
    expect(router).toContain('db.markNotificationRead(input.id, ctx.user.id)');
    expect(router).toContain('db.deleteNotification(input.id, ctx.user.id)');
    expect(router).toContain('db.markAllNotificationsRead(ctx.user.id)');
    expect(router).toContain('db.upsertNotificationPreferences(ctx.user.id, input)');
  });

  it('rejects unknown notification preference fields', () => {
    expect(router).toContain('reminderNotifications: z.boolean().optional(),\n      }).strict()');
  });
});
