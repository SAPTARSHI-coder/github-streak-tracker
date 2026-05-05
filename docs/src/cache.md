# ⚡ `src/cache.js` — In-Memory TTL Cache

A tiny, dependency-free caching layer that prevents hammering the GitHub API on every request.

---

## Why Caching Matters

Without caching:
- Every request → GitHub API call → ~200–500ms latency
- Risk of hitting GitHub's 5,000 req/hr rate limit
- Your GitHub token usage is unnecessarily high

With caching:
- First request for `octocat` → GitHub API → store result for 1 hour
- Next 3,599 requests for `octocat` → return from memory instantly (~1ms)

---

## How It Works

```js
// Simplified internal structure
const store = new Map();
// store.get('streak:octocat:dark') → { data: '<svg>…</svg>', expiresAt: 1234567890000 }
```

A JavaScript `Map` stores entries as `{ data, expiresAt }`. On each `get()`, if the current time is past `expiresAt`, the entry is deleted and `null` is returned (cache miss).

---

## Exported Functions

```js
const cache = require('./cache');
```

### `cache.get(key)`

```js
const svg = cache.get('streak:octocat:dark');
// → '<svg>…</svg>'   (cache hit)
// → null             (cache miss or expired)
```

### `cache.set(key, data, ttlMs?)`

```js
cache.set('streak:octocat:dark', svgString);
// Stores with default TTL (CACHE_TTL_SECONDS env var, default 3600s = 1 hour)

cache.set('streak:octocat:dark', svgString, 30000);
// Stores with custom TTL of 30 seconds
```

### `cache.invalidate(key)`

```js
cache.invalidate('streak:octocat:dark');
// Immediately removes the entry — forces a fresh fetch next time
```

Useful if you want to add a `?refresh=1` query param to your endpoint.

### `cache.size()`

```js
cache.size();   // → 5 (number of non-expired entries)
```

Used by the `/health` endpoint to show cache stats.

---

## Cache Key Format

```
streak:<username_lowercase>:<theme>
```

Examples:
```
streak:octocat:dark
streak:torvalds:tokyonight
streak:saptarshi-coder:radical
```

Username is lowercased so `Octocat` and `octocat` hit the same cache entry. Theme is included because different themes produce different SVGs.

---

## TTL Configuration

The default TTL is 3600 seconds (1 hour). Change it via environment variable:

```
CACHE_TTL_SECONDS=1800   # 30 minutes
CACHE_TTL_SECONDS=7200   # 2 hours
CACHE_TTL_SECONDS=300    # 5 minutes (useful for testing)
```

The TTL is read once at module load time:

```js
const TTL_MS = (parseInt(process.env.CACHE_TTL_SECONDS, 10) || 3600) * 1000;
```

---

## Limitations

### Resets on cold start

Vercel serverless functions keep the Node.js process alive between requests (warm instance), so the cache survives across multiple requests to the same instance. However, a **cold start** (new function instance) resets the cache.

This is fine because:
- Vercel's CDN also caches responses (`s-maxage=3600`)
- Cold starts are rare on a warm deployment
- The first request after a cold start just takes the normal ~300ms (GitHub API call)

### Not shared across instances

If Vercel runs multiple instances of your function in parallel, each has its own cache. This is also fine — the worst case is a few duplicate GitHub API calls.

### For production scale

If you need a shared, persistent cache (e.g. you're serving thousands of users per minute), replace this module with a Redis adapter:

```js
// cache.js — Redis version sketch
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });

async function get(key) {
  const val = await client.get(key);
  return val ? JSON.parse(val) : null;
}

async function set(key, data, ttlMs = TTL_MS) {
  await client.setEx(key, Math.round(ttlMs / 1000), JSON.stringify(data));
}
```

The rest of the codebase doesn't need to change — only this file.
