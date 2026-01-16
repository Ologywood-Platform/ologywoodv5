# SMTP Email Configuration Guide

## Overview

This guide explains how to configure SMTP email delivery for the Ologywood artist booking platform. Email notifications are critical for contract management, support tickets, and booking confirmations.

## Environment Variables Required

Add the following environment variables to your `.env` or `.env.production` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_EMAIL=noreply@ologywood.com
SMTP_FROM_NAME=Ologywood

# Email Configuration
EMAIL_ENABLED=true
EMAIL_RETRY_ATTEMPTS=3
EMAIL_RETRY_DELAY=5000
```

## Popular Email Providers

### Gmail (Recommended for Testing)

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App-Specific Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Generate the password
3. Use the generated password as `SMTP_PASSWORD`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Ologywood
```

### SendGrid

1. Sign up at https://sendgrid.com
2. Create an API key
3. Configure SMTP:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-api-key-here
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Ologywood
```

### AWS SES (Simple Email Service)

1. Set up AWS SES in your region
2. Verify sender email address
3. Create SMTP credentials:

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
SMTP_FROM_EMAIL=verified-email@yourdomain.com
SMTP_FROM_NAME=Ologywood
```

### Mailgun

1. Sign up at https://www.mailgun.com
2. Add your domain
3. Configure SMTP:

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM_EMAIL=noreply@yourdomain.mailgun.org
SMTP_FROM_NAME=Ologywood
```

## Testing Email Configuration

### 1. Test SMTP Connection

Create a test script `test-smtp.ts`:

```typescript
import nodemailer from 'nodemailer';

async function testSMTPConnection() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    const verified = await transporter.verify();
    console.log('✅ SMTP connection verified:', verified);
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return false;
  }
}

testSMTPConnection();
```

Run with: `npx ts-node test-smtp.ts`

### 2. Test Email Sending

Create a test script `test-email-send.ts`:

```typescript
import nodemailer from 'nodemailer';

async function testEmailSending() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    const result = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: 'test@example.com', // Change to your test email
      subject: 'Ologywood Test Email',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from Ologywood.</p>
        <p>If you received this, SMTP is configured correctly!</p>
      `,
    });

    console.log('✅ Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
}

testEmailSending();
```

Run with: `npx ts-node test-email-send.ts`

### 3. Test Contract Notification Email

Create a test script `test-contract-email.ts`:

```typescript
import { contractEmailIntegration } from './server/contractEmailIntegration';

async function testContractEmail() {
  try {
    const result = await contractEmailIntegration.sendContractCreatedNotification({
      artistEmail: 'test-artist@example.com',
      artistName: 'Test Artist',
      venueEmail: 'test-venue@example.com',
      venueName: 'Test Venue',
      contractId: 'test-contract-123',
      contractTitle: 'Test Performance Agreement',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      eventVenue: 'Test Venue Location',
    });

    console.log('✅ Contract email test:', result);
  } catch (error) {
    console.error('❌ Contract email test failed:', error);
  }
}

testContractEmail();
```

## Email Templates

### Contract Creation Email

Sent to both artist and venue when a contract is created.

**Subject:** New Performance Agreement: [Contract Title]

**Content:**
- Event details (date, venue, location)
- Performance fee
- Call-to-action to review contract
- Signing deadline

### Signature Request Email

Sent when requesting signature from the other party.

**Subject:** Signature Requested: [Contract Title]

**Content:**
- Sender name
- Contract details
- Signing deadline (typically 3 days)
- Direct link to signing page

### Signature Completion Email

Sent when all parties have signed.

**Subject:** Contract Signed: [Contract Title]

**Content:**
- Confirmation of all signatures
- Certificate number for verification
- Event details
- Link to download contract

### Contract Reminder Email

Sent 7, 3, and 1 day before event.

**Subject:** Reminder: [Contract Title] - [Days] Days Until Event

**Content:**
- Days remaining until event
- Event details
- Signing status
- Call-to-action if contract not signed

## Troubleshooting

### Issue: "Authentication failed"

**Solution:**
- Verify SMTP credentials are correct
- Check if 2FA is enabled (Gmail requires app-specific password)
- Ensure sender email is verified in your email service

### Issue: "Connection timeout"

**Solution:**
- Verify SMTP host and port are correct
- Check firewall/network settings
- Try using port 465 (SSL) instead of 587 (TLS)

### Issue: "Email not received"

**Solution:**
- Check spam/junk folder
- Verify recipient email address
- Check email service logs for delivery failures
- Ensure sender email is verified/whitelisted

### Issue: "Rate limit exceeded"

**Solution:**
- Implement email queue/batching
- Add delay between emails
- Check email service rate limits
- Consider upgrading email service plan

## Email Queue Implementation

For production, implement an email queue to handle high volumes:

```typescript
import Bull from 'bull';

const emailQueue = new Bull('email', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Add email to queue
export async function queueEmail(emailData: any) {
  return emailQueue.add(emailData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

// Process queue
emailQueue.process(async (job) => {
  return await sendEmail(job.data);
});
```

## Monitoring Email Delivery

### Tracking Sent Emails

Store email metadata in database:

```typescript
interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  type: string; // 'contract', 'signature', 'reminder', etc.
  status: 'sent' | 'failed' | 'bounced';
  messageId: string;
  sentAt: Date;
  error?: string;
}
```

### Email Delivery Webhooks

Configure webhooks with your email service to track:
- Delivery confirmation
- Open events
- Click events
- Bounce/Complaint events

## Best Practices

1. **Use Environment Variables** – Never hardcode SMTP credentials
2. **Implement Retry Logic** – Automatically retry failed emails
3. **Queue Emails** – Use a queue system for high volumes
4. **Monitor Delivery** – Track sent/failed emails
5. **Test Thoroughly** – Test with all email providers before production
6. **Use Templates** – Maintain consistent email design
7. **Track Metrics** – Monitor open rates, click rates, bounces
8. **Unsubscribe Links** – Include unsubscribe option in emails
9. **SPF/DKIM/DMARC** – Configure authentication records
10. **Rate Limiting** – Implement rate limits to prevent abuse

## Production Checklist

- [ ] SMTP credentials configured in production environment
- [ ] Email sending tested with real data
- [ ] Email templates reviewed and approved
- [ ] Unsubscribe links functional
- [ ] SPF/DKIM/DMARC records configured
- [ ] Email monitoring/logging enabled
- [ ] Retry logic implemented
- [ ] Rate limiting configured
- [ ] Email queue system deployed
- [ ] Webhook handlers for delivery events configured

## Support

For issues with email configuration, check:
1. Email service provider documentation
2. SMTP logs in application
3. Email service provider dashboard for delivery status
4. Network/firewall settings
5. Environment variable configuration
