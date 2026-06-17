import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { getRiderTemplate } from "../services/riderTemplateService";
import { generateRiderHTML, getRiderTemplateById } from "../services/riderContractTemplate";
import { sendContractSigned, sendContractForSignature, sendRiderRevisionProposedEmail, sendRiderRevisionDecisionEmail } from "../email";
import * as notif from "../services/notificationService";
import crypto from "crypto";
import { generateRiderPdf } from "../services/riderPdfService";

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

      // Validate performance fee is set before allowing signing
      if (booking.riderTemplateId) {
        const riderTemplateCheck = await getRiderTemplate(booking.riderTemplateId);
        if (riderTemplateCheck) {
          const riderDataCheck = typeof riderTemplateCheck.templateData === 'string'
            ? JSON.parse(riderTemplateCheck.templateData)
            : riderTemplateCheck.templateData || {};
          const fee = parseFloat(riderDataCheck.performance_fee || '0');
          if (fee <= 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Cannot sign contract: Performance Fee must be set before signing. Please edit the rider and add a fee amount.',
            });
          }
        }
      }

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

        // In-app notifications for fully signed
        try {
          const artistProf2 = await db.getArtistProfileById(booking.artistId);
          const venueProf2 = await db.getVenueProfileById(booking.venueId);
          if (artistProf2) notif.notifyContractFullySigned({ recipientUserId: artistProf2.userId, bookingId: input.bookingId }).catch(() => {});
          if (venueProf2) notif.notifyContractFullySigned({ recipientUserId: venueProf2.userId, bookingId: input.bookingId }).catch(() => {});
        } catch (_) {}

        // === DEPOSIT PAYMENT TRIGGER ===
        // When both parties sign, auto-create a Stripe checkout for the deposit
        try {
          const riderTemplate = booking.riderTemplateId ? await getRiderTemplate(booking.riderTemplateId) : null;
          const riderData = riderTemplate?.templateData
            ? (typeof riderTemplate.templateData === 'string' ? JSON.parse(riderTemplate.templateData) : riderTemplate.templateData)
            : {};

          const performanceFee = parseFloat(riderData.performance_fee || '0');
          const depositOption = riderData.deposit_required || 'No deposit';
          const paymentMethod = riderData.payment_method || '';

          if (performanceFee > 0 && depositOption !== 'No deposit' && paymentMethod.includes('Stripe')) {
            let depositPercent = 0;
            if (depositOption.includes('25%')) depositPercent = 0.25;
            else if (depositOption.includes('50%')) depositPercent = 0.50;
            else if (depositOption.includes('100%')) depositPercent = 1.0;

            const depositAmountCents = Math.round(performanceFee * depositPercent * 100);

            if (depositAmountCents >= 50) { // Stripe minimum $0.50
              const { stripe } = await import('../stripe');
              const { getOrCreateStripeCustomer } = await import('../stripe');

              if (stripe) {
                // Get venue user (they pay the deposit)
                const venueProfileForPay = await db.getVenueProfileById(booking.venueId);
                const venueUserForPay = venueProfileForPay ? await db.getUserById(venueProfileForPay.userId) : null;
                const artistProfileForPay = await db.getArtistProfileById(booking.artistId);

                if (venueUserForPay?.email) {
                  const customerId = await getOrCreateStripeCustomer({
                    email: venueUserForPay.email,
                    name: venueUserForPay.name || venueProfileForPay?.organizationName || 'Venue',
                    userId: venueUserForPay.id.toString(),
                  });

                  const baseUrl = ctx.req?.headers?.origin || process.env.BASE_URL || 'https://www.ologywood.com';
                  const session = await stripe.checkout.sessions.create({
                    mode: 'payment',
                    customer: customerId,
                    line_items: [{
                      price_data: {
                        currency: 'usd',
                        product_data: {
                          name: `Booking Deposit - ${artistProfileForPay?.artistName || 'Artist'}`,
                          description: `${depositOption} for ${riderData.event_name || 'Performance'} on ${riderData.event_date || 'TBD'}`,
                        },
                        unit_amount: depositAmountCents,
                      },
                      quantity: 1,
                    }],
                    metadata: {
                      bookingId: booking.id.toString(),
                      userId: venueUserForPay.id.toString(),
                      paymentType: 'deposit',
                      depositPercent: (depositPercent * 100).toString(),
                      platformFeeAmount: Math.round(depositAmountCents * 0.05).toString(), // 5% platform fee
                    },
                    success_url: `${baseUrl}/bookings/${booking.id}?payment=success`,
                    cancel_url: `${baseUrl}/bookings/${booking.id}?payment=cancelled`,
                    allow_promotion_codes: true,
                  });

                  // Update booking with deposit amount
                  await db.updateBooking(booking.id, {
                    depositAmount: (depositAmountCents / 100).toFixed(2),
                    totalFee: performanceFee.toFixed(2),
                  });

                  // Send deposit payment link to venue via in-app notification
                  if (venueProfileForPay) {
                    notif.notifyDepositPaymentReady({
                      recipientUserId: venueProfileForPay.userId,
                      bookingId: booking.id,
                      amount: `$${(depositAmountCents / 100).toFixed(2)}`,
                      checkoutUrl: session.url || '',
                    }).catch(() => {});
                  }

                  console.log(`[RiderContract] Deposit checkout created: $${(depositAmountCents / 100).toFixed(2)} for booking #${booking.id}`);
                }
              }
            }
          }
        } catch (depositErr) {
          console.error('[RiderContract] Error creating deposit checkout:', depositErr);
        }

        // Send "fully signed" email notification to both parties
        try {
          const artistProf = await db.getArtistProfileById(booking.artistId);
          const venueProf = await db.getVenueProfileById(booking.venueId);
          if (artistProf && venueProf) {
            const artistUser = await db.getUserById(artistProf.userId);
            const venueUser = await db.getUserById(venueProf.userId);
            const contractTitle = `Rider Contract - Booking #${booking.id}`;
            if (artistUser?.email) {
              await sendContractSigned({
                to: artistUser.email,
                artistName: artistProf.artistName,
                venueName: venueProf.organizationName,
                contractTitle,
              });
            }
            if (venueUser?.email) {
              await sendContractSigned({
                to: venueUser.email,
                artistName: artistProf.artistName,
                venueName: venueProf.organizationName,
                contractTitle,
              });
            }
          }
        } catch (emailErr) {
          console.error('[RiderContract] Error sending fully-signed emails:', emailErr);
        }
      } else {
        // In-app notification: one party signed, notify other to countersign
        try {
          const ap = await db.getArtistProfileById(booking.artistId);
          const vp = await db.getVenueProfileById(booking.venueId);
          if (signerRole === 'artist' && vp) {
            notif.notifyContractReadyToSign({ recipientUserId: vp.userId, otherPartyName: ap?.artistName || 'Artist', bookingId: input.bookingId }).catch(() => {});
          } else if (signerRole === 'venue' && ap) {
            notif.notifyContractReadyToSign({ recipientUserId: ap.userId, otherPartyName: vp?.organizationName || 'Venue', bookingId: input.bookingId }).catch(() => {});
          }
        } catch (_) {}

        // Email: one party signed — notify the other party to countersign
        try {
          const artistProf = await db.getArtistProfileById(booking.artistId);
          const venueProf = await db.getVenueProfileById(booking.venueId);
          if (artistProf && venueProf) {
            const artistUser = await db.getUserById(artistProf.userId);
            const venueUser = await db.getUserById(venueProf.userId);
            const contractTitle = `Rider Contract - Booking #${booking.id}`;
            const baseUrl = ctx.req?.headers?.origin || 'https://ologywood.com';
            const contractUrl = `${baseUrl}/bookings/${booking.id}`;

            if (signerRole === 'artist' && venueUser?.email) {
              await sendContractForSignature({
                to: venueUser.email,
                recipientName: venueProf.organizationName,
                senderName: artistProf.artistName,
                contractTitle,
                contractUrl,
              });
            } else if (signerRole === 'venue' && artistUser?.email) {
              await sendContractForSignature({
                to: artistUser.email,
                recipientName: artistProf.artistName,
                senderName: venueProf.organizationName,
                contractTitle,
                contractUrl,
              });
            }
          }
        } catch (emailErr) {
          console.error('[RiderContract] Error sending countersign email:', emailErr);
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

  // ============= RIDER REVISION FLOW =============

  /**
   * Propose changes to rider fields (venue proposes, artist reviews)
   * Can also be used by artist to propose changes to venue
   */
  proposeRevision: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      changes: z.record(z.string(), z.object({
        oldValue: z.any(),
        newValue: z.any(),
        label: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      const isArtist = artistProfile && booking.artistId === artistProfile.id;
      const isVenue = venueProfile && booking.venueId === venueProfile.id;

      if (!isArtist && !isVenue) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      const proposerRole = isArtist ? "artist" : "venue";

      // Get or create contract
      let contract = await db.getContractByBookingId(input.bookingId);
      if (!contract) {
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

      // Cannot propose revisions on a fully signed contract
      if (contract.status === "fully_signed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot propose changes to a fully signed contract" });
      }

      const revision = await db.createRiderRevision({
        bookingId: input.bookingId,
        contractId: contract.id,
        proposedByUserId: ctx.user.id,
        proposedByRole: proposerRole,
        changes: input.changes,
        status: "pending",
      });

      // Notify the other party (in-app + email)
      try {
        const proposerName = isArtist ? (artistProfile?.artistName || 'Artist') : (venueProfile?.organizationName || 'Venue');
        const fieldCount = Object.keys(input.changes).length;
        const changeLabels = Object.values(input.changes).map(c => c.label);

        if (isArtist && venueProfile) {
          notif.notifyRiderRevisionProposed({
            recipientUserId: venueProfile.userId,
            proposerName,
            bookingId: input.bookingId,
            fieldCount,
          }).catch(() => {});
          // Send email to venue
          const venueUser = await db.getUserById(venueProfile.userId);
          if (venueUser?.email) {
            sendRiderRevisionProposedEmail({
              recipientEmail: venueUser.email,
              recipientName: venueProfile.organizationName,
              proposerName,
              bookingId: input.bookingId,
              fieldCount,
              changeLabels,
            }).catch(() => {});
          }
        } else if (isVenue && artistProfile) {
          notif.notifyRiderRevisionProposed({
            recipientUserId: artistProfile.userId,
            proposerName,
            bookingId: input.bookingId,
            fieldCount,
          }).catch(() => {});
          // Send email to artist
          const artistUser = await db.getUserById(artistProfile.userId);
          if (artistUser?.email) {
            sendRiderRevisionProposedEmail({
              recipientEmail: artistUser.email,
              recipientName: artistProfile.artistName,
              proposerName,
              bookingId: input.bookingId,
              fieldCount,
              changeLabels,
            }).catch(() => {});
          }
        }
      } catch (_) {}

      return { success: true, revisionId: revision.id };
    }),

  /**
   * Get all revisions for a booking
   */
  getRevisions: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      const isArtist = artistProfile && booking.artistId === artistProfile.id;
      const isVenue = venueProfile && booking.venueId === venueProfile.id;

      if (!isArtist && !isVenue) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      const revisions = await db.getRiderRevisionsByBookingId(input.bookingId);
      return revisions.map(r => ({
        id: r.id,
        proposedByRole: r.proposedByRole,
        proposedByUserId: r.proposedByUserId,
        status: r.status,
        changes: r.changes as Record<string, { oldValue: any; newValue: any; label: string }>,
        rejectionReason: r.rejectionReason,
        reviewedAt: r.reviewedAt,
        createdAt: r.createdAt,
      }));
    }),

  /**
   * Approve a proposed revision — applies changes to the rider template data
   */
  approveRevision: protectedProcedure
    .input(z.object({ revisionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const revision = await db.getRiderRevisionById(input.revisionId);
      if (!revision) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Revision not found" });
      }

      if (revision.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Revision already reviewed" });
      }

      const booking = await db.getBookingById(revision.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      // Only the OTHER party can approve (not the proposer)
      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      const isArtist = artistProfile && booking.artistId === artistProfile.id;
      const isVenue = venueProfile && booking.venueId === venueProfile.id;

      if (!isArtist && !isVenue) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      const currentRole = isArtist ? "artist" : "venue";
      if (currentRole === revision.proposedByRole) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot approve your own revision" });
      }

      // Apply changes to the rider template data
      if (booking.riderTemplateId) {
        const riderTemplate = await getRiderTemplate(booking.riderTemplateId);
        if (riderTemplate) {
          const currentData = typeof riderTemplate.templateData === "string"
            ? JSON.parse(riderTemplate.templateData)
            : riderTemplate.templateData || {};

          const changes = revision.changes as Record<string, { oldValue: any; newValue: any; label: string }>;
          for (const [fieldId, change] of Object.entries(changes)) {
            currentData[fieldId] = change.newValue;
          }

          // Update the rider template with new data
          // Use direct DB update since this is an approved revision (bypasses artist ownership check)
          const { getDb: getDbFn } = await import('../db');
          const { riderTemplates: riderTemplatesTable } = await import('../../drizzle/schema');
          const { eq: eqFn } = await import('drizzle-orm');
          const dbInst = await getDbFn();
          if (dbInst) {
            await dbInst.update(riderTemplatesTable).set({
              templateData: currentData,
            }).where(eqFn(riderTemplatesTable.id, booking.riderTemplateId!));
          }
        }
      }

      // Mark revision as approved
      await db.updateRiderRevision(input.revisionId, {
        status: "approved",
        reviewedByUserId: ctx.user.id,
        reviewedAt: new Date(),
      });

      // Notify proposer (in-app + email)
      try {
        const approverName = isArtist ? (artistProfile?.artistName || 'Artist') : (venueProfile?.organizationName || 'Venue');
        notif.notifyRiderRevisionApproved({
          recipientUserId: revision.proposedByUserId,
          approverName,
          bookingId: revision.bookingId,
        }).catch(() => {});
        // Send email to proposer
        const proposerUser = await db.getUserById(revision.proposedByUserId);
        if (proposerUser?.email) {
          sendRiderRevisionDecisionEmail({
            recipientEmail: proposerUser.email,
            recipientName: proposerUser.name || 'User',
            deciderName: approverName,
            bookingId: revision.bookingId,
            decision: 'approved',
          }).catch(() => {});
        }
      } catch (_) {}

      return { success: true };
    }),

  /**
   * Reject a proposed revision with optional reason
   */
  rejectRevision: protectedProcedure
    .input(z.object({
      revisionId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const revision = await db.getRiderRevisionById(input.revisionId);
      if (!revision) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Revision not found" });
      }

      if (revision.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Revision already reviewed" });
      }

      const booking = await db.getBookingById(revision.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      // Only the OTHER party can reject
      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      const isArtist = artistProfile && booking.artistId === artistProfile.id;
      const isVenue = venueProfile && booking.venueId === venueProfile.id;

      if (!isArtist && !isVenue) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      const currentRole = isArtist ? "artist" : "venue";
      if (currentRole === revision.proposedByRole) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot reject your own revision" });
      }

      await db.updateRiderRevision(input.revisionId, {
        status: "rejected",
        rejectionReason: input.reason || null,
        reviewedByUserId: ctx.user.id,
        reviewedAt: new Date(),
      });

      // Notify proposer (in-app + email)
      try {
        const rejecterName = isArtist ? (artistProfile?.artistName || 'Artist') : (venueProfile?.organizationName || 'Venue');
        notif.notifyRiderRevisionRejected({
          recipientUserId: revision.proposedByUserId,
          rejecterName,
          bookingId: revision.bookingId,
          reason: input.reason,
        }).catch(() => {});
        // Send email to proposer
        const proposerUser = await db.getUserById(revision.proposedByUserId);
        if (proposerUser?.email) {
          sendRiderRevisionDecisionEmail({
            recipientEmail: proposerUser.email,
            recipientName: proposerUser.name || 'User',
            deciderName: rejecterName,
            bookingId: revision.bookingId,
            decision: 'rejected',
            reason: input.reason,
          }).catch(() => {});
        }
      } catch (_) {}

      return { success: true };
    }),

  /**
   * Generate a polished PDF of the rider contract
   * Returns base64-encoded PDF data
   */
  downloadPdf: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking || !booking.riderTemplateId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No rider attached to this booking" });
      }

      // Verify user is involved
      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      const isArtist = artistProfile && booking.artistId === artistProfile.id;
      const isVenue = venueProfile && booking.venueId === venueProfile.id;
      if (!isArtist && !isVenue) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      // Get rider template data
      const riderTemplate = await getRiderTemplate(booking.riderTemplateId);
      if (!riderTemplate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Rider template not found" });
      }

      const riderData = typeof riderTemplate.templateData === "string"
        ? JSON.parse(riderTemplate.templateData)
        : riderTemplate.templateData || {};

      const templateType = riderTemplate.templateType || "simple_booking";

      // Get signatures
      const contract = await db.getContractByBookingId(input.bookingId);
      let signatures: any[] = [];
      let contractStatus = "pending";
      if (contract) {
        signatures = await db.getSignaturesByContractId(contract.id);
        contractStatus = contract.status;
      }

      // Generate PDF
      const pdfBuffer = await generateRiderPdf({
        templateId: templateType,
        data: riderData,
        signatures: signatures.map(s => ({
          signerRole: s.signerRole,
          signerName: s.signerName,
          signedAt: s.signedAt,
          signatureData: s.signatureData,
        })),
        contractStatus,
      });

            const base64 = pdfBuffer.toString('base64');
      const filename = `rider-${riderData.artist_name || 'artist'}-${riderData.event_name || 'booking'}.pdf`
        .toLowerCase().replace(/[^a-z0-9.-]/g, '-');
      return { pdf: base64, filename };
    }),

  /**
   * Set/override performance fee for a booking (venue can set if artist didn't)
   */
  setPerformanceFee: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      performanceFee: z.number().min(1, 'Fee must be at least $1'),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
      }

      // Only venue can set the fee override
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!venueProfile || booking.venueId !== venueProfile.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the venue can set the performance fee' });
      }

      // Update the rider template data with the fee
      if (booking.riderTemplateId) {
        const riderTemplate = await getRiderTemplate(booking.riderTemplateId);
        if (riderTemplate) {
          const templateData = typeof riderTemplate.templateData === 'string'
            ? JSON.parse(riderTemplate.templateData)
            : riderTemplate.templateData || {};
          templateData.performance_fee = input.performanceFee.toString();
          // Update the rider template
          await db.updateRiderTemplate(booking.riderTemplateId, { templateData: templateData as any });
        }
      }

      // Also update the booking's totalFee field
      await db.updateBooking(input.bookingId, { totalFee: input.performanceFee.toString() });

      return { success: true, performanceFee: input.performanceFee };
    }),
});
