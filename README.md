# GitHub Streak Tracker

<div align="center">

**A self-hosted, zero-dependency serverless API that generates dynamic SVG streak cards for your GitHub profile README.**

[![License: MIT](https://img.shields.io/badge/License-MIT%20%2B%20Attribution-blue.svg)](LICENSE)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-brightgreen.svg)](https://nodejs.org)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Ready-black.svg?logo=vercel)](https://vercel.com)
[![Made by SAPTARSHI-coder](https://img.shields.io/badge/Made%20by-SAPTARSHI--coder-orange.svg)](https://github.com/SAPTARSHI-coder)

![GitHub Streak](https://raw.githubusercontent.com/SAPTARSHI-coder/github-streak-tracker/main/streak.svg)

[🚀 Deploy Now](#deployment) · [📖 API Docs](docs/api.md) · [🎨 Templates](docs/templates.md) · [⚙️ Setup](docs/setup.md)

</div>

---

## Overview

GitHub Streak Tracker is a **serverless API** you deploy once on Vercel. It:

1. Fetches your contribution data from GitHub's GraphQL API
2. Calculates your current streak, longest streak, and total contributions
3. Renders a fully custom SVG card — no external fonts, no dependencies, instant load

Drop the URL in your `README.md` and it updates live.

---

## Features

- 🎨 **3 templates** — Ember, Frost, Neon
- 🌈 **5 color palettes** — Dark, Dracula, Catppuccin, Nord, Light + fully custom hex
- 📐 **3 layouts** — Row, Stacked, Hero
- ✍️ **4 font stacks** — Inter, JetBrains Mono, Space Grotesk, Mono
- ⚡ **In-memory cache** — zero repeated API calls, 1-hour TTL
- 🤖 **GitHub Actions automation** — daily SVG commit, zero extra secrets
- 🔒 **Zero scopes** — GitHub token needs no permissions for public data

---

## Quick Start

### 1. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SAPTARSHI-coder/github-streak-tracker)

Or manually:
```bash
git clone https://github.com/SAPTARSHI-coder/github-streak-tracker.git
# Import the repo on vercel.com/new
```

### 2. Add your GitHub Token

Vercel Dashboard → **Settings → Environment Variables**:
```
GITHUB_TOKEN = ghp_xxxxxxxxxxxx
```
Get a free token at [github.com/settings/tokens](https://github.com/settings/tokens) — **no scopes needed**.

### 3. Embed in your README

```markdown
![GitHub Streak](https://your-app.vercel.app/streak?username=YOUR_USERNAME)
```

---

## API Parameters

| Parameter | Options | Default | Description |
|-----------|---------|---------|-------------|
| `username` | your GitHub login | — | **Required** |
| `template` | `ember` `frost` `neon` | `ember` | Card design |
| `palette` | `dark` `dracula` `catppuccin` `nord` `light` `custom` | `dark` | Color theme |
| `layout` | `row` `stacked` `hero` | `row` | Stat arrangement |
| `font` | `inter` `jetbrains` `spacegrotesk` `mono` | `inter` | Font family |
| `bg` | `%23RRGGBB` | — | Custom background (`palette=custom` only) |
| `accent` | `%23RRGGBB` | — | Custom streak color (`palette=custom` only) |
| `border` | `%23RRGGBB` | — | Custom border color (`palette=custom` only) |

> Note: URL-encode `#` as `%23` in query strings.

### Example URLs

```
# Frost template, Dracula palette, hero layout
/streak?username=SAPTARSHI-coder&template=frost&palette=dracula&layout=hero

# Neon template, JetBrains font
/streak?username=SAPTARSHI-coder&template=neon&font=jetbrains

# Custom colors
/streak?username=SAPTARSHI-coder&palette=custom&bg=%230d1117&accent=%23ff79c6&border=%236272a4

# Stacked layout, Nord palette
/streak?username=SAPTARSHI-coder&layout=stacked&palette=nord
```

---

## Templates

| | `ember` | `frost` | `neon` |
|--|---------|---------|--------|
| **Background** | Dark gradient | Navy flat | Pure black |
| **Accent** | Coral top bar | Gradient fade bar | Glowing border |
| **Dividers** | Subtle lines | Dashed accent | Dark lines |
| **Icons** | SVG paths | SVG paths | SVG paths + glow |
| **Best with** | `dark`, `dracula` | `nord`, `catppuccin` | `dracula`, custom |

---

## GitHub Actions — Daily Auto-Update

The included workflow runs at **00:10 UTC daily**. It regenerates `streak.svg` and commits it automatically — no extra secrets required.

**One-time setup:**
1. Settings → Actions → General → **"Read and write permissions"** → Save
2. Optionally set repository variables (Settings → Secrets and variables → Actions → Variables):

| Variable | Default | Example |
|----------|---------|---------|
| `STREAK_USERNAME` | repo owner | `SAPTARSHI-coder` |
| `STREAK_TEMPLATE` | `ember` | `neon` |
| `STREAK_PALETTE` | `dark` | `dracula` |
| `STREAK_LAYOUT` | `row` | `hero` |
| `STREAK_FONT` | `inter` | `jetbrains` |

Then embed the static SVG:
```markdown
![GitHub Streak](https://raw.githubusercontent.com/SAPTARSHI-coder/github-streak-tracker/main/streak.svg)
```

---

## Local Development

```bash
git clone https://github.com/SAPTARSHI-coder/github-streak-tracker.git
cd github-streak-tracker
npm install
cp .env.example .env        # add your GITHUB_TOKEN
npm run dev                 # starts on http://localhost:3000

# Test endpoints
curl http://localhost:3000/streak?username=SAPTARSHI-coder
curl http://localhost:3000/health

# Generate a local SVG file
node src/generate.js SAPTARSHI-coder streak.svg ember dark row
```

---

## Project Structure

```
github-streak-tracker/
├── api/
│   ├── streak.js          ← Vercel serverless function (main endpoint)
│   └── health.js          ← Health check
├── src/
│   ├── github.js          ← GitHub GraphQL API client
│   ├── streak.js          ← Streak calculation engine
│   ├── cache.js           ← In-memory TTL cache
│   ├── server.js          ← Express dev server
│   ├── generate.js        ← CLI for local/CI SVG generation
│   ├── icons.js           ← SVG path icons (no emojis)
│   └── templates/
│       ├── index.js       ← Template registry
│       ├── ember.js       ← Warm dark card
│       ├── frost.js       ← Cool navy card
│       └── neon.js        ← Neon glow card
├── docs/                  ← Full documentation
├── .github/
│   ├── workflows/
│   │   └── update-streak.yml  ← Daily automation
│   └── ISSUE_TEMPLATE/
├── .env.example           ← Environment variable reference
├── vercel.json            ← Vercel route config
└── package.json
```

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Setup Guide](docs/setup.md) | Prerequisites, install, local dev |
| [API Reference](docs/api.md) | Every parameter with examples |
| [Templates & Palettes](docs/templates.md) | Design tokens, layouts |
| [Deployment](docs/deployment.md) | Vercel + GitHub Actions |
| [How It Works](docs/how-it-works.md) | Architecture & data flow |
| [Contributing](docs/contributing.md) | Add templates, palettes, PRs |

---

## License

**MIT License with Attribution Requirement** — see [LICENSE](LICENSE).

You are free to use, fork, and modify this project. If you deploy it publicly or build on top of it, you **must** include a visible credit:

> *Based on [GitHub Streak Tracker](https://github.com/SAPTARSHI-coder/github-streak-tracker) by [SAPTARSHI SADHU](https://github.com/SAPTARSHI-coder)*

---

<div align="center">

Made with ♥ by **[SAPTARSHI SADHU](https://github.com/SAPTARSHI-coder)**

If this helped you, please consider ⭐ starring the repo — it means a lot!

</div>
