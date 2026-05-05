# 🔥 GitHub Streak Tracker

> **Self-hosted** GitHub contribution streak card — no third-party services, no rate-limit surprises, completely **free**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js 18+](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

---

## Preview

> After setup, your README will display a live card like this:

```
┌─────────────────────────────────────────────────────────────┐
│          🔥 GitHub Streak Stats — your-username              │
├──────────────────┬──────────────────┬───────────────────────┤
│  📊              │  🔥              │  ⚡                   │
│ TOTAL            │ CURRENT STREAK   │ LONGEST STREAK        │
│ CONTRIBUTIONS    │                  │                       │
│  1,234           │   42 days        │   87 days             │
│ Last 365 days    │ Jan 1 – Feb 11   │ Jun 1 – Aug 26        │
└──────────────────┴──────────────────┴───────────────────────┘
```

---

## Project Structure

```
github-streak-tracker/
├── src/
│   ├── server.js       ← Express HTTP server  (/streak, /health)
│   ├── github.js       ← GitHub GraphQL API client
│   ├── streak.js       ← Streak + stats calculation logic
│   ├── svg.js          ← Dynamic SVG card generator
│   ├── cache.js        ← In-memory TTL cache (1-hour default)
│   ├── generate.js     ← CLI script (used by GitHub Actions)
│   └── test.js         ← Unit tests (no framework needed)
│
├── .github/
│   └── workflows/
│       └── update-streak.yml   ← Daily cron: regenerate & commit streak.svg
│
├── .env.example        ← Environment variable template
├── .gitignore
├── package.json
├── vercel.json         ← Vercel deployment config
├── render.yaml         ← Render.com deployment config
└── README.md
```

---

## Quick Start (Local)

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/github-streak-tracker.git
cd github-streak-tracker
npm install
```

### 2. Create GitHub Token

1. Go to **https://github.com/settings/tokens**
2. Click **"Generate new token (classic)"**
3. Give it a name like `streak-tracker`
4. **No scopes needed** for public profile data
   *(add `read:user` if your contributions are private)*
5. Copy the token

### 3. Set Environment Variables

```bash
cp .env.example .env
# Edit .env and paste your token:
# GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

### 4. Run the Server

```bash
npm start
# → GitHub Streak Tracker running on http://localhost:3000
```

### 5. Open in Browser

```
http://localhost:3000/streak?username=torvalds
http://localhost:3000/health
```

The `/streak` endpoint returns an SVG image directly viewable in any browser or Markdown renderer.

---

## Generate a Static SVG (GitHub Actions / CI)

```bash
# Generate streak.svg for a user and save it locally
GITHUB_TOKEN=ghp_xxx node src/generate.js your-username streak.svg

# Using npm script alias
npm run generate -- your-username streak.svg
```

---

## Run Tests

```bash
npm test
# → Runs src/test.js — 6 unit tests, no framework required
```

---

## Deployment

### Option A — Vercel (Recommended — always-on free tier)

| Step | Command / Action |
|------|-----------------|
| 1    | `npm install -g vercel` |
| 2    | `vercel login` |
| 3    | `vercel --prod` (from project root) |
| 4    | Add `GITHUB_TOKEN` in Vercel Dashboard → Settings → Environment Variables |

Your endpoint will be:
```
https://your-project.vercel.app/streak?username=your-username
```

### Option B — Render.com (Free, auto-deploy)

1. Push this repo to GitHub
2. Go to **https://dashboard.render.com/new/web**
3. Connect your GitHub repo
4. Render auto-detects `render.yaml`
5. Add `GITHUB_TOKEN` secret in the dashboard
6. Click **Deploy**

> ⚠️ Render free tier **spins down after 15 minutes** of inactivity. The first request after sleep takes ~30s. For a README card, use the **GitHub Actions static SVG approach** instead.

### Option C — GitHub Actions Static SVG (100% Free, No Server)

This approach generates `streak.svg` once per day and commits it to your repo.
Your README then links to the raw GitHub file — **no server needed at all**.

**Setup:**

1. In your GitHub repo: **Settings → Secrets and Variables → Actions**
   - Add secret: `STREAK_TOKEN` = your PAT with **repo** scope
   - Add variable: `STREAK_USERNAME` = your GitHub username

2. The workflow at `.github/workflows/update-streak.yml` runs daily at 00:10 UTC.

3. Trigger it once manually:
   - **Actions → Update GitHub Streak SVG → Run workflow**

4. After it runs, `streak.svg` will appear in your repo root.

5. Add to your README:
```markdown
![GitHub Streak](https://raw.githubusercontent.com/<your-username>/<your-repo>/main/streak.svg)
```

---

## Adding to Your GitHub Profile README

### Live Server URL (Vercel/Render)
```markdown
![GitHub Streak Stats](https://your-project.vercel.app/streak?username=your-username)
```

### Static SVG (GitHub Actions)
```markdown
![GitHub Streak Stats](https://raw.githubusercontent.com/your-username/github-streak-tracker/main/streak.svg)
```

### With a link to your profile
```markdown
[![GitHub Streak Stats](https://your-project.vercel.app/streak?username=your-username)](https://github.com/your-username)
```

---

## Configuration & Customization

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GITHUB_TOKEN` | *(required)* | GitHub PAT — read public contributions |
| `PORT` | `3000` | HTTP port for the server |
| `CACHE_TTL_SECONDS` | `3600` | How long to cache each user's data (seconds) |

### Customizing the SVG Design

Edit `src/svg.js` — the `COLORS` object at the top controls every colour:

```js
const COLORS = {
  bg:          '#0d1117',   // Card background
  border:      '#30363d',   // Border colour
  title:       '#8b949e',   // Label text
  value:       '#e6edf3',   // Primary value text
  accent:      '#f78166',   // Current streak colour (🔥 coral)
  accentAlt:   '#58a6ff',   // Longest streak colour (⚡ blue)
  accentGreen: '#3fb950',   // Total contributions (📊 green)
  divider:     '#21262d',   // Divider lines
  subtext:     '#6e7681',   // Date sub-labels
};
```

Change fonts, icon emojis, card dimensions, or add new stat columns freely.

---

## How It Works

```
Request: GET /streak?username=octocat
         │
         ▼
    ┌─────────────┐
    │  Cache hit? │ YES → return cached SVG
    └──────┬──────┘
           │ NO
           ▼
    ┌──────────────────────┐
    │  GitHub GraphQL API  │  contributionCalendar (365 days)
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Streak Calculator   │  current / longest / total
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  SVG Generator       │  dark-theme card, animations
    └──────────┬───────────┘
               │
               ▼
    Cache result (1 hour) → Return SVG (image/svg+xml)
```

### Streak Logic

- **Current streak**: Walk backwards from *today*. If today has no contributions, yesterday is used as the anchor (day isn't over in all timezones). Count consecutive days with ≥ 1 contribution.
- **Longest streak**: Single pass through all days, tracking the longest consecutive active run.
- **Total contributions**: Sum of all `contributionCount` values in the last 365 days.

---

## API Reference

### `GET /streak?username=<login>`

| Parameter | Required | Description |
|-----------|----------|-------------|
| `username` | ✅ | GitHub login (alphanumeric + hyphens) |

**Response:** `image/svg+xml`  
**Cache-Control:** `public, max-age=3600`

### `GET /health`

Returns server status:

```json
{
  "ok": true,
  "uptime": 3600.5,
  "cacheSize": 12,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## License

MIT — free to use, modify, and deploy. No attribution required.
