import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const serverDir = join(__dirname, '..');
const routersContent = readFileSync(join(serverDir, 'routers.ts'), 'utf-8');
const authContent = readFileSync(join(serverDir, 'routers', 'auth.ts'), 'utf-8');
const fanClubContent = readFileSync(join(serverDir, 'routers', 'fanClub.ts'), 'utf-8');
const creditExpirationContent = readFileSync(join(serverDir, 'handlers', 'creditExpiration.ts'), 'utf-8');

describe('Security Audit Fixes', () => {
  describe('SQL Injection Prevention', () => {
    it('should NOT use sql.raw() in fanClub router', () => {
      expect(fanClubContent).not.toContain('sql.raw(');
    });

    it('should use inArray() for parameterized IN queries', () => {
      expect(fanClubContent).toContain('inArray(fanClubPostLikes.postId, input.postIds)');
    });
  });

  describe('Booking Ownership Checks', () => {
    it('should verify booking ownership in updateStatus', () => {
      const updateStatusSection = routersContent.split('updateStatus: artistProcedure')[1]?.split('counterOffer:')[0] || '';
      expect(updateStatusSection).toContain('Ownership check');
      expect(updateStatusSection).toContain('booking.artistId !== artistProfile.id');
    });
  });

  describe('Message Ownership Checks', () => {
    it('should verify user is party to booking in getForBooking', () => {
      const getForBookingSection = routersContent.split('getForBooking: protectedProcedure')[1]?.split('send: protectedProcedure')[0] || '';
      expect(getForBookingSection).toContain('Ownership check');
      expect(getForBookingSection).toContain('isArtistParty');
      expect(getForBookingSection).toContain('isVenueParty');
    });

    it('should verify user is party to booking in send message', () => {
      const sendSection = routersContent.split('// Send message')[1]?.split('// Send rider template')[0] || '';
      expect(sendSection).toContain('Ownership check');
      expect(sendSection).toContain('FORBIDDEN');
    });

    it('should verify user is party to booking in sendRider', () => {
      const sendRiderSection = routersContent.split('// Send rider template as a message')[1]?.split('// Mark message as read')[0] || '';
      expect(sendRiderSection).toContain('Ownership check');
      expect(sendRiderSection).toContain('FORBIDDEN');
    });

    it('should limit message length to prevent abuse', () => {
      const sendSection = routersContent.split('// Send message')[1]?.split('// Send rider template')[0] || '';
      expect(sendSection).toContain('.max(5000)');
    });
  });

  describe('Scheduled Endpoint Authentication', () => {
    it('should require x-manus-cron-task-uid header in creditExpiration handler', () => {
      expect(creditExpirationContent).toContain('x-manus-cron-task-uid');
      expect(creditExpirationContent).toContain('403');
      expect(creditExpirationContent).toContain('cron-only');
    });
  });

  describe('Password Security', () => {
    it('should use BCRYPT_ROUNDS constant (12) instead of hardcoded 10', () => {
      expect(authContent).toContain('const BCRYPT_ROUNDS = 12');
      expect(authContent).not.toContain('bcrypt.hash(input.password, 10)');
      expect(authContent).not.toContain('bcrypt.hash(input.newPassword, 10)');
    });

    it('should enforce password complexity (uppercase, lowercase, number)', () => {
      expect(authContent).toContain('regex(/[A-Z]/');
      expect(authContent).toContain('regex(/[a-z]/');
      expect(authContent).toContain('regex(/[0-9]/');
    });

    it('should use passwordSchema for all password inputs', () => {
      // Count occurrences of passwordSchema usage
      const passwordSchemaCount = (authContent.match(/password: passwordSchema|newPassword: passwordSchema/g) || []).length;
      expect(passwordSchemaCount).toBeGreaterThanOrEqual(4); // signup, setPassword, linkEmail, changePassword, resetPassword
    });
  });

  describe('Session Token Not Exposed in Response', () => {
    it('should NOT return sessionToken in response bodies', () => {
      // sessionToken should only appear in cookie-setting lines, not in return objects
      const lines = authContent.split('\n');
      const sessionTokenInReturn = lines.filter(line => 
        line.trim() === 'sessionToken,' && !line.includes('cookie')
      );
      expect(sessionTokenInReturn.length).toBe(0);
    });
  });
});
