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

  console.log(`[Server] Starting in ${process.env.NODE_ENV || 'development'} mode - Build Time: ${new Date().toISOString()}`);

  app.use(cors());
  app.use(express.json());

  // --- API Routes (MUST be before Vite/Static middleware) ---
  const apiRouter = express.Router();

  apiRouter.get("/ping", (req, res) => {
    console.log("[API] GET /api/ping - Requested");
    res.json({ 
      status: "ok", 
      supabase: !!supabase, 
      env: process.env.NODE_ENV,
      time: new Date().toISOString()
    });
  });

  apiRouter.get("/history", async (req, res) => {
    console.log("[API] GET /api/history - Requested");
    if (!supabase) {
      return res.status(503).json({ error: "Supabase not configured" });
    }
    try {
      const { data, error } = await supabase
        .from("tweets_history")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      console.error("[API] History error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.post("/save-history", async (req, res) => {
    console.log("[API] POST /api/save-history - Data received:", JSON.stringify(req.body).substring(0, 100) + "...");
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    try {
      const { data, error } = await supabase.from("tweets_history").insert([req.body]).select();
      if (error) {
        console.error("[Supabase Save Error]:", error);
        throw error;
      }
      console.log("[API] Save success, ID:", data?.[0]?.id);
      res.json({ success: true, id: data?.[0]?.id });
    } catch (err: any) {
      console.error("[API] Save history error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.post("/update-tweet-status", async (req, res) => {
    const { historyId, groupIndex, tweetIndex, status } = req.body;
    console.log("[API] POST /api/update-tweet-status:", { historyId, groupIndex, tweetIndex, status });
    
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    
    try {
      // First get the current content
      const { data: record, error: fetchError } = await supabase
        .from("tweets_history")
        .select("content")
        .eq("id", historyId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const content = record.content;
      if (content[groupIndex] && content[groupIndex].tweets[tweetIndex]) {
        content[groupIndex].tweets[tweetIndex].status = status;
      }
      
      const { error: updateError } = await supabase
        .from("tweets_history")
        .update({ content })
        .eq("id", historyId);
      
      if (updateError) throw updateError;
      
      res.json({ success: true });
    } catch (err: any) {
      console.error("[API] Update status error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.use("/api", apiRouter);
  console.log("[Server] API routes registered under /api");

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Critical startup error:", err);
});
