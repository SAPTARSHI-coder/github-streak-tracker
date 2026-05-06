'use strict';

/**
 * src/server.js — Local development HTTP server
 *
 * PURPOSE:
 *   Vercel runs api/streak.js as a serverless function in production.
 *   This file is a thin Express wrapper so you can test the same handler
 *   locally with `npm run dev` — no Vercel CLI required.
 *
 * ROUTES (match vercel.json rewrites exactly):
 *   GET /streak?username=X[&template=ember&palette=dark&font=inter&layout=row]
 *     → Calls api/streak.js handler → returns SVG
 *
 *   GET /health
 *     → Returns JSON { ok: true, uptime, cacheSize, timestamp }
 *
 * ENVIRONMENT VARIABLES (put these in a .env file — see .env.example):
 *   GITHUB_TOKEN        Required. GitHub PAT. Zero scopes needed for public data.
 *   PORT                Optional. HTTP port to listen on (default: 3000).
 *   CACHE_TTL_SECONDS   Optional. Cache lifetime in seconds (default: 3600).
 *
 * USAGE:
 *   npm run dev      ← uses nodemon — auto-restarts on file changes
 *   npm start        ← plain node, no auto-restart
 *
 * Then open: http://localhost:3000/streak?username=your-github-login
 */

require('dotenv').config(); // loads .env file into process.env

const express        = require('express');
const streakHandler  = require('../api/streak');
const cache          = require('./cache');

const app  = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// ── Global headers ────────────────────────────────────────────────────────────
// Set on every response for basic security hygiene.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff'); // stop MIME sniffing
  res.setHeader('X-Frame-Options', 'DENY');           // block iframe embedding
  next();
});

// ── Health check ──────────────────────────────────────────────────────────────
// Useful for confirming the server is alive and the cache is working.
app.get('/health', (req, res) => {
  res.json({
    ok:        true,
    uptime:    process.uptime(),   // seconds the server has been running
    cacheSize: cache.size(),       // number of active (non-expired) cache entries
    timestamp: new Date().toISOString(),
  });
});

// ── Streak card ───────────────────────────────────────────────────────────────
// Delegate directly to the same serverless function that Vercel will call.
// This means local behaviour is identical to production.
app.get('/streak', (req, res) => streakHandler(req, res));

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).type('text').send(
    'Not found.\n\nTry: http://localhost:' + PORT + '/streak?username=octocat'
  );
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\nGitHub Streak Tracker — dev server`);
  console.log(`→ http://localhost:${PORT}/streak?username=<your-github-login>`);
  console.log(`→ http://localhost:${PORT}/health\n`);

  if (!process.env.GITHUB_TOKEN) {
    console.warn('⚠  WARNING: GITHUB_TOKEN is not set — all requests will fail.');
    console.warn('   Copy .env.example to .env and add your token.\n');
  }
});
