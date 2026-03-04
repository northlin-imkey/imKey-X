import express from "express";
import multer from "multer";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Route to fetch history
  app.get("/api/history", async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    
    const { data, error } = await supabase
      .from("tweets_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  });

  // API Route to save history
  app.post("/api/save-history", async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    
    const { language, tone, content, date_range } = req.body;
    
    const { error } = await supabase
      .from("tweets_history")
      .insert({
        language,
        tone,
        content,
        date_range
      });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // API Route to update tweet status
  app.post("/api/update-tweet-status", async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    
    const { historyId, groupIndex, tweetIndex, status } = req.body;
    
    // Fetch the current record
    const { data: item, error: fetchError } = await supabase
      .from("tweets_history")
      .select("content")
      .eq("id", historyId)
      .single();

    if (fetchError || !item) return res.status(500).json({ error: fetchError?.message || "Item not found" });

    const content = item.content as any[];
    if (content[groupIndex] && content[groupIndex].tweets[tweetIndex]) {
      content[groupIndex].tweets[tweetIndex].status = status;
    }

    // Update the record
    const { error: updateError } = await supabase
      .from("tweets_history")
      .update({ content })
      .eq("id", historyId);

    if (updateError) return res.status(500).json({ error: updateError.message });
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`__dirname: ${__dirname}`);
  });
}

startServer();
