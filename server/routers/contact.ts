import { publicProcedure, router } from "../_core/trpc";
import sgMail from "@sendgrid/mail";
import { z } from "zod";

// Initialize SendGrid
const sendgridApiKey = process.env.SENDGRID_API_KEY;
if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
}

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  userType: z.enum(["artist", "venue", "other"]),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const contactRouter = router({
  submitContactForm: publicProcedure
    .input(contactFormSchema)
    .mutation(async ({ input }) => {
      try {
        const { name, email, userType, subject, message } = input;

        // Prepare email content
        const emailContent = `
New Contact Form Submission

Name: ${name}
Email: ${email}
User Type: ${userType}
Subject: ${subject}

Message:
${message}

---
This message was sent from the Ologywood contact form.
        `;

        // Send email to support team
        if (sendgridApiKey) {
          await sgMail.send({
            to: process.env.SENDGRID_FROM_EMAIL || "info@ologywood.com",
            from: process.env.SENDGRID_FROM_EMAIL || "noreply@ologywood.com",
            replyTo: email,
            subject: `[Ologywood Contact] ${subject}`,
            text: emailContent,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>User Type:</strong> ${userType}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <hr />
              <h3>Message:</h3>
              <p>${message.replace(/\n/g, "<br />")}</p>
              <hr />
              <p><small>This message was sent from the Ologywood contact form.</small></p>
            `,
          });

          // Send confirmation email to user
          await sgMail.send({
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL || "noreply@ologywood.com",
            subject: "We received your message - Ologywood Support",
            text: `
Hi ${name},

Thank you for contacting Ologywood! We've received your message and will get back to you within 24 business hours.

Subject: ${subject}

Best regards,
Ologywood Support Team
info@ologywood.com
678-525-0891
            `,
            html: `
              <h2>Thank you for contacting Ologywood!</h2>
              <p>Hi ${name},</p>
              <p>We've received your message and will get back to you within 24 business hours.</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <hr />
              <p>Best regards,<br />
              <strong>Ologywood Support Team</strong><br />
              <a href="mailto:info@ologywood.com">info@ologywood.com</a><br />
              <a href="tel:678-525-0891">678-525-0891</a></p>
            `,
          });
        }

        return {
          success: true,
          message: "Your message has been sent successfully!",
        };
      } catch (error) {
        console.error("Contact form submission error:", error);
        throw new Error("Failed to send message. Please try again later.");
      }
    }),
});
