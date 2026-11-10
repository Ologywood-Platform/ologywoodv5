import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { blogPosts } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { storagePut } from "../storage";
import { canManageBlog, normalizeBlogInsertId, normalizeBlogStatusCounts } from "../services/blogAdminService";

// Admin, Blogger, or site-owner middleware
const blogAccess = protectedProcedure.use(async (opts) => {
  const user = opts.ctx.user;
  if (!canManageBlog(user)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Blog management access is limited to the site owner, administrators, and approved bloggers.',
    });
  }
  return opts.next();
});

const blogPostId = z.number().int().safe().positive();
const blogLimit = z.number().int().min(1).max(100);
const blogOffset = z.number().int().min(0).max(1_000_000);
const blogSlug = z.string().trim().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens");
const blogText = z.string().trim().min(1);
const blogTags = z.array(z.string().trim().min(1).max(50)).max(20).default([]);
const blogImageMime = z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const blogImageData = z.string().min(1).max(15_000_000);
const blogImageFileName = z.string().trim().min(1).max(255).regex(/^[^/\\]+$/, "Invalid image filename");
const blogImageUrl = z.string().trim().url().max(2_000).refine((value) => /^https?:\/\//i.test(value), "Cover image URL must use HTTP(S)");

export const blogRouter = router({
  /**
   * List published blog posts (public)
   */
  list: publicProcedure
    .input(
      z.object({
        limit: blogLimit.default(10),
        offset: blogOffset.default(0),
        category: z.enum(["announcement", "guide", "news", "update", "tutorial"]).optional(),
      }).strict()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(blogPosts.status, "published")];
      if (input.category) {
        conditions.push(eq(blogPosts.category, input.category));
      }

      const posts = await db
        .select({
          id: blogPosts.id,
          slug: blogPosts.slug,
          title: blogPosts.title,
          excerpt: blogPosts.excerpt,
          coverImageUrl: blogPosts.coverImageUrl,
          authorName: blogPosts.authorName,
          category: blogPosts.category,
          tags: blogPosts.tags,
          publishedAt: blogPosts.publishedAt,
        })
        .from(blogPosts)
        .where(and(...conditions))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(blogPosts)
        .where(and(...conditions));

      return {
        posts,
        total: countResult[0]?.count ?? 0,
      };
    }),

  /**
   * Get a single blog post by slug (public)
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: blogSlug }).strict())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [post] = await db
        .select()
        .from(blogPosts)
        .where(and(eq(blogPosts.slug, input.slug), eq(blogPosts.status, "published")));

      if (!post) return null;
      return post;
    }),

  /**
   * List all blog posts for admin (includes drafts/archived)
   */
  adminList: blogAccess
    .input(
      z.object({
        limit: blogLimit.default(50),
        offset: blogOffset.default(0),
        status: z.enum(["draft", "published", "archived"]).optional(),
      }).strict()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [];
      if (input.status) {
        conditions.push(eq(blogPosts.status, input.status));
      }

      const posts = await db
        .select()
        .from(blogPosts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(blogPosts.updatedAt))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(blogPosts)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const [statusCountRow] = await db
        .select({
          total: sql<number>`count(*)`,
          published: sql<number>`sum(case when ${blogPosts.status} = 'published' then 1 else 0 end)`,
          drafts: sql<number>`sum(case when ${blogPosts.status} = 'draft' then 1 else 0 end)`,
          archived: sql<number>`sum(case when ${blogPosts.status} = 'archived' then 1 else 0 end)`,
        })
        .from(blogPosts);

      return {
        posts,
        total: Number(countResult[0]?.count ?? 0),
        counts: normalizeBlogStatusCounts(statusCountRow as Record<string, unknown> | undefined),
      };
    }),

  /**
   * Get a single blog post by ID for admin editing
   */
  adminGetById: blogAccess
    .input(z.object({ id: blogPostId }).strict())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, input.id));

      if (!post) throw new Error("Post not found");
      return post;
    }),

  /**
   * Create a new blog post (admin only)
   */
  create: blogAccess
    .input(
      z.object({
        title: blogText.max(500),
        slug: blogSlug,
        excerpt: blogText.max(2_000),
        content: blogText.max(200_000),
        coverImageUrl: blogImageUrl.optional(),
        category: z.enum(["announcement", "guide", "news", "update", "tutorial"]).default("announcement"),
        tags: blogTags,
        status: z.enum(["draft", "published"]).default("draft"),
      }).strict()
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const publishedAt = input.status === "published" ? new Date() : null;

      const result = await db.insert(blogPosts).values({
        ...input,
        authorId: ctx.user.id,
        authorName: ctx.user.name || "Ologywood Team",
        publishedAt,
      });

      const postId = normalizeBlogInsertId(result);
      if (postId === undefined) {
        throw new Error("Blog post was created but its identifier could not be confirmed.");
      }
      return { success: true, postId };
    }),

  /**
   * Update an existing blog post (admin only)
   */
  update: blogAccess
    .input(
      z.object({
        id: blogPostId,
        title: blogText.max(500).optional(),
        slug: blogSlug.optional(),
        excerpt: blogText.max(2_000).optional(),
        content: blogText.max(200_000).optional(),
        coverImageUrl: blogImageUrl.nullable().optional(),
        category: z.enum(["announcement", "guide", "news", "update", "tutorial"]).optional(),
        tags: blogTags.removeDefault().optional(),
        status: z.enum(["draft", "published"]).optional(),
      }).strict()
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...fields } = input;
      const updates: typeof fields & { publishedAt?: Date } = { ...fields };
      if (input.status === "published") {
        const [existing] = await db
          .select({ publishedAt: blogPosts.publishedAt })
          .from(blogPosts)
          .where(eq(blogPosts.id, id));
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        if (!existing.publishedAt) updates.publishedAt = new Date();
      }
      await db.update(blogPosts).set(updates).where(eq(blogPosts.id, id));

      return { success: true };
    }),

  /**
   * Publish or unpublish a blog post (admin only)
   */
  setStatus: blogAccess
    .input(
      z.object({
        id: blogPostId,
        status: z.enum(["draft", "published", "archived"]),
      }).strict()
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updates: Record<string, any> = { status: input.status };
      if (input.status === "published") {
        // Only set publishedAt if it hasn't been set before
        const [existing] = await db
          .select({ publishedAt: blogPosts.publishedAt })
          .from(blogPosts)
          .where(eq(blogPosts.id, input.id));
        if (!existing?.publishedAt) {
          updates.publishedAt = new Date();
        }
      }

      await db.update(blogPosts).set(updates).where(eq(blogPosts.id, input.id));
      return { success: true };
    }),

  /**
   * Upload a cover image for a blog post (admin only)
   */
  uploadCoverImage: blogAccess
    .input(
      z.object({
        postId: blogPostId,
        fileData: blogImageData, // base64 encoded image
        fileName: blogImageFileName,
        mimeType: blogImageMime,
      }).strict()
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify post exists
      const [post] = await db
        .select({ id: blogPosts.id })
        .from(blogPosts)
        .where(eq(blogPosts.id, input.postId));
      if (!post) throw new Error("Post not found");

      // Upload to S3 only after validating the encoded payload and decoded size.
      const dataUrlMatch = input.fileData.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i);
      if (dataUrlMatch && dataUrlMatch[1].toLowerCase() !== input.mimeType) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Image MIME type does not match the data URL.' });
      }
      const base64Data = dataUrlMatch ? dataUrlMatch[2].replace(/\s/g, '') : input.fileData.replace(/\s/g, '');
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data) || base64Data.length % 4 === 1) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid base64 image data.' });
      }
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length < 1 || buffer.length > 10_000_000) {
        throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: 'Cover image must be between 1 byte and 10 MB.' });
      }
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileExtension = ({
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
      } as const)[input.mimeType];
      const fileKey = `blog-covers/${input.postId}/${timestamp}-${randomSuffix}.${fileExtension}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Update post with cover image URL
      await db.update(blogPosts).set({ coverImageUrl: url }).where(eq(blogPosts.id, input.postId));

      return { url, success: true };
    }),

  /**
   * Delete a blog post (admin only)
   */
  delete: blogAccess
    .input(z.object({ id: blogPostId }).strict())
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(blogPosts).where(eq(blogPosts.id, input.id));
      return { success: true };
    }),
});
