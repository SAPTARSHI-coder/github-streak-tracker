# 🖼️ `src/svg.js` — SVG Card Generator

This module turns streak numbers into a visual card. It's pure string generation — no DOM, no canvas, no external libraries.

---

## What It Produces

A 495×195 px self-contained SVG with:

```
┌────────────────────────────────────────────────────────────┐
│         🔥 GitHub Streak Stats — octocat                   │
├──────────────────┬──────────────────┬──────────────────────┤
│  📊              │  🔥              │  ⚡                  │
│ TOTAL            │ CURRENT STREAK   │ LONGEST STREAK       │
│ CONTRIBUTIONS    │                  │                      │
│  1,234           │   42 days        │   87 days            │
│ Last 365 days    │ Jan 1 – Feb 11   │ Jun 1 – Aug 26       │
└──────────────────┴──────────────────┴──────────────────────┘
   Updated Tue, 06 May 2025 00:00:00 UTC
```

---

## Exported Function

```js
const { generateSVG } = require('./svg');

const svg = generateSVG({
  username:           'octocat',
  totalContributions: 1234,
  currentStreak:      42,
  longestStreak:      87,
  streakStart:        '2025-01-01',
  streakEnd:          '2025-02-11',
  longestStreakStart:  '2024-06-01',
  longestStreakEnd:    '2024-08-26',
  lastContributionDate: '2025-02-11',
  theme:              'dark',          // optional, defaults to 'dark'
});
// → Returns a string starting with '<svg xmlns=…'
```

---

## File Structure

```
src/svg.js
│
├── THEMES {}          ← Color palettes for dark/light/radical/tokyonight
├── FONT               ← System font stack string
│
├── escapeXml()        ← Safety: escape user data before putting in SVG
├── statColumn()       ← Renders one of the three stat columns
└── generateSVG()      ← Main function: assembles the full SVG string
```

---

## How `statColumn()` Works

`statColumn` is a helper that renders one column (icon + label + value + sub-label):

```js
statColumn({
  x: 248,             // horizontal center of this column
  y: 52,              // vertical start
  icon: '🔥',
  color: '#f78166',   // accent color for icon + number
  colors: C,          // full theme palette (for label and subtext colors)
  label: 'CURRENT STREAK',
  value: '42 days',
  sub: 'Jan 1 – Feb 11',
})
```

Output (simplified):
```svg
<text x="248" y="52" fill="#f78166">🔥</text>
<text x="248" y="78" fill="#8b949e">CURRENT STREAK</text>
<text x="248" y="110" fill="#f78166">42 days</text>
<text x="248" y="130" fill="#6e7681">Jan 1 – Feb 11</text>
```

The `colors: C` argument gives it access to `title` color (for the label) and `subtext` color (for the date range), since those don't use the accent color.

---

## The Theme System

All four themes are stored in the `THEMES` object:

```js
const THEMES = {
  dark:       { bg, border, title, value, accent, accentAlt, accentGreen, divider, subtext },
  light:      { … },
  radical:    { … },
  tokyonight: { … },
};
```

Inside `generateSVG`, the palette is resolved once:

```js
const C = THEMES[theme] || THEMES.dark;
```

Every color reference in the SVG template then uses `C.xxx` (e.g. `C.bg`, `C.accent`) — so adding a new theme is just adding a new object, nothing else changes.

---

## The Animation

Each column fades in sequentially:

```js
const fadeAnim = (delay) =>
  `<animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="${delay}s" fill="freeze"/>`;
```

| Column | Delay |
|--------|-------|
| Total Contributions | 0.1s |
| Current Streak | 0.25s |
| Longest Streak | 0.4s |

The column wrapper starts at `opacity="0"` and the animation brings it to `1`. `fill="freeze"` means it stays at `1` after the animation ends.

This is **SMIL animation** (SVG's built-in animation spec). It works in browsers and in GitHub's README image proxy. CSS animations don't work inside SVG when served as `<img>`.

---

## Why System Fonts Only?

```js
const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
```

GitHub proxies images through `camo.githubusercontent.com` which blocks external font requests (Google Fonts, etc.). SVG images embedded via `<img>` tags cannot load external resources for security reasons. System fonts are always available.

---

## `escapeXml()` — Security

```js
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

This is applied to **every user-controlled value** (`username`, dates, streak counts as strings) before they're embedded in the SVG. Without it, a username like `"><script>` could inject malicious SVG content.

---

## Layout Numbers

```
W = 495    Card width (px)
H = 195    Card height (px)

col1X = 82    Total Contributions column center  (W × 0.165)
col2X = 248   Current Streak column center       (W × 0.5)
col3X = 413   Longest Streak column center       (W × 0.835)

rowY  = 52    Top of the icon row

Dividers at:  W/3 = 165    and    W×2/3 = 330
```

---

## Full SVG Structure

```svg
<svg width="495" height="195">
  <title>GitHub Streak Stats — username</title>

  <!-- Background -->
  <rect …fill="C.bg" stroke="C.border"/>

  <!-- Title -->
  <text …fill="C.title">🔥 GitHub Streak Stats — username</text>

  <!-- Horizontal divider under title -->
  <line …stroke="C.divider"/>

  <!-- Vertical dividers between columns -->
  <line x1="165" …/>
  <line x1="330" …/>

  <!-- Column 1: Total Contributions -->
  <g opacity="0"><animate begin="0.1s"/>
    <text>📊</text>
    <text>TOTAL CONTRIBUTIONS</text>
    <text>1,234</text>
    <text>Last 365 days</text>
  </g>

  <!-- Column 2: Current Streak -->
  <g opacity="0"><animate begin="0.25s"/>…</g>

  <!-- Column 3: Longest Streak -->
  <g opacity="0"><animate begin="0.4s"/>…</g>

  <!-- Footer timestamp -->
  <text>Updated Tue, 06 May 2025 00:00:00 UTC</text>
</svg>
```
