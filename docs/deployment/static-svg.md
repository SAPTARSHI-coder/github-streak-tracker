# 🗂️ Static SVG via GitHub Actions (No Server Needed)

This deployment mode generates `streak.svg` **once per day** using a GitHub Actions cron job and commits it to the repo. Your README links to the raw file — no server, no hosting costs, no cold starts.

---

## How It Works

```
Daily (00:10 UTC)
      │
      ▼
GitHub Actions runner
      │
      ├── Checks out your repo
      ├── Runs: node src/generate.js SAPTARSHI-coder streak.svg
      │   └── Calls GitHub API → calculates streaks → writes SVG file
      └── Commits streak.svg back to repo (if changed)
            │
            ▼
    streak.svg is now in your repo at:
    https://raw.githubusercontent.com/SAPTARSHI-coder/github-streak-tracker/main/streak.svg
            │
            ▼
    Your README embeds it as an image
```

---

## One-Time Setup

### 1. Create a GitHub PAT with `repo` scope

1. Go to **https://github.com/settings/tokens**
2. Click **Generate new token (classic)**
3. Name: `streak-actions`
4. Expiration: 1 year
5. Check: ✅ `repo` (Full control of private repositories)
6. Click **Generate token** → copy the value

### 2. Add the secret to your repository

**GitHub repo → Settings → Secrets and Variables → Actions → Secrets**

Click **New repository secret**:
- Name: `STREAK_TOKEN`
- Value: `ghp_your_token_here`

### 3. Add your username as a variable

**Same page → Variables tab**

Click **New repository variable**:
- Name: `STREAK_USERNAME`
- Value: `SAPTARSHI-coder`

### 4. Trigger the workflow manually (first run)

**GitHub repo → Actions → "Update GitHub Streak SVG" → Run workflow → Run workflow**

Wait ~30 seconds. When it finishes, `streak.svg` will appear in your repo root.

### 5. Add to your README

```markdown
![GitHub Streak Stats](https://raw.githubusercontent.com/SAPTARSHI-coder/github-streak-tracker/main/streak.svg)
```

---

## Comparing Approaches

| Factor | Static SVG (Actions) | Live Server (Vercel) |
|--------|---------------------|---------------------|
| Always fresh | Daily update | Hourly update |
| Response speed | Instant (raw file) | Fast (CDN cached) |
| Requires server | ❌ No | ✅ Yes (serverless) |
| GitHub Token needed | ✅ (in Actions secret) | ✅ (in Vercel env) |
| Works offline | ✅ (file in repo) | ❌ Needs server |
| Custom themes per-view | ❌ Static file | ✅ `?theme=` param |

---

## Caching Note

`raw.githubusercontent.com` has a CDN cache. After the daily commit, GitHub's CDN may serve the old image for up to **5 minutes**. To force a refresh in your browser: hard-reload (`Ctrl+Shift+R`).

For permanent README links, the daily update is more than sufficient — the image will be up-to-date within a few minutes of each workflow run.

---

## Disabling the Workflow

If you switch to Vercel and no longer want daily commits, you can disable the workflow:

**GitHub repo → Actions → "Update GitHub Streak SVG" → ⋮ → Disable workflow**

Or delete `.github/workflows/update-streak.yml`.
