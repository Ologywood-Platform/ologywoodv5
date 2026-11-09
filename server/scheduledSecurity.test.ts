import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireCronTaskUid, requireVerifiedCronTask } from './services/cronAuth';
import { sdk } from './_core/sdk';
import { escapeFanEmailHtml, safeFanEmailHref, sanitizeFanEmailSubject } from './services/fanEmailFormatting';

const serverDir = join(__dirname);
const read = (relativePath: string) => readFileSync(join(serverDir, relativePath), 'utf8');

const scheduledSources = {
  contract: read('routes/scheduledContractReminders.ts'),
  premiere: read('routes/scheduledPremiereReminders.ts'),
  credit: read('handlers/creditExpiration.ts'),
  autoComplete: read('handlers/autoCompleteBookings.ts'),
  session: read('handlers/sessionReminders.ts'),
};

describe('scheduled-job security boundaries', () => {
  it('accepts only a single canonical task UID header', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const valid = requireCronTaskUid({ headers: { 'x-manus-cron-task-uid': 'Japrdw4zVGQEdTqC2kVkrK' } } as any, res);
    expect(valid).toBe('Japrdw4zVGQEdTqC2kVkrK');
    expect(res.status).not.toHaveBeenCalled();

    const invalidHeaders = [
      undefined,
      '',
      'short',
      'contains whitespace',
      'bad\nvalue',
      ['Japrdw4zVGQEdTqC2kVkrK', 'another'],
      'x'.repeat(129),
    ];
    for (const header of invalidHeaders) {
      const invalidRes = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      expect(requireCronTaskUid({ headers: { 'x-manus-cron-task-uid': header } } as any, invalidRes)).toBeNull();
      expect(invalidRes.status).toHaveBeenCalledWith(403);
      expect(invalidRes.json).toHaveBeenCalledWith({ error: 'cron-only' });
    }
  });

  it('accepts Heartbeat’s verified cron session when no duplicate header is sent', async () => {
    const taskUid = 'Japrdw4zVGQEdTqC2kVkrK';
    const auth = vi.spyOn(sdk, 'authenticateRequest').mockResolvedValue({
      isCron: true,
      taskUid,
    } as any);
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

    await expect(requireVerifiedCronTask({ headers: {} } as any, res)).resolves.toBe(taskUid);
    expect(auth).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    auth.mockRestore();
  });

  it('escapes HTML, rejects unsafe href protocols, and removes subject newlines', () => {
    expect(escapeFanEmailHtml('<img src=x onerror=alert(1)>')).toContain('&lt;img');
    expect(safeFanEmailHref('javascript:alert(1)')).toBe('#');
    expect(safeFanEmailHref('https://www.ologywood.com/path?a=1&b=2')).toContain('https://www.ologywood.com/path');
    expect(sanitizeFanEmailSubject('Subject\r\nBcc: attacker@example.com')).toBe('Subject Bcc: attacker@example.com');
  });

  it('uses the verified helper on every mounted scheduled handler', () => {
    for (const source of Object.values(scheduledSources)) {
      expect(source).toContain('requireVerifiedCronTask(req, res)');
      expect(source).not.toMatch(/req\.headers\[['"]x-manus-cron-task-uid['"]\]\s+as\s+string/);
      expect(source).not.toContain('error.message');
      expect(source).not.toContain('error.stack');
      expect(source).not.toContain('taskUid: req.headers');
    }
  });

  it('does not log recipient PII or raw email exceptions in scheduled handlers', () => {
    expect(scheduledSources.contract).not.toContain('emailErr);');
    expect(scheduledSources.premiere).not.toMatch(/console\.error[\s\S]{0,160}buyer\.email/);
    expect(scheduledSources.autoComplete).not.toContain('emailErr);');
    expect(scheduledSources.session).not.toContain('err);');
    expect(scheduledSources.credit).not.toContain('err));');
  });

  it('escapes user-controlled fields in scheduled HTML templates', () => {
    const contract = scheduledSources.contract;
    expect(contract).toContain('escapeFanEmailHtml(artist.name || \'there\')');
    expect(contract).toContain('escapeFanEmailHtml(contract.title)');
    expect(read('email.ts')).toContain('const safeReleaseTitle = escapeFanEmailHtml(releaseTitle);');
    expect(read('email.ts')).toContain('const contentHref = safeFanEmailHref(contentUrl);');
    expect(scheduledSources.credit).toContain('const safeUserName = escapeFanEmailHtml(userName);');
  });
});
