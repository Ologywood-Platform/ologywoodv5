import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import * as db from '../db';
import { TRPCError } from '@trpc/server';
import * as email from '../email';
import { v4 as uuidv4 } from 'uuid';

// Helper to check if user is an artist
const artistProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'artist' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Artist access required' });
  }
  return next({ ctx });
});

// Helper to check if user is a venue
const venueProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'venue' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Venue access required' });
  }
  return next({ ctx });
});

export const contractsRouter = router({
  // Create a new contract for a booking
  create: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      contractType: z.enum(['ryder', 'performance', 'custom']).default('ryder'),
      contractTitle: z.string(),
      contractContent: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
      }

      // Verify user is either the artist or venue for this booking
      const isArtist = ctx.user.role === 'artist' && booking.artistId === ctx.user.id;
      const isVenue = ctx.user.role === 'venue' && booking.venueId === ctx.user.id;
      const isAdmin = ctx.user.role === 'admin';

      if (!isArtist && !isVenue && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized to create contract for this booking' });
      }

      const contract = await db.createContract({
        bookingId: input.bookingId,
        artistId: booking.artistId,
        venueId: booking.venueId,
        contractType: input.contractType,
        contractTitle: input.contractTitle,
        contractContent: input.contractContent,
        status: 'pending_signatures',
      });

      return contract;
    }),

  // Get contract by ID
  getById: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .query(async ({ ctx, input }) => {
      const contract = await db.getContractById(input.contractId);
      if (!contract) {
        return null;
      }

      // Verify user has access
      const isArtist = ctx.user.role === 'artist' && contract.artistId === ctx.user.id;
      const isVenue = ctx.user.role === 'venue' && contract.venueId === ctx.user.id;
      const isAdmin = ctx.user.role === 'admin';

      if (!isArtist && !isVenue && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized to view this contract' });
      }

      return contract || null;
    }),

  // Get contract by booking ID
  getByBookingId: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const contract = await db.getContractByBookingId(input.bookingId);
      if (!contract) {
        return null;
      }

      // Verify user has access
      const isArtist = ctx.user.role === 'artist' && contract.artistId === ctx.user.id;
      const isVenue = ctx.user.role === 'venue' && contract.venueId === ctx.user.id;
      const isAdmin = ctx.user.role === 'admin';

      if (!isArtist && !isVenue && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized to view this contract' });
      }

      return contract;
    }),

  // Get all contracts for current user
  getMyContracts: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role === 'artist') {
        const contracts = await db.getContractsByArtistId(ctx.user.id);
        return contracts || [];
      } else if (ctx.user.role === 'venue') {
        const contracts = await db.getContractsByVenueId(ctx.user.id);
        return contracts || [];
      }
      return [];
    }),

  // Update contract content
  update: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      contractTitle: z.string().optional(),
      contractContent: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const contract = await db.getContractById(input.contractId);
      if (!contract) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
      }

      // Only allow updates if contract is in draft or pending_signatures status
      if (contract.status !== 'draft' && contract.status !== 'pending_signatures') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot update a signed or executed contract' });
      }

      // Verify user is the creator (artist or venue)
      const isArtist = ctx.user.role === 'artist' && contract.artistId === ctx.user.id;
      const isVenue = ctx.user.role === 'venue' && contract.venueId === ctx.user.id;
      const isAdmin = ctx.user.role === 'admin';

      if (!isArtist && !isVenue && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized to update this contract' });
      }

      return await db.updateContract(input.contractId, {
        contractTitle: input.contractTitle,
        contractContent: input.contractContent,
      });
    }),

  // Record a signature
  sign: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      signatureData: z.string(),
      signatureType: z.enum(['canvas', 'typed', 'image']),
    }))
    .mutation(async ({ ctx, input }) => {
      const contract = await db.getContractById(input.contractId);
      if (!contract) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
      }

      // Determine signer role
      let signerRole: 'artist' | 'venue';
      if (ctx.user.role === 'artist' && contract.artistId === ctx.user.id) {
        signerRole = 'artist';
      } else if (ctx.user.role === 'venue' && contract.venueId === ctx.user.id) {
        signerRole = 'venue';
      } else if (ctx.user.role === 'admin') {
        // Admin can sign as either party - determine based on context
        signerRole = 'artist'; // Default to artist
      } else {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized to sign this contract' });
      }

      // Check if already signed by this party
      const existingSignature = await db.getSignatureByContractAndSigner(input.contractId, ctx.user.id);
      if (existingSignature) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already signed by this party' });
      }

      // Create signature record
      const verificationToken = uuidv4();
      const signature = await db.createSignature({
        contractId: input.contractId,
        signerId: ctx.user.id,
        signerRole,
        signatureData: input.signatureData,
        signatureType: input.signatureType,
        ipAddress: ctx.req.ip || 'unknown',
        userAgent: ctx.req.headers['user-agent'] || 'unknown',
        verificationToken,
      });

      // Update contract signed timestamp
      if (signerRole === 'artist') {
        await db.updateContract(input.contractId, {
          artistSignedAt: new Date(),
        });
      } else {
        await db.updateContract(input.contractId, {
          venueSignedAt: new Date(),
        });
      }

      // Check if both parties have signed
      const allSignatures = await db.getSignaturesByContractId(input.contractId);
      if (allSignatures.length >= 2) {
        // Both parties have signed - update contract status
        await db.updateContract(input.contractId, {
          status: 'signed',
        });

        // Send notification emails
        const artist = await db.getUserById(contract.artistId);
        const venue = await db.getUserById(contract.venueId);

        if (artist?.email) {
          await email.sendContractSigned({
            to: artist.email,
            artistName: artist.name || 'Artist',
            venueName: venue?.name || 'Venue',
            contractTitle: contract.contractTitle,
          });
        }

        if (venue?.email) {
          await email.sendContractSigned({
            to: venue.email,
            artistName: artist?.name || 'Artist',
            venueName: venue.name || 'Venue',
            contractTitle: contract.contractTitle,
          });
        }
      }

      return signature;
    }),

  // Get signatures for a contract
  getSignatures: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .query(async ({ ctx, input }) => {
      const contract = await db.getContractById(input.contractId);
      if (!contract) {
        return [];
      }

      // Verify access
      const isArtist = ctx.user.role === 'artist' && contract.artistId === ctx.user.id;
      const isVenue = ctx.user.role === 'venue' && contract.venueId === ctx.user.id;
      const isAdmin = ctx.user.role === 'admin';

      if (!isArtist && !isVenue && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized to view signatures' });
      }

      const signatures = await db.getSignaturesByContractId(input.contractId);
      return signatures || [];
    }),

  // Cancel a contract
  cancel: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const contract = await db.getContractById(input.contractId);
      if (!contract) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
      }

      // Only allow cancellation if not already executed
      if (contract.status === 'executed' || contract.status === 'cancelled') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot cancel this contract' });
      }

      // Verify user is authorized
      const isArtist = ctx.user.role === 'artist' && contract.artistId === ctx.user.id;
      const isVenue = ctx.user.role === 'venue' && contract.venueId === ctx.user.id;
      const isAdmin = ctx.user.role === 'admin';

      if (!isArtist && !isVenue && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized to cancel this contract' });
      }

      return await db.updateContract(input.contractId, {
        status: 'cancelled',
      });
    }),
});
