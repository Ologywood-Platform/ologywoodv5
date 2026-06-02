# Ologywood Developer Guide

**Last Updated:** March 13, 2026

This guide covers environment setup, development workflows, coding standards, and troubleshooting for the Ologywood platform. For system architecture and folder structure details, see [ARCHITECTURE.md](../ARCHITECTURE.md).

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 22.x | Runtime (we use 22.13.0) |
| pnpm | 9+ | Package manager |
| Git | 2.x+ | Version control |
| MySQL client | 8.0+ | For local database inspection only; production DB is AWS RDS |

You do **not** need a local MySQL server. The development environment connects to the shared AWS RDS database via the `DATABASE_URL` environment variable.

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ologywood
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Environment variables are managed through the Manus platform. In the Manus Management UI, go to **Settings > Secrets** to view and configure all required environment variables. The following are automatically injected at runtime:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | AWS RDS MySQL connection string |
| `JWT_SECRET` | Session signing key |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe client key |
| `SENDGRID_API_KEY` | Email delivery |
| `SENDGRID_FROM_EMAIL` | Sender email address |
| `AWS_ACCESS_KEY_ID` | S3 storage access |
| `AWS_SECRET_ACCESS_KEY` | S3 storage secret |
| `AWS_REGION` | S3 region |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `SPOTIFY_CLIENT_ID` | Spotify OAuth client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify OAuth client secret |
| `BASE_URL` | Production URL (https://www.ologywood.com) |
| `OWNER_OPEN_ID` | Platform owner identification |
| `OWNER_NAME` | Platform owner name (fallback) |

No `.env` file is needed when developing in the Manus sandbox. All secrets are injected automatically.

### 4. Database Migrations

```bash
# Generate and apply any pending migrations
pnpm db:push
```

This runs `drizzle-kit generate && drizzle-kit migrate` under the hood. The schema is defined in `drizzle/schema.ts` and contains **61 tables**.

### 5. Start Development Server

```bash
pnpm dev
```

The application starts at `http://localhost:3000` with hot module replacement enabled via Vite.

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `pnpm dev` | `NODE_ENV=development tsx watch server/_core/index.ts` | Start dev server with HMR |
| `pnpm build` | `vite build && esbuild ...` | Production build (client + server) |
| `pnpm start` | `NODE_ENV=production node dist/index.js` | Run production server |
| `pnpm check` | `tsc --noEmit` | TypeScript type checking |
| `pnpm test` | `vitest run` | Run all tests |
| `pnpm db:push` | `drizzle-kit generate && drizzle-kit migrate` | Generate and apply DB migrations |

---

## Development Workflow

### Adding a New Feature

Follow this sequence to keep the codebase consistent. See [ARCHITECTURE.md](../ARCHITECTURE.md) for detailed folder rules.

**Step 1: Track in todo.md**

Add the feature as unchecked items in `todo.md` before writing any code:

```markdown
## MY NEW FEATURE
- [ ] Add database table for feature
- [ ] Create backend API endpoints
- [ ] Build frontend page
- [ ] Write tests
```

**Step 2: Database (if needed)**

Edit `drizzle/schema.ts` to add your table, then apply:

```bash
pnpm db:push
```

Add query functions to `server/db.ts`. All database access goes through this single file.

**Step 3: Backend API**

For a new domain, create a dedicated router file:

```typescript
// server/routers/myFeature.ts
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";

export const myFeatureRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    // Call functions from db.ts
  }),
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Implementation
    }),
});
```

Register it in `server/routers.ts`:

```typescript
import { myFeatureRouter } from "./routers/myFeature";

export const appRouter = router({
  // ... existing routers
  myFeature: myFeatureRouter,
});
```

For complex business logic, create a service file in `server/services/`.

**Step 4: Frontend**

Create a page component in `client/src/pages/`:

```typescript
// client/src/pages/MyFeature.tsx
import { trpc } from "@/lib/trpc";

export default function MyFeature() {
  const { data, isLoading } = trpc.myFeature.getAll.useQuery();
  // Render UI
}
```

Add the route in `client/src/App.tsx`:

```typescript
<Route path="/my-feature" element={<MyFeature />} />
```

**Step 5: Tests**

Write vitest tests alongside the feature. Test files live in the `server/` directory:

```bash
npx vitest run myFeature    # Run tests matching "myFeature"
```

**Step 6: Mark Complete**

Update `todo.md` to mark items as `[x]` when done.

### Database Changes

The schema lives in a single file: `drizzle/schema.ts`. All **61 tables** are defined here.

```typescript
// Example: adding a new table
export const myTable = mysqlTable("my_table", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: int("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});
```

After editing the schema:

```bash
pnpm db:push    # Generates migration SQL and applies it
```

Never edit the generated SQL files in `drizzle/` manually.

---

## User Roles

The platform has six user roles. Role-based access is enforced at the tRPC middleware level.

| Role | Database Value | Access |
|------|---------------|--------|
| Owner | `admin` (identified by email) | Full platform access, cannot be demoted |
| Admin | `admin` | Admin dashboard, user management, all features |
| Blogger | `blogger` | Blog post CRUD via Blogger Dashboard, no admin access |
| Artist | `artist` | Artist dashboard, profile, bookings, riders, releases |
| Venue | `venue` | Venue dashboard, booking requests, payments |
| User | `user` | Browse, follow, client bookings, purchase music |

The owner is identified by email address (`garychisolm30@gmail.com`) with fallback to `OWNER_OPEN_ID` and `OWNER_NAME` environment variables.

---

## Testing

The project uses **Vitest** for all testing. As of March 13, 2026, there are **1,864 passing tests** across **54 test files**.

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
npx vitest run server/routers/rider.test.ts

# Run tests matching a pattern
npx vitest run --reporter=verbose myFeature

# Run only server tests
npx vitest run server

# Watch mode (re-runs on file change)
npx vitest --watch
```

### Test Organization

Tests are co-located with the code they test in the `server/` directory:

```
server/routers/rider.test.ts          # Tests for rider router
server/services/emailService.test.ts   # Tests for email service
server/admin-changeRole.test.ts        # Tests for role management
server/audit-log.test.ts               # Tests for audit log
server/blogger-role.test.ts            # Tests for blogger role
```

### Writing Tests

```typescript
import { describe, it, expect, vi } from "vitest";

describe("MyFeature", () => {
  it("should create a new item", async () => {
    // Arrange
    const input = { name: "Test" };
    
    // Act
    const result = await createItem(input);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.name).toBe("Test");
  });
});
```

---

## Code Standards

### TypeScript

The project compiles with **zero TypeScript errors** in strict mode. Maintain this standard.

| Rule | Guidance |
|------|----------|
| No `any` types | Use proper interfaces or `unknown` |
| Strict null checks | Handle `null` and `undefined` explicitly |
| Return types | Let TypeScript infer where possible; annotate public APIs |
| Error handling | Use try-catch in db functions; use tRPC error codes in routers |

### React Components

| Rule | Guidance |
|------|----------|
| Functional components only | No class components |
| Props interfaces | Define `interface XProps` for every component |
| Hooks for state | Use `useState`, `useEffect`, tRPC hooks |
| shadcn/ui primitives | Use components from `components/ui/` — do not modify these |
| Import paths | Use `@/` alias for `client/src/` imports |

### Database Functions

All database queries are centralized in `server/db.ts`:

| Rule | Guidance |
|------|----------|
| Single file | All queries in `db.ts` — no scattered database calls |
| Error handling | Wrap in try-catch, log with `logger.error()` |
| Return types | Use Drizzle's inferred types |
| Input validation | Validate at the router level with Zod, not in db functions |

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files (pages) | PascalCase | `ArtistProfile.tsx` |
| Files (server) | camelCase | `emailService.ts` |
| Database tables | snake_case | `artist_profiles` |
| tRPC procedures | camelCase | `getMyProfile` |
| React components | PascalCase | `FollowButton` |
| CSS classes | Tailwind utilities | `className="flex items-center gap-2"` |

---

## Key Patterns

### Authentication

The platform uses Manus OAuth and email/password authentication. The `useAuth()` hook provides the current user:

```typescript
import { useAuth } from "@/_core/hooks/useAuth";

function MyComponent() {
  const { user, isLoading } = useAuth();
  
  if (!user) return <p>Please sign in</p>;
  return <p>Hello, {user.name}</p>;
}
```

On the server, `ctx.user` is available in protected procedures:

```typescript
create: protectedProcedure.mutation(async ({ ctx }) => {
  const userId = ctx.user.id;
  // ...
});
```

### Role-Based Access

Use middleware for role checks:

```typescript
// Admin only
myProcedure: adminOnly.query(async ({ ctx }) => { ... });

// Blog access (admin or blogger)
myProcedure: blogAccess.query(async ({ ctx }) => { ... });

// Custom role check
myProcedure: protectedProcedure.query(async ({ ctx }) => {
  if (ctx.user.role !== "artist") throw new TRPCError({ code: "FORBIDDEN" });
});
```

### Subscription Tier Gating

Use the pricing service to check feature access:

```typescript
import { pricingTierService } from "../services/pricingTierService";

const hasAccess = await pricingTierService.hasFeature(userId, "riderBuilder");
if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });
```

### Email Sending

All emails go through `emailService.ts`, which automatically checks user preferences:

```typescript
import { sendBookingConfirmation } from "../services/emailService";

await sendBookingConfirmation(booking, artist, venue);
```

### File Uploads

Files are stored in S3 via the storage helpers:

```typescript
import { storagePut, storageGet } from "../storage";

// Upload
const { key, url } = await storagePut("profiles/photo.jpg", buffer, "image/jpeg");

// Get presigned URL
const { url } = await storageGet("profiles/photo.jpg");
```

---

## Deployment

Ologywood is hosted on the **Manus Platform**. There is no Docker, Kubernetes, or self-hosted infrastructure.

### How to Deploy

1. Make your changes and verify tests pass (`pnpm test`)
2. Verify TypeScript compiles (`pnpm check`)
3. Save a checkpoint in the Manus Management UI
4. Click **Publish** in the Management UI header

### Rollback

Use the Manus Management UI to roll back to any previous checkpoint. Each checkpoint captures the full project state.

### Custom Domain

The production domain `www.ologywood.com` is configured in **Settings > Domains** in the Management UI. SSL is handled automatically.

---

## Troubleshooting

### Dev Server Won't Start

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill the process
kill -9 <PID>

# Restart
pnpm dev
```

### Database Connection Error

Verify `DATABASE_URL` is set in the Manus Management UI under **Settings > Secrets**. The connection uses SSL to AWS RDS.

### TypeScript Errors

```bash
# Check all types
pnpm check

# See detailed errors
npx tsc --noEmit --pretty
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules
pnpm install
```

### Tests Failing

```bash
# Run with verbose output
npx vitest run --reporter=verbose

# Run a single test file
npx vitest run path/to/test.ts
```

### Stripe Webhook Issues

Check the Stripe Dashboard under **Developers > Webhooks** for event delivery logs. The webhook endpoint is `/api/stripe/webhook`. Use test card `4242 4242 4242 4242` for testing.

---

## Git Workflow

### Commit Messages

Follow conventional commits:

```
feat: add fan email export feature
fix: resolve booking status update race condition
docs: update API documentation
test: add rider contract signing tests
refactor: simplify dashboard layout
```

### Branch Strategy

The project uses a single `main` branch with checkpoint-based deployment through Manus. Feature branches are optional for larger changes.

### Code Review Checklist

Before submitting changes, verify:

| Check | Command |
|-------|---------|
| TypeScript compiles | `pnpm check` |
| All tests pass | `pnpm test` |
| No console.log statements | `grep -rn "console.log" client/src/ server/` |
| todo.md updated | Mark completed items as `[x]` |
| Documentation updated | Update relevant docs if behavior changed |

---

## Resources

| Resource | URL |
|----------|-----|
| tRPC Documentation | [trpc.io](https://trpc.io) |
| React Documentation | [react.dev](https://react.dev) |
| Drizzle ORM | [orm.drizzle.team](https://orm.drizzle.team) |
| Tailwind CSS | [tailwindcss.com](https://tailwindcss.com) |
| Vitest | [vitest.dev](https://vitest.dev) |
| Stripe API | [stripe.com/docs](https://stripe.com/docs) |
| SendGrid API | [docs.sendgrid.com](https://docs.sendgrid.com) |

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](../ARCHITECTURE.md) | System architecture, folder structure, data flow, module boundaries |
| [API.md](./API.md) | Complete API endpoint documentation |
| [CI_CD_DEPLOYMENT.md](./CI_CD_DEPLOYMENT.md) | Deployment and CI/CD procedures |
| [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) | Backup and recovery procedures |
| [ROADMAP.md](../ROADMAP.md) | Feature roadmap and completed work |
| [todo.md](../todo.md) | Feature tracking — single source of truth |
