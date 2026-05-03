import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

describe('QR Check-In & Ticket Analytics', () => {
  describe('QR Code Generation', () => {
    it('should have qrcode package installed', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
      expect(pkg.dependencies['qrcode']).toBeDefined();
    });

    it('should have html5-qrcode package installed for scanner', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
      expect(pkg.dependencies['html5-qrcode']).toBeDefined();
    });

    it('should have TicketQRCode component', () => {
      const filePath = path.join(ROOT, 'client/src/components/TicketQRCode.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('QRCode.toCanvas');
      expect(content).toContain('ticketCode');
      expect(content).toContain('errorCorrectionLevel');
    });

    it('should render QR codes on ticket confirmation page', () => {
      const filePath = path.join(ROOT, 'client/src/pages/TicketConfirmation.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('TicketQRCode');
      expect(content).toContain('ticketCode={item.ticketCode}');
      expect(content).toContain('Show this QR code at the venue entrance');
    });
  });

  describe('Check-In Scanner Page', () => {
    it('should have EventCheckIn page', () => {
      const filePath = path.join(ROOT, 'client/src/pages/EventCheckIn.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      // Should import html5-qrcode for camera scanning
      expect(content).toContain('html5-qrcode');
      // Should have manual entry fallback
      expect(content).toContain('Manual Entry');
      // Should show check-in stats
      expect(content).toContain('Checked In');
      expect(content).toContain('Attendance');
    });

    it('should have check-in route registered in App.tsx', () => {
      const appPath = path.join(ROOT, 'client/src/App.tsx');
      const content = fs.readFileSync(appPath, 'utf-8');
      expect(content).toContain('/events/:id/check-in');
      expect(content).toContain('EventCheckIn');
    });

    it('should use dark theme for scanner page (optimized for venue use)', () => {
      const filePath = path.join(ROOT, 'client/src/pages/EventCheckIn.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      // Dark theme for better visibility in dark venues
      expect(content).toContain('from-slate-900');
      expect(content).toContain('to-slate-800');
    });

    it('should handle scan results with success, already_used, and error states', () => {
      const filePath = path.join(ROOT, 'client/src/pages/EventCheckIn.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain("status: 'success'");
      expect(content).toContain('already_used');
      expect(content).toContain("status: 'error'");
      expect(content).toContain('Admitted');
      expect(content).toContain('Already Used');
      expect(content).toContain('Invalid');
    });

    it('should prevent duplicate scans within 3 seconds', () => {
      const filePath = path.join(ROOT, 'client/src/pages/EventCheckIn.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('lastScannedRef');
      expect(content).toContain('3000');
    });
  });

  describe('Ticket Sales Analytics', () => {
    it('should have TicketAnalytics component', () => {
      const filePath = path.join(ROOT, 'client/src/components/TicketAnalytics.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('getSalesSummary');
      expect(content).toContain('Revenue');
      expect(content).toContain('Tickets Sold');
      expect(content).toContain('Sell-Through');
    });

    it('should display per-tier breakdown with progress bars', () => {
      const filePath = path.join(ROOT, 'client/src/components/TicketAnalytics.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('By Ticket Tier');
      expect(content).toContain('tierPercent');
      expect(content).toContain('remaining');
    });

    it('should show recent orders list', () => {
      const filePath = path.join(ROOT, 'client/src/components/TicketAnalytics.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('Recent Orders');
      expect(content).toContain('orderNumber');
      expect(content).toContain('buyerName');
    });

    it('should display platform fee information', () => {
      const filePath = path.join(ROOT, 'client/src/components/TicketAnalytics.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('Platform fees collected');
      expect(content).toContain('$0.99 per ticket');
    });

    it('should have analytics tab in EventTickets page', () => {
      const filePath = path.join(ROOT, 'client/src/pages/EventTickets.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('TicketAnalytics');
      expect(content).toContain('Sales Analytics');
      expect(content).toContain('Manage Tiers');
      expect(content).toContain("activeTab === 'analytics'");
    });
  });

  describe('Check-In API', () => {
    it('should have validateTicket procedure in ticketing router', () => {
      const filePath = path.join(ROOT, 'server/routers/ticketing.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('validateTicket:');
      // Should mark ticket as used
      expect(content).toContain("status: 'used'");
      expect(content).toContain('checkedInAt');
      expect(content).toContain('checkedInBy');
    });

    it('should have getCheckInStats procedure', () => {
      const filePath = path.join(ROOT, 'server/routers/ticketing.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('getCheckInStats:');
      expect(content).toContain('checkedIn');
      expect(content).toContain('remaining');
      expect(content).toContain('percentCheckedIn');
    });

    it('should have getSalesSummary procedure for analytics', () => {
      const filePath = path.join(ROOT, 'server/routers/ticketing.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('getSalesSummary:');
      expect(content).toContain('totalRevenue');
      expect(content).toContain('totalTicketsSold');
      expect(content).toContain('percentSold');
      expect(content).toContain('recentOrders');
    });

    it('should enforce ownership on check-in and analytics endpoints', () => {
      const filePath = path.join(ROOT, 'server/routers/ticketing.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      // Both validateTicket and getCheckInStats should verify event ownership
      const validateSection = content.substring(content.indexOf('validateTicket:'), content.indexOf('getCheckInStats:'));
      expect(validateSection).toContain('FORBIDDEN');
      expect(validateSection).toContain('event organizer');
    });
  });

  describe('Door Check-In Link', () => {
    it('should have Door Check-In button in EventTickets page', () => {
      const filePath = path.join(ROOT, 'client/src/pages/EventTickets.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('Check-In');
      expect(content).toContain('ScanLine');
      expect(content).toContain('/check-in');
    });
  });
});
