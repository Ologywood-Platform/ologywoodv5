# Ologywood Email System Documentation

## Overview

The Ologywood platform includes a comprehensive email notification system that sends transactional and informational emails to users across the artist booking lifecycle. All emails are delivered via SendGrid with automatic fallback to Forge API.

## Email Templates

### 1. Authentication & Account Management

#### Password Reset Email
- **Trigger**: User requests password reset
- **Recipient**: User requesting reset
- **Content**: Password reset link with 24-hour expiration
- **Purpose**: Secure account recovery
- **Template**: `getPasswordResetEmailTemplate()`

#### Welcome Email (Artist)
- **Trigger**: New artist account creation
- **Recipient**: New artist
- **Content**: Platform overview, next steps, and dashboard link
- **Purpose**: Onboarding and engagement
- **Template**: `getWelcomeEmailTemplate({ userType: 'artist' })`

#### Welcome Email (Venue)
- **Trigger**: New venue account creation
- **Recipient**: New venue
- **Content**: Platform overview, artist browsing guide, next steps
- **Purpose**: Onboarding and engagement
- **Template**: `getWelcomeEmailTemplate({ userType: 'venue' })`

#### Onboarding Tips (Artist)
- **Trigger**: Day 2 after artist signup
- **Recipient**: New artist
- **Content**: Pro tips for profile optimization and booking success
- **Purpose**: Engagement and success enablement
- **Template**: `getOnboardingTipsEmailTemplate({ userType: 'artist' })`

#### Onboarding Tips (Venue)
- **Trigger**: Day 2 after venue signup
- **Recipient**: New venue
- **Content**: Pro tips for finding artists and managing bookings
- **Purpose**: Engagement and success enablement
- **Template**: `getOnboardingTipsEmailTemplate({ userType: 'venue' })`

---

### 2. Subscription & Billing

#### Subscription Created
- **Trigger**: User completes subscription purchase
- **Recipient**: Subscriber
- **Content**: Subscription confirmation, trial details (if applicable), feature overview
- **Purpose**: Confirmation and feature awareness
- **Function**: `sendSubscriptionCreatedEmail()`

#### Trial Ending Reminder
- **Trigger**: 3 days before trial expiration
- **Recipient**: Trial subscriber
- **Content**: Trial expiration date, upgrade prompt, feature benefits
- **Purpose**: Reduce churn and encourage conversion
- **Function**: `sendTrialEndingEmail()`

#### Subscription Upgraded
- **Trigger**: User upgrades to higher tier
- **Recipient**: Upgrading user
- **Content**: New plan details, pricing, premium features unlocked
- **Purpose**: Confirmation and feature education
- **Template**: `getSubscriptionUpgradedEmailTemplate()`

#### Subscription Downgraded
- **Trigger**: User downgrades to lower tier
- **Recipient**: Downgrading user
- **Content**: New plan details, pricing, feature limitations
- **Purpose**: Confirmation and re-engagement opportunity
- **Template**: `getSubscriptionDowngradedEmailTemplate()`

#### Subscription Canceled
- **Trigger**: User cancels subscription
- **Recipient**: Canceling user
- **Content**: Cancellation confirmation, reactivation option, feedback request
- **Purpose**: Confirmation and win-back opportunity
- **Function**: `sendSubscriptionCanceledEmail()`

#### Payment Failed
- **Trigger**: Payment processing fails
- **Recipient**: User with failed payment
- **Content**: Failure reason, retry date, payment method update link
- **Purpose**: Urgent action required to maintain subscription
- **Template**: `getPaymentFailedEmailTemplate()`

#### Invoice
- **Trigger**: Monthly billing cycle or on-demand request
- **Recipient**: Subscriber
- **Content**: Invoice number, itemized charges, due date, payment link
- **Purpose**: Billing documentation and record-keeping
- **Template**: `getInvoiceEmailTemplate()`

---

### 3. Booking Management

#### Booking Request
- **Trigger**: Venue sends booking request to artist
- **Recipient**: Artist
- **Content**: Venue name, event date, event details, dashboard link
- **Purpose**: Alert artist to new booking opportunity
- **Function**: `sendBookingRequestEmail()`

#### Booking Confirmation
- **Trigger**: Both parties accept booking
- **Recipient**: Both artist and venue
- **Content**: Confirmed event details, venue address, dashboard link
- **Purpose**: Confirmation and event details reference
- **Function**: `sendBookingConfirmationEmail()`

#### Booking Cancellation
- **Trigger**: Either party cancels confirmed booking
- **Recipient**: Both artist and venue
- **Content**: Cancellation notice, event details, support contact
- **Purpose**: Notification of booking cancellation
- **Function**: `sendBookingCancellationEmail()`

#### Booking Reminder
- **Trigger**: 7 days before confirmed event
- **Recipient**: Both artist and venue
- **Content**: Event date, venue details, confirmation status
- **Purpose**: Reduce no-shows and ensure preparedness
- **Function**: `sendBookingReminder()`

#### Availability Update Notification
- **Trigger**: Artist updates availability calendar
- **Recipient**: Venues with pending requests
- **Content**: Updated availability, new booking window, action prompt
- **Purpose**: Alert venues to new booking opportunities
- **Function**: `sendAvailabilityUpdateNotification()`

---

### 4. Contracts & Riders

#### Contract for Signature
- **Trigger**: Artist or venue initiates contract
- **Recipient**: Recipient party
- **Content**: Contract details, signature link, deadline
- **Purpose**: Contract execution workflow
- **Function**: `sendContractForSignature()`

#### Contract Signed
- **Trigger**: Contract is fully signed by both parties
- **Recipient**: Both parties
- **Content**: Contract confirmation, signed document link, next steps
- **Purpose**: Confirmation and record-keeping
- **Function**: `sendContractSigned()`

---

### 5. Reviews & Feedback

#### Review Response
- **Trigger**: Artist or venue responds to review
- **Recipient**: Reviewer
- **Content**: Response message, rating, profile link
- **Purpose**: Engagement and reputation management
- **Function**: `sendReviewResponseEmail()`

#### Venue Review Notification
- **Trigger**: Artist leaves review for venue
- **Recipient**: Venue
- **Content**: Review content, rating, response link
- **Purpose**: Alert venue to feedback
- **Function**: `sendVenueReviewNotificationEmail()`

---

### 6. Payments & Refunds

#### Payment Receipt
- **Trigger**: Successful payment processed
- **Recipient**: Payer
- **Content**: Receipt number, amount, items, invoice link
- **Purpose**: Payment documentation and record-keeping
- **Function**: `sendPaymentReceipt()`

#### Refund Notification
- **Trigger**: Refund is processed
- **Recipient**: User receiving refund
- **Content**: Refund amount, reason, processing timeline
- **Purpose**: Confirmation and timeline expectation
- **Function**: `sendRefundNotification()`

---

### 7. Support & Disputes

#### Dispute Resolution
- **Trigger**: Support ticket is resolved
- **Recipient**: Ticket creator
- **Content**: Ticket number, issue summary, resolution details
- **Purpose**: Confirmation and closure
- **Template**: `getDisputeResolutionEmailTemplate()`

#### Contact Form Confirmation
- **Trigger**: User submits contact form
- **Recipient**: User
- **Content**: Confirmation message, support ticket number, response timeline
- **Purpose**: Acknowledge receipt and set expectations
- **Function**: Contact form router (existing)

---

### 8. Marketing & Engagement

#### Newsletter Subscription
- **Trigger**: User subscribes to newsletter
- **Recipient**: Subscriber
- **Content**: Welcome message, unsubscribe link, first newsletter
- **Purpose**: Confirmation and engagement
- **Function**: `sendNewsletterSubscriptionEmail()`

---

### 9. Verification & Compliance

#### Venue Verification Email
- **Trigger**: Venue account requires verification
- **Recipient**: Venue owner
- **Content**: Verification link, requirements, deadline
- **Purpose**: Account verification workflow
- **Function**: `sendVenueVerificationEmail()`

#### Venue Verification Confirmation
- **Trigger**: Venue verification is approved
- **Recipient**: Venue owner
- **Content**: Verification confirmation, badge notification, next steps
- **Purpose**: Confirmation and status update
- **Function**: `sendVenueVerificationConfirmationEmail()`

---

## Email Delivery System

### Architecture

```
User Action
    ↓
Trigger Event
    ↓
Email Template Generation
    ↓
SendGrid API (Primary)
    ↓
Forge API (Fallback)
    ↓
User Inbox
```

### Email Service Configuration

**File**: `/home/ubuntu/ologywood/server/email.ts`

**Primary Service**: SendGrid
- API Key: `SENDGRID_API_KEY`
- From Email: `SENDGRID_FROM_EMAIL`
- Endpoint: `https://api.sendgrid.com/v3/mail/send`

**Fallback Service**: Forge API
- API Key: `BUILT_IN_FORGE_API_KEY`
- URL: `BUILT_IN_FORGE_API_URL`
- Endpoint: `/notification/email`

### Retry Logic

- **Primary Attempt**: Forge API (if configured)
- **Fallback**: SendGrid (if Forge fails or not configured)
- **Failure Handling**: Logged to console with error details
- **No Automatic Retry**: Failed emails are logged but not automatically retried

---

## Testing Email Templates

### Running the Email Test Suite

```bash
cd /home/ubuntu/ologywood
node --import tsx test-emails.mjs [test-email-address]
```

**Example**:
```bash
node --import tsx test-emails.mjs garychisolm30@gmail.com
```

### Test Results

The test suite sends all 14 email templates to the specified email address and reports:
- Total templates tested
- Success count
- Failure count
- Success rate percentage
- Detailed results for each template

### Expected Output

```
🚀 Starting Email Template Test Suite
📧 Test email: garychisolm30@gmail.com
────────────────────────────────────────────────────────────

📊 Test Results Summary:
   Total Templates: 14
   ✅ Successful: 14
   ❌ Failed: 0
   📈 Success Rate: 100%

📋 Detailed Results:
1. ✅ Password Reset
2. ✅ Payment Failed
3. ✅ Subscription Upgraded
4. ✅ Subscription Downgraded
5. ✅ Invoice
6. ✅ Dispute Resolution
7. ✅ Welcome Email (Artist)
8. ✅ Welcome Email (Venue)
9. ✅ Onboarding Tips (Artist)
10. ✅ Onboarding Tips (Venue)
11. ✅ Booking Request
12. ✅ Booking Confirmation
13. ✅ Subscription Created
14. ✅ Trial Ending
```

---

## Email Template Files

### Main Email Service
- **File**: `server/email.ts`
- **Contains**: 18 email sending functions
- **Functions**: Booking, subscription, contract, review, payment, verification emails

### Additional Templates
- **File**: `server/email-templates.ts`
- **Contains**: 8 template generator functions
- **Functions**: Password reset, payment failed, subscription changes, invoices, disputes, onboarding

### Testing Service
- **File**: `server/emailTestingService.ts`
- **Contains**: Email test utilities and batch testing
- **Functions**: `testAllEmailTemplates()`, `getSummary()`

### Testing Endpoint
- **File**: `server/routers/emailTesting.ts`
- **Contains**: TRPC endpoints for email testing
- **Endpoints**: `emailTesting.testAllTemplates`, `emailTesting.testTemplate`

### Contact Form Handler
- **File**: `server/routers/contact.ts`
- **Contains**: Contact form submission and auto-reply
- **Features**: Sends to support team + confirmation to user

---

## Email Customization

### Modifying Email Templates

1. **Locate the template** in `server/email.ts` or `server/email-templates.ts`
2. **Update the HTML content** with your changes
3. **Test the template** using the test suite
4. **Verify in your inbox** that changes appear correctly

### Adding New Email Templates

1. **Create a new function** in `server/email-templates.ts`:
   ```typescript
   export function getMyNewEmailTemplate(params: {
     recipientName: string;
     // ... other params
   }): { subject: string; html: string } {
     return {
       subject: 'Email Subject',
       html: `<div>Email content</div>`,
     };
   }
   ```

2. **Add to test suite** in `server/emailTestingService.ts`:
   ```typescript
   const template = getMyNewEmailTemplate({ /* params */ });
   await sendEmail({
     to: testEmail,
     subject: template.subject,
     html: template.html,
   });
   ```

3. **Test** using the email test suite

---

## Email Best Practices

### Design Principles
- **Responsive**: All emails render correctly on mobile and desktop
- **Accessible**: High contrast, clear typography, semantic HTML
- **Branded**: Consistent colors (purple #8b5cf6), logo, footer
- **Clear CTAs**: Obvious action buttons with descriptive text
- **Unsubscribe**: All emails include unsubscribe options

### Content Guidelines
- **Subject Lines**: Clear, action-oriented, under 50 characters
- **Greeting**: Personalized with recipient name
- **Body**: Concise, scannable, 2-3 main points maximum
- **CTA**: One primary action per email
- **Footer**: Company info, unsubscribe link, legal notices

### Deliverability
- **From Address**: Consistent sender (noreply@ologywood.com)
- **Reply-To**: Support email (info@ologywood.com) where applicable
- **List-Unsubscribe**: Header included for compliance
- **Authentication**: SPF, DKIM configured via SendGrid
- **Testing**: All templates tested before deployment

---

## Troubleshooting

### Email Not Sending

1. **Check Configuration**:
   - Verify `SENDGRID_API_KEY` is set
   - Verify `SENDGRID_FROM_EMAIL` is set
   - Check SendGrid dashboard for API key validity

2. **Check Logs**:
   - Review server logs for email sending errors
   - Look for "[Email]" prefix in logs
   - Check SendGrid Activity Feed for delivery status

3. **Test Delivery**:
   - Run email test suite to verify service
   - Check spam/junk folder
   - Verify recipient email address is correct

### Email Styling Issues

1. **Check Email Client**:
   - Different clients render CSS differently
   - Test in Gmail, Outlook, Apple Mail
   - Use inline styles for better compatibility

2. **Verify HTML**:
   - Ensure all styles are inline
   - Check for unclosed tags
   - Validate HTML structure

### Contact Form Issues

1. **Check Recipient Email**:
   - Verify `SENDGRID_FROM_EMAIL` is set correctly
   - Ensure email is not being filtered
   - Check SendGrid bounce list

2. **Verify Form Submission**:
   - Check server logs for submission errors
   - Verify TRPC endpoint is responding
   - Check browser console for client-side errors

---

## Email Metrics & Analytics

### Tracking
- **Sent**: Logged at time of sending
- **Delivered**: Tracked via SendGrid webhooks
- **Opened**: Tracked via SendGrid (if enabled)
- **Clicked**: Tracked via SendGrid (if enabled)
- **Bounced**: Tracked via SendGrid webhooks
- **Unsubscribed**: Tracked via SendGrid webhooks

### Accessing Metrics
1. Log in to SendGrid dashboard
2. Navigate to "Activity" → "Mail Activity"
3. Filter by date range and email address
4. View delivery status and engagement metrics

---

## Future Enhancements

1. **Email Scheduling**: Queue emails for optimal delivery times
2. **A/B Testing**: Test subject lines and content variations
3. **Personalization**: Dynamic content based on user preferences
4. **Segmentation**: Different templates for different user types
5. **Analytics Dashboard**: In-app email metrics and performance tracking
6. **Email Preferences**: User-controlled frequency and content preferences
7. **Template Versioning**: Track and rollback email template changes
8. **Automated Sequences**: Multi-email onboarding and nurture campaigns

---

## Support

For email system issues or questions:
- **Email**: info@ologywood.com
- **Phone**: 678-525-0891
- **Dashboard**: Support ticket system

---

**Last Updated**: February 11, 2026
**Version**: 1.0
**Status**: Production Ready
