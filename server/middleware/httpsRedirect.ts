import type { Express, NextFunction, Request, Response } from 'express';

/**
 * Enforce HTTPS at the application boundary for production browser requests.
 * Non-GET requests are passed through so API clients can receive a normal
 * response instead of losing request bodies during a redirect.
 */
export function installHttpsRedirect(app: Express): void {
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);

  if (process.env.NODE_ENV !== 'production') return;

  app.use((req: Request, res: Response, next: NextFunction) => {
    const forwardedProto = req.get('x-forwarded-proto')
      ?.split(',')[0]
      ?.trim()
      .toLowerCase();
    const isSecure = req.secure || forwardedProto === 'https';

    if (!isSecure && req.method === 'GET') {
      const host = req.get('host');
      if (host) {
        return res.redirect(301, `https://${host}${req.originalUrl}`);
      }
    }

    next();
  });
}
