import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { blogPosts } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { storagePut } from "../storage";
import { canManageBlog, normalizeBlogStatusCounts } from "../services/blogAdminService";

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

export const blogRouter = router({
  /**
   * List published blog posts (public)
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
        category: z.enum(["announcement", "guide", "news", "update", "tutorial"]).optional(),
      })
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
    .input(z.object({ slug: z.string() }))
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
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        status: z.enum(["draft", "published", "archived"]).optional(),
      })
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
    .input(z.object({ id: z.number() }))
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
        title: z.string().min(1).max(500),
        slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
        excerpt: z.string().min(1).max(1000),
        content: z.string().min(1),
        coverImageUrl: z.string().optional(),
        category: z.enum(["announcement", "guide", "news", "update", "tutorial"]).default("announcement"),
        tags: z.array(z.string()).default([]),
        status: z.enum(["draft", "published"]).default("draft"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const publishedAt = input.status === "published" ? new Date() : null;

      await db.insert(blogPosts).values({
        ...input,
        authorId: ctx.user.id,
        authorName: ctx.user.name || "Ologywood Team",
        publishedAt,
      });

      return { success: true };
    }),

  /**
   * Update an existing blog post (admin only)
   */
  update: blogAccess
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(500).optional(),
        slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
        excerpt: z.string().min(1).max(1000).optional(),
        content: z.string().min(1).optional(),
        coverImageUrl: z.string().nullable().optional(),
        category: z.enum(["announcement", "guide", "news", "update", "tutorial"]).optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;
      await db.update(blogPosts).set(updates).where(eq(blogPosts.id, id));

      return { success: true };
    }),

  /**
   * Publish or unpublish a blog post (admin only)
   */
  setStatus: blogAccess
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["draft", "published", "archived"]),
      })
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
        postId: z.number(),
        fileData: z.string(), // base64 encoded image
        fileName: z.string(),
        mimeType: z.string(),
      })
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

      // Upload to S3
      const base64Data = input.fileData.split(',')[1] || input.fileData;
      const buffer = Buffer.from(base64Data, 'base64');
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileExtension = input.fileName.split('.').pop() || 'jpg';
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
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(blogPosts).where(eq(blogPosts.id, input.id));
      return { success: true };
    }),
});
