/**
 * Final Payment Reminder Email Template
 * Sent 7 days before event date when deposit has been paid
 */

export interface FinalPaymentReminderParams {
  recipientName: string;
  artistName: string;
  eventDate: string;
  eventLocation: string;
  remainingBalance: number;
  currency?: string;
  paymentLink: string;
  baseUrl?: string;
}

export function getFinalPaymentReminderEmailTemplate(
  params: FinalPaymentReminderParams
): { subject: string; html: string } {
  const {
    recipientName,
    artistName,
    eventDate,
    eventLocation,
    remainingBalance,
    currency = "USD",
    paymentLink,
    baseUrl = process.env.BASE_URL || "https://ologywood.com",
  } = params;

  const formattedDate = new Date(eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(remainingBalance / 100);

  return {
    subject: `Final Payment Due: ${artistName} - ${formattedDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Final Payment Reminder</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your event is coming up!</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb;">
          <p style="margin: 0 0 20px 0;">Hi ${recipientName},</p>

          <p style="margin: 0 0 20px 0;">
            Your booking with <strong>${artistName}</strong> is confirmed for <strong>${formattedDate}</strong> 
            at <strong>${eventLocation}</strong>.
          </p>

          <p style="margin: 0 0 20px 0;">
            The final payment of <strong style="color: #8b5cf6; font-size: 18px;">${formattedBalance}</strong> 
            is now due to complete your booking.
          </p>

          <div style="background: #f3f4f6; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0;"><strong>Booking Summary:</strong></p>
            <div style="font-size: 14px; color: #666;">
              <p style="margin: 5px 0;"><strong>Artist:</strong> ${artistName}</p>
              <p style="margin: 5px 0;"><strong>Event Date:</strong> ${formattedDate}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${eventLocation}</p>
              <p style="margin: 5px 0;"><strong>Final Payment Due:</strong> ${formattedBalance}</p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}" style="display: inline-block; background: #8b5cf6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Pay Final Balance
            </a>
          </div>

          <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
            <strong>💡 Tip:</strong> Complete payment now to ensure your booking is fully secured and the artist can finalize preparations.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="margin: 0; color: #6b7280; font-size: 13px;">
            If you have any questions about your booking, please reply to this email or contact our support team.
          </p>

          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 13px;">
            This is an automated message from Ologywood. Please do not reply with sensitive information.
          </p>
        </div>

        <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            © 2026 Ologywood. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };
}
