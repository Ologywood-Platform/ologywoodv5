import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "../email";
import { contactFormLimiter } from "../utils/rateLimiter";

const CONTACT_SUBJECTS = [
  'General Inquiry',
  'Booking Support',
  'Artist Inquiry',
  'Venue Inquiry',
  'Technical Issue',
  'Partnership',
  'Other',
] as const;

export const contactRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters").max(100),
        email: z.string().email("Please enter a valid email address"),
        subject: z.enum(CONTACT_SUBJECTS),
        message: z.string().min(10, "Message must be at least 10 characters").max(5000),
        // Honeypot field — bots will fill this in, real users won't see it
        website: z.string().max(0, "Bot detected").optional().default(""),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { name, email, subject, message, website } = input;

      // Honeypot check — if the hidden field has any value, it's a bot
      if (website && website.length > 0) {
        console.log('[Contact] Honeypot triggered — bot submission blocked');
        // Return success to not tip off the bot
        return { success: true };
      }

      // Rate limit by IP address
      const clientIp = ctx.req?.headers?.['x-forwarded-for']?.toString()?.split(',')[0]?.trim()
        || ctx.req?.socket?.remoteAddress
        || 'unknown';
      
      const ipCheck = contactFormLimiter.check(`ip:${clientIp}`);
      if (!ipCheck.allowed) {
        const retryMinutes = Math.ceil(ipCheck.retryAfterMs / 60_000);
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `You've sent too many messages. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
        });
      }

      // Rate limit by email address (prevents using different IPs with same email)
      const emailCheck = contactFormLimiter.check(`email:${email.toLowerCase()}`);
      if (!emailCheck.allowed) {
        const retryMinutes = Math.ceil(emailCheck.retryAfterMs / 60_000);
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Too many messages from this email address. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
        });
      }

      // Determine which inbox to send to based on subject
      const isSupport = ['Booking Support', 'Technical Issue'].includes(subject);
      const toEmail = isSupport ? 'support@ologywood.com' : 'hello@ologywood.com';

      // Send the contact form submission to the Ologywood team
      const teamEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6366f1, #3b82f6); padding: 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">New Contact Form Submission</h2>
          </div>
          <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 120px;">From:</td>
                <td style="padding: 8px 0; color: #4b5563;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
                <td style="padding: 8px 0; color: #4b5563;"><a href="mailto:${email}" style="color: #6366f1;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Subject:</td>
                <td style="padding: 8px 0; color: #4b5563;">${subject}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Routed to:</td>
                <td style="padding: 8px 0; color: #4b5563;">${toEmail}</td>
              </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
            <h3 style="color: #374151; margin-bottom: 8px;">Message:</h3>
            <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; white-space: pre-wrap; color: #4b5563; line-height: 1.6;">
${message}
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">
              Submitted via Ologywood Contact Form • ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST
            </p>
          </div>
        </div>
      `;

      const teamEmailSent = await sendEmail({
        to: toEmail,
        subject: `[Contact Form] ${subject} — from ${name}`,
        html: teamEmailHtml,
      });

      // Send a confirmation email to the visitor
      const confirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6366f1, #3b82f6); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0;">Thanks for reaching out!</h2>
          </div>
          <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="color: #4b5563; line-height: 1.6;">Hi ${name},</p>
            <p style="color: #4b5563; line-height: 1.6;">
              We received your message about <strong>"${subject}"</strong> and our team will get back to you within 24 hours.
            </p>
            <p style="color: #4b5563; line-height: 1.6;">
              In the meantime, you might find answers in our <a href="https://www.ologywood.com/help" style="color: #6366f1;">Help Center</a>.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 13px;">
              This is an automated confirmation. Please do not reply to this email.<br/>
              If you need immediate help, email us at <a href="mailto:support@ologywood.com" style="color: #6366f1;">support@ologywood.com</a>.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">
              © 2026 Ologywood. All rights reserved.<br/>
              <a href="https://www.ologywood.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #9ca3af;">Unsubscribe</a> • 
              <a href="https://www.ologywood.com/privacy-policy" style="color: #9ca3af;">Privacy Policy</a>
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: email,
        subject: `We received your message — Ologywood`,
        html: confirmationHtml,
      });

      if (!teamEmailSent) {
        console.error('[Contact] Failed to send contact form to team');
        console.log('[Contact] FALLBACK LOG:', JSON.stringify({ name, email, subject, message, timestamp: new Date().toISOString() }));
      }

      return { success: true };
    }),
});
