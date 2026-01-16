/**
 * Email templates for contract notifications and reminders
 */

export const contractSentTemplate = (data: {
  recipientName: string;
  senderName: string;
  senderRole: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  eventTime: string;
  contractUrl: string;
  signDeadline: string;
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contract Sent - Ologywood</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { font-size: 28px; margin: 0 0 10px 0; }
    .content { padding: 40px 20px; }
    .section { margin: 20px 0; }
    .section h2 { font-size: 18px; color: #1f2937; margin-bottom: 12px; }
    .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0; border-radius: 6px; }
    .info-box p { color: #1e40af; margin: 0; }
    .event-details { background: #f9fafb; padding: 16px; border-radius: 6px; margin: 16px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 600; color: #6b7280; }
    .detail-value { color: #1f2937; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0; }
    .cta-button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); }
    .footer { background: #1f2937; color: #d1d5db; padding: 20px; text-align: center; font-size: 12px; }
    .footer p { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎵 Contract Ready for Signature</h1>
      <p>Your performance rider agreement is ready to sign</p>
    </div>
    
    <div class="content">
      <p>Hi ${data.recipientName},</p>
      
      <p>${data.senderName} (${data.senderRole}) has sent you a performance rider contract for review and signature.</p>
      
      <div class="event-details">
        <div class="detail-row">
          <span class="detail-label">Artist:</span>
          <span class="detail-value">${data.artistName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Venue:</span>
          <span class="detail-value">${data.venueName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Event Date:</span>
          <span class="detail-value">${data.eventDate} at ${data.eventTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Sign by:</span>
          <span class="detail-value">${data.signDeadline}</span>
        </div>
      </div>
      
      <div class="info-box">
        <p><strong>📋 Next Steps:</strong> Please review the contract carefully and sign it electronically. Your signature will be timestamped and legally binding.</p>
      </div>
      
      <a href="${data.contractUrl}" class="cta-button">👉 Review & Sign Contract</a>
      
      <p>If you have any questions about the contract terms, please contact ${data.senderName} directly.</p>
    </div>
    
    <div class="footer">
      <p><strong>© 2026 Ologywood</strong></p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

export const signatureRequestTemplate = (data: {
  recipientName: string;
  senderName: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  contractUrl: string;
  signDeadline: string;
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signature Request - Ologywood</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { font-size: 28px; margin: 0 0 10px 0; }
    .content { padding: 40px 20px; }
    .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 6px; }
    .warning-box p { color: #92400e; margin: 0; }
    .event-details { background: #f9fafb; padding: 16px; border-radius: 6px; margin: 16px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 600; color: #6b7280; }
    .detail-value { color: #1f2937; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0; }
    .footer { background: #1f2937; color: #d1d5db; padding: 20px; text-align: center; font-size: 12px; }
    .footer p { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Action Required: Sign Contract</h1>
      <p>Your signature is needed to finalize this booking</p>
    </div>
    
    <div class="content">
      <p>Hi ${data.recipientName},</p>
      
      <p>${data.senderName} is waiting for your signature on the performance rider contract.</p>
      
      <div class="event-details">
        <div class="detail-row">
          <span class="detail-label">Artist:</span>
          <span class="detail-value">${data.artistName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Venue:</span>
          <span class="detail-value">${data.venueName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Event Date:</span>
          <span class="detail-value">${data.eventDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Sign by:</span>
          <span class="detail-value"><strong>${data.signDeadline}</strong></span>
        </div>
      </div>
      
      <div class="warning-box">
        <p><strong>⏰ Deadline:</strong> Please sign the contract by ${data.signDeadline} to confirm the booking.</p>
      </div>
      
      <a href="${data.contractUrl}" class="cta-button">👉 Sign Now</a>
      
      <p>Once you sign, ${data.senderName} will receive a notification and the booking will be confirmed.</p>
    </div>
    
    <div class="footer">
      <p><strong>© 2026 Ologywood</strong></p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

export const signatureReceivedTemplate = (data: {
  recipientName: string;
  signerName: string;
  signerRole: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  signedAt: string;
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contract Signed - Ologywood</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { font-size: 28px; margin: 0 0 10px 0; }
    .content { padding: 40px 20px; }
    .success-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 6px; }
    .success-box p { color: #065f46; margin: 0; }
    .event-details { background: #f9fafb; padding: 16px; border-radius: 6px; margin: 16px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 600; color: #6b7280; }
    .detail-value { color: #1f2937; }
    .footer { background: #1f2937; color: #d1d5db; padding: 20px; text-align: center; font-size: 12px; }
    .footer p { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Contract Signed</h1>
      <p>The performance rider has been successfully signed</p>
    </div>
    
    <div class="content">
      <p>Hi ${data.recipientName},</p>
      
      <p>${data.signerName} (${data.signerRole}) has successfully signed the performance rider contract.</p>
      
      <div class="event-details">
        <div class="detail-row">
          <span class="detail-label">Signed by:</span>
          <span class="detail-value">${data.signerName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Role:</span>
          <span class="detail-value">${data.signerRole}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Signed at:</span>
          <span class="detail-value">${data.signedAt}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Event Date:</span>
          <span class="detail-value">${data.eventDate}</span>
        </div>
      </div>
      
      <div class="success-box">
        <p><strong>🎉 Great news!</strong> The contract is now signed by ${data.signerName}. Please ensure you also sign the contract to finalize the booking.</p>
      </div>
      
      <p>A copy of the signed contract has been attached to your booking details for your records.</p>
    </div>
    
    <div class="footer">
      <p><strong>© 2026 Ologywood</strong></p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

export const contractReminderTemplate = (data: {
  recipientName: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  daysUntilEvent: number;
  contractUrl: string;
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contract Reminder - Ologywood</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { font-size: 28px; margin: 0 0 10px 0; }
    .content { padding: 40px 20px; }
    .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0; border-radius: 6px; }
    .info-box p { color: #1e40af; margin: 0; }
    .event-details { background: #f9fafb; padding: 16px; border-radius: 6px; margin: 16px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 600; color: #6b7280; }
    .detail-value { color: #1f2937; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0; }
    .footer { background: #1f2937; color: #d1d5db; padding: 20px; text-align: center; font-size: 12px; }
    .footer p { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Contract Reminder</h1>
      <p>Your event is coming up in ${data.daysUntilEvent} days</p>
    </div>
    
    <div class="content">
      <p>Hi ${data.recipientName},</p>
      
      <p>This is a friendly reminder about your upcoming event. Please ensure all contract requirements are met and any outstanding signatures are completed.</p>
      
      <div class="event-details">
        <div class="detail-row">
          <span class="detail-label">Artist:</span>
          <span class="detail-value">${data.artistName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Venue:</span>
          <span class="detail-value">${data.venueName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Event Date:</span>
          <span class="detail-value">${data.eventDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Days until event:</span>
          <span class="detail-value"><strong>${data.daysUntilEvent} days</strong></span>
        </div>
      </div>
      
      <div class="info-box">
        <p><strong>✓ Checklist:</strong> Ensure all contract signatures are complete, technical requirements are confirmed, and hospitality arrangements are finalized.</p>
      </div>
      
      <a href="${data.contractUrl}" class="cta-button">👉 Review Contract</a>
      
      <p>If you have any questions or need to make changes, please contact the other party immediately.</p>
    </div>
    
    <div class="footer">
      <p><strong>© 2026 Ologywood</strong></p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;
