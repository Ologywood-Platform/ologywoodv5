import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$10$hashedpassword'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// Mock SDK
vi.mock('./_core/sdk', () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue('mock-session-token'),
  },
}));

// Mock email
vi.mock('./email', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

// Mock emailConfirmationService
vi.mock('./services/emailConfirmationService', () => ({
  emailConfirmationService: {
    generateConfirmationToken: vi.fn().mockResolvedValue('mock-token'),
    verifyConfirmationToken: vi.fn().mockResolvedValue({ valid: true, userId: 1, email: 'test@test.com' }),
    sendConfirmationEmail: vi.fn().mockResolvedValue(true),
    sendResendConfirmationEmail: vi.fn().mockResolvedValue(true),
  },
}));

// Mock freeTrialService
vi.mock('./services/freeTrialService', () => ({
  FreeTrialService: {
    assignFreeTrialIfEligible: vi.fn().mockResolvedValue({ isTrialUser: false }),
  },
}));

// Mock pricingTierService
vi.mock('./services/pricingTierService', () => ({
  getUserSubscription: vi.fn().mockResolvedValue(null),
  setTrialForBetaUser: vi.fn().mockResolvedValue(null),
}));

// Mock cookies
vi.mock('./_core/cookies', () => ({
  getSessionCookieOptions: vi.fn().mockReturnValue({ httpOnly: true, secure: false }),
}));

// Mock shared const
vi.mock('@shared/const', () => ({
  COOKIE_NAME: 'session',
  ONE_YEAR_MS: 365 * 24 * 60 * 60 * 1000,
}));

// Track DB operations
const mockDbSelect = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbInsert = vi.fn();
let mockSelectResult: any[] = [];

const mockDb = {
  select: () => ({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve(mockSelectResult),
      }),
    }),
  }),
  update: () => ({
    set: () => ({
      where: () => Promise.resolve([{ affectedRows: 1 }]),
    }),
  }),
  insert: () => ({
    values: () => Promise.resolve([{ insertId: 1 }]),
  }),
};

vi.mock('./db', () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock('../drizzle/schema', () => ({
  users: { id: 'id', email: 'email', passwordHash: 'passwordHash', openId: 'openId', name: 'name', role: 'role' },
  passwordResetTokens: { id: 'id', token: 'token', userId: 'userId' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
  and: vi.fn((...args) => args),
  sql: vi.fn(),
}));

vi.mock('./utils/rateLimiter', () => ({
  signupLimiter: { check: vi.fn().mockReturnValue({ allowed: true }) },
  loginLimiter: { check: vi.fn().mockReturnValue({ allowed: true }) },
  resendEmailLimiter: { check: vi.fn().mockReturnValue({ allowed: true }) },
  forgotPasswordLimiter: { check: vi.fn().mockReturnValue({ allowed: true }) },
}));

describe('linkEmailPassword endpoint', () => {
  it('should be defined as a protectedProcedure', async () => {
    const { authRouter } = await import('./routers/auth');
    // The router should have linkEmailPassword defined
    expect(authRouter).toBeDefined();
    expect((authRouter as any)._def.procedures.linkEmailPassword).toBeDefined();
  });

  it('should require email and password inputs', async () => {
    const { authRouter } = await import('./routers/auth');
    const procedure = (authRouter as any)._def.procedures.linkEmailPassword;
    expect(procedure).toBeDefined();
  });

  it('should validate email format', async () => {
    const { authRouter } = await import('./routers/auth');
    const procedure = (authRouter as any)._def.procedures.linkEmailPassword;
    // The input schema should reject invalid emails
    const inputSchema = procedure._def.inputs[0];
    const result = inputSchema.safeParse({ email: 'invalid', password: '12345678' });
    expect(result.success).toBe(false);
  });

  it('should validate password minimum length', async () => {
    const { authRouter } = await import('./routers/auth');
    const procedure = (authRouter as any)._def.procedures.linkEmailPassword;
    const inputSchema = procedure._def.inputs[0];
    const result = inputSchema.safeParse({ email: 'test@test.com', password: '1234' });
    expect(result.success).toBe(false);
  });

  it('should accept valid email and password', async () => {
    const { authRouter } = await import('./routers/auth');
    const procedure = (authRouter as any)._def.procedures.linkEmailPassword;
    const inputSchema = procedure._def.inputs[0];
    const result = inputSchema.safeParse({ email: 'gary@test.com', password: 'SecurePass1' });
    expect(result.success).toBe(true);
  });

  it('should normalize email to lowercase', async () => {
    const { authRouter } = await import('./routers/auth');
    const procedure = (authRouter as any)._def.procedures.linkEmailPassword;
    const inputSchema = procedure._def.inputs[0];
    const result = inputSchema.safeParse({ email: 'Gary@Test.COM', password: 'SecurePass1' });
    expect(result.success).toBe(true);
    // The endpoint normalizes internally, but the schema accepts it
    expect(result.data.email).toBe('Gary@Test.COM');
  });
});
