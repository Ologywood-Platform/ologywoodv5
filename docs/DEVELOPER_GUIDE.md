# Ologywood Developer Guide

## Getting Started

Welcome to the Ologywood development team! This guide will help you set up your development environment and understand the project structure.

## Prerequisites

- Node.js 18+ (we use 22.13.0)
- pnpm 9+ (package manager)
- MySQL 8.0+
- Git

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ologywood/platform.git
cd ologywood
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env.local

# Edit with your local settings
nano .env.local
```

### 4. Database Setup

```bash
# Create local database
mysql -u root -p < scripts/init-db.sql

# Run migrations
pnpm db:push

# Seed test data (optional)
pnpm db:seed
```

### 5. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
ologywood/
├── client/                  # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components (routes)
│   │   ├── lib/            # Utility functions
│   │   └── App.tsx         # Main app component
│   └── index.html
├── server/                  # Backend (Node.js + Express)
│   ├── routers.ts          # TRPC route definitions
│   ├── db.ts               # Database functions
│   ├── auth.ts             # Authentication logic
│   ├── errorHandler.ts     # Error handling utilities
│   ├── cacheManager.ts     # Caching utilities
│   └── _core/
│       └── index.ts        # Server entry point
├── drizzle/                # Database schema & migrations
│   ├── schema.ts           # Drizzle ORM schema
│   └── migrations/         # SQL migration files
├── docs/                   # Documentation
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── vite.config.ts
```

## Development Workflow

### Creating a New Feature

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Update todo.md**
   ```bash
   # Add your feature to todo.md
   - [ ] Your new feature description
   ```

3. **Implement the feature**
   - Create database schema if needed
   - Create TRPC router endpoints
   - Create React components
   - Write tests

4. **Test locally**
   ```bash
   pnpm test
   pnpm tsc --noEmit
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

6. **Create pull request**
   - Link related issues
   - Describe changes
   - Request review

### Database Changes

1. **Update schema** (`drizzle/schema.ts`)
   ```typescript
   export const newTable = mysqlTable("new_table", {
     id: int("id").autoincrement().primaryKey(),
     // ... columns
   });
   ```

2. **Generate migration**
   ```bash
   pnpm db:generate
   ```

3. **Review migration** (`drizzle/migrations/`)

4. **Apply migration**
   ```bash
   pnpm db:push
   ```

5. **Update todo.md**
   ```bash
   - [x] Add new_table to database schema
   ```

### API Development

1. **Create TRPC router** (`server/routers.ts`)
   ```typescript
   export const appRouter = router({
     feature: router({
       create: protectedProcedure
         .input(z.object({ name: z.string() }))
         .mutation(async ({ input, ctx }) => {
           // Implementation
         }),
     }),
   });
   ```

2. **Create client hook** (`client/src/lib/trpc.ts`)
   ```typescript
   export const useCreateFeature = () => {
     return trpc.feature.create.useMutation();
   };
   ```

3. **Use in component**
   ```typescript
   const { mutate, isPending } = useCreateFeature();
   
   const handleCreate = () => {
     mutate({ name: 'test' });
   };
   ```

### Component Development

1. **Create component file** (`client/src/components/MyComponent.tsx`)
   ```typescript
   interface MyComponentProps {
     title: string;
     onAction?: () => void;
   }
   
   export function MyComponent({ title, onAction }: MyComponentProps) {
     return <div>{title}</div>;
   }
   ```

2. **Add to page** (`client/src/pages/MyPage.tsx`)
   ```typescript
   import { MyComponent } from '@/components/MyComponent';
   
   export default function MyPage() {
     return <MyComponent title="Hello" />;
   }
   ```

3. **Test component**
   ```bash
   pnpm test MyComponent.test.tsx
   ```

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test MyComponent.test.tsx

# Run tests in watch mode
pnpm test --watch

# Generate coverage report
pnpm test --coverage
```

### Integration Tests

```bash
# Test TRPC routers
pnpm test routers.test.ts

# Test database functions
pnpm test db.test.ts
```

### E2E Tests

```bash
# Run end-to-end tests
pnpm test:e2e

# Run specific E2E test
pnpm test:e2e booking.spec.ts
```

## Code Standards

### TypeScript

- Use strict mode
- Define interfaces for all objects
- Avoid `any` type
- Use proper error handling

```typescript
// Good
interface User {
  id: number;
  email: string;
  name: string;
}

function getUser(id: number): Promise<User | null> {
  // Implementation
}

// Bad
function getUser(id: any): any {
  // Implementation
}
```

### React Components

- Use functional components
- Use hooks for state management
- Memoize expensive computations
- Write descriptive prop types

```typescript
// Good
interface CardProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export const Card = memo(function Card({
  title,
  description,
  onAction,
}: CardProps) {
  return <div>{title}</div>;
});

// Bad
export function Card(props: any) {
  return <div>{props.title}</div>;
}
```

### Database Functions

- Use try-catch for error handling
- Return typed results
- Add JSDoc comments
- Validate inputs

```typescript
// Good
/**
 * Get user by ID
 * @param userId - The user ID
 * @returns User or undefined if not found
 */
export async function getUserById(userId: number): Promise<User | undefined> {
  if (userId <= 0) {
    throw new Error('Invalid user ID');
  }
  
  try {
    const result = await db.select().from(users).where(eq(users.id, userId));
    return result[0];
  } catch (error) {
    logger.error('Error fetching user', error);
    throw error;
  }
}
```

## Debugging

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
3. Set breakpoints in code
4. Reload page to hit breakpoints

### Server Debugging

```bash
# Run with Node debugger
node --inspect-brk server/_core/index.ts

# Open chrome://inspect in Chrome
```

## Performance Optimization

### Frontend

- Use React DevTools Profiler
- Lazy load components
- Optimize images
- Minimize bundle size

```bash
# Analyze bundle
pnpm build --analyze
```

### Backend

- Use database indexes
- Implement caching
- Optimize queries
- Monitor slow endpoints

```bash
# Profile server
pnpm dev --profile
```

## Troubleshooting

### Common Issues

**Port 3000 already in use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Database connection error**
```bash
# Check MySQL status
mysql -u root -p -e "SELECT 1"

# Check DATABASE_URL in .env.local
```

**Module not found**
```bash
# Reinstall dependencies
rm -rf node_modules
pnpm install
```

**TypeScript errors**
```bash
# Check types
pnpm tsc --noEmit

# Fix errors
pnpm tsc --noEmit --pretty
```

## Git Workflow

### Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: update dependencies
```

### Branch Naming

```
feature/feature-name
bugfix/bug-name
docs/documentation-name
refactor/refactor-name
```

### Pull Request Process

1. Create feature branch
2. Make changes
3. Write tests
4. Update documentation
5. Create pull request
6. Request review
7. Address feedback
8. Merge to main

## Resources

- [TRPC Documentation](https://trpc.io)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)

## Getting Help

- Check existing issues and documentation
- Ask in team Slack channel
- Create GitHub issue with details
- Contact tech lead for guidance

## Code Review Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guide
- [ ] Tests are written and passing
- [ ] No console.log statements
- [ ] TypeScript compiles without errors
- [ ] Database migrations are included
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] No breaking changes (unless approved)

---

Happy coding! 🚀
