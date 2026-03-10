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

  console.log(`[Server] Starting in ${process.env.NODE_ENV || 'development'} mode`);

  app.use(cors());
  app.use(express.json());

  // API Routes
  const apiRouter = express.Router();

  apiRouter.get("/ping", (req, res) => {
    console.log("[API] Ping requested");
    res.json({ status: "ok", supabase: !!supabase, env: process.env.NODE_ENV });
  });

  apiRouter.get("/history", async (req, res) => {
    console.log("[API] Fetching history...");
    if (!supabase) {
      console.error("[API] Supabase not configured for history fetch");
      return res.status(503).json({ error: "Supabase not configured" });
    }
    try {
      const { data, error } = await supabase.from("tweets_history").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("[API] Supabase fetch error:", error);
        throw error;
      }
      console.log(`[API] Found ${data?.length || 0} history items`);
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.post("/save-history", async (req, res) => {
    console.log("[API] Saving history:", req.body.date_range);
    if (!supabase) {
      console.error("[API] Supabase not configured for history save");
      return res.status(503).json({ error: "Supabase not configured" });
    }
    try {
      const { data, error } = await supabase.from("tweets_history").insert([req.body]).select();
      if (error) {
        console.error("[API] Supabase insert error:", error);
        throw error;
      }
      console.log("[API] History saved successfully:", data?.[0]?.id);
      res.json({ success: true, id: data?.[0]?.id });
    } catch (err: any) {
      console.error("[API] Save history exception:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.post("/update-tweet-status", async (req, res) => {
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

  app.use("/api", apiRouter);

  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Setting up Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
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
