/**
 * github.js — GitHub GraphQL API client
 *
 * Fetches the full contributionCalendar for the last 12 months for a given
 * username.  We request every week so we always have ≥ 365 days of data,
 * letting streak logic work correctly across year boundaries.
 */

'use strict';

const fetch = require('node-fetch');

const GITHUB_API = 'https://api.github.com/graphql';

// GraphQL query — fetches contributions for the last year per GitHub's API.
// The `contributionCalendar` object always covers the 365-day window that
// GitHub shows on a profile page.
const CONTRIBUTION_QUERY = `
  query($login: String!) {
    user(login: $login) {
      name
      login
      contributionsCollection {
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
 * Fetch contribution data for a GitHub username.
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

  const response = await fetch(GITHUB_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'github-streak-tracker/1.0',
    },
    body: JSON.stringify({
      query: CONTRIBUTION_QUERY,
      variables: { login: username },
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
  const calendar = user.contributionsCollection.contributionCalendar;

  // Flatten weeks → days, sorted chronologically (oldest → newest)
  const contributionDays = calendar.weeks
    .flatMap((week) => week.contributionDays)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  return {
    login: user.login,
    name: user.name || user.login,
    totalContributions: calendar.totalContributions,
    contributionDays,
  };
}

module.exports = { fetchContributions };
