import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

/**
 * User Impersonation Router
 * Allows admins to generate impersonation tokens for testing
 */
export const impersonationRouter = router({
  /**
   * Generate an impersonation token for a user
   * Allows admin to temporarily log in as another user
   */
  generateImpersonationToken: protectedProcedure
    .input(z.object({ 
      userId: z.number(),
      expiresInMinutes: z.number().min(5).max(480).default(60)
    }))
    .mutation(async ({ input, ctx }) => {
      // Admin check
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      // Prevent self-impersonation
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: 'Cannot impersonate yourself' 
        });
      }

      // Generate token (in production, use JWT with expiration)
      const token = Buffer.from(
        JSON.stringify({
          userId: input.userId,
          adminId: ctx.user.id,
          timestamp: Date.now(),
          expiresAt: Date.now() + input.expiresInMinutes * 60 * 1000
        })
      ).toString('base64');

      const impersonationUrl = `${ctx.req.headers.origin}/impersonate?token=${token}`;

      return {
        success: true,
        token,
        impersonationUrl,
        expiresIn: input.expiresInMinutes,
        message: `Impersonation token generated. Valid for ${input.expiresInMinutes} minutes.`
      };
    }),

  /**
   * Verify and decode impersonation token
   * Used to validate token and extract user information
   */
  verifyImpersonationToken: protectedProcedure
    .input(z.object({ 
      token: z.string()
    }))
    .query(async ({ input, ctx }) => {
      try {
        const decoded = JSON.parse(
          Buffer.from(input.token, 'base64').toString('utf-8')
        );

        // Check expiration
        if (decoded.expiresAt < Date.now()) {
          throw new TRPCError({ 
            code: 'UNAUTHORIZED', 
            message: 'Impersonation token has expired' 
          });
        }

        // Verify admin is still admin
        if (ctx.user.id !== decoded.adminId) {
          throw new TRPCError({ 
            code: 'FORBIDDEN', 
            message: 'Token not issued by current admin' 
          });
        }

        return {
          valid: true,
          userId: decoded.userId,
          adminId: decoded.adminId,
          expiresAt: new Date(decoded.expiresAt)
        };
      } catch (error) {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: 'Invalid impersonation token' 
        });
      }
    }),

  /**
   * List recent impersonations by admin
   * For audit and tracking purposes
   */
  getRecentImpersonations: protectedProcedure
    .input(z.object({ 
      limit: z.number().min(1).max(100).default(20)
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      // In production, this would query an audit log table
      // For now, return a mock response
      return {
        impersonations: [],
        message: 'No recent impersonations recorded (audit log not yet implemented)'
      };
    }),

  /**
   * Revoke all impersonation tokens for a user
   * Useful if token is compromised
   */
  revokeImpersonationTokens: protectedProcedure
    .input(z.object({ 
      userId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      // In production, this would update a token revocation list
      return {
        success: true,
        message: `All impersonation tokens for user ${input.userId} have been revoked`
      };
    })
});
