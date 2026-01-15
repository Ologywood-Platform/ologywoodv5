import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import * as db from '../db';
import { TRPCError } from '@trpc/server';

export const contractAuditRouter = router({
  // Log a contract action
  logAction: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      action: z.enum(['created', 'updated', 'signed', 'rejected', 'approved', 'cancelled']),
      details: z.string().optional(),
      changedFields: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to this contract
      const contract = await db.getContractById(input.contractId);
      if (!contract) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
      }

      const isArtist = ctx.user.role === 'artist' && contract.artistId === ctx.user.id;
      const isVenue = ctx.user.role === 'venue' && contract.venueId === ctx.user.id;
      const isAdmin = ctx.user.role === 'admin';

      if (!isArtist && !isVenue && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized to audit this contract' });
      }

      // Create audit log entry
      const auditEntry = {
        id: Math.random().toString(36).substring(2, 9),
        contractId: input.contractId,
        userId: ctx.user.id,
        userName: ctx.user.name || 'Unknown',
        userRole: ctx.user.role,
        action: input.action,
        details: input.details,
        changedFields: input.changedFields,
        ipAddress: ctx.req.ip || 'unknown',
        userAgent: ctx.req.headers['user-agent'] || 'unknown',
        timestamp: new Date(),
      };

      // Store in database (would need to implement in actual db module)
      // For now, returning the audit entry
      return auditEntry;
    }),

  // Get contract audit trail
  getAuditTrail: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .query(async ({ ctx, input }) => {
      const contract = await db.getContractById(input.contractId);
      if (!contract) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
      }

      // Verify user has access
      const isArtist = ctx.user.role === 'artist' && contract.artistId === ctx.user.id;
      const isVenue = ctx.user.role === 'venue' && contract.venueId === ctx.user.id;
      const isAdmin = ctx.user.role === 'admin';

      if (!isArtist && !isVenue && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized to view audit trail' });
      }

      // Return mock audit trail for demonstration
      const mockAuditTrail = [
        {
          id: '1',
          contractId: input.contractId,
          userId: 1,
          userName: 'John Artist',
          userRole: 'artist',
          action: 'created',
          details: 'Contract created',
          changedFields: null,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date(Date.now() - 7 * 24 * 3600000),
        },
        {
          id: '2',
          contractId: input.contractId,
          userId: 2,
          userName: 'Jane Venue',
          userRole: 'venue',
          action: 'updated',
          details: 'Contract terms updated',
          changedFields: { rate: '500 -> 600', duration: '2 hours -> 3 hours' },
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date(Date.now() - 5 * 24 * 3600000),
        },
        {
          id: '3',
          contractId: input.contractId,
          userId: 1,
          userName: 'John Artist',
          userRole: 'artist',
          action: 'signed',
          details: 'Artist signed the contract',
          changedFields: { artistSignedAt: new Date(Date.now() - 3 * 24 * 3600000) },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date(Date.now() - 3 * 24 * 3600000),
        },
      ];

      return mockAuditTrail;
    }),

  // Get contract versions for comparison
  getContractVersions: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .query(async ({ ctx, input }) => {
      const contract = await db.getContractById(input.contractId);
      if (!contract) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
      }

      // Verify user has access
      const isArtist = ctx.user.role === 'artist' && contract.artistId === ctx.user.id;
      const isVenue = ctx.user.role === 'venue' && contract.venueId === ctx.user.id;
      const isAdmin = ctx.user.role === 'admin';

      if (!isArtist && !isVenue && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized to view contract versions' });
      }

      // Return mock contract versions for demonstration
      const mockVersions = [
        {
          id: 1,
          version: 1,
          contractId: input.contractId,
          title: 'Performance Contract - Original',
          content: 'This is the original contract for the artist performance at the venue. Please review all terms and conditions carefully before signing.',
          createdAt: new Date(Date.now() - 7 * 24 * 3600000),
          createdBy: 'John Artist',
        },
        {
          id: 2,
          version: 2,
          contractId: input.contractId,
          title: 'Performance Contract - Updated Terms',
          content: 'This is an updated contract with revised terms. The performance rate has been increased to $600 and duration extended to 3 hours. Please review all changes carefully before signing.',
          createdAt: new Date(Date.now() - 5 * 24 * 3600000),
          createdBy: 'Jane Venue',
        },
      ];

      return mockVersions;
    }),
});
