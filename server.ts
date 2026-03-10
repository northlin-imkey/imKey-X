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
  console.log("[Server] Registering API routes...");

  app.get("/api/ping", (req, res) => {
    console.log("[API] GET /api/ping - Requested");
    res.json({ 
      status: "ok", 
      supabase: !!supabase, 
      env: process.env.NODE_ENV,
      time: new Date().toISOString()
    });
  });

  app.get("/api/history", async (req, res) => {
    console.log("[API] GET /api/history - Requested");
    if (!supabase) {
      console.error("[API] Supabase not configured");
      return res.status(503).json({ error: "Supabase not configured" });
    }
    try {
      const { data, error } = await supabase
        .from("tweets_history")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("[API] Supabase fetch error:", error);
        return res.status(500).json({ error: error.message });
      }
      console.log(`[API] Found ${data?.length || 0} items`);
      res.json(data || []);
    } catch (err: any) {
      console.error("[API] History exception:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/save-history", async (req, res) => {
    console.log("[API] POST /api/save-history - Requested");
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    try {
      const { data, error } = await supabase.from("tweets_history").insert([req.body]).select();
      if (error) throw error;
      res.json({ success: true, id: data?.[0]?.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/update-tweet-status", async (req, res) => {
    console.log("[API] POST /api/update-tweet-status - Requested");
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    try {
      const { historyId, groupIndex, tweetIndex, status } = req.body;
      const { data: item, error: fetchError } = await supabase.from("tweets_history").select("content").eq("id", historyId).single();
      if (fetchError || !item) throw new Error("Item not found");
      
      const content = item.content as any[];
      if (content[groupIndex]?.tweets[tweetIndex]) {
        content[groupIndex].tweets[tweetIndex].status = status;
      }
      
      const { error: updateError } = await supabase.from("tweets_history").update({ content }).eq("id", historyId);
      if (updateError) throw updateError;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- End of API Routes ---

  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Setting up Vite middleware for development...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Server] Vite middleware attached.");
    
    // Explicit root handler
    app.get("/", async (req, res, next) => {
      try {
        const indexPath = path.join(__dirname, "index.html");
        console.log(`[Server] Serving index.html from ${indexPath}`);
        let template = fs.readFileSync(indexPath, "utf-8");
        template = await vite.transformIndexHtml("/", template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        console.error(`[Server] Error serving root: ${e.message}`);
        next(e);
      }
    });

    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) return next();
      
      try {
        const indexPath = path.join(__dirname, "index.html");
        let template = fs.readFileSync(indexPath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
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
