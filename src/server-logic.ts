import express from "express";
import { createClient } from "@supabase/supabase-js";

export const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const apiRouter = express.Router();

apiRouter.get("/ping", (req, res) => {
  console.log(`[API] Ping hit`);
  res.json({ 
    status: "ok", 
    supabase: !!getSupabase(),
    env: process.env.NODE_ENV,
    time: new Date().toISOString()
  });
});

apiRouter.get("/history", async (req, res) => {
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

apiRouter.post("/save-history", async (req, res) => {
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

apiRouter.post("/update-tweet-status", async (req, res) => {
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
