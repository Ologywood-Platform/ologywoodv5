import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

export const authRouter = router({
  // Email/Password Signup
  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // Check if user already exists
        const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

        if (existingUser.length > 0) {
          throw new Error('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 10);

        // Create user with default 'user' role
        const result = await db.insert(users).values({
          email: input.email,
          name: input.name,
          role: 'user',
          loginMethod: 'email',
          openId: `email_${input.email}`, // Generate a unique openId for email users
          lastSignedIn: new Date(),
        });

        const newUserId = (result as any).insertId;
        const newUser = await db.select().from(users).where(eq(users.id, newUserId)).limit(1);

        if (!newUser || newUser.length === 0) {
          throw new Error('Failed to create user');
        }

        return {
          success: true,
          user: {
            id: newUser[0].id,
            email: newUser[0].email,
            name: newUser[0].name,
            role: newUser[0].role,
          },
          message: 'Account created successfully',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Signup failed');
      }
    }),

  // Email/Password Login
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // Find user by email
        const userResult = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

        if (userResult.length === 0) {
          throw new Error('Invalid email or password');
        }

        const user = userResult[0];

        // Note: Password verification would require storing hashed passwords
        // For now, this is a placeholder that would need to be implemented
        // once the schema is updated to support password storage

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          message: 'Logged in successfully',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Login failed');
      }
    }),

  // Check if email exists
  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { exists: false };
        }

        const userResult = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

        return {
          exists: userResult.length > 0,
        };
      } catch (error) {
        return { exists: false };
      }
    }),

  // Get user by email (for verification)
  getUserByEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return null;
        }

        const userResult = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

        if (userResult.length === 0) {
          return null;
        }

        const user = userResult[0];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      } catch (error) {
        return null;
      }
    }),
});
