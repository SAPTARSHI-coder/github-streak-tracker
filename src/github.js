/**
 * github.js — GitHub GraphQL API client
 *
 * Fetches contributionCalendars for the last 2 years for a given username,
 * merging them so streak logic works across multi-year histories.
 */

'use strict';

const fetch = require('node-fetch');

const GITHUB_API = 'https://api.github.com/graphql';

const CONTRIBUTION_QUERY = `
  query($login: String!, $from1: DateTime!, $to1: DateTime!, $from2: DateTime!, $to2: DateTime!) {
    user(login: $login) {
      name
      login
      c1: contributionsCollection(from: $from1, to: $to1) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              weekday
            }
          }
        }
      }
      c2: contributionsCollection(from: $from2, to: $to2) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              weekday
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetch contribution data for a GitHub username across the last 2 years.
 *
 * @param {string} username  — GitHub login (case-insensitive)
 * @param {string} token     — GitHub Personal Access Token (read:user scope)
 * @returns {Promise<{
 *   login: string,
 *   name: string,
 *   totalContributions: number,
 *   contributionDays: Array<{ date: string, contributionCount: number }>
 * }>}
 */
async function fetchContributions(username, token) {
  if (!token) {
    throw new Error(
      'GITHUB_TOKEN is not set. Create a token at https://github.com/settings/tokens (no special scopes needed for public data).'
    );
  }

  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(now.getFullYear() - 2);

  const variables = {
    login: username,
    from1: twoYearsAgo.toISOString(),
    to1: oneYearAgo.toISOString(),
    from2: oneYearAgo.toISOString(),
    to2: now.toISOString(),
  };

  const response = await fetch(GITHUB_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'github-streak-tracker/1.0',
    },
    body: JSON.stringify({
      query: CONTRIBUTION_QUERY,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API returned HTTP ${response.status}: ${response.statusText}`
    );
  }

  const json = await response.json();

  if (json.errors && json.errors.length > 0) {
    const msg = json.errors.map((e) => e.message).join('; ');
    throw new Error(`GitHub GraphQL error: ${msg}`);
  }

  if (!json.data || !json.data.user) {
    throw new Error(
      `User "${username}" not found or their contributions are private.`
    );
  }

  const { user } = json.data;
  const cal1 = user.c1.contributionCalendar;
  const cal2 = user.c2.contributionCalendar;

  const days1 = cal1.weeks.flatMap((w) => w.contributionDays);
  const days2 = cal2.weeks.flatMap((w) => w.contributionDays);

  const daysMap = new Map();
  for (const day of [...days1, ...days2]) {
    daysMap.set(day.date, day);
  }

  const contributionDays = Array.from(daysMap.values()).sort((a, b) =>
    a.date < b.date ? -1 : 1
  );

  const totalContributions = cal1.totalContributions + cal2.totalContributions;

  return {
    login: user.login,
    name: user.name || user.login,
    totalContributions,
    contributionDays,
  };
}

module.exports = { fetchContributions };
