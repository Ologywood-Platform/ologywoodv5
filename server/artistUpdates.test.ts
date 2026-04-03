import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Artist Updates - Database Schema', () => {
  const schemaPath = path.resolve(__dirname, '../drizzle/schema.ts');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  it('should define artistUpdates table', () => {
    expect(schemaContent).toContain('export const artistUpdates = mysqlTable("artist_updates"');
  });

  it('should have required columns: id, artistId, subject, body, recipientCount, sentCount, failedCount, status, sentAt', () => {
    expect(schemaContent).toContain('artistId: int("artistId")');
    expect(schemaContent).toContain('subject: varchar("subject"');
    expect(schemaContent).toContain('body: text("body")');
    expect(schemaContent).toContain('recipientCount: int("recipientCount")');
    expect(schemaContent).toContain('sentCount: int("sentCount")');
    expect(schemaContent).toContain('failedCount: int("failedCount")');
  });

  it('should have status enum with sending, sent, failed', () => {
    expect(schemaContent).toContain('"sending", "sent", "failed"');
  });

  it('should have indexes on artistId and sentAt', () => {
    expect(schemaContent).toContain('idx_artist_updates_artist');
    expect(schemaContent).toContain('idx_artist_updates_sent_at');
  });

  it('should export ArtistUpdate and InsertArtistUpdate types', () => {
    expect(schemaContent).toContain('export type ArtistUpdate = typeof artistUpdates.$inferSelect');
    expect(schemaContent).toContain('export type InsertArtistUpdate = typeof artistUpdates.$inferInsert');
  });
});

describe('Artist Updates - Service Layer', () => {
  const servicePath = path.resolve(__dirname, './services/artistUpdateService.ts');
  const serviceContent = fs.readFileSync(servicePath, 'utf-8');

  it('should exist as a service file', () => {
    expect(fs.existsSync(servicePath)).toBe(true);
  });

  it('should export canSendUpdate function', () => {
    expect(serviceContent).toContain('export async function canSendUpdate');
  });

  it('should export getUpdateHistory function', () => {
    expect(serviceContent).toContain('export async function getUpdateHistory');
  });

  it('should export sendArtistUpdate function', () => {
    expect(serviceContent).toContain('export async function sendArtistUpdate');
  });

  it('should implement 24-hour rate limiting', () => {
    expect(serviceContent).toContain('24 * 60 * 60 * 1000');
  });

  it('should use the shared sendEmail function for email delivery', () => {
    expect(serviceContent).toContain("sendEmail");
    expect(serviceContent).toContain("import { sendEmail } from '../email'");
  });

  it('should include unsubscribe link in emails', () => {
    expect(serviceContent).toContain('unsubscribeUrl');
    expect(serviceContent).toContain('/unsubscribe');
  });

  it('should include branded Ologywood email header', () => {
    expect(serviceContent).toContain('Ologywood');
    expect(serviceContent).toContain('Where Artists Meet Opportunities');
  });

  it('should convert plain text body to HTML paragraphs', () => {
    expect(serviceContent).toContain("split('\\n\\n')");
  });

  it('should track sent and failed counts', () => {
    expect(serviceContent).toContain('sentCount++');
    expect(serviceContent).toContain('failedCount++');
  });

  it('should update the database record with final status', () => {
    expect(serviceContent).toContain("status: finalStatus");
    expect(serviceContent).toContain(".update(artistUpdates)");
  });

  it('should handle case when no fans exist', () => {
    expect(serviceContent).toContain('fans.length === 0');
  });

  it('should handle case when sendEmail returns false', () => {
    expect(serviceContent).toContain("sendEmail returned false");
  });
});

describe('Artist Updates - Router', () => {
  const routerPath = path.resolve(__dirname, './routers/artistUpdates.ts');
  const routerContent = fs.readFileSync(routerPath, 'utf-8');

  it('should exist as a router file', () => {
    expect(fs.existsSync(routerPath)).toBe(true);
  });

  it('should export artistUpdatesRouter', () => {
    expect(routerContent).toContain('export const artistUpdatesRouter');
  });

  it('should have canSend endpoint', () => {
    expect(routerContent).toContain('canSend:');
  });

  it('should have send endpoint', () => {
    expect(routerContent).toContain('send:');
  });

  it('should have getHistory endpoint', () => {
    expect(routerContent).toContain('getHistory:');
  });

  it('should restrict to artist role', () => {
    expect(routerContent).toContain("ctx.user.role !== \"artist\"");
  });

  it('should check paid tier access via hasFeatureAccess', () => {
    expect(routerContent).toContain('hasFeatureAccess');
    expect(routerContent).toContain('"riderBuilder"');
  });

  it('should validate subject input (min 1, max 200)', () => {
    expect(routerContent).toContain('.min(1');
    expect(routerContent).toContain('.max(200');
  });

  it('should validate body input (min 1, max 5000)', () => {
    expect(routerContent).toContain('.max(5000');
  });

  it('should check rate limit before sending', () => {
    expect(routerContent).toContain('canSendUpdate');
    expect(routerContent).toContain('TOO_MANY_REQUESTS');
  });

  it('should return hasAccess flag for tier gating', () => {
    expect(routerContent).toContain('hasAccess');
  });
});

describe('Artist Updates - Router Registration', () => {
  const routersPath = path.resolve(__dirname, './routers.ts');
  const routersContent = fs.readFileSync(routersPath, 'utf-8');

  it('should import artistUpdatesRouter', () => {
    expect(routersContent).toContain('import { artistUpdatesRouter }');
  });

  it('should register artistUpdates in appRouter', () => {
    expect(routersContent).toContain('artistUpdates: artistUpdatesRouter');
  });
});

describe('Artist Updates - Frontend Components', () => {
  const sendUpdatePath = path.resolve(__dirname, '../client/src/components/SendUpdateDialog.tsx');
  const fansSectionPath = path.resolve(__dirname, '../client/src/components/FansSection.tsx');

  it('should have SendUpdateDialog component', () => {
    expect(fs.existsSync(sendUpdatePath)).toBe(true);
    const content = fs.readFileSync(sendUpdatePath, 'utf-8');
    expect(content).toContain('export function SendUpdateDialog');
  });

  it('SendUpdateDialog should have compose form with subject and body', () => {
    const content = fs.readFileSync(sendUpdatePath, 'utf-8');
    expect(content).toContain('update-subject');
    expect(content).toContain('update-body');
  });

  it('SendUpdateDialog should have preview mode', () => {
    const content = fs.readFileSync(sendUpdatePath, 'utf-8');
    expect(content).toContain('showPreview');
    expect(content).toContain('Email Preview');
  });

  it('SendUpdateDialog should have send confirmation dialog', () => {
    const content = fs.readFileSync(sendUpdatePath, 'utf-8');
    expect(content).toContain('showConfirm');
    expect(content).toContain('Confirm Send');
    expect(content).toContain('cannot be undone');
  });

  it('SendUpdateDialog should have update history view', () => {
    const content = fs.readFileSync(sendUpdatePath, 'utf-8');
    expect(content).toContain('showHistory');
    expect(content).toContain('History');
    expect(content).toContain('getHistory');
  });

  it('SendUpdateDialog should show rate limit warning', () => {
    const content = fs.readFileSync(sendUpdatePath, 'utf-8');
    expect(content).toContain('Rate limit reached');
    expect(content).toContain('one update per day');
  });

  it('SendUpdateDialog should show character counts', () => {
    const content = fs.readFileSync(sendUpdatePath, 'utf-8');
    expect(content).toContain('subject.length');
    expect(content).toContain('body.length');
    expect(content).toContain('/200');
    expect(content).toContain('/5000');
  });

  it('SendUpdateDialog should call trpc.artistUpdates.send', () => {
    const content = fs.readFileSync(sendUpdatePath, 'utf-8');
    expect(content).toContain('trpc.artistUpdates.send.useMutation');
  });

  it('SendUpdateDialog should call trpc.artistUpdates.canSend', () => {
    const content = fs.readFileSync(sendUpdatePath, 'utf-8');
    expect(content).toContain('trpc.artistUpdates.canSend.useQuery');
  });

  it('FansSection should import and render SendUpdateDialog', () => {
    const content = fs.readFileSync(fansSectionPath, 'utf-8');
    expect(content).toContain('import { SendUpdateDialog }');
    expect(content).toContain('<SendUpdateDialog');
  });

  it('FansSection should have Send Update button for paid tier', () => {
    const content = fs.readFileSync(fansSectionPath, 'utf-8');
    expect(content).toContain('Send Update');
    expect(content).toContain('setSendUpdateOpen(true)');
  });

  it('FansSection should only show Send Update for paid tier with followers', () => {
    const content = fs.readFileSync(fansSectionPath, 'utf-8');
    expect(content).toContain('hasPaidAccess && followerCount > 0');
  });
});
