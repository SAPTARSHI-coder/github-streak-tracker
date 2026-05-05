# 📡 `/api/streak` — Endpoint Reference

**File:** `api/streak.js`  
**Method:** `GET`  
**Returns:** `image/svg+xml`

---

## URL

```
https://github-streak-tracker-for-all.vercel.app/api/streak
```

You can also use the shorter rewrite (configured in `vercel.json`):
```
https://github-streak-tracker-for-all.vercel.app/streak
```

Both point to the same serverless function.

---

## Query Parameters

| Parameter | Required | Type | Default | Description |
|-----------|----------|------|---------|-------------|
| `username` | ✅ Yes | string | — | GitHub login (e.g. `octocat`). Case-insensitive. |
| `theme` | No | string | `dark` | Card color theme. See options below. |

### `username`

- Must be a valid GitHub login: alphanumeric characters and hyphens only.
- Between 1 and 39 characters.
- Cannot start or end with a hyphen.
- Pattern: `/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/`

If the pattern doesn't match, you get a `400` text response.

### `theme`

| Value | Description |
|-------|-------------|
| `dark` | GitHub dark — default |
| `light` | GitHub light |
| `radical` | Neon pink/cyan |
| `tokyonight` | Soft purple/rose |

Any unknown value silently falls back to `dark`.

---

## Example Requests

```
/api/streak?username=octocat
/api/streak?username=torvalds&theme=light
/api/streak?username=SAPTARSHI-coder&theme=tokyonight
```

---

## Response

### Success (200)

The response body is a complete SVG document.

**Headers returned:**
```
Content-Type:               image/svg+xml; charset=utf-8
Cache-Control:              public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400
Access-Control-Allow-Origin: *
X-Cache:                    HIT | MISS
```

- `X-Cache: HIT` → served from in-memory cache, no GitHub API call made.
- `X-Cache: MISS` → fresh data fetched from GitHub.

### Error (400) — Missing or invalid username

```
Content-Type: text/plain
Body: "Missing required query parameter: ?username=<github-login>"
      or
      "Invalid GitHub username format."
```

### Error (500) — GitHub API or server error

Returns an **error SVG** (not a text error) so your README card shows something useful instead of a broken image:

```svg
<svg …>
  <text>⚠ Streak Tracker — Error</text>
  <text>User: octocat</text>
  <text>User "octocat" not found or contributions are private.</text>
</svg>
```

---

## Caching Behavior

```
Browser / GitHub proxy
        │
        ▼
  Vercel CDN (s-maxage=3600)
        │  CDN miss
        ▼
  api/streak.js — in-memory cache (TTL: CACHE_TTL_SECONDS, default 3600s)
        │  Cache miss
        ▼
  GitHub GraphQL API
```

There are **two cache layers**:

1. **Vercel CDN** (`s-maxage=3600`): Caches at the edge globally. Requires zero function invocations on a CDN hit.
2. **In-memory** (`src/cache.js`): Caches within the same warm serverless instance. Much faster than a GitHub API call.

---

## Rate Limiting

GitHub's GraphQL API allows **5,000 points per hour** for authenticated requests. Each call to `fetchContributions` costs ~1 point. With caching, you'd need 5,000 unique users per hour to hit the limit — not something you'll encounter on a personal deployment.

---

## How to Add a New Query Parameter

1. Read it from `req.query` in `api/streak.js`:
   ```js
   const myParam = req.query.myParam || 'default';
   ```

2. Validate it (whitelist approach recommended):
   ```js
   const VALID_OPTIONS = new Set(['a', 'b', 'c']);
   const myParam = VALID_OPTIONS.has(req.query.myParam) ? req.query.myParam : 'a';
   ```

3. Pass it to the relevant `src/` function.

4. Update the cache key if the parameter changes the output:
   ```js
   const cacheKey = `streak:${username.toLowerCase()}:${theme}:${myParam}`;
   ```
