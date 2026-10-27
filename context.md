# GitHub Streak Tracker & Designer — Complete Master Context

This is the **Master Context File** for the GitHub Streak Tracker and Designer ecosystem. 
If you are an AI assistant reading this, this document contains the exhaustive, file-by-file, function-by-function breakdown of the entire architecture spanning two repositories. Use this context to perform zero-shot, error-free modifications, additions, or debugging.

---

## 🏗️ MACRO ARCHITECTURE: The "Split-Brain" System

The project is deliberately split into two repositories to separate **secure data processing** from **risk-free visual design**.

1.  **Backend API (`github-streak-tracker`)**: 
    *   **Role**: Vercel Serverless Function. 
    *   **Responsibilities**: Holds the secret `GITHUB_TOKEN`, queries GitHub's GraphQL API, calculates streak math, and renders the live SVG image.
    *   **Traffic**: Called exclusively when a user views their GitHub Profile README.

2.  **Frontend Designer (`github-streak-designer`)**: 
    *   **Role**: Static HTML/CSS/JS Website.
    *   **Responsibilities**: Visual editor with sliders, color pickers, and live "fake" SVG previews.
    *   **Traffic**: Accessed by the user in the browser to design their card and generate the Markdown URL string.

---

## 1️⃣ DEEP DIVE: The Backend (`github-streak-tracker`)

This repository is built using pure Node.js (CommonJS). **No build tools (Webpack, TypeScript, Babel) are permitted.**

### A. The Entry Point: `api/streak.js`
This is the Vercel serverless handler `(req, res)`.
1.  **Input Validation**: Strict validation against `VALID_TEMPLATES` (`ember`, `frost`, `neon`), `VALID_PALETTES`, `VALID_LAYOUTS`, and `VALID_FONTS`. Custom colors (`bg`, `accent`, `border`) must match `^#[0-9a-fA-F]{6}$`.
2.  **Palette Resolution**: If `palette=custom`, it merges the baseline palette with the provided custom hex overrides.
    *   **The PALETTES object structure:** Every single palette MUST define these 9 exact keys:
        `{ bg, border, title, value, accent, accentAlt, accentGreen, subtext, divider }`
3.  **Caching**: Uses `src/cache.js`. The cache key is strictly the `username` (not the full parameter set). This is an intentional design choice so all layouts for a user share the same underlying data. If a `HIT` occurs, it instantly returns the cached data object to save GitHub API calls.
4.  **Execution**: Calls `github.queryContributionData(username)` -> `streak.calculateStreaks(data)` -> `templates.getTemplate(templateName)(data, options)`.
5.  **Headers**: Returns `Content-Type: image/svg+xml; charset=utf-8` and `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`.

### B. Data Fetching: `src/github.js`
*   Uses `node-fetch`.
*   Authenticates via `Bearer ${process.env.GITHUB_TOKEN}`.
*   **GraphQL Query**: Fetches the `user.contributionsCollection.contributionCalendar.weeks`.
*   **Transformation**: Flattens the nested weeks/days structure into a 1D array of days: `[{ date: '2026-05-06', contributionCount: 4 }, ...]`.

### C. Streak Math Engine: `src/streak.js`
*   Pure function: `calculateStreaks(contributionDays)`.
*   Iterates through the 1D array.
*   **Total**: Sums all `contributionCount`.
*   **Current Streak**: Counts backwards from today (or yesterday). If `count > 0`, it increments. If `count === 0`, the current streak breaks.
*   **Longest Streak**: Tracks the highest streak achieved across the entire dataset.
*   **Returns**: An object containing `totalContributions`, `currentStreak`, `longestStreak`, and their respective start/end dates.

### D. The Caching Layer: `src/cache.js`
*   A simple `Map()`.
*   Stores objects: `{ data, timestamp }`.
*   TTL (Time-To-Live) is controlled by `process.env.CACHE_TTL_SECONDS` (defaults to 3600 seconds / 1 hour).
*   Prevents burning the 5,000 req/hour GitHub API limit.

### E. The CLI Generator: `src/generate.js`
*   Allows local generation of SVGs bypassing the HTTP server.
*   Usage: `node src/generate.js <username> <output.svg> <template> <palette> <layout> <font>`.
*   Note: GitHub Actions typically only passes `<username>` and `<output.svg>`. The rest are optional defaults but can be passed via environment variables (e.g., `STREAK_TEMPLATE`).

---

## 2️⃣ DEEP DIVE: The Frontend (`github-streak-designer`)

This repository is 100% static vanilla JS. It relies on the DOM and a central state machine.

### A. The Engine: `js/customizer.js`
1.  **State Object**:
    ```javascript
    var state = {
      username: 'user', template: 'neon', palette: 'dracula', layout: 'row', font: 'inter',
      custom: { bg: '#000', accent: '#fff', ... }, // For custom overrides
      previewTotal: 1247, previewCurrent: 42, previewLongest: 87 // FAKE DATA FOR PREVIEW
    };
    ```
2.  **API_BASE Constant**:
    Where does the designer point? The URL builder relies on `API_BASE` defined at the top of `js/customizer.js`:
    ```javascript
    var API_BASE = 'https://github-streak-tracker-for-all.vercel.app';
    ```
3.  **The Render Loop**: `render()` is called on *every* DOM change. It fetches the UMD template function from the global `window.Templates` object, passes the fake `previewX` data and the resolved `state` options, and injects the resulting SVG string into `$('preview-wrap').innerHTML`.
4.  **URL Builder**: `buildURL()` reads the `state` and constructs the final URL pointing to `API_BASE`. Custom colors are URL-encoded (`%23`).

### B. HTML Script Loading Order
Because we use vanilla UMD files with no bundler, the loading order in `<head>` is strict:
1. `<script src="js/icons.js"></script>`
2. `<script src="js/templates/ember.js"></script>` (and all other templates)
3. `<script src="js/palettes.js"></script>`
4. `<script src="js/customizer.js"></script>` (This initializes the app)

---

## 3️⃣ THE SHARED DNA: Templates, Icons, Palettes

The core philosophy of this project is the **Rule of Symmetry**. The visual logic is identical in both repositories.

### A. The Universal Module Definition (UMD) Boilerplate
All files in `src/templates/` (Backend) and `js/templates/` (Frontend) MUST be wrapped in this exact UMD boilerplate so they work flawlessly in Node.js and the Browser without build steps:

```javascript
'use strict';
/* global globalThis, window */
(function (root, factory) {
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    // Node.js (Backend)
    module.exports = factory(require('../icons'));
  } else {
    // Browser (Frontend Designer)
    root.Templates = root.Templates || {};
    root.Templates.ember = factory(root.Icons); // replace 'ember' with template name
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function (icons) {
  
  // Return the main render function
  return function renderEmber(data, options) {
     return `<svg>...</svg>`;
  }
});
```

### B. SVG Icons (`icons.js`)
GitHub's image proxy strips external images, emojis, and remote fonts. Therefore, icons (Flame, Bolt, Chart) are hardcoded as raw SVG `<path>` strings. 
Here are the actual SVG path `d="..."` values used. (Note: The literal text "FILL" is a placeholder replaced dynamically with the chosen accent color).

*   **flame** (Current Streak):
    `<path fill-rule="evenodd" clip-rule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177A7.547 7.547 0 0 1 6.648 6.61a.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248zm.66 11.964a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.545 3.75 3.75 0 0 1 3.255 3.717z" fill="FILL"/>`
*   **bolt** (Longest Streak):
    `<path fill-rule="evenodd" clip-rule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143z" fill="FILL"/>`
*   **barChart** (Total Contributions):
    `<path fill-rule="evenodd" clip-rule="evenodd" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75zm6.75-4.5c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625zm6.75-4.5c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125z" fill="FILL"/>`

### C. Layout Coordinate Mechanics (`LAYOUTS`)
Inside every template file, a `LAYOUTS` object dictates exact SVG X/Y coordinates. Without these precise numbers, the cards will not align.
*   `yIcon`: Bottom of the 24x24 icon (icon top = `yIcon - 24`).
*   `yLabel`: Text baseline of the small ALL-CAPS label.
*   `yValue`: Text baseline of the big number.
*   `yDate`: Text baseline of the date sub-label (if `null`, skip rendering date).

**Exact Layout Values Used:**
```javascript
var LAYOUTS = {
  row: {
    W: 495, H: 170, titleY: 19, dividerY: 28,
    cols: [
      { x: 82,  yIcon: 60, yLabel: 78, yValue: 114, yDate: 132 },
      { x: 248, yIcon: 60, yLabel: 78, yValue: 114, yDate: 132 },
      { x: 413, yIcon: 60, yLabel: 78, yValue: 114, yDate: 132 },
    ],
    vDividers: [{ x:165, y1:28, y2:160 }, { x:330, y1:28, y2:160 }],
    hDividers: [],
  },
  stacked: {
    W: 495, H: 258, titleY: null, dividerY: null,
    cols: [
      { x: 248, yIcon: 46,  yLabel: 64,  yValue: 98,  yDate: 114 },
      { x: 248, yIcon: 130, yLabel: 148, yValue: 182, yDate: 198 },
      { x: 248, yIcon: 214, yLabel: 232, yValue: 250, yDate: null },
    ],
    vDividers: [],
    hDividers: [{ y:120, x1:30, x2:465 }, { y:204, x1:30, x2:465 }],
  },
  hero: {
    W: 495, H: 195, titleY: 19, dividerY: 28,
    cols: [
      { x: 82,  yIcon: 80,  yLabel: 100, yValue: 128, yDate: 144, scale: 0.8  },
      { x: 248, yIcon: 54,  yLabel: 74,  yValue: 118, yDate: 138, scale: 1.25 },
      { x: 413, yIcon: 80,  yLabel: 100, yValue: 128, yDate: 144, scale: 0.8  },
    ],
  }
};
```

---

## 🤖 AI ASSISTANT INSTRUCTIONS: How to Modify the Codebase

If the user asks you to expand this project, you MUST follow these protocols:

### 🟢 Scenario 1: Adding a New Color Palette
1.  **Backend**: Open `api/streak.js`. Add the 9 hex tokens (`bg, border, title, value, accent, accentAlt, accentGreen, subtext, divider`) to the `PALETTES` object. Add the name to `VALID_PALETTES`.
2.  **Frontend**: Open `js/palettes.js`. Add the exact same 9 hex tokens to the `Palettes` object.

### 🟢 Scenario 2: Adding a New Template (e.g., `glass.js`)
1.  **Create Template**: Create a new file using the exact UMD boilerplate. Define grid logic for `row`, `stacked`, and `hero` inside it (usually mapped identically to the coordinates above).
2.  **Backend**: Save to `src/templates/glass.js`. Require it in `src/templates/index.js`. Add to `VALID_TEMPLATES` in `api/streak.js`.
3.  **Frontend**: Save identical file to `js/templates/glass.js`. Add `<script src="js/templates/glass.js"></script>` to `customizer.html` and `index.html` (after `icons.js` but before `customizer.js`). Add a visual button to `customizer.html` with `data-template="glass"`.

---

## ❌ HARD CONSTRAINTS

When generating code or making edits, AI must adhere strictly to these rules:

- Never use emojis in SVG output, not even as fallback. GitHub's proxy will break them.
- Never introduce a bundler (Webpack/Vite), build step, or TypeScript.
- Never use `html2canvas` or `dom-to-image`. All rendering must be pure SVG string generation.
- Never use `fetch()` in the browser templates — they are pure, synchronous functions only.
- Card dimensions are strictly locked: always 495×170px for `row`, 495×195px for `hero`, and 495×258px for `stacked`.
- `GITHUB_TOKEN` never touches the frontend repo under any circumstance.
- Template files (`src/templates/*.js`) must be byte-for-byte identical between both repositories.
