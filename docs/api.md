# API Reference

Base URL (production): `https://your-app.vercel.app`
Base URL (local dev): `http://localhost:3000`

---

## Endpoints

### `GET /streak`

Returns an SVG image of your GitHub streak stats.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `username` | string | ✅ Yes | — | Your GitHub login (case-insensitive) |
| `template` | string | No | `ember` | Card design. One of: `ember`, `frost`, `neon` |
| `palette` | string | No | `dark` | Color theme. One of: `dark`, `dracula`, `catppuccin`, `nord`, `light`, `custom` |
| `layout` | string | No | `row` | Stat arrangement. One of: `row`, `stacked`, `hero` |
| `font` | string | No | `inter` | Font stack. One of: `inter`, `jetbrains`, `spacegrotesk`, `mono` |
| `bg` | string | No | — | Custom background hex (requires `palette=custom`) — URL-encode `#` as `%23` |
| `accent` | string | No | — | Custom current-streak color hex (requires `palette=custom`) |
| `border` | string | No | — | Custom border color hex (requires `palette=custom`) |
| `accentAlt` | string | No | — | Custom longest-streak color hex (requires `palette=custom`) |
| `accentGreen` | string | No | — | Custom total-contributions color hex (requires `palette=custom`) |

**Response:**

| Header | Value |
|--------|-------|
| `Content-Type` | `image/svg+xml; charset=utf-8` |
| `Cache-Control` | `public, max-age=3600, stale-while-revalidate=86400` |
| `X-Cache` | `HIT` or `MISS` |

**Success:** `200 OK` — SVG image string

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | Missing `username`, invalid parameter value |
| `404` | GitHub user not found |
| `500` | `GITHUB_TOKEN` not set, or GitHub API error |

---

### `GET /health`

Returns server health status. Does not require a token.

**Response:**
```json
{
  "ok": true,
  "uptime": 3600.12,
  "cacheSize": 5,
  "timestamp": "2026-05-06T16:00:00.000Z"
}
```

---

## Example Requests

### Default card
```
GET /streak?username=SAPTARSHI-coder
```

### Frost template, Nord palette, Hero layout
```
GET /streak?username=SAPTARSHI-coder&template=frost&palette=nord&layout=hero
```

### Neon template, JetBrains font, Dracula palette
```
GET /streak?username=SAPTARSHI-coder&template=neon&palette=dracula&font=jetbrains
```

### Stacked layout, Catppuccin palette
```
GET /streak?username=SAPTARSHI-coder&layout=stacked&palette=catppuccin
```

### Fully custom colors
```
GET /streak?username=SAPTARSHI-coder&palette=custom&bg=%230d1117&accent=%23ff79c6&border=%236272a4
```

### Custom accent + built-in palette base
```
GET /streak?username=SAPTARSHI-coder&palette=custom&bg=%231a1b27&accent=%23e879f9
```

---

## Embedding in a README

Basic embed:
```markdown
![GitHub Streak](https://your-app.vercel.app/streak?username=SAPTARSHI-coder)
```

With a link wrapping it:
```markdown
[![GitHub Streak](https://your-app.vercel.app/streak?username=SAPTARSHI-coder)](https://github.com/SAPTARSHI-coder)
```

With explicit dimensions (if GitHub scales it):
```markdown
<img src="https://your-app.vercel.app/streak?username=SAPTARSHI-coder" alt="GitHub Streak" width="495"/>
```

---

## Caching Behaviour

All responses are cached at two levels:

| Level | Duration | Controlled by |
|-------|----------|---------------|
| Server in-memory | 1 hour | `CACHE_TTL_SECONDS` env var |
| Vercel CDN edge | 1 hour | `Cache-Control: max-age=3600` |
| Stale-while-revalidate | 24 hours | `Cache-Control: stale-while-revalidate=86400` |

The `X-Cache: HIT` header tells you the response came from the server cache (no GitHub API call made). `X-Cache: MISS` means GitHub was queried.

---

## Rate Limits

GitHub's GraphQL API allows **5,000 requests per hour** per token (unauthenticated is much lower). With the 1-hour cache, one token can serve ~5,000 unique user requests per hour before hitting the limit.

For a personal deployment serving one username, you will never approach the limit.
