# Setup Guide

Everything you need to run this project locally.

---

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Node.js | 18 or higher | `node --version` |
| npm | 8 or higher | `npm --version` |
| A GitHub account | — | — |

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/SAPTARSHI-coder/github-streak-tracker.git
cd github-streak-tracker
```

---

## Step 2 — Install dependencies

```bash
npm install
```

This installs:
- `express` — local dev server
- `node-fetch` — HTTP client for the GitHub GraphQL API
- `dotenv` — loads your `.env` file
- `nodemon` — auto-restarts the dev server on file changes (dev only)

---

## Step 3 — Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` and fill in your GitHub token:

```env
GITHUB_TOKEN=ghp_your_token_here
```

**How to get a token:**
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Name it anything (e.g. `streak-tracker`)
4. **Select zero scopes** — public contribution data needs no permissions
5. Click **Generate token** → copy it → paste into `.env`

---

## Step 4 — Start the dev server

```bash
npm run dev
```

You'll see:
```
GitHub Streak Tracker — dev server
→ http://localhost:3000/streak?username=<your-github-login>
→ http://localhost:3000/health
```

Nodemon watches all `.js` and `.json` files and restarts automatically when you save changes.

> **Note:** If you change `.env`, the server does not auto-restart.
> Type `rs` in the terminal and press Enter to restart manually.

---

## Step 5 — Test it

Open these in your browser or run with curl:

```bash
# Your streak card (default: ember template, dark palette, row layout)
http://localhost:3000/streak?username=YOUR_GITHUB_LOGIN

# Health check — shows uptime and cache size
http://localhost:3000/health

# Try different templates
http://localhost:3000/streak?username=YOUR_GITHUB_LOGIN&template=frost&palette=nord
http://localhost:3000/streak?username=YOUR_GITHUB_LOGIN&template=neon&layout=hero
```

---

## Generate a local SVG file

To write an SVG directly to disk (same as what GitHub Actions does):

```bash
node src/generate.js <username> <output-file> [template] [palette] [layout] [font]
```

Examples:
```bash
node src/generate.js SAPTARSHI-coder streak.svg
node src/generate.js SAPTARSHI-coder card.svg frost nord hero
node src/generate.js SAPTARSHI-coder neon.svg neon dracula row jetbrains
```

---

## Project scripts

| Script | Command | What it does |
|--------|---------|-------------|
| Dev server | `npm run dev` | Starts Express server with nodemon |
| Generate SVG | `node src/generate.js ...` | Writes SVG to file |

---

## File overview

```
src/
├── server.js     ← Express dev server (mirrors Vercel routes locally)
├── generate.js   ← CLI SVG generator (used by GitHub Actions and locally)
├── github.js     ← GitHub GraphQL API client
├── streak.js     ← Pure streak calculation logic
├── cache.js      ← In-memory TTL cache
├── icons.js      ← SVG path data for icons
└── templates/
    ├── index.js  ← Template registry — getTemplate('ember') etc.
    ├── ember.js  ← Warm dark card
    ├── frost.js  ← Cool navy card
    └── neon.js   ← Neon glow card

api/
├── streak.js     ← Vercel serverless function (same logic as server.js but stateless)
└── health.js     ← Health check endpoint
```

See [How It Works](how-it-works.md) for a deep dive into every file.
