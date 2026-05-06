# How It Works

This page traces one HTTP request from start to finish — every file involved,
every decision made, in plain English.

---

## The full flow

```
Browser / GitHub image proxy
        │
        │  GET /streak?username=SAPTARSHI-coder&template=ember&palette=dark
        ▼
  vercel.json         ← rewrites /streak → /api/streak.js
        │
        ▼
  api/streak.js       ← the main handler (serverless function on Vercel)
        │
        ├── Validate input params (username, template, palette, etc.)
        │
        ├── Check cache (src/cache.js)
        │      Hit?  → return cached SVG immediately
        │      Miss? → continue
        │
        ├── src/github.js
        │      Calls GitHub GraphQL API
        │      Returns: { login, contributionDays[] }
        │
        ├── src/streak.js
        │      Pure calculation — no I/O
        │      Returns: { currentStreak, longestStreak, totalContributions, ... }
        │
        ├── src/templates/index.js → ember.js / frost.js / neon.js
        │      Renders SVG string from data + options
        │
        └── HTTP response: image/svg+xml
              Cache-Control: public, max-age=3600
```

---

## File-by-file breakdown

### `vercel.json`

```json
{ "source": "/streak", "destination": "/api/streak" }
```

Vercel maps files in the `/api/` directory to HTTP routes automatically.
Without this rewrite, the URL would be `/api/streak` instead of `/streak`.
The rewrite makes the URL clean and memorable.

---

### `api/streak.js` — the brain

This is the only file that handles HTTP. Everything else is pure logic.

What it does, line by line:

1. **Reads query params** — `username`, `template`, `palette`, `font`, `layout`
2. **Validates** — username regex check, known template/palette/font/layout names
3. **Builds the color palette** — copies the matching palette object, then applies any custom hex overrides from `?bg=`, `?accent=`, `?border=`
4. **Checks the cache** — `cache.get("streak:username:template:palette:font:layout")` — if the SVG is cached and not expired, returns it immediately with `X-Cache: HIT`
5. **Calls `fetchContributions()`** — goes to GitHub
6. **Calls `calculateStreaks()`** — pure math, no network
7. **Calls `getTemplate("ember")(data, options)`** — returns an SVG string
8. **Stores in cache** — `cache.set(key, svg)`
9. **Sends response** — `Content-Type: image/svg+xml`, `Cache-Control: public, max-age=3600`

---

### `src/github.js` — fetches data

Uses GitHub's **GraphQL API** (not the REST API) because it returns the entire
contribution calendar in one request.

The GraphQL query asks for:
- `user.login` — the canonical username (GitHub normalises capitalisation)
- `user.name` — display name
- `contributionCalendar.totalContributions` — total count for the year
- `contributionCalendar.weeks[].contributionDays[]` — day-by-day data

Each day looks like:
```json
{ "date": "2026-01-15", "contributionCount": 7 }
```

The function flattens the weeks array into a flat list of days, sorted oldest first.

**Why GraphQL and not REST?**
The REST API does not expose the contribution calendar. GraphQL is the only
official way to get this data.

**Why no scopes on the token?**
Public contribution data requires zero token scopes. The token just proves
you're a real user (not a bot hammering the API) for rate-limit purposes.

---

### `src/streak.js` — calculates streaks

Pure function — takes the array of contribution days, returns numbers.

**Current streak algorithm:**
1. Start from today (UTC)
2. If today has 0 contributions, skip to yesterday (the day might not be over yet in all timezones)
3. Walk backwards day by day — as long as `contributionCount > 0`, increment the counter
4. Stop the moment a zero-contribution day is found

**Longest streak algorithm:**
1. Walk forward through all days (oldest → newest)
2. Keep a running counter — increment on contribution days, reset to 0 on gap days
3. Record the run length and start/end dates whenever a new maximum is found

**Edge cases handled:**
- User has never contributed → all values return 0 / null
- Today has no contributions but yesterday does → streak is not broken

---

### `src/cache.js` — avoids hammering GitHub

A simple in-memory key→value store with per-entry expiry timestamps.

```
cache.set("streak:SAPTARSHI-coder:ember:dark:inter:row", "<svg>...</svg>")
```

Default TTL: **1 hour** (set by `CACHE_TTL_SECONDS` env var).

Why in-memory?
- Vercel functions are stateless — the cache clears when the function instance
  is recycled. But Vercel keeps warm instances alive between requests, so the
  cache still cuts GitHub API calls by 90%+ under normal load.
- No external service (Redis, KV) needed — zero cost.

---

### `src/templates/ember.js` (and frost, neon)

Each template is a **function** with this signature:

```js
function ember(data, options) {
  // data:    { username, totalContributions, currentStreak, ... }
  // options: { colors, font, layout, borderRadius, ... }
  return '<svg xmlns="...">...</svg>';  // a complete SVG string
}
```

The template uses `options.colors.accent` for the current streak color,
`options.colors.accentAlt` for longest streak, etc.
Icons come from `src/icons.js` — raw `<path>` elements (no emojis, which
GitHub's image proxy strips out).

The `layout` value tells the template whether to render
`row` / `stacked` / `hero` arrangement.

---

### `src/icons.js` — why no emojis?

GitHub's image proxy (`camo.githubusercontent.com`) re-encodes SVG files
and strips emoji characters. A flame emoji (🔥) embedded in an SVG text
node renders as a blank square on README cards.

Instead, we embed the icon as a `<path>` element — an actual SVG shape.
The path `d` attribute is a series of coordinates. It always renders
correctly because it's geometry, not a font character.

Source: [Heroicons v2](https://heroicons.com) (MIT License).

---

## GitHub Actions flow (CI)

```
00:10 UTC every day
       │
       ▼
  update-streak.yml
       │
       ├── checkout repo
       ├── npm ci --omit=dev     (install production deps only)
       ├── node src/generate.js  (same logic as api/streak.js, writes to file)
       │       reads:  GITHUB_TOKEN, STREAK_USERNAME, STREAK_TEMPLATE, etc.
       │       writes: streak.svg
       │
       └── git add streak.svg
           git diff --staged --quiet || git commit + git push
```

`src/generate.js` is a thin CLI wrapper around the same `fetchContributions` →
`calculateStreaks` → `getTemplate` chain. The SVG it produces is byte-for-byte
identical to what the API would return.
