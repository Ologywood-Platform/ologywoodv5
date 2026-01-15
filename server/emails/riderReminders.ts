/**
 * Email templates for rider reminder notifications
 */

export function generateVenueRiderReminderHTML(
  venueName: string,
  artistName: string,
  eventDate: string,
  riderTitle: string,
  acknowledgmentLink: string,
  daysSinceShared: number
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
        .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
        .section-title { color: #667eea; font-weight: bold; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Rider Acknowledgment Reminder</h1>
          <p>Action needed: ${artistName}'s rider is awaiting your response</p>
        </div>
        
        <div class="content">
          <p>Hi ${venueName},</p>
          
          <div class="alert-box">
            <strong>⏰ Reminder:</strong> You received a rider from <strong>${artistName}</strong> ${daysSinceShared} day${daysSinceShared > 1 ? 's' : ''} ago for your event on <strong>${eventDate}</strong>.
          </div>
          
          <p>The rider "<strong>${riderTitle}</strong>" is still awaiting your acknowledgment or response.</p>
          
          <div class="section-title">What you need to do:</div>
          <ol>
            <li>Review the rider requirements</li>
            <li>Acknowledge if you can meet all requirements, or</li>
            <li>Propose modifications if needed</li>
            <li>Communicate any concerns with the artist</li>
          </ol>
          
          <p style="text-align: center; margin-top: 20px;">
            <a href="${acknowledgmentLink}" class="button primary-btn">Review & Respond to Rider</a>
          </p>
          
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            <strong>Why this matters:</strong> Timely rider acknowledgment helps artists prepare properly for their performance and ensures a smooth event for everyone.
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated reminder from Ologywood. Please do not reply to this email.</p>
          <p>&copy; 2026 Ologywood. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateArtistModificationReminderHTML(
  artistName: string,
  venueName: string,
  eventDate: string,
  modificationCount: number,
  dashboardLink: string,
  daysSincePending: number
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
        .alert-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; }
        .section-title { color: #667eea; font-weight: bold; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Pending Rider Modifications</h1>
          <p>Response needed from ${venueName}</p>
        </div>
        
        <div class="content">
          <p>Hi ${artistName},</p>
          
          <div class="alert-box">
            <strong>⏰ Reminder:</strong> ${venueName} has proposed <strong>${modificationCount}</strong> modification${modificationCount > 1 ? 's' : ''} to your rider for the event on <strong>${eventDate}</strong>, and has been waiting for your response for <strong>${daysSincePending} day${daysSincePending > 1 ? 's' : ''}</strong>.
          </div>
          
          <p>Please review the proposed modifications and either approve them or submit a counter-proposal to keep the negotiation moving forward.</p>
          
          <div class="section-title">Proposed modifications include:</div>
          <ul>
            <li>Review all proposed changes</li>
            <li>Consider the venue's constraints and capabilities</li>
            <li>Approve changes or counter-propose alternatives</li>
            <li>Communicate your decision promptly</li>
          </ul>
          
          <p style="text-align: center; margin-top: 20px;">
            <a href="${dashboardLink}" class="button primary-btn">Review Modifications</a>
          </p>
          
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            <strong>Tip:</strong> Quick responses help finalize bookings faster and show professionalism to venues.
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated reminder from Ologywood. Please do not reply to this email.</p>
          <p>&copy; 2026 Ologywood. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export interface VenueReminderData {
  venueEmail: string;
  venueName: string;
  artistName: string;
  eventDate: string;
  riderTitle: string;
  acknowledgmentLink: string;
  daysSinceShared: number;
}

export interface ArtistReminderData {
  artistEmail: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  modificationCount: number;
  dashboardLink: string;
  daysSincePending: number;
}
