import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { storagePut } from "../storage";
import * as notif from "../services/notificationService";
import { sendEmail, sendContractForSignature, sendContractSigned } from "../email";

/**
 * Venue Contract Router
 * Handles venue-side contracts (venue agreements for artists to sign).
 * Complements the existing rider contract system (artist riders for venues to sign).
 */
export const venueContractRouter = router({
  /**
   * Create a new venue contract (draft)
   * Can be either an uploaded PDF or platform-generated from form data
   */
  create: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      title: z.string().min(1, "Contract title is required"),
      description: z.string().optional(),
      contractType: z.enum(["uploaded_pdf", "platform_generated"]).default("platform_generated"),
      contractData: z.record(z.string(), z.any()).optional(),
      /** Optional expiration date (ISO string) for artist to sign by */
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is a venue involved in this booking
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!venueProfile) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only venues can create venue contracts" });
      }

      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }
      if (booking.venueId !== venueProfile.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only create contracts for your own bookings" });
      }

      const contract = await db.createVenueContract({
        bookingId: input.bookingId,
        venueId: venueProfile.id,
        artistId: booking.artistId,
        title: input.title,
        description: input.description,
        contractType: input.contractType,
        contractData: input.contractData,
        status: "draft",
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      });

      return contract;
    }),

  /**
   * Upload a PDF contract file
   */
  uploadPdf: protectedProcedure
    .input(z.object({
      venueContractId: z.number(),
      fileData: z.string(), // base64
      fileName: z.string(),
      mimeType: z.string().default("application/pdf"),
    }))
    .mutation(async ({ ctx, input }) => {
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!venueProfile) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only venues can upload contracts" });
      }

      const contract = await db.getVenueContractById(input.venueContractId);
      if (!contract || contract.venueId !== venueProfile.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      }

      if (contract.status !== "draft") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only upload files to draft contracts" });
      }

      const buffer = Buffer.from(input.fileData, "base64");
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `venue-contracts/${venueProfile.id}/${input.fileName}-${randomSuffix}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      const updated = await db.updateVenueContract(contract.id, {
        fileUrl: url,
        contractType: "uploaded_pdf",
      });

      return updated;
    }),

  /**
   * Send a contract to the artist for review and signing
   */
  send: protectedProcedure
    .input(z.object({
      venueContractId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!venueProfile) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only venues can send contracts" });
      }

      const contract = await db.getVenueContractById(input.venueContractId);
      if (!contract || contract.venueId !== venueProfile.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      }

      if (contract.status !== "draft" && contract.status !== "signed_by_venue") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Contract has already been sent" });
      }

      // For uploaded PDFs, ensure file is uploaded
      if (contract.contractType === "uploaded_pdf" && !contract.fileUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Please upload the contract PDF first" });
      }

      // For platform-generated, ensure contract data exists
      if (contract.contractType === "platform_generated" && !contract.contractData) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Please fill in the contract details first" });
      }

      const updated = await db.updateVenueContract(contract.id, {
        status: "sent",
        sentAt: new Date(),
      });

      // Notify artist
      const artistProfile = await db.getArtistProfileById(contract.artistId);
      if (artistProfile) {
        // In-app notification
        notif.notifyContractReadyToSign({
          recipientUserId: artistProfile.userId,
          otherPartyName: venueProfile.organizationName,
          bookingId: contract.bookingId,
        }).catch(() => {});

        // Email notification
        try {
          const artistUser = await db.getUserById(artistProfile.userId);
          if (artistUser?.email) {
            const baseUrl = ctx.req?.headers?.origin || "https://www.ologywood.com";
            await sendContractForSignature({
              to: artistUser.email,
              recipientName: artistProfile.artistName,
              senderName: venueProfile.organizationName,
              contractTitle: contract.title,
              contractUrl: `${baseUrl}/bookings/${contract.bookingId}`,
            });
          }
        } catch (emailErr) {
          console.error("[VenueContract] Error sending contract email:", emailErr);
        }
      }

      return updated;
    }),

  /**
   * Sign a venue contract (artist or venue)
   */
  sign: protectedProcedure
    .input(z.object({
      venueContractId: z.number(),
      signatureData: z.string().min(1, "Signature is required"),
      signerName: z.string().min(1, "Name is required"),
      signatureType: z.enum(["drawn", "typed"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const contract = await db.getVenueContractById(input.venueContractId);
      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      }

      // Determine signer role
      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      const isArtist = artistProfile && contract.artistId === artistProfile.id;
      const isVenue = venueProfile && contract.venueId === venueProfile.id;

      if (!isArtist && !isVenue) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to sign this contract" });
      }

      // Determine signer role — check if user already signed as one role, allow signing as the other
      const existingSigs = await db.getVenueContractSignatures(contract.id);
      const alreadySignedAsVenue = existingSigs.find(s => s.userId === ctx.user.id && s.signerRole === "venue");
      const alreadySignedAsArtist = existingSigs.find(s => s.userId === ctx.user.id && s.signerRole === "artist");
      
      // TEMPORARY: For testing, if user has both roles and already signed as venue, let them sign as artist
      let signerRole: "venue" | "artist";
      if (isVenue && isArtist && alreadySignedAsVenue) {
        signerRole = "artist";
      } else if (isVenue && isArtist && alreadySignedAsArtist) {
        signerRole = "venue";
      } else {
        signerRole = isVenue ? "venue" : "artist";
      }

      // Check if contract has expired
      if (contract.expiresAt && new Date(contract.expiresAt) < new Date()) {
        await db.updateVenueContract(contract.id, { status: "declined" });
        throw new TRPCError({ code: "BAD_REQUEST", message: "This contract has expired and can no longer be signed" });
      }

      // Artists can only sign sent/signed_by_venue contracts
      if (isArtist && !["sent", "viewed", "signed_by_venue"].includes(contract.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This contract is not ready for signing" });
      }

      // Venues can sign draft or sent contracts
      if (isVenue && !["draft", "sent", "viewed", "signed_by_artist"].includes(contract.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This contract cannot be signed at this stage" });
      }

      // Check if already signed as this role
      const alreadySigned = existingSigs.find(s => s.userId === ctx.user.id && s.signerRole === signerRole);
      // TEMPORARY: Allow same user to sign as both roles for testing (remove before production launch)
      if (alreadySigned) {
        throw new TRPCError({ code: "CONFLICT", message: "You have already signed this contract as " + signerRole });
      }

      // Get IP
      const ipAddress =
        (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        ctx.req?.socket?.remoteAddress ||
        "unknown";

      // Create signature
      const signature = await db.createVenueContractSignature({
        venueContractId: contract.id,
        userId: ctx.user.id,
        signerRole,
        signerName: input.signerName,
        ipAddress,
        signatureData: input.signatureData,
      });

      // Update contract status
      const allSignatures = [...existingSigs, signature];
      const artistSigned = allSignatures.some(s => s.signerRole === "artist");
      const venueSigned = allSignatures.some(s => s.signerRole === "venue");

      let newStatus: "sent" | "signed_by_artist" | "signed_by_venue" | "fully_signed" = "sent";
      if (artistSigned && venueSigned) {
        newStatus = "fully_signed";
      } else if (artistSigned) {
        newStatus = "signed_by_artist";
      } else if (venueSigned) {
        newStatus = "signed_by_venue";
      }

      await db.updateVenueContract(contract.id, { status: newStatus });

      // Notifications
      const booking = await db.getBookingById(contract.bookingId);
      if (newStatus === "fully_signed") {
        // Notify both parties
        try {
          const ap = await db.getArtistProfileById(contract.artistId);
          const vp = await db.getVenueProfileById(contract.venueId);
          if (ap) notif.notifyContractFullySigned({ recipientUserId: ap.userId, bookingId: contract.bookingId }).catch(() => {});
          if (vp) notif.notifyContractFullySigned({ recipientUserId: vp.userId, bookingId: contract.bookingId }).catch(() => {});

          // Email both
          const artistUser = ap ? await db.getUserById(ap.userId) : null;
          const venueUser = vp ? await db.getUserById(vp.userId) : null;
          if (ap && vp) {
            if (artistUser?.email) {
              await sendContractSigned({
                to: artistUser.email,
                artistName: ap.artistName,
                venueName: vp.organizationName,
                contractTitle: contract.title,
              });
            }
            if (venueUser?.email) {
              await sendContractSigned({
                to: venueUser.email,
                artistName: ap.artistName,
                venueName: vp.organizationName,
                contractTitle: contract.title,
              });
            }
          }
        } catch (emailErr) {
          console.error("[VenueContract] Error sending fully-signed emails:", emailErr);
        }
      } else {
        // Notify the other party to countersign
        try {
          const ap = await db.getArtistProfileById(contract.artistId);
          const vp = await db.getVenueProfileById(contract.venueId);
          if (signerRole === "venue" && ap) {
            notif.notifyContractReadyToSign({
              recipientUserId: ap.userId,
              otherPartyName: vp?.organizationName || "Venue",
              bookingId: contract.bookingId,
            }).catch(() => {});
          } else if (signerRole === "artist" && vp) {
            notif.notifyContractReadyToSign({
              recipientUserId: vp.userId,
              otherPartyName: ap?.artistName || "Artist",
              bookingId: contract.bookingId,
            }).catch(() => {});
          }

          // Email the other party
          const baseUrl = ctx.req?.headers?.origin || "https://www.ologywood.com";
          if (signerRole === "venue" && ap) {
            const artistUser = await db.getUserById(ap.userId);
            if (artistUser?.email) {
              await sendContractForSignature({
                to: artistUser.email,
                recipientName: ap.artistName,
                senderName: vp?.organizationName || "Venue",
                contractTitle: contract.title,
                contractUrl: `${baseUrl}/bookings/${contract.bookingId}`,
              });
            }
          } else if (signerRole === "artist" && vp) {
            const venueUser = await db.getUserById(vp.userId);
            if (venueUser?.email) {
              await sendContractForSignature({
                to: venueUser.email,
                recipientName: vp.organizationName,
                senderName: ap?.artistName || "Artist",
                contractTitle: contract.title,
                contractUrl: `${baseUrl}/bookings/${contract.bookingId}`,
              });
            }
          }
        } catch (emailErr) {
          console.error("[VenueContract] Error sending countersign email:", emailErr);
        }
      }

      return {
        success: true,
        signatureId: signature.id,
        contractStatus: newStatus,
        signerRole,
      };
    }),

  /**
   * Mark a venue contract as viewed by the artist
   */
  markViewed: protectedProcedure
    .input(z.object({ venueContractId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const contract = await db.getVenueContractById(input.venueContractId);
      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      }

      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile || contract.artistId !== artistProfile.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      if (contract.status === "sent" && !contract.viewedAt) {
        await db.updateVenueContract(contract.id, {
          status: "viewed",
          viewedAt: new Date(),
        });
      }

      return { success: true };
    }),

  /**
   * Get venue contracts for a specific booking
   */
  getForBooking: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      // Verify user is involved
      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      const isArtist = artistProfile && booking.artistId === artistProfile.id;
      const isVenue = venueProfile && booking.venueId === venueProfile.id;
      const isAdmin = ctx.user.role === "admin";

      if (!isArtist && !isVenue && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view these contracts" });
      }

      const contracts = await db.getVenueContractsByBookingId(input.bookingId);

      // Enrich with signatures
      const enriched = await Promise.all(
        contracts.map(async (contract) => {
          const sigs = await db.getVenueContractSignatures(contract.id);
          const artistSig = sigs.find(s => s.signerRole === "artist");
          const venueSig = sigs.find(s => s.signerRole === "venue");

          let venueName = "Unknown Venue";
          let artistName = "Unknown Artist";
          const vp = await db.getVenueProfileById(contract.venueId);
          if (vp) venueName = vp.organizationName;
          const ap = await db.getArtistProfileById(contract.artistId);
          if (ap) artistName = ap.artistName;

          return {
            ...contract,
            venueName,
            artistName,
            artistSigned: !!artistSig,
            artistSignedAt: artistSig?.signedAt || null,
            artistSignerName: artistSig?.signerName || null,
            venueSigned: !!venueSig,
            venueSignedAt: venueSig?.signedAt || null,
            venueSignerName: venueSig?.signerName || null,
          };
        })
      );

      return enriched;
    }),

  /**
   * Get all venue contracts for the current user (venue or artist)
   */
  getMyContracts: protectedProcedure.query(async ({ ctx }) => {
    let contractsList: any[] = [];

    if (ctx.user.role === "venue" || ctx.user.role === "admin") {
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      if (venueProfile) {
        contractsList = await db.getVenueContractsByVenueId(venueProfile.id);
      }
    }

    if (ctx.user.role === "artist" || ctx.user.role === "admin") {
      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      if (artistProfile) {
        const artistContracts = await db.getVenueContractsByArtistId(artistProfile.id);
        const existingIds = new Set(contractsList.map(c => c.id));
        for (const ac of artistContracts) {
          if (!existingIds.has(ac.id)) contractsList.push(ac);
        }
      }
    }

    // Enrich
    const enriched = await Promise.all(
      contractsList.map(async (contract) => {
        const booking = await db.getBookingById(contract.bookingId);
        const sigs = await db.getVenueContractSignatures(contract.id);
        const artistSig = sigs.find(s => s.signerRole === "artist");
        const venueSig = sigs.find(s => s.signerRole === "venue");

        let artistName = "Unknown Artist";
        let venueName = "Unknown Venue";
        const ap = await db.getArtistProfileById(contract.artistId);
        if (ap) artistName = ap.artistName;
        const vp = await db.getVenueProfileById(contract.venueId);
        if (vp) venueName = vp.organizationName;

        return {
          id: contract.id,
          bookingId: contract.bookingId,
          title: contract.title,
          description: contract.description,
          contractType: contract.contractType,
          fileUrl: contract.fileUrl,
          status: contract.status,
          sentAt: contract.sentAt,
          viewedAt: contract.viewedAt,
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt,
          artistName,
          venueName,
          eventDate: booking?.eventDate || null,
          eventDetails: booking?.eventDetails || null,
          totalFee: booking?.totalFee || null,
          bookingStatus: booking?.status || null,
          artistSigned: !!artistSig,
          artistSignedAt: artistSig?.signedAt || null,
          artistSignerName: artistSig?.signerName || null,
          venueSigned: !!venueSig,
          venueSignedAt: venueSig?.signedAt || null,
          venueSignerName: venueSig?.signerName || null,
        };
      })
    );

    enriched.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });

    return enriched;
  }),

  /**
   * Update a draft venue contract
   */
  update: protectedProcedure
    .input(z.object({
      venueContractId: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      contractData: z.record(z.string(), z.any()).optional(),
      expiresAt: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!venueProfile) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only venues can update contracts" });
      }

      const contract = await db.getVenueContractById(input.venueContractId);
      if (!contract || contract.venueId !== venueProfile.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      }

      if (contract.status !== "draft") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only draft contracts can be edited" });
      }

      const updateData: any = {};
      if (input.title) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.contractData) updateData.contractData = input.contractData;
      if (input.expiresAt !== undefined) {
        updateData.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
      }

      return await db.updateVenueContract(contract.id, updateData);
    }),

  /**
   * Delete a draft venue contract
   */
  delete: protectedProcedure
    .input(z.object({ venueContractId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!venueProfile) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only venues can delete contracts" });
      }

      const contract = await db.getVenueContractById(input.venueContractId);
      if (!contract || contract.venueId !== venueProfile.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      }

      if (contract.status !== "draft") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only draft contracts can be deleted" });
      }

      await db.deleteVenueContract(contract.id);
      return { success: true };
    }),

  /**
   * Decline a venue contract (artist only)
   */
  decline: protectedProcedure
    .input(z.object({ venueContractId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only artists can decline venue contracts" });
      }

      const contract = await db.getVenueContractById(input.venueContractId);
      if (!contract || contract.artistId !== artistProfile.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      }

      if (!["sent", "viewed"].includes(contract.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot decline this contract" });
      }

      await db.updateVenueContract(contract.id, { status: "declined" });

      // Notify venue (in-app + email)
      const venueProfile = await db.getVenueProfileById(contract.venueId);
      if (venueProfile) {
        notif.notifyVenueContractDeclined({
          venueUserId: venueProfile.userId,
          artistName: artistProfile.artistName,
          contractTitle: contract.title,
          bookingId: contract.bookingId,
        }).catch(() => {});

        // Email venue about decline
        try {
          const venueUser = await db.getUserById(venueProfile.userId);
          if (venueUser?.email) {
            await sendEmail({
              to: venueUser.email,
              subject: `Contract Declined: ${contract.title}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">Contract Declined</h1>
                  </div>
                  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                    <p>Hi ${venueProfile.organizationName},</p>
                    <p><strong>${artistProfile.artistName}</strong> has declined your venue agreement: <strong>"${contract.title}"</strong>.</p>
                    <p>You may want to reach out to discuss terms or send a revised contract.</p>
                    <div style="text-align: center; margin: 25px 0;">
                      <a href="https://www.ologywood.com/booking/${contract.bookingId}" style="background: #7c3aed; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Booking</a>
                    </div>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">— The Ologywood Team</p>
                  </div>
                </div>
              `,
            });
          }
        } catch (emailErr) {
          console.error("[VenueContract] Error sending decline email:", emailErr);
        }
      }

      return { success: true };
    }),
});
