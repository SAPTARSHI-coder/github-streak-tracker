# Contributing to GitHub Streak Tracker

**Made by [SAPTARSHI SADHU](https://github.com/SAPTARSHI-coder)**

This guide covers everything — how the code works, how to contribute,
and the exact git workflow to follow from fork to merged PR.

---

## Table of Contents

1. [How the project works](#how-the-project-works)
2. [Setting up locally](#setting-up-locally)
3. [Full contribution workflow](#full-contribution-workflow)
4. [What you can contribute](#what-you-can-contribute)
5. [Code standards](#code-standards)
6. [Attribution requirement](#attribution-requirement)

---

## How the project works

Understanding this first will make everything else obvious.

```
Your browser (or GitHub's image proxy)
        │
        │  GET /streak?username=SAPTARSHI-coder&template=ember
        ▼
  vercel.json  →  rewrites /streak → /api/streak.js
        │
        ▼
  api/streak.js          ← HTTP handler (the only file that touches req/res)
        │
        ├── Validate all query params (username, template, palette, etc.)
        ├── Build color palette (merge base palette + any custom hex overrides)
        ├── Check cache (src/cache.js) — HIT? return instantly. MISS? continue.
        │
        ├── src/github.js  →  GitHub GraphQL API  →  raw contribution days[]
        ├── src/streak.js  →  pure math           →  currentStreak, longestStreak, total
        ├── src/templates/index.js  →  ember/frost/neon  →  SVG string
        │
        └── res: image/svg+xml + Cache-Control headers
```

**Key files:**

| File | What it does |
|------|-------------|
| `api/streak.js` | HTTP handler — validates input, orchestrates everything, sends SVG |
| `src/github.js` | Calls GitHub GraphQL, returns flat array of contribution days |
| `src/streak.js` | Pure function — calculates streaks from contribution days |
| `src/cache.js` | In-memory key→value store with per-entry TTL expiry |
| `src/icons.js` | Raw SVG `<path>` data for icons (no emojis — GitHub proxy strips them) |
| `src/templates/ember.js` | Card renderer — receives data+options, returns SVG string |
| `src/templates/index.js` | Template registry — `getTemplate('ember')` returns the render function |
| `src/server.js` | Express dev server — delegates to `api/streak.js` handler |
| `src/generate.js` | CLI tool — same logic as the API, writes SVG to a file |
| `.github/workflows/update-streak.yml` | GitHub Actions — runs `src/generate.js` daily, commits `streak.svg` |

---

## Setting up locally

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/github-streak-tracker.git
cd github-streak-tracker

# 2. Install dependencies
npm install

# 3. Set up your environment
cp .env.example .env
# Open .env and paste your GitHub token:
# GITHUB_TOKEN=ghp_your_token_here
# (Get one at github.com/settings/tokens — zero scopes needed)

# 4. Start the dev server
npm run dev
# → http://localhost:3000/streak?username=YOUR_LOGIN
# → http://localhost:3000/health

# 5. Verify it works
curl http://localhost:3000/health
```

If you see `{"ok":true,...}` — you're ready.

---

## Full contribution workflow

Follow this exact sequence every time.

### Step 1 — Sync your fork with upstream

Before starting any work, make sure your fork is up to date:

```bash
# Add upstream remote (only needed once)
git remote add upstream https://github.com/SAPTARSHI-coder/github-streak-tracker.git

# Pull latest changes from the original repo
git fetch upstream
git checkout main
git merge upstream/main

# Push the sync to your fork
git push origin main
```

### Step 2 — Create a branch

**Never work directly on `main`.** Create a descriptive branch:

```bash
# For a new feature
git checkout -b feat/my-new-template

# For a bug fix
git checkout -b fix/stacked-layout-overflow

# For docs
git checkout -b docs/update-api-reference
```

Branch naming convention:
- `feat/` — new feature
- `fix/` — bug fix
- `docs/` — documentation only
- `refactor/` — code restructure, no behavior change

### Step 3 — Make your changes

Edit the files you need. The dev server hot-reloads automatically (nodemon).

**Test your change immediately:**
```bash
# In browser
http://localhost:3000/streak?username=YOUR_LOGIN

# Or generate a local file
node src/generate.js YOUR_LOGIN test.svg
# Open test.svg in your browser to inspect
```

### Step 4 — Check for mistakes

```bash
# Make sure Node.js can load all files without errors
node -e "require('./api/streak'); require('./src/templates/index'); console.log('OK');"

# Generate SVGs for all 3 templates × 3 layouts to confirm nothing is broken
node src/generate.js YOUR_LOGIN ember-row.svg    ember dark row
node src/generate.js YOUR_LOGIN frost-hero.svg   frost nord hero
node src/generate.js YOUR_LOGIN neon-stacked.svg neon dracula stacked
```

If all 3 generate without errors and look correct in your browser — you're good.

### Step 5 — Commit your changes

Write a clear, specific commit message:

```bash
git add -A
git commit -m "feat: add gruvbox palette to PALETTES"
# or
git commit -m "fix: stacked layout third stat date was null instead of empty string"
# or
git commit -m "docs: add palette screenshot to templates.md"
```

Commit message format: `type: short description` (all lowercase)

Types: `feat`, `fix`, `docs`, `refactor`, `chore`

### Step 6 — Push and open a PR

```bash
git push origin feat/my-new-template
```

Then on GitHub:
1. Go to your fork → you'll see a **"Compare & pull request"** button → click it
2. Fill in the PR template:
   - What did you change?
   - Why?
   - Screenshot if it's a visual change
3. Set base branch to `main` of `SAPTARSHI-coder/github-streak-tracker`
4. Submit

### Step 7 — Address review feedback

If changes are requested:
```bash
# Make the edits locally
git add -A
git commit -m "fix: address review feedback — adjust icon size"
git push origin feat/my-new-template
# The PR updates automatically
```

---

## What you can contribute

### Adding a new template

1. Create `src/templates/mytemplate.js`
   - Export a function: `function mytemplate(data, options) { return '<svg>...</svg>'; }`
   - Follow the UMD pattern from `ember.js` (copy it as a starting point)
   - Use `options.colors.accent`, `options.colors.bg` etc. for colors
   - Use `Icons.flame`, `Icons.bolt`, `Icons.barChart` from `src/icons.js`

2. Register it in `src/templates/index.js`:
   ```js
   // In the Node.js require block:
   require('./mytemplate')
   // In the factory parameters:
   function(ember, frost, neon, mytemplate)
   // In the registry:
   registry.mytemplate = mytemplate;
   ```

3. Add it to `VALID_TEMPLATES` in `api/streak.js`:
   ```js
   const VALID_TEMPLATES = new Set(['ember', 'frost', 'neon', 'mytemplate']);
   ```

4. Test: `node src/generate.js YOUR_LOGIN test.svg mytemplate dark row`

5. Document it in `docs/templates.md`

---

### Adding a new palette

1. Add to `PALETTES` in `api/streak.js` (9 color tokens):
   ```js
   gruvbox: {
     bg: '#282828',      // card background
     border: '#504945',  // card border stroke
     title: '#ebdbb2',   // title text
     value: '#ebdbb2',   // generic text
     accent: '#fb4934',  // current streak (flame icon + value)
     accentAlt: '#83a598',   // longest streak (bolt icon + value)
     accentGreen: '#b8bb26', // total contributions (chart icon + value)
     subtext: '#928374',  // small date sub-labels
     divider: '#3c3836',  // separator lines
   },
   ```

2. Add to `VALID_PALETTES`:
   ```js
   const VALID_PALETTES = new Set([..., 'gruvbox']);
   ```

3. Mirror the same object in `src/generate.js` in its own `PALETTES` block

4. Test: `curl "http://localhost:3000/streak?username=YOUR_LOGIN&palette=gruvbox"`

5. Document in `docs/templates.md`

---

### Fixing a bug

1. Reproduce the bug locally with a specific URL
2. Add a comment above your fix explaining what was wrong and why the fix works
3. Test that the original broken URL now works
4. Confirm no other templates/layouts were broken by testing all 9 combos

---

### Updating documentation

Docs live in `docs/`. Edit the relevant `.md` file.
No code changes needed — just open a PR with the doc fix.

---

## Code standards

- **No build step** — vanilla JavaScript (CommonJS `require`), no TypeScript, no transpilation
- **UMD pattern** for templates and icons — they must work in both Node.js and a browser
- **No new dependencies** unless absolutely necessary — open an issue to discuss first
- **Comments** — every non-obvious piece of logic must have a comment explaining *why*, not just *what*
- **No emojis in SVGs** — GitHub's image proxy strips them. Use `<path>` data from `src/icons.js`
- **Test all 3 layouts** — row, stacked, hero — before submitting a template change

---

## Attribution requirement

Per the [LICENSE](LICENSE), if you fork this project and deploy it publicly, you **must** include a visible credit:

> *Based on [GitHub Streak Tracker](https://github.com/SAPTARSHI-coder/github-streak-tracker) by [SAPTARSHI SADHU](https://github.com/SAPTARSHI-coder)*

PRs that remove attribution from the codebase or documentation will not be accepted.
