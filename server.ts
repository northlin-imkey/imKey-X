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

  app.use(cors());
  app.use(express.json());

  // API Routes
  const apiRouter = express.Router();

  apiRouter.get("/ping", (req, res) => {
    res.json({ status: "ok", supabase: !!supabase });
  });

  apiRouter.get("/history", async (req, res) => {
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
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    try {
      const { error } = await supabase.from("tweets_history").insert([req.body]);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
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
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // SPA Fallback
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) return next();
      
      try {
        const indexPath = path.join(__dirname, "index.html");
        if (!fs.existsSync(indexPath)) {
          return res.status(500).send("index.html not found");
        }
        let template = fs.readFileSync(indexPath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
