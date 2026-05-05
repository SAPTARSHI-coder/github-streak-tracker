# 🤝 Contributing to GitHub Streak Tracker

First off — **thank you** for taking the time to contribute! This project is open-source and welcomes improvements from everyone.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [What Can I Contribute?](#what-can-i-contribute)
- [Getting Started (Local Dev)](#getting-started-local-dev)
- [Project Structure](#project-structure)
- [Making a Pull Request](#making-a-pull-request)
- [Coding Style](#coding-style)
- [Commit Message Format](#commit-message-format)
- [Attribution Requirement](#attribution-requirement)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it. Report unacceptable behaviour to **saptarshisadhuofficial@gmail.com**.

---

## What Can I Contribute?

| Type | Examples |
|------|---------|
| 🐛 Bug fixes | Wrong streak count, broken SVG, API error not handled |
| 🎨 New themes | A new color palette for `src/svg.js` |
| ✨ New features | New stat columns, new query params, multi-year stats |
| 📖 Documentation | Fixing typos, improving explanations in `docs/` |
| ⚡ Performance | Smarter caching, faster SVG generation |
| 🔒 Security | Responsible disclosure via `SECURITY.md` |

---

## Getting Started (Local Dev)

### 1. Fork the repository

Click **Fork** on GitHub — this creates your own copy.

### 2. Clone your fork

```bash
git clone https://github.com/<your-username>/github-streak-tracker.git
cd github-streak-tracker
```

### 3. Install dependencies

```bash
npm install
```

### 4. Set up your environment

```bash
cp .env.example .env
# Edit .env → paste your GITHUB_TOKEN
```

### 5. Run the local server

```bash
npm start
# → http://localhost:3000/streak?username=your-username
```

### 6. Run tests before making changes

```bash
npm test
# All 6 tests must pass
```

---

## Project Structure

```
api/streak.js     ← Serverless handler (transport layer)
src/github.js     ← GitHub API — change this to fetch different data
src/streak.js     ← Streak math — change this to fix logic
src/svg.js        ← Card design — change this to update themes/layout
src/cache.js      ← Caching — change this to swap backends
docs/             ← Developer documentation (mirrors src/)
```

Full explanation: [`docs/architecture.md`](./docs/architecture.md)

---

## Making a Pull Request

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes** — keep commits small and focused.

3. **Run tests** — all 6 must still pass:
   ```bash
   npm test
   ```

4. **Push your branch**:
   ```bash
   git push origin feat/your-feature-name
   ```

5. **Open a Pull Request** on GitHub. Use the PR template provided.

6. A maintainer will review and merge or request changes.

---

## Coding Style

- **`'use strict'`** at the top of every JS file
- **`const`** by default, `let` only when reassignment is needed, never `var`
- **JSDoc comments** on all exported functions
- **Single quotes** for strings
- **2-space indentation**
- **No console.log in src/ modules** — only in `api/` and `src/generate.js`
- Keep each module **focused on one job** (see the three-layer architecture)

---

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add ocean theme to SVG generator
fix: correct yesterday-anchor logic for UTC+14 timezones
docs: add example for adding a new stat column
chore: bump node-fetch to 2.7.1
test: add edge case for single-day streak
refactor: extract color resolution into helper
```

Prefix guide:
| Prefix | When to use |
|--------|------------|
| `feat` | New feature or theme |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `chore` | Build, dependencies, config |
| `test` | Adding/fixing tests |
| `refactor` | Code change with no behaviour change |
| `perf` | Performance improvement |

---

## Adding a New Theme

1. Add your palette to the `THEMES` object in `src/svg.js` (see [`docs/customization.md`](./docs/customization.md#3-adding-a-new-theme))
2. Add the theme name to `VALID_THEMES` in `api/streak.js`
3. Document it in [`docs/customization.md`](./docs/customization.md)
4. Open a PR with a screenshot showing the theme

---

## Attribution Requirement

By submitting a pull request, you agree that your contribution will be released under the same [MIT License](./LICENSE) as this project. The original copyright notice must be preserved in all derivative works.

If you fork and host your own instance, please add to your README:

> GitHub Streak Tracker originally created by [Saptarshi Sadhu](https://github.com/SAPTARSHI-coder/github-streak-tracker).

Thank you for keeping the open-source spirit alive! 🙏
