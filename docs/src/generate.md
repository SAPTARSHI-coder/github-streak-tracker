# 🖥️ `src/generate.js` — CLI Generator Script

This script is used by the **GitHub Actions workflow** to generate `streak.svg` and commit it to the repository. You can also run it locally to preview the card without starting a server.

---

## Usage

```bash
# Basic usage
GITHUB_TOKEN=ghp_xxx node src/generate.js <username> [output-file]

# Using npm alias
npm run generate -- <username> [output-file]

# Examples
node src/generate.js SAPTARSHI-coder                 # writes streak.svg
node src/generate.js torvalds my-card.svg            # custom filename
node src/generate.js octocat preview.svg --theme dark  # (theme not yet a CLI arg)
```

**Default output file:** `streak.svg` in the current directory.

---

## What It Does

```
1. Read GITHUB_TOKEN from environment (exit with error if missing)
2. Read username from first CLI argument (exit with error if missing)
3. Call fetchContributions(username, token)  → raw day data
4. Call calculateStreaks(data.contributionDays)  → streak numbers
5. Call generateSVG({…})  → SVG string
6. Write SVG string to output file
7. Log a summary to the console
```

---

## Console Output

When you run the script, you'll see:

```
Fetching contributions for "SAPTARSHI-coder"…
────────────────────────────────────────
User            : Saptarshi Sadhu (@SAPTARSHI-coder)
Total (365d)    : 342
Current streak  : 7 days
Longest streak  : 23 days
────────────────────────────────────────
✅  SVG written to: D:\DESKTOP\Github Rank\streak.svg
```

---

## How GitHub Actions Uses This

The workflow at `.github/workflows/update-streak.yml` runs:

```yaml
- name: Generate streak SVG
  env:
    GITHUB_TOKEN: ${{ secrets.STREAK_TOKEN }}
    STREAK_USERNAME: ${{ vars.STREAK_USERNAME || 'octocat' }}
  run: |
    node src/generate.js "$STREAK_USERNAME" streak.svg
```

This:
1. Sets `GITHUB_TOKEN` from the repository secret `STREAK_TOKEN`
2. Sets `STREAK_USERNAME` from the repository variable (or falls back to `'octocat'`)
3. Writes the SVG to `streak.svg` in the repo root
4. The next step commits and pushes the file if it changed

---

## When to Use the CLI vs the Server

| Use case | Use |
|----------|-----|
| Daily auto-update in GitHub Actions | `src/generate.js` |
| Live endpoint for README | `api/streak.js` (Vercel) |
| Local development / preview | Either — server is easier |
| Testing the pipeline end-to-end | `src/generate.js` — open the file in browser |

---

## Adding Theme Support to the CLI

The CLI currently always uses the default `dark` theme. To add theme support:

```js
// In src/generate.js, after reading username:
const theme = process.argv[4] || 'dark';   // add 4th arg

// Pass it to generateSVG:
const svg = generateSVG({
  username: data.login,
  totalContributions: streakData.totalContributions,
  theme,                   // ← add this
  ...streakData,
});
```

Then run:
```bash
node src/generate.js SAPTARSHI-coder preview.svg radical
```
