console.log("========================================");
console.log("SERVER.TS IS LOADING...");
console.log("TIME:", new Date().toISOString());
console.log("========================================");

import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import dotenv from "dotenv";
import { apiRouter, getSupabase } from "./src/server-logic.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize once at startup for logging
const initialSupabase = getSupabase();
console.log("[Server] Environment Check:");
console.log(`- SUPABASE_URL: ${process.env.SUPABASE_URL ? "PRESENT" : "MISSING"}`);
console.log(`- SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? "PRESENT" : "MISSING"}`);
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Global Middleware
  app.use(cors());
  app.use(express.json());
  
  app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
  });

  // 2. Health Checks
  app.get("/healthz", (req, res) => res.status(200).send("OK"));
  app.get("/ping", (req, res) => res.status(200).json({ status: "root-ok" }));

  // 3. API Router
  app.use("/backend", apiRouter);
  app.use("/api", apiRouter);

  // 4. Vite Middleware
  const isProduction = false; // FORCE DEVELOPMENT MODE FOR DEBUGGING
  console.log(`[Server] Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} (Forced)`);
  
  if (!isProduction) {
    console.log("[Server] Setting up Vite middleware for development...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("[Server] Vite middleware attached.");
    } catch (viteErr: any) {
      console.error("[Server] Vite initialization failed:", viteErr.message);
    }
  } else {
    console.log("[Server] Serving static files from dist...");
    const distPath = path.join(__dirname, "dist");
    console.log(`[Server] Looking for dist at: ${distPath}`);
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        console.log(`[Server] SPA Fallback: ${req.url}`);
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.warn("[Server] dist directory not found!");
      app.get("*", (req, res) => {
        res.status(404).send(`Production build not found at ${distPath}. Please run 'npm run build'. Current ENV: ${process.env.NODE_ENV}`);
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Express listener active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Critical startup error:", err);
});
