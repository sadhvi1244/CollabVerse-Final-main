import * as dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

const app = express();

// Middleware: Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware: Serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Custom request logger for API endpoints
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestPath = req.path;

  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalJson = res.json.bind(res);
  res.json = (body, ...args) => {
    capturedJsonResponse = body;
    return originalJson(body, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (requestPath.startsWith("/api")) {
      let logLine = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 200) {
        logLine = logLine.slice(0, 199) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    console.error("❌ Error:", err);
    res.status(status).json({ message });
  });

  // Setup Vite in dev, serve static in prod
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ⛳ Use only PORT from Render; DO NOT use HOST
  const PORT = parseInt(process.env.PORT || "3000", 10);

  server.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
  });
})();
