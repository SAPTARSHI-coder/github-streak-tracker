# Deployment Guide

There are two ways to use this tracker:

| Option | Who it's for |
|--------|-------------|
| **Vercel (recommended)** | You want a live URL like `https://my-streak.vercel.app/streak?username=...` |
| **GitHub Actions only** | You don't want a live API — just a daily-updated `streak.svg` file in your repo |

---

## Option A — Vercel (live API endpoint)

### Step 1 — Fork or push the repo

If you haven't already, push the code to your GitHub account.

### Step 2 — Import project on Vercel

1. Go to <https://vercel.com/new>
2. Click **"Import Git Repository"**
3. Select your `github-streak-tracker` repository
4. Leave all build settings as-is (Vercel auto-detects Node.js serverless functions)
5. Click **"Deploy"**

### Step 3 — Add your environment variable

After the first deploy:
1. Open your project on the Vercel dashboard
2. Go to **Settings → Environment Variables**
3. Add:
   ```
   Name:  GITHUB_TOKEN
   Value: ghp_your_token_here
   ```
   - Apply to: **Production**, **Preview**, **Development**
4. Click **Save**
5. Go to **Deployments → Redeploy** to apply the new variable

### Step 4 — Test it

```
https://your-project.vercel.app/streak?username=SAPTARSHI-coder
https://your-project.vercel.app/health
```

### Step 5 — Add to your README

```markdown
![GitHub Streak](https://your-project.vercel.app/streak?username=SAPTARSHI-coder)
```

Or with a link:

```markdown
[![GitHub Streak](https://your-project.vercel.app/streak?username=SAPTARSHI-coder)](https://github.com/SAPTARSHI-coder)
```

---

## Option B — GitHub Actions (static SVG only)

If you only want a daily-updated `streak.svg` committed to your repo (no live API):

### Step 1 — Set repository variables

1. Go to your repository on GitHub
2. **Settings → Secrets and variables → Actions → Variables tab**
3. Click **"New repository variable"** and add each one you want:

| Variable name | Value | Required? |
|--------------|-------|-----------|
| `STREAK_USERNAME` | Your GitHub login | Recommended (defaults to repo owner) |
| `STREAK_TEMPLATE` | `ember` / `frost` / `neon` | No (default: `ember`) |
| `STREAK_PALETTE` | `dark` / `dracula` / `catppuccin` / `nord` / `light` | No (default: `dark`) |
| `STREAK_LAYOUT` | `row` / `stacked` / `hero` | No (default: `row`) |
| `STREAK_FONT` | `inter` / `jetbrains` / `spacegrotesk` / `mono` | No (default: `inter`) |

> **No `GITHUB_TOKEN` secret needed** — the workflow uses the built-in
> `secrets.GITHUB_TOKEN` that GitHub provides automatically.

### Step 2 — Enable write permissions

The workflow needs permission to commit `streak.svg` back.
This is already set in the workflow file:
```yaml
permissions:
  contents: write
```

But make sure your repo's default permissions allow it:
1. **Settings → Actions → General → Workflow permissions**
2. Select **"Read and write permissions"**
3. Save

### Step 3 — Trigger the workflow

The workflow runs automatically at **00:10 UTC every day**.

To run it immediately:
1. Go to **Actions** tab
2. Select **"Update GitHub Streak SVG"**
3. Click **"Run workflow"**

### Step 4 — Embed the SVG in your README

Once `streak.svg` exists in your repo, embed it using the raw GitHub URL:

```markdown
![GitHub Streak](https://raw.githubusercontent.com/SAPTARSHI-coder/github-streak-tracker/main/streak.svg)
```

---

## Caching behavior

| Layer | Duration | What it does |
|-------|----------|-------------|
| In-memory cache (`cache.js`) | 1 hour (configurable) | Prevents repeated GitHub API calls for the same user |
| Vercel CDN (`Cache-Control` header) | 1 hour | Edge nodes serve the cached SVG without hitting your function |
| `stale-while-revalidate` | 24 hours | Stale SVG is shown while a fresh one is being generated |

You can change the in-memory TTL by setting `CACHE_TTL_SECONDS` in Vercel env vars.
