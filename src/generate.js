'use strict';

/**
 * src/generate.js — CLI tool to generate a streak SVG and write it to a file.
 *
 * PURPOSE:
 *   Used by the GitHub Actions workflow (update-streak.yml) to regenerate
 *   streak.svg daily and commit it back to the repository.
 *   Also useful for local testing without running the full HTTP server.
 *
 * USAGE:
 *   node src/generate.js <username> [output] [template] [palette] [layout] [font]
 *
 * ARGUMENTS (all except username are optional):
 *   username   — Your GitHub login, e.g. SAPTARSHI-coder
 *   output     — Path to write the SVG to      (default: streak.svg)
 *   template   — ember | frost | neon           (default: ember)
 *   palette    — dark | dracula | catppuccin | nord | light (default: dark)
 *   layout     — row | stacked | hero           (default: row)
 *   font       — inter | jetbrains | spacegrotesk | mono (default: inter)
 *
 * EXAMPLES:
 *   node src/generate.js SAPTARSHI-coder
 *   node src/generate.js SAPTARSHI-coder streak.svg ember dracula hero
 *   node src/generate.js SAPTARSHI-coder out/card.svg frost nord stacked
 *
 * ENVIRONMENT VARIABLES:
 *   GITHUB_TOKEN   Required. Set in .env locally, or via Actions secrets in CI.
 *
 * OUTPUT:
 *   Writes the SVG file to the specified path and prints a summary to stdout.
 *   Exits with code 1 on any error so CI jobs fail loudly.
 */

require('dotenv').config(); // load .env for local runs

const fs   = require('fs');
const path = require('path');

const { fetchContributions } = require('./github');
const { calculateStreaks }   = require('./streak');
const { getTemplate }        = require('./templates/index');

// ── Read CLI arguments ────────────────────────────────────────────────────────
// process.argv = ['node', 'src/generate.js', arg0, arg1, ...]
const [,, username, outArg, template, palette, layout, font] = process.argv;

if (!username) {
  console.error('Usage: node src/generate.js <username> [output] [template] [palette] [layout] [font]');
  process.exit(1);
}

if (!process.env.GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is not set.');
  console.error('  Locally: copy .env.example to .env and add your token.');
  console.error('  In CI: add GITHUB_TOKEN to the workflow env block.');
  process.exit(1);
}

// Apply defaults for optional args
const outputFile   = outArg    || 'streak.svg';
const templateName = template  || 'ember';
const paletteName  = palette   || 'dark';
const layoutName   = layout    || 'row';
const fontName     = font      || 'inter';

// ── Palette & font definitions (duplicated from api/streak.js) ─────────────────
// We duplicate them here so this CLI has zero dependency on the HTTP layer.
const PALETTES = {
  dark:       { bg:'#0d1117', border:'#30363d', title:'#8b949e', value:'#e6edf3', accent:'#f78166', accentAlt:'#58a6ff', accentGreen:'#3fb950', subtext:'#6e7681', divider:'#21262d' },
  dracula:    { bg:'#282a36', border:'#6272a4', title:'#8be9fd', value:'#f8f8f2', accent:'#ff79c6', accentAlt:'#bd93f9', accentGreen:'#50fa7b', subtext:'#6272a4', divider:'#44475a' },
  catppuccin: { bg:'#1e1e2e', border:'#313244', title:'#cdd6f4', value:'#cdd6f4', accent:'#cba6f7', accentAlt:'#89dceb', accentGreen:'#a6e3a1', subtext:'#7f849c', divider:'#313244' },
  nord:       { bg:'#2e3440', border:'#3b4252', title:'#d8dee9', value:'#eceff4', accent:'#88c0d0', accentAlt:'#81a1c1', accentGreen:'#a3be8c', subtext:'#4c566a', divider:'#3b4252' },
  light:      { bg:'#ffffff', border:'#d0d7de', title:'#57606a', value:'#1f2328', accent:'#cf222e', accentAlt:'#0969da', accentGreen:'#1a7f37', subtext:'#8c959f', divider:'#eaeef2' },
};
const FONT_STACKS = {
  inter:        "'Inter', 'Helvetica Neue', Arial, sans-serif",
  jetbrains:    "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  spacegrotesk: "'Space Grotesk', 'Segoe UI', sans-serif",
  mono:         "'Courier New', Courier, monospace",
};

const colors    = PALETTES[paletteName]   || PALETTES.dark;
const fontStack = FONT_STACKS[fontName]   || FONT_STACKS.inter;

// ── Main async function ────────────────────────────────────────────────────────
async function main() {
  console.log(`Fetching contributions for "${username}"…`);

  const data   = await fetchContributions(username, process.env.GITHUB_TOKEN);
  const streak = calculateStreaks(data.contributionDays);

  console.log(`  Current streak : ${streak.currentStreak} day(s)`);
  console.log(`  Longest streak : ${streak.longestStreak} day(s)`);
  console.log(`  Total (365d)   : ${streak.totalContributions} contributions`);

  const renderFn = getTemplate(templateName);
  const svg = renderFn(
    {
      username:             data.login,
      totalContributions:   streak.totalContributions,
      currentStreak:        streak.currentStreak,
      longestStreak:        streak.longestStreak,
      streakStart:          streak.streakStart,
      streakEnd:            streak.streakEnd,
      longestStreakStart:   streak.longestStreakStart,
      longestStreakEnd:     streak.longestStreakEnd,
      lastContributionDate: streak.lastContributionDate,
    },
    {
      colors,
      font:         fontStack,
      layout:       layoutName,
      borderRadius: 10,
      borderWidth:  1,
      borderStyle:  'solid',
    }
  );

  // Ensure the output directory exists before writing
  const dir = path.dirname(path.resolve(outputFile));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(outputFile, svg, 'utf8');
  console.log(`\nSVG written to: ${path.resolve(outputFile)}`);
  console.log(`Template: ${templateName} | Palette: ${paletteName} | Layout: ${layoutName}`);
}

main().catch((err) => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
