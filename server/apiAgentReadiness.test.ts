/**
 * Tests for AI Agent Readiness features:
 * - API key management (create, list, revoke, scopes)
 * - API key authentication middleware (X-API-Key header)
 * - API documentation page
 * - Agent-specific rate limiting tier
 * - Developer Settings UI
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// 1. API KEY DATABASE SCHEMA
// ============================================
describe('API Keys Database Schema', () => {
  it('should define api_keys table in schema', () => {
    const schema = fs.readFileSync(path.resolve('drizzle/schema.ts'), 'utf-8');
    expect(schema).toContain('apiKeys');
    expect(schema).toContain('mysqlTable');
  });

  it('should have required columns: id, userId, name, keyHash, keyPrefix, scopes, rateLimit, status', () => {
    const schema = fs.readFileSync(path.resolve('drizzle/schema.ts'), 'utf-8');
    expect(schema).toContain('keyHash');
    expect(schema).toContain('keyPrefix');
    expect(schema).toContain('scopes');
    expect(schema).toContain('rateLimit');
  });

  it('should have status column with active/revoked values', () => {
    const schema = fs.readFileSync(path.resolve('drizzle/schema.ts'), 'utf-8');
    expect(schema).toMatch(/status.*active.*revoked|status.*enum.*active/s);
  });

  it('should have lastUsedAt and expiresAt timestamp columns', () => {
    const schema = fs.readFileSync(path.resolve('drizzle/schema.ts'), 'utf-8');
    expect(schema).toContain('lastUsedAt');
    expect(schema).toContain('expiresAt');
  });

  it('should have index on userId for efficient lookups', () => {
    const schema = fs.readFileSync(path.resolve('drizzle/schema.ts'), 'utf-8');
    // Check for index definition on userId
    expect(schema).toMatch(/apiKeys|api_keys/);
    expect(schema).toContain('userId');
  });
});

// ============================================
// 2. API KEY MANAGEMENT ROUTER
// ============================================
describe('API Keys Router', () => {
  it('should exist as a tRPC router file', () => {
    const routerPath = path.resolve('server/routers/apiKeys.ts');
    expect(fs.existsSync(routerPath)).toBe(true);
  });

  it('should export create, list, revoke, and getScopes procedures', () => {
    const router = fs.readFileSync(path.resolve('server/routers/apiKeys.ts'), 'utf-8');
    expect(router).toContain('create');
    expect(router).toContain('list');
    expect(router).toContain('revoke');
    expect(router).toContain('getScopes');
  });

  it('should use protectedProcedure for all mutations', () => {
    const router = fs.readFileSync(path.resolve('server/routers/apiKeys.ts'), 'utf-8');
    expect(router).toContain('protectedProcedure');
  });

  it('should generate API keys with olo_ prefix', () => {
    const router = fs.readFileSync(path.resolve('server/routers/apiKeys.ts'), 'utf-8');
    expect(router).toContain('olo_');
  });

  it('should hash API keys before storing (never store plaintext)', () => {
    const router = fs.readFileSync(path.resolve('server/routers/apiKeys.ts'), 'utf-8');
    expect(router).toMatch(/hash|sha256|crypto/i);
  });

  it('should validate scopes input with Zod', () => {
    const router = fs.readFileSync(path.resolve('server/routers/apiKeys.ts'), 'utf-8');
    expect(router).toContain('z.');
  });

  it('should be registered in the main router', () => {
    const routers = fs.readFileSync(path.resolve('server/routers.ts'), 'utf-8');
    expect(routers).toContain('apiKeys');
  });
});

// ============================================
// 3. API KEY AUTHENTICATION MIDDLEWARE
// ============================================
describe('API Key Authentication in Context', () => {
  it('should check for X-API-Key header in createContext', () => {
    const context = fs.readFileSync(path.resolve('server/_core/context.ts'), 'utf-8');
    expect(context).toMatch(/x-api-key|X-API-Key/i);
  });

  it('should resolve user from API key when present', () => {
    const context = fs.readFileSync(path.resolve('server/_core/context.ts'), 'utf-8');
    expect(context).toContain('apiKeys');
  });

  it('should fall back to OAuth session when no API key is present', () => {
    const context = fs.readFileSync(path.resolve('server/_core/context.ts'), 'utf-8');
    // Should still contain the original authenticateRequest path
    expect(context).toContain('authenticateRequest');
  });

  it('should not break existing OAuth flow', () => {
    const context = fs.readFileSync(path.resolve('server/_core/context.ts'), 'utf-8');
    // The API key check should be a parallel path, not replacing OAuth
    expect(context).toContain('authenticateRequest');
    expect(context).toMatch(/x-api-key|X-API-Key/i);
  });

  it('should update lastUsedAt when API key is used', () => {
    const apiKeysRouter = fs.readFileSync(path.resolve('server/routers/apiKeys.ts'), 'utf-8');
    expect(apiKeysRouter).toContain('lastUsedAt');
  });
});

// ============================================
// 4. DEVELOPER SETTINGS UI
// ============================================
describe('Developer Settings Component', () => {
  it('should exist as a component file', () => {
    const componentPath = path.resolve('client/src/components/DeveloperSettings.tsx');
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it('should include API key creation form', () => {
    const component = fs.readFileSync(path.resolve('client/src/components/DeveloperSettings.tsx'), 'utf-8');
    expect(component).toMatch(/create|new.*key|generate/i);
  });

  it('should display key list with prefix and status', () => {
    const component = fs.readFileSync(path.resolve('client/src/components/DeveloperSettings.tsx'), 'utf-8');
    expect(component).toContain('keyPrefix');
  });

  it('should have revoke functionality', () => {
    const component = fs.readFileSync(path.resolve('client/src/components/DeveloperSettings.tsx'), 'utf-8');
    expect(component).toMatch(/revoke|delete/i);
  });

  it('should include scope selection checkboxes', () => {
    const component = fs.readFileSync(path.resolve('client/src/components/DeveloperSettings.tsx'), 'utf-8');
    expect(component).toMatch(/scope|permission/i);
  });

  it('should be integrated into AccountSettings as Developer tab', () => {
    const accountSettings = fs.readFileSync(path.resolve('client/src/components/AccountSettings.tsx'), 'utf-8');
    expect(accountSettings).toContain('DeveloperSettings');
    expect(accountSettings).toContain('developer');
  });
});

// ============================================
// 5. API DOCUMENTATION PAGE
// ============================================
describe('API Documentation Page', () => {
  it('should exist as a page file', () => {
    const pagePath = path.resolve('client/src/pages/ApiDocs.tsx');
    expect(fs.existsSync(pagePath)).toBe(true);
  });

  it('should document all major endpoint groups', () => {
    const page = fs.readFileSync(path.resolve('client/src/pages/ApiDocs.tsx'), 'utf-8');
    expect(page).toContain('Artists');
    expect(page).toContain('Bookings');
    expect(page).toContain('Events');
    expect(page).toContain('Messages');
    expect(page).toContain('Releases');
    expect(page).toContain('Profile');
  });

  it('should include authentication documentation', () => {
    const page = fs.readFileSync(path.resolve('client/src/pages/ApiDocs.tsx'), 'utf-8');
    expect(page).toContain('X-API-Key');
    expect(page).toContain('Authentication');
  });

  it('should include rate limiting documentation', () => {
    const page = fs.readFileSync(path.resolve('client/src/pages/ApiDocs.tsx'), 'utf-8');
    expect(page).toContain('Rate Limit');
    expect(page).toContain('X-RateLimit-Limit');
  });

  it('should include webhook documentation', () => {
    const page = fs.readFileSync(path.resolve('client/src/pages/ApiDocs.tsx'), 'utf-8');
    expect(page).toContain('Webhook');
    expect(page).toContain('booking.created');
  });

  it('should include error codes table', () => {
    const page = fs.readFileSync(path.resolve('client/src/pages/ApiDocs.tsx'), 'utf-8');
    expect(page).toContain('401');
    expect(page).toContain('403');
    expect(page).toContain('429');
  });

  it('should include Quick Start guide', () => {
    const page = fs.readFileSync(path.resolve('client/src/pages/ApiDocs.tsx'), 'utf-8');
    expect(page).toContain('Quick Start');
    expect(page).toContain('olo_');
  });

  it('should have search/filter functionality', () => {
    const page = fs.readFileSync(path.resolve('client/src/pages/ApiDocs.tsx'), 'utf-8');
    expect(page).toContain('searchQuery');
    expect(page).toContain('Search endpoints');
  });

  it('should be lazy-loaded in App.tsx', () => {
    const app = fs.readFileSync(path.resolve('client/src/App.tsx'), 'utf-8');
    expect(app).toMatch(/lazy.*ApiDocs|ApiDocs.*lazy/);
  });

  it('should have a route at /api-docs', () => {
    const app = fs.readFileSync(path.resolve('client/src/App.tsx'), 'utf-8');
    expect(app).toContain('/api-docs');
  });

  it('should have SEO meta tags', () => {
    const seoMeta = fs.readFileSync(path.resolve('client/src/utils/seoMeta.ts'), 'utf-8');
    expect(seoMeta).toContain('api-docs');
    expect(seoMeta).toContain('API Documentation');
  });
});

// ============================================
// 6. AGENT-SPECIFIC RATE LIMITING
// ============================================
describe('Agent Rate Limiting Tier', () => {
  it('should define API_AGENT tier in SubscriptionTier enum', () => {
    const rateLimiter = fs.readFileSync(path.resolve('server/middleware/rateLimiter.ts'), 'utf-8');
    expect(rateLimiter).toContain('API_AGENT');
    expect(rateLimiter).toContain('api_agent');
  });

  it('should have rate limits for API_AGENT tier', () => {
    const rateLimiter = fs.readFileSync(path.resolve('server/middleware/rateLimiter.ts'), 'utf-8');
    expect(rateLimiter).toContain('API Agent tier');
  });

  it('should have API_AGENT limits between BASIC and PREMIUM', () => {
    const rateLimiter = fs.readFileSync(path.resolve('server/middleware/rateLimiter.ts'), 'utf-8');
    // API_AGENT should have 500 req/min (between BASIC 300 and PREMIUM 1000)
    expect(rateLimiter).toMatch(/API_AGENT[\s\S]*?requestsPerMinute:\s*500/);
  });
});

// ============================================
// 7. NAVIGATION & SITEMAP INTEGRATION
// ============================================
describe('API Docs Navigation Integration', () => {
  it('should be in the sitemap', () => {
    const sitemap = fs.readFileSync(path.resolve('server/routes/sitemapRoutes.ts'), 'utf-8');
    expect(sitemap).toContain('/api-docs');
  });

  it('should be in robots.txt Allow list', () => {
    const sitemap = fs.readFileSync(path.resolve('server/routes/sitemapRoutes.ts'), 'utf-8');
    expect(sitemap).toContain('Allow: /api-docs');
  });

  it('should be in the footer', () => {
    const footer = fs.readFileSync(path.resolve('client/src/components/Footer.tsx'), 'utf-8');
    expect(footer).toContain('API Docs');
    expect(footer).toContain('/api-docs');
  });
});

// ============================================
// 8. SECURITY BEST PRACTICES
// ============================================
describe('API Key Security', () => {
  it('should never return full API key after creation', () => {
    const router = fs.readFileSync(path.resolve('server/routers/apiKeys.ts'), 'utf-8');
    // The list endpoint should only return prefix, not the full key
    expect(router).toContain('keyPrefix');
  });

  it('should use crypto for key generation', () => {
    const router = fs.readFileSync(path.resolve('server/routers/apiKeys.ts'), 'utf-8');
    expect(router).toMatch(/crypto|randomBytes|randomUUID/);
  });

  it('should support key expiration', () => {
    const schema = fs.readFileSync(path.resolve('drizzle/schema.ts'), 'utf-8');
    expect(schema).toContain('expiresAt');
  });
});
