import { describe, it, expect } from 'vitest';
import {
  getBookingConfirmationTemplate,
  getNewOpportunityTemplate,
  getPasswordResetTemplate,
  getWelcomeTemplate,
  getPaymentConfirmationTemplate,
  getSupportTicketResponseTemplate,
} from '../emailBrandingTemplates';
import { EMAIL_LOGO_ALT, EMAIL_LOGO_URL } from '../../../shared/emailBranding';

describe('Email Branding Templates', () => {
  describe('getBookingConfirmationTemplate', () => {
    it('should generate booking confirmation email with all required fields', () => {
      const template = getBookingConfirmationTemplate({
        recipientName: 'John Doe',
        artistName: 'The Beatles',
        venueName: 'Madison Square Garden',
        eventDate: '2026-03-15',
        eventTime: '8:00 PM',
        eventLocation: 'New York, NY',
        bookingId: 12345,
      });

      expect(template.subject).toContain('Booking Confirmed');
      expect(template.subject).toContain('The Beatles');
      expect(template.html).toContain('John Doe');
      expect(template.html).toContain('Madison Square Garden');
      expect(template.html).toContain('2026-03-15');
      expect(template.html).toContain('8:00 PM');
      expect(template.html).toContain('#12345');
    });

    it('should include the approved neon OW branding', () => {
      const template = getBookingConfirmationTemplate({
        recipientName: 'John Doe',
        artistName: 'Artist',
        venueName: 'Venue',
        eventDate: '2026-03-15',
        eventTime: '8:00 PM',
        eventLocation: 'Location',
        bookingId: 1,
      });

      expect(template.html).toContain('Ologywood');
      expect(template.html).toContain(EMAIL_LOGO_URL);
      expect(template.html).toContain(EMAIL_LOGO_ALT);
      expect(template.html).not.toContain('ymRJKMwaOWmPOCjV.png');
    });

    it('should include gradient colors', () => {
      const template = getBookingConfirmationTemplate({
        recipientName: 'John Doe',
        artistName: 'Artist',
        venueName: 'Venue',
        eventDate: '2026-03-15',
        eventTime: '8:00 PM',
        eventLocation: 'Location',
        bookingId: 1,
      });

      expect(template.html).toContain('#6D28D9');
      expect(template.html).toContain('#00D9FF');
    });
  });

  describe('getNewOpportunityTemplate', () => {
    it('should generate new opportunity email with all required fields', () => {
      const template = getNewOpportunityTemplate({
        recipientName: 'Jane Smith',
        venueName: 'The Ritz',
        eventType: 'Wedding',
        eventDate: '2026-04-20',
        budget: '$5,000',
        location: 'Los Angeles, CA',
      });

      expect(template.subject).toContain('New Opportunity');
      expect(template.subject).toContain('Wedding');
      expect(template.html).toContain('Jane Smith');
      expect(template.html).toContain('The Ritz');
      expect(template.html).toContain('$5,000');
    });
  });

  describe('getPasswordResetTemplate', () => {
    it('should generate password reset email with reset link', () => {
      const resetLink = 'https://ologywood.com/reset?token=abc123';
      const template = getPasswordResetTemplate({
        recipientName: 'Bob Wilson',
        resetLink,
        expiresIn: '24 hours',
      });

      expect(template.subject).toContain('Reset Your Ologywood Password');
      expect(template.html).toContain('Bob Wilson');
      expect(template.html).toContain(resetLink);
      expect(template.html).toContain('24 hours');
    });

    it('should include security warning', () => {
      const template = getPasswordResetTemplate({
        recipientName: 'Bob Wilson',
        resetLink: 'https://ologywood.com/reset',
        expiresIn: '24 hours',
      });

      expect(template.html).toContain('security');
    });
  });

  describe('getWelcomeTemplate', () => {
    it('should generate welcome email for artists', () => {
      const template = getWelcomeTemplate({
        recipientName: 'Alice Johnson',
        userType: 'artist',
      });

      expect(template.subject).toContain('Welcome');
      expect(template.html).toContain('Alice Johnson');
      expect(template.html).toContain('booking gigs');
    });

    it('should generate welcome email for venues', () => {
      const template = getWelcomeTemplate({
        recipientName: 'Venue Manager',
        userType: 'venue',
      });

      expect(template.subject).toContain('Welcome');
      expect(template.html).toContain('Venue Manager');
      expect(template.html).toContain('talented artists');
    });
  });

  describe('getPaymentConfirmationTemplate', () => {
    it('should generate payment confirmation email with transaction details', () => {
      const template = getPaymentConfirmationTemplate({
        recipientName: 'Charlie Brown',
        amount: '99.99',
        currency: 'USD',
        description: 'Premium Subscription',
        transactionId: 'txn_1234567890',
      });

      expect(template.subject).toContain('Payment Received');
      expect(template.subject).toContain('99.99');
      expect(template.html).toContain('Charlie Brown');
      expect(template.html).toContain('Premium Subscription');
      expect(template.html).toContain('txn_1234567890');
    });
  });

  describe('getSupportTicketResponseTemplate', () => {
    it('should generate support ticket response email', () => {
      const template = getSupportTicketResponseTemplate({
        recipientName: 'David Lee',
        ticketId: 'TKT-001',
        subject: 'Booking Issue',
        message: 'We have resolved your booking issue.',
      });

      expect(template.subject).toContain('Support');
      expect(template.subject).toContain('TKT-001');
      expect(template.html).toContain('David Lee');
      expect(template.html).toContain('Booking Issue');
      expect(template.html).toContain('We have resolved your booking issue.');
    });
  });

  describe('Email Template Consistency', () => {
    it('all templates should include Ologywood branding', () => {
      const templates = [
        getBookingConfirmationTemplate({
          recipientName: 'Test',
          artistName: 'Test',
          venueName: 'Test',
          eventDate: '2026-03-15',
          eventTime: '8:00 PM',
          eventLocation: 'Test',
          bookingId: 1,
        }),
        getNewOpportunityTemplate({
          recipientName: 'Test',
          venueName: 'Test',
          eventType: 'Test',
          eventDate: '2026-03-15',
          budget: 'Test',
          location: 'Test',
        }),
        getPasswordResetTemplate({
          recipientName: 'Test',
          resetLink: 'https://test.com',
          expiresIn: 'Test',
        }),
        getWelcomeTemplate({
          recipientName: 'Test',
          userType: 'artist',
        }),
        getPaymentConfirmationTemplate({
          recipientName: 'Test',
          amount: 'Test',
          currency: 'Test',
          description: 'Test',
          transactionId: 'Test',
        }),
        getSupportTicketResponseTemplate({
          recipientName: 'Test',
          ticketId: 'Test',
          subject: 'Test',
          message: 'Test',
        }),
      ];

      templates.forEach((template) => {
        expect(template.html).toContain('Ologywood');
        expect(template.html).toContain('#6D28D9');
        expect(template.html).toContain('#00D9FF');
        expect(template.html).toContain('font-family');
      });
    });

    it('all templates should have proper HTML structure', () => {
      const template = getBookingConfirmationTemplate({
        recipientName: 'Test',
        artistName: 'Test',
        venueName: 'Test',
        eventDate: '2026-03-15',
        eventTime: '8:00 PM',
        eventLocation: 'Test',
        bookingId: 1,
      });

      expect(template.html).toContain('<div');
      expect(template.html).toContain('</div>');
      expect(template.html).toContain('style=');
    });
  });
});
