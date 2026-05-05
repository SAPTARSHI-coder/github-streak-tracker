/**
 * test.js — Quick unit tests for streak calculation logic.
 *
 * Run with:  node src/test.js
 *
 * No test framework needed — pure Node assertions.
 */

'use strict';

const assert = require('assert');
const { calculateStreaks } = require('./streak');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌  ${name}`);
    console.error(`      → ${err.message}`);
    failed++;
  }
}

// ── Helper to build contribution day arrays ─────────────────────────────────

function makeDays(spec) {
  // spec: array of [dateStr, count]
  return spec.map(([date, contributionCount]) => ({ date, contributionCount }));
}

function daysRange(startDate, endDate, countFn) {
  const days = [];
  const cur = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  while (cur <= end) {
    const d = cur.toISOString().slice(0, 10);
    days.push({ date: d, contributionCount: countFn(d) });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

// ── Tests ───────────────────────────────────────────────────────────────────

console.log('\nRunning streak logic tests…\n');

test('Empty input returns all zeros', () => {
  const r = calculateStreaks([]);
  assert.equal(r.currentStreak, 0);
  assert.equal(r.longestStreak, 0);
  assert.equal(r.totalContributions, 0);
});

test('Single active day counts as streak of 1', () => {
  // Use yesterday so streak stays alive
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10);
  const days = makeDays([[dateStr, 5]]);
  const r = calculateStreaks(days);
  assert.equal(r.currentStreak, 1);
  assert.equal(r.longestStreak, 1);
  assert.equal(r.totalContributions, 5);
});

test('All-zero days → streak = 0', () => {
  const days = daysRange('2024-01-01', '2024-01-30', () => 0);
  const r = calculateStreaks(days);
  assert.equal(r.currentStreak, 0);
  assert.equal(r.longestStreak, 0);
  assert.equal(r.totalContributions, 0);
});

test('Longest streak is correctly identified in past data', () => {
  const days = makeDays([
    ['2024-01-01', 1],
    ['2024-01-02', 2],
    ['2024-01-03', 0], // break
    ['2024-01-04', 1],
    ['2024-01-05', 1],
    ['2024-01-06', 1],
    ['2024-01-07', 0], // break
    ['2024-01-08', 1],
  ]);
  const r = calculateStreaks(days);
  assert.equal(r.longestStreak, 3, 'Longest should be 3');
  assert.equal(r.longestStreakStart, '2024-01-04');
  assert.equal(r.longestStreakEnd, '2024-01-06');
});

test('Total contributions sum is correct', () => {
  const days = makeDays([
    ['2024-03-01', 10],
    ['2024-03-02', 0],
    ['2024-03-03', 7],
    ['2024-03-04', 3],
  ]);
  const r = calculateStreaks(days);
  assert.equal(r.totalContributions, 20);
});

test('Streak broken long ago → currentStreak = 0', () => {
  // All contributions are old (more than 1 day ago)
  const days = makeDays([
    ['2023-06-01', 5],
    ['2023-06-02', 3],
    ['2023-06-03', 1],
  ]);
  const r = calculateStreaks(days);
  assert.equal(r.currentStreak, 0);
  assert.equal(r.longestStreak, 3);
});

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(
  `\n${'─'.repeat(40)}\nResults: ${passed} passed, ${failed} failed\n`
);
process.exit(failed > 0 ? 1 : 0);
