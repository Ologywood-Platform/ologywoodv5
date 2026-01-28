import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import * as db from '../db';
import { TRPCError } from '@trpc/server';
import { SignatureService, SignatureRequestBuilder, type SignatureData } from '../services/signatureService';
import * as email from '../email';

const signatureDataSchema = z.object({
  type: z.enum(['image', 'text', 'initials']),
  data: z.string().min(1, 'Signature data is required'),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export const signatureRouter = router({
  /**
   * Create signature requests for a contract (both artist and venue)
   */
  createSignatureRequests: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      artistEmail: z.string().email(),
      artistName: z.string(),
      venueEmail: z.string().email(),
      venueName: z.string(),
      expirationDays: z.number().optional().default(30),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify contract exists and user has access
        const contract = await db.getContractById(input.contractId);
        if (!contract) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contract not found',
          });
        }

        // Verify user is artist or venue on this contract
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);

        if (
          (!artistProfile || artistProfile.id !== contract.artistId) &&
          (!venueProfile || venueProfile.id !== contract.venueId)
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to create signature requests for this contract',
          });
        }

        // Create signature requests
        const builder = new SignatureRequestBuilder();
        builder
          .addArtistSignature(input.contractId, input.artistEmail, input.artistName, input.expirationDays)
          .addVenueSignature(input.contractId, input.venueEmail, input.venueName, input.expirationDays);

        const requests = builder.build();

        // Store signature requests (in real implementation, would save to DB)
        // For now, returning the requests for client-side handling
        const signatureRequests = requests.map((req) => ({
          id: req.id,
          contractId: req.contractId,
          signerEmail: req.signerEmail,
          signerName: req.signerName,
          signerRole: req.signerRole,
          status: req.status,
          expiresAt: req.expiresAt,
        }));

        // Create audit trail
        const auditEntry = SignatureService.createAuditEntry(
          input.contractId,
          'sent',
          ctx.user.email || 'unknown',
          {
            artistEmail: input.artistEmail,
            venueEmail: input.venueEmail,
          }
        );

        // Send signature request emails
        try {
          const artistEmail = SignatureService.formatSignatureRequestEmail(
            requests[0],
            `${process.env.VITE_APP_URL || 'https://ologywood.com'}/sign/${requests[0].id}`
          );

          const venueEmail = SignatureService.formatSignatureRequestEmail(
            requests[1],
            `${process.env.VITE_APP_URL || 'https://ologywood.com'}/sign/${requests[1].id}`
          );

          // Send emails (would use email service in production)
          console.log('Signature request emails would be sent to:', input.artistEmail, input.venueEmail);
        } catch (emailError) {
          console.error('Error sending signature request emails:', emailError);
          // Don't fail the request if emails fail
        }

        return {
          success: true,
          requests: signatureRequests,
          auditEntry,
        };
      } catch (error) {
        console.error('Error creating signature requests:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create signature requests',
        });
      }
    }),

  /**
   * Submit a signature for a contract
   */
  submitSignature: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      signatureRequestId: z.string(),
      signature: signatureDataSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify contract exists
        const contract = await db.getContractById(input.contractId);
        if (!contract) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contract not found',
          });
        }

        // Validate signature data
        if (!SignatureService.validateSignatureData(input.signature as any)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid signature data',
          });
        }

        // Create signature record
        const signature = await db.createSignature({
          contractId: input.contractId,
          signerId: ctx.user.id,
          signatureData: JSON.stringify(input.signature),
          signedAt: new Date(),
        });

        // Create audit trail
        const auditEntry = SignatureService.createAuditEntry(
          input.contractId,
          'signed',
          ctx.user.email || 'unknown',
          {
            signatureRequestId: input.signatureRequestId,
            signatureType: input.signature.type,
          }
        );

        // Update contract status if both parties have signed
        const allSignatures = await db.getSignaturesByContractId(input.contractId);
        if (allSignatures.length >= 2) {
          await db.updateContract(input.contractId, {
            status: 'signed',
          });
        }

        return {
          success: true,
          signature: {
            id: signature.id,
            contractId: signature.contractId,
            signerId: signature.signerId,
            signedAt: signature.signedAt,
          },
          auditEntry,
        };
      } catch (error) {
        console.error('Error submitting signature:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit signature',
        });
      }
    }),

  /**
   * Get signature requests for a contract
   */
  getSignatureRequests: protectedProcedure
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
            message: 'You do not have permission to view signature requests for this contract',
          });
        }

        // Get signatures
        const signatures = await db.getSignaturesByContractId(input.contractId);

        return {
          contractId: input.contractId,
          signatures: signatures.map((sig) => ({
            id: sig.id,
            contractId: sig.contractId,
            signerId: sig.signerId,
            signedAt: sig.signedAt,
          })),
          summary: {
            total: 2, // Artist + Venue
            signed: signatures.length,
            pending: 2 - signatures.length,
          },
        };
      } catch (error) {
        console.error('Error fetching signature requests:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch signature requests',
        });
      }
    }),

  /**
   * Get signature status report
   */
  getSignatureReport: protectedProcedure
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

        const signatures = await db.getSignaturesByContractId(input.contractId);
        const isFullySigned = signatures.length >= 2;

        return {
          contractId: input.contractId,
          status: contract.status,
          isFullySigned,
          signatureCount: signatures.length,
          signatures: signatures.map((sig) => ({
            id: sig.id,
            signerId: sig.signerId,
            signedAt: sig.signedAt,
          })),
          report: SignatureService.generateStatusReport([]),
        };
      } catch (error) {
        console.error('Error generating signature report:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate signature report',
        });
      }
    }),

  /**
   * Decline to sign a contract
   */
  declineSignature: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      reason: z.string().optional(),
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

        // Create audit trail
        const auditEntry = SignatureService.createAuditEntry(
          input.contractId,
          'declined',
          ctx.user.email || 'unknown',
          {
            reason: input.reason,
          }
        );

        return {
          success: true,
          auditEntry,
        };
      } catch (error) {
        console.error('Error declining signature:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to decline signature',
        });
      }
    }),

  /**
   * Generate signature certificate
   */
  generateCertificate: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      signerName: z.string(),
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

        const signatures = await db.getSignaturesByContractId(input.contractId);
        if (signatures.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No signatures found for this contract',
          });
        }

        const certificate = SignatureService.generateSignatureCertificate(
          input.contractId,
          input.signerName,
          signatures[0].signedAt || new Date(),
          'digital'
        );

        return {
          success: true,
          certificate,
        };
      } catch (error) {
        console.error('Error generating certificate:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate certificate',
        });
      }
    }),
});
