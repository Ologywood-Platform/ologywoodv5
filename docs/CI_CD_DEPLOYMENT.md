# CI/CD & Deployment Guide

**Last Updated:** March 13, 2026

---

## Overview

Ologywood is hosted on the **Manus Platform**, which provides built-in deployment, SSL, custom domains, and rollback capabilities. The platform does not use Docker, Kubernetes, or GitHub Actions for deployment. All deployments are checkpoint-based through the Manus Management UI.

---

## Deployment Architecture

```
Developer → Save Checkpoint → Publish (Manus UI) → Production
                                                        │
                                                        ▼
                                              www.ologywood.com
                                              (SSL, CDN, auto-scaling)
```

The Manus platform handles:
- Build process (Vite frontend + esbuild server bundle)
- SSL certificate provisioning and renewal
- Custom domain management
- Environment variable injection
- Automatic scaling
- Health monitoring

---

## Deployment Workflow

### Pre-Deployment Checklist

Before deploying, verify the following:

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript compiles | `pnpm check` | 0 errors |
| All tests pass | `pnpm test` | 1,864+ passing |
| No stale console.logs | `grep -rn "console.log" client/src/ server/` | Only essential logs |
| todo.md updated | Review `todo.md` | All completed items marked `[x]` |
| Database migrations applied | `pnpm db:push` | No pending changes |
| Schema matches production | Verify all 61 tables exist | No missing tables |

### Deployment Steps

1. **Verify locally** — Run `pnpm test` and `pnpm check`
2. **Save checkpoint** — In the Manus Management UI, or via the development workflow
3. **Review checkpoint** — The checkpoint captures a screenshot and full project state
4. **Publish** — Click the **Publish** button in the Management UI header

### Rollback

If a deployment introduces issues:

1. Open the Manus Management UI
2. Navigate to the **Dashboard** panel
3. Find the previous checkpoint
4. Click **Rollback** to restore that version

Each checkpoint is a complete snapshot of code, configuration, and dependencies.

---

## Build Process

The production build consists of two steps defined in `package.json`:

```bash
pnpm build
# Equivalent to:
# vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

**Frontend build (Vite):**
- Compiles React + TypeScript
- Bundles and tree-shakes with Rollup
- Outputs to `dist/public/`
- Generates hashed filenames for cache busting

**Server build (esbuild):**
- Bundles `server/_core/index.ts` and all imports
- Outputs to `dist/index.js`
- External node_modules are not bundled (resolved at runtime)

The production server runs with:

```bash
NODE_ENV=production node dist/index.js
```

---

## Environment Configuration

All environment variables are managed through **Settings > Secrets** in the Manus Management UI. Variables are automatically injected into both the development sandbox and production deployment.

### Current Environment Variables

| Variable | Purpose | Managed By |
|----------|---------|------------|
| `DATABASE_URL` | AWS RDS MySQL connection | Manus (auto) |
| `JWT_SECRET` | Session signing | Manus (auto) |
| `STRIPE_SECRET_KEY` | Stripe payments | Settings > Payment |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification | Settings > Payment |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe client key | Settings > Payment |
| `SENDGRID_API_KEY` | Email delivery | Settings > Secrets |
| `SENDGRID_FROM_EMAIL` | Sender address | Settings > Secrets |
| `AWS_ACCESS_KEY_ID` | S3 storage | Manus (auto) |
| `AWS_SECRET_ACCESS_KEY` | S3 storage | Manus (auto) |
| `AWS_REGION` | S3 region | Manus (auto) |
| `OAUTH_SERVER_URL` | OAuth server | Manus (auto) |
| `VITE_OAUTH_PORTAL_URL` | OAuth portal | Manus (auto) |
| `VITE_OAUTH_REDIRECT_BASE_URL` | OAuth callback | Manus (auto) |
| `BASE_URL` | Production URL | Manus (auto) |
| `OWNER_OPEN_ID` | Platform owner ID | Manus (auto) |
| `OWNER_NAME` | Platform owner name | Manus (auto) |

To add or update secrets, use the Manus Management UI **Settings > Secrets** panel.

---

## Database Migrations

The platform uses **Drizzle ORM** with a single schema file (`drizzle/schema.ts`) containing **61 tables**. Migrations are generated and applied via:

```bash
pnpm db:push    # drizzle-kit generate && drizzle-kit migrate
```

After running `pnpm db:push`, verify the migration was applied to the production database. If the `webdev_execute_sql` tool was used to create tables manually (as was done for `booking_disputes` and `role_change_audit_log`), ensure the drizzle migration state is synced by running `pnpm db:push` again.

### Migration Safety Rules

- Always test migrations in the development environment first
- Never run raw `DROP TABLE` or `DELETE FROM` without a backup
- Never edit generated SQL files in `drizzle/` manually
- After adding new enum values (like adding `blogger` to the role enum), verify the enum was updated on production

---

## Custom Domain

The production domain `www.ologywood.com` is configured in **Settings > Domains**. The Manus platform handles:

- DNS verification
- SSL certificate provisioning (automatic)
- HTTPS enforcement
- www/non-www redirect

Additional domains can be purchased or bound through the Domains settings panel.

---

## Health Monitoring

### Health Check Endpoint

```bash
curl https://www.ologywood.com/health
# Returns: { "status": "ok" }
```

### Monitoring via Management UI

The **Dashboard** panel in the Management UI provides:

- Uptime status
- Visibility controls (public/private)
- Analytics (UV/PV) for published sites
- Recent deployment history

---

## GitHub Integration

The project is connected to a GitHub repository via the `user_github` remote. Code syncing happens automatically:

- File writes and checkpoint saves trigger `git pull` and `git push` to the `main` branch
- Conflicts are detected and reported; they must be resolved manually
- The GitHub connection is configured in **Settings > GitHub** in the Management UI

### Syncing Changes

To sync the latest changes from GitHub, save a checkpoint. The checkpoint tool handles all git pull/push operations internally.

### Conflict Resolution

If a conflict is detected:
1. The operation is aborted and conflict details are shown
2. Merge code/structural changes logically to preserve both intentions
3. For content conflicts, confirm with the team which version to keep
4. Never overwrite remote changes without explicit confirmation

---

## Troubleshooting

### Deployment Fails

1. Check that `pnpm build` succeeds locally
2. Verify all environment variables are set in **Settings > Secrets**
3. Check for TypeScript errors with `pnpm check`
4. Review the dev server logs for runtime errors

### Database Connection Issues

1. Verify `DATABASE_URL` in **Settings > Secrets**
2. The connection uses SSL to AWS RDS — ensure SSL is enabled
3. Check the database connection info in **Database** panel (bottom-left settings)

### Stripe Webhook Issues

1. Check **Developers > Webhooks** in the Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint secret
3. The webhook endpoint is `POST /api/stripe/webhook`
4. Use test card `4242 4242 4242 4242` for testing

### Static Assets Not Loading

1. All static assets must be uploaded to S3 via `manus-upload-file --webdev`
2. Local files in the project directory may cause deployment timeouts
3. Reference assets by their CDN URL, not local paths

### Missing Tables on Production

If `pnpm db:push` reports "No schema changes" but tables are missing on production, create them manually via SQL. This can happen when the drizzle migration state is out of sync with the actual database. After manual creation, run `pnpm db:push` again to sync the state.

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](../ARCHITECTURE.md) | System architecture and folder structure |
| [API.md](./API.md) | API endpoint documentation |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Development setup and coding standards |
| [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) | Backup and recovery procedures |
| [ROADMAP.md](../ROADMAP.md) | Feature roadmap and completed work |
