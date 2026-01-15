import { ENV } from "../_core/env";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  shouldEscalate: boolean;
  escalationReason?: string;
}

/**
 * AI Chat Service for support
 * Uses OpenAI to provide intelligent responses to support queries
 */

const SYSTEM_PROMPT = `You are a helpful support assistant for Ologywood, an artist booking platform. Your role is to help users with questions about:
- Booking management (creating, modifying, canceling bookings)
- Payment and invoicing
- Artist profiles and riders
- Messaging and communication
- Account management
- Technical issues

Guidelines:
1. Be friendly, professional, and concise
2. Provide clear, step-by-step instructions when needed
3. If you don't know the answer, suggest contacting support
4. Never make up information about features or policies
5. If the issue seems complex or requires human intervention, indicate it should be escalated

Common Issues You Can Help With:
- How to create a booking
- How to modify a booking
- Payment method questions
- Profile setup help
- Message troubleshooting
- Password reset guidance
- Feature explanations`;

/**
 * Get AI response for user query
 */
export async function getAIChatResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  try {
    // Check if message requires escalation
    const escalationKeywords = [
      "refund",
      "dispute",
      "complaint",
      "urgent",
      "emergency",
      "legal",
      "contract",
      "billing error",
      "fraud",
      "account compromised",
    ];

    const shouldEscalate = escalationKeywords.some((keyword) =>
      userMessage.toLowerCase().includes(keyword)
    );

    if (shouldEscalate) {
      return {
        message: `I understand this is important. Your issue requires immediate attention from our support team. I'm escalating this to a human agent who will help you shortly. Thank you for your patience!`,
        shouldEscalate: true,
        escalationReason: "Complex issue requiring human support",
      };
    }

    // Build messages array for OpenAI
    const messages: ChatMessage[] = [
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      return {
        message:
          "I'm temporarily unavailable. Please contact our support team for assistance.",
        shouldEscalate: true,
        escalationReason: "AI service unavailable",
      };
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || "";

    return {
      message: assistantMessage,
      shouldEscalate: false,
    };
  } catch (error) {
    console.error("AI Chat error:", error);
    return {
      message:
        "I'm having trouble processing your request. Please try again or contact our support team.",
      shouldEscalate: true,
      escalationReason: "Technical error",
    };
  }
}

/**
 * Determine if a message should be escalated based on content analysis
 */
export function analyzeForEscalation(message: string): {
  shouldEscalate: boolean;
  reason: string;
} {
  const escalationPatterns = [
    { pattern: /refund|money back|charge.*wrong/i, reason: "Payment issue" },
    { pattern: /dispute|disagree|unfair/i, reason: "Dispute" },
    { pattern: /urgent|asap|emergency|critical/i, reason: "Urgent" },
    { pattern: /contract|legal|lawyer|sue/i, reason: "Legal matter" },
    { pattern: /fraud|hacked|compromised|stolen/i, reason: "Security issue" },
    { pattern: /complaint|angry|frustrated|unacceptable/i, reason: "Complaint" },
  ];

  for (const { pattern, reason } of escalationPatterns) {
    if (pattern.test(message)) {
      return { shouldEscalate: true, reason };
    }
  }

  return { shouldEscalate: false, reason: "" };
}
