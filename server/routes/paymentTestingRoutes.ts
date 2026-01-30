/**
 * Payment Testing Routes
 * Provides endpoints for testing payment redirects and verifying booking status updates
 */

import { Router, Request, Response } from 'express';
import { PaymentTestingService } from '../services/paymentTestingService';

const router = Router();

/**
 * GET /api/test/payment/success/:bookingId
 * Test payment success redirect
 */
router.get('/success/:bookingId', async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID',
      });
    }

    const result = await PaymentTestingService.testPaymentSuccess(bookingId);

    res.json({
      success: result.success,
      result,
    });
  } catch (error) {
    console.error('[PaymentTestingRoutes] Error testing payment success:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/test/payment/failure/:bookingId
 * Test payment failure redirect
 */
router.get('/failure/:bookingId', async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID',
      });
    }

    const result = await PaymentTestingService.testPaymentFailure(bookingId);

    res.json({
      success: result.success,
      result,
    });
  } catch (error) {
    console.error('[PaymentTestingRoutes] Error testing payment failure:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/test/payment/retry/:bookingId
 * Test payment retry flow
 */
router.get('/retry/:bookingId', async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID',
      });
    }

    const result = await PaymentTestingService.testPaymentRetry(bookingId);

    res.json({
      success: result.success,
      result,
    });
  } catch (error) {
    console.error('[PaymentTestingRoutes] Error testing payment retry:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/test/payment/all/:bookingId
 * Run all payment tests for a booking
 */
router.get('/all/:bookingId', async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID',
      });
    }

    const results = await PaymentTestingService.runAllPaymentTests(bookingId);

    res.json({
      success: true,
      testCount: results.length,
      results,
      summary: {
        passed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
    });
  } catch (error) {
    console.error('[PaymentTestingRoutes] Error running all payment tests:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/test/payment/verify-urls
 * Verify payment redirect URLs
 */
router.post('/verify-urls', async (req: Request, res: Response) => {
  try {
    const { successUrl, failureUrl, retryUrl } = req.body;

    if (!successUrl || !failureUrl || !retryUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required URLs: successUrl, failureUrl, retryUrl',
      });
    }

    const verification = {
      successUrl: {
        valid: successUrl.includes('/payment/success/'),
        url: successUrl,
      },
      failureUrl: {
        valid: failureUrl.includes('/payment/failure/'),
        url: failureUrl,
      },
      retryUrl: {
        valid: retryUrl.includes('/payment/retry/'),
        url: retryUrl,
      },
      allValid: 
        successUrl.includes('/payment/success/') &&
        failureUrl.includes('/payment/failure/') &&
        retryUrl.includes('/payment/retry/'),
    };

    res.json({
      success: true,
      verification,
    });
  } catch (error) {
    console.error('[PaymentTestingRoutes] Error verifying URLs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
