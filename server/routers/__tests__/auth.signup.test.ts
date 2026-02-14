import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "../index";
import type { TrpcContext } from "../../_core/context";
import { getDb } from "../../db";

describe("Auth Signup with Free Trial", () => {
  let mockContext: TrpcContext;

  beforeEach(() => {
    mockContext = {
      req: {
        headers: {},
        method: "POST",
      } as any,
      res: {
        cookie: vi.fn(),
        clearCookie: vi.fn(),
      } as any,
      user: null,
    };
  });

  it("should create a new user account with signup", async () => {
    const caller = appRouter.createCaller(mockContext);

    const result = await caller.auth.signup({
      email: "testuser@example.com",
      password: "TestPassword123!",
      name: "Test User",
    });

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe("testuser@example.com");
    expect(result.user.name).toBe("Test User");
    expect(result.sessionToken).toBeDefined();
    expect(result.requiresEmailVerification).toBe(true);
  });

  it("should assign free trial to first 20 users", async () => {
    const caller = appRouter.createCaller(mockContext);

    // Create first user
    const result1 = await caller.auth.signup({
      email: "betauser1@example.com",
      password: "TestPassword123!",
      name: "Beta User 1",
    });

    expect(result1.success).toBe(true);
    expect(result1.trial).toBeDefined();
    expect(result1.trial?.isTrialUser).toBe(true);
    expect(result1.trial?.tier).toBe("premium");
    expect(result1.trial?.trialEndDate).toBeDefined();
  });

  it("should return session token on signup", async () => {
    const caller = appRouter.createCaller(mockContext);

    const result = await caller.auth.signup({
      email: "sessiontest@example.com",
      password: "TestPassword123!",
      name: "Session Test",
    });

    expect(result.sessionToken).toBeDefined();
    expect(typeof result.sessionToken).toBe("string");
    expect(result.sessionToken.length).toBeGreaterThan(0);
  });

  it("should reject duplicate email signup", async () => {
    const caller = appRouter.createCaller(mockContext);

    // Create first user
    await caller.auth.signup({
      email: "duplicate@example.com",
      password: "TestPassword123!",
      name: "First User",
    });

    // Try to create with same email
    expect(
      caller.auth.signup({
        email: "duplicate@example.com",
        password: "TestPassword123!",
        name: "Second User",
      })
    ).rejects.toThrow();
  });

  it("should validate password requirements", async () => {
    const caller = appRouter.createCaller(mockContext);

    // Password too short
    expect(
      caller.auth.signup({
        email: "weakpass@example.com",
        password: "short",
        name: "Weak Password",
      })
    ).rejects.toThrow();
  });

  it("should validate email format", async () => {
    const caller = appRouter.createCaller(mockContext);

    expect(
      caller.auth.signup({
        email: "not-an-email",
        password: "TestPassword123!",
        name: "Bad Email",
      })
    ).rejects.toThrow();
  });
});
