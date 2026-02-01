import { router, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import { db } from "../db";
import { venueProfiles, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

/**
 * Generate a secure verification token
 */
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Send verification email using SendGrid
 */
async function sendVerificationEmail(
  email: string,
  venueName: string,
  verificationToken: string,
  verificationUrl: string
): Promise<void> {
  const fullVerificationUrl = `${verificationUrl}?token=${verificationToken}`;

  const message = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || "info@ologywood.com",
    subject: "Verify Your Email - Ologywood Venue Registration",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center; color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to Ologywood! 🎭</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 2rem; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 1.5rem;">
            Hi there,
          </p>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 1.5rem;">
            Thank you for registering <strong>${venueName}</strong> on Ologywood! To complete your registration and start connecting with talented artists, please verify your email address.
          </p>
          
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${fullVerificationUrl}" style="background: #667eea; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-bottom: 1rem;">
            Or copy and paste this link in your browser:
          </p>
          
          <p style="font-size: 13px; color: #666; word-break: break-all; background: white; padding: 1rem; border-radius: 4px; border: 1px solid #e5e7eb;">
            ${fullVerificationUrl}
          </p>
          
          <p style="font-size: 14px; color: #666; margin-top: 2rem; margin-bottom: 0;">
            This link will expire in 24 hours. If you didn't register this venue, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
            © 2026 Ologywood. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(message as any);
    console.log(`[Email] Verification email sent to ${email}`);
  } catch (error) {
    console.error(`[Email] Failed to send verification email to ${email}:`, error);
    throw new Error("Failed to send verification email");
  }
}

export const emailVerificationRouter = router({
  /**
   * Send verification email to venue contact email
   * Called after venue profile creation
   */
  sendVerificationEmail: protectedProcedure
    .input(
      z.object({
        venueProfileId: z.number(),
        email: z.string().email(),
        venueName: z.string(),
        verificationUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Generate verification token
        const verificationToken = generateVerificationToken();
        const now = new Date();

        // Update venue profile with verification token
        await db
          .update(venueProfiles)
          .set({
            emailVerificationToken: verificationToken,
            emailVerificationSentAt: now,
          })
          .where(eq(venueProfiles.id, input.venueProfileId));

        // Send verification email
        await sendVerificationEmail(
          input.email,
          input.venueName,
          verificationToken,
          input.verificationUrl
        );

        return {
          success: true,
          message: "Verification email sent successfully",
        };
      } catch (error) {
        console.error("[EmailVerification] Error sending verification email:", error);
        throw new Error("Failed to send verification email");
      }
    }),

  /**
   * Verify email using token
   * Called when user clicks verification link
   */
  verifyEmail: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Find venue profile with matching token
        const venueProfile = await db.query.venueProfiles.findFirst({
          where: eq(venueProfiles.emailVerificationToken, input.token),
        });

        if (!venueProfile) {
          throw new Error("Invalid or expired verification token");
        }

        // Check if token is expired (24 hours)
        if (venueProfile.emailVerificationSentAt) {
          const tokenAge = Date.now() - venueProfile.emailVerificationSentAt.getTime();
          const twentyFourHours = 24 * 60 * 60 * 1000;

          if (tokenAge > twentyFourHours) {
            throw new Error("Verification token has expired");
          }
        }

        // Mark email as verified
        await db
          .update(venueProfiles)
          .set({
            emailVerified: true,
            emailVerificationToken: null,
            emailVerificationSentAt: null,
          })
          .where(eq(venueProfiles.id, venueProfile.id));

        return {
          success: true,
          message: "Email verified successfully",
          venueId: venueProfile.userId,
        };
      } catch (error) {
        console.error("[EmailVerification] Error verifying email:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to verify email"
        );
      }
    }),

  /**
   * Resend verification email
   * Called if user didn't receive original email
   */
  resendVerificationEmail: protectedProcedure
    .input(
      z.object({
        venueProfileId: z.number(),
        email: z.string().email(),
        venueName: z.string(),
        verificationUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Check if venue profile exists and belongs to user
        const venueProfile = await db.query.venueProfiles.findFirst({
          where: eq(venueProfiles.id, input.venueProfileId),
        });

        if (!venueProfile) {
          throw new Error("Venue profile not found");
        }

        // Check if already verified
        if (venueProfile.emailVerified) {
          throw new Error("Email is already verified");
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const now = new Date();

        // Update venue profile with new token
        await db
          .update(venueProfiles)
          .set({
            emailVerificationToken: verificationToken,
            emailVerificationSentAt: now,
          })
          .where(eq(venueProfiles.id, input.venueProfileId));

        // Send verification email
        await sendVerificationEmail(
          input.email,
          input.venueName,
          verificationToken,
          input.verificationUrl
        );

        return {
          success: true,
          message: "Verification email resent successfully",
        };
      } catch (error) {
        console.error("[EmailVerification] Error resending verification email:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to resend verification email"
        );
      }
    }),

  /**
   * Check if email is verified
   */
  checkVerificationStatus: protectedProcedure
    .input(
      z.object({
        venueProfileId: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const venueProfile = await db.query.venueProfiles.findFirst({
          where: eq(venueProfiles.id, input.venueProfileId),
        });

        if (!venueProfile) {
          throw new Error("Venue profile not found");
        }

        return {
          isVerified: venueProfile.emailVerified,
          email: venueProfile.email,
          verificationSentAt: venueProfile.emailVerificationSentAt,
        };
      } catch (error) {
        console.error("[EmailVerification] Error checking verification status:", error);
        throw new Error("Failed to check verification status");
      }
    }),
});
