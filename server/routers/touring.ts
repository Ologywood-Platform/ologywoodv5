/**
 * Touring Router
 * tRPC endpoints for artist touring availability management.
 * Artists can signal they're available for touring, set target regions,
 * date windows, travel radius, and tour type preferences.
 * Venues can discover touring artists via public endpoints.
 */

import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

const safeProfileId = z.number().int().safe().positive();
const dateValue = z.string().trim().min(1).max(40).refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date');
const dateWindowSchema = z.object({
  start: dateValue, // ISO date string
  end: dateValue,   // ISO date string
}).strict().superRefine((value, ctx) => {
  if (new Date(value.end).getTime() <= new Date(value.start).getTime()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end'], message: "Each date window's end date must be after its start date" });
  }
});

const boundedLabel = z.string().trim().min(1).max(100);

const tourAvailabilityInput = z.object({
  isAvailable: z.boolean(),
  targetRegions: z.array(boundedLabel).max(20).optional().default([]),
  homeBase: z.string().trim().max(200).optional().nullable(),
  travelRadius: z.enum(["local", "regional", "national", "international"]).optional().default("regional"),
  tourTypes: z.array(boundedLabel).max(20).optional().default([]),
  dateWindows: z.array(dateWindowSchema).max(20).optional().default([]),
  notes: z.string().trim().max(2000).optional().nullable(),
}).strict();

export const touringRouter = router({
  /**
   * Get the current artist's touring availability
   */
  getMyTouring: protectedProcedure
    .query(async ({ ctx }: any) => {
      if (ctx.user.role !== "artist" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Artist access required" });
      }

      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile) {
        return null;
      }

      return await db.getTourAvailability(artistProfile.id);
    }),

  /**
   * Update the current artist's touring availability (upsert)
   */
  updateMyTouring: protectedProcedure
    .input(tourAvailabilityInput)
    .mutation(async ({ ctx, input }: any) => {
      if (ctx.user.role !== "artist" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Artist access required" });
      }

      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Artist profile not found" });
      }

      // Validate date windows: end must be after start
      const result = await db.upsertTourAvailability({
        artistProfileId: artistProfile.id,
        isAvailable: input.isAvailable,
        targetRegions: input.targetRegions,
        homeBase: input.homeBase ?? null,
        travelRadius: input.travelRadius,
        tourTypes: input.tourTypes,
        dateWindows: input.dateWindows,
        notes: input.notes ?? null,
      });

      return result;
    }),

  /**
   * Get touring availability for a specific artist (public)
   */
  getArtistTouring: publicProcedure
    .input(z.object({ artistProfileId: safeProfileId }).strict())
    .query(async ({ input }: any) => {
      const touring = await db.getTourAvailability(input.artistProfileId);
      if (!touring || !touring.isAvailable) {
        return null;
      }
      return touring;
    }),

  /**
   * Get all artists currently available for touring (public, for venue discovery)
   */
  getAvailableArtists: publicProcedure
    .input(
      z.object({
        region: z.string().trim().max(100).optional(),
        travelRadius: z.enum(["local", "regional", "national", "international"]).optional(),
        tourType: boundedLabel.optional(),
      }).strict().optional().default({})
    )
    .query(async ({ input }: any) => {
      const artists = await db.getAvailableTouringArtists({
        region: input?.region,
        travelRadius: input?.travelRadius,
        tourType: input?.tourType,
      });

      return artists.map(a => ({
        id: a.id,
        artistName: a.artistName,
        genre: a.genre,
        location: a.location,
        profilePhotoUrl: a.profilePhotoUrl,
        feeRangeMin: a.feeRangeMin,
        feeRangeMax: a.feeRangeMax,
        touring: {
          targetRegions: a.touring.targetRegions,
          homeBase: a.touring.homeBase,
          travelRadius: a.touring.travelRadius,
          tourTypes: a.touring.tourTypes,
          dateWindows: a.touring.dateWindows,
          notes: a.touring.notes,
        },
      }));
    }),

  /**
   * Batch check touring status for multiple artists (for browse page badges)
   */
  getTouringStatus: publicProcedure
    .input(z.object({ artistProfileIds: z.array(safeProfileId).min(1).max(100).refine((ids) => new Set(ids).size === ids.length, 'Duplicate artist profile IDs are not allowed') }).strict())
    .query(async ({ input }: any) => {
      const statusMap = await db.getTouringStatusForArtists(input.artistProfileIds);
      // Convert Map to plain object for serialization
      const result: Record<number, boolean> = {};
      statusMap.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }),
});
