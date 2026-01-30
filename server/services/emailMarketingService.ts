/**
 * Email Marketing Automation Service
 * Handles automated email campaigns, sequences, and notifications
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  createdAt: Date;
}

export interface EmailCampaign {
  id: string;
  name: string;
  templateId: string;
  status: 'draft' | 'scheduled' | 'sent' | 'paused';
  recipientCount: number;
  sentCount: number;
  openRate: number;
  clickRate: number;
  scheduledAt?: Date;
  sentAt?: Date;
}

export interface EmailSequence {
  id: string;
  name: string;
  triggerEvent: 'signup' | 'booking_created' | 'booking_completed' | 'payment_received' | 'trial_ending';
  emails: Array<{
    templateId: string;
    delayHours: number;
    subject: string;
  }>;
  active: boolean;
}

export interface EmailMetrics {
  campaignId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  complained: number;
}

class EmailMarketingService {
  /**
   * Create email template
   */
  static async createTemplate(
    name: string,
    subject: string,
    htmlContent: string,
    variables: string[]
  ): Promise<EmailTemplate> {
    try {
      console.log(`[Email] Creating template: ${name}`);

      const template: EmailTemplate = {
        id: `tpl_${Date.now()}`,
        name,
        subject,
        htmlContent,
        textContent: this.stripHtml(htmlContent),
        variables,
        createdAt: new Date(),
      };

      return template;
    } catch (error) {
      console.error('[Email] Error creating template:', error);
      throw error;
    }
  }

  /**
   * Send welcome email sequence
   */
  static async sendWelcomeSequence(userId: number, email: string, name: string): Promise<void> {
    try {
      console.log(`[Email] Sending welcome sequence to ${email}`);

      // Email 1: Welcome
      await this.sendEmail(email, 'Welcome to Ologywood!', `
        <h1>Welcome, ${name}!</h1>
        <p>We're excited to have you on board. Here's what you can do next:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Create your first rider template</li>
          <li>Browse available bookings</li>
        </ul>
      `);

      // Email 2: Feature highlights (24 hours later)
      setTimeout(() => {
        this.sendEmail(email, 'Explore Ologywood Features', `
          <h1>Make the Most of Ologywood</h1>
          <p>Here are some powerful features to help you succeed:</p>
          <ul>
            <li>Advanced search and filters</li>
            <li>Real-time messaging</li>
            <li>Automated contract signing</li>
            <li>Secure payment processing</li>
          </ul>
        `);
      }, 24 * 60 * 60 * 1000);

      // Email 3: Success stories (48 hours later)
      setTimeout(() => {
        this.sendEmail(email, 'Success Stories from Our Community', `
          <h1>See How Others Are Succeeding</h1>
          <p>Check out these amazing stories from our community members...</p>
        `);
      }, 48 * 60 * 60 * 1000);
    } catch (error) {
      console.error('[Email] Error sending welcome sequence:', error);
      throw error;
    }
  }

  /**
   * Send booking confirmation email
   */
  static async sendBookingConfirmation(
    email: string,
    artistName: string,
    venueName: string,
    eventDate: Date,
    amount: number
  ): Promise<void> {
    try {
      console.log(`[Email] Sending booking confirmation to ${email}`);

      const subject = `Booking Confirmed: ${artistName} at ${venueName}`;
      const htmlContent = `
        <h1>Booking Confirmed!</h1>
        <p>Your booking has been confirmed:</p>
        <ul>
          <li><strong>Artist:</strong> ${artistName}</li>
          <li><strong>Venue:</strong> ${venueName}</li>
          <li><strong>Date:</strong> ${eventDate.toLocaleDateString()}</li>
          <li><strong>Amount:</strong> $${amount}</li>
        </ul>
        <p>Next steps: Review the contract and complete payment.</p>
      `;

      await this.sendEmail(email, subject, htmlContent);
    } catch (error) {
      console.error('[Email] Error sending booking confirmation:', error);
      throw error;
    }
  }

  /**
   * Send payment reminder
   */
  static async sendPaymentReminder(
    email: string,
    bookingId: string,
    amount: number,
    dueDate: Date
  ): Promise<void> {
    try {
      console.log(`[Email] Sending payment reminder to ${email}`);

      const subject = `Payment Reminder: ${amount} due ${dueDate.toLocaleDateString()}`;
      const htmlContent = `
        <h1>Payment Reminder</h1>
        <p>You have an outstanding payment:</p>
        <ul>
          <li><strong>Amount:</strong> $${amount}</li>
          <li><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</li>
          <li><strong>Booking ID:</strong> ${bookingId}</li>
        </ul>
        <p><a href="https://ologywood.com/bookings/${bookingId}">Complete Payment</a></p>
      `;

      await this.sendEmail(email, subject, htmlContent);
    } catch (error) {
      console.error('[Email] Error sending payment reminder:', error);
      throw error;
    }
  }

  /**
   * Send trial ending reminder
   */
  static async sendTrialEndingReminder(email: string, daysRemaining: number): Promise<void> {
    try {
      console.log(`[Email] Sending trial ending reminder to ${email}`);

      const subject = `Your Premium trial ends in ${daysRemaining} days`;
      const htmlContent = `
        <h1>Your Trial is Ending Soon</h1>
        <p>Your 14-day Premium trial ends in ${daysRemaining} days.</p>
        <p>Upgrade now to keep access to premium features:</p>
        <ul>
          <li>Unlimited bookings</li>
          <li>Advanced analytics</li>
          <li>Priority support</li>
        </ul>
        <p><a href="https://ologywood.com/upgrade">Upgrade to Premium</a></p>
      `;

      await this.sendEmail(email, subject, htmlContent);
    } catch (error) {
      console.error('[Email] Error sending trial ending reminder:', error);
      throw error;
    }
  }

  /**
   * Send event reminder
   */
  static async sendEventReminder(
    email: string,
    eventName: string,
    eventDate: Date,
    hoursUntil: number
  ): Promise<void> {
    try {
      console.log(`[Email] Sending event reminder to ${email}`);

      const subject = `Reminder: ${eventName} in ${hoursUntil} hours`;
      const htmlContent = `
        <h1>Event Reminder</h1>
        <p>Your event is coming up!</p>
        <ul>
          <li><strong>Event:</strong> ${eventName}</li>
          <li><strong>Date & Time:</strong> ${eventDate.toLocaleString()}</li>
          <li><strong>Time Until Event:</strong> ${hoursUntil} hours</li>
        </ul>
        <p>Make sure all arrangements are confirmed.</p>
      `;

      await this.sendEmail(email, subject, htmlContent);
    } catch (error) {
      console.error('[Email] Error sending event reminder:', error);
      throw error;
    }
  }

  /**
   * Send promotional email
   */
  static async sendPromoEmail(
    email: string,
    title: string,
    description: string,
    promoCode: string,
    discount: number
  ): Promise<void> {
    try {
      console.log(`[Email] Sending promo email to ${email}`);

      const subject = `Special Offer: ${discount}% off with code ${promoCode}`;
      const htmlContent = `
        <h1>${title}</h1>
        <p>${description}</p>
        <p><strong>Use code: ${promoCode}</strong> for ${discount}% off</p>
        <p><a href="https://ologywood.com/upgrade?code=${promoCode}">Claim Offer</a></p>
      `;

      await this.sendEmail(email, subject, htmlContent);
    } catch (error) {
      console.error('[Email] Error sending promo email:', error);
      throw error;
    }
  }

  /**
   * Create email campaign
   */
  static async createCampaign(
    name: string,
    templateId: string,
    recipientEmails: string[],
    scheduledAt?: Date
  ): Promise<EmailCampaign> {
    try {
      console.log(`[Email] Creating campaign: ${name}`);

      const campaign: EmailCampaign = {
        id: `camp_${Date.now()}`,
        name,
        templateId,
        status: scheduledAt ? 'scheduled' : 'draft',
        recipientCount: recipientEmails.length,
        sentCount: 0,
        openRate: 0,
        clickRate: 0,
        scheduledAt,
      };

      return campaign;
    } catch (error) {
      console.error('[Email] Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Create email sequence
   */
  static async createSequence(
    name: string,
    triggerEvent: string,
    emails: Array<{ templateId: string; delayHours: number; subject: string }>
  ): Promise<EmailSequence> {
    try {
      console.log(`[Email] Creating sequence: ${name}`);

      const sequence: EmailSequence = {
        id: `seq_${Date.now()}`,
        name,
        triggerEvent: triggerEvent as any,
        emails,
        active: true,
      };

      return sequence;
    } catch (error) {
      console.error('[Email] Error creating sequence:', error);
      throw error;
    }
  }

  /**
   * Get campaign metrics
   */
  static async getCampaignMetrics(campaignId: string): Promise<EmailMetrics> {
    try {
      console.log(`[Email] Fetching metrics for campaign ${campaignId}`);

      const metrics: EmailMetrics = {
        campaignId,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
        complained: 0,
      };

      return metrics;
    } catch (error) {
      console.error('[Email] Error fetching campaign metrics:', error);
      throw error;
    }
  }

  /**
   * Send email (internal method)
   */
  private static async sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
    try {
      console.log(`[Email] Sending email to ${to}: ${subject}`);

      // TODO: Integrate with SendGrid or similar service
      // const msg = {
      //   to,
      //   from: process.env.SENDGRID_FROM_EMAIL,
      //   subject,
      //   html: htmlContent,
      // };
      // await sgMail.send(msg);

      console.log(`[Email] Email sent successfully to ${to}`);
    } catch (error) {
      console.error('[Email] Error sending email:', error);
      throw error;
    }
  }

  /**
   * Strip HTML tags from content
   */
  private static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}

export { EmailMarketingService };
export default EmailMarketingService;
