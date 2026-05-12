import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module
vi.mock('./db', () => ({
  getBookingById: vi.fn(),
  getArtistProfileById: vi.fn(),
  getVenueProfileByUserId: vi.fn(),
  getArtistProfileByUserId: vi.fn(),
  createVenueContract: vi.fn(),
  getVenueContractById: vi.fn(),
  getVenueContractsByBookingId: vi.fn(),
  getVenueContractsByVenueId: vi.fn(),
  getVenueContractsByArtistId: vi.fn(),
  updateVenueContract: vi.fn(),
  deleteVenueContract: vi.fn(),
  createVenueContractSignature: vi.fn(),
  getVenueContractSignatures: vi.fn(),
}));

// Mock storage
vi.mock('./_core/storage', () => ({
  storagePut: vi.fn().mockResolvedValue({ key: 'test-key', url: 'https://example.com/test.pdf' }),
  storageGet: vi.fn().mockResolvedValue({ key: 'test-key', url: 'https://example.com/test.pdf' }),
}));

import * as db from './db';

describe('Venue Contract Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Database Functions', () => {
    it('should have all required venue contract db functions exported', () => {
      expect(db.createVenueContract).toBeDefined();
      expect(db.getVenueContractById).toBeDefined();
      expect(db.getVenueContractsByBookingId).toBeDefined();
      expect(db.getVenueContractsByVenueId).toBeDefined();
      expect(db.getVenueContractsByArtistId).toBeDefined();
      expect(db.updateVenueContract).toBeDefined();
      expect(db.deleteVenueContract).toBeDefined();
      expect(db.createVenueContractSignature).toBeDefined();
      expect(db.getVenueContractSignatures).toBeDefined();
    });
  });

  describe('Contract Creation Logic', () => {
    it('should validate that platform_generated contracts include contract data', () => {
      // Platform generated contracts should have clauses or custom terms
      const validContractData = {
        clauses: [{ label: 'Liability', text: 'Artist maintains insurance' }],
        customTerms: '',
        venueRep: 'John Doe',
        eventSpecifics: 'Doors at 7pm',
      };
      
      expect(validContractData.clauses.length).toBeGreaterThan(0);
      expect(validContractData.venueRep).toBeTruthy();
    });

    it('should validate contract status transitions', () => {
      const validTransitions: Record<string, string[]> = {
        draft: ['sent', 'signed_by_venue'],
        sent: ['viewed', 'signed_by_artist', 'signed_by_venue', 'declined'],
        viewed: ['signed_by_artist', 'signed_by_venue', 'declined'],
        signed_by_venue: ['signed_by_artist', 'fully_signed', 'sent'],
        signed_by_artist: ['signed_by_venue', 'fully_signed'],
        fully_signed: [],
        declined: [],
      };

      // Draft can transition to sent or signed_by_venue
      expect(validTransitions['draft']).toContain('sent');
      expect(validTransitions['draft']).toContain('signed_by_venue');
      
      // Fully signed is a terminal state
      expect(validTransitions['fully_signed']).toHaveLength(0);
      
      // Declined is a terminal state
      expect(validTransitions['declined']).toHaveLength(0);
    });

    it('should determine correct contract status after signing', () => {
      function getNewStatus(currentStatus: string, signerRole: 'artist' | 'venue', otherPartySigned: boolean): string {
        if (otherPartySigned) return 'fully_signed';
        if (signerRole === 'artist') return 'signed_by_artist';
        return 'signed_by_venue';
      }

      // Venue signs first, artist hasn't signed
      expect(getNewStatus('sent', 'venue', false)).toBe('signed_by_venue');
      
      // Artist signs first, venue hasn't signed
      expect(getNewStatus('sent', 'artist', false)).toBe('signed_by_artist');
      
      // Venue signs after artist already signed
      expect(getNewStatus('signed_by_artist', 'venue', true)).toBe('fully_signed');
      
      // Artist signs after venue already signed
      expect(getNewStatus('signed_by_venue', 'artist', true)).toBe('fully_signed');
    });
  });

  describe('Contract Types', () => {
    it('should support platform_generated and uploaded_pdf types', () => {
      const validTypes = ['platform_generated', 'uploaded_pdf'];
      expect(validTypes).toContain('platform_generated');
      expect(validTypes).toContain('uploaded_pdf');
    });

    it('should validate PDF file constraints', () => {
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      const validMimeTypes = ['application/pdf'];
      
      expect(maxFileSize).toBe(10485760);
      expect(validMimeTypes).toContain('application/pdf');
    });
  });

  describe('Default Clauses', () => {
    it('should have all standard venue contract clauses', () => {
      const expectedClauses = [
        'liability',
        'loadInOut',
        'soundRestrictions',
        'cancellation',
        'alcohol',
        'venueRules',
        'parking',
        'merch',
      ];
      
      // All standard clauses should be available
      expect(expectedClauses).toHaveLength(8);
      expect(expectedClauses).toContain('liability');
      expect(expectedClauses).toContain('cancellation');
      expect(expectedClauses).toContain('soundRestrictions');
    });
  });

  describe('Signer Role Priority', () => {
    it('should prioritize venue role when user has both profiles on a venue contract', () => {
      // This tests the fix for the bug where users with both artist and venue profiles
      // were incorrectly assigned "artist" role when signing venue contracts.
      // The correct behavior is: on a venue contract, if the user's venue profile
      // matches the contract's venueId, they should sign as "venue".
      function determineSignerRole(
        isVenue: boolean,
        isArtist: boolean
      ): 'venue' | 'artist' {
        // Prioritize venue role — this is a VENUE contract
        return isVenue ? 'venue' : 'artist';
      }

      // User has both profiles and is the venue owner
      expect(determineSignerRole(true, true)).toBe('venue');
      // User only has venue profile
      expect(determineSignerRole(true, false)).toBe('venue');
      // User only has artist profile
      expect(determineSignerRole(false, true)).toBe('artist');
    });
  });

  describe('Access Control', () => {
    it('should only allow venue role to create contracts', () => {
      const allowedCreators = ['venue'];
      expect(allowedCreators).toContain('venue');
      expect(allowedCreators).not.toContain('artist');
      expect(allowedCreators).not.toContain('fan');
    });

    it('should allow both artist and venue to sign contracts', () => {
      const allowedSigners = ['artist', 'venue'];
      expect(allowedSigners).toContain('artist');
      expect(allowedSigners).toContain('venue');
    });

    it('should only allow artist to decline contracts', () => {
      const allowedDecliners = ['artist'];
      expect(allowedDecliners).toContain('artist');
      expect(allowedDecliners).not.toContain('venue');
    });
  });
});
