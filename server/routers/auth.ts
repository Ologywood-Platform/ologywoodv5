import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { emailConfirmationService } from '../services/emailConfirmationService';
import { sdk } from '../_core/sdk';
import { getSessionCookieOptions } from '../_core/cookies';
import { COOKIE_NAME, ONE_YEAR_MS } from '@shared/const';
import { FreeTrialService } from '../services/freeTrialService';
import { getUserSubscription, setTrialForBetaUser } from '../services/pricingTierService';
import { TRPCError } from '@trpc/server';
import { signupLimiter, loginLimiter, resendEmailLimiter } from '../utils/rateLimiter';

/** Extract client IP from tRPC context */
function getClientIp(ctx: any): string {
  return ctx.req?.headers?.['x-forwarded-for']?.toString()?.split(',')[0]?.trim()
    || ctx.req?.socket?.remoteAddress || 'unknown';
}

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
  // Verify email confirmation token
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = emailConfirmationService.verifyConfirmationToken(input.token);

        if (!result.valid) {
          throw new Error('Invalid or expired confirmation token');
        }

        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // Update user to mark email as verified
        await db.update(users).set({
          emailVerified: true,
          lastSignedIn: new Date(),
        }).where(eq(users.id, result.userId!));

        return {
          success: true,
          message: 'Email verified successfully',
          email: result.email,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Email verification failed');
      }
    }),

  // Resend confirmation email
  resendConfirmationEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      // Rate limit: 3 resend attempts per 15 min per IP
      const ipCheck = resendEmailLimiter.check(`ip:${getClientIp(ctx)}`);
      if (!ipCheck.allowed) {
        const retryMinutes = Math.ceil(ipCheck.retryAfterMs / 60_000);
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Too many resend attempts. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
        });
      }
      // Rate limit by email too
      const emailCheck = resendEmailLimiter.check(`email:${input.email.toLowerCase()}`);
      if (!emailCheck.allowed) {
        const retryMinutes = Math.ceil(emailCheck.retryAfterMs / 60_000);
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Confirmation email was already sent recently. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
        });
      }
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        const userResult = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

        if (userResult.length === 0) {
          throw new Error('User not found');
        }

        const user = userResult[0];

        // Check if already verified
        if (user?.emailVerified) {
          return {
            success: false,
            message: 'Email is already verified',
          };
        }

        const token = emailConfirmationService.generateConfirmationToken(input.email, user.id);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

        await emailConfirmationService.sendResendConfirmationEmail({
          recipientEmail: input.email,
          recipientName: user.name || 'User',
          verificationLink,
          expiresIn: '24 hours',
        });

        return {
          success: true,
          message: 'Confirmation email sent successfully',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to resend confirmation email');
      }
    }),

  // Email/Password Signup
  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ input, ctx }) => {
      // Rate limit: 5 signup attempts per 15 min per IP
      const ipCheck = signupLimiter.check(`ip:${getClientIp(ctx)}`);
      if (!ipCheck.allowed) {
        const retryMinutes = Math.ceil(ipCheck.retryAfterMs / 60_000);
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Too many signup attempts. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
        });
      }
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // Check if user already exists by email
        const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

        if (existingUser.length > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'An account with this email already exists. Please log in instead.',
          });
        }

        // Check if there's an existing OAuth user without an email that should be linked
        // This handles the case where a user signed up via Manus OAuth (which doesn't store email)
        // and now wants to add email/password login to their existing account
        const oauthUserToLink = await db.select().from(users).where(
          and(
            sql`${users.email} IS NULL`,
            eq(users.openId, process.env.OWNER_OPEN_ID || '__none__')
          )
        ).limit(1);

        // Also check for any OAuth user whose openId matches a pattern we can link
        // For non-owner users, check if there's an unlinked OAuth account by name match
        let userToLink = oauthUserToLink.length > 0 ? oauthUserToLink[0] : null;

        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 10);

        let newUser: any[];
        let newUserId: number;

        if (userToLink) {
          // Link existing OAuth account: add email, name, and password
          await db.update(users).set({
            email: input.email,
            name: input.name,
            passwordHash: hashedPassword,
            loginMethod: 'email',
            lastSignedIn: new Date(),
          }).where(eq(users.id, userToLink.id));

          newUserId = userToLink.id;
          newUser = await db.select().from(users).where(eq(users.id, newUserId)).limit(1);
          console.log(`[Auth] Linked OAuth account ${newUserId} with email ${input.email}`);
        } else {
          // Create brand new user
          const result = await db.insert(users).values({
            email: input.email,
            name: input.name,
            role: 'user',
            loginMethod: 'email',
            openId: `email_${input.email}`,
            passwordHash: hashedPassword,
            lastSignedIn: new Date(),
            emailVerified: false,
          });

          newUserId = (result as any)[0]?.insertId ?? (result as any).insertId;
          if (!newUserId) {
            throw new Error('Failed to create user');
          }

          newUser = await db.select().from(users).where(eq(users.id, newUserId)).limit(1);
        }

        if (!newUser || newUser.length === 0) {
          throw new Error('Failed to retrieve new user');
        }

        // Generate verification token and send email
        const token = emailConfirmationService.generateConfirmationToken(input.email, newUserId);
        const frontendUrl = process.env.BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
        const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

        try {
          await emailConfirmationService.sendConfirmationEmail({
            recipientEmail: input.email,
            recipientName: input.name,
            verificationLink,
            expiresIn: '24 hours',
          });
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't fail signup if email fails, but log it
        }

        // Create session token for the new user
        const sessionToken = await sdk.createSessionToken(
          newUser[0].openId || '',
          { name: newUser[0].name || '' }
        );

        // Set session cookie on the response
        if (ctx.res) {
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        }

        // Create default FREE subscription for new user
        const subscription = await getUserSubscription(newUser[0].id);

        // Check if user is eligible for free trial (first 20 users)
        const trialStatus = await FreeTrialService.assignFreeTrialIfEligible(newUser[0].id);
        
        // If eligible for trial, upgrade to PROFESSIONAL tier
        if (trialStatus.isTrialUser) {
          await setTrialForBetaUser(newUser[0].id);
        }

        return {
          success: true,
          user: {
            id: newUser[0].id,
            email: newUser[0].email,
            name: newUser[0].name,
            role: newUser[0].role,
            emailVerified: false,
          },
          message: 'Account created successfully. Please check your email to confirm your address.',
          requiresEmailVerification: true,
          sessionToken,
          trial: trialStatus,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('[Auth] Signup error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Signup failed',
        });
      }
    }),

  // Email/Password Login
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      // Rate limit: 10 login attempts per 15 min per IP
      const ipCheck = loginLimiter.check(`ip:${getClientIp(ctx)}`);
      if (!ipCheck.allowed) {
        const retryMinutes = Math.ceil(ipCheck.retryAfterMs / 60_000);
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Too many login attempts. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
        });
      }
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // Find user by email
        const userResult = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

        if (userResult.length === 0) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
          });
        }

        const user = userResult[0];

        // Check if user has a password (OAuth-only users won't have one)
        if (!user.passwordHash) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'OAUTH_NO_PASSWORD',
          });
        }

        // Verify password
        const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!passwordValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
          });
        }

        // Update last signed in
        await db.update(users).set({
          lastSignedIn: new Date(),
        }).where(eq(users.id, user.id));

        // Create session token
        const sessionToken = await sdk.createSessionToken(
          user.openId || '',
          { name: user.name || '' }
        );

        // Set session cookie on the response
        if (ctx.res) {
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        }

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user?.emailVerified ?? false,
          },
          message: 'Logged in successfully',
          sessionToken,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('[Auth] Login error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Login failed',
        });
      }
    }),

  // Set password for existing OAuth users
  setPassword: publicProcedure
    .input(z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
    }))
    .mutation(async ({ input, ctx }) => {
      // Rate limit: same as login
      const ipCheck = loginLimiter.check(`ip:setpw:${getClientIp(ctx)}`);
      if (!ipCheck.allowed) {
        const retryMinutes = Math.ceil(ipCheck.retryAfterMs / 60_000);
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Too many attempts. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
        });
      }
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        }

        // Find user by email
        const userResult = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (userResult.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No account found with this email.' });
        }

        const user = userResult[0];

        // Only allow setting password if user doesn't already have one
        if (user.passwordHash) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'This account already has a password. Use the login form instead.' });
        }

        // Hash and store the new password
        const hashedPassword = await bcrypt.hash(input.password, 10);
        await db.update(users).set({
          passwordHash: hashedPassword,
          loginMethod: 'email',
          lastSignedIn: new Date(),
        }).where(eq(users.id, user.id));

        // Create session token and log them in
        const sessionToken = await sdk.createSessionToken(
          user.openId || '',
          { name: user.name || '' }
        );

        if (ctx.res) {
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        }

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          message: 'Password set successfully! You are now logged in.',
          sessionToken,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('[Auth] Set password error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to set password',
        });
      }
    }),

  // Change password (authenticated users)
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        }

        const userId = ctx.user?.id;
        if (!userId) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
        }

        const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (userResult.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
        }

        const user = userResult[0];

        // Verify current password
        if (!user.passwordHash) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No password set on this account. Please use Set Password instead.' });
        }

        const passwordValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!passwordValid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Current password is incorrect.' });
        }

        // Hash and store new password
        const hashedPassword = await bcrypt.hash(input.newPassword, 10);
        await db.update(users).set({
          passwordHash: hashedPassword,
        }).where(eq(users.id, userId));

        return {
          success: true,
          message: 'Password changed successfully.',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('[Auth] Change password error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to change password',
        });
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
          emailVerified: (user as any).emailVerified,
        };
      } catch (error) {
        return null;
      }
    }),
  // Get OAuth configuration for frontend
  getOAuthConfig: publicProcedure
    .query(() => {
      const oauthPortalUrl = process.env.VITE_OAUTH_PORTAL_URL || process.env.OAUTH_SERVER_URL || 'https://manus.im';
      const appId = process.env.VITE_APP_ID || '';
      const oauthRedirectBase = process.env.VITE_OAUTH_REDIRECT_BASE_URL || '';
      return {
        oauthPortalUrl,
        appId,
        oauthRedirectBase,
      };
    }),
});
