# 🏥 `/health` — Health Check Endpoint

**File:** `api/health.js`  
**Method:** `GET`  
**Returns:** `application/json`

---

## URL

```
https://github-streak-tracker-for-all.vercel.app/health
```

---

## Purpose

Use this endpoint to:
- Verify the service is running after a deployment
- Check whether `GITHUB_TOKEN` is correctly set
- See how many users are currently in the cache
- Set up uptime monitoring (e.g. UptimeRobot)

---

## Response

```json
{
  "ok": true,
  "service": "github-streak-tracker",
  "version": "2.0.0",
  "cacheEntries": 5,
  "tokenSet": true,
  "timestamp": "2025-05-06T00:00:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | Always `true` if the function is running |
| `service` | string | Service identifier |
| `version` | string | Package version from `package.json` |
| `cacheEntries` | number | Number of active (non-expired) cache entries |
| `tokenSet` | boolean | Whether `GITHUB_TOKEN` is present in env |
| `timestamp` | string | UTC timestamp of this response |

---

## Troubleshooting with `/health`

| Problem | What to check |
|---------|---------------|
| `tokenSet: false` | `GITHUB_TOKEN` not set in Vercel env vars |
| `cacheEntries: 0` | Cold start — cache resets on each new function instance |
| Getting a 404 | The rewrite in `vercel.json` may be misconfigured |

---

## How the File Works

`api/health.js` is a Vercel serverless function that exports a handler:

```js
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');   // Don't cache health checks
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({ ok: true, … });
};
```

Key point: `Cache-Control: no-store` ensures you always get a live reading — no stale health data from CDN caches.
