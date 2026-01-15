/**
 * Email templates and functions for rider PDF sharing
 */

export function generateRiderSharingEmailHTML(
  venueName: string,
  artistName: string,
  eventDate: string,
  riderTitle: string,
  acknowledgmentLink: string,
  pdfUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; margin: 10px 0; border-radius: 5px; text-decoration: none; font-weight: bold; }
        .primary-btn { background: #667eea; color: white; }
        .secondary-btn { background: #764ba2; color: white; }
        .rider-info { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
        .section-title { color: #667eea; font-weight: bold; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Rider Received</h1>
          <p>New rider requirements from ${artistName}</p>
        </div>
        
        <div class="content">
          <p>Hi ${venueName},</p>
          
          <p><strong>${artistName}</strong> has shared their rider requirements for your event on <strong>${eventDate}</strong>.</p>
          
          <div class="rider-info">
            <p><strong>Rider Title:</strong> ${riderTitle}</p>
            <p>Please review the attached rider PDF and acknowledge or propose any modifications.</p>
          </div>
          
          <div class="section-title">Next Steps:</div>
          <ol>
            <li>Download and review the rider PDF</li>
            <li>Click the button below to acknowledge or propose modifications</li>
            <li>Communicate any changes with the artist</li>
          </ol>
          
          <p style="text-align: center;">
            <a href="${acknowledgmentLink}" class="button primary-btn">Review & Acknowledge Rider</a>
          </p>
          
          <p style="text-align: center; margin-top: 20px;">
            <a href="${pdfUrl}" class="button secondary-btn">Download Rider PDF</a>
          </p>
          
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            If you have questions about the rider requirements, you can message the artist directly through the booking details page.
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated email from Ologywood. Please do not reply to this email.</p>
          <p>&copy; 2026 Ologywood. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateRiderAcknowledgmentNotificationHTML(
  artistName: string,
  venueName: string,
  eventDate: string,
  status: string,
  notes?: string
): string {
  const statusColor = status === 'acknowledged' ? '#28a745' : status === 'modifications_proposed' ? '#ffc107' : '#dc3545';
  const statusText = status === 'acknowledged' ? 'Acknowledged' : status === 'modifications_proposed' ? 'Modifications Proposed' : 'Rejected';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; background: ${statusColor}; color: white; font-weight: bold; }
        .event-info { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Rider Status Update</h1>
          <p>Rider response from ${venueName}</p>
        </div>
        
        <div class="content">
          <p>Hi ${artistName},</p>
          
          <p><strong>${venueName}</strong> has responded to your rider for the event on <strong>${eventDate}</strong>.</p>
          
          <div class="event-info">
            <p><strong>Status:</strong> <span class="status-badge">${statusText}</span></p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          </div>
          
          <p>Please log in to your Ologywood dashboard to view the full details and respond if needed.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated email from Ologywood. Please do not reply to this email.</p>
          <p>&copy; 2026 Ologywood. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export interface RiderEmailData {
  venueEmail: string;
  venueName: string;
  artistName: string;
  eventDate: string;
  riderTitle: string;
  acknowledgmentLink: string;
  pdfUrl: string;
}

export interface RiderAcknowledgmentEmailData {
  artistEmail: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  status: 'acknowledged' | 'modifications_proposed' | 'rejected';
  notes?: string;
}
