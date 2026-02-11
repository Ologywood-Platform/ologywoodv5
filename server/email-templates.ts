/**
 * Additional Email Templates for Ologywood Platform
 * These complement the existing email.ts templates
 */

/**
 * Password Reset Email
 */
export function getPasswordResetEmailTemplate(params: {
  recipientName: string;
  resetLink: string;
  expiresIn: string;
}): { subject: string; html: string } {
  const { recipientName, resetLink, expiresIn } = params;

  return {
    subject: 'Reset Your Ologywood Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Password Reset Request</h2>
        <p>Hi ${recipientName},</p>
        <p>We received a request to reset your Ologywood password. Click the button below to create a new password.</p>
        
        <a href="${resetLink}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">
          Reset Password
        </a>
        
        <p style="color: #6b7280; font-size: 14px;">
          This link will expire in ${expiresIn}. If you didn't request a password reset, you can safely ignore this email.
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from Ologywood. Please do not reply to this email.
        </p>
      </div>
    `,
  };
}

/**
 * Payment Failed Email
 */
export function getPaymentFailedEmailTemplate(params: {
  recipientName: string;
  amount: string;
  currency: string;
  reason: string;
  retryDate?: string;
}): { subject: string; html: string } {
  const { recipientName, amount, currency, reason, retryDate } = params;

  return {
    subject: 'Payment Failed - Action Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Payment Failed</h2>
        <p>Hi ${recipientName},</p>
        <p>We attempted to process a payment of <strong>${currency} ${amount}</strong> for your Ologywood subscription, but it failed.</p>
        
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0;"><strong>Reason:</strong> ${reason}</p>
          ${retryDate ? `<p style="margin: 10px 0 0 0;">We'll retry on ${retryDate}.</p>` : ''}
        </div>
        
        <p>Please update your payment method to avoid service interruption:</p>
        
        <a href="https://ologywood.com/billing" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Update Payment Method
        </a>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          If you have questions about this charge, please contact our support team.
        </p>
      </div>
    `,
  };
}

/**
 * Subscription Upgraded Email
 */
export function getSubscriptionUpgradedEmailTemplate(params: {
  recipientName: string;
  oldPlan: string;
  newPlan: string;
  newPrice: string;
  currency: string;
  effectiveDate: string;
}): { subject: string; html: string } {
  const { recipientName, oldPlan, newPlan, newPrice, currency, effectiveDate } = params;

  return {
    subject: 'Subscription Upgraded - Welcome to Premium! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Subscription Upgraded!</h2>
        <p>Hi ${recipientName},</p>
        <p>Great news! Your subscription has been upgraded to <strong>${newPlan}</strong>.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Previous Plan:</strong> ${oldPlan}</p>
          <p><strong>New Plan:</strong> ${newPlan}</p>
          <p><strong>New Price:</strong> ${currency} ${newPrice}/month</p>
          <p><strong>Effective Date:</strong> ${effectiveDate}</p>
        </div>
        
        <p>You now have access to premium features including:</p>
        <ul style="line-height: 1.8;">
          <li>Priority booking requests</li>
          <li>Advanced analytics and insights</li>
          <li>Unlimited media gallery</li>
          <li>Custom branding options</li>
          <li>24/7 priority support</li>
        </ul>
        
        <a href="https://ologywood.com/dashboard" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Explore Premium Features
        </a>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from Ologywood. Please do not reply to this email.
        </p>
      </div>
    `,
  };
}

/**
 * Subscription Downgraded Email
 */
export function getSubscriptionDowngradedEmailTemplate(params: {
  recipientName: string;
  oldPlan: string;
  newPlan: string;
  newPrice: string;
  currency: string;
  effectiveDate: string;
}): { subject: string; html: string } {
  const { recipientName, oldPlan, newPlan, newPrice, currency, effectiveDate } = params;

  return {
    subject: 'Subscription Downgraded',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Subscription Downgraded</h2>
        <p>Hi ${recipientName},</p>
        <p>Your subscription has been downgraded from <strong>${oldPlan}</strong> to <strong>${newPlan}</strong>.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Previous Plan:</strong> ${oldPlan}</p>
          <p><strong>New Plan:</strong> ${newPlan}</p>
          <p><strong>New Price:</strong> ${currency} ${newPrice}/month</p>
          <p><strong>Effective Date:</strong> ${effectiveDate}</p>
        </div>
        
        <p>Some premium features will no longer be available. You can upgrade anytime from your dashboard.</p>
        
        <a href="https://ologywood.com/billing" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Manage Subscription
        </a>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from Ologywood. Please do not reply to this email.
        </p>
      </div>
    `,
  };
}

/**
 * Invoice/Billing Statement Email
 */
export function getInvoiceEmailTemplate(params: {
  recipientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: string;
  currency: string;
  items: Array<{ description: string; amount: string }>;
  dueDate?: string;
  invoiceUrl: string;
}): { subject: string; html: string } {
  const { recipientName, invoiceNumber, invoiceDate, amount, currency, items, dueDate, invoiceUrl } = params;

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${currency} ${item.amount}</td>
      </tr>
    `
    )
    .join('');

  return {
    subject: `Invoice #${invoiceNumber} - Ologywood`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Invoice #${invoiceNumber}</h2>
        <p>Hi ${recipientName},</p>
        <p>Your invoice for Ologywood services is ready. Please see the details below.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Invoice Date:</strong> ${invoiceDate}</p>
          ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ''}
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        </div>
        
        <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Description</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr style="background: #f9fafb;">
              <td style="padding: 10px; font-weight: bold;">Total</td>
              <td style="padding: 10px; text-align: right; font-weight: bold;">${currency} ${amount}</td>
            </tr>
          </tbody>
        </table>
        
        <a href="${invoiceUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          View Full Invoice
        </a>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from Ologywood. Please do not reply to this email.
        </p>
      </div>
    `,
  };
}

/**
 * Dispute/Issue Resolution Email
 */
export function getDisputeResolutionEmailTemplate(params: {
  recipientName: string;
  ticketNumber: string;
  issueDescription: string;
  resolution: string;
  ticketUrl: string;
}): { subject: string; html: string } {
  const { recipientName, ticketNumber, issueDescription, resolution, ticketUrl } = params;

  return {
    subject: `Issue Resolved - Ticket #${ticketNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Issue Resolved</h2>
        <p>Hi ${recipientName},</p>
        <p>We're happy to inform you that your support ticket has been resolved.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
          <p><strong>Issue:</strong> ${issueDescription}</p>
          <p><strong>Resolution:</strong> ${resolution}</p>
        </div>
        
        <p>If you have any follow-up questions or need further assistance, please don't hesitate to reach out.</p>
        
        <a href="${ticketUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          View Ticket Details
        </a>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from Ologywood. Please do not reply to this email.
        </p>
      </div>
    `,
  };
}

/**
 * Welcome/Onboarding Email Sequence - Email 1
 */
export function getWelcomeEmailTemplate(params: {
  recipientName: string;
  userType: 'artist' | 'venue';
}): { subject: string; html: string } {
  const { recipientName, userType } = params;
  const isArtist = userType === 'artist';

  return {
    subject: `Welcome to Ologywood, ${recipientName}! 🎵`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Welcome to Ologywood!</h2>
        <p>Hi ${recipientName},</p>
        <p>Thank you for joining Ologywood! We're excited to have you on board.</p>
        
        <p style="margin-top: 20px;">Here's what you can do next:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${isArtist
            ? `
            <h3 style="margin-top: 0; color: #8b5cf6;">For Artists:</h3>
            <ol style="line-height: 1.8;">
              <li><strong>Complete Your Profile</strong> - Add photos, bio, and availability</li>
              <li><strong>Set Your Rates</strong> - Define your booking fees and terms</li>
              <li><strong>Create a Rider</strong> - Specify technical and hospitality requirements</li>
              <li><strong>Start Receiving Bookings</strong> - Venues will discover your profile</li>
            </ol>
          `
            : `
            <h3 style="margin-top: 0; color: #8b5cf6;">For Venues:</h3>
            <ol style="line-height: 1.8;">
              <li><strong>Complete Your Venue Profile</strong> - Add details and photos</li>
              <li><strong>Browse Artists</strong> - Discover talented performers</li>
              <li><strong>Send Booking Requests</strong> - Connect with artists directly</li>
              <li><strong>Manage Your Events</strong> - Track all bookings in one place</li>
            </ol>
          `}
        </div>
        
        <a href="https://ologywood.com/dashboard" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Go to Dashboard
        </a>
        
        <p>If you have any questions, our support team is here to help!</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from Ologywood. Please do not reply to this email.
        </p>
      </div>
    `,
  };
}

/**
 * Onboarding Email Sequence - Email 2 (Tips)
 */
export function getOnboardingTipsEmailTemplate(params: {
  recipientName: string;
  userType: 'artist' | 'venue';
}): { subject: string; html: string } {
  const { recipientName, userType } = params;
  const isArtist = userType === 'artist';

  return {
    subject: `Tips to Get Started on Ologywood`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Getting Started Tips</h2>
        <p>Hi ${recipientName},</p>
        <p>Here are some tips to help you make the most of Ologywood:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${isArtist
            ? `
            <h3 style="margin-top: 0; color: #8b5cf6;">Pro Tips for Artists:</h3>
            <ul style="line-height: 1.8;">
              <li><strong>Use High-Quality Photos</strong> - Professional headshots increase booking chances</li>
              <li><strong>Write a Compelling Bio</strong> - Tell venues about your style and experience</li>
              <li><strong>Be Responsive</strong> - Quick responses to booking inquiries improve your rating</li>
              <li><strong>Create Detailed Riders</strong> - Clear requirements help venues plan better</li>
              <li><strong>Update Availability</strong> - Keep your calendar current to avoid conflicts</li>
            </ul>
          `
            : `
            <h3 style="margin-top: 0; color: #8b5cf6;">Pro Tips for Venues:</h3>
            <ul style="line-height: 1.8;">
              <li><strong>Browse by Genre</strong> - Filter artists by music style and location</li>
              <li><strong>Read Reviews</strong> - Check ratings and feedback from other venues</li>
              <li><strong>Send Clear Requests</strong> - Include event details and expectations</li>
              <li><strong>Confirm Early</strong> - Book artists well in advance for better availability</li>
              <li><strong>Communicate Professionally</strong> - Build long-term relationships with artists</li>
            </ul>
          `}
        </div>
        
        <p>Questions? Check out our <a href="https://ologywood.com/help" style="color: #8b5cf6; text-decoration: none;">Help Center</a> or contact support.</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from Ologywood. Please do not reply to this email.
        </p>
      </div>
    `,
  };
}
