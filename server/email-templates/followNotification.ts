/**
 * Follow Notification Email Templates
 */

export function getFollowNotificationEmailHTML(params: {
  followerName: string;
  followingName: string;
  followingType: "artist" | "venue";
  followerId: number;
  followingId: number;
}): string {
  const profileUrl = `${process.env.BASE_URL || "https://ologywood.com"}/${
    params.followingType === "artist" ? "artist" : "venue"
  }/${params.followingId}`;

  const followerProfileUrl = `${process.env.BASE_URL || "https://ologywood.com"}/profile/${params.followerId}`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
          .highlight { color: #667eea; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Follower on Ologywood! 🎉</h2>
          </div>
          <div class="content">
            <p>Hi <span class="highlight">${params.followingName}</span>,</p>
            
            <p><span class="highlight">${params.followerName}</span> just started following you on Ologywood!</p>
            
            <p>This is a great opportunity to connect with a new audience. Check out their profile and see if there's a chance to collaborate or book together.</p>
            
            <div style="text-align: center;">
              <a href="${followerProfileUrl}" class="button">View Their Profile</a>
            </div>
            
            <p>You can also:</p>
            <ul>
              <li>Send them a direct message to introduce yourself</li>
              <li>Share your latest availability or special offers</li>
              <li>Check out their booking history and reviews</li>
            </ul>
            
            <p>Keep building your community on Ologywood!</p>
            
            <p>Best regards,<br>The Ologywood Team</p>
          </div>
          <div class="footer">
            <p>You're receiving this email because someone followed you on Ologywood. You can manage your notification preferences in your account settings.</p>
            <p>&copy; 2026 Ologywood. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getFollowNotificationEmailText(params: {
  followerName: string;
  followingName: string;
  followingType: "artist" | "venue";
  followerId: number;
  followingId: number;
}): string {
  const profileUrl = `${process.env.BASE_URL || "https://ologywood.com"}/${
    params.followingType === "artist" ? "artist" : "venue"
  }/${params.followingId}`;

  return `
Hi ${params.followingName},

${params.followerName} just started following you on Ologywood!

This is a great opportunity to connect with a new audience. Check out their profile:
${profileUrl}

You can also send them a direct message to introduce yourself or share your latest availability.

Keep building your community on Ologywood!

Best regards,
The Ologywood Team
  `.trim();
}
