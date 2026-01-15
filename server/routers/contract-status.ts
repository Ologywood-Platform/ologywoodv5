import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import * as db from '../db';
import { TRPCError } from '@trpc/server';
import * as email from '../email';

export const contractStatusRouter = router({
  // Sign a contract
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
        signerRole = 'artist';
      } else {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized to sign this contract' });
      }

      // Update contract status
      const updatedContract = await db.updateContract(input.contractId, {
        status: 'signed',
        artistSignedAt: signerRole === 'artist' ? new Date() : undefined,
        venueSignedAt: signerRole === 'venue' ? new Date() : undefined,
      });

      // Send notification email (would be implemented with actual email service)
      // const otherParty = signerRole === 'artist' ? contract.venueId : contract.artistId;
      // const otherUser = await db.getUserById(otherParty);
      // if (otherUser?.email) { ... }

      return updatedContract;
    }),

  // Reject a contract
  reject: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const contract = await db.getContractById(input.contractId);
      if (!contract) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
      }

      // Verify authorization
      const isArtist = ctx.user.role === 'artist' && contract.artistId === ctx.user.id;
      const isVenue = ctx.user.role === 'venue' && contract.venueId === ctx.user.id;
      const isAdmin = ctx.user.role === 'admin';

      if (!isArtist && !isVenue && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized to reject this contract' });
      }

      // Update contract status
      const updatedContract = await db.updateContract(input.contractId, {
        status: 'cancelled',
      });

      // Send notification email (would be implemented with actual email service)
      // const otherParty = isArtist ? contract.venueId : contract.artistId;
      // const otherUser = await db.getUserById(otherParty);
      // if (otherUser?.email) { ... }

      return updatedContract;
    }),

  // Approve a contract
  approve: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const contract = await db.getContractById(input.contractId);
      if (!contract) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
      }

      // Only admins can approve contracts
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can approve contracts' });
      }

      // Update contract status
      const updatedContract = await db.updateContract(input.contractId, {
        status: 'signed',
      });

      // Send notification emails (would be implemented with actual email service)
      // const artist = await db.getUserById(contract.artistId);
      // const venue = await db.getUserById(contract.venueId);
      // if (artist?.email) { ... }
      // if (venue?.email) { ... }

      return updatedContract;
    }),

  // Get contract status options
  getStatusOptions: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .query(async ({ ctx, input }) => {
      const contract = await db.getContractById(input.contractId);
      if (!contract) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
      }

      // Verify authorization
      const isArtist = ctx.user.role === 'artist' && contract.artistId === ctx.user.id;
      const isVenue = ctx.user.role === 'venue' && contract.venueId === ctx.user.id;
      const isAdmin = ctx.user.role === 'admin';

      if (!isArtist && !isVenue && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized to view contract status options' });
      }

      // Determine available actions based on current status and user role
      const availableActions: string[] = [];

      if (contract.status === 'pending_signatures' || contract.status === 'draft') {
        if (isArtist && !contract.artistSignedAt) {
          availableActions.push('sign');
        }
        if (isVenue && !contract.venueSignedAt) {
          availableActions.push('sign');
        }
        availableActions.push('reject');
      }

      if (isAdmin && contract.status === 'signed') {
        availableActions.push('approve');
      }

      if (contract.status !== 'executed' && contract.status !== 'cancelled') {
        availableActions.push('cancel');
      }

      return {
        currentStatus: contract.status,
        availableActions,
        canSign: availableActions.includes('sign'),
        canReject: availableActions.includes('reject'),
        canApprove: availableActions.includes('approve'),
        canCancel: availableActions.includes('cancel'),
      };
    }),
});
