import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Initialize once at startup for logging
const initialSupabase = getSupabase();
console.log("[Server] Environment Check:");
console.log(`- SUPABASE_URL: ${process.env.SUPABASE_URL ? "PRESENT" : "MISSING"}`);
console.log(`- SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? "PRESENT" : "MISSING"}`);
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ABSOLUTE FIRST MIDDLEWARE - LOG EVERYTHING
  app.use((req, res, next) => {
    console.log(`[Incoming Request] ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
  });

  console.log(`[Server] Initializing routes...`);

  // Health check for the platform
  app.get("/healthz", (req, res) => res.send("OK"));

  // 0. Absolute First Priority API Routes
  app.get("/api/ping", (req, res) => {
    console.log(`[Server] API Ping hit!`);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ 
      status: "ok", 
      supabase: !!getSupabase(),
      env: process.env.NODE_ENV || 'not-set',
      time: new Date().toISOString()
    });
  });

  app.get("/api/debug", (req, res) => {
    res.json({
      url: req.url,
      method: req.method,
      headers: req.headers,
      env: process.env.NODE_ENV,
      cwd: process.cwd()
    });
  });

  app.use(cors());
  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    next();
  });

  // 1. Other API Routes
  app.get("/api/history", async (req, res) => {
    const supabaseClient = getSupabase();
    if (!supabaseClient) return res.status(503).json({ error: "Supabase not configured" });
    try {
      const { data, error } = await supabaseClient.from("tweets_history").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/save-history", async (req, res) => {
    const supabaseClient = getSupabase();
    if (!supabaseClient) return res.status(503).json({ error: "Supabase not configured" });
    try {
      const { data, error } = await supabaseClient.from("tweets_history").insert([req.body]).select();
      if (error) throw error;
      res.json({ success: true, id: data?.[0]?.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/update-tweet-status", async (req, res) => {
    const { historyId, groupIndex, tweetIndex, status } = req.body;
    const supabaseClient = getSupabase();
    if (!supabaseClient) return res.status(503).json({ error: "Supabase not configured" });
    try {
      const { data: record, error: fetchError } = await supabaseClient.from("tweets_history").select("content").eq("id", historyId).single();
      if (fetchError) throw fetchError;
      const content = record.content;
      if (content[groupIndex] && content[groupIndex].tweets[tweetIndex]) {
        content[groupIndex].tweets[tweetIndex].status = status;
      }
      const { error: updateError } = await supabaseClient.from("tweets_history").update({ content }).eq("id", historyId);
      if (updateError) throw updateError;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/healthz", (req, res) => {
    res.send("OK");
  });

  // Vite middleware for development
  const isProduction = process.env.NODE_ENV === "production";
  console.log(`[Server] Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  
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
