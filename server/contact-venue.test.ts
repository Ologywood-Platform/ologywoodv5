import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Contact Venue Feature', () => {
  const venueRouterPath = join(__dirname, 'routers/venue.ts');
  const venueRouterContent = readFileSync(venueRouterPath, 'utf-8');

  const venueProfilePath = join(__dirname, '../client/src/pages/VenueProfile.tsx');
  const venueProfileContent = readFileSync(venueProfilePath, 'utf-8');

  describe('Backend: venue.contactVenue endpoint', () => {
    it('should define the contactVenue procedure', () => {
      expect(venueRouterContent).toContain('contactVenue: protectedProcedure');
    });

    it('should accept required input fields', () => {
      expect(venueRouterContent).toContain('venueId: z.number()');
      expect(venueRouterContent).toContain("inquiryType: z.enum(['booking', 'general', 'availability', 'pricing'])");
      expect(venueRouterContent).toContain('subject: z.string().min(1).max(200)');
      expect(venueRouterContent).toContain('message: z.string().min(10).max(2000)');
      expect(venueRouterContent).toContain('preferredDate: z.string().optional()');
    });

    it('should look up the venue profile by ID', () => {
      expect(venueRouterContent).toContain('db.getVenueProfileById(input.venueId)');
    });

    it('should look up the sender artist profile', () => {
      expect(venueRouterContent).toContain('db.getArtistProfileByUserId(ctx.user.id)');
    });

    it('should create a booking for the inquiry', () => {
      expect(venueRouterContent).toContain('db.createBooking({');
      expect(venueRouterContent).toContain("status: 'pending'");
    });

    it('should send the first message in the booking', () => {
      expect(venueRouterContent).toContain('db.createMessage({');
      expect(venueRouterContent).toContain('senderId: ctx.user.id');
      expect(venueRouterContent).toContain('recipientId: venueProfile.userId');
    });

    it('should send in-app notification to venue', () => {
      expect(venueRouterContent).toContain('notif.notifyNewMessage({');
      expect(venueRouterContent).toContain('recipientUserId: venueProfile.userId');
    });

    it('should send email notification to venue', () => {
      expect(venueRouterContent).toContain('sendEmail({');
      expect(venueRouterContent).toContain('to: venueUser.email');
    });

    it('should return success with bookingId', () => {
      expect(venueRouterContent).toContain("success: true, bookingId: booking.id, message: 'Inquiry sent successfully'");
    });

    it('should handle inquiry type labels correctly', () => {
      expect(venueRouterContent).toContain("booking: 'Booking Inquiry'");
      expect(venueRouterContent).toContain("general: 'General Inquiry'");
      expect(venueRouterContent).toContain("availability: 'Availability Check'");
      expect(venueRouterContent).toContain("pricing: 'Pricing Inquiry'");
    });

    it('should throw NOT_FOUND if venue does not exist', () => {
      expect(venueRouterContent).toContain("throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue not found' })");
    });
  });

  describe('Frontend: VenueProfile Contact Venue UI', () => {
    it('should import MessageSquare icon for the button', () => {
      expect(venueProfileContent).toContain('MessageSquare');
    });

    it('should have Contact Venue button text', () => {
      expect(venueProfileContent).toContain('Contact Venue');
    });

    it('should have a contact modal state', () => {
      expect(venueProfileContent).toContain('contactModalOpen');
      expect(venueProfileContent).toContain('setContactModalOpen');
    });

    it('should have a contact form state with all fields', () => {
      expect(venueProfileContent).toContain('inquiryType');
      expect(venueProfileContent).toContain('subject');
      expect(venueProfileContent).toContain('preferredDate');
    });

    it('should use the venue.contactVenue mutation', () => {
      expect(venueProfileContent).toContain('trpc.venue.contactVenue.useMutation');
    });

    it('should show login prompt for unauthenticated users', () => {
      expect(venueProfileContent).toContain('Log in to Contact Venue');
    });

    it('should hide the button for the venue owner', () => {
      expect(venueProfileContent).toContain('!isVenueOwner');
    });

    it('should have inquiry type selector with 4 options', () => {
      expect(venueProfileContent).toContain('Booking Request');
      expect(venueProfileContent).toContain('Check Availability');
      expect(venueProfileContent).toContain('Pricing Info');
      expect(venueProfileContent).toContain('General Question');
    });

    it('should validate subject and message before submission', () => {
      expect(venueProfileContent).toContain("toast.error('Please enter a subject')");
      expect(venueProfileContent).toContain("toast.error('Please enter a message')");
    });

    it('should show loading state during submission', () => {
      expect(venueProfileContent).toContain('contactVenueMutation.isPending');
      expect(venueProfileContent).toContain('Sending...');
    });

    it('should navigate to messages after successful inquiry', () => {
      expect(venueProfileContent).toContain('navigate(`/messages/${data.bookingId}`)');
    });

    it('should show date picker for booking and availability inquiries', () => {
      expect(venueProfileContent).toContain("contactForm.inquiryType === 'booking'");
      expect(venueProfileContent).toContain("contactForm.inquiryType === 'availability'");
    });
  });
});
