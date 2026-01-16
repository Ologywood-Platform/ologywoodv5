import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { createRateLimiter, RATE_LIMIT_CONFIGS, startRateLimitCleanup } from "../middleware/rateLimiter";
import { requestLogger } from "../middleware/requestLogger";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Start rate limit cleanup
  startRateLimitCleanup(60000);
  
  // Stripe webhook MUST be registered before express.json() for signature verification
  const { handleStripeWebhook } = await import('../webhooks/stripe');
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Add request logging middleware
  if (requestLogger) {
    app.use(requestLogger as any);
  }
  
  // Apply rate limiting to authentication endpoints
  app.use('/api/oauth/login', createRateLimiter(RATE_LIMIT_CONFIGS.auth));
  app.use('/api/oauth/callback', createRateLimiter(RATE_LIMIT_CONFIGS.auth));
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Apply rate limiting to TRPC API
  app.use('/api/trpc', createRateLimiter(RATE_LIMIT_CONFIGS.api));
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Apply rate limiting to public endpoints
  app.get('/api/artists', createRateLimiter(RATE_LIMIT_CONFIGS.public));
  app.get('/api/search', createRateLimiter(RATE_LIMIT_CONFIGS.public));
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log('[Rate Limiter] Initialized with cleanup every 60 seconds');
  });
}

startServer().catch((error) => {
  console.error('[Server Error]', error);
  process.exit(1);
});
