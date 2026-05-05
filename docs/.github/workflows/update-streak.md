# ⚙️ GitHub Actions — `update-streak.yml` Workflow

**File:** `.github/workflows/update-streak.yml`

This workflow runs **automatically every day at 00:10 UTC**, generates a fresh `streak.svg`, and commits it back to the repository. No server required — just GitHub's free CI infrastructure.

---

## When It Runs

```yaml
on:
  schedule:
    - cron: '10 0 * * *'    # Daily at 00:10 UTC
  workflow_dispatch:         # Also: manual trigger from GitHub Actions tab
```

- **`cron: '10 0 * * *'`** — Every day at 00:10 UTC (10 minutes after midnight UTC). GitHub tallies contributions at midnight UTC, so waiting 10 minutes ensures the previous day is counted.
- **`workflow_dispatch`** — Lets you click "Run workflow" manually from GitHub → Actions → Update GitHub Streak SVG → Run workflow.

---

## Cron Syntax Reference

```
┌───────── minute   (0-59)
│ ┌─────── hour     (0-23)
│ │ ┌───── day      (1-31)
│ │ │ ┌─── month    (1-12)
│ │ │ │ ┌─ weekday  (0-6, Sun=0)
│ │ │ │ │
10 0 * * *   = "At 00:10 every day"
```

To run at a different time (e.g. 6 AM UTC):
```yaml
- cron: '0 6 * * *'
```

---

## Required Secrets & Variables

Set these in your GitHub repo: **Settings → Secrets and Variables → Actions**

| Type | Name | Value |
|------|------|-------|
| **Secret** | `STREAK_TOKEN` | GitHub PAT with `repo` scope |
| **Variable** | `STREAK_USERNAME` | Your GitHub username (e.g. `SAPTARSHI-coder`) |

### Why a separate token?

The default `GITHUB_TOKEN` in Actions only has `read` permission on the repo. To **push a commit back** to the repo, you need a Personal Access Token with the `repo` scope. That's `STREAK_TOKEN`.

### Creating the token

1. Go to **https://github.com/settings/tokens**
2. Click **"Generate new token (classic)"**
3. Name: `streak-actions`
4. Expiration: 1 year (or no expiration)
5. Scopes: ✅ `repo` (full control of private repositories)
6. Click **Generate token**, copy it
7. Paste into: **Repo Settings → Secrets → Actions → New repository secret** named `STREAK_TOKEN`

---

## Step-by-Step Breakdown

### Step 1: Checkout

```yaml
- name: Checkout repository
  uses: actions/checkout@v4
  with:
    token: ${{ secrets.STREAK_TOKEN }}   # Must use PAT, not default token
```

Checks out the repo. Uses `STREAK_TOKEN` (not `GITHUB_TOKEN`) because later steps need to push commits.

### Step 2: Set up Node.js

```yaml
- name: Set up Node.js 20
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'            # ← caches node_modules between runs (faster)
```

### Step 3: Install dependencies

```yaml
- name: Install dependencies
  run: npm ci --omit=dev
```

`npm ci` (clean install) is faster and more reproducible than `npm install` in CI. `--omit=dev` skips dev dependencies (nodemon, etc.) since we only need `node-fetch`.

### Step 4: Generate the SVG

```yaml
- name: Generate streak SVG
  env:
    GITHUB_TOKEN: ${{ secrets.STREAK_TOKEN }}
    STREAK_USERNAME: ${{ vars.STREAK_USERNAME || 'octocat' }}
  run: |
    node src/generate.js "$STREAK_USERNAME" streak.svg
```

Runs `src/generate.js` which calls the GitHub API and writes the SVG to `streak.svg`.

> `vars.STREAK_USERNAME || 'octocat'` — if you haven't set the variable yet, it falls back to `'octocat'` so the workflow doesn't fail.

### Step 5: Commit & push

```yaml
- name: Commit updated streak SVG
  run: |
    git config user.name  "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"

    git add streak.svg
    if git diff --staged --quiet; then
      echo "No changes to commit (SVG unchanged)."
    else
      git commit -m "chore: update streak SVG [skip ci]"
      git push
    fi
```

Key details:
- Uses `github-actions[bot]` as the commit author (shows up nicely in the commit log)
- `git diff --staged --quiet` — only commits if the file actually changed (avoids empty commits)
- `[skip ci]` in the commit message — tells GitHub Actions not to re-trigger this workflow on the commit it just made (prevents infinite loops)

---

## After Setup: Use the SVG in Your README

Once the workflow has run at least once, `streak.svg` will exist in your repo root. Add it to your profile README:

```markdown
![GitHub Streak](https://raw.githubusercontent.com/SAPTARSHI-coder/github-streak-tracker/main/streak.svg)
```

GitHub's CDN caches raw file URLs, so the image updates within an hour of each daily commit.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Workflow not running | Check cron syntax; GitHub may delay by up to 1 hour on free tier |
| `Permission denied` on push | Make sure `STREAK_TOKEN` has `repo` scope, not just `public_repo` |
| `User not found` error | Check `STREAK_USERNAME` variable is set correctly |
| SVG not updating in README | GitHub caches raw URLs — wait up to 1 hour, or append `?v=1` to bust cache |
| Workflow never triggers | GitHub disables cron workflows on repos inactive for 60 days — re-enable manually |
