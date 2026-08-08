import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // GitHub OAuth token exchange proxy
  app.post("/api/auth/github/token", async (req, res) => {
    try {
      const { code, clientId, clientSecret, redirectUri } = req.body;
      const finalClientId = clientId || process.env.GITHUB_CLIENT_ID;
      const finalClientSecret = clientSecret || process.env.GITHUB_CLIENT_SECRET;

      if (!finalClientId || !finalClientSecret || !code) {
        return res.status(400).json({ error: "Missing required parameters (code, clientId, or clientSecret)" });
      }

      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: finalClientId,
          client_secret: finalClientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      });

      const data = await response.json();
      if (data.error) {
        return res.status(400).json({ error: data.error_description || data.error });
      }

      res.json(data);
    } catch (err: any) {
      console.error("GitHub OAuth error:", err);
      res.status(500).json({ error: err.message || "Failed to exchange OAuth token" });
    }
  });

  const isProduction = process.env.NODE_ENV === "production";
  const distPath = path.join(process.cwd(), "dist");
  const distIndexPath = path.join(distPath, "index.html");

  if (process.env.NODE_ENV === "production" || fs.existsSync(distIndexPath)) {
    // Static file serving for production or built dist
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(distIndexPath);
    });
  } else {
    // Development Vite middleware serving
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Fallback HTML handling for SPA routes in dev
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) {
        return next();
      }
      try {
        const indexPath = path.join(process.cwd(), "index.html");
        let template = fs.readFileSync(indexPath, "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GitSync Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

