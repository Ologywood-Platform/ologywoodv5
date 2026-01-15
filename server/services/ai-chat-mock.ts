/**
 * Mock AI Chat Service for Development
 * Simulates intelligent responses without using OpenAI API
 * Switch to ai-chat.ts in production when OpenAI credits are available
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  shouldEscalate: boolean;
  escalationReason?: string;
}

// Mock responses for common questions
const mockResponses: Record<string, string> = {
  booking: `To create a booking:
1. Browse our artist directory by genre or location
2. Click on an artist's profile to view their details
3. Click "Request Booking" and fill in your event details
4. Submit your request and the artist will respond

You can modify bookings by going to your Bookings page and clicking Edit. Some changes may require the artist's approval.`,

  payment: `We accept all major credit cards (Visa, Mastercard, Amex) through Stripe. Payments are secure and encrypted. Artists receive payment 3 business days after the event date, transferred directly to their bank account.`,

  rider: `A rider is a document outlining your technical, hospitality, and financial requirements for a performance. It helps venues understand what you need.

To create a rider:
1. Go to the Riders page
2. Click "Create New Rider"
3. Fill in your requirements
4. Save and download as PDF`,

  availability: `To update your availability:
1. Go to the Calendar page
2. Click on dates to mark them as available or unavailable
3. Green = Available, Red = Unavailable, Blue = Booked
4. Update at least 3 months in advance`,

  messaging: `Use the Messages feature to communicate with artists and venues:
1. Go to Messages page
2. Click on a conversation or start a new one
3. Type your message and click Send
All messages are encrypted and secure.`,

  profile: `To set up your profile:
1. Go to Dashboard > Profile tab
2. Add a professional photo
3. Write a compelling bio (200-300 words)
4. Add your location and rates
5. Upload media (photos, videos)`,

  account: `To manage your account:
1. Go to Dashboard > Profile tab
2. Update your information
3. Change your password in Settings
4. Manage notification preferences
5. Update payment methods`,

  technical: `For technical issues:
1. Try refreshing the page
2. Clear your browser cache
3. Try a different browser
4. Check your internet connection
5. Contact support if the issue persists`,
};

/**
 * Get mock AI response for user query
 */
export async function getAIChatResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

  const lowerMessage = userMessage.toLowerCase();

  // Check for escalation keywords
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
    lowerMessage.includes(keyword)
  );

  if (shouldEscalate) {
    return {
      message: `I understand this is important. Your issue requires immediate attention from our support team. I'm escalating this to a human agent who will help you shortly. Thank you for your patience!`,
      shouldEscalate: true,
      escalationReason: "Complex issue requiring human support",
    };
  }

  // Find matching response based on keywords
  let response = "";

  if (
    lowerMessage.includes("booking") ||
    lowerMessage.includes("request") ||
    lowerMessage.includes("create")
  ) {
    response = mockResponses.booking;
  } else if (
    lowerMessage.includes("payment") ||
    lowerMessage.includes("pay") ||
    lowerMessage.includes("invoice")
  ) {
    response = mockResponses.payment;
  } else if (
    lowerMessage.includes("rider") ||
    lowerMessage.includes("requirement")
  ) {
    response = mockResponses.rider;
  } else if (
    lowerMessage.includes("available") ||
    lowerMessage.includes("calendar") ||
    lowerMessage.includes("date")
  ) {
    response = mockResponses.availability;
  } else if (
    lowerMessage.includes("message") ||
    lowerMessage.includes("contact") ||
    lowerMessage.includes("communicate")
  ) {
    response = mockResponses.messaging;
  } else if (
    lowerMessage.includes("profile") ||
    lowerMessage.includes("setup") ||
    lowerMessage.includes("photo")
  ) {
    response = mockResponses.profile;
  } else if (
    lowerMessage.includes("account") ||
    lowerMessage.includes("password") ||
    lowerMessage.includes("login")
  ) {
    response = mockResponses.account;
  } else if (
    lowerMessage.includes("error") ||
    lowerMessage.includes("bug") ||
    lowerMessage.includes("issue")
  ) {
    response = mockResponses.technical;
  } else {
    // Default helpful response
    response = `I'm here to help! I can assist with questions about:
• Creating and managing bookings
• Payments and invoicing
• Artist profiles and riders
• Calendar and availability
• Messaging and communication
• Account management
• Technical issues

What would you like help with?`;
  }

  return {
    message: response,
    shouldEscalate: false,
  };
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
