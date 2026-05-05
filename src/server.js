/**
 * server.js — Express HTTP server
 *
 * Routes:
 *   GET /streak?username=<login>
 *     → Returns a dynamic SVG streak card for the given GitHub user.
 *       Query params:
 *         username (required)  — GitHub login
 *
 *   GET /health
 *     → Returns JSON { ok: true, uptime, cacheSize }
 *
 * Environment variables:
 *   GITHUB_TOKEN     — Required. GitHub PAT (public_repo or no scope needed)
 *   PORT             — HTTP port (default 3000)
 *   CACHE_TTL_SECONDS — Seconds to cache each user's data (default 3600)
 */

'use strict';

require('dotenv').config();

const express = require('express');
const { fetchContributions } = require('./github');
const { calculateStreaks } = require('./streak');
const { generateSVG } = require('./svg');
const cache = require('./cache');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// ── Security / performance headers ─────────────────────────────────────────

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// ── Health check ────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    cacheSize: cache.size(),
    timestamp: new Date().toISOString(),
  });
});

// ── Main streak endpoint ─────────────────────────────────────────────────────

app.get('/streak', async (req, res) => {
  const username = (req.query.username || '').trim();

  if (!username) {
    return res
      .status(400)
      .type('text/plain')
      .send('Missing required query parameter: ?username=<github-login>');
  }

  // Sanitise: GitHub usernames are alphanumeric + hyphens, max 39 chars
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username)) {
    return res
      .status(400)
      .type('text/plain')
      .send('Invalid GitHub username format.');
  }

  try {
    const cacheKey = `streak:${username.toLowerCase()}`;
    let svgString = cache.get(cacheKey);

    if (!svgString) {
      // 1. Fetch from GitHub
      const data = await fetchContributions(
        username,
        process.env.GITHUB_TOKEN
      );

      // 2. Calculate streaks
      const streakData = calculateStreaks(data.contributionDays);

      // 3. Build SVG
      svgString = generateSVG({
        username: data.login,
        totalContributions: streakData.totalContributions,
        ...streakData,
      });

      // 4. Cache it
      cache.set(cacheKey, svgString);

      console.log(
        `[${new Date().toISOString()}] Generated fresh card for "${username}" ` +
          `(streak: ${streakData.currentStreak}, longest: ${streakData.longestStreak}, ` +
          `total: ${streakData.totalContributions})`
      );
    } else {
      console.log(
        `[${new Date().toISOString()}] Served cached card for "${username}"`
      );
    }

    // Respond with SVG — tell GitHub's image proxy to refresh hourly
    res
      .status(200)
      .type('image/svg+xml')
      .setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600')
      .setHeader('Vary', 'Accept-Encoding')
      .send(svgString);
  } catch (err) {
    console.error(`[ERROR] ${err.message}`);

    // Return an error SVG so the README shows something useful
    const errorSVG = buildErrorSVG(username, err.message);
    res.status(500).type('image/svg+xml').send(errorSVG);
  }
});

// ── 404 handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).type('text/plain').send('Not found. Try /streak?username=octocat');
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`GitHub Streak Tracker running on http://localhost:${PORT}`);
  console.log(`  → /streak?username=<github-login>`);
  console.log(`  → /health`);
  if (!process.env.GITHUB_TOKEN) {
    console.warn('\n⚠  GITHUB_TOKEN is not set. Requests will fail.\n');
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildErrorSVG(username, message) {
  const safe = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="120" viewBox="0 0 495 120">
  <rect width="495" height="120" rx="10" fill="#0d1117" stroke="#30363d" stroke-width="1"/>
  <text x="248" y="45" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="14" fill="#f78166">⚠ GitHub Streak Tracker — Error</text>
  <text x="248" y="70" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="11" fill="#8b949e">User: ${safe(username)}</text>
  <text x="248" y="92" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="10" fill="#6e7681">${safe(message.slice(0, 80))}</text>
</svg>`;
}
