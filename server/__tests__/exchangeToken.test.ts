import { describe, it, expect } from 'vitest';

describe('Exchange Token Endpoint', () => {
  const BASE_URL = process.env.BASE_URL && process.env.BASE_URL.startsWith('http') ? process.env.BASE_URL : 'http://localhost:3000';

  it('should reject requests without a token', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/exchange-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing token');
  });

  it('should reject requests with an invalid token', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/exchange-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid-token-value' }),
    });
    // Should be 401 (invalid) or 500 (verification error)
    expect([401, 500]).toContain(response.status);
  });

  it('should reject non-string token values', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/exchange-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 12345 }),
    });
    expect(response.status).toBe(400);
  });
});
