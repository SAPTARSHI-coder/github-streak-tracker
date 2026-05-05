# 🎨 Customization Guide

Everything you can change without breaking the system — colors, themes, layout, card size, adding new stats.

---

## 1. Switching Themes (No Code Needed)

Just change the `theme` query parameter in your README URL:

```markdown
<!-- Dark (default) -->
![Streak](https://github-streak-tracker-for-all.vercel.app/api/streak?username=YOU)

<!-- Light -->
![Streak](https://github-streak-tracker-for-all.vercel.app/api/streak?username=YOU&theme=light)

<!-- Radical (neon pink) -->
![Streak](https://github-streak-tracker-for-all.vercel.app/api/streak?username=YOU&theme=radical)

<!-- Tokyo Night (soft purple) -->
![Streak](https://github-streak-tracker-for-all.vercel.app/api/streak?username=YOU&theme=tokyonight)
```

---

## 2. Editing an Existing Theme

Open `src/svg.js`. At the top you'll find the `THEMES` object:

```js
const THEMES = {
  dark: {
    bg:          '#0d1117',   // ← Card background
    border:      '#30363d',   // ← Border around the card
    title:       '#8b949e',   // ← "CURRENT STREAK" label text
    value:       '#e6edf3',   // ← (reserved for future text)
    accent:      '#f78166',   // ← 🔥 Current streak number color
    accentAlt:   '#58a6ff',   // ← ⚡ Longest streak number color
    accentGreen: '#3fb950',   // ← 📊 Total contributions number color
    divider:     '#21262d',   // ← Lines between columns
    subtext:     '#6e7681',   // ← Date range text below numbers
  },
  …
};
```

### Example: Make the dark theme use purple accents

```js
dark: {
  …
  accent:      '#c678dd',   // purple for current streak
  accentAlt:   '#56b6c2',   // teal for longest streak
  accentGreen: '#98c379',   // light green for total
  …
}
```

Save the file, push the commit, and Vercel redeploys automatically.

---

## 3. Adding a New Theme

Add a new key to the `THEMES` object in `src/svg.js`:

```js
const THEMES = {
  dark: { … },
  light: { … },
  radical: { … },
  tokyonight: { … },

  // ← ADD YOUR NEW THEME HERE
  ocean: {
    bg:          '#0a192f',
    border:      '#112240',
    title:       '#8892b0',
    value:       '#ccd6f6',
    accent:      '#64ffda',
    accentAlt:   '#ff79c6',
    accentGreen: '#50fa7b',
    divider:     '#1d3461',
    subtext:     '#495670',
  },
};
```

Then in `api/streak.js`, add `'ocean'` to the allowed list:

```js
// Find this line:
const VALID_THEMES = new Set(['dark', 'light', 'radical', 'tokyonight']);

// Change to:
const VALID_THEMES = new Set(['dark', 'light', 'radical', 'tokyonight', 'ocean']);
```

Use it:
```
/api/streak?username=YOU&theme=ocean
```

---

## 4. Changing Card Dimensions

In `src/svg.js`, find the `generateSVG` function:

```js
// Card dimensions
const W = 495;   // ← width in pixels
const H = 195;   // ← height in pixels
```

Standard GitHub stats card width is **495px**. The height can be increased if you add more rows.

The three column positions are percentage-based, so they auto-adjust:
```js
const col1X = Math.round(W * 0.165);  // 16.5% from left
const col2X = Math.round(W * 0.5);    // center
const col3X = Math.round(W * 0.835);  // 83.5% from left
```

---

## 5. Changing the Font

The font is defined in `src/svg.js`:

```js
const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
```

> ⚠️ SVG inside GitHub README **cannot load external fonts** (Google Fonts, etc.) because GitHub proxies images and blocks external requests. You must use **system fonts** only.

Safe system fonts: `Segoe UI`, `Helvetica Neue`, `Arial`, `Verdana`, `Trebuchet MS`, `Georgia`.

---

## 6. Changing the Icons (Emojis)

In `src/svg.js`, inside the `generateSVG` function:

```js
// Column 1 — Total Contributions
icon: '📊',   // ← change this emoji

// Column 2 — Current Streak
icon: '🔥',   // ← change this emoji

// Column 3 — Longest Streak
icon: '⚡',   // ← change this emoji
```

> Emojis render as unicode text nodes in SVG and work in all modern browsers and GitHub's image proxy.

---

## 7. Changing the Title Text

In `src/svg.js`:

```js
// Find this line inside the SVG template:
🔥 GitHub Streak Stats — ${escapeXml(username)}
```

Change it to anything you like:
```js
📈 Contribution Stats — ${escapeXml(username)}
```

---

## 8. Adding a New Stat Column

### Step 1 — Add the data

The data comes from `src/streak.js → calculateStreaks()`. Add a new field there if needed (e.g. `averagePerDay`).

### Step 2 — Pass it to `generateSVG`

In `api/streak.js`:
```js
const svg = generateSVG({
  username: data.login,
  totalContributions: streakData.totalContributions,
  averagePerDay: streakData.averagePerDay,   // ← add this
  theme,
  …streakData,
});
```

### Step 3 — Render it in `src/svg.js`

Increase `H` (card height) if needed, add a 4th column, call `statColumn({…})`.

---

## 9. Changing the Cache Duration

The cache avoids hitting GitHub's API on every request.

**On Vercel:** Set the `CACHE_TTL_SECONDS` environment variable in the Vercel Dashboard:
- `Settings → Environment Variables → CACHE_TTL_SECONDS = 1800` (30 minutes)

**In `.env` for local dev:**
```
CACHE_TTL_SECONDS=600
```

Setting it to `0` effectively disables caching (not recommended — you'll hit GitHub rate limits).

---

## 10. Disabling Animations

The fade-in animation is a SMIL `<animate>` element. To remove it, find in `src/svg.js`:

```js
const fadeAnim = (delay) =>
  `<animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="${delay}s" fill="freeze"/>`;
```

And change every `<g opacity="0">` wrapping a column to just `<g>`, removing the `fadeAnim(...)` call inside.
