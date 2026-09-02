/**
 * Security Headers Middleware
 * Implements OWASP recommended security headers
 * 
 * Allows iframe embedding from Manus preview domains (*.manus.computer, *.manus.space)
 * while blocking clickjacking from all other origins.
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

// Trusted origins that are allowed to embed this site in an iframe
const ALLOWED_FRAME_ANCESTORS = [
  "'self'",
  'https://*.manus.computer',
  'https://*.manus.space',
  'https://*.manus.im',
];

// Trusted child-frame providers used by checkout and Video Portfolio players.
// Keep this list narrow: frame-src controls what OlogyWood may embed, while
// frame-ancestors above separately controls who may embed OlogyWood.
export const ALLOWED_FRAME_SOURCES = [
  "'self'",
  'https://js.stripe.com',
  'https://hooks.stripe.com',
  'https://www.youtube.com',
  'https://www.youtube-nocookie.com',
  'https://player.vimeo.com',
];

/**
 * Configure security headers using Helmet
 */
export function configureSecurityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        mediaSrc: ["'self'", 'https://*.cloudfront.net', 'https://*.amazonaws.com', 'blob:'],
        connectSrc: ["'self'", 'https://api.manus.im', 'https://*.stripe.com', 'wss:', 'ws:', 'https://*.amazonaws.com', 'https://*.cloudfront.net'],
        frameSrc: ALLOWED_FRAME_SOURCES,
        frameAncestors: ALLOWED_FRAME_ANCESTORS,
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false, // Must be false to allow iframe communication
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: true,
    frameguard: false, // Disabled — using CSP frame-ancestors instead (more flexible)
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  });
}

/**
 * Custom security headers middleware
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Content Security Policy — includes media-src for CloudFront video playback
  // frame-ancestors allows Manus preview iframes while blocking clickjacking
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' https://*.cloudfront.net https://*.amazonaws.com blob:; connect-src 'self' https://api.manus.im https://*.stripe.com wss: ws: https://*.amazonaws.com https://*.cloudfront.net; frame-src ${ALLOWED_FRAME_SOURCES.join(' ')}; frame-ancestors 'self' https://*.manus.computer https://*.manus.space https://*.manus.im; base-uri 'self'; form-action 'self';`
  );

  // Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options — removed in favor of CSP frame-ancestors (X-Frame-Options doesn't support wildcards)
  // Do NOT set X-Frame-Options here as it conflicts with frame-ancestors

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
  );

  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * Security headers configuration object
 */
export const securityHeadersConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      mediaSrc: ["'self'", 'https://*.cloudfront.net', 'https://*.amazonaws.com', 'blob:'],
      connectSrc: ["'self'", 'https://api.manus.im', 'https://*.stripe.com', 'wss:', 'ws:', 'https://*.amazonaws.com', 'https://*.cloudfront.net'],
      frameSrc: ALLOWED_FRAME_SOURCES,
      frameAncestors: ALLOWED_FRAME_ANCESTORS,
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      microphone: ["'none'"],
      camera: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"],
    },
  },
};
