import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import * as db from '../db';
import { TRPCError } from '@trpc/server';
import { ContractHistoryService, type ContractVersion } from '../services/contractHistoryService';

export const contractHistoryRouter = router({
  /**
   * Create a new contract version
   */
  createVersion: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      status: z.enum(['draft', 'sent', 'signed', 'executed', 'archived', 'cancelled']),
      changes: z.string(),
      contractData: z.record(z.string(), z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const contract = await db.getContractById(input.contractId);
        if (!contract) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contract not found',
          });
        }

        // Verify user has access
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);

        if (
          (!artistProfile || artistProfile.id !== contract.artistId) &&
          (!venueProfile || venueProfile.id !== contract.venueId)
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to create versions for this contract',
          });
        }

        // Create version (in real implementation, would save to DB)
        const version = ContractHistoryService.createVersion(
          input.contractId,
          1, // Would increment based on existing versions
          input.status as any,
          ctx.user.email || 'unknown',
          input.changes,
          input.contractData
        );

        return {
          success: true,
          version: {
            id: version.id,
            contractId: version.contractId,
            versionNumber: version.versionNumber,
            status: version.status,
            createdAt: version.createdAt,
            changes: version.changes,
          },
        };
      } catch (error) {
        console.error('Error creating contract version:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create contract version',
        });
      }
    }),

  /**
   * Get contract version history
   */
  getVersionHistory: protectedProcedure
    .input(z.object({
      contractId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const contract = await db.getContractById(input.contractId);
        if (!contract) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contract not found',
          });
        }

        // Verify access
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);

        if (
          (!artistProfile || artistProfile.id !== contract.artistId) &&
          (!venueProfile || venueProfile.id !== contract.venueId)
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to view version history for this contract',
          });
        }

        // In real implementation, would fetch from DB
        const mockVersions: ContractVersion[] = [
          ContractHistoryService.createVersion(
            input.contractId,
            1,
            'draft' as any,
            'system',
            'Initial version created',
            contract.contractData || {}
          ),
        ];

        const summary = ContractHistoryService.generateHistorySummary(mockVersions);

        return {
          success: true,
          contractId: input.contractId,
          versions: mockVersions.map((v) => ({
            id: v.id,
            versionNumber: v.versionNumber,
            status: v.status,
            createdAt: v.createdAt,
            createdBy: v.createdBy,
            changes: v.changes,
          })),
          summary,
        };
      } catch (error) {
        console.error('Error fetching version history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch version history',
        });
      }
    }),

  /**
   * Compare two contract versions
   */
  compareVersions: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      versionA: z.number(),
      versionB: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const contract = await db.getContractById(input.contractId);
        if (!contract) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contract not found',
          });
        }

        // In real implementation, would fetch versions from DB and compare
        const mockVersionA = ContractHistoryService.createVersion(
          input.contractId,
          input.versionA,
          'draft',
          'system',
          'Version A',
          { fee: 5000 }
        );

        const mockVersionB = ContractHistoryService.createVersion(
          input.contractId,
          input.versionB,
          'sent',
          'system',
          'Version B',
          { fee: 5500 }
        );

        const comparison = ContractHistoryService.compareVersions(mockVersionA, mockVersionB);

        return {
          success: true,
          comparison: {
            versionA: {
              number: comparison.versionA.versionNumber,
              status: comparison.versionA.status,
            },
            versionB: {
              number: comparison.versionB.versionNumber,
              status: comparison.versionB.status,
            },
            differences: comparison.differences,
          },
        };
      } catch (error) {
        console.error('Error comparing versions:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to compare versions',
        });
      }
    }),

  /**
   * Archive a contract
   */
  archiveContract: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      reason: z.string(),
      retentionDays: z.number().optional().default(2555),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const contract = await db.getContractById(input.contractId);
        if (!contract) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contract not found',
          });
        }

        // Verify user has access
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);

        if (
          (!artistProfile || artistProfile.id !== contract.artistId) &&
          (!venueProfile || venueProfile.id !== contract.venueId)
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to archive this contract',
          });
        }

        // Create archive
        const archive = ContractHistoryService.createArchive(
          input.contractId,
          ctx.user.email || 'unknown',
          input.reason,
          input.retentionDays
        );

        // Update contract status (archived is a valid status in the service)
        // In real implementation, would update DB with archived status

        return {
          success: true,
          archive: {
            id: archive.id,
            contractId: archive.contractId,
            archivedAt: archive.archivedAt,
            reason: archive.reason,
            expiresAt: archive.expiresAt,
          },
        };
      } catch (error) {
        console.error('Error archiving contract:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to archive contract',
        });
      }
    }),

  /**
   * Get contract audit trail
   */
  getAuditTrail: protectedProcedure
    .input(z.object({
      contractId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const contract = await db.getContractById(input.contractId);
        if (!contract) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contract not found',
          });
        }

        // Verify access
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);

        if (
          (!artistProfile || artistProfile.id !== contract.artistId) &&
          (!venueProfile || venueProfile.id !== contract.venueId)
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to view audit trail for this contract',
          });
        }

        // In real implementation, would fetch versions from DB
        const mockVersions: ContractVersion[] = [
          ContractHistoryService.createVersion(
            input.contractId,
            1,
            'draft' as any,
            'system',
            'Initial version created',
            contract.contractData || {}
          ),
        ];

        const auditTrail = ContractHistoryService.generateAuditTrail(mockVersions);

        return {
          success: true,
          contractId: input.contractId,
          auditTrail,
        };
      } catch (error) {
        console.error('Error fetching audit trail:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch audit trail',
        });
      }
    }),

  /**
   * Get contract lifecycle report
   */
  getLifecycleReport: protectedProcedure
    .input(z.object({
      contractId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const contract = await db.getContractById(input.contractId);
        if (!contract) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contract not found',
          });
        }

        // In real implementation, would fetch versions and archive from DB
        const mockVersions: ContractVersion[] = [
          ContractHistoryService.createVersion(
            input.contractId,
            1,
            'draft' as any,
            'system',
            'Initial version created',
            contract.contractData || {}
          ),
        ];

        const report = ContractHistoryService.generateLifecycleReport(mockVersions);

        return {
          success: true,
          contractId: input.contractId,
          report,
        };
      } catch (error) {
        console.error('Error generating lifecycle report:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate lifecycle report',
        });
      }
    }),

  /**
   * Get version statistics
   */
  getVersionStatistics: protectedProcedure
    .input(z.object({
      contractId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const contract = await db.getContractById(input.contractId);
        if (!contract) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contract not found',
          });
        }

        // In real implementation, would fetch versions from DB
        const mockVersions: ContractVersion[] = [
          ContractHistoryService.createVersion(
            input.contractId,
            1,
            'draft' as any,
            'system',
            'Initial version created',
            contract.contractData || {}
          ),
        ];

        const statistics = ContractHistoryService.getVersionStatistics(mockVersions);

        return {
          success: true,
          contractId: input.contractId,
          statistics,
        };
      } catch (error) {
        console.error('Error fetching version statistics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch version statistics',
        });
      }
    }),
});
