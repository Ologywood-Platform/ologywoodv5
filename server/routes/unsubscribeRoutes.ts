import express, { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { emailPreferences } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/email/unsubscribe?token=xxx
 * Handles email unsubscribe requests (CAN-SPAM/GDPR compliance)
 */
router.get('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing unsubscribe token',
      });
    }

    // Find email preference by unsubscribe token
    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection error',
      });
    }

    const preference = await db
      .select()
      .from(emailPreferences)
      .where(eq(emailPreferences.unsubscribeToken, token))
      .limit(1);

    if (!preference || preference.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Unsubscribe token not found',
      });
    }

    // Update email preferences - unsubscribe from all emails
    await db
      .update(emailPreferences)
      .set({
        bookingUpdates: false,
        newOpportunities: false,
        platformNews: false,
        weeklyDigest: false,
        reminders: false,
        unsubscribedAt: new Date(),
      })
      .where(eq(emailPreferences.id, preference[0].id));

    // Return success page
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - Ologywood</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #333;
            margin-bottom: 10px;
          }
          p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .success-icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          a {
            color: #7c3aed;
            text-decoration: none;
            font-weight: 600;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✓</div>
          <h1>Unsubscribed Successfully</h1>
          <p>You have been unsubscribed from Ologywood emails. You will no longer receive marketing or promotional emails from us.</p>
          <p>If you change your mind, you can manage your email preferences in your <a href="https://www.ologywood.com/dashboard">account settings</a>.</p>
          <p style="margin-top: 30px; font-size: 14px; color: #999;">
            <a href="https://www.ologywood.com">Return to Ologywood</a>
          </p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('[Unsubscribe] Error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your unsubscribe request',
    });
  }
});

export default router;
