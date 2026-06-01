/**
 * Project Previews Router
 * Allows artists to showcase unreleased/upcoming albums, EPs, mixtapes, etc.
 * with audio track snippets.
 *
 * Tier-gated: Free = 0, Starter = 1 project (6 tracks, 30s), Professional = 3 projects (12 tracks, 60s)
 * Cover art: 2MB max, JPEG/PNG/WebP
 * Audio: 5MB max, MP3/WAV/M4A
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { projectPreviews, projectPreviewTracks } from "../../drizzle/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { storagePut } from "../storage";
import {
  getUserSubscription,
  PRICING_TIERS,
  type PricingTier,
  canCreateProjectPreview,
  getMaxTracksPerProject,
} from "../services/pricingTierService";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4", "audio/m4a"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5MB

export const projectPreviewsRouter = router({
  /**
   * Get current user's project previews (for management)
   */
  myProjects: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const projects = await db
      .select()
      .from(projectPreviews)
      .where(eq(projectPreviews.userId, ctx.user.id))
      .orderBy(asc(projectPreviews.sortOrder));

    // Fetch tracks for each project
    const projectsWithTracks = await Promise.all(
      projects.map(async (project) => {
        const tracks = await db
          .select()
          .from(projectPreviewTracks)
          .where(eq(projectPreviewTracks.projectId, project.id))
          .orderBy(asc(projectPreviewTracks.trackNumber));
        return { ...project, tracks };
      })
    );

    return projectsWithTracks;
  }),

  /**
   * Get tier limit info for project previews
   */
  getLimitInfo: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const subscription = await getUserSubscription(ctx.user.id);
    const tier = PRICING_TIERS[subscription.tier as PricingTier];

    const projects = await db
      .select()
      .from(projectPreviews)
      .where(eq(projectPreviews.userId, ctx.user.id));

    return {
      currentCount: projects.length,
      maxProjects: tier.maxProjectPreviews,
      maxTracksPerProject: tier.maxTracksPerProject,
      maxSnippetSeconds: tier.maxSnippetSeconds,
      tierName: tier.name,
      canAdd: projects.length < tier.maxProjectPreviews,
    };
  }),

  /**
   * Create a new project preview
   */
  createProject: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        releaseType: z.enum(["album", "ep", "mixtape", "deluxe", "single_collection"]).default("album"),
        description: z.string().max(500).optional(),
        releaseDate: z.string().optional(), // ISO date string
        externalLink: z.string().url().max(2048).optional(),
        status: z.enum(["active", "coming_soon"]).default("active"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check tier limit
      const existing = await db
        .select()
        .from(projectPreviews)
        .where(eq(projectPreviews.userId, ctx.user.id));

      const check = await canCreateProjectPreview(ctx.user.id, existing.length);
      if (!check.allowed) {
        throw new TRPCError({ code: "FORBIDDEN", message: check.reason! });
      }

      const maxSort = existing.length > 0 ? Math.max(...existing.map((p) => p.sortOrder)) : 0;

      const result = await db.insert(projectPreviews).values({
        userId: ctx.user.id,
        title: input.title,
        releaseType: input.releaseType,
        description: input.description || null,
        releaseDate: input.releaseDate ? new Date(input.releaseDate) : null,
        externalLink: input.externalLink || null,
        status: input.status,
        sortOrder: maxSort + 1,
      });

      return { success: true, id: (result as any)[0]?.insertId || (result as any).insertId };
    }),

  /**
   * Update a project preview
   */
  updateProject: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().min(1).max(255).optional(),
        releaseType: z.enum(["album", "ep", "mixtape", "deluxe", "single_collection"]).optional(),
        description: z.string().max(500).optional(),
        releaseDate: z.string().optional(),
        externalLink: z.string().url().max(2048).optional().nullable(),
        status: z.enum(["active", "coming_soon", "archived"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify ownership
      const [project] = await db
        .select()
        .from(projectPreviews)
        .where(and(eq(projectPreviews.id, input.id), eq(projectPreviews.userId, ctx.user.id)))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const updates: any = { updatedAt: new Date() };
      if (input.title !== undefined) updates.title = input.title;
      if (input.releaseType !== undefined) updates.releaseType = input.releaseType;
      if (input.description !== undefined) updates.description = input.description;
      if (input.releaseDate !== undefined) updates.releaseDate = input.releaseDate;
      if (input.externalLink !== undefined) updates.externalLink = input.externalLink;
      if (input.status !== undefined) updates.status = input.status;

      await db.update(projectPreviews).set(updates).where(eq(projectPreviews.id, input.id));

      return { success: true };
    }),

  /**
   * Delete a project preview (and all its tracks)
   */
  deleteProject: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify ownership
      const [project] = await db
        .select()
        .from(projectPreviews)
        .where(and(eq(projectPreviews.id, input.id), eq(projectPreviews.userId, ctx.user.id)))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Delete tracks first
      await db.delete(projectPreviewTracks).where(eq(projectPreviewTracks.projectId, input.id));
      // Delete project
      await db.delete(projectPreviews).where(eq(projectPreviews.id, input.id));

      return { success: true };
    }),

  /**
   * Upload cover art for a project (2MB, JPEG/PNG/WebP)
   */
  uploadCoverArt: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int().positive(),
        fileData: z.string(), // base64
        fileName: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (!ALLOWED_IMAGE_TYPES.includes(input.mimeType)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only JPEG, PNG, and WebP images are allowed." });
      }

      // Verify ownership
      const [project] = await db
        .select()
        .from(projectPreviews)
        .where(and(eq(projectPreviews.id, input.projectId), eq(projectPreviews.userId, ctx.user.id)))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const base64Data = input.fileData.split(",")[1] || input.fileData;
      const buffer = Buffer.from(base64Data, "base64");

      if (buffer.length > MAX_IMAGE_SIZE) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Image must be under 2MB." });
      }

      const timestamp = Date.now();
      const ext = input.fileName.split(".").pop() || "jpg";
      const fileKey = `project-previews/${ctx.user.id}/${input.projectId}/cover-${timestamp}.${ext}`;

      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      await db
        .update(projectPreviews)
        .set({ coverArtUrl: url, updatedAt: new Date() })
        .where(eq(projectPreviews.id, input.projectId));

      return { success: true, url };
    }),

  /**
   * Add a track to a project
   */
  addTrack: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int().positive(),
        title: z.string().min(1).max(255),
        durationSeconds: z.number().int().min(1).max(300).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify ownership
      const [project] = await db
        .select()
        .from(projectPreviews)
        .where(and(eq(projectPreviews.id, input.projectId), eq(projectPreviews.userId, ctx.user.id)))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Check track limit
      const maxTracks = await getMaxTracksPerProject(ctx.user.id);
      const existingTracks = await db
        .select()
        .from(projectPreviewTracks)
        .where(eq(projectPreviewTracks.projectId, input.projectId));

      if (existingTracks.length >= maxTracks) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You've reached the limit of ${maxTracks} tracks per project on your current plan.`,
        });
      }

      // Get snippet seconds for tier
      const subscription = await getUserSubscription(ctx.user.id);
      const tier = PRICING_TIERS[subscription.tier as PricingTier];
      const snippetSeconds = input.durationSeconds || tier.maxSnippetSeconds;

      const nextTrackNumber = existingTracks.length + 1;

      const result = await db.insert(projectPreviewTracks).values({
        projectId: input.projectId,
        title: input.title,
        trackNumber: nextTrackNumber,
        durationSeconds: Math.min(snippetSeconds, tier.maxSnippetSeconds),
      });

      return { success: true, id: (result as any)[0]?.insertId || (result as any).insertId };
    }),

  /**
   * Update a track
   */
  updateTrack: protectedProcedure
    .input(
      z.object({
        trackId: z.number().int().positive(),
        title: z.string().min(1).max(255).optional(),
        durationSeconds: z.number().int().min(1).max(300).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify ownership via project
      const [track] = await db
        .select()
        .from(projectPreviewTracks)
        .where(eq(projectPreviewTracks.id, input.trackId))
        .limit(1);

      if (!track) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Track not found" });
      }

      const [project] = await db
        .select()
        .from(projectPreviews)
        .where(and(eq(projectPreviews.id, track.projectId), eq(projectPreviews.userId, ctx.user.id)))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      const updates: any = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.durationSeconds !== undefined) {
        const subscription = await getUserSubscription(ctx.user.id);
        const tier = PRICING_TIERS[subscription.tier as PricingTier];
        updates.durationSeconds = Math.min(input.durationSeconds, tier.maxSnippetSeconds);
      }

      await db.update(projectPreviewTracks).set(updates).where(eq(projectPreviewTracks.id, input.trackId));

      return { success: true };
    }),

  /**
   * Delete a track
   */
  deleteTrack: protectedProcedure
    .input(z.object({ trackId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify ownership via project
      const [track] = await db
        .select()
        .from(projectPreviewTracks)
        .where(eq(projectPreviewTracks.id, input.trackId))
        .limit(1);

      if (!track) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Track not found" });
      }

      const [project] = await db
        .select()
        .from(projectPreviews)
        .where(and(eq(projectPreviews.id, track.projectId), eq(projectPreviews.userId, ctx.user.id)))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      await db.delete(projectPreviewTracks).where(eq(projectPreviewTracks.id, input.trackId));

      // Re-number remaining tracks
      const remainingTracks = await db
        .select()
        .from(projectPreviewTracks)
        .where(eq(projectPreviewTracks.projectId, track.projectId))
        .orderBy(asc(projectPreviewTracks.trackNumber));

      for (let i = 0; i < remainingTracks.length; i++) {
        await db
          .update(projectPreviewTracks)
          .set({ trackNumber: i + 1 })
          .where(eq(projectPreviewTracks.id, remainingTracks[i].id));
      }

      return { success: true };
    }),

  /**
   * Upload audio for a track (5MB, MP3/WAV/M4A)
   */
  uploadAudio: protectedProcedure
    .input(
      z.object({
        trackId: z.number().int().positive(),
        fileData: z.string(), // base64
        fileName: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (!ALLOWED_AUDIO_TYPES.includes(input.mimeType)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only MP3, WAV, and M4A audio files are allowed." });
      }

      // Verify ownership via project
      const [track] = await db
        .select()
        .from(projectPreviewTracks)
        .where(eq(projectPreviewTracks.id, input.trackId))
        .limit(1);

      if (!track) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Track not found" });
      }

      const [project] = await db
        .select()
        .from(projectPreviews)
        .where(and(eq(projectPreviews.id, track.projectId), eq(projectPreviews.userId, ctx.user.id)))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      const base64Data = input.fileData.split(",")[1] || input.fileData;
      const buffer = Buffer.from(base64Data, "base64");

      if (buffer.length > MAX_AUDIO_SIZE) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Audio file must be under 5MB." });
      }

      const timestamp = Date.now();
      const ext = input.fileName.split(".").pop() || "mp3";
      const fileKey = `project-previews/${ctx.user.id}/${project.id}/tracks/${track.id}-${timestamp}.${ext}`;

      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      await db
        .update(projectPreviewTracks)
        .set({ audioUrl: url })
        .where(eq(projectPreviewTracks.id, input.trackId));

      return { success: true, url };
    }),

  /**
   * Reorder tracks within a project
   */
  reorderTracks: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int().positive(),
        trackIds: z.array(z.number().int().positive()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify ownership
      const [project] = await db
        .select()
        .from(projectPreviews)
        .where(and(eq(projectPreviews.id, input.projectId), eq(projectPreviews.userId, ctx.user.id)))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      for (let i = 0; i < input.trackIds.length; i++) {
        await db
          .update(projectPreviewTracks)
          .set({ trackNumber: i + 1 })
          .where(
            and(
              eq(projectPreviewTracks.id, input.trackIds[i]),
              eq(projectPreviewTracks.projectId, input.projectId)
            )
          );
      }

      return { success: true };
    }),

  /**
   * Public: Get project previews for a user (for profile display)
   */
  getPublicProjects: publicProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const projects = await db
        .select()
        .from(projectPreviews)
        .where(
          and(
            eq(projectPreviews.userId, input.userId),
            // Only show active and coming_soon (not archived)
          )
        )
        .orderBy(asc(projectPreviews.sortOrder));

      // Filter out archived
      const visibleProjects = projects.filter((p) => p.status !== "archived");

      // Fetch tracks for each project
      const projectsWithTracks = await Promise.all(
        visibleProjects.map(async (project) => {
          const tracks = await db
            .select()
            .from(projectPreviewTracks)
            .where(eq(projectPreviewTracks.projectId, project.id))
            .orderBy(asc(projectPreviewTracks.trackNumber));
          return { ...project, tracks };
        })
      );

      return projectsWithTracks;
    }),
});
