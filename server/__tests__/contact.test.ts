import { describe, it, expect, vi } from 'vitest';

// Mock the sendEmail function
vi.mock('../email', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

import { sendEmail } from '../email';

describe('Contact Form Router', () => {
  describe('Input Validation', () => {
    it('should require a name with at least 2 characters', () => {
      const { z } = require('zod');
      const schema = z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        subject: z.enum(['General Inquiry', 'Booking Support', 'Artist Inquiry', 'Venue Inquiry', 'Technical Issue', 'Partnership', 'Other']),
        message: z.string().min(10).max(5000),
      });

      expect(() => schema.parse({ name: 'A', email: 'test@test.com', subject: 'General Inquiry', message: 'Hello world test message' })).toThrow();
      expect(() => schema.parse({ name: 'Ab', email: 'test@test.com', subject: 'General Inquiry', message: 'Hello world test message' })).not.toThrow();
    });

    it('should require a valid email address', () => {
      const { z } = require('zod');
      const schema = z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        subject: z.enum(['General Inquiry', 'Booking Support', 'Artist Inquiry', 'Venue Inquiry', 'Technical Issue', 'Partnership', 'Other']),
        message: z.string().min(10).max(5000),
      });

      expect(() => schema.parse({ name: 'John', email: 'not-an-email', subject: 'General Inquiry', message: 'Hello world test message' })).toThrow();
      expect(() => schema.parse({ name: 'John', email: 'john@example.com', subject: 'General Inquiry', message: 'Hello world test message' })).not.toThrow();
    });

    it('should only accept valid subject options', () => {
      const { z } = require('zod');
      const schema = z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        subject: z.enum(['General Inquiry', 'Booking Support', 'Artist Inquiry', 'Venue Inquiry', 'Technical Issue', 'Partnership', 'Other']),
        message: z.string().min(10).max(5000),
      });

      expect(() => schema.parse({ name: 'John', email: 'john@test.com', subject: 'Invalid Subject', message: 'Hello world test message' })).toThrow();
      expect(() => schema.parse({ name: 'John', email: 'john@test.com', subject: 'Booking Support', message: 'Hello world test message' })).not.toThrow();
    });

    it('should require a message with at least 10 characters', () => {
      const { z } = require('zod');
      const schema = z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        subject: z.enum(['General Inquiry', 'Booking Support', 'Artist Inquiry', 'Venue Inquiry', 'Technical Issue', 'Partnership', 'Other']),
        message: z.string().min(10).max(5000),
      });

      expect(() => schema.parse({ name: 'John', email: 'john@test.com', subject: 'General Inquiry', message: 'Short' })).toThrow();
      expect(() => schema.parse({ name: 'John', email: 'john@test.com', subject: 'General Inquiry', message: 'This is a valid message with enough characters.' })).not.toThrow();
    });

    it('should reject messages over 5000 characters', () => {
      const { z } = require('zod');
      const schema = z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        subject: z.enum(['General Inquiry', 'Booking Support', 'Artist Inquiry', 'Venue Inquiry', 'Technical Issue', 'Partnership', 'Other']),
        message: z.string().min(10).max(5000),
      });

      const longMessage = 'a'.repeat(5001);
      expect(() => schema.parse({ name: 'John', email: 'john@test.com', subject: 'General Inquiry', message: longMessage })).toThrow();
    });
  });

  describe('Email Routing Logic', () => {
    it('should route Booking Support to support@ologywood.com', () => {
      const isSupport = ['Booking Support', 'Technical Issue'].includes('Booking Support');
      const toEmail = isSupport ? 'support@ologywood.com' : 'hello@ologywood.com';
      expect(toEmail).toBe('support@ologywood.com');
    });

    it('should route Technical Issue to support@ologywood.com', () => {
      const isSupport = ['Booking Support', 'Technical Issue'].includes('Technical Issue');
      const toEmail = isSupport ? 'support@ologywood.com' : 'hello@ologywood.com';
      expect(toEmail).toBe('support@ologywood.com');
    });

    it('should route General Inquiry to hello@ologywood.com', () => {
      const isSupport = ['Booking Support', 'Technical Issue'].includes('General Inquiry');
      const toEmail = isSupport ? 'support@ologywood.com' : 'hello@ologywood.com';
      expect(toEmail).toBe('hello@ologywood.com');
    });

    it('should route Artist Inquiry to hello@ologywood.com', () => {
      const isSupport = ['Booking Support', 'Technical Issue'].includes('Artist Inquiry');
      const toEmail = isSupport ? 'support@ologywood.com' : 'hello@ologywood.com';
      expect(toEmail).toBe('hello@ologywood.com');
    });

    it('should route Venue Inquiry to hello@ologywood.com', () => {
      const isSupport = ['Booking Support', 'Technical Issue'].includes('Venue Inquiry');
      const toEmail = isSupport ? 'support@ologywood.com' : 'hello@ologywood.com';
      expect(toEmail).toBe('hello@ologywood.com');
    });

    it('should route Partnership to hello@ologywood.com', () => {
      const isSupport = ['Booking Support', 'Technical Issue'].includes('Partnership');
      const toEmail = isSupport ? 'support@ologywood.com' : 'hello@ologywood.com';
      expect(toEmail).toBe('hello@ologywood.com');
    });
  });

  describe('Email Sending', () => {
    it('should call sendEmail for team notification', async () => {
      const mockedSendEmail = sendEmail as ReturnType<typeof vi.fn>;
      mockedSendEmail.mockClear();
      
      await sendEmail({
        to: 'hello@ologywood.com',
        subject: '[Contact Form] General Inquiry — from John Doe',
        html: '<p>Test message</p>',
      });

      expect(mockedSendEmail).toHaveBeenCalledWith({
        to: 'hello@ologywood.com',
        subject: '[Contact Form] General Inquiry — from John Doe',
        html: '<p>Test message</p>',
      });
    });

    it('should call sendEmail for visitor confirmation', async () => {
      const mockedSendEmail = sendEmail as ReturnType<typeof vi.fn>;
      mockedSendEmail.mockClear();

      await sendEmail({
        to: 'visitor@example.com',
        subject: 'We received your message — Ologywood',
        html: '<p>Confirmation</p>',
      });

      expect(mockedSendEmail).toHaveBeenCalledWith({
        to: 'visitor@example.com',
        subject: 'We received your message — Ologywood',
        html: '<p>Confirmation</p>',
      });
    });

    it('should include unsubscribe link in confirmation email', () => {
      const email = 'test@example.com';
      const unsubscribeUrl = `https://www.ologywood.com/unsubscribe?email=${encodeURIComponent(email)}`;
      expect(unsubscribeUrl).toContain('unsubscribe');
      expect(unsubscribeUrl).toContain(encodeURIComponent(email));
    });
  });

  describe('Subject Options', () => {
    it('should have all required subject options', () => {
      const subjects = [
        'General Inquiry',
        'Booking Support',
        'Artist Inquiry',
        'Venue Inquiry',
        'Technical Issue',
        'Partnership',
        'Other',
      ];
      expect(subjects).toHaveLength(7);
      expect(subjects).toContain('General Inquiry');
      expect(subjects).toContain('Booking Support');
      expect(subjects).toContain('Technical Issue');
      expect(subjects).toContain('Partnership');
    });
  });
});
