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
import { projectPreviews, projectPreviewTracks, users } from "../../drizzle/schema";
import { eq, and, asc, desc, sql, sum } from "drizzle-orm";
import { storagePut } from "../storage";
import { RateLimiter } from "../utils/rateLimiter";
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
const projectIdSchema = z.number().int().safe().positive();
const trackIdSchema = z.number().int().safe().positive();
const projectPreviewPlayLimiter = new RateLimiter({ maxRequests: 30, windowMs: 60 * 1000, namespace: 'project-preview-play' });
const projectDateSchema = z.string().trim().max(40).refine((value) => {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}, 'Invalid release date');
const externalLinkSchema = z.string().trim().url().max(2048).refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === 'http:' || protocol === 'https:';
}, 'Only HTTP(S) links are allowed');
const fileNameSchema = z.string().trim().min(1).max(255).refine((value) => !/[\\/\0]/u.test(value), 'Invalid file name');
const encodedMediaSchema = z.string().min(1).max(8_000_000);

function decodeMediaDataUrl(fileData: string, mimeType: string): Buffer {
  const match = fileData.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/u);
  if (!match || match[1].toLowerCase() !== mimeType.toLowerCase()) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'The uploaded file does not match its declared MIME type.' });
  }
  const encoded = match[2].replace(/\s+/gu, '');
  const buffer = Buffer.from(encoded, 'base64');
  if (!buffer.length || buffer.toString('base64') !== encoded.replace(/=+$/u, '') + '='.repeat((4 - (encoded.replace(/=+$/u, '').length % 4)) % 4)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'The uploaded file data is invalid.' });
  }
  return buffer;
}

function validateMediaSignature(buffer: Buffer, mimeType: string): void {
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  const isMp3 = buffer.subarray(0, 3).toString('ascii') === 'ID3' || (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
  const isWav = buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WAVE';
  const isMp4 = buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
  const valid = mimeType === 'image/jpeg' ? isJpeg
    : mimeType === 'image/png' ? isPng
    : mimeType === 'image/webp' ? isWebp
    : mimeType === 'audio/mpeg' ? isMp3
    : mimeType === 'audio/wav' ? isWav
    : isMp4;
  if (!valid) throw new TRPCError({ code: 'BAD_REQUEST', message: 'The uploaded file does not match its declared format.' });
}

function extensionForMime(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/x-m4a': 'm4a',
    'audio/mp4': 'm4a',
    'audio/m4a': 'm4a',
  };
  const extension = extensions[mimeType];
  if (!extension) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unsupported project-preview media type.' });
  return extension;
}

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
        title: z.string().trim().min(1).max(255),
        releaseType: z.enum(["album", "ep", "mixtape", "deluxe", "single_collection"]).default("album"),
        description: z.string().trim().max(500).optional(),
        releaseDate: projectDateSchema.optional(),
        externalLink: externalLinkSchema.optional(),
        status: z.enum(["active", "coming_soon"]).default("active"),
      }).strict()
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
        id: projectIdSchema,
        title: z.string().trim().min(1).max(255).optional(),
        releaseType: z.enum(["album", "ep", "mixtape", "deluxe", "single_collection"]).optional(),
        description: z.string().trim().max(500).optional(),
        releaseDate: projectDateSchema.optional().nullable(),
        externalLink: externalLinkSchema.optional().nullable(),
        status: z.enum(["active", "coming_soon", "archived"]).optional(),
      }).strict()
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
        projectId: projectIdSchema,
        fileData: encodedMediaSchema,
        fileName: fileNameSchema,
        mimeType: z.enum(ALLOWED_IMAGE_TYPES as [string, ...string[]]),
      }).strict()
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

      const buffer = decodeMediaDataUrl(input.fileData, input.mimeType);
      validateMediaSignature(buffer, input.mimeType);

      if (buffer.length > MAX_IMAGE_SIZE) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Image must be under 2MB." });
      }

      const timestamp = Date.now();
      const ext = extensionForMime(input.mimeType);
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
        projectId: projectIdSchema,
        title: z.string().trim().min(1).max(255),
        durationSeconds: z.number().int().min(1).max(300).optional(),
      }).strict()
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
        trackId: trackIdSchema,
        title: z.string().trim().min(1).max(255).optional(),
        durationSeconds: z.number().int().min(1).max(300).optional(),
      }).strict()
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
    .input(z.object({ trackId: trackIdSchema }).strict())
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
        trackId: trackIdSchema,
        fileData: encodedMediaSchema,
        fileName: fileNameSchema,
        mimeType: z.enum(ALLOWED_AUDIO_TYPES as [string, ...string[]]),
      }).strict()
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

      const buffer = decodeMediaDataUrl(input.fileData, input.mimeType);
      validateMediaSignature(buffer, input.mimeType);

      if (buffer.length > MAX_AUDIO_SIZE) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Audio file must be under 5MB." });
      }

      const timestamp = Date.now();
      const ext = extensionForMime(input.mimeType);
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
        projectId: projectIdSchema,
        trackIds: z.array(trackIdSchema).min(1).max(50),
      }).strict().superRefine((value, ctx) => {
        if (new Set(value.trackIds).size !== value.trackIds.length) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['trackIds'], message: 'Track IDs must be unique.' });
        }
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

      const existingTracks = await db
        .select({ id: projectPreviewTracks.id })
        .from(projectPreviewTracks)
        .where(eq(projectPreviewTracks.projectId, input.projectId));
      const existingTrackIds = new Set(existingTracks.map((track) => track.id));
      if (existingTrackIds.size !== input.trackIds.length || input.trackIds.some((id) => !existingTrackIds.has(id))) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Track order must include exactly the tracks in this project.' });
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
   * Public: Increment play count for a track
   */
  incrementPlayCount: publicProcedure
    .input(z.object({ trackId: trackIdSchema }).strict())
    .mutation(async ({ input, ctx }) => {
      const clientIp = ctx.req?.headers?.['x-forwarded-for']?.toString()?.split(',')[0]?.trim()
        || ctx.req?.socket?.remoteAddress || 'unknown';
      if (!(await projectPreviewPlayLimiter.checkAsync(`ip:${clientIp}`)).allowed) return { success: false };
      const db = await getDb();
      if (!db) return { success: false };

      await db
        .update(projectPreviewTracks)
        .set({ playCount: sql`${projectPreviewTracks.playCount} + 1` })
        .where(eq(projectPreviewTracks.id, input.trackId));

      return { success: true };
    }),

  /**
   * Get project stats for the current user (total plays, project count)
   */
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalPlays: 0, projectCount: 0, trackCount: 0 };

    const projects = await db
      .select({ id: projectPreviews.id })
      .from(projectPreviews)
      .where(eq(projectPreviews.userId, ctx.user.id));

    if (projects.length === 0) {
      return { totalPlays: 0, projectCount: 0, trackCount: 0 };
    }

    const projectIds = projects.map((p) => p.id);

    // Get total plays and track count across all user's projects
    let totalPlays = 0;
    let trackCount = 0;
    for (const pid of projectIds) {
      const tracks = await db
        .select({ playCount: projectPreviewTracks.playCount })
        .from(projectPreviewTracks)
        .where(eq(projectPreviewTracks.projectId, pid));
      trackCount += tracks.length;
      totalPlays += tracks.reduce((acc, t) => acc + (t.playCount || 0), 0);
    }

    return { totalPlays, projectCount: projects.length, trackCount };
  }),

  getPublicProjects: publicProcedure
    .input(z.object({ userId: z.number().int().safe().positive() }).strict())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const projects = await db
        .select({
          id: projectPreviews.id,
          userId: projectPreviews.userId,
          title: projectPreviews.title,
          releaseType: projectPreviews.releaseType,
          description: projectPreviews.description,
          coverArtUrl: projectPreviews.coverArtUrl,
          externalLink: projectPreviews.externalLink,
          releaseDate: projectPreviews.releaseDate,
          status: projectPreviews.status,
          sortOrder: projectPreviews.sortOrder,
          createdAt: projectPreviews.createdAt,
          updatedAt: projectPreviews.updatedAt,
        })
        .from(projectPreviews)
        .innerJoin(users, eq(users.id, projectPreviews.userId))
        .where(and(
          eq(projectPreviews.userId, input.userId),
          eq(users.role, 'artist'),
        ))
        .orderBy(asc(projectPreviews.sortOrder));

      // Filter out archived
      const visibleProjects = projects.filter((p) => p.status !== "archived");

      // Fetch tracks for each project
      const projectsWithTracks = await Promise.all(
        visibleProjects.map(async (project) => {
          const tracks = await db
            .select({
              id: projectPreviewTracks.id,
              projectId: projectPreviewTracks.projectId,
              title: projectPreviewTracks.title,
              trackNumber: projectPreviewTracks.trackNumber,
              durationSeconds: projectPreviewTracks.durationSeconds,
              audioUrl: projectPreviewTracks.audioUrl,
              playCount: projectPreviewTracks.playCount,
            })
            .from(projectPreviewTracks)
            .where(eq(projectPreviewTracks.projectId, project.id))
            .orderBy(asc(projectPreviewTracks.trackNumber));
          return { ...project, tracks };
        })
      );

      return projectsWithTracks;
    }),
});
