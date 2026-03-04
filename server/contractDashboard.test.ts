import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module
vi.mock('./db', () => ({
  getContractsByArtistId: vi.fn(),
  getContractsByVenueId: vi.fn(),
  getArtistProfileByUserId: vi.fn(),
  getVenueProfileByUserId: vi.fn(),
  getArtistProfileById: vi.fn(),
  getVenueProfileById: vi.fn(),
  getBookingById: vi.fn(),
  getSignaturesByContractId: vi.fn(),
  getRiderTemplateById: vi.fn(),
}));

import * as db from './db';
const mockDb = db as any;

describe('Contract Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Data enrichment logic', () => {
    const mockContract = {
      id: 1,
      bookingId: 10,
      artistId: 100,
      venueId: 200,
      status: 'fully_signed',
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-20'),
    };

    const mockBooking = {
      id: 10,
      artistId: 100,
      venueId: 200,
      eventDate: new Date('2026-03-15'),
      eventDetails: 'Live concert at Main Stage',
      totalFee: '5000.00',
      status: 'confirmed',
      riderTemplateId: 5,
    };

    const mockArtistProfile = {
      id: 100,
      userId: 1,
      artistName: 'DJ Thunder',
    };

    const mockVenueProfile = {
      id: 200,
      userId: 2,
      organizationName: 'The Grand Hall',
    };

    const mockRiderTemplate = {
      id: 5,
      templateName: 'Standard Performance Rider',
    };

    const mockArtistSignature = {
      id: 1,
      contractId: 1,
      userId: 1,
      signerRole: 'artist',
      signerName: 'DJ Thunder',
      signedAt: new Date('2026-01-16'),
      signatureData: 'base64data',
    };

    const mockVenueSignature = {
      id: 2,
      contractId: 1,
      userId: 2,
      signerRole: 'venue',
      signerName: 'John Manager',
      signedAt: new Date('2026-01-18'),
      signatureData: 'base64data',
    };

    it('should return enriched contracts for an artist user', async () => {
      mockDb.getArtistProfileByUserId.mockResolvedValue(mockArtistProfile);
      mockDb.getContractsByArtistId.mockResolvedValue([mockContract]);
      mockDb.getBookingById.mockResolvedValue(mockBooking);
      mockDb.getSignaturesByContractId.mockResolvedValue([mockArtistSignature, mockVenueSignature]);
      mockDb.getArtistProfileById.mockResolvedValue(mockArtistProfile);
      mockDb.getVenueProfileById.mockResolvedValue(mockVenueProfile);
      mockDb.getRiderTemplateById.mockResolvedValue(mockRiderTemplate);

      // Simulate the enrichment logic from the router
      const artistProfile = await db.getArtistProfileByUserId(1);
      expect(artistProfile).toBeTruthy();

      const contracts = await db.getContractsByArtistId(artistProfile!.id);
      expect(contracts).toHaveLength(1);

      const contract = contracts[0];
      const booking = await db.getBookingById(contract.bookingId);
      const sigs = await db.getSignaturesByContractId(contract.id);
      const artistSig = sigs.find((s: any) => s.signerRole === 'artist');
      const venueSig = sigs.find((s: any) => s.signerRole === 'venue');

      expect(booking).toBeTruthy();
      expect(booking!.eventDate).toEqual(new Date('2026-03-15'));
      expect(artistSig).toBeTruthy();
      expect(artistSig!.signerName).toBe('DJ Thunder');
      expect(venueSig).toBeTruthy();
      expect(venueSig!.signerName).toBe('John Manager');
    });

    it('should return enriched contracts for a venue user', async () => {
      mockDb.getVenueProfileByUserId.mockResolvedValue(mockVenueProfile);
      mockDb.getContractsByVenueId.mockResolvedValue([mockContract]);
      mockDb.getBookingById.mockResolvedValue(mockBooking);
      mockDb.getSignaturesByContractId.mockResolvedValue([mockArtistSignature, mockVenueSignature]);
      mockDb.getArtistProfileById.mockResolvedValue(mockArtistProfile);
      mockDb.getVenueProfileById.mockResolvedValue(mockVenueProfile);
      mockDb.getRiderTemplateById.mockResolvedValue(mockRiderTemplate);

      const venueProfile = await db.getVenueProfileByUserId(2);
      expect(venueProfile).toBeTruthy();

      const contracts = await db.getContractsByVenueId(venueProfile!.id);
      expect(contracts).toHaveLength(1);

      const contract = contracts[0];
      const booking = await db.getBookingById(contract.bookingId);
      expect(booking!.totalFee).toBe('5000.00');
    });

    it('should handle contracts with no signatures (pending status)', async () => {
      const pendingContract = { ...mockContract, status: 'pending' };
      mockDb.getArtistProfileByUserId.mockResolvedValue(mockArtistProfile);
      mockDb.getContractsByArtistId.mockResolvedValue([pendingContract]);
      mockDb.getBookingById.mockResolvedValue(mockBooking);
      mockDb.getSignaturesByContractId.mockResolvedValue([]);
      mockDb.getArtistProfileById.mockResolvedValue(mockArtistProfile);
      mockDb.getVenueProfileById.mockResolvedValue(mockVenueProfile);
      mockDb.getRiderTemplateById.mockResolvedValue(mockRiderTemplate);

      const sigs = await db.getSignaturesByContractId(pendingContract.id);
      const artistSig = sigs.find((s: any) => s.signerRole === 'artist');
      const venueSig = sigs.find((s: any) => s.signerRole === 'venue');

      expect(artistSig).toBeUndefined();
      expect(venueSig).toBeUndefined();
    });

    it('should handle contracts with only artist signature', async () => {
      const partialContract = { ...mockContract, status: 'signed_by_artist' };
      mockDb.getSignaturesByContractId.mockResolvedValue([mockArtistSignature]);

      const sigs = await db.getSignaturesByContractId(partialContract.id);
      const artistSig = sigs.find((s: any) => s.signerRole === 'artist');
      const venueSig = sigs.find((s: any) => s.signerRole === 'venue');

      expect(artistSig).toBeTruthy();
      expect(venueSig).toBeUndefined();
    });

    it('should return empty array when user has no profile', async () => {
      mockDb.getArtistProfileByUserId.mockResolvedValue(null);

      const artistProfile = await db.getArtistProfileByUserId(999);
      expect(artistProfile).toBeNull();
      // When profile is null, the router returns empty array
    });

    it('should merge artist and venue contracts for admin users without duplicates', async () => {
      const contract2 = { ...mockContract, id: 2, bookingId: 11 };
      mockDb.getArtistProfileByUserId.mockResolvedValue(mockArtistProfile);
      mockDb.getVenueProfileByUserId.mockResolvedValue(mockVenueProfile);
      mockDb.getContractsByArtistId.mockResolvedValue([mockContract]);
      mockDb.getContractsByVenueId.mockResolvedValue([mockContract, contract2]); // mockContract is a duplicate

      const artistContracts = await db.getContractsByArtistId(100);
      const venueContracts = await db.getContractsByVenueId(200);

      // Simulate merge logic
      const contractsList = [...artistContracts];
      const existingIds = new Set(contractsList.map((c: any) => c.id));
      for (const vc of venueContracts) {
        if (!existingIds.has(vc.id)) contractsList.push(vc);
      }

      expect(contractsList).toHaveLength(2); // Not 3 (duplicate removed)
      expect(contractsList.map((c: any) => c.id)).toEqual([1, 2]);
    });

    it('should sort contracts by most recent updatedAt first', () => {
      const contracts = [
        { id: 1, updatedAt: new Date('2026-01-10') },
        { id: 2, updatedAt: new Date('2026-01-20') },
        { id: 3, updatedAt: new Date('2026-01-15') },
      ];

      contracts.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });

      expect(contracts[0].id).toBe(2); // Most recent first
      expect(contracts[1].id).toBe(3);
      expect(contracts[2].id).toBe(1);
    });

    it('should resolve rider template name from booking', async () => {
      mockDb.getBookingById.mockResolvedValue(mockBooking);
      mockDb.getRiderTemplateById.mockResolvedValue(mockRiderTemplate);

      const booking = await db.getBookingById(10);
      expect(booking!.riderTemplateId).toBe(5);

      const tmpl = await db.getRiderTemplateById(booking!.riderTemplateId!);
      expect(tmpl!.templateName).toBe('Standard Performance Rider');
    });

    it('should use fallback names when profiles are not found', async () => {
      mockDb.getArtistProfileById.mockResolvedValue(null);
      mockDb.getVenueProfileById.mockResolvedValue(null);

      const artistProf = await db.getArtistProfileById(999);
      const venueProf = await db.getVenueProfileById(999);

      // Simulate the fallback logic
      let artistName = 'Unknown Artist';
      let venueName = 'Unknown Venue';
      if (artistProf) artistName = (artistProf as any).artistName || artistName;
      if (venueProf) venueName = (venueProf as any).organizationName || venueName;

      expect(artistName).toBe('Unknown Artist');
      expect(venueName).toBe('Unknown Venue');
    });
  });

  describe('Contract status filtering', () => {
    const contracts = [
      { id: 1, status: 'fully_signed' },
      { id: 2, status: 'pending' },
      { id: 3, status: 'signed_by_artist' },
      { id: 4, status: 'signed_by_venue' },
      { id: 5, status: 'fully_signed' },
    ];

    it('should filter to show all contracts', () => {
      const filtered = contracts.filter(() => true);
      expect(filtered).toHaveLength(5);
    });

    it('should filter to show only fully signed contracts', () => {
      const filtered = contracts.filter(c => c.status === 'fully_signed');
      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => c.status === 'fully_signed')).toBe(true);
    });

    it('should filter to show only pending contracts (not fully signed)', () => {
      const filtered = contracts.filter(c =>
        c.status === 'pending' || c.status === 'signed_by_artist' || c.status === 'signed_by_venue'
      );
      expect(filtered).toHaveLength(3);
      expect(filtered.every(c => c.status !== 'fully_signed')).toBe(true);
    });

    it('should correctly count signed vs pending', () => {
      const signedCount = contracts.filter(c => c.status === 'fully_signed').length;
      const pendingCount = contracts.length - signedCount;
      expect(signedCount).toBe(2);
      expect(pendingCount).toBe(3);
    });
  });
});
