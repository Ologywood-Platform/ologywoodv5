/**
 * API Key Management Router
 * Handles CRUD operations for API keys used by AI agents and integrations.
 * Keys are hashed with SHA-256 before storage; the raw key is only shown once at creation.
 */
import { z } from "zod";
import { eq, and, isNull, desc } from "drizzle-orm";
import crypto from "crypto";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { apiKeys, webhookEndpoints } from "../../drizzle/schema";

/** Available API scopes */
const AVAILABLE_SCOPES = [
  "artists:read",
  "artists:write",
  "bookings:read",
  "bookings:write",
  "events:read",
  "events:write",
  "messages:read",
  "messages:write",
  "releases:read",
  "releases:write",
  "profile:read",
  "profile:write",
] as const;

/** Available webhook event types */
const WEBHOOK_EVENTS = [
  "booking.created",
  "booking.updated",
  "booking.cancelled",
  "booking.confirmed",
  "message.received",
  "payment.completed",
  "payment.failed",
  "event.created",
  "event.updated",
  "release.published",
] as const;

/** Generate a cryptographically secure API key with prefix */
function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const rawBytes = crypto.randomBytes(32);
  const raw = `olo_${rawBytes.toString("hex")}`;
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const prefix = raw.substring(0, 11); // "olo_" + first 7 hex chars
  return { raw, hash, prefix };
}

/** Hash an API key for lookup */
function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export const apiKeysRouter = router({
  /** List all API keys for the current user (hashed, never returns raw key) */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        rateLimit: apiKeys.rateLimit,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        revokedAt: apiKeys.revokedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, ctx.user.id))
      .orderBy(desc(apiKeys.createdAt));
    return keys;
  }),

  /** Create a new API key. Returns the raw key ONCE — it cannot be retrieved again. */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        scopes: z.array(z.enum(AVAILABLE_SCOPES)).min(1),
        rateLimit: z.number().int().min(10).max(1000).optional().default(100),
        expiresInDays: z.number().int().min(1).max(365).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Limit to 10 active keys per user
      const existing = await db
        .select({ id: apiKeys.id })
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, ctx.user.id), isNull(apiKeys.revokedAt)));
      if (existing.length >= 10) {
        throw new Error("Maximum of 10 active API keys per account");
      }

      const { raw, hash, prefix } = generateApiKey();
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      await db.insert(apiKeys).values({
        userId: ctx.user.id,
        name: input.name,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: input.scopes,
        rateLimit: input.rateLimit,
        expiresAt,
      });

      return {
        key: raw, // Only time the raw key is returned
        prefix,
        name: input.name,
        scopes: input.scopes,
        rateLimit: input.rateLimit,
        expiresAt,
      };
    }),

  /** Revoke an API key */
  revoke: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [key] = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, ctx.user.id)));
      if (!key) throw new Error("API key not found");
      if (key.revokedAt) throw new Error("API key already revoked");

      await db
        .update(apiKeys)
        .set({ revokedAt: new Date() })
        .where(eq(apiKeys.id, input.id));
      return { success: true };
    }),

  /** Rotate an API key — revokes the old one and creates a new one with the same settings */
  rotate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [oldKey] = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, ctx.user.id)));
      if (!oldKey) throw new Error("API key not found");
      if (oldKey.revokedAt) throw new Error("Cannot rotate a revoked key");

      // Revoke old key
      await db
        .update(apiKeys)
        .set({ revokedAt: new Date() })
        .where(eq(apiKeys.id, input.id));

      // Create new key with same settings
      const { raw, hash, prefix } = generateApiKey();
      await db.insert(apiKeys).values({
        userId: ctx.user.id,
        name: oldKey.name,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: oldKey.scopes,
        rateLimit: oldKey.rateLimit,
        expiresAt: oldKey.expiresAt,
      });

      return {
        key: raw,
        prefix,
        name: oldKey.name,
        scopes: oldKey.scopes,
      };
    }),

  /** Get available scopes */
  getScopes: protectedProcedure.query(() => {
    return AVAILABLE_SCOPES.map((scope) => {
      const [resource, action] = scope.split(":");
      return { scope, resource, action, description: `${action === "read" ? "Read" : "Write"} access to ${resource}` };
    });
  }),

  // ==================== WEBHOOK ENDPOINTS ====================

  /** List webhook endpoints for the current user */
  listWebhooks: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const endpoints = await db
      .select({
        id: webhookEndpoints.id,
        url: webhookEndpoints.url,
        events: webhookEndpoints.events,
        isActive: webhookEndpoints.isActive,
        lastDeliveredAt: webhookEndpoints.lastDeliveredAt,
        failureCount: webhookEndpoints.failureCount,
        createdAt: webhookEndpoints.createdAt,
      })
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.userId, ctx.user.id))
      .orderBy(desc(webhookEndpoints.createdAt));
    return endpoints;
  }),

  /** Create a webhook endpoint */
  createWebhook: protectedProcedure
    .input(
      z.object({
        url: z.string().url().max(500),
        events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Limit to 5 webhook endpoints per user
      const existing = await db
        .select({ id: webhookEndpoints.id })
        .from(webhookEndpoints)
        .where(and(eq(webhookEndpoints.userId, ctx.user.id), eq(webhookEndpoints.isActive, true)));
      if (existing.length >= 5) {
        throw new Error("Maximum of 5 active webhook endpoints per account");
      }

      const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

      const [result] = await db.insert(webhookEndpoints).values({
        userId: ctx.user.id,
        url: input.url,
        secret,
        events: input.events,
      });

      return {
        id: result.insertId,
        secret, // Only shown once
        url: input.url,
        events: input.events,
      };
    }),

  /** Delete a webhook endpoint */
  deleteWebhook: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [endpoint] = await db
        .select()
        .from(webhookEndpoints)
        .where(and(eq(webhookEndpoints.id, input.id), eq(webhookEndpoints.userId, ctx.user.id)));
      if (!endpoint) throw new Error("Webhook endpoint not found");

      await db.delete(webhookEndpoints).where(eq(webhookEndpoints.id, input.id));
      return { success: true };
    }),

  /** Toggle a webhook endpoint active/inactive */
  toggleWebhook: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [endpoint] = await db
        .select()
        .from(webhookEndpoints)
        .where(and(eq(webhookEndpoints.id, input.id), eq(webhookEndpoints.userId, ctx.user.id)));
      if (!endpoint) throw new Error("Webhook endpoint not found");

      await db
        .update(webhookEndpoints)
        .set({ isActive: !endpoint.isActive })
        .where(eq(webhookEndpoints.id, input.id));
      return { isActive: !endpoint.isActive };
    }),

  /** Get available webhook event types */
  getWebhookEvents: protectedProcedure.query(() => {
    return WEBHOOK_EVENTS.map((event) => {
      const [resource, action] = event.split(".");
      return { event, resource, action, description: `Triggered when a ${resource} is ${action}` };
    });
  }),
});

/** Verify an API key and return the associated user ID and scopes */
export async function verifyApiKey(rawKey: string): Promise<{
  userId: number;
  scopes: string[];
  rateLimit: number;
} | null> {
  const db = await getDb();
  if (!db) return null;
  const hash = hashApiKey(rawKey);
  const [key] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, hash));

  if (!key) return null;
  if (key.revokedAt) return null;
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) return null;

  // Update last used timestamp (fire and forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, key.id))
    .catch(() => {});

  return {
    userId: key.userId,
    scopes: key.scopes,
    rateLimit: key.rateLimit,
  };
}
