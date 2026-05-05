/**
 * svg.js — Dynamic SVG card generator
 *
 * Produces a dark-themed GitHub-style stats card that shows:
 *   • Total Contributions
 *   • Current Streak  (with date range)
 *   • Longest Streak  (with date range)
 *
 * The card is a self-contained SVG string — no external fonts or assets are
 * fetched; everything is embedded so it renders correctly on GitHub README.
 */

'use strict';

const { formatDate } = require('./streak');

// ── Design tokens ────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#0d1117',           // GitHub dark background
  border: '#30363d',       // subtle border
  title: '#8b949e',        // muted label text
  value: '#e6edf3',        // primary value text
  accent: '#f78166',       // fire / streak color (coral-orange)
  accentAlt: '#58a6ff',    // blue accent (longest streak)
  accentGreen: '#3fb950',  // green (total contributions)
  divider: '#21262d',      // inner divider lines
  subtext: '#6e7681',      // date range sub-labels
};

const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

/**
 * Escape special XML characters so user data is safe inside SVG text nodes.
 */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Render one stat column inside the card.
 *
 * @param {object} opts
 * @param {number}  opts.x        - Centre X of the column
 * @param {number}  opts.y        - Top Y of the icon/value block
 * @param {string}  opts.icon     - Unicode emoji or symbol
 * @param {string}  opts.color    - Fill colour for icon + value
 * @param {string}  opts.label    - Small label above the value
 * @param {string}  opts.value    - Big number to display
 * @param {string}  [opts.sub]    - Optional sub-label (e.g. date range)
 */
function statColumn({ x, y, icon, color, label, value, sub }) {
  return `
    <!-- icon -->
    <text x="${x}" y="${y}" text-anchor="middle" font-size="26" fill="${color}">${icon}</text>
    <!-- label -->
    <text x="${x}" y="${y + 26}" text-anchor="middle"
          font-family="${FONT}" font-size="11" fill="${COLORS.title}" letter-spacing="0.5">
      ${escapeXml(label)}
    </text>
    <!-- value -->
    <text x="${x}" y="${y + 58}" text-anchor="middle"
          font-family="${FONT}" font-size="28" font-weight="700" fill="${color}">
      ${escapeXml(value)}
    </text>
    ${
      sub
        ? `<text x="${x}" y="${y + 78}" text-anchor="middle"
              font-family="${FONT}" font-size="10.5" fill="${COLORS.subtext}">
          ${escapeXml(sub)}
        </text>`
        : ''
    }
  `;
}

/**
 * Build and return the full SVG string for the streak card.
 *
 * @param {object} opts
 * @param {string} opts.username
 * @param {number} opts.totalContributions
 * @param {number} opts.currentStreak
 * @param {number} opts.longestStreak
 * @param {string|null} opts.streakStart
 * @param {string|null} opts.streakEnd
 * @param {string|null} opts.longestStreakStart
 * @param {string|null} opts.longestStreakEnd
 * @param {string|null} opts.lastContributionDate
 */
function generateSVG(opts) {
  const {
    username,
    totalContributions,
    currentStreak,
    longestStreak,
    streakStart,
    streakEnd,
    longestStreakStart,
    longestStreakEnd,
    lastContributionDate,
  } = opts;

  // Card dimensions
  const W = 495;
  const H = 195;

  // Column X positions (three equal sections)
  const col1X = Math.round(W * 0.165); // total contributions
  const col2X = Math.round(W * 0.5);   // current streak (centre)
  const col3X = Math.round(W * 0.835); // longest streak

  // Row start Y
  const rowY = 52;

  // Sub-label helpers
  const currentStreakSub =
    currentStreak > 0
      ? `${formatDate(streakStart)} – ${formatDate(streakEnd)}`
      : lastContributionDate
      ? `Last: ${formatDate(lastContributionDate)}`
      : 'No contributions yet';

  const longestStreakSub =
    longestStreak > 0
      ? `${formatDate(longestStreakStart)} – ${formatDate(longestStreakEnd)}`
      : '';

  // Animation: staggered fade-in for each column
  const fadeAnim = (delay) =>
    `<animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="${delay}s" fill="freeze"/>`;

  return `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${W}"
  height="${H}"
  viewBox="0 0 ${W} ${H}"
  role="img"
  aria-label="GitHub Streak Stats for ${escapeXml(username)}"
>
  <title>GitHub Streak Stats — ${escapeXml(username)}</title>

  <!-- ── Background ──────────────────────────────────────────────────── -->
  <rect width="${W}" height="${H}" rx="10" ry="10"
        fill="${COLORS.bg}" stroke="${COLORS.border}" stroke-width="1"/>

  <!-- ── Top title bar ────────────────────────────────────────────────── -->
  <text x="${W / 2}" y="22" text-anchor="middle"
        font-family="${FONT}" font-size="13" font-weight="600"
        fill="${COLORS.title}" letter-spacing="0.8">
    🔥 GitHub Streak Stats — ${escapeXml(username)}
  </text>

  <!-- ── Horizontal rule under title ──────────────────────────────────── -->
  <line x1="20" y1="32" x2="${W - 20}" y2="32"
        stroke="${COLORS.divider}" stroke-width="1"/>

  <!-- ── Vertical dividers between columns ───────────────────────────── -->
  <line x1="${Math.round(W / 3)}" y1="38" x2="${Math.round(W / 3)}" y2="${H - 14}"
        stroke="${COLORS.divider}" stroke-width="1"/>
  <line x1="${Math.round((W * 2) / 3)}" y1="38" x2="${Math.round((W * 2) / 3)}" y2="${H - 14}"
        stroke="${COLORS.divider}" stroke-width="1"/>

  <!-- ── Column 1: Total Contributions ───────────────────────────────── -->
  <g opacity="0">${fadeAnim(0.1)}
    ${statColumn({
      x: col1X, y: rowY,
      icon: '📊',
      color: COLORS.accentGreen,
      label: 'TOTAL CONTRIBUTIONS',
      value: totalContributions.toLocaleString(),
      sub: 'Last 365 days',
    })}
  </g>

  <!-- ── Column 2: Current Streak ─────────────────────────────────────── -->
  <g opacity="0">${fadeAnim(0.25)}
    ${statColumn({
      x: col2X, y: rowY,
      icon: '🔥',
      color: COLORS.accent,
      label: 'CURRENT STREAK',
      value: `${currentStreak} day${currentStreak !== 1 ? 's' : ''}`,
      sub: currentStreakSub,
    })}
  </g>

  <!-- ── Column 3: Longest Streak ─────────────────────────────────────── -->
  <g opacity="0">${fadeAnim(0.4)}
    ${statColumn({
      x: col3X, y: rowY,
      icon: '⚡',
      color: COLORS.accentAlt,
      label: 'LONGEST STREAK',
      value: `${longestStreak} day${longestStreak !== 1 ? 's' : ''}`,
      sub: longestStreakSub,
    })}
  </g>

  <!-- ── Footer ───────────────────────────────────────────────────────── -->
  <text x="${W / 2}" y="${H - 6}" text-anchor="middle"
        font-family="${FONT}" font-size="9.5" fill="${COLORS.subtext}">
    Updated ${new Date().toUTCString().replace(' GMT', ' UTC')}
  </text>
</svg>`;
}

module.exports = { generateSVG };
