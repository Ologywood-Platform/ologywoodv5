import { emailService } from './emailService';

export const onboardingEmailSequence = {
  // Send welcome email immediately after signup
  async sendWelcomeEmail(userEmail: string, userName: string, userType: 'artist' | 'venue') {
    const subject = `Welcome to Ologywood, ${userName}!`;
    const content = `
      <h2>Welcome to Ologywood!</h2>
      <p>Hi ${userName},</p>
      <p>We're excited to have you join our community of ${userType === 'artist' ? 'talented performers' : 'amazing venues'}.</p>
      
      ${userType === 'artist' ? `
        <h3>Get Started as an Artist</h3>
        <ul>
          <li>Complete your profile with a photo and bio</li>
          <li>Set your availability calendar</li>
          <li>Create your custom rider template</li>
          <li>Start receiving booking requests from venues</li>
        </ul>
      ` : `
        <h3>Get Started as a Venue</h3>
        <ul>
          <li>Complete your venue profile and get free promotion</li>
          <li>Browse thousands of talented artists</li>
          <li>Send booking requests and manage inquiries</li>
          <li>Build your venue reputation with reviews</li>
        </ul>
      `}
      
      <p><a href="https://ologywood.com/dashboard">Go to your dashboard</a></p>
      <p>Best regards,<br>The Ologywood Team</p>
    `;
    
    await emailService.sendEmail(userEmail, subject, content);
  },

  // Send feature introduction email (Day 1)
  async sendFeatureIntroEmail(userEmail: string, userName: string, userType: 'artist' | 'venue') {
    const subject = `Discover Powerful Features on Ologywood`;
    const content = `
      <h2>Discover What You Can Do on Ologywood</h2>
      <p>Hi ${userName},</p>
      
      ${userType === 'artist' ? `
        <h3>Key Features for Artists</h3>
        <ul>
          <li><strong>Smart Calendar Sync</strong> - Sync your availability with Google Calendar and never double-book</li>
          <li><strong>Custom Rider Templates</strong> - Create professional riders with your technical and hospitality requirements</li>
          <li><strong>Secure Payments</strong> - Get paid deposits and full payments through Stripe</li>
          <li><strong>Analytics Dashboard</strong> - Track your bookings, revenue, and trends</li>
          <li><strong>Mobile App</strong> - Install Ologywood on your phone for notifications on the go</li>
        </ul>
      ` : `
        <h3>Key Features for Venues</h3>
        <ul>
          <li><strong>Artist Discovery</strong> - Browse thousands of talented performers filtered by genre and price</li>
          <li><strong>Free Venue Listing</strong> - Get promoted in our directory with your photos and details</li>
          <li><strong>Booking Management</strong> - Manage all your bookings and inquiries in one place</li>
          <li><strong>Reviews & Ratings</strong> - Build trust with reviews from artists who've performed at your venue</li>
          <li><strong>Analytics</strong> - Track listing views, booking inquiries, and conversion metrics</li>
        </ul>
      `}
      
      <p><a href="https://ologywood.com/home">Learn more</a></p>
      <p>Best regards,<br>The Ologywood Team</p>
    `;
    
    await emailService.sendEmail(userEmail, subject, content);
  },

  // Send tips and best practices email (Day 3)
  async sendTipsEmail(userEmail: string, userName: string, userType: 'artist' | 'venue') {
    const subject = `Pro Tips to Maximize Your Success on Ologywood`;
    const content = `
      <h2>Pro Tips for Success</h2>
      <p>Hi ${userName},</p>
      
      ${userType === 'artist' ? `
        <h3>Tips to Get More Bookings</h3>
        <ol>
          <li><strong>Complete Your Profile</strong> - Artists with complete profiles get 3x more booking requests</li>
          <li><strong>Add High-Quality Photos</strong> - Professional photos increase booking chances by 50%</li>
          <li><strong>Set Clear Availability</strong> - Keep your calendar updated so venues know when you're available</li>
          <li><strong>Customize Your Rider</strong> - A detailed rider shows you're professional and experienced</li>
          <li><strong>Respond Quickly</strong> - Reply to booking requests within 24 hours to increase conversion</li>
          <li><strong>Share Your Profile</strong> - Use the social media share buttons to promote yourself</li>
        </ol>
      ` : `
        <h3>Tips to Find the Perfect Artist</h3>
        <ol>
          <li><strong>Use Filters</strong> - Search by genre, price range, and availability to narrow results</li>
          <li><strong>Read Reviews</strong> - Check artist reviews from other venues to find reliable performers</li>
          <li><strong>Save Favorites</strong> - Bookmark artists you like and get notified when they add availability</li>
          <li><strong>Use Templates</strong> - Save booking request templates to speed up your booking process</li>
          <li><strong>Plan Ahead</strong> - Send booking requests 4-6 weeks in advance for better availability</li>
          <li><strong>Complete Your Profile</strong> - Help artists understand your venue by completing your profile</li>
        </ol>
      `}
      
      <p>Questions? Check out our <a href="https://ologywood.com/help">Help Center</a></p>
      <p>Best regards,<br>The Ologywood Team</p>
    `;
    
    await emailService.sendEmail(userEmail, subject, content);
  },

  // Send upgrade offer email (Day 7)
  async sendUpgradeOfferEmail(userEmail: string, userName: string, userType: 'artist' | 'venue') {
    const subject = `Unlock Premium Features with Ologywood Pro`;
    const content = `
      <h2>Upgrade to Ologywood Professional</h2>
      <p>Hi ${userName},</p>
      <p>We've noticed you're getting the most out of Ologywood. Ready to take it to the next level?</p>
      
      <h3>What's Included in Professional ($29/month)</h3>
      <ul>
        <li>✓ Calendar sync with Google Calendar and Outlook</li>
        <li>✓ Custom rider templates with unlimited versions</li>
        <li>✓ Advanced analytics and revenue tracking</li>
        <li>✓ Team member management (Professional plan)</li>
        <li>✓ Priority support</li>
        <li>✓ 14-day free trial - no credit card required</li>
      </ul>
      
      <p><a href="https://ologywood.com/upgrade" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Free Trial</a></p>
      
      <p>Best regards,<br>The Ologywood Team</p>
    `;
    
    await emailService.sendEmail(userEmail, subject, content);
  },

  // Send referral program email (Day 14)
  async sendReferralEmail(userEmail: string, userName: string) {
    const subject = `Earn Credits by Referring Friends to Ologywood`;
    const content = `
      <h2>Share Ologywood and Earn Rewards</h2>
      <p>Hi ${userName},</p>
      <p>Love Ologywood? Help your friends discover it and earn credits!</p>
      
      <h3>How It Works</h3>
      <ol>
        <li>Share your unique referral link with friends</li>
        <li>When they sign up and complete their profile, you both get $10 in credits</li>
        <li>Use credits toward your Professional subscription or other services</li>
      </ol>
      
      <p><a href="https://ologywood.com/referrals">View Your Referral Link</a></p>
      
      <p>Best regards,<br>The Ologywood Team</p>
    `;
    
    await emailService.sendEmail(userEmail, subject, content);
  },
};
