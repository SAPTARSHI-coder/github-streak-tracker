# 🔒 Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x (current) | ✅ Active |
| 1.x | ⚠️ Critical fixes only |
| < 1.0 | ❌ No support |

---

## Reporting a Vulnerability

**Please do NOT open a public GitHub Issue for security vulnerabilities.**

Instead, report them privately:

📧 **Email:** saptarshisadhuofficial@gmail.com  
🔖 **Subject:** `[SECURITY] github-streak-tracker — <brief description>`

### What to Include

Please provide as much detail as possible:

1. **Type of vulnerability** (e.g. XSS via SVG injection, token leakage, rate-limit bypass)
2. **Affected file(s)** (e.g. `api/streak.js`, `src/svg.js`)
3. **Steps to reproduce** — exact URL, request, or code
4. **Potential impact** — what an attacker could achieve
5. **Suggested fix** (optional but appreciated)

---

## Response Timeline

| Stage | Timeframe |
|-------|-----------|
| Initial acknowledgement | Within 48 hours |
| Severity assessment | Within 5 business days |
| Fix development | Depends on severity (see below) |
| Public disclosure | After patch is released |

**Severity guide:**

| Severity | Example | Target fix time |
|----------|---------|-----------------|
| Critical | Token exfiltration, RCE | < 24 hours |
| High | SVG injection, auth bypass | < 7 days |
| Medium | Cache poisoning, DoS | < 30 days |
| Low | Information disclosure | Next release |

---

## Known Attack Surface

Understanding the attack surface helps reporters focus on real issues:

| Vector | Notes |
|--------|-------|
| `?username=` param | Regex-validated; only alphanumeric + hyphens allowed |
| SVG content | All user data is XML-escaped via `escapeXml()` before injection |
| `GITHUB_TOKEN` | Server-side env var; never exposed in responses |
| Cache | In-memory; no persistent storage; no cross-user data leakage |
| GitHub API | Read-only calls; no write operations |

---

## Scope

**In scope:**
- SQL injection, XSS, SVG injection in generated cards
- GitHub token leakage
- Cache poisoning attacks
- Denial-of-service via crafted requests
- Authentication/authorization bypasses

**Out of scope:**
- GitHub's own API security (report to GitHub)
- Vercel platform security (report to Vercel)
- Social engineering attacks
- Issues in dependencies not caused by our usage

---

## Disclosure Policy

We follow **responsible disclosure**:

1. You report the vulnerability privately
2. We confirm and develop a fix
3. We release the patched version
4. We publicly credit you in the release notes (unless you prefer anonymity)
5. You may publish your research after the patch is live

---

## Hall of Fame

Security researchers who responsibly disclose valid vulnerabilities will be credited here (with their permission):

*No entries yet — be the first!*

---

## Contact

**Maintainer:** Saptarshi Sadhu  
**Email:** saptarshisadhuofficial@gmail.com  
**GitHub:** [@SAPTARSHI-coder](https://github.com/SAPTARSHI-coder)
