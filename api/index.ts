import express from "express";
import cors from "cors";
import { apiRouter } from "../src/server-logic.js";

const app = express();
app.use(cors());
app.use(express.json());

// Vercel serverless functions handle the routing
// We mount the router at both /backend and /api for compatibility
app.use("/backend", apiRouter);
app.use("/api", apiRouter);

// Root level ping for absolute testing
app.get("/ping", (req, res) => res.json({ status: "vercel-root-ok" }));

export default app;
