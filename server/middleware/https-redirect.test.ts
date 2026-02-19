import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { configureServer } from './serverConfig';

describe('HTTPS Redirect Middleware', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    // Set NODE_ENV to production for testing the redirect
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    configureServer(app);
    
    // Add a test route
    app.get('/test', (req, res) => {
      res.json({ message: 'success', protocol: req.protocol });
    });
    
    return () => {
      process.env.NODE_ENV = originalEnv;
    };
  });

  afterEach(() => {
    // Restore original NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = originalEnv;
  });

  it('should have HSTS header configured', async () => {
    const response = await request(app)
      .get('/test')
      .set('x-forwarded-proto', 'https');

    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
    expect(response.headers['strict-transport-security']).toContain('includeSubDomains');
    expect(response.headers['strict-transport-security']).toContain('preload');
  });

  it('should include CSP header for security', async () => {
    const response = await request(app)
      .get('/test')
      .set('x-forwarded-proto', 'https');

    expect(response.headers['content-security-policy']).toBeDefined();
  });

  it('should have X-Frame-Options set to DENY', async () => {
    const response = await request(app)
      .get('/test')
      .set('x-forwarded-proto', 'https');

    expect(response.headers['x-frame-options']).toBe('DENY');
  });

  it('should have X-Content-Type-Options set to nosniff', async () => {
    const response = await request(app)
      .get('/test')
      .set('x-forwarded-proto', 'https');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should not have X-Powered-By header', async () => {
    const response = await request(app)
      .get('/test')
      .set('x-forwarded-proto', 'https');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('should have Permissions-Policy header', async () => {
    const response = await request(app)
      .get('/test')
      .set('x-forwarded-proto', 'https');

    expect(response.headers['permissions-policy']).toBeDefined();
    expect(response.headers['permissions-policy']).toContain('geolocation=()');
  });
});
