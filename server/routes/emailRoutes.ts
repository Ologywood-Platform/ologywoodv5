/**
 * Email Routes for Ologywood
 * Handles email sending endpoints
 */

import { Router } from 'express';
import { sendTestEmail } from '../email/emailService';
import unsubscribeRoutes from './unsubscribeRoutes';

const router = Router();

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
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required',
      });
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
    console.error('[Email] Error sending test email:', error);
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
