import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { storagePut } from "../storage";
import { sendDisputeStatusUpdate, sendDisputeFiled } from "../email";

const disputeTypeSchema = z.enum([
  "payment_issue",
  "no_show",
  "contract_violation",
  "quality_issue",
  "cancellation_dispute",
  "harassment",
  "other",
]);
const disputeStatusSchema = z.enum(["open", "under_review", "resolved", "dismissed"]);
const disputeEvidenceMimeSchema = z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const disputeFileDataSchema = z.string().min(1).max(20_000_000).refine((value) => {
  const payload = (value.includes(",") ? value.slice(value.indexOf(",") + 1) : value).replace(/\s/g, "");
  return payload.length > 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(payload);
}, "Evidence must be base64 data");

export const disputeRouter = router({
  /**
   * Create a new dispute for a booking
   */
  create: protectedProcedure
    .input(
      z.object({
        bookingId: z.number().int().positive(),
        type: disputeTypeSchema,
        description: z.string().trim().min(20, "Please provide at least 20 characters describing the issue").max(10_000),
        evidenceUrls: z.array(z.string().url().max(2_048)).max(10).optional(),
      }).strict()
    )
    .mutation(async ({ ctx, input }) => {
      // Get the booking to verify the user is a party to it
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      // Determine if the authenticated user is actually a party to this booking.
      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      const isArtist = artistProfile?.id === booking.artistId;
      const isVenue = venueProfile?.id === booking.venueId;
      if (!isArtist && !isVenue) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only artists and venues can file disputes" });
      }

      // Check if dispute already exists for this booking
      const existing = await db.getDisputeByBookingId(input.bookingId);
      if (existing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A dispute has already been filed for this booking" });
      }

      // Determine respondent
      let respondentId: number;
      if (isVenue) {
        // Venue is reporting — respondent is the artist's user ID
        const bookingArtistProfile = await db.getArtistProfileById(booking.artistId);
        if (!bookingArtistProfile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Artist not found" });
        }
        respondentId = bookingArtistProfile.userId;
      } else {
        // Artist is reporting — respondent is the venue's user ID
        const bookingVenueProfile = await db.getVenueProfileById(booking.venueId);
        if (!bookingVenueProfile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Venue not found" });
        }
        respondentId = bookingVenueProfile.userId;
      }

      const dispute = await db.createDispute({
        bookingId: input.bookingId,
        reporterId: ctx.user.id,
        respondentId,
        type: input.type,
        description: input.description,
        evidenceUrls: input.evidenceUrls ? JSON.stringify(input.evidenceUrls) : null,
        status: "open",
      });

      // Send email notifications to both reporter and respondent (best-effort)
      try {
        const reporter = await db.getUserById(ctx.user.id);
        const respondent = await db.getUserById(respondentId);
        const booking_data = await db.getBookingById(input.bookingId);

        const eventDateFormatted = booking_data?.eventDate
          ? new Date(booking_data.eventDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'N/A';

        if (reporter?.email && respondent?.email) {
          await sendDisputeFiled({
            reporterEmail: reporter.email,
            reporterName: reporter.name || 'User',
            respondentEmail: respondent.email,
            respondentName: respondent.name || 'Other Party',
            disputeType: input.type,
            bookingEventDate: eventDateFormatted,
            disputeId: dispute.id,
            description: input.description,
          });
        }
      } catch (emailError) {
        console.error(`[Dispute] Failed to send dispute filed emails for dispute #${dispute.id}:`, emailError);
      }

      return { success: true, disputeId: dispute.id };
    }),

  /**
   * Get disputes for the current user
   */
  getMyDisputes: protectedProcedure.query(async ({ ctx }) => {
    const disputes = await db.getDisputesByUserId(ctx.user.id);
    // Enrich with booking info
    const enriched = await Promise.all(
      disputes.map(async (dispute) => {
        const booking = await db.getBookingById(dispute.bookingId);
        const reporter = await db.getUserById(dispute.reporterId);
        const respondent = await db.getUserById(dispute.respondentId);
        return {
          ...dispute,
          evidenceUrls: dispute.evidenceUrls ? JSON.parse(dispute.evidenceUrls) : [],
          booking: booking
            ? {
                id: booking.id,
                eventDate: booking.eventDate,
                eventDetails: booking.eventDetails,
                totalFee: booking.totalFee,
                status: booking.status,
              }
            : null,
          reporterName: reporter?.name || "Unknown",
          respondentName: respondent?.name || "Unknown",
        };
      })
    );
    return enriched;
  }),

  /**
   * Get dispute by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }).strict())
    .query(async ({ ctx, input }) => {
      const dispute = await db.getDisputeById(input.id);
      if (!dispute) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dispute not found" });
      }

      // Only allow parties or admin to view
      if (
        dispute.reporterId !== ctx.user.id &&
        dispute.respondentId !== ctx.user.id &&
        ctx.user.role !== "admin"
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this dispute" });
      }

      const booking = await db.getBookingById(dispute.bookingId);
      const reporter = await db.getUserById(dispute.reporterId);
      const respondent = await db.getUserById(dispute.respondentId);

      return {
        ...dispute,
        evidenceUrls: dispute.evidenceUrls ? JSON.parse(dispute.evidenceUrls) : [],
        booking: booking
          ? {
              id: booking.id,
              eventDate: booking.eventDate,
              eventDetails: booking.eventDetails,
              totalFee: booking.totalFee,
              status: booking.status,
            }
          : null,
        reporterName: reporter?.name || "Unknown",
        reporterEmail: reporter?.email || "",
        respondentName: respondent?.name || "Unknown",
        respondentEmail: respondent?.email || "",
      };
    }),

  /**
   * Upload evidence for a dispute
   */
  uploadEvidence: protectedProcedure
    .input(
      z.object({
        disputeId: z.number().int().positive(),
        fileData: disputeFileDataSchema,
        fileName: z.string().trim().min(1).max(255).regex(/^[^\\/\0]+$/, "Invalid file name"),
        mimeType: disputeEvidenceMimeSchema,
      }).strict()
    )
    .mutation(async ({ ctx, input }) => {
      const dispute = await db.getDisputeById(input.disputeId);
      if (!dispute) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dispute not found" });
      }
      if (dispute.reporterId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the reporter can upload evidence" });
      }

      const dataUrlMatch = input.fileData.match(/^data:([^;,]+);base64,([\s\S]+)$/);
      if (dataUrlMatch && dataUrlMatch[1].toLowerCase() !== input.mimeType) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Evidence MIME type does not match its data" });
      }
      const base64Data = dataUrlMatch ? dataUrlMatch[2] : input.fileData;
      const buffer = Buffer.from(base64Data, "base64");
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const ext = ({
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "application/pdf": "pdf",
      } as const)[input.mimeType];
      const fileKey = `dispute-evidence/${dispute.id}/${timestamp}-${randomSuffix}.${ext}`;

      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Append to existing evidence URLs
      const existingUrls = dispute.evidenceUrls ? JSON.parse(dispute.evidenceUrls) : [];
      existingUrls.push(url);
      await db.updateDisputeStatus(dispute.id, {
        status: dispute.status,
        adminNotes: dispute.adminNotes || undefined,
      });
      // Update evidence URLs directly
      const dbInstance = await (await import("../db")).getDb();
      if (dbInstance) {
        const { bookingDisputes } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await dbInstance
          .update(bookingDisputes)
          .set({ evidenceUrls: JSON.stringify(existingUrls) })
          .where(eq(bookingDisputes.id, dispute.id));
      }

      return { url, success: true };
    }),

  /**
   * Admin: Get all disputes
   */
  adminGetAll: protectedProcedure
    .input(z.object({ status: disputeStatusSchema.optional() }).strict().optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const disputes = await db.getAllDisputes(input?.status);
      const enriched = await Promise.all(
        disputes.map(async (dispute) => {
          const booking = await db.getBookingById(dispute.bookingId);
          const reporter = await db.getUserById(dispute.reporterId);
          const respondent = await db.getUserById(dispute.respondentId);
          return {
            ...dispute,
            evidenceUrls: dispute.evidenceUrls ? JSON.parse(dispute.evidenceUrls) : [],
            booking: booking
              ? {
                  id: booking.id,
                  eventDate: booking.eventDate,
                  eventDetails: booking.eventDetails,
                  totalFee: booking.totalFee,
                  status: booking.status,
                }
              : null,
            reporterName: reporter?.name || "Unknown",
            reporterEmail: reporter?.email || "",
            respondentName: respondent?.name || "Unknown",
            respondentEmail: respondent?.email || "",
          };
        })
      );
      return enriched;
    }),

  /**
   * Admin: Update dispute status and resolution
   */
  adminResolve: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["under_review", "resolved", "dismissed"]),
        resolution: z.string().trim().max(10_000).optional(),
        adminNotes: z.string().trim().max(10_000).optional(),
      }).strict()
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const dispute = await db.getDisputeById(input.id);
      if (!dispute) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dispute not found" });
      }

      await db.updateDisputeStatus(input.id, {
        status: input.status,
        resolution: input.resolution,
        adminNotes: input.adminNotes,
        resolvedById: input.status === "resolved" || input.status === "dismissed" ? ctx.user.id : undefined,
        resolvedAt:
          input.status === "resolved" || input.status === "dismissed" ? new Date() : undefined,
      });

      // Send email notifications to both reporter and respondent
      try {
        const reporter = await db.getUserById(dispute.reporterId);
        const respondent = await db.getUserById(dispute.respondentId);
        const booking = await db.getBookingById(dispute.bookingId);

        const eventDateFormatted = booking?.eventDate
          ? new Date(booking.eventDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'N/A';

        const commonParams = {
          reporterEmail: reporter?.email || '',
          reporterName: reporter?.name || 'User',
          respondentName: respondent?.name || 'Other Party',
          disputeType: dispute.type,
          bookingEventDate: eventDateFormatted,
          newStatus: input.status,
          resolution: input.resolution,
          disputeId: dispute.id,
        };

        // Notify the reporter
        if (reporter?.email) {
          await sendDisputeStatusUpdate({
            ...commonParams,
            recipientRole: 'reporter',
          });
          console.log(`[Dispute] Email sent to reporter for dispute #${dispute.id} -> ${input.status}`);
        }

        // Notify the respondent
        if (respondent?.email) {
          await sendDisputeStatusUpdate({
            ...commonParams,
            recipientRole: 'respondent',
            recipientEmail: respondent.email,
            recipientName: respondent.name || 'User',
          });
          console.log(`[Dispute] Email sent to respondent for dispute #${dispute.id} -> ${input.status}`);
        }
      } catch (emailError) {
        // Don't fail the mutation if email fails — log and continue
        console.error(`[Dispute] Failed to send email notification for dispute #${dispute.id}:`, emailError);
      }

      return { success: true };
    }),

  /**
   * Check if a dispute exists for a booking
   */
  checkBookingDispute: protectedProcedure
    .input(z.object({ bookingId: z.number().int().positive() }).strict())
    .query(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      const isParty = artistProfile?.id === booking.artistId || venueProfile?.id === booking.venueId;
      if (!isParty && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized for this booking" });
      }
      const dispute = await db.getDisputeByBookingId(input.bookingId);
      return { hasDispute: !!dispute, dispute: dispute || null };
    }),
});
