import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { EMAIL_LOGO_URL, getEmailLogoImage } from '../shared/emailBranding';

interface BookingEmailData {
  artistName: string;
  venueName: string;
  eventDate: string;
  eventTime: string;
  venueAddress: string;
  totalFee: string;
  paymentStatus: string;
  dashboardUrl: string;
  contactVenueUrl: string;
  websiteUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  privacyUrl: string;
  termsUrl: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Configure based on environment
    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else {
      // Fallback to test account for development
      console.warn('[EmailService] No SMTP configured, using test account');
    }
  }

  async sendBookingConfirmation(
    artistEmail: string,
    venueEmail: string,
    data: BookingEmailData
  ): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.warn('[EmailService] Transporter not configured, skipping email');
        return false;
      }

      // Read email template
      const templatePath = path.join(
        __dirname,
        'templates',
        'bookingConfirmationEmail.html'
      );
      let htmlContent = fs.readFileSync(templatePath, 'utf-8');

      // Replace placeholders
      Object.entries(data).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(placeholder, String(value));
      });
      htmlContent = htmlContent.replace(/{{logoUrl}}/g, EMAIL_LOGO_URL);

      // Send email to artist
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@ologywood.com',
        to: artistEmail,
        subject: '✨ Your Booking is Confirmed - Ologywood',
        html: htmlContent,
      });


      // Send email to venue
      const venueHtmlContent = htmlContent.replace(
        'Hi <strong>{{artistName}}</strong>',
        'Hi <strong>Venue Manager</strong>'
      );

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@ologywood.com',
        to: venueEmail,
        subject: '✨ New Booking Confirmed - Ologywood',
        html: venueHtmlContent,
      });


      return true;
    } catch (error) {
      console.error('[EmailService] Error sending booking confirmation:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.warn('[EmailService] Transporter not configured, skipping email');
        return false;
      }

      const welcomeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; padding: 40px 20px; text-align: center; }
            .content { padding: 40px 20px; }
            .footer { background: #1f2937; color: #d1d5db; padding: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${getEmailLogoImage({ size: 88, marginBottom: 12 })}
              <h1>Welcome to Ologywood!</h1>
              <p>Your artist booking journey starts here</p>
            </div>
            <div class="content">
              <p>Hi <strong>${name}</strong>,</p>
              <p>Welcome to Ologywood, the premier artist booking platform connecting talented performers with amazing venues!</p>
              <p>We're thrilled to have you on board. Here's what you can do next:</p>
              <ul>
                <li>Complete your profile with photos and details</li>
                <li>Browse available venues and events</li>
                <li>Submit booking requests</li>
                <li>Manage your bookings and payments</li>
              </ul>
              <p>If you have any questions, our support team is here to help!</p>
            </div>
            <div class="footer">
              <p>© 2026 Ologywood. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@ologywood.com',
        to: email,
        subject: '🎵 Welcome to Ologywood!',
        html: welcomeHtml,
      });

      return true;
    } catch (error) {
      console.error('[EmailService] Error sending welcome email:', error);
      return false;
    }
  }

  async sendCancellationEmail(
    artistEmail: string,
    venueEmail: string,
    artistName: string,
    venueName: string,
    eventDate: string
  ): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.warn('[EmailService] Transporter not configured, skipping email');
        return false;
      }

      const cancellationHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 20px; text-align: center; }
            .content { padding: 40px 20px; }
            .footer { background: #1f2937; color: #d1d5db; padding: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${getEmailLogoImage({ size: 88, marginBottom: 12 })}
              <h1>Booking Cancelled</h1>
            </div>
            <div class="content">
              <p>The booking for <strong>${eventDate}</strong> at <strong>${venueName}</strong> has been cancelled.</p>
              <p>If you have questions about this cancellation, please contact us immediately.</p>
            </div>
            <div class="footer">
              <p>© 2026 Ologywood. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@ologywood.com',
        to: artistEmail,
        subject: '❌ Booking Cancelled - Ologywood',
        html: cancellationHtml,
      });

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@ologywood.com',
        to: venueEmail,
        subject: '❌ Booking Cancelled - Ologywood',
        html: cancellationHtml,
      });

      return true;
    } catch (error) {
      console.error('[EmailService] Error sending cancellation email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
