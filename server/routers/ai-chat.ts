import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import {
  getAIChatResponse,
  analyzeForEscalation,
} from "../services/ai-chat-mock";

export const aiChatRouter = router({
  // Send message to AI chat
  sendMessage: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(1000),
        conversationId: z.string().optional(),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await getAIChatResponse(
          input.message,
          input.conversationHistory || []
        );

        return {
          success: true,
          response: response.message,
          shouldEscalate: response.shouldEscalate,
          escalationReason: response.escalationReason,
        };
      } catch (error) {
        console.error("AI Chat error:", error);
        return {
          success: false,
          response:
            "I'm having trouble processing your request. Please try again or contact our support team.",
          shouldEscalate: true,
          escalationReason: "Technical error",
        };
      }
    }),

  // Analyze message for escalation
  analyzeMessage: publicProcedure
    .input(z.object({ message: z.string() }))
    .query(({ input }) => {
      const analysis = analyzeForEscalation(input.message);
      return analysis;
    }),

  // Get suggested topics for help
  getSuggestedTopics: publicProcedure.query(() => {
    return [
      { topic: "Creating a Booking", icon: "📅", keywords: ["booking", "request", "create"] },
      { topic: "Payments & Invoicing", icon: "💳", keywords: ["payment", "invoice", "billing"] },
      { topic: "Artist Riders", icon: "📋", keywords: ["rider", "requirements", "technical"] },
      { topic: "Calendar & Availability", icon: "📆", keywords: ["available", "calendar", "dates"] },
      { topic: "Messaging", icon: "💬", keywords: ["message", "contact", "communicate"] },
      { topic: "Profile Setup", icon: "👤", keywords: ["profile", "setup", "photo"] },
      { topic: "Account Management", icon: "⚙️", keywords: ["account", "password", "settings"] },
      { topic: "Technical Issues", icon: "🔧", keywords: ["error", "bug", "issue"] },
    ];
  }),

  // Get FAQ by category
  getFAQByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(({ input }) => {
      const faqs: Record<string, Array<{ q: string; a: string }>> = {
        booking: [
          {
            q: "How do I create a booking?",
            a: "Browse artists, click their profile, and click 'Request Booking'. Fill in event details and submit.",
          },
          {
            q: "Can I modify a booking?",
            a: "Yes, go to Bookings page and click Edit. Some changes may need artist approval.",
          },
          {
            q: "How do I cancel a booking?",
            a: "Go to Bookings, select the booking, and click Cancel. Check your cancellation policy.",
          },
        ],
        payment: [
          {
            q: "What payment methods do you accept?",
            a: "We accept all major credit cards (Visa, Mastercard, Amex) through Stripe.",
          },
          {
            q: "When do I get paid?",
            a: "Artists receive payment 3 business days after the event date.",
          },
          {
            q: "Is there a fee?",
            a: "Artists pay 15% platform fee. Venues have no booking fees.",
          },
        ],
        rider: [
          {
            q: "What is a rider?",
            a: "A rider outlines your technical, hospitality, and financial requirements.",
          },
          {
            q: "How do I create a rider?",
            a: "Go to Riders page, click Create, fill in requirements, and save as PDF.",
          },
          {
            q: "Can I have multiple riders?",
            a: "Yes, create different riders for different event types.",
          },
        ],
        availability: [
          {
            q: "How do I update my availability?",
            a: "Go to Calendar page and click dates to mark available/unavailable.",
          },
          {
            q: "How far in advance should I update?",
            a: "Update at least 3 months in advance for best results.",
          },
          {
            q: "Can I block multiple dates at once?",
            a: "Yes, click and drag to select multiple dates.",
          },
        ],
      };

      return faqs[input.category] || [];
    }),
});
