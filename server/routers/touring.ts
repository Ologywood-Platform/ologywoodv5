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

const dateWindowSchema = z.object({
  start: z.string(), // ISO date string
  end: z.string(),   // ISO date string
});

const tourAvailabilityInput = z.object({
  isAvailable: z.boolean(),
  targetRegions: z.array(z.string()).optional().default([]),
  homeBase: z.string().optional().nullable(),
  travelRadius: z.enum(["local", "regional", "national", "international"]).optional().default("regional"),
  tourTypes: z.array(z.string()).optional().default([]),
  dateWindows: z.array(dateWindowSchema).optional().default([]),
  notes: z.string().optional().nullable(),
});

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
      if (input.dateWindows && input.dateWindows.length > 0) {
        for (const window of input.dateWindows) {
          if (new Date(window.end) <= new Date(window.start)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Each date window's end date must be after its start date",
            });
          }
        }
      }

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
    .input(z.object({ artistProfileId: z.number() }))
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
        region: z.string().optional(),
        travelRadius: z.enum(["local", "regional", "national", "international"]).optional(),
        tourType: z.string().optional(),
      }).optional().default({})
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
    .input(z.object({ artistProfileIds: z.array(z.number()) }))
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
