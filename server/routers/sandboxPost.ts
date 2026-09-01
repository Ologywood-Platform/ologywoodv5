import { TRPCError } from '@trpc/server';
import { and, eq, ne, or } from 'drizzle-orm';
import { z } from 'zod';
import {
  artistProfiles,
  artistTeamMembers,
  sandboxPosts,
  users,
} from '../../drizzle/schema';
import {
  SANDBOX_POST_IMAGE_MIME_TYPES,
  SANDBOX_POST_MAX_CHARACTERS,
  SANDBOX_POST_MAX_IMAGE_BYTES,
  SANDBOX_POST_MAX_VIDEO_BYTES,
  SANDBOX_POST_MAX_VIDEO_DURATION_SECONDS,
  SANDBOX_POST_VIDEO_MIME_TYPES,
  normalizeSandboxPostText,
  sandboxPostPath,
} from '../../shared/sandboxPost';
import { adminProcedure, protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { ensureSandboxPostSchema } from '../services/sandboxPostSchemaService';
import { storagePut } from '../storage';

const imageMimeTypes = new Set<string>(SANDBOX_POST_IMAGE_MIME_TYPES);
const videoMimeTypes = new Set<string>(SANDBOX_POST_VIDEO_MIME_TYPES);

const mediaInputSchema = z.object({
  type: z.enum(['image', 'video']),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(100),
  fileSizeBytes: z.number().int().positive(),
  durationSeconds: z.number().int().positive().max(SANDBOX_POST_MAX_VIDEO_DURATION_SECONDS).optional(),
  fileData: z.string().min(1),
  thumbnailData: z.string().optional(),
});

function decodeDataUrl(value: string): Buffer {
  const encoded = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;
  return Buffer.from(encoded, 'base64');
}

function validateFileSignature(buffer: Buffer, type: 'image' | 'video', mimeType: string) {
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  const isIsoVideo = buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
  const isWebm = buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  const valid = type === 'image'
    ? (mimeType === 'image/jpeg' && isJpeg) || (mimeType === 'image/png' && isPng) || (mimeType === 'image/webp' && isWebp)
    : (mimeType === 'video/webm' ? isWebm : isIsoVideo);
  if (!valid) throw new TRPCError({ code: 'BAD_REQUEST', message: 'The selected media file does not match its declared format.' });
}

function safeExtension(fileName: string, mimeType: string): string {
  const extensionByMime: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
  };
  const extension = extensionByMime[mimeType];
  if (!extension) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unsupported Sandbox Post media type.' });
  const suppliedExtension = fileName.split('.').pop()?.toLowerCase();
  const acceptedExtensions = mimeType === 'image/jpeg' ? ['jpg', 'jpeg'] : [extension];
  if (!suppliedExtension || !acceptedExtensions.includes(suppliedExtension)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'The selected media file extension does not match its format.' });
  }
  return extension;
}

function toPublicPost(post: typeof sandboxPosts.$inferSelect, artist: {
  artistName: string;
  talentType: string | null;
  profilePhotoUrl: string | null;
}) {
  return {
    id: post.id,
    artistProfileId: post.artistProfileId,
    content: post.content,
    mediaType: post.mediaType,
    mediaUrl: post.mediaUrl,
    mediaThumbnailUrl: post.mediaThumbnailUrl,
    status: 'active' as const,
    createdAt: post.createdAt,
    artistName: artist.artistName,
    talentType: artist.talentType,
    profilePhotoUrl: artist.profilePhotoUrl,
    canonicalPath: sandboxPostPath(artist.artistName),
  };
}

function toOwnerPost(post: typeof sandboxPosts.$inferSelect) {
  return {
    id: post.id,
    artistProfileId: post.artistProfileId,
    content: post.content,
    mediaType: post.mediaType,
    mediaUrl: post.mediaUrl,
    mediaFileName: post.mediaFileName,
    mediaSizeBytes: post.mediaSizeBytes,
    mediaDurationSeconds: post.mediaDurationSeconds,
    mediaThumbnailUrl: post.mediaThumbnailUrl,
    status: post.status,
    createdAt: post.createdAt,
  };
}

async function getOwnerProfile(userId: number, role: string) {
  if (role !== 'artist' && role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'A talent profile is required to publish a Sandbox Post.' });
  }
  const db = await getDb();
  if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
  await ensureSandboxPostSchema(db);
  const [profile] = await db.select().from(artistProfiles).where(eq(artistProfiles.userId, userId)).limit(1);
  if (!profile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Complete your talent profile before publishing a Sandbox Post.' });
  const [nonOwnerMembership] = await db.select({ id: artistTeamMembers.id }).from(artistTeamMembers)
    .where(and(eq(artistTeamMembers.userId, userId), ne(artistTeamMembers.role, 'owner'))).limit(1);
  if (nonOwnerMembership || profile.artistName.toLowerCase().includes('team member')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Team member accounts cannot publish public Sandbox Posts.' });
  }
  return { db, profile };
}

async function getPublicArtistById(artistProfileId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
  await ensureSandboxPostSchema(db);
  const [artist] = await db.select({
    id: artistProfiles.id,
    userId: artistProfiles.userId,
    artistName: artistProfiles.artistName,
    talentType: artistProfiles.talentType,
    profilePhotoUrl: artistProfiles.profilePhotoUrl,
  }).from(artistProfiles).innerJoin(users, eq(users.id, artistProfiles.userId)).where(and(
    eq(artistProfiles.id, artistProfileId),
    or(eq(users.role, 'artist'), eq(users.role, 'admin')),
  )).limit(1);
  if (!artist || artist.artistName.toLowerCase().includes('team member')) return null;
  const [nonOwnerMembership] = await db.select({ id: artistTeamMembers.id }).from(artistTeamMembers)
    .where(and(eq(artistTeamMembers.userId, artist.userId), ne(artistTeamMembers.role, 'owner'))).limit(1);
  return nonOwnerMembership ? null : { db, artist };
}

async function findArtistIdBySlug(slugInput: string): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const slug = slugInput.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const artists = await db.select({ id: artistProfiles.id, artistName: artistProfiles.artistName }).from(artistProfiles);
  return artists.find((artist) => sandboxPostPath(artist.artistName).split('/')[2] === slug)?.id ?? null;
}

export const sandboxPostRouter = router({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const { db, profile } = await getOwnerProfile(ctx.user.id, ctx.user.role);
    const [post] = await db.select().from(sandboxPosts).where(eq(sandboxPosts.artistProfileId, profile.id)).limit(1);
    return post ? toOwnerPost(post) : null;
  }),

  getPublic: publicProcedure.input(z.object({ artistProfileId: z.number().int().positive() })).query(async ({ input }) => {
    const resolved = await getPublicArtistById(input.artistProfileId);
    if (!resolved) return null;
    const [post] = await resolved.db.select().from(sandboxPosts).where(and(
      eq(sandboxPosts.artistProfileId, input.artistProfileId),
      eq(sandboxPosts.status, 'active'),
    )).limit(1);
    return post ? toPublicPost(post, resolved.artist) : null;
  }),

  getPublicBySlug: publicProcedure.input(z.object({ slug: z.string().trim().min(1).max(255) })).query(async ({ input }) => {
    const artistProfileId = await findArtistIdBySlug(input.slug);
    if (!artistProfileId) return null;
    const resolved = await getPublicArtistById(artistProfileId);
    if (!resolved) return null;
    const [post] = await resolved.db.select().from(sandboxPosts).where(and(
      eq(sandboxPosts.artistProfileId, artistProfileId),
      eq(sandboxPosts.status, 'active'),
    )).limit(1);
    return post ? toPublicPost(post, resolved.artist) : null;
  }),

  replace: protectedProcedure.input(z.object({
    content: z.string().max(SANDBOX_POST_MAX_CHARACTERS),
    media: mediaInputSchema.optional(),
  })).mutation(async ({ ctx, input }) => {
    const { db, profile } = await getOwnerProfile(ctx.user.id, ctx.user.role);
    const content = normalizeSandboxPostText(input.content);
    if (!content) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Write something before publishing your Sandbox Post.' });
    if (content.length > SANDBOX_POST_MAX_CHARACTERS) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: `Sandbox Posts are limited to ${SANDBOX_POST_MAX_CHARACTERS} characters.` });
    }

    let mediaValues: Partial<typeof sandboxPosts.$inferInsert> = {};
    if (input.media) {
      const media = input.media;
      const allowedMimeTypes = media.type === 'image' ? imageMimeTypes : videoMimeTypes;
      if (!allowedMimeTypes.has(media.mimeType)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: media.type === 'image'
          ? 'Sandbox Post images must be JPEG, PNG, or WebP.'
          : 'Sandbox Post videos must be MP4, MOV, or WebM.' });
      }
      const maxBytes = media.type === 'image' ? SANDBOX_POST_MAX_IMAGE_BYTES : SANDBOX_POST_MAX_VIDEO_BYTES;
      if (media.fileSizeBytes > maxBytes) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: media.type === 'image'
          ? 'Sandbox Post images must be 8 MB or smaller.'
          : 'Sandbox Post videos must be 25 MB or smaller.' });
      }
      if (media.type === 'video' && !media.durationSeconds) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Video duration is required.' });
      }
      const buffer = decodeDataUrl(media.fileData);
      if (buffer.length !== media.fileSizeBytes || buffer.length > maxBytes) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'The uploaded media size did not match the selected file.' });
      }
      validateFileSignature(buffer, media.type, media.mimeType);
      let validatedThumbnail: Buffer | null = null;
      if (media.type === 'video' && media.thumbnailData) {
        validatedThumbnail = decodeDataUrl(media.thumbnailData);
        if (validatedThumbnail.length > 2 * 1024 * 1024) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Video preview image must be 2 MB or smaller.' });
        }
        validateFileSignature(validatedThumbnail, 'image', 'image/jpeg');
      }
      const extension = safeExtension(media.fileName, media.mimeType);
      const randomId = crypto.randomUUID();
      const mediaKey = `sandbox-posts/${ctx.user.id}/${randomId}.${extension}`;
      const uploaded = await storagePut(mediaKey, buffer, media.mimeType);
      mediaValues = {
        mediaType: media.type,
        mediaUrl: uploaded.url,
        mediaKey: uploaded.key,
        mediaMimeType: media.mimeType,
        mediaFileName: media.fileName.replace(/[\\/\0]/g, '').slice(0, 255),
        mediaSizeBytes: buffer.length,
        mediaDurationSeconds: media.type === 'video' ? media.durationSeconds : null,
      };
      if (validatedThumbnail) {
        const thumbnailKey = `sandbox-posts/${ctx.user.id}/${randomId}-preview.jpg`;
        const uploadedThumbnail = await storagePut(thumbnailKey, validatedThumbnail, 'image/jpeg');
        mediaValues.mediaThumbnailUrl = uploadedThumbnail.url;
        mediaValues.mediaThumbnailKey = uploadedThumbnail.key;
      }
    }

    const [previousPost] = await db.select({ id: sandboxPosts.id }).from(sandboxPosts)
      .where(eq(sandboxPosts.artistProfileId, profile.id)).limit(1);
    let insertedId = 0;
    await db.transaction(async (tx) => {
      await tx.delete(sandboxPosts).where(eq(sandboxPosts.artistProfileId, profile.id));
      const insertResult = await tx.insert(sandboxPosts).values({
        artistProfileId: profile.id,
        artistUserId: ctx.user.id,
        content,
        status: 'active',
        ...mediaValues,
      });
      insertedId = Number((insertResult as any)?.[0]?.insertId ?? 0);
    });
    const [created] = insertedId
      ? await db.select().from(sandboxPosts).where(eq(sandboxPosts.id, insertedId)).limit(1)
      : await db.select().from(sandboxPosts).where(eq(sandboxPosts.artistProfileId, profile.id)).limit(1);
    if (!created) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Sandbox Post could not be saved.' });
    return {
      post: toOwnerPost(created),
      previousPostPermanentlyDeleted: Boolean(previousPost),
      previousPostId: previousPost?.id ?? null,
    };
  }),

  deleteCurrent: protectedProcedure.mutation(async ({ ctx }) => {
    const { db, profile } = await getOwnerProfile(ctx.user.id, ctx.user.role);
    const [current] = await db.select({ id: sandboxPosts.id }).from(sandboxPosts)
      .where(eq(sandboxPosts.artistProfileId, profile.id)).limit(1);
    if (!current) return { success: true, deletedPostId: null };
    await db.delete(sandboxPosts).where(and(
      eq(sandboxPosts.id, current.id),
      eq(sandboxPosts.artistUserId, ctx.user.id),
    ));
    return { success: true, deletedPostId: current.id };
  }),

  setHidden: adminProcedure.input(z.object({ postId: z.number().int().positive(), hidden: z.boolean() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    await ensureSandboxPostSchema(db);
    await db.update(sandboxPosts).set({ status: input.hidden ? 'hidden' : 'active' })
      .where(eq(sandboxPosts.id, input.postId));
    return { success: true };
  }),
});
