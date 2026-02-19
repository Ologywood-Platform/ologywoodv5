# Manus Support Ticket - Database Migration Issues

**Project:** Ologywood - Artist Booking Platform  
**Issue Type:** Database Migration Conflict  
**Severity:** High (Blocking Feature Development)

---

## Issue Summary

We're experiencing database migration conflicts that are preventing new table creation and feature development. Multiple issues need to be resolved:

---

## Issue #1: OAuth Redirect URI Configuration

**Problem:** OAuth login redirects to Google Cloud Run domain instead of custom domain

**Current Behavior:**
- User logs in on `www.ologywood.com` (custom domain)
- OAuth redirects to: `https://www.owt235xr5v-ao67gphhqq-uk.a.run.app/api/oauth/callback`
- Mismatch causes login to fail

**Required Fix:**
Update OAuth 2.0 Client ID redirect URIs in Google Cloud Console:
- Remove: `https://www.owt235xr5v-ao67gphhqq-uk.a.run.app/api/oauth/callback`
- Add: `https://www.ologywood.com/api/oauth/callback`
- Add: `https://ologywood.com/api/oauth/callback` (without www)

---

## Issue #2: MIME Type Configuration for Static Files

**Problem:** Service worker and manifest files return HTML instead of correct MIME types

**Current Errors:**
```
Service Worker registration failed: The script has an unsupported MIME type ('text/html').
Manifest: Line: 1, column: 1, Syntax error.
```

**Required Fix:**
Configure server to serve static files with correct MIME types:
- `/sw.js` → `application/javascript`
- `/manifest.json` → `application/json`

---

## Issue #3: Database Migration Conflict (CRITICAL)

**Problem:** `pnpm db:push` fails with table already exists error

**Error Message:**
```
Error: Table 'mP6FLm6cHUyVdEMNViNuZS.rider_acknowledgments' already exists
  code: 'ER_TABLE_EXISTS_ERROR'
  errno: 1050
```

**What's Happening:**
- The `rider_acknowledgments` table exists in the database
- Drizzle ORM is trying to create it again during migration
- This blocks ALL new table creation (including our new `artist_follows` table)

**Required Fix:**
One of the following:
1. **Option A (Recommended):** Drop and recreate the `rider_acknowledgments` table to sync with current schema
2. **Option B:** Remove the conflicting migration from Drizzle's migration history
3. **Option C:** Manually sync the database schema with the Drizzle schema

**Impact:** This is blocking development of the Artist Following feature (Phase 2+)

---

## Issue #4: TRPC Endpoint Configuration

**Problem:** Some TRPC endpoints are defined ambiguously (both query and mutation)

**Affected Endpoints:**
- `favorite.getMyFavorites` - Defined as query but TypeScript treats it as both query and mutation
- `auth.me` - Similar issue

**Workaround:** Currently disabled in UI, but should be fixed in backend

---

## Summary of Required Actions

| Issue | Priority | Action | Estimated Time |
|-------|----------|--------|-----------------|
| OAuth Redirect URI | High | Update Google Cloud Console | 5 min |
| MIME Type Configuration | Medium | Configure server | 5 min |
| Database Migration Conflict | Critical | Resolve table conflict | 15 min |
| TRPC Endpoint Definitions | Low | Review backend routing | 10 min |

---

## Contact Information

**Project:** Ologywood  
**Domain:** www.ologywood.com  
**Database:** mP6FLm6cHUyVdEMNViNuZS  
**Issue Date:** February 19, 2026

---

## What We're Trying to Do

We're implementing an Artist Following feature that requires:
1. Creating a new `artist_follows` table
2. Adding API endpoints for follow/unfollow functionality
3. Building UI components for the feature

The database migration conflict is blocking step 1, which prevents the entire feature from being implemented.

---

## Requested Timeline

- **Immediate:** Fix OAuth redirect URI (blocking user login)
- **Today:** Fix MIME type configuration (blocking PWA features)
- **Today:** Fix database migration conflict (blocking feature development)
- **Optional:** Fix TRPC endpoint definitions (quality improvement)

---

## Additional Notes

- The platform is otherwise stable (100% test pass rate, zero critical bugs)
- All code changes are ready and tested
- Just waiting on infrastructure configuration fixes
- No data loss or security concerns

---

**Please confirm receipt and estimated resolution time for each issue.**
