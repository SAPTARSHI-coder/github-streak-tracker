/**
 * generate.js — CLI script to generate a streak SVG and write it to disk.
 *
 * Usage:
 *   GITHUB_TOKEN=<token> node src/generate.js <username> [output.svg]
 *
 * This is the script used by the GitHub Actions workflow to refresh the
 * streak card and commit it back to the repository.
 */

'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { fetchContributions } = require('./github');
const { calculateStreaks } = require('./streak');
const { generateSVG } = require('./svg');

async function main() {
  const username = process.argv[2];
  const outputFile = process.argv[3] || 'streak.svg';

  if (!username) {
    console.error('Usage: node src/generate.js <github-username> [output.svg]');
    process.exit(1);
  }

  if (!process.env.GITHUB_TOKEN) {
    console.error('Error: GITHUB_TOKEN environment variable is not set.');
    console.error('Create a token at: https://github.com/settings/tokens');
    process.exit(1);
  }

  console.log(`Fetching contributions for "${username}"…`);

  try {
    const data = await fetchContributions(username, process.env.GITHUB_TOKEN);
    const streakData = calculateStreaks(data.contributionDays);

    console.log('─'.repeat(40));
    console.log(`User            : ${data.name} (@${data.login})`);
    console.log(`Total (365d)    : ${streakData.totalContributions}`);
    console.log(`Current streak  : ${streakData.currentStreak} days`);
    console.log(`Longest streak  : ${streakData.longestStreak} days`);
    console.log('─'.repeat(40));

    const svg = generateSVG({
      username: data.login,
      totalContributions: streakData.totalContributions,
      ...streakData,
    });

    const absPath = path.resolve(outputFile);
    fs.writeFileSync(absPath, svg, 'utf8');
    console.log(`✅  SVG written to: ${absPath}`);
  } catch (err) {
    console.error(`\n❌  Error: ${err.message}\n`);
    process.exit(1);
  }
}

main();
