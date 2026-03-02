import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { verifyApiKey } from "../routers/apiKeys";
import { getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  /** Set when authenticated via API key (contains scopes and rate limit) */
  apiKeyAuth?: { scopes: string[]; rateLimit: number };
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let apiKeyAuth: { scopes: string[]; rateLimit: number } | undefined;

  // 1. Check for API key in X-API-Key header (agent / programmatic access)
  const apiKeyHeader = opts.req.headers["x-api-key"];
  if (typeof apiKeyHeader === "string" && apiKeyHeader.startsWith("olo_")) {
    try {
      const keyData = await verifyApiKey(apiKeyHeader);
      if (keyData) {
        user = await getUserById(keyData.userId) ?? null;
        apiKeyAuth = { scopes: keyData.scopes, rateLimit: keyData.rateLimit };
      }
    } catch {
      // API key auth failed — fall through to cookie auth
    }
  }

  // 2. Fall back to OAuth session cookie (browser access)
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    apiKeyAuth,
  };
}
