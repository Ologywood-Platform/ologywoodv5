/**
 * Email Routes for Ologywood
 * Handles email sending endpoints
 */

import { Router } from 'express';
import { sendTestEmail } from '../email/emailService';

const router = Router();

/**
 * POST /api/email/test
 * Send a test email to verify the email system is working
 */
router.post('/test', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required',
      });
    }

    console.log(`[Email] Sending test email to ${email}`);
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
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
