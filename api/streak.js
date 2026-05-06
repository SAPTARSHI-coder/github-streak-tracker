'use strict';

/**
 * api/streak.js — Vercel Serverless Function
 *
 * Route (configured in vercel.json):
 *   GET /streak?username=X&template=ember&palette=dark&font=inter&layout=row
 *
 * ALL SUPPORTED QUERY PARAMETERS:
 *   username   (required) — GitHub login, e.g. "SAPTARSHI-coder"
 *   template   (optional) — "ember" | "frost" | "neon"          default: ember
 *   palette    (optional) — "dark" | "dracula" | "catppuccin" | "nord" | "light" | "custom"
 *                                                                default: dark
 *   font       (optional) — "inter" | "jetbrains" | "spacegrotesk" | "mono"
 *                                                                default: inter
 *   layout     (optional) — "row" | "stacked" | "hero"          default: row
 *
 *   Custom color overrides (only used when palette=custom):
 *   bg         — Card background color,  e.g. "#0d1117"
 *   accent     — Current streak color,   e.g. "#f78166"
 *   border     — Card border color,      e.g. "#30363d"
 *
 * ENVIRONMENT VARIABLES (set in Vercel Dashboard):
 *   GITHUB_TOKEN        Required. Any GitHub PAT — zero scopes needed for public data.
 *   CACHE_TTL_SECONDS   Optional. How many seconds to cache each user's SVG (default: 3600).
 *
 * HOW IT WORKS (high level):
 *   1. Validate all query params
 *   2. Check the in-memory cache — if we have a fresh SVG, return it immediately
 *   3. Call GitHub's GraphQL API to get the last 365 days of contribution data
 *   4. Calculate current streak, longest streak, total contributions
 *   5. Pick the template function and call it with data + options
 *   6. Cache the SVG string, then stream it to the client
 */

const { fetchContributions } = require('../src/github');
const { calculateStreaks }   = require('../src/streak');
const { getTemplate }        = require('../src/templates/index');
const cache                  = require('../src/cache');

// ── Input validation ──────────────────────────────────────────────────────────
// GitHub usernames: 1-39 chars, alphanumeric + hyphens, no leading/trailing hyphen
const VALID_USERNAME  = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
const VALID_TEMPLATES = new Set(['ember', 'frost', 'neon']);
const VALID_PALETTES  = new Set(['dark', 'dracula', 'catppuccin', 'nord', 'light', 'custom']);
const VALID_FONTS     = new Set(['inter', 'jetbrains', 'spacegrotesk', 'mono']);
const VALID_LAYOUTS   = new Set(['row', 'stacked', 'hero']);
const VALID_HEX       = /^#[0-9a-fA-F]{6}$/; // must be exactly "#RRGGBB"

// ── Predefined color palettes ─────────────────────────────────────────────────
// Each palette has 9 color tokens used by the templates.
const PALETTES = {
  dark: {
    bg: '#0d1117', border: '#30363d', title: '#8b949e', value: '#e6edf3',
    accent: '#f78166',      // current streak — coral orange
    accentAlt: '#58a6ff',   // longest streak — blue
    accentGreen: '#3fb950', // total contributions — green
    subtext: '#6e7681', divider: '#21262d',
  },
  dracula: {
    bg: '#282a36', border: '#6272a4', title: '#8be9fd', value: '#f8f8f2',
    accent: '#ff79c6', accentAlt: '#bd93f9', accentGreen: '#50fa7b',
    subtext: '#6272a4', divider: '#44475a',
  },
  catppuccin: {
    bg: '#1e1e2e', border: '#313244', title: '#cdd6f4', value: '#cdd6f4',
    accent: '#cba6f7', accentAlt: '#89dceb', accentGreen: '#a6e3a1',
    subtext: '#7f849c', divider: '#313244',
  },
  nord: {
    bg: '#2e3440', border: '#3b4252', title: '#d8dee9', value: '#eceff4',
    accent: '#88c0d0', accentAlt: '#81a1c1', accentGreen: '#a3be8c',
    subtext: '#4c566a', divider: '#3b4252',
  },
  light: {
    bg: '#ffffff', border: '#d0d7de', title: '#57606a', value: '#1f2328',
    accent: '#cf222e', accentAlt: '#0969da', accentGreen: '#1a7f37',
    subtext: '#8c959f', divider: '#eaeef2',
  },
};

// ── Font stacks ───────────────────────────────────────────────────────────────
// These are CSS font-family strings embedded directly in the SVG.
// GitHub's image proxy doesn't load external fonts, so we list common system
// fallbacks that look similar.
const FONT_STACKS = {
  inter:        "'Inter', 'Helvetica Neue', Arial, sans-serif",
  jetbrains:    "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  spacegrotesk: "'Space Grotesk', 'Segoe UI', sans-serif",
  mono:         "'Courier New', Courier, monospace",
};

// ── Main handler ──────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // Allow GitHub's image proxy and browsers to call this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  // Browsers send OPTIONS before cross-origin requests — just say OK
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).setHeader('Allow', 'GET').end('Method Not Allowed');
  }

  // ── 1. Read and sanitise query params ────────────────────────────────────────
  const q        = req.query || {};
  const username = (q.username || '').trim();

  // If the param is not in our allowed set, fall back to the default
  const template = VALID_TEMPLATES.has(q.template) ? q.template : 'ember';
  const palette  = VALID_PALETTES.has(q.palette)   ? q.palette  : 'dark';
  const font     = VALID_FONTS.has(q.font)          ? q.font     : 'inter';
  const layout   = VALID_LAYOUTS.has(q.layout)      ? q.layout   : 'row';

  if (!username) {
    return res.status(400).type('text').end(
      'Missing required param: ?username=your-github-login'
    );
  }
  if (!VALID_USERNAME.test(username)) {
    return res.status(400).type('text').end(
      'Invalid GitHub username. Must be 1-39 alphanumeric chars or hyphens.'
    );
  }
  if (!process.env.GITHUB_TOKEN) {
    return res.status(500).type('text').end(
      'Server misconfiguration: GITHUB_TOKEN environment variable is not set.'
    );
  }

  // ── 2. Build the color palette for this request ───────────────────────────────
  let colors;
  if (palette === 'custom') {
    // Start from the dark palette, then apply any valid hex overrides from the URL
    colors = { ...PALETTES.dark };
    const hexParam = (key) => {
      const raw = (q[key] || '').replace(/^%23/, '#'); // handle URL-encoded #
      return VALID_HEX.test(raw) ? raw : null;
    };
    if (hexParam('bg'))     colors.bg     = hexParam('bg');
    if (hexParam('accent')) colors.accent = hexParam('accent');
    if (hexParam('border')) colors.border = hexParam('border');
  } else {
    colors = { ...PALETTES[palette] };
  }

  // ── 3. Check cache before hitting GitHub ─────────────────────────────────────
  // Cache key includes all options so different combos each get their own entry
  const cacheKey = `streak:${username.toLowerCase()}:${template}:${palette}:${font}:${layout}`;
  const cached   = cache.get(cacheKey);
  if (cached) {
    return sendSVG(res, cached, /* fromCache= */ true);
  }

  // ── 4. Fetch → Calculate → Render ────────────────────────────────────────────
  try {
    const t0   = Date.now();
    const data = await fetchContributions(username, process.env.GITHUB_TOKEN);

    // calculateStreaks returns: currentStreak, longestStreak, totalContributions,
    // streakStart, streakEnd, longestStreakStart, longestStreakEnd, lastContributionDate
    const streak = calculateStreaks(data.contributionDays);

    // getTemplate('ember') returns the ember render function, etc.
    const renderFn = getTemplate(template);

    const svg = renderFn(
      // Data object — what to show in the card
      {
        username:           data.login,
        totalContributions: streak.totalContributions,
        currentStreak:      streak.currentStreak,
        longestStreak:      streak.longestStreak,
        streakStart:        streak.streakStart,
        streakEnd:          streak.streakEnd,
        longestStreakStart:  streak.longestStreakStart,
        longestStreakEnd:    streak.longestStreakEnd,
        lastContributionDate: streak.lastContributionDate,
      },
      // Options object — how the card should look
      {
        colors,
        font:         FONT_STACKS[font],
        layout,
        borderRadius: 10,
        borderWidth:  1,
        borderStyle:  'solid',
      }
    );

    cache.set(cacheKey, svg);

    console.log(
      `[streak] user=${data.login} template=${template} palette=${palette} ` +
      `layout=${layout} streak=${streak.currentStreak} ` +
      `longest=${streak.longestStreak} total=${streak.totalContributions} ` +
      `time=${Date.now() - t0}ms`
    );

    return sendSVG(res, svg, false);
  } catch (err) {
    console.error(`[streak] ERROR for "${username}": ${err.message}`);
    return sendSVG(res, errorSVG(username, err.message), false, 500);
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Send the SVG string with the correct HTTP headers.
 * Cache-Control tells GitHub's CDN to serve this for up to 1 hour.
 * stale-while-revalidate means old content shows while fresh data is fetched.
 */
function sendSVG(res, svg, fromCache, status = 200) {
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
  );
  res.setHeader('X-Cache', fromCache ? 'HIT' : 'MISS');
  return res.status(status).end(svg);
}

/**
 * If something goes wrong we still return a valid SVG — that way the README
 * shows an error card instead of a broken image icon.
 */
function errorSVG(username, message) {
  const e = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="120" viewBox="0 0 495 120">
  <rect width="495" height="120" rx="10" fill="#0d1117" stroke="#30363d" stroke-width="1"/>
  <text x="248" y="44" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="600" fill="#f78166">Streak Tracker — Error</text>
  <text x="248" y="68" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#8b949e">User: ${e(username)}</text>
  <text x="248" y="92" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#6e7681">${e(String(message).slice(0, 90))}</text>
</svg>`;
}
