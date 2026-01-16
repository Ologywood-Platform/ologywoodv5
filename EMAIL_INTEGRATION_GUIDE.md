# Email Integration Guide for Contract Management

This guide explains how to configure and use the email notification system for the contract management features in Ologywood.

## Overview

The contract management system includes automated email notifications for:
- Contract creation and sending
- Signature requests
- Signature confirmations
- Event reminders (7 days, 3 days, 1 day before event)
- Contract expiration warnings

## Email Service Architecture

### Built-in Email API

Ologywood uses a built-in notification API for sending emails. The email service is already configured in `server/email.ts` and uses the following environment variables:

- `BUILT_IN_FORGE_API_URL` - API endpoint for sending emails
- `BUILT_IN_FORGE_API_KEY` - API authentication key

These are automatically injected by the Manus platform.

### Contract Notification Service

The contract notification service (`server/contractNotificationService.ts`) provides specialized functions for contract-related emails:

```typescript
// Send contract to both parties
await sendContractNotification({
  contractId: 1,
  artistEmail: 'artist@example.com',
  artistName: 'John Smith',
  venueEmail: 'venue@example.com',
  venueName: 'The Blue Note',
  eventDate: '2026-02-20',
  eventTime: '20:00',
});

// Send signature request reminder
await sendSignatureRequestReminder({
  recipientEmail: 'artist@example.com',
  recipientName: 'John Smith',
  recipientRole: 'artist',
  contractId: 1,
  daysUntilEvent: 5,
});

// Send signature confirmation
await sendSignatureConfirmation({
  recipientEmail: 'venue@example.com',
  recipientName: 'The Blue Note',
  signerName: 'John Smith',
  signerRole: 'artist',
  contractId: 1,
});

// Send event reminder
await sendEventReminder({
  recipientEmail: 'artist@example.com',
  recipientName: 'John Smith',
  venueName: 'The Blue Note',
  eventDate: '2026-02-20',
  eventTime: '20:00',
  daysUntilEvent: 7,
});
```

## Integration Points

### 1. Contract Creation

When a contract is created, send notifications to both parties:

```typescript
// In contracts router
const contract = await db.createContract({ ... });

// Send notifications
await contractNotificationService.sendContractNotification({
  contractId: contract.id,
  artistEmail: booking.artistEmail,
  artistName: booking.artistName,
  venueEmail: booking.venueEmail,
  venueName: booking.venueName,
  eventDate: booking.eventDate,
  eventTime: booking.eventTime,
});
```

### 2. Signature Capture

When a signature is captured, notify the other party:

```typescript
// In signature capture endpoint
const signature = await captureSignature({ ... });

// Determine who signed and notify the other party
if (signature.signerRole === 'artist') {
  // Notify venue that artist signed
  await contractNotificationService.sendSignatureConfirmation({
    recipientEmail: venue.email,
    recipientName: venue.name,
    signerName: artist.name,
    signerRole: 'artist',
    contractId: signature.contractId,
  });
} else {
  // Notify artist that venue signed
  await contractNotificationService.sendSignatureConfirmation({
    recipientEmail: artist.email,
    recipientName: artist.name,
    signerName: venue.name,
    signerRole: 'venue',
    contractId: signature.contractId,
  });
}
```

### 3. Automated Reminders

The `contractReminderScheduler` automatically sends reminders at configured intervals:

```typescript
// Reminders are sent 7 days, 3 days, and 1 day before event
// The scheduler runs every hour and checks for contracts needing reminders

// To manually trigger reminders:
await contractReminderScheduler.sendReminders({
  daysBeforeEvent: 7,
});
```

### 4. Reminder Notifications

When reminders are sent, use the email service:

```typescript
// Send reminder to artist
await contractNotificationService.sendEventReminder({
  recipientEmail: artist.email,
  recipientName: artist.name,
  venueName: booking.venueName,
  eventDate: booking.eventDate,
  eventTime: booking.eventTime,
  daysUntilEvent: 7,
});

// Send reminder to venue
await contractNotificationService.sendEventReminder({
  recipientEmail: venue.email,
  recipientName: venue.name,
  venueName: venue.name,
  eventDate: booking.eventDate,
  eventTime: booking.eventTime,
  daysUntilEvent: 7,
});
```

## Email Templates

All email templates are defined in `server/templates/contractNotificationEmails.ts` and include:

### Contract Notification Email
- Professional header with Ologywood logo
- Contract details (event date, time, venue)
- Call-to-action buttons for signing
- Contract preview

### Signature Request Reminder
- Personalized greeting
- Contract summary
- Days remaining until event
- Direct link to sign contract
- Support contact information

### Signature Confirmation
- Notification that other party has signed
- Contract status update
- Next steps information
- Event details

### Event Reminder
- Event date and time
- Venue information
- Performance details
- Confirmation of contract status
- Support contact information

## Configuration

### Environment Variables

The email system uses these environment variables (automatically set by Manus):

```
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
```

### SMTP Configuration (Optional)

For custom SMTP configuration, update the email service:

```typescript
// In server/email.ts
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});
```

## Testing Email Delivery

### Test Email Sending

```typescript
// In a test endpoint
import * as email from './email';

export const testEmailRouter = router({
  sendTest: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const success = await email.sendEmail({
        to: input.email,
        subject: 'Test Email from Ologywood',
        html: '<h1>Test Email</h1><p>This is a test email.</p>',
      });
      
      return { success };
    }),
});
```

### Monitor Email Delivery

Check the server logs for email delivery status:

```
[Email] Email sent successfully to: artist@example.com
[Email] Failed to send email: 500 Internal Server Error
```

## Troubleshooting

### Emails Not Being Sent

1. **Check API Key**: Verify `BUILT_IN_FORGE_API_KEY` is set correctly
2. **Check API URL**: Verify `BUILT_IN_FORGE_API_URL` is accessible
3. **Check Email Address**: Verify recipient email is valid
4. **Check Logs**: Review server logs for error messages

### Emails Going to Spam

1. **Add SPF Record**: Configure SPF record for your domain
2. **Add DKIM**: Configure DKIM signing for emails
3. **Add DMARC**: Configure DMARC policy
4. **Test Deliverability**: Use tools like Mail-tester.com to check email quality

### Rate Limiting

The email API may have rate limits. If you hit rate limits:

1. Implement exponential backoff in retry logic
2. Queue emails for batch sending
3. Contact Manus support for rate limit increases

## Best Practices

1. **Always Include Unsubscribe Link**: Add unsubscribe links in all emails
2. **Use Personalization**: Include recipient name in greeting
3. **Test Templates**: Test all email templates before deployment
4. **Monitor Delivery**: Track email delivery rates and bounces
5. **Handle Failures**: Implement retry logic for failed emails
6. **Log Events**: Log all email events for audit trail

## Next Steps

1. Test email delivery with test endpoint
2. Integrate email sending into contract creation workflow
3. Configure reminder scheduler to run automatically
4. Monitor email delivery rates in production
5. Gather user feedback on email content and frequency

## Support

For issues with email delivery, contact Manus support at https://help.manus.im
