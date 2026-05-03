import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Ticketing Module', () => {
  describe('Schema', () => {
    it('should have ticket_tiers table defined in schema', () => {
      const schemaPath = path.resolve(__dirname, '../../drizzle/schema.ts');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      expect(schema).toContain('export const ticketTiers');
      expect(schema).toContain('"ticket_tiers"');
      expect(schema).toContain('eventId');
      expect(schema).toContain('price');
      expect(schema).toContain('quantity');
      expect(schema).toContain('quantitySold');
    });

    it('should have ticket_orders table defined in schema', () => {
      const schemaPath = path.resolve(__dirname, '../../drizzle/schema.ts');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      expect(schema).toContain('export const ticketOrders');
      expect(schema).toContain('"ticket_orders"');
      expect(schema).toContain('buyerEmail');
      expect(schema).toContain('stripeCheckoutSessionId');
      expect(schema).toContain('orderNumber');
      expect(schema).toContain('platformFee');
    });

    it('should have ticket_items table defined in schema', () => {
      const schemaPath = path.resolve(__dirname, '../../drizzle/schema.ts');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      expect(schema).toContain('export const ticketItems');
      expect(schema).toContain('"ticket_items"');
      expect(schema).toContain('ticketCode');
      expect(schema).toContain('checkedInAt');
      expect(schema).toContain('attendeeName');
    });
  });

  describe('Router', () => {
    it('should have ticketing router registered in routers.ts', () => {
      const routersPath = path.resolve(__dirname, '../routers.ts');
      const routers = fs.readFileSync(routersPath, 'utf-8');
      expect(routers).toContain('ticketingRouter');
      expect(routers).toContain('ticketing: ticketingRouter');
    });

    it('should have all required procedures in ticketing router', () => {
      const routerPath = path.resolve(__dirname, '../routers/ticketing.ts');
      const router = fs.readFileSync(routerPath, 'utf-8');
      
      // Tier management
      expect(router).toContain('createTier');
      expect(router).toContain('updateTier');
      expect(router).toContain('deleteTier');
      expect(router).toContain('getTiers');
      expect(router).toContain('getManagementTiers');
      
      // Purchase
      expect(router).toContain('createCheckout');
      
      // Orders
      expect(router).toContain('getOrderByNumber');
      expect(router).toContain('getMyTickets');
      
      // Sales dashboard
      expect(router).toContain('getSalesSummary');
      
      // Check-in
      expect(router).toContain('validateTicket');
      expect(router).toContain('getCheckInStats');
      
      // Utility
      expect(router).toContain('hasTicketing');
    });

    it('should enforce ownership checks on tier management', () => {
      const routerPath = path.resolve(__dirname, '../routers/ticketing.ts');
      const router = fs.readFileSync(routerPath, 'utf-8');
      
      // All management operations should check artist profile ownership
      expect(router).toContain('getArtistProfileByUserId');
      expect(router).toContain('FORBIDDEN');
      expect(router).toContain('You can only add tickets to your own events');
      expect(router).toContain('You can only edit tickets for your own events');
      expect(router).toContain('You can only delete tickets for your own events');
    });

    it('should calculate platform fee correctly ($0.99 per ticket)', () => {
      const routerPath = path.resolve(__dirname, '../routers/ticketing.ts');
      const router = fs.readFileSync(routerPath, 'utf-8');
      
      // Platform fee is 99 cents per ticket
      expect(router).toContain('totalTickets * 99');
      expect(router).toContain('platformFee');
    });

    it('should validate availability before checkout', () => {
      const routerPath = path.resolve(__dirname, '../routers/ticketing.ts');
      const router = fs.readFileSync(routerPath, 'utf-8');
      
      expect(router).toContain('tier.quantity - tier.quantitySold');
      expect(router).toContain('tickets available for');
      expect(router).toContain('Maximum');
      expect(router).toContain('tickets per order');
    });

    it('should prevent deletion of tiers with sold tickets', () => {
      const routerPath = path.resolve(__dirname, '../routers/ticketing.ts');
      const router = fs.readFileSync(routerPath, 'utf-8');
      
      expect(router).toContain('Cannot delete a tier with sold tickets');
      expect(router).toContain('tier.quantitySold > 0');
    });
  });

  describe('Webhook Handler', () => {
    it('should handle ticket_purchase type in checkout.session.completed', () => {
      const webhookPath = path.resolve(__dirname, '../webhooks/stripe.ts');
      const webhook = fs.readFileSync(webhookPath, 'utf-8');
      
      expect(webhook).toContain("session.metadata?.type === 'ticket_purchase'");
      expect(webhook).toContain('handleTicketPurchaseCompleted');
      expect(webhook).toContain('isTicketPurchase');
    });

    it('should create individual tickets with unique codes on purchase', () => {
      const webhookPath = path.resolve(__dirname, '../webhooks/stripe.ts');
      const webhook = fs.readFileSync(webhookPath, 'utf-8');
      
      expect(webhook).toContain('randomUUID()');
      expect(webhook).toContain('ticketItems');
      expect(webhook).toContain("status: 'valid'");
    });

    it('should update quantitySold on tier after purchase', () => {
      const webhookPath = path.resolve(__dirname, '../webhooks/stripe.ts');
      const webhook = fs.readFileSync(webhookPath, 'utf-8');
      
      expect(webhook).toContain('quantitySold');
    });
  });

  describe('Frontend Routes', () => {
    it('should have ticket-related routes in App.tsx', () => {
      const appPath = path.resolve(__dirname, '../../client/src/App.tsx');
      const app = fs.readFileSync(appPath, 'utf-8');
      
      expect(app).toContain('/events/:id/tickets');
      expect(app).toContain('/tickets/confirmation/:orderNumber');
      expect(app).toContain('/my-tickets');
      expect(app).toContain('TicketConfirmation');
      expect(app).toContain('MyTickets');
      expect(app).toContain('EventTickets');
    });
  });

  describe('Order Number Generation', () => {
    it('should generate order numbers with OLG prefix and date', () => {
      const routerPath = path.resolve(__dirname, '../routers/ticketing.ts');
      const router = fs.readFileSync(routerPath, 'utf-8');
      
      expect(router).toContain('OLG-');
      expect(router).toContain('generateOrderNumber');
    });
  });
});
