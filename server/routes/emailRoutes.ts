/**
 * Email Routes for Ologywood
 * Handles email sending endpoints
 */

import { Router } from 'express';
import { sendTestEmail } from '../email/emailService';
import { emailTestingLimiter } from '../utils/rateLimiter';
import unsubscribeRoutes from './unsubscribeRoutes';

const router = Router();

function getClientIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded) && forwarded[0]) return String(forwarded[0]).trim();
  return String(req.ip || req.socket?.remoteAddress || 'unknown');
}

const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};

/**
 * POST /api/email/test
 * Send a test email to verify the email system is working
 */
router.post('/test', requireAdmin, async (req, res) => {
  try {
    const ipCheck = await emailTestingLimiter.checkAsync(`express-ip:${getClientIp(req)}`);
    if (!ipCheck.allowed) {
      res.set('Retry-After', String(Math.max(1, Math.ceil(ipCheck.retryAfterMs / 1000))));
      return res.status(429).json({ success: false, message: 'Too many test-email requests. Please try again later.' });
    }
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required',
      });
    }

    const emailCheck = await emailTestingLimiter.checkAsync(`express-email:${email}`);
    if (!emailCheck.allowed) {
      res.set('Retry-After', String(Math.max(1, Math.ceil(emailCheck.retryAfterMs / 1000))));
      return res.status(429).json({ success: false, message: 'Too many test-email requests. Please try again later.' });
    }

    const success = await sendTestEmail(email);

    if (success) {
      return res.json({
        success: true,
        message: `Test email sent successfully to ${email}`,
        email,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send test email. Please check SendGrid configuration.',
      });
    }
  } catch (error) {
    console.error('[Email] Error sending test email:', error instanceof Error ? error.name : 'UnknownError');
    return res.status(500).json({
      success: false,
      message: 'Error sending test email',
      error: 'Unable to send test email',
    });
  }
});

// Mount unsubscribe routes
router.use('/', unsubscribeRoutes);

export default router;
