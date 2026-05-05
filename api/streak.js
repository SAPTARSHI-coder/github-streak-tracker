/**
 * api/streak.js — Vercel Serverless Function
 *
 * Endpoint:  GET /streak?username=<github-login>&theme=<dark|light|radical|tokyonight>
 *
 * Vercel automatically maps files inside /api/ to HTTP routes.
 * This file handles the /streak route (configured in vercel.json rewrites).
 *
 * No listen() call — Vercel manages the HTTP lifecycle.
 *
 * Environment variables (set in Vercel Dashboard → Settings → Env Vars):
 *   GITHUB_TOKEN       Required. GitHub PAT (no scopes needed for public data)
 *   CACHE_TTL_SECONDS  Optional. Seconds to cache per user (default 3600)
 */

'use strict';

const { fetchContributions } = require('../src/github');
const { calculateStreaks }   = require('../src/streak');
const { generateSVG }        = require('../src/svg');
const cache                  = require('../src/cache');

// ── Username validation ───────────────────────────────────────────────────────
// GitHub: alphanumeric + hyphens, 1-39 chars, no leading/trailing hyphen
const VALID_USERNAME = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

const VALID_THEMES = new Set(['dark', 'light', 'radical', 'tokyonight']);

// ── Main handler ─────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  // CORS — allow GitHub's image proxy and any browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  // Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Only GET allowed
  if (req.method !== 'GET') {
    return res.status(405).setHeader('Allow', 'GET').end('Method Not Allowed');
  }

  // ── Parse & validate query params ──────────────────────────────────────────
  const username = (req.query.username || '').trim();
  const theme    = VALID_THEMES.has((req.query.theme || '').toLowerCase())
    ? req.query.theme.toLowerCase()
    : 'dark';

  if (!username) {
    return res
      .status(400)
      .setHeader('Content-Type', 'text/plain')
      .end('Missing required query parameter: ?username=<github-login>');
  }

  if (!VALID_USERNAME.test(username)) {
    return res
      .status(400)
      .setHeader('Content-Type', 'text/plain')
      .end('Invalid GitHub username format.');
  }

  if (!process.env.GITHUB_TOKEN) {
    return res
      .status(500)
      .setHeader('Content-Type', 'text/plain')
      .end('Server misconfiguration: GITHUB_TOKEN is not set.');
  }

  // ── Serve from cache if available ──────────────────────────────────────────
  const cacheKey = `streak:${username.toLowerCase()}:${theme}`;
  const cached   = cache.get(cacheKey);

  if (cached) {
    return sendSVG(res, cached, true);
  }

  // ── Fetch → Calculate → Render ─────────────────────────────────────────────
  try {
    const startMs = Date.now();

    const data       = await fetchContributions(username, process.env.GITHUB_TOKEN);
    const streakData = calculateStreaks(data.contributionDays);

    const svg = generateSVG({
      username : data.login,
      totalContributions: streakData.totalContributions,
      theme,
      ...streakData,
    });

    cache.set(cacheKey, svg);

    console.log(
      `[streak] ${data.login} | streak=${streakData.currentStreak} ` +
      `longest=${streakData.longestStreak} total=${streakData.totalContributions} ` +
      `theme=${theme} time=${Date.now() - startMs}ms`
    );

    return sendSVG(res, svg, false);
  } catch (err) {
    console.error(`[streak] ERROR for "${username}": ${err.message}`);
    return sendSVG(res, buildErrorSVG(username, err.message), false, 500);
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Send the SVG with correct headers.
 * @param {object}  res
 * @param {string}  svg
 * @param {boolean} fromCache
 * @param {number}  [status=200]
 */
function sendSVG(res, svg, fromCache, status = 200) {
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  // Cache-Control: public so CDN/proxy edge caches work; SWR for stale-safe reads
  res.setHeader(
    'Cache-Control',
    'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
  );
  res.setHeader('X-Cache', fromCache ? 'HIT' : 'MISS');
  return res.status(status).end(svg);
}

/**
 * Produce a minimal error SVG so the README still shows something useful.
 */
function buildErrorSVG(username, message) {
  const esc = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="120" viewBox="0 0 495 120">
  <rect width="495" height="120" rx="10" fill="#0d1117" stroke="#30363d" stroke-width="1"/>
  <text x="248" y="42" text-anchor="middle" font-family="Arial,sans-serif"
        font-size="14" font-weight="600" fill="#f78166">⚠ Streak Tracker — Error</text>
  <text x="248" y="66" text-anchor="middle" font-family="Arial,sans-serif"
        font-size="11" fill="#8b949e">User: ${esc(username)}</text>
  <text x="248" y="90" text-anchor="middle" font-family="Arial,sans-serif"
        font-size="10" fill="#6e7681">${esc(String(message).slice(0, 90))}</text>
</svg>`;
}
