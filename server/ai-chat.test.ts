import { describe, it, expect } from "vitest";
import { getAIChatResponse, analyzeForEscalation } from "./services/ai-chat";

describe("AI Chat Service", () => {
  it("should validate OpenAI API key by making a test request", async () => {
    // This test validates that the OpenAI API key is configured correctly
    // by attempting to get a response for a simple query
    const response = await getAIChatResponse("Hello, how can I get help?");

    // Should return a response object
    expect(response).toBeDefined();
    expect(response).toHaveProperty("message");
    expect(response).toHaveProperty("shouldEscalate");

    // Message should not be empty
    expect(response.message).toBeTruthy();
    expect(response.message.length).toBeGreaterThan(0);
  }, { timeout: 30000 });

  it("should detect escalation keywords", () => {
    const testCases = [
      { message: "I need a refund", shouldEscalate: true },
      { message: "There's a billing error", shouldEscalate: true },
      { message: "This is urgent!", shouldEscalate: true },
      { message: "How do I create a booking?", shouldEscalate: false },
      { message: "What's your pricing?", shouldEscalate: false },
    ];

    for (const testCase of testCases) {
      const result = analyzeForEscalation(testCase.message);
      expect(result.shouldEscalate).toBe(testCase.shouldEscalate);
    }
  });

  it("should handle conversation history", async () => {
    const conversationHistory = [
      { role: "user" as const, content: "What's a rider?" },
      { role: "assistant" as const, content: "A rider is a document that outlines your technical and hospitality requirements." },
    ];

    const response = await getAIChatResponse(
      "Can I modify it after creating it?",
      conversationHistory
    );

    expect(response).toBeDefined();
    expect(response.message).toBeTruthy();
  }, { timeout: 30000 });
});
