import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // When running from dist/index.js, __dirname is the dist directory
  // We need to serve files from dist/public
  const distPath = path.join(__dirname, "public");
  console.log(`[Static Files] Serving from: ${distPath}`);
  
  if (!fs.existsSync(distPath)) {
    console.error(
      `[ERROR] Could not find the build directory: ${distPath}`
    );
    console.error(`[ERROR] Current __dirname: ${__dirname}`);
    console.error(`[ERROR] Make sure to run 'pnpm build' before starting the server`);
  }
  
  // Serve static files with proper MIME types
  app.use(express.static(distPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      } else if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));
  
  // Fall through to index.html for SPA routing (but exclude static files)
  app.use("*", (req, res) => {
    // Don't serve index.html for static assets or special files
    const pathname = req.path;
    if (
      pathname.match(/\.(js|css|json|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i) ||
      pathname === '/sw.js' ||
      pathname === '/manifest.json'
    ) {
      return res.status(404).send('Not Found');
    }
    
    const indexPath = path.resolve(distPath, "index.html");
    console.log(`[SPA Fallback] Serving: ${indexPath}`);
    res.sendFile(indexPath);
  });
}
