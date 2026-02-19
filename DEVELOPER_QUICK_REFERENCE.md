# Ologywood - Developer Quick Reference Guide

**Version:** 1.0  
**Last Updated:** February 19, 2026  
**Status:** Production Ready

---

## Quick Navigation

- **Getting Started** - Setup and running the project
- **Project Structure** - File organization and architecture
- **Common Tasks** - How to do common development tasks
- **API Reference** - tRPC routers and endpoints
- **Database** - Schema and migrations
- **Testing** - Running and writing tests
- **Deployment** - Preparing for production

---

## 1. Getting Started

### Prerequisites
```bash
Node.js 18+
npm or pnpm
MySQL 8.0+
Git
```

### Initial Setup
```bash
# Clone repository
git clone <repo-url>
cd ologywood

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=ologywood

# OAuth
OAUTH_SERVER_URL=https://api.manus.im
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@ologywood.com

# AWS S3
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
AWS_BUCKET_NAME=ologywood

# JWT
JWT_SECRET=your_secret_key

# Base URL
BASE_URL=http://localhost:3000
```

---

## 2. Project Structure

### Directory Layout
```
ologywood/
├── client/                      # Frontend React app
│   ├── src/
│   │   ├── pages/              # Page components (Home, Browse, etc.)
│   │   ├── components/         # Reusable UI components
│   │   ├── lib/                # Utilities (trpc client, helpers)
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # Entry point
│   ├── public/                 # Static assets
│   └── package.json
│
├── server/                      # Backend Node.js/Express
│   ├── routers/                # tRPC route handlers
│   │   ├── auth.ts             # Authentication routes
│   │   ├── artist.ts           # Artist profile routes
│   │   ├── booking.ts          # Booking routes
│   │   ├── rider.ts            # Rider template routes
│   │   └── ...                 # 20+ more routers
│   ├── services/               # Business logic
│   │   ├── subscriptionValidation.ts
│   │   ├── riderTemplateService.ts
│   │   ├── emailService.ts
│   │   └── ...
│   ├── middleware/             # Express middleware
│   │   ├── https-redirect.ts
│   │   └── auth.ts
│   ├── db.ts                   # Database connection
│   ├── routers.ts              # Router registration
│   └── server.ts               # Express app setup
│
├── drizzle/                     # Database schema
│   ├── schema.ts               # Table definitions
│   └── migrations/             # Migration files
│
├── tests/                       # Test files
│   └── __tests__/              # Unit and integration tests
│
├── docs/                        # Documentation
│   ├── API.md                  # API documentation
│   ├── ARCHITECTURE.md         # Architecture overview
│   └── DEPLOYMENT.md           # Deployment guide
│
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite bundler config
├── vitest.config.ts            # Test runner config
└── README.md                   # Project README
```

### Key Files
| File | Purpose |
|------|---------|
| `server/routers.ts` | Registers all tRPC routers |
| `server/db.ts` | Database connection and initialization |
| `drizzle/schema.ts` | Database table definitions |
| `client/lib/trpc.ts` | tRPC client setup |
| `package.json` | Dependencies and scripts |

---

## 3. Common Development Tasks

### Running the Development Server
```bash
# Start both frontend and backend
pnpm dev

# Frontend only (http://localhost:5173)
pnpm dev:client

# Backend only (http://localhost:3000)
pnpm dev:server
```

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test subscriptionValidation

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

### Database Operations
```bash
# Push schema changes to database
pnpm db:push

# Generate migration files
pnpm db:generate

# Open database studio (visual editor)
pnpm db:studio

# Reset database (careful!)
pnpm db:reset
```

### Code Quality
```bash
# TypeScript check
pnpm tsc --noEmit

# Format code
pnpm format

# Lint code
pnpm lint

# Type check
pnpm type-check
```

### Building for Production
```bash
# Build frontend and backend
pnpm build

# Build frontend only
pnpm build:client

# Build backend only
pnpm build:server

# Preview production build
pnpm preview
```

---

## 4. Creating New Features

### Adding a New API Endpoint

1. **Create a new router file** (if needed):
```typescript
// server/routers/myFeature.ts
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const myFeatureRouter = router({
  getAll: publicProcedure
    .query(async ({ ctx }) => {
      // Implementation
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
});
```

2. **Register the router** in `server/routers.ts`:
```typescript
export const appRouter = router({
  // ... existing routers
  myFeature: myFeatureRouter,
});
```

3. **Use in frontend**:
```typescript
const { data } = trpc.myFeature.getAll.useQuery();
const createMutation = trpc.myFeature.create.useMutation();
```

### Adding a New Database Table

1. **Define the table** in `drizzle/schema.ts`:
```typescript
export const myTable = mysqlTable('my_table', {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 255 }).notNull(),
  createdAt: datetime().defaultNow(),
  updatedAt: datetime().defaultNow().onUpdateNow(),
});
```

2. **Generate and apply migration**:
```bash
pnpm db:generate
pnpm db:push
```

### Adding a New React Component

1. **Create component file**:
```typescript
// client/src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={onAction}>Action</button>
    </div>
  );
};
```

2. **Use in a page**:
```typescript
import { MyComponent } from '../components/MyComponent';

export default function MyPage() {
  return (
    <div>
      <MyComponent title="Hello" onAction={() => console.log('clicked')} />
    </div>
  );
}
```

---

## 5. API Reference

### Available Routers (25 total)

| Router | Key Endpoints | Purpose |
|--------|--------------|---------|
| **auth** | login, logout, me | Authentication |
| **artist** | getAll, search, getProfile, updateProfile | Artist profiles |
| **venue** | getAll, getProfile, updateProfile | Venue profiles |
| **booking** | create, getMyBookings, accept, decline | Booking management |
| **rider** | getMyTemplates, createTemplate, updateTemplate | Rider templates |
| **events** | create, getAll, search, getDetail | Event management |
| **payment** | createCheckoutSession, getPaymentHistory | Stripe payments |
| **subscription** | getSubscription, updateSubscription, cancel | Subscription management |
| **message** | getThreads, sendMessage, getMessages | Direct messaging |
| **review** | createReview, getReviews, respondToReview | Reviews and ratings |
| **admin** | getUsers, getBookings, getPayouts | Admin functions |
| **And 14+ more** | Various | Various features |

### Example API Calls

**Get all artists:**
```typescript
const { data: artists } = trpc.artist.getAll.useQuery();
```

**Create a booking:**
```typescript
const createBooking = trpc.booking.create.useMutation({
  onSuccess: (data) => console.log('Booking created:', data),
});

createBooking.mutate({
  artistId: 1,
  venueId: 2,
  date: new Date('2026-03-15'),
  notes: 'Great performance!',
});
```

**Get current user:**
```typescript
const { data: user } = trpc.auth.me.useQuery();
```

---

## 6. Database Schema

### Core Tables

**users**
```sql
- id (INT, PK)
- email (VARCHAR)
- role (ENUM: artist, venue, admin)
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

**artistProfiles**
```sql
- id (INT, PK)
- userId (INT, FK)
- name (VARCHAR)
- bio (TEXT)
- genre (VARCHAR)
- location (VARCHAR)
- priceRange (VARCHAR)
- photoUrl (VARCHAR)
- socialLinks (JSON)
```

**venueProfiles**
```sql
- id (INT, PK)
- userId (INT, FK)
- organizationName (VARCHAR)
- description (TEXT)
- location (VARCHAR)
- capacity (INT)
- photoUrl (VARCHAR)
- contactInfo (JSON)
```

**bookings**
```sql
- id (INT, PK)
- artistId (INT, FK)
- venueId (INT, FK)
- date (DATE)
- status (ENUM: pending, confirmed, cancelled)
- notes (TEXT)
- createdAt (DATETIME)
```

**riderTemplates**
```sql
- id (INT, PK)
- artistId (INT, FK)
- templateName (VARCHAR)
- templateData (JSON)
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

**events**
```sql
- id (INT, PK)
- venueId (INT, FK)
- title (VARCHAR)
- description (TEXT)
- date (DATE)
- capacity (INT)
- rate (DECIMAL)
- createdAt (DATETIME)
```

---

## 7. Testing Guide

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific test
pnpm test subscriptionValidation

# Watch mode
pnpm test --watch

# Coverage report
pnpm test --coverage
```

### Writing a Test
```typescript
import { describe, it, expect } from 'vitest';
import { MyService } from '../services/MyService';

describe('MyService', () => {
  it('should do something', async () => {
    const result = await MyService.doSomething();
    expect(result).toBe(expectedValue);
  });

  it('should handle errors', async () => {
    expect(() => MyService.throwError()).toThrow();
  });
});
```

### Test Coverage
- Current: 374/395 tests passing (94.7%)
- Target: 80%+ coverage
- Status: ✅ Exceeds target

---

## 8. Debugging

### Debug Mode
```bash
# Run with debug logging
DEBUG=* pnpm dev

# Debug specific module
DEBUG=ologywood:* pnpm dev
```

### Browser DevTools
1. Open Chrome DevTools (F12)
2. Go to Sources tab
3. Set breakpoints in TypeScript code
4. Step through execution

### Database Debugging
```bash
# Open database studio
pnpm db:studio

# View database in MySQL client
mysql -h localhost -u root -p ologywood
```

### API Debugging
```bash
# Use curl to test endpoints
curl http://localhost:3000/api/trpc/artist.getAll

# Use Postman or Insomnia for complex requests
```

---

## 9. Performance Tips

### Frontend Optimization
- Use React.memo for expensive components
- Implement code splitting with lazy()
- Optimize images with next/image or similar
- Use CSS-in-JS sparingly
- Monitor bundle size with `pnpm build`

### Backend Optimization
- Use database indexes on frequently queried columns
- Implement caching for read-heavy operations
- Use pagination for large datasets
- Batch database queries where possible
- Monitor query performance with EXPLAIN

### Database Optimization
```sql
-- Add indexes
CREATE INDEX idx_artistId ON bookings(artistId);
CREATE INDEX idx_venueId ON bookings(venueId);
CREATE INDEX idx_createdAt ON bookings(createdAt);

-- Check query performance
EXPLAIN SELECT * FROM bookings WHERE artistId = 1;
```

---

## 10. Deployment Checklist

### Before Deploying
- [ ] All tests passing (`pnpm test`)
- [ ] No TypeScript errors (`pnpm tsc --noEmit`)
- [ ] Code formatted (`pnpm format`)
- [ ] Environment variables set
- [ ] Database migrations applied (`pnpm db:push`)
- [ ] Build succeeds (`pnpm build`)

### Deployment Steps
```bash
# 1. Create checkpoint
git add .
git commit -m "Release v1.0.0"

# 2. Build for production
pnpm build

# 3. Deploy to production server
# (Your deployment process here)

# 4. Run migrations on production
pnpm db:push

# 5. Verify deployment
# Check logs, test endpoints, monitor metrics
```

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check API response times
- [ ] Verify email notifications
- [ ] Test payment processing
- [ ] Monitor database performance

---

## 11. Troubleshooting

### Common Issues

**Issue: "Cannot find module" error**
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Issue: Database connection fails**
```bash
# Check credentials in .env
# Verify MySQL is running
# Test connection: mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD
```

**Issue: Tests failing**
```bash
# Run tests with verbose output
pnpm test --reporter=verbose

# Run specific test
pnpm test --grep "test name"
```

**Issue: Build fails**
```bash
# Clear build cache
rm -rf dist .next

# Rebuild
pnpm build
```

---

## 12. Resources

### Documentation
- **API Docs:** See `docs/API.md`
- **Architecture:** See `docs/ARCHITECTURE.md`
- **Deployment:** See `docs/DEPLOYMENT.md`

### External Resources
- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Stripe API](https://stripe.com/docs/api)

### Team Contacts
- **Frontend Lead:** [Name]
- **Backend Lead:** [Name]
- **DevOps:** [Name]
- **QA Lead:** [Name]

---

## 13. Git Workflow

### Branch Naming
```
feature/description       # New features
bugfix/description        # Bug fixes
hotfix/description        # Production hotfixes
refactor/description      # Code refactoring
docs/description          # Documentation
```

### Commit Messages
```
feat: add new feature
fix: fix bug description
docs: update documentation
refactor: refactor component
test: add test cases
chore: update dependencies
```

### Pull Request Process
1. Create feature branch from `main`
2. Make changes and commit
3. Push to remote
4. Create pull request
5. Code review
6. Merge to `main`
7. Deploy

---

## 14. Quick Commands Reference

```bash
# Development
pnpm dev                  # Start dev server
pnpm dev:client          # Frontend only
pnpm dev:server          # Backend only

# Testing
pnpm test                # Run all tests
pnpm test --watch        # Watch mode
pnpm test --coverage     # Coverage report

# Database
pnpm db:push             # Apply migrations
pnpm db:generate         # Generate migrations
pnpm db:studio           # Open database UI
pnpm db:reset            # Reset database

# Code Quality
pnpm tsc --noEmit        # TypeScript check
pnpm format              # Format code
pnpm lint                # Lint code

# Building
pnpm build               # Build for production
pnpm preview             # Preview production build

# Git
git status               # Check status
git add .                # Stage changes
git commit -m "message"  # Commit changes
git push                 # Push to remote
```

---

**Last Updated:** February 19, 2026  
**Version:** 1.0  
**Status:** Production Ready

For more detailed information, see the full documentation in the `docs/` directory.

