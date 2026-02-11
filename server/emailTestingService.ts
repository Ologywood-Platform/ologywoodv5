/**
 * Email Testing Service for Ologywood
 * Provides utilities to test all email templates
 */

import { sendEmail } from './email';
import * as emailTemplates from './email-templates';
import {
  sendBookingRequestEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendSubscriptionCreatedEmail,
  sendTrialEndingEmail,
  sendSubscriptionCanceledEmail,
  sendReviewResponseEmail,
  sendVenueReviewNotificationEmail,
  sendAvailabilityUpdateNotification,
  sendBookingReminder,
  sendPaymentReceipt,
  sendRefundNotification,
  sendContractSigned,
  sendContractForSignature,
  sendNewsletterSubscriptionEmail,
  sendVenueVerificationEmail,
  sendVenueVerificationConfirmationEmail,
} from './email';

export interface EmailTestResult {
  templateName: string;
  status: 'success' | 'failed';
  message: string;
  timestamp: string;
}

/**
 * Test all email templates
 */
export async function testAllEmailTemplates(testEmail: string): Promise<EmailTestResult[]> {
  const results: EmailTestResult[] = [];

  // Test 1: Password Reset
  try {
    const template = emailTemplates.getPasswordResetEmailTemplate({
      recipientName: 'Test User',
      resetLink: 'https://ologywood.com/reset-password?token=test123',
      expiresIn: '24 hours',
    });
    await sendEmail({
      to: testEmail,
      subject: template.subject,
      html: template.html,
    });
    results.push({
      templateName: 'Password Reset',
      status: 'success',
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      templateName: 'Password Reset',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  // Test 2: Payment Failed
  try {
    const template = emailTemplates.getPaymentFailedEmailTemplate({
      recipientName: 'Test User',
      amount: '29.99',
      currency: 'USD',
      reason: 'Insufficient funds',
      retryDate: 'February 15, 2026',
    });
    await sendEmail({
      to: testEmail,
      subject: template.subject,
      html: template.html,
    });
    results.push({
      templateName: 'Payment Failed',
      status: 'success',
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      templateName: 'Payment Failed',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  // Test 3: Subscription Upgraded
  try {
    const template = emailTemplates.getSubscriptionUpgradedEmailTemplate({
      recipientName: 'Test User',
      oldPlan: 'Basic',
      newPlan: 'Premium',
      newPrice: '49.99',
      currency: 'USD',
      effectiveDate: 'February 11, 2026',
    });
    await sendEmail({
      to: testEmail,
      subject: template.subject,
      html: template.html,
    });
    results.push({
      templateName: 'Subscription Upgraded',
      status: 'success',
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      templateName: 'Subscription Upgraded',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  // Test 4: Subscription Downgraded
  try {
    const template = emailTemplates.getSubscriptionDowngradedEmailTemplate({
      recipientName: 'Test User',
      oldPlan: 'Premium',
      newPlan: 'Basic',
      newPrice: '19.99',
      currency: 'USD',
      effectiveDate: 'February 11, 2026',
    });
    await sendEmail({
      to: testEmail,
      subject: template.subject,
      html: template.html,
    });
    results.push({
      templateName: 'Subscription Downgraded',
      status: 'success',
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      templateName: 'Subscription Downgraded',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  // Test 5: Invoice
  try {
    const template = emailTemplates.getInvoiceEmailTemplate({
      recipientName: 'Test User',
      invoiceNumber: 'INV-2026-001',
      invoiceDate: 'February 11, 2026',
      amount: '29.99',
      currency: 'USD',
      items: [
        { description: 'Ologywood Premium Subscription (Monthly)', amount: '29.99' },
      ],
      dueDate: 'February 18, 2026',
      invoiceUrl: 'https://ologywood.com/invoices/INV-2026-001',
    });
    await sendEmail({
      to: testEmail,
      subject: template.subject,
      html: template.html,
    });
    results.push({
      templateName: 'Invoice',
      status: 'success',
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      templateName: 'Invoice',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  // Test 6: Dispute Resolution
  try {
    const template = emailTemplates.getDisputeResolutionEmailTemplate({
      recipientName: 'Test User',
      ticketNumber: 'TKT-2026-001',
      issueDescription: 'Payment processing error',
      resolution: 'Payment has been refunded to your account. Please allow 3-5 business days for the funds to appear.',
      ticketUrl: 'https://ologywood.com/support/tickets/TKT-2026-001',
    });
    await sendEmail({
      to: testEmail,
      subject: template.subject,
      html: template.html,
    });
    results.push({
      templateName: 'Dispute Resolution',
      status: 'success',
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      templateName: 'Dispute Resolution',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  // Test 7: Welcome Email (Artist)
  try {
    const template = emailTemplates.getWelcomeEmailTemplate({
      recipientName: 'Test Artist',
      userType: 'artist',
    });
    await sendEmail({
      to: testEmail,
      subject: template.subject,
      html: template.html,
    });
    results.push({
      templateName: 'Welcome Email (Artist)',
      status: 'success',
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      templateName: 'Welcome Email (Artist)',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  // Test 8: Welcome Email (Venue)
  try {
    const template = emailTemplates.getWelcomeEmailTemplate({
      recipientName: 'Test Venue',
      userType: 'venue',
    });
    await sendEmail({
      to: testEmail,
      subject: template.subject,
      html: template.html,
    });
    results.push({
      templateName: 'Welcome Email (Venue)',
      status: 'success',
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      templateName: 'Welcome Email (Venue)',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  // Test 9: Onboarding Tips (Artist)
  try {
    const template = emailTemplates.getOnboardingTipsEmailTemplate({
      recipientName: 'Test Artist',
      userType: 'artist',
    });
    await sendEmail({
      to: testEmail,
      subject: template.subject,
      html: template.html,
    });
    results.push({
      templateName: 'Onboarding Tips (Artist)',
      status: 'success',
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      templateName: 'Onboarding Tips (Artist)',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  // Test 10: Onboarding Tips (Venue)
  try {
    const template = emailTemplates.getOnboardingTipsEmailTemplate({
      recipientName: 'Test Venue',
      userType: 'venue',
    });
    await sendEmail({
      to: testEmail,
      subject: template.subject,
      html: template.html,
    });
    results.push({
      templateName: 'Onboarding Tips (Venue)',
      status: 'success',
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      templateName: 'Onboarding Tips (Venue)',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  // Test 11: Booking Request
  try {
    await sendBookingRequestEmail({
      artistEmail: testEmail,
      artistName: 'Test Artist',
      venueName: 'The Grand Theater',
      eventDate: 'March 15, 2026',
      eventDetails: 'Live music event - 2 hour performance',
    });
    results.push({
      templateName: 'Booking Request',
      status: 'success',
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      templateName: 'Booking Request',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  // Test 12: Booking Confirmation
  try {
    await sendBookingConfirmationEmail({
      recipientEmail: testEmail,
      recipientName: 'Test User',
      otherPartyName: 'The Grand Theater',
      eventDate: 'March 15, 2026',
      venueName: 'The Grand Theater',
      venueAddress: '123 Main St, Atlanta, GA 30303',
    });
    results.push({
      templateName: 'Booking Confirmation',
      status: 'success',
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      templateName: 'Booking Confirmation',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  // Test 13: Subscription Created
  try {
    await sendSubscriptionCreatedEmail({
      artistEmail: testEmail,
      artistName: 'Test Artist',
      trialEndDate: 'February 25, 2026',
    });
    results.push({
      templateName: 'Subscription Created',
      status: 'success',
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      templateName: 'Subscription Created',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  // Test 14: Trial Ending
  try {
    await sendTrialEndingEmail({
      artistEmail: testEmail,
      artistName: 'Test Artist',
      daysRemaining: 3,
    });
    results.push({
      templateName: 'Trial Ending',
      status: 'success',
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      templateName: 'Trial Ending',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  return results;
}

/**
 * Get summary of test results
 */
export function getSummary(results: EmailTestResult[]) {
  const successful = results.filter((r) => r.status === 'success').length;
  const failed = results.filter((r) => r.status === 'failed').length;

  return {
    total: results.length,
    successful,
    failed,
    successRate: Math.round((successful / results.length) * 100),
  };
}
