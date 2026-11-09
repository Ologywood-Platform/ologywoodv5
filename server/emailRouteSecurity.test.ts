import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('test-email route security boundary', () => {
  it('requires an authenticated admin and strict normalized email input', () => {
    const source = readFileSync('server/routes/emailRoutes.ts', 'utf8');
    expect(source).toContain("if (!req.user) return res.status(401)");
    expect(source).toContain("req.user.role !== 'admin'");
    expect(source).toContain("router.post('/test', requireAdmin");
    expect(source).toContain("email.length > 320");
    expect(source).toContain("email.trim().toLowerCase()");
    expect(source).toContain(".test(email)");
    expect(source).toContain("emailTestingLimiter.checkAsync(`express-ip:${getClientIp(req)}`)");
    expect(source).toContain("emailTestingLimiter.checkAsync(`express-email:${email}`)");
    expect(source).toContain("Object.keys(req.body).some((key) => key !== 'email')");
    expect(source).toContain("res.set('Retry-After'");
    expect(source).toContain("status(429)");
  });

  it('keeps unsubscribe routes mounted independently from the admin-only test action', () => {
    const source = readFileSync('server/routes/emailRoutes.ts', 'utf8');
    expect(source).toContain("router.use('/', unsubscribeRoutes)");
    expect(source).not.toContain('router.use(requireAdmin, unsubscribeRoutes)');
    expect(source).not.toContain("Error sending test email:', error);");
  });
});
