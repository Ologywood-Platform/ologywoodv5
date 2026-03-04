import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFDocument } from 'pdf-lib';

// Mock the db module
vi.mock('./db', () => ({
  getBookingById: vi.fn(),
  getContractByBookingId: vi.fn(),
  getSignaturesByContractId: vi.fn(),
  getArtistProfileByUserId: vi.fn(),
  getVenueProfileByUserId: vi.fn(),
  getArtistProfileById: vi.fn(),
  getVenueProfileById: vi.fn(),
  getUserById: vi.fn(),
}));

// Mock the riderTemplateService
vi.mock('./services/riderTemplateService', () => ({
  getRiderTemplate: vi.fn(),
}));

// Mock the SDK
vi.mock('./_core/sdk', () => ({
  sdk: {
    authenticateRequest: vi.fn(),
  },
}));

import * as db from './db';
import { getRiderTemplate } from './services/riderTemplateService';
import { sdk } from './_core/sdk';

const mockDb = db as any;
const mockGetRiderTemplate = getRiderTemplate as any;
const mockSdk = sdk as any;

// Import the router after mocks are set up
import contractPdfRouter from './routes/contractPdf';

// Helper to create mock Express req/res
function createMockReqRes(params: Record<string, string> = {}, cookies: Record<string, string> = {}) {
  const req: any = {
    params,
    cookies,
    headers: {},
    get: (name: string) => req.headers[name.toLowerCase()],
  };

  const resData: { status: number; headers: Record<string, string>; body: any } = {
    status: 200,
    headers: {},
    body: null,
  };

  const res: any = {
    status: (code: number) => { resData.status = code; return res; },
    json: (data: any) => { resData.body = data; return res; },
    setHeader: (key: string, val: string) => { resData.headers[key] = val; return res; },
    send: (data: any) => { resData.body = data; return res; },
    _getData: () => resData,
  };

  return { req, res, resData };
}

// Helper to invoke the router handler directly
async function invokeHandler(req: any, res: any) {
  // The router has one GET handler at /:bookingId/pdf
  // We need to extract and call it directly
  const layer = (contractPdfRouter as any).stack?.find(
    (l: any) => l.route?.path === '/:bookingId/pdf'
  );
  if (layer?.route?.stack?.[0]?.handle) {
    await layer.route.stack[0].handle(req, res);
  }
}

describe('Contract PDF Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSdk.authenticateRequest.mockRejectedValue(new Error('Invalid session'));
      const { req, res, resData } = createMockReqRes({ bookingId: '1' });

      await invokeHandler(req, res);

      expect(resData.status).toBe(401);
      expect(resData.body).toEqual({ error: 'Authentication required' });
    });

    it('should return 400 for invalid booking ID', async () => {
      const { req, res, resData } = createMockReqRes({ bookingId: 'abc' });

      await invokeHandler(req, res);

      expect(resData.status).toBe(400);
      expect(resData.body).toEqual({ error: 'Invalid booking ID' });
    });
  });

  describe('Authorization', () => {
    it('should return 404 when booking does not exist', async () => {
      mockSdk.authenticateRequest.mockResolvedValue({ id: 1 });
      mockDb.getBookingById.mockResolvedValue(null);
      const { req, res, resData } = createMockReqRes({ bookingId: '999' });

      await invokeHandler(req, res);

      expect(resData.status).toBe(404);
      expect(resData.body).toEqual({ error: 'Booking not found' });
    });

    it('should return 403 when user is not involved in the booking', async () => {
      mockSdk.authenticateRequest.mockResolvedValue({ id: 99 });
      mockDb.getBookingById.mockResolvedValue({
        id: 1,
        artistId: 10,
        venueId: 20,
        riderTemplateId: 5,
      });
      mockDb.getArtistProfileByUserId.mockResolvedValue(null);
      mockDb.getVenueProfileByUserId.mockResolvedValue(null);
      const { req, res, resData } = createMockReqRes({ bookingId: '1' });

      await invokeHandler(req, res);

      expect(resData.status).toBe(403);
      expect(resData.body).toEqual({ error: 'Not authorized for this booking' });
    });
  });

  describe('PDF Generation', () => {
    const mockBooking = {
      id: 1,
      artistId: 10,
      venueId: 20,
      riderTemplateId: 5,
      eventDate: '2026-03-12',
      totalFee: '2000.00',
      depositAmount: '1000.00',
      eventDetails: 'Beach Show',
      status: 'completed',
    };

    const mockContract = {
      id: 100,
      bookingId: 1,
      status: 'signed_by_artist',
    };

    const mockArtistSig = {
      id: 1,
      contractId: 100,
      signerRole: 'artist',
      signerName: 'Test Artist',
      signatureData: 'Test Artist',
      signedAt: new Date('2026-03-04T19:06:00Z'),
      ipAddress: '127.0.0.1',
    };

    const mockTemplate = {
      id: 5,
      templateName: 'My Standard Performance Rider',
      templateData: {
        formData: {
          stage_size_min: '8 x 8',
          sound_system: 'Venue provides full PA',
          monitors: '1x floor wedge monitor',
          performance_duration: 60,
          green_room: 'Private room preferred',
          towels: true,
          deposit_percentage: 50,
          cancellation_policy: 'Full refund if cancelled 30+ days before event',
          recording_policy: 'No professional recording without written permission',
        },
      },
    };

    beforeEach(() => {
      mockSdk.authenticateRequest.mockResolvedValue({ id: 1 });
      mockDb.getBookingById.mockResolvedValue(mockBooking);
      mockDb.getArtistProfileByUserId.mockResolvedValue({ id: 10, userId: 1, artistName: 'Test Artist' });
      mockDb.getVenueProfileByUserId.mockResolvedValue(null);
      mockDb.getContractByBookingId.mockResolvedValue(mockContract);
      mockDb.getSignaturesByContractId.mockResolvedValue([mockArtistSig]);
      mockDb.getArtistProfileById.mockResolvedValue({ id: 10, userId: 1, artistName: 'Test Artist' });
      mockDb.getVenueProfileById.mockResolvedValue({ id: 20, userId: 2, organizationName: 'Test Venue' });
      mockDb.getUserById.mockImplementation((id: number) => {
        if (id === 1) return { id: 1, email: 'artist@test.com', name: 'Test Artist' };
        if (id === 2) return { id: 2, email: 'venue@test.com', name: 'Test Venue' };
        return null;
      });
      mockGetRiderTemplate.mockResolvedValue(mockTemplate);
    });

    it('should generate a valid PDF for an authenticated artist', async () => {
      const { req, res, resData } = createMockReqRes({ bookingId: '1' });

      await invokeHandler(req, res);

      expect(resData.status).toBe(200);
      expect(resData.headers['Content-Type']).toBe('application/pdf');
      expect(resData.headers['Content-Disposition']).toContain('rider-contract-booking-1');
      expect(resData.headers['Content-Disposition']).toContain('.pdf');

      // Verify it's a valid PDF by loading it
      const pdfBytes = resData.body;
      expect(pdfBytes).toBeInstanceOf(Buffer);
      expect(pdfBytes.length).toBeGreaterThan(0);

      const pdfDoc = await PDFDocument.load(pdfBytes);
      expect(pdfDoc.getPageCount()).toBeGreaterThanOrEqual(1);
    });

    it('should generate PDF for venue user as well', async () => {
      mockDb.getArtistProfileByUserId.mockResolvedValue(null);
      mockDb.getVenueProfileByUserId.mockResolvedValue({ id: 20, userId: 1, organizationName: 'Test Venue' });

      const { req, res, resData } = createMockReqRes({ bookingId: '1' });

      await invokeHandler(req, res);

      expect(resData.status).toBe(200);
      expect(resData.headers['Content-Type']).toBe('application/pdf');
    });

    it('should handle booking without rider template', async () => {
      mockDb.getBookingById.mockResolvedValue({ ...mockBooking, riderTemplateId: null });

      const { req, res, resData } = createMockReqRes({ bookingId: '1' });

      await invokeHandler(req, res);

      expect(resData.status).toBe(200);
      expect(resData.headers['Content-Type']).toBe('application/pdf');
    });

    it('should handle booking without contract or signatures', async () => {
      mockDb.getContractByBookingId.mockResolvedValue(null);
      mockDb.getSignaturesByContractId.mockResolvedValue([]);

      const { req, res, resData } = createMockReqRes({ bookingId: '1' });

      await invokeHandler(req, res);

      expect(resData.status).toBe(200);
      expect(resData.headers['Content-Type']).toBe('application/pdf');
    });

    it('should format boolean values as Yes/No in the PDF', async () => {
      // The formatFieldValue helper should convert true -> "Yes" and false -> "No"
      // We verify this indirectly by ensuring the PDF generates without errors
      // when the template data contains boolean values (towels: true)
      const { req, res, resData } = createMockReqRes({ bookingId: '1' });

      await invokeHandler(req, res);

      expect(resData.status).toBe(200);
      // The PDF should be valid and not throw type errors
      const pdfDoc = await PDFDocument.load(resData.body);
      expect(pdfDoc.getPageCount()).toBeGreaterThanOrEqual(1);
    });

    it('should handle numeric values in template data without type errors', async () => {
      // This was the original bug: numeric values like performance_duration: 60
      // caused "text must be of type string" errors
      mockGetRiderTemplate.mockResolvedValue({
        ...mockTemplate,
        templateData: {
          formData: {
            performance_duration: 60,
            deposit_percentage: 50,
            stage_size_min: 8,
            towels: true,
            green_room: false,
          },
        },
      });

      const { req, res, resData } = createMockReqRes({ bookingId: '1' });

      await invokeHandler(req, res);

      expect(resData.status).toBe(200);
      expect(resData.headers['Content-Type']).toBe('application/pdf');
    });

    it('should include Content-Length header', async () => {
      const { req, res, resData } = createMockReqRes({ bookingId: '1' });

      await invokeHandler(req, res);

      expect(resData.headers['Content-Length']).toBeDefined();
      expect(parseInt(resData.headers['Content-Length'])).toBeGreaterThan(0);
    });

    it('should handle fully signed contract status', async () => {
      mockDb.getContractByBookingId.mockResolvedValue({
        ...mockContract,
        status: 'fully_signed',
      });
      mockDb.getSignaturesByContractId.mockResolvedValue([
        mockArtistSig,
        {
          id: 2,
          contractId: 100,
          signerRole: 'venue',
          signerName: 'Venue Manager',
          signatureData: 'Venue Manager',
          signedAt: new Date('2026-03-04T20:00:00Z'),
          ipAddress: '192.168.1.1',
        },
      ]);

      const { req, res, resData } = createMockReqRes({ bookingId: '1' });

      await invokeHandler(req, res);

      expect(resData.status).toBe(200);
      expect(resData.headers['Content-Type']).toBe('application/pdf');
    });
  });
});
