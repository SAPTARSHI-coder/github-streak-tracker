# 🐙 `src/github.js` — GitHub GraphQL API Client

This module is the **only place in the codebase that talks to GitHub**. Everything else works with plain JavaScript data — no HTTP, no API keys.

---

## What it does

1. Takes a GitHub `username` and your `GITHUB_TOKEN`
2. Sends a GraphQL POST request to `https://api.github.com/graphql`
3. Receives up to 365 days of contribution calendar data
4. Flattens the nested weeks structure into a clean sorted array
5. Returns it for streak calculation

---

## Exported Function

```js
const { fetchContributions } = require('./github');

const data = await fetchContributions('octocat', process.env.GITHUB_TOKEN);
```

### Return shape

```js
{
  login: 'octocat',                      // confirmed GitHub login (lowercase)
  name: 'The Octocat',                   // display name (or login if null)
  totalContributions: 1234,              // sum from GitHub API
  contributionDays: [                    // sorted oldest → newest
    { date: '2024-05-01', contributionCount: 3 },
    { date: '2024-05-02', contributionCount: 0 },
    { date: '2024-05-03', contributionCount: 7 },
    // … up to 365 entries
  ]
}
```

---

## The GraphQL Query (Explained)

```graphql
query($login: String!) {
  user(login: $login) {           # Look up a user by their login
    name                          # Display name (may be null)
    login                         # Confirmed lowercase login
    contributionsCollection {     # All contribution data
      contributionCalendar {      # The green-squares calendar
        totalContributions        # Total commits+PRs+issues in the window
        weeks {                   # 52-53 week objects
          contributionDays {      # 7 day objects per week
            date                  # "YYYY-MM-DD"
            contributionCount     # Number of contributions that day
            weekday               # 0=Sun … 6=Sat (not used, but available)
          }
        }
      }
    }
  }
}
```

**Why is it nested in weeks?** That's how GitHub's API returns it — mirroring the calendar grid on profile pages. We flatten it immediately so streak logic doesn't need to know about the week structure.

---

## Why GraphQL instead of REST?

GitHub's REST API (`/users/{user}/events`) only returns recent public events, not the full contribution calendar. The calendar data (which includes private contributions if the token has `read:user` scope) is only available via GraphQL.

---

## Error Handling

| Condition | Error thrown |
|-----------|-------------|
| `GITHUB_TOKEN` missing | `"GITHUB_TOKEN is not set…"` |
| HTTP error (4xx/5xx) | `"GitHub API returned HTTP 404: Not Found"` |
| GraphQL error (bad token, etc.) | `"GitHub GraphQL error: …message…"` |
| User not found / private | `"User \"X\" not found or their contributions are private."` |

All errors bubble up to `api/streak.js` which catches them and renders an error SVG.

---

## How to Extend It

### Fetch more years

The default query uses `contributionsCollection` without a `from`/`to` filter, so GitHub returns the last 365 days automatically. To get a specific year:

```graphql
contributionsCollection(
  from: "2023-01-01T00:00:00Z"
  to:   "2023-12-31T23:59:59Z"
) { … }
```

You'd need to make multiple calls and merge the results for multi-year stats.

### Add more data fields

Want to know how many pull requests vs commits? Add these fields:

```graphql
contributionsCollection {
  totalCommitContributions
  totalPullRequestContributions
  totalIssueContributions
  contributionCalendar { … }
}
```

Then return them from `fetchContributions` and pass them to the SVG generator.

---

## Token Permissions

| Data | Scope needed |
|------|-------------|
| Public contributions | No scope (just a valid token) |
| Private contributions | `read:user` |
| Other users | No scope (their public data) |

Generate a token at: **https://github.com/settings/tokens**
