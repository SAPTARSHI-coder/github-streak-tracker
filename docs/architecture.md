# 🏗️ Architecture — How the System is Designed

This document explains every design decision, how all the pieces connect, and what happens step-by-step when a request arrives.

---

## Bird's Eye View

```
┌────────────────────────────────────────────────────────────┐
│                    GitHub README / Browser                 │
│                                                            │
│   <img src="https://…/api/streak?username=octocat" />      │
└───────────────────────────┬────────────────────────────────┘
                            │  HTTP GET
                            ▼
┌────────────────────────────────────────────────────────────┐
│                   Vercel Edge Network                      │
│  (Global CDN — serves cached responses without hitting     │
│   your serverless function at all if Cache-Control allows) │
└───────────────────────────┬────────────────────────────────┘
                            │  Cache miss → invoke function
                            ▼
┌────────────────────────────────────────────────────────────┐
│               api/streak.js  (Serverless Function)         │
│                                                            │
│  1. Validate ?username param (regex guard)                 │
│  2. Resolve ?theme param (default: 'dark')                 │
│  3. Check in-memory cache (src/cache.js)                   │
│     └─ HIT  → return cached SVG immediately               │
│     └─ MISS → continue                                     │
│  4. Call GitHub GraphQL API (src/github.js)                │
│  5. Calculate streaks (src/streak.js)                      │
│  6. Generate SVG (src/svg.js)                              │
│  7. Store in cache, return SVG                             │
└────────────────────────────────────────────────────────────┘
```

---

## Module Dependency Graph

```
api/streak.js
   ├── src/github.js      (no deps except node-fetch)
   ├── src/streak.js      (pure JS, no deps)
   ├── src/svg.js         (depends on src/streak.js for formatDate)
   └── src/cache.js       (pure JS, no deps)

api/health.js
   └── src/cache.js

src/generate.js            (CLI only — not used by serverless)
   ├── src/github.js
   ├── src/streak.js
   └── src/svg.js

src/server.js              (local dev only — not used by Vercel)
   ├── src/github.js
   ├── src/streak.js
   ├── src/svg.js
   └── src/cache.js
```

---

## The Request Lifecycle (Detailed)

### 1. Request arrives at `api/streak.js`

Vercel receives the HTTP request and invokes the exported handler function:

```js
module.exports = async function handler(req, res) { … }
```

The handler reads `req.query.username` and `req.query.theme` from the URL.

### 2. Input validation

```
username:  Must match /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/
           → Prevents path traversal, injection, and invalid API calls
           → Returns 400 if invalid

theme:     Must be one of: dark | light | radical | tokyonight
           → Falls back to 'dark' silently if unknown value given
```

### 3. Cache lookup

```js
const cacheKey = `streak:${username.toLowerCase()}:${theme}`;
const cached = cache.get(cacheKey);
```

The cache key combines username + theme because different themes produce different SVGs. A cache hit skips all API calls — critical for performance.

**Cache TTL:** 1 hour by default (`CACHE_TTL_SECONDS` env var).

> ⚠️ Vercel serverless functions can share the same Node.js process between invocations (warm instances), so the in-memory cache works. But after a cold start, the cache is empty. The Vercel CDN layer (`s-maxage=3600`) fills this gap.

### 4. GitHub GraphQL API call (`src/github.js`)

Sends this query to `https://api.github.com/graphql`:

```graphql
query($login: String!) {
  user(login: $login) {
    name
    login
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}
```

GitHub returns up to 365 days of contribution data, organized by week. The module flattens this into a sorted array of `{ date, contributionCount }` objects.

**Why GraphQL instead of REST?** The REST API doesn't expose contribution calendar data. GraphQL is GitHub's recommended approach for profile stats.

### 5. Streak calculation (`src/streak.js`)

Takes the sorted day array and computes:

| Stat | Algorithm |
|------|-----------|
| **Current streak** | Walk backwards from today (or yesterday if today is empty). Count consecutive days with count > 0. |
| **Longest streak** | Single forward pass — track running length, save max. |
| **Total contributions** | Straight sum of all `contributionCount` values. |

**The yesterday-anchor rule:** If you haven't contributed *yet today* but did yesterday, your streak is still alive. GitHub itself does this — the day isn't over everywhere in the world yet.

### 6. SVG generation (`src/svg.js`)

Builds a 495×195 px SVG string with:
- Background rect
- Title bar
- Three stat columns (Total / Current / Longest)
- Divider lines
- Animated fade-in (SMIL `<animate>`)
- Footer timestamp

The theme palette (`C = THEMES[theme]`) is resolved at render time, so all four themes share the exact same template — only the hex values change.

### 7. Response headers

```
Content-Type: image/svg+xml; charset=utf-8
Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400
Access-Control-Allow-Origin: *
X-Cache: HIT | MISS
```

- `s-maxage=3600` tells Vercel's CDN to cache the response for 1 hour.
- `stale-while-revalidate=86400` means the CDN serves a slightly stale card while fetching fresh data in the background — zero-downtime refresh.

---

## Why Serverless?

| Factor | Express Server | Vercel Serverless |
|--------|---------------|-------------------|
| Always on | Must keep server running | Yes, invoked on demand |
| Cost | Server hours | Zero (free tier) |
| Cold start | None | ~200ms (acceptable) |
| Scaling | Manual | Automatic |
| Deployment | SSH / Docker | `git push` |

---

## Deployment Modes

The project supports three deployment modes — all using the **same `src/` business logic**:

```
Mode 1: Vercel Serverless   → api/streak.js  (recommended)
Mode 2: Express local dev   → src/server.js  (development only)
Mode 3: GitHub Actions CLI  → src/generate.js (static SVG)
```

This separation is intentional: `src/` is pure logic with no HTTP concerns. Swapping the transport layer (Express ↔ serverless ↔ CLI) never touches the core code.
