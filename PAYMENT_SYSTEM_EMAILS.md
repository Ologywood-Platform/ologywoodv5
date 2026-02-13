# Ologywood Payment System - Email Templates

This document shows all the email notifications that will be sent to artists and venues throughout the booking and payment lifecycle.

---

## 1. BOOKING CONFIRMATION EMAIL (Sent to both Artist & Venue)

**Subject:** Booking Confirmed: [Event Name]

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; }
      .content { background: #f9f9f9; padding: 30px; margin: 20px 0; border-radius: 8px; }
      .details { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
      .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      .footer { color: #666; font-size: 12px; margin-top: 30px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Booking Confirmed!</h1>
        <p>Your booking has been confirmed</p>
      </div>
      
      <div class="content">
        <p>Hi [Artist/Venue Name],</p>
        <p>Great news! Your booking has been confirmed. Here are the details:</p>
        
        <div class="details">
          <p><strong>Event:</strong> [Event Name]</p>
          <p><strong>Date:</strong> [Event Date]</p>
          <p><strong>Time:</strong> [Event Time]</p>
          <p><strong>Location:</strong> [Venue Address]</p>
          <p><strong>Fee:</strong> $[Amount]</p>
          <p><strong>Platform Fee (1%):</strong> $[1% Amount]</p>
          <p><strong>Artist Receives:</strong> $[Amount - 1%]</p>
        </div>

        <p>Next steps:</p>
        <ul>
          <li>Review the contract details</li>
          <li>Sign the digital contract</li>
          <li>Confirm your attendance</li>
        </ul>

        <a href="[Dashboard Link]" class="button">View Booking Details</a>
        
        <p>If you have any questions, please contact our support team.</p>
      </div>
      
      <div class="footer">
        <p>© 2026 Ologywood. All rights reserved.</p>
        <p>This is an automated message. Please do not reply directly to this email.</p>
      </div>
    </div>
  </body>
</html>
```

---

## 2. PAYMENT RECEIPT EMAIL (Sent to Venue after payment)

**Subject:** Payment Receipt - Booking #[Booking ID]

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 8px; }
      .content { background: #f9f9f9; padding: 30px; margin: 20px 0; border-radius: 8px; }
      .receipt { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
      .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
      .total { font-size: 24px; font-weight: bold; color: #28a745; padding: 20px 0; }
      .footer { color: #666; font-size: 12px; margin-top: 30px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✓ Payment Received</h1>
        <p>Your payment has been successfully processed</p>
      </div>
      
      <div class="content">
        <p>Hi [Venue Name],</p>
        <p>Thank you for your payment! Here's your receipt:</p>
        
        <div class="receipt">
          <div class="row">
            <span><strong>Booking ID:</strong></span>
            <span>#[Booking ID]</span>
          </div>
          <div class="row">
            <span><strong>Artist:</strong></span>
            <span>[Artist Name]</span>
          </div>
          <div class="row">
            <span><strong>Event:</strong></span>
            <span>[Event Name]</span>
          </div>
          <div class="row">
            <span><strong>Event Date:</strong></span>
            <span>[Event Date]</span>
          </div>
          <div class="row">
            <span><strong>Booking Fee:</strong></span>
            <span>$[Amount]</span>
          </div>
          <div class="row">
            <span><strong>Platform Fee (1%):</strong></span>
            <span>-$[1% Amount]</span>
          </div>
          <div class="row">
            <span><strong>Artist Receives:</strong></span>
            <span>$[Amount - 1%]</span>
          </div>
          <div class="row">
            <span><strong>Payment Date:</strong></span>
            <span>[Today's Date]</span>
          </div>
          <div class="row">
            <span><strong>Transaction ID:</strong></span>
            <span>[Stripe Transaction ID]</span>
          </div>
          <div class="row">
            <span><strong>Payment Method:</strong></span>
            <span>Stripe (Card ending in [XXXX])</span>
          </div>
          <div class="total">
            Total Paid: $[Amount]
          </div>
        </div>

        <p>Your booking is now confirmed and the artist has been notified of payment.</p>
        
        <p>You can view your booking details and manage your bookings anytime in your dashboard.</p>
        
        <p>If you have any questions about this payment, please contact our support team.</p>
      </div>
      
      <div class="footer">
        <p>© 2026 Ologywood. All rights reserved.</p>
        <p>This is an automated message. Please do not reply directly to this email.</p>
      </div>
    </div>
  </body>
</html>
```

---

## 3. PAYOUT REQUESTED EMAIL (Sent to Artist when requesting payout)

**Subject:** Payout Request Received - $[Amount]

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; }
      .content { background: #f9f9f9; padding: 30px; margin: 20px 0; border-radius: 8px; }
      .details { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
      .amount { font-size: 32px; font-weight: bold; color: #667eea; margin: 20px 0; }
      .status-badge { display: inline-block; background: #ffc107; color: #333; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
      .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      .footer { color: #666; font-size: 12px; margin-top: 30px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Payout Request Received</h1>
      </div>
      
      <div class="content">
        <p>Hi [Artist Name],</p>
        <p>We've received your payout request! Here are the details:</p>
        
        <div class="details">
          <p><strong>Payout ID:</strong> #[Payout ID]</p>
          <p><strong>Amount:</strong></p>
          <div class="amount">$[Amount]</div>
          <p><strong>Status:</strong> <span class="status-badge">Pending Review</span></p>
          <p><strong>Requested Date:</strong> [Today's Date]</p>
        </div>

        <p>Your payout request is now being reviewed by our team. We typically process payouts within 2-3 business days.</p>
        
        <p>You'll receive an email update when your payout status changes. You can track your payout status anytime in your Ologywood dashboard.</p>

        <a href="[Earnings Dashboard Link]" class="button">View Payout Status</a>

        <p style="margin-top: 30px;">If you have any questions, please don't hesitate to contact our support team.</p>
        
        <p>Best regards,<br>The Ologywood Team</p>
      </div>
      
      <div class="footer">
        <p>© 2026 Ologywood. All rights reserved.</p>
        <p>This is an automated email. Please do not reply directly to this message.</p>
      </div>
    </div>
  </body>
</html>
```

---

## 4. PAYOUT PROCESSING EMAIL (Sent to Artist when payout is approved)

**Subject:** Your Payout is Processing - $[Amount]

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 30px; border-radius: 8px; }
      .content { background: #f9f9f9; padding: 30px; margin: 20px 0; border-radius: 8px; }
      .details { background: white; padding: 15px; border-left: 4px solid #17a2b8; margin: 15px 0; }
      .amount { font-size: 32px; font-weight: bold; color: #17a2b8; margin: 20px 0; }
      .status-badge { display: inline-block; background: #17a2b8; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
      .footer { color: #666; font-size: 12px; margin-top: 30px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Payout Processing</h1>
      </div>
      
      <div class="content">
        <p>Hi [Artist Name],</p>
        <p>Great news! Your payout request has been approved and is now being processed.</p>
        
        <div class="details">
          <p><strong>Payout ID:</strong> #[Payout ID]</p>
          <p><strong>Amount:</strong></p>
          <div class="amount">$[Amount]</div>
          <p><strong>Status:</strong> <span class="status-badge">Processing</span></p>
          <p><strong>Bank Account:</strong> [Last 4 digits of account]</p>
        </div>

        <p>Your funds are being transferred to your bank account. This typically takes 1-3 business days depending on your bank.</p>
        
        <p>You'll receive a final confirmation email once the transfer is complete.</p>

        <p style="margin-top: 30px;">If you have any questions, please contact our support team.</p>
        
        <p>Best regards,<br>The Ologywood Team</p>
      </div>
      
      <div class="footer">
        <p>© 2026 Ologywood. All rights reserved.</p>
        <p>This is an automated email. Please do not reply directly to this message.</p>
      </div>
    </div>
  </body>
</html>
```

---

## 5. PAYOUT COMPLETED EMAIL (Sent to Artist when payout is completed)

**Subject:** ✓ Your Payout is Complete - $[Amount]

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 8px; }
      .content { background: #f9f9f9; padding: 30px; margin: 20px 0; border-radius: 8px; }
      .details { background: white; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
      .amount { font-size: 32px; font-weight: bold; color: #28a745; margin: 20px 0; }
      .status-badge { display: inline-block; background: #28a745; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
      .footer { color: #666; font-size: 12px; margin-top: 30px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✓ Payout Completed!</h1>
      </div>
      
      <div class="content">
        <p>Hi [Artist Name],</p>
        <p>Your payout has been successfully completed!</p>
        
        <div class="details">
          <p><strong>Payout ID:</strong> #[Payout ID]</p>
          <p><strong>Amount:</strong></p>
          <div class="amount">$[Amount]</div>
          <p><strong>Status:</strong> <span class="status-badge">Completed</span></p>
          <p><strong>Bank Account:</strong> [Last 4 digits of account]</p>
          <p><strong>Completed Date:</strong> [Date]</p>
        </div>

        <p>The funds have been successfully transferred to your bank account. Depending on your bank, it may take 1-2 additional business days to appear in your account.</p>
        
        <p>You can view your complete earnings history and all past payouts in your Ologywood dashboard.</p>

        <p style="margin-top: 30px;">Thank you for being part of the Ologywood community!</p>
        
        <p>Best regards,<br>The Ologywood Team</p>
      </div>
      
      <div class="footer">
        <p>© 2026 Ologywood. All rights reserved.</p>
        <p>This is an automated email. Please do not reply directly to this message.</p>
      </div>
    </div>
  </body>
</html>
```

---

## 6. EVENT REMINDER EMAIL (Sent 1 day before event)

**Subject:** Reminder: [Event Name] is Tomorrow!

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #fd7e14 0%, #ff6c00 100%); color: white; padding: 30px; border-radius: 8px; }
      .content { background: #f9f9f9; padding: 30px; margin: 20px 0; border-radius: 8px; }
      .details { background: white; padding: 15px; border-left: 4px solid #fd7e14; margin: 15px 0; }
      .footer { color: #666; font-size: 12px; margin-top: 30px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Event Reminder!</h1>
        <p>[Event Name] is happening tomorrow</p>
      </div>
      
      <div class="content">
        <p>Hi [Artist/Venue Name],</p>
        <p>Just a friendly reminder that your event is tomorrow!</p>
        
        <div class="details">
          <p><strong>Event:</strong> [Event Name]</p>
          <p><strong>Date:</strong> [Tomorrow's Date]</p>
          <p><strong>Time:</strong> [Event Time]</p>
          <p><strong>Location:</strong> [Venue Address]</p>
          <p><strong>Contact:</strong> [Contact Information]</p>
        </div>

        <p>Please make sure you:</p>
        <ul>
          <li>Have confirmed your attendance</li>
          <li>Have all necessary equipment ready</li>
          <li>Have reviewed the contract and rider requirements</li>
          <li>Have the contact information for the other party</li>
        </ul>

        <p>If you have any last-minute questions or concerns, please reach out to the other party or contact our support team.</p>
        
        <p>Best regards,<br>The Ologywood Team</p>
      </div>
      
      <div class="footer">
        <p>© 2026 Ologywood. All rights reserved.</p>
        <p>This is an automated email. Please do not reply directly to this message.</p>
      </div>
    </div>
  </body>
</html>
```

---

## Email Delivery Schedule

| Event | Recipient | Timing | Email Type |
|-------|-----------|--------|-----------|
| Booking Created | Artist & Venue | Immediately | Booking Confirmation |
| Payment Received | Venue | Immediately | Payment Receipt |
| Payout Requested | Artist | Immediately | Payout Requested |
| Payout Approved | Artist | Within 24 hours | Payout Processing |
| Payout Completed | Artist | Within 3-5 business days | Payout Completed |
| Event Tomorrow | Artist & Venue | 24 hours before | Event Reminder |
| Event in 1 Hour | Artist & Venue | 1 hour before | Event Reminder |

---

## Platform Fee Breakdown Example

**Booking Fee:** $2,000.00
**Platform Fee (1%):** -$20.00
**Artist Receives:** $1,980.00

The 1% platform fee is automatically deducted from the artist's earnings and displayed transparently in all communications.

---

## Testing

To test these emails with your account (garychisolm30@gmail.com):

1. Create a test booking as a venue
2. Process payment with Stripe test card: 4242 4242 4242 4242
3. Check your email for all notifications
4. Request a payout as an artist to see payout emails

All emails are sent via SendGrid and will appear in your inbox within seconds of the triggering event.
