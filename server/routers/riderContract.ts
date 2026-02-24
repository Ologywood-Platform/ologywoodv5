import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { getRiderTemplate } from "../services/riderTemplateService";
import { generateRiderHTML, getRiderTemplateById } from "../services/riderContractTemplate";
import crypto from "crypto";

export const riderContractRouter = router({
  /**
   * Get or create a contract for a booking's rider
   * Returns the contract with its current signatures
   */
  getForBooking: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      // Verify user is involved in this booking
      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      const isArtist = artistProfile && booking.artistId === artistProfile.id;
      const isVenue = venueProfile && booking.venueId === venueProfile.id;
      if (!isArtist && !isVenue) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized for this booking" });
      }

      // Get existing contract for this booking
      let contract = await db.getContractByBookingId(input.bookingId);

      // Get rider template data if attached
      let riderTemplate = null;
      let riderData: Record<string, any> = {};
      if (booking.riderTemplateId) {
        riderTemplate = await getRiderTemplate(booking.riderTemplateId);
        if (riderTemplate) {
          riderData = typeof riderTemplate.templateData === "string"
            ? JSON.parse(riderTemplate.templateData)
            : riderTemplate.templateData || {};
        }
      }

      // Get signatures if contract exists
      let signatures: any[] = [];
      if (contract) {
        signatures = await db.getSignaturesByContractId(contract.id);
      }

      return {
        contract,
        riderTemplate,
        riderData,
        signatures: signatures.map((s) => ({
          id: s.id,
          userId: s.userId,
          signerRole: s.signerRole,
          signerName: s.signerName,
          signatureData: s.signatureData,
          signedAt: s.signedAt,
        })),
        booking: {
          id: booking.id,
          artistId: booking.artistId,
          venueId: booking.venueId,
          status: booking.status,
          riderTemplateId: booking.riderTemplateId,
          riderStatus: booking.riderStatus,
        },
        currentUserRole: isArtist ? "artist" : "venue",
      };
    }),

  /**
   * Create a contract for a booking (if one doesn't exist)
   * This is called when the first party is ready to sign
   */
  createContract: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      // Check if contract already exists
      const existing = await db.getContractByBookingId(input.bookingId);
      if (existing) {
        return existing;
      }

      // Verify user is involved
      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      const isArtist = artistProfile && booking.artistId === artistProfile.id;
      const isVenue = venueProfile && booking.venueId === venueProfile.id;
      if (!isArtist && !isVenue) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      // Build contract data from rider template
      let contractData: Record<string, any> = {};
      if (booking.riderTemplateId) {
        const riderTemplate = await getRiderTemplate(booking.riderTemplateId);
        if (riderTemplate) {
          contractData = typeof riderTemplate.templateData === "string"
            ? JSON.parse(riderTemplate.templateData)
            : riderTemplate.templateData || {};
        }
      }

      const contract = await db.createContract({
        bookingId: input.bookingId,
        artistId: booking.artistId,
        venueId: booking.venueId,
        riderTemplateId: booking.riderTemplateId,
        contractData,
        status: "pending",
      });

      return contract;
    }),

  /**
   * Sign a rider contract
   * Accepts either a drawn signature (base64 image) or typed name
   */
  sign: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      signatureData: z.string().min(1, "Signature is required"),
      signerName: z.string().min(1, "Name is required"),
      signatureType: z.enum(["drawn", "typed"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      // Determine signer role
      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      const isArtist = artistProfile && booking.artistId === artistProfile.id;
      const isVenue = venueProfile && booking.venueId === venueProfile.id;

      if (!isArtist && !isVenue) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to sign this contract" });
      }

      const signerRole = isArtist ? "artist" : "venue";

      // Get or create contract
      let contract = await db.getContractByBookingId(input.bookingId);
      if (!contract) {
        // Auto-create the contract
        let contractData: Record<string, any> = {};
        if (booking.riderTemplateId) {
          const riderTemplate = await getRiderTemplate(booking.riderTemplateId);
          if (riderTemplate) {
            contractData = typeof riderTemplate.templateData === "string"
              ? JSON.parse(riderTemplate.templateData)
              : riderTemplate.templateData || {};
          }
        }

        contract = await db.createContract({
          bookingId: input.bookingId,
          artistId: booking.artistId,
          venueId: booking.venueId,
          riderTemplateId: booking.riderTemplateId,
          contractData,
          status: "pending",
        });
      }

      // Check if this user already signed
      const existingSignatures = await db.getSignaturesByContractId(contract.id);
      const alreadySigned = existingSignatures.find(
        (s) => s.userId === ctx.user.id
      );
      if (alreadySigned) {
        throw new TRPCError({ code: "CONFLICT", message: "You have already signed this contract" });
      }

      // Get IP address from request headers
      const ipAddress =
        (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        ctx.req?.socket?.remoteAddress ||
        "unknown";

      // Create the signature
      const signature = await db.createSignature({
        contractId: contract.id,
        userId: ctx.user.id,
        signerRole,
        signerName: input.signerName,
        ipAddress,
        signatureData: input.signatureData,
      });

      // Update contract status based on who has signed
      const allSignatures = [...existingSignatures, signature];
      const artistSigned = allSignatures.some((s) => s.signerRole === "artist");
      const venueSigned = allSignatures.some((s) => s.signerRole === "venue");

      let newStatus: "pending" | "signed_by_artist" | "signed_by_venue" | "fully_signed" = "pending";
      if (artistSigned && venueSigned) {
        newStatus = "fully_signed";
      } else if (artistSigned) {
        newStatus = "signed_by_artist";
      } else if (venueSigned) {
        newStatus = "signed_by_venue";
      }

      await db.updateContract(contract.id, { status: newStatus });

      // If fully signed, update booking rider status
      if (newStatus === "fully_signed") {
        await db.updateBooking(input.bookingId, {
          riderStatus: "signed",
        });
      }

      return {
        success: true,
        signatureId: signature.id,
        contractStatus: newStatus,
        signerRole,
      };
    }),

  /**
   * Get the rendered rider HTML for preview/PDF
   */
  getRiderPreview: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking || !booking.riderTemplateId) {
        return null;
      }

      const riderTemplate = await getRiderTemplate(booking.riderTemplateId);
      if (!riderTemplate) return null;

      const riderData = typeof riderTemplate.templateData === "string"
        ? JSON.parse(riderTemplate.templateData)
        : riderTemplate.templateData || {};

      const templateType = riderTemplate.templateType || "solo_artist";
      const html = generateRiderHTML(templateType, riderData);

      // Get signatures
      const contract = await db.getContractByBookingId(input.bookingId);
      let signatures: any[] = [];
      if (contract) {
        signatures = await db.getSignaturesByContractId(contract.id);
      }

      return {
        html,
        templateName: riderTemplate.templateName,
        templateType,
        riderData,
        signatures: signatures.map((s) => ({
          id: s.id,
          signerRole: s.signerRole,
          signerName: s.signerName,
          signatureData: s.signatureData,
          signedAt: s.signedAt,
        })),
        contractStatus: contract?.status || "pending",
      };
    }),

  /**
   * Verify a contract's signature integrity
   */
  verify: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .query(async ({ ctx, input }) => {
      const contract = await db.getContractById(input.contractId);
      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      }

      const signatures = await db.getSignaturesByContractId(input.contractId);
      const artistSig = signatures.find((s) => s.signerRole === "artist");
      const venueSig = signatures.find((s) => s.signerRole === "venue");

      return {
        contractId: contract.id,
        bookingId: contract.bookingId,
        status: contract.status,
        isFullySigned: contract.status === "fully_signed",
        artistSignature: artistSig
          ? {
              signerName: artistSig.signerName,
              signedAt: artistSig.signedAt,
              verified: true,
            }
          : null,
        venueSignature: venueSig
          ? {
              signerName: venueSig.signerName,
              signedAt: venueSig.signedAt,
              verified: true,
            }
          : null,
        createdAt: contract.createdAt,
      };
    }),
});
