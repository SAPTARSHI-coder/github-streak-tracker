# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 3.x     | ✅ Active  |
| < 3.0   | ❌ EOL     |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Email: Report privately via [GitHub Security Advisories](https://github.com/SAPTARSHI-coder/github-streak-tracker/security/advisories/new).

Include:
- A clear description of the vulnerability
- Steps to reproduce
- Potential impact

I'll respond within **48 hours** and aim to release a fix within **7 days** of confirmation.

## Security Design

This project is designed with minimal attack surface:

- **Zero token scopes** — The `GITHUB_TOKEN` used to fetch contribution data requires no permissions. It only proves you're a real user for rate-limiting purposes.
- **Input validation** — All query parameters are validated with strict regex and allowlists before processing.
- **No user data stored** — SVGs are cached in-memory only (max 1 hour), never written to disk or a database.
- **No auth surface** — The API is read-only and stateless. There is no login, no session, and no user data.
- **CORS** — `Access-Control-Allow-Origin: *` is intentional — SVG cards must be embeddable from any origin (GitHub README, personal sites, etc.)

## Environment Variables

| Variable | Sensitivity | Notes |
|----------|-------------|-------|
| `GITHUB_TOKEN` | 🔴 Secret | Store in Vercel env vars, never commit. Zero scopes needed. |
| `CACHE_TTL_SECONDS` | 🟢 Public | Not sensitive. |
| `PORT` | 🟢 Public | Local dev only, not used in production. |
