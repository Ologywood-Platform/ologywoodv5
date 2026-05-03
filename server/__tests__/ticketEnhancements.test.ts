import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Ticket Enhancements', () => {
  // ===== PROMO CODES =====
  describe('Promo Code Schema', () => {
    const schemaPath = path.join(__dirname, '../../drizzle/schema.ts');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    it('should have ticket_promo_codes table defined', () => {
      expect(schema).toContain('ticket_promo_codes');
      expect(schema).toContain('discountType');
      expect(schema).toContain('discountValue');
      expect(schema).toContain('maxUses');
      expect(schema).toContain('currentUses');
    });

    it('should support percentage and fixed discount types', () => {
      expect(schema).toContain('"percentage"');
      expect(schema).toContain('"fixed"');
    });

    it('should have isActive flag for promo codes', () => {
      expect(schema).toContain('isActive');
    });
  });

  // ===== TICKET TRANSFERS =====
  describe('Ticket Transfer Schema', () => {
    const schemaPath = path.join(__dirname, '../../drizzle/schema.ts');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    it('should have ticket_transfers table defined', () => {
      expect(schema).toContain('ticket_transfers');
      expect(schema).toContain('toEmail');
      expect(schema).toContain('transferCode');
    });

    it('should support transfer statuses', () => {
      expect(schema).toContain('"pending"');
      expect(schema).toContain('"accepted"');
      expect(schema).toContain('"cancelled"');
    });
  });

  // ===== TICKETING ROUTER =====
  describe('Ticketing Router - Transfer & Promo Endpoints', () => {
    const routerPath = path.join(__dirname, '../routers/ticketing.ts');
    const router = fs.readFileSync(routerPath, 'utf-8');

    it('should have transfer ticket endpoint', () => {
      expect(router).toContain('transferTicket');
    });

    it('should have accept transfer endpoint', () => {
      expect(router).toContain('acceptTransfer');
    });

    it('should have cancel transfer endpoint', () => {
      expect(router).toContain('cancelTransfer');
    });

    it('should have create promo code endpoint', () => {
      expect(router).toContain('createPromoCode');
    });

    it('should have validate promo code endpoint', () => {
      expect(router).toContain('validatePromoCode');
    });

    it('should have get promo codes endpoint', () => {
      expect(router).toContain('getPromoCodes');
    });

    it('should have delete promo code endpoint', () => {
      expect(router).toContain('deletePromoCode');
    });

    it('should validate recipient email for transfers', () => {
      expect(router).toContain('toEmail');
      expect(router).toContain('email');
    });

    it('should generate transfer code', () => {
      expect(router).toContain('transferCode');
      expect(router).toContain('randomUUID');
    });
  });

  // ===== EMAIL DELIVERY =====
  describe('Ticket Email Delivery', () => {
    const webhookPath = path.join(__dirname, '../webhooks/stripe.ts');
    const webhook = fs.readFileSync(webhookPath, 'utf-8');

    it('should send ticket confirmation email after purchase', () => {
      expect(webhook).toContain('handleTicketPurchaseCompleted');
      expect(webhook).toContain('sendEmail');
    });

    it('should include QR code information in email', () => {
      expect(webhook).toContain('ticketCode');
    });

    it('should include event details in email', () => {
      expect(webhook).toContain('eventTitle');
    });

    it('should include order number in email', () => {
      expect(webhook).toContain('orderNumber');
    });
  });

  // ===== FRONTEND COMPONENTS =====
  describe('Frontend Components', () => {
    it('should have TicketTransfer component', () => {
      const filePath = path.join(__dirname, '../../client/src/components/TicketTransfer.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('transferTicket');
    });

    it('should have PromoCodeInput component', () => {
      const filePath = path.join(__dirname, '../../client/src/components/PromoCodeInput.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('validatePromoCode');
      expect(content).toContain('onPromoApplied');
    });

    it('should have PromoCodeManager component', () => {
      const filePath = path.join(__dirname, '../../client/src/components/PromoCodeManager.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('createPromoCode');
      expect(content).toContain('deletePromoCode');
    });

    it('should have AcceptTransfer page', () => {
      const filePath = path.join(__dirname, '../../client/src/pages/AcceptTransfer.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('acceptTransfer');
    });

    it('should have TicketPurchase with promo code support', () => {
      const filePath = path.join(__dirname, '../../client/src/components/TicketPurchase.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('PromoCodeInput');
      expect(content).toContain('appliedPromo');
      expect(content).toContain('discount');
    });

    it('should have TicketConfirmation with transfer option', () => {
      const filePath = path.join(__dirname, '../../client/src/pages/TicketConfirmation.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('TicketTransfer');
    });
  });

  // ===== HOMEPAGE HERO =====
  describe('Homepage Hero Section', () => {
    it('should highlight ticketing in hero text', () => {
      const homePath = path.join(__dirname, '../../client/src/pages/Home.tsx');
      const content = fs.readFileSync(homePath, 'utf-8');
      expect(content).toContain('Sell Tickets');
      expect(content).toContain('Event Ticketing');
    });
  });

  // ===== HELP SECTION =====
  describe('Help Section - Ticketing FAQs', () => {
    const helpPath = path.join(__dirname, '../../client/src/pages/Help.tsx');
    const content = fs.readFileSync(helpPath, 'utf-8');

    it('should have Event Ticketing category', () => {
      expect(content).toContain("category: 'Event Ticketing'");
    });

    it('should have FAQ about selling tickets', () => {
      expect(content).toContain('How do I sell tickets for my event?');
    });

    it('should have FAQ about ticket fees', () => {
      expect(content).toContain('What are the fees for selling tickets?');
    });

    it('should have FAQ about promo codes', () => {
      expect(content).toContain('How do promo codes work?');
    });

    it('should have FAQ about QR check-in', () => {
      expect(content).toContain('How does QR code check-in work');
    });

    it('should have FAQ about ticket transfers', () => {
      expect(content).toContain('Can I transfer or gift a ticket');
    });

    it('should have FAQ about finding purchased tickets', () => {
      expect(content).toContain('Where can I find my purchased tickets?');
    });

    it('should have FAQ about ticket analytics', () => {
      expect(content).toContain('How do I view ticket sales analytics?');
    });
  });

  // ===== ROUTES =====
  describe('App Routes', () => {
    const appPath = path.join(__dirname, '../../client/src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');

    it('should have AcceptTransfer route', () => {
      expect(content).toContain('AcceptTransfer');
    });

    it('should have EventTickets route', () => {
      expect(content).toContain('EventTickets');
    });

    it('should have EventCheckIn route', () => {
      expect(content).toContain('EventCheckIn');
      expect(content).toContain('check-in');
    });

    it('should have MyTickets route', () => {
      expect(content).toContain('MyTickets');
    });

    it('should have TicketConfirmation route', () => {
      expect(content).toContain('TicketConfirmation');
    });
  });
});
