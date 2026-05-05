# 📦 Changelog

All notable changes to **GitHub Streak Tracker** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

- Nothing yet — check back after the next commit!

---

## [2.0.0] — 2025-05-06

### 🚀 Major: Vercel Serverless Conversion

The project was fully converted from an Express server to Vercel serverless functions. The `src/` business logic is unchanged — only the transport layer changed.

### Added
- `api/streak.js` — Vercel serverless handler for `/api/streak`
- `api/health.js` — Vercel serverless handler for `/health`
- **4 themes:** `dark` (default), `light`, `radical`, `tokyonight`
- `?theme=` query parameter support
- `X-Cache: HIT|MISS` response header
- `stale-while-revalidate` cache directive for zero-downtime refreshes
- CORS headers (`Access-Control-Allow-Origin: *`)
- `docs/` folder — full developer documentation mirroring `src/`
- `CONTRIBUTING.md` — contribution guide
- `CODE_OF_CONDUCT.md` — community standards
- `SECURITY.md` — responsible disclosure policy
- `CHANGELOG.md` — this file
- GitHub Issue & PR templates

### Changed
- `vercel.json` — replaced `builds/routes` with cleaner `rewrites`
- `src/svg.js` — replaced single `COLORS` constant with `THEMES` map
- `package.json` — version bumped to `2.0.0`, added `vercel-dev` script
- `README.md` — updated with live URL, themes, and docs links

### Fixed
- Theme colors now resolved at render-time (not module load time)
- `statColumn()` now receives full palette via `colors` param — no more global reference

### Deployment
- Live at: `https://github-streak-tracker-for-all.vercel.app`

---

## [1.0.0] — 2025-05-05

### 🎉 Initial Release

### Added
- `src/github.js` — GitHub GraphQL API client (`fetchContributions`)
- `src/streak.js` — Streak calculation engine (`calculateStreaks`, `formatDate`)
  - Current streak with yesterday-anchor rule
  - Longest streak (single O(n) forward pass)
  - Total contributions sum
- `src/svg.js` — Dark-theme SVG card generator (495×195 px)
  - Three stat columns: Total Contributions, Current Streak, Longest Streak
  - SMIL fade-in animations (staggered 0.1s, 0.25s, 0.4s)
  - Footer timestamp
- `src/cache.js` — In-memory TTL cache (default 1 hour)
- `src/server.js` — Express server with `/streak` and `/health` routes
- `src/generate.js` — CLI script for GitHub Actions
- `src/test.js` — 6 unit tests (no framework required)
- `.github/workflows/update-streak.yml` — Daily cron job (00:10 UTC)
- `vercel.json` — Initial Vercel deployment config
- `render.yaml` — Render.com deployment manifest
- `README.md` — Setup and deployment guide

### Security
- Username input validated with strict regex
- All SVG output XML-escaped via `escapeXml()`
- GitHub token never exposed in responses

---

## Version History Summary

| Version | Date | Highlight |
|---------|------|-----------|
| 2.0.0 | 2025-05-06 | Vercel serverless, 4 themes, full docs |
| 1.0.0 | 2025-05-05 | Initial release — Express + GitHub Actions |

---

[Unreleased]: https://github.com/SAPTARSHI-coder/github-streak-tracker/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/SAPTARSHI-coder/github-streak-tracker/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/SAPTARSHI-coder/github-streak-tracker/releases/tag/v1.0.0
