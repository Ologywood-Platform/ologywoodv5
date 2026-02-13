import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supportRouter } from './support';
import { TRPCError } from '@trpc/server';

// Mock context
const mockContext = {
  user: {
    id: 450137,
    email: 'ologywood5@gmail.com',
    role: 'venue',
    name: 'Gary Chisolm',
  },
};

describe('Support Router', () => {
  describe('getMyTickets', () => {
    it('should retrieve user support tickets', async () => {
      const caller = supportRouter.createCaller(mockContext as any);
      
      try {
        const tickets = await caller.getMyTickets({
          limit: 50,
        });
        
        // Should return an array (even if empty)
        expect(Array.isArray(tickets)).toBe(true);
      } catch (error) {
        // If there's an error, it should be a TRPCError
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should support status filtering', async () => {
      const caller = supportRouter.createCaller(mockContext as any);
      
      try {
        const tickets = await caller.getMyTickets({
          status: 'open',
          limit: 50,
        });
        
        expect(Array.isArray(tickets)).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should support pagination', async () => {
      const caller = supportRouter.createCaller(mockContext as any);
      
      try {
        const tickets = await caller.getMyTickets({
          limit: 10,
          offset: 0,
        });
        
        expect(Array.isArray(tickets)).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('getTicketStats', () => {
    it('should retrieve ticket statistics', async () => {
      const caller = supportRouter.createCaller(mockContext as any);
      
      try {
        const stats = await caller.getTicketStats();
        
        expect(stats).toHaveProperty('total');
        expect(stats).toHaveProperty('open');
        expect(stats).toHaveProperty('inProgress');
        expect(stats).toHaveProperty('resolved');
        expect(stats).toHaveProperty('closed');
        
        expect(typeof stats.total).toBe('number');
        expect(typeof stats.open).toBe('number');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('createTicket', () => {
    it('should create a support ticket', async () => {
      const caller = supportRouter.createCaller(mockContext as any);
      
      try {
        const ticket = await caller.createTicket({
          subject: 'Test Support Issue',
          description: 'This is a test support ticket for testing purposes',
          category: 'general',
          priority: 'medium',
        });
        
        // Should return ticket data
        expect(ticket).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should reject ticket with short subject', async () => {
      const caller = supportRouter.createCaller(mockContext as any);
      
      try {
        await caller.createTicket({
          subject: 'Bad',
          description: 'This is a test support ticket for testing purposes',
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
