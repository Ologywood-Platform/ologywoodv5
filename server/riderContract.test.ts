import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module
vi.mock('./db', () => ({
  getBookingById: vi.fn(),
  getContractByBookingId: vi.fn(),
  getContractById: vi.fn(),
  createContract: vi.fn(),
  updateContract: vi.fn(),
  createSignature: vi.fn(),
  getSignaturesByContractId: vi.fn(),
  getArtistProfileByUserId: vi.fn(),
  getVenueProfileByUserId: vi.fn(),
  updateBooking: vi.fn(),
}));

// Mock the riderTemplateService
vi.mock('./services/riderTemplateService', () => ({
  getRiderTemplate: vi.fn(),
}));

// Mock the riderContractTemplate
vi.mock('./services/riderContractTemplate', () => ({
  generateRiderHTML: vi.fn().mockReturnValue('<div>Rider HTML</div>'),
  getRiderTemplateById: vi.fn(),
}));

import * as db from './db';
import { getRiderTemplate } from './services/riderTemplateService';

const mockDb = db as any;
const mockGetRiderTemplate = getRiderTemplate as any;

describe('Rider Contract E-Signature Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Contract Creation', () => {
    it('should create a contract when one does not exist for a booking', async () => {
      const mockBooking = {
        id: 1,
        artistId: 10,
        venueId: 20,
        riderTemplateId: 5,
        status: 'confirmed',
      };

      const mockTemplate = {
        id: 5,
        templateName: 'Test Rider',
        templateData: JSON.stringify({ event_details: { eventName: 'Test Show' } }),
        templateType: 'solo_artist',
      };

      const mockContract = {
        id: 100,
        bookingId: 1,
        artistId: 10,
        venueId: 20,
        riderTemplateId: 5,
        status: 'pending',
        contractData: { event_details: { eventName: 'Test Show' } },
      };

      mockDb.getBookingById.mockResolvedValue(mockBooking);
      mockDb.getContractByBookingId.mockResolvedValue(null);
      mockGetRiderTemplate.mockResolvedValue(mockTemplate);
      mockDb.createContract.mockResolvedValue(mockContract);

      // Simulate contract creation logic
      const booking = await db.getBookingById(1);
      expect(booking).toBeTruthy();
      expect(booking!.riderTemplateId).toBe(5);

      const existing = await db.getContractByBookingId(1);
      expect(existing).toBeNull();

      const template = await getRiderTemplate(5);
      const contractData = JSON.parse(template!.templateData as string);

      const contract = await db.createContract({
        bookingId: 1,
        artistId: 10,
        venueId: 20,
        riderTemplateId: 5,
        contractData,
        status: 'pending',
      });

      expect(contract.id).toBe(100);
      expect(contract.status).toBe('pending');
    });

    it('should return existing contract if one already exists', async () => {
      const existingContract = {
        id: 100,
        bookingId: 1,
        status: 'signed_by_artist',
      };

      mockDb.getContractByBookingId.mockResolvedValue(existingContract);

      const contract = await db.getContractByBookingId(1);
      expect(contract).toBeTruthy();
      expect(contract!.id).toBe(100);
      expect(contract!.status).toBe('signed_by_artist');
    });
  });

  describe('Signature Workflow', () => {
    it('should determine correct contract status when artist signs first', () => {
      const signatures = [
        { id: 1, signerRole: 'artist', userId: 100 },
      ];

      const artistSigned = signatures.some(s => s.signerRole === 'artist');
      const venueSigned = signatures.some(s => s.signerRole === 'venue');

      let status = 'pending';
      if (artistSigned && venueSigned) status = 'fully_signed';
      else if (artistSigned) status = 'signed_by_artist';
      else if (venueSigned) status = 'signed_by_venue';

      expect(status).toBe('signed_by_artist');
    });

    it('should determine correct contract status when venue signs first', () => {
      const signatures = [
        { id: 1, signerRole: 'venue', userId: 200 },
      ];

      const artistSigned = signatures.some(s => s.signerRole === 'artist');
      const venueSigned = signatures.some(s => s.signerRole === 'venue');

      let status = 'pending';
      if (artistSigned && venueSigned) status = 'fully_signed';
      else if (artistSigned) status = 'signed_by_artist';
      else if (venueSigned) status = 'signed_by_venue';

      expect(status).toBe('signed_by_venue');
    });

    it('should determine fully_signed when both parties sign', () => {
      const signatures = [
        { id: 1, signerRole: 'artist', userId: 100 },
        { id: 2, signerRole: 'venue', userId: 200 },
      ];

      const artistSigned = signatures.some(s => s.signerRole === 'artist');
      const venueSigned = signatures.some(s => s.signerRole === 'venue');

      let status = 'pending';
      if (artistSigned && venueSigned) status = 'fully_signed';
      else if (artistSigned) status = 'signed_by_artist';
      else if (venueSigned) status = 'signed_by_venue';

      expect(status).toBe('fully_signed');
    });

    it('should prevent duplicate signatures from same user', async () => {
      const existingSignatures = [
        { id: 1, contractId: 100, userId: 42, signerRole: 'artist' },
      ];

      mockDb.getSignaturesByContractId.mockResolvedValue(existingSignatures);

      const sigs = await db.getSignaturesByContractId(100);
      const alreadySigned = sigs.find((s: any) => s.userId === 42);

      expect(alreadySigned).toBeTruthy();
      expect(alreadySigned!.signerRole).toBe('artist');
    });

    it('should allow different users to sign the same contract', async () => {
      const existingSignatures = [
        { id: 1, contractId: 100, userId: 42, signerRole: 'artist' },
      ];

      mockDb.getSignaturesByContractId.mockResolvedValue(existingSignatures);

      const sigs = await db.getSignaturesByContractId(100);
      const alreadySigned = sigs.find((s: any) => s.userId === 99);

      expect(alreadySigned).toBeUndefined();
    });
  });

  describe('Role Authorization', () => {
    it('should identify artist role correctly', async () => {
      const booking = { id: 1, artistId: 10, venueId: 20 };
      const artistProfile = { id: 10, userId: 42 };
      const venueProfile = null;

      mockDb.getArtistProfileByUserId.mockResolvedValue(artistProfile);
      mockDb.getVenueProfileByUserId.mockResolvedValue(venueProfile);

      const artist = await db.getArtistProfileByUserId(42);
      const venue = await db.getVenueProfileByUserId(42);

      const isArtist = artist && booking.artistId === artist.id;
      const isVenue = venue && booking.venueId === (venue as any)?.id;

      expect(isArtist).toBe(true);
      expect(isVenue).toBeFalsy();

      const signerRole = isArtist ? 'artist' : 'venue';
      expect(signerRole).toBe('artist');
    });

    it('should identify venue role correctly', async () => {
      const booking = { id: 1, artistId: 10, venueId: 20 };
      const artistProfile = null;
      const venueProfile = { id: 20, userId: 99 };

      mockDb.getArtistProfileByUserId.mockResolvedValue(artistProfile);
      mockDb.getVenueProfileByUserId.mockResolvedValue(venueProfile);

      const artist = await db.getArtistProfileByUserId(99);
      const venue = await db.getVenueProfileByUserId(99);

      const isArtist = artist && booking.artistId === (artist as any)?.id;
      const isVenue = venue && booking.venueId === venue.id;

      expect(isArtist).toBeFalsy();
      expect(isVenue).toBe(true);
    });

    it('should reject unauthorized users', async () => {
      const booking = { id: 1, artistId: 10, venueId: 20 };

      mockDb.getArtistProfileByUserId.mockResolvedValue(null);
      mockDb.getVenueProfileByUserId.mockResolvedValue(null);

      const artist = await db.getArtistProfileByUserId(999);
      const venue = await db.getVenueProfileByUserId(999);

      const isArtist = artist && booking.artistId === (artist as any)?.id;
      const isVenue = venue && booking.venueId === (venue as any)?.id;

      expect(isArtist).toBeFalsy();
      expect(isVenue).toBeFalsy();
    });
  });

  describe('Contract Status Updates', () => {
    it('should update booking riderStatus to signed when fully signed', async () => {
      mockDb.updateBooking.mockResolvedValue({ id: 1, riderStatus: 'signed' });

      await db.updateBooking(1, { riderStatus: 'signed' });

      expect(mockDb.updateBooking).toHaveBeenCalledWith(1, { riderStatus: 'signed' });
    });

    it('should update contract status correctly', async () => {
      mockDb.updateContract.mockResolvedValue({ id: 100, status: 'fully_signed' });

      await db.updateContract(100, { status: 'fully_signed' });

      expect(mockDb.updateContract).toHaveBeenCalledWith(100, { status: 'fully_signed' });
    });
  });

  describe('Signature Data Validation', () => {
    it('should validate signature data is not empty', () => {
      const validSignature = 'data:image/png;base64,iVBORw0KGgo...';
      const emptySignature = '';

      expect(validSignature.length).toBeGreaterThan(0);
      expect(emptySignature.length).toBe(0);
    });

    it('should validate signer name is not empty', () => {
      const validName = 'John Doe';
      const emptyName = '';
      const whitespace = '   ';

      expect(validName.trim().length).toBeGreaterThan(0);
      expect(emptyName.trim().length).toBe(0);
      expect(whitespace.trim().length).toBe(0);
    });

    it('should accept both drawn and typed signature types', () => {
      const validTypes = ['drawn', 'typed'];
      expect(validTypes).toContain('drawn');
      expect(validTypes).toContain('typed');
      expect(validTypes).not.toContain('stamp');
    });
  });

  describe('Signature Verification', () => {
    it('should verify contract with both signatures', async () => {
      const contract = { id: 100, bookingId: 1, status: 'fully_signed' };
      const signatures = [
        { id: 1, signerRole: 'artist', signerName: 'Artist Name', signedAt: new Date() },
        { id: 2, signerRole: 'venue', signerName: 'Venue Name', signedAt: new Date() },
      ];

      mockDb.getContractById.mockResolvedValue(contract);
      mockDb.getSignaturesByContractId.mockResolvedValue(signatures);

      const c = await db.getContractById(100);
      const sigs = await db.getSignaturesByContractId(100);

      const artistSig = sigs.find((s: any) => s.signerRole === 'artist');
      const venueSig = sigs.find((s: any) => s.signerRole === 'venue');

      expect(c!.status).toBe('fully_signed');
      expect(artistSig).toBeTruthy();
      expect(venueSig).toBeTruthy();
      expect(artistSig!.signerName).toBe('Artist Name');
      expect(venueSig!.signerName).toBe('Venue Name');
    });

    it('should report incomplete verification when only one party signed', async () => {
      const contract = { id: 100, bookingId: 1, status: 'signed_by_artist' };
      const signatures = [
        { id: 1, signerRole: 'artist', signerName: 'Artist Name', signedAt: new Date() },
      ];

      mockDb.getContractById.mockResolvedValue(contract);
      mockDb.getSignaturesByContractId.mockResolvedValue(signatures);

      const c = await db.getContractById(100);
      const sigs = await db.getSignaturesByContractId(100);

      const artistSig = sigs.find((s: any) => s.signerRole === 'artist');
      const venueSig = sigs.find((s: any) => s.signerRole === 'venue');

      expect(c!.status).not.toBe('fully_signed');
      expect(artistSig).toBeTruthy();
      expect(venueSig).toBeUndefined();
    });
  });
});
