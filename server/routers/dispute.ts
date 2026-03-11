import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { storagePut } from "../storage";
import { sendDisputeStatusUpdate } from "../email";

export const disputeRouter = router({
  /**
   * Create a new dispute for a booking
   */
  create: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        type: z.enum([
          "payment_issue",
          "no_show",
          "contract_violation",
          "quality_issue",
          "cancellation_dispute",
          "harassment",
          "other",
        ]),
        description: z.string().min(20, "Please provide at least 20 characters describing the issue"),
        evidenceUrls: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the booking to verify the user is a party to it
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      // Determine if user is artist or venue side
      const isArtist = ctx.user.role === "artist";
      const isVenue = ctx.user.role === "venue";

      if (!isArtist && !isVenue && ctx.user.role !== "admin") {
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
        const artistProfile = await db.getArtistProfileById(booking.artistId);
        if (!artistProfile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Artist not found" });
        }
        respondentId = artistProfile.userId;
      } else {
        // Artist is reporting — respondent is the venue's user ID
        const venueProfile = await db.getVenueProfileById(booking.venueId);
        if (!venueProfile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Venue not found" });
        }
        respondentId = venueProfile.userId;
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
    .input(z.object({ id: z.number() }))
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
        disputeId: z.number(),
        fileData: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dispute = await db.getDisputeById(input.disputeId);
      if (!dispute) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dispute not found" });
      }
      if (dispute.reporterId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the reporter can upload evidence" });
      }

      const base64Data = input.fileData.split(",")[1] || input.fileData;
      const buffer = Buffer.from(base64Data, "base64");
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const ext = input.fileName.split(".").pop() || "jpg";
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
    .input(z.object({ status: z.string().optional() }).optional())
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
        id: z.number(),
        status: z.enum(["under_review", "resolved", "dismissed"]),
        resolution: z.string().optional(),
        adminNotes: z.string().optional(),
      })
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

      // Send email notification to the reporter
      try {
        const reporter = await db.getUserById(dispute.reporterId);
        const respondent = await db.getUserById(dispute.respondentId);
        const booking = await db.getBookingById(dispute.bookingId);

        if (reporter?.email) {
          await sendDisputeStatusUpdate({
            reporterEmail: reporter.email,
            reporterName: reporter.name || 'User',
            respondentName: respondent?.name || 'Other Party',
            disputeType: dispute.type,
            bookingEventDate: booking?.eventDate
              ? new Date(booking.eventDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'N/A',
            newStatus: input.status,
            resolution: input.resolution,
            disputeId: dispute.id,
          });
          console.log(`[Dispute] Email notification sent to reporter ${reporter.email} for dispute #${dispute.id} -> ${input.status}`);
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
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ input }) => {
      const dispute = await db.getDisputeByBookingId(input.bookingId);
      return { hasDispute: !!dispute, dispute: dispute || null };
    }),
});
