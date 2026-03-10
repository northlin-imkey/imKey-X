import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log(`[Server] Starting...`);

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Express listener active on http://0.0.0.0:${PORT}`);
  });

  app.use(cors());
  app.use(express.json());

  // DEBUG: Top-level route
  app.get("/debug-ping", (req, res) => {
    console.log("[Server] Debug ping hit!");
    res.send("EXPRESS IS ALIVE AND REACHABLE");
  });

  // Request logger
  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    next();
  });

  // 1. API Routes
  const apiRouter = express.Router();

  apiRouter.get("/ping", (req, res) => {
    console.log("[API] Ping hit");
    res.json({ 
      status: "ok", 
      supabase: !!supabase,
      timestamp: new Date().toISOString()
    });
  });

  apiRouter.get("/history", async (req, res) => {
    console.log("[API] GET /history");
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    try {
      const { data, error } = await supabase.from("tweets_history").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.post("/save-history", async (req, res) => {
    console.log("[API] POST /save-history");
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    try {
      const { data, error } = await supabase.from("tweets_history").insert([req.body]).select();
      if (error) throw error;
      res.json({ success: true, id: data?.[0]?.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.post("/update-tweet-status", async (req, res) => {
    console.log("[API] POST /update-tweet-status");
    const { historyId, groupIndex, tweetIndex, status } = req.body;
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    try {
      const { data: record, error: fetchError } = await supabase.from("tweets_history").select("content").eq("id", historyId).single();
      if (fetchError) throw fetchError;
      const content = record.content;
      if (content[groupIndex] && content[groupIndex].tweets[tweetIndex]) {
        content[groupIndex].tweets[tweetIndex].status = status;
      }
      const { error: updateError } = await supabase.from("tweets_history").update({ content }).eq("id", historyId);
      if (updateError) throw updateError;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.use("/api", apiRouter);

  app.get("/test-server", (req, res) => {
    res.send("Express Server is ALIVE");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

startServer().catch((err) => {
  console.error("[Server] Critical startup error:", err);
});
