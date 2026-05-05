# 🔥 GitHub Streak Tracker

> **Self-hosted** GitHub contribution streak card — deployed on Vercel, powered by GitHub's GraphQL API, completely **free** and open-source.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://github-streak-tracker-for-all.vercel.app/api/streak?username=SAPTARSHI-coder)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js 18+](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)
[![Docs](https://img.shields.io/badge/Docs-/docs-orange)](./docs/index.md)
[![Contributing](https://img.shields.io/badge/PRs-Welcome-brightgreen)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-Contributor%20Covenant-purple)](CODE_OF_CONDUCT.md)
[![Security](https://img.shields.io/badge/Security-Policy-red)](SECURITY.md)
[![Changelog](https://img.shields.io/badge/Changelog-v2.0.0-yellow)](CHANGELOG.md)


---

## 🌐 Live Service

**Base URL:** `https://github-streak-tracker-for-all.vercel.app`

| Endpoint | Description |
|----------|-------------|
| `/api/streak?username=X` | SVG streak card for user X |
| `/api/streak?username=X&theme=radical` | With a custom theme |
| `/health` | Service health check (JSON) |

**Try it now:**
```
https://github-streak-tracker-for-all.vercel.app/api/streak?username=SAPTARSHI-coder
https://github-streak-tracker-for-all.vercel.app/api/streak?username=torvalds&theme=tokyonight
```

---

## 🎨 Available Themes

| Theme | Preview |
|-------|---------|
| `dark` *(default)* | GitHub dark — `#0d1117` bg, coral 🔥, blue ⚡, green 📊 |
| `light` | GitHub light — white bg, red 🔥, blue ⚡, green 📊 |
| `radical` | Neon — `#141321` bg, pink 🔥, yellow ⚡, cyan 📊 |
| `tokyonight` | Tokyo Night — `#1a1b27` bg, rose 🔥, cornflower ⚡, sage 📊 |

---

## 📋 Add to Your GitHub Profile README

Pick any style and paste into your profile `README.md`:

### Default dark theme
```markdown
![GitHub Streak](https://github-streak-tracker-for-all.vercel.app/api/streak?username=YOUR_USERNAME)
```

### With a specific theme
```markdown
![GitHub Streak](https://github-streak-tracker-for-all.vercel.app/api/streak?username=YOUR_USERNAME&theme=tokyonight)
```

### Clickable card (links to your profile)
```markdown
[![GitHub Streak](https://github-streak-tracker-for-all.vercel.app/api/streak?username=YOUR_USERNAME&theme=radical)](https://github.com/YOUR_USERNAME)
```

> Replace `YOUR_USERNAME` with your actual GitHub username.

---

## 📁 Project Structure

```
github-streak-tracker/
│
├── api/                         ← Vercel serverless functions
│   ├── streak.js                  Entry point: GET /api/streak
│   └── health.js                  Health check: GET /health
│
├── src/                         ← Core business logic (shared by all deploy modes)
│   ├── github.js                  GitHub GraphQL API client
│   ├── streak.js                  Streak + stats calculation
│   ├── svg.js                     SVG card generator (4 themes)
│   ├── cache.js                   In-memory TTL cache
│   ├── generate.js                CLI generator (used by GitHub Actions)
│   ├── server.js                  Local Express server (for development)
│   └── test.js                    Unit tests
│
├── docs/                        ← Full developer documentation
│   ├── index.md                   Start here
│   ├── architecture.md            System design & data flow
│   ├── customization.md           How to change themes, colors, layout
│   ├── api/
│   │   ├── streak.md              /api/streak endpoint reference
│   │   └── health.md              /health endpoint reference
│   ├── src/
│   │   ├── github.md              GitHub API module explained
│   │   ├── streak.md              Streak logic explained
│   │   ├── svg.md                 SVG generator explained
│   │   ├── cache.md               Cache module explained
│   │   └── generate.md            CLI generator explained
│   ├── .github/workflows/
│   │   └── update-streak.md       GitHub Actions workflow explained
│   └── deployment/
│       ├── vercel.md              Deploy to Vercel
│       ├── render.md              Deploy to Render.com
│       └── static-svg.md          GitHub Actions static SVG (no server)
│
├── .github/
│   └── workflows/
│       └── update-streak.yml    Daily cron: auto-generate streak.svg
│
├── .env.example                 Environment variable template
├── .gitignore
├── package.json
├── vercel.json                  Vercel routing config
├── render.yaml                  Render.com deployment manifest
└── README.md
```

> 📖 **New here?** Start with [`docs/index.md`](./docs/index.md) for a guided walkthrough.

---

## ⚡ Quick Local Development

```bash
# 1. Clone
git clone https://github.com/SAPTARSHI-coder/github-streak-tracker.git
cd github-streak-tracker

# 2. Install
npm install

# 3. Set your GitHub token
cp .env.example .env
# Edit .env → GITHUB_TOKEN=ghp_your_token_here

# 4. Start local server
npm start
# → http://localhost:3000/streak?username=SAPTARSHI-coder

# 5. Run tests
npm test
```

---

## 🚀 Deploy Your Own Instance

### Vercel (Recommended — always-on free tier)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Then in Vercel Dashboard → Settings → Environment Variables:
- Add `GITHUB_TOKEN` = your GitHub Personal Access Token

Done. Your URL: `https://your-project.vercel.app/api/streak?username=YOUR_USERNAME`

### Other Options

| Platform | Guide | Notes |
|----------|-------|-------|
| Render.com | [docs/deployment/render.md](./docs/deployment/render.md) | Free, sleeps after 15min idle |
| GitHub Actions (static) | [docs/deployment/static-svg.md](./docs/deployment/static-svg.md) | No server, daily auto-update |

---

## 🔧 How It Works (Quick Summary)

```
GET /api/streak?username=octocat
        │
        ▼
  ┌─────────────┐
  │ Cache hit?  │──YES──→ return cached SVG instantly
  └──────┬──────┘
         │ NO
         ▼
  ┌──────────────────────┐
  │  GitHub GraphQL API  │  Fetches 365 days of contribution data
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │  Streak Calculator   │  current streak / longest / total
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │   SVG Generator      │  Applies theme, builds card
  └──────────┬───────────┘
             │
             ▼
  Cache (1 hr) → respond with image/svg+xml
```

> For a deep dive: [`docs/architecture.md`](./docs/architecture.md)

---

## 📖 Documentation

All docs are in [`/docs`](./docs/) and mirror the project structure:

| Doc | What it explains |
|-----|-----------------|
| [docs/index.md](./docs/index.md) | Overview, concepts, where to start |
| [docs/architecture.md](./docs/architecture.md) | Full system design |
| [docs/customization.md](./docs/customization.md) | Change themes, colors, layout |
| [docs/api/streak.md](./docs/api/streak.md) | `/api/streak` full reference |
| [docs/src/svg.md](./docs/src/svg.md) | How the SVG card is built |
| [docs/src/streak.md](./docs/src/streak.md) | Streak calculation algorithm |
| [docs/deployment/vercel.md](./docs/deployment/vercel.md) | Vercel step-by-step |

---

## License

MIT — free to use, fork, and modify. No attribution required.
