# 📖 GitHub Streak Tracker — Documentation

Welcome to the full developer documentation. This folder mirrors the project source tree so every file you edit has a matching doc explaining what it does, why it exists, and how to change it.

---

## Where to Start

| If you want to… | Read |
|-----------------|------|
| Understand the whole system | [architecture.md](./architecture.md) |
| Change colors or themes | [customization.md](./customization.md) |
| Understand the streak math | [src/streak.md](./src/streak.md) |
| Change what the SVG looks like | [src/svg.md](./src/svg.md) |
| Add a new API endpoint | [api/streak.md](./api/streak.md) |
| Set up GitHub Actions | [.github/workflows/update-streak.md](./.github/workflows/update-streak.md) |
| Deploy your own instance | [deployment/vercel.md](./deployment/vercel.md) |

---

## Documentation Map

```
docs/
├── index.md                     ← You are here — overview & navigation
├── architecture.md              ← System design, data flow, module map
├── customization.md             ← Change themes, colors, layout, add columns
│
├── api/                         ← Serverless function docs (mirrors /api/)
│   ├── streak.md                  /api/streak — query params, response, errors
│   └── health.md                  /health — JSON status response
│
├── src/                         ← Core module docs (mirrors /src/)
│   ├── github.md                  GitHub GraphQL client
│   ├── streak.md                  Streak calculation algorithm
│   ├── svg.md                     SVG card builder
│   ├── cache.md                   In-memory TTL cache
│   └── generate.md                CLI script for GitHub Actions
│
├── .github/workflows/           ← CI/CD docs (mirrors /.github/workflows/)
│   └── update-streak.md           Daily cron job explained
│
└── deployment/                  ← How to deploy on different platforms
    ├── vercel.md                  Vercel (recommended)
    ├── render.md                  Render.com
    └── static-svg.md              GitHub Actions static SVG (no server)
```

---

## Key Concepts

### What this project is

A **self-hosted** GitHub contribution streak tracker. Instead of relying on a third-party service (which can go down, change APIs, or add paywalls), you own the entire stack. The code runs on **Vercel's free serverless tier** — meaning it's always on and costs nothing.

### How a request flows

```
Browser / GitHub README
        │
        │  GET /api/streak?username=octocat&theme=dark
        ▼
  Vercel Edge Network
        │
        ▼
  api/streak.js          ← Serverless function (your code)
        │
        ├─ src/cache.js   ← Check in-memory cache first
        │
        ├─ src/github.js  ← If cache miss: call GitHub GraphQL API
        │
        ├─ src/streak.js  ← Calculate current/longest streak from raw data
        │
        └─ src/svg.js     ← Render the card as an SVG string
        │
        ▼
  Response: image/svg+xml (cached for 1 hour)
```

### The three layers

| Layer | Files | Job |
|-------|-------|-----|
| **Transport** | `api/streak.js`, `api/health.js` | HTTP in, SVG out |
| **Business logic** | `src/github.js`, `src/streak.js`, `src/svg.js` | The actual work |
| **Infrastructure** | `src/cache.js`, `vercel.json`, `.github/workflows/` | Performance + CI |

---

## Live Endpoints

| URL | Returns |
|-----|---------|
| `https://github-streak-tracker-for-all.vercel.app/api/streak?username=octocat` | SVG image |
| `https://github-streak-tracker-for-all.vercel.app/api/streak?username=octocat&theme=radical` | SVG with radical theme |
| `https://github-streak-tracker-for-all.vercel.app/health` | `{ "ok": true, … }` |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_TOKEN` | ✅ Yes | — | GitHub Personal Access Token. No special scopes needed for public data. |
| `CACHE_TTL_SECONDS` | No | `3600` | Seconds each user's data is cached in memory. |
| `PORT` | No | `3000` | Only used by `src/server.js` (local dev). Vercel ignores this. |
