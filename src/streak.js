/**
 * streak.js — Contribution streak calculation logic
 *
 * All date comparisons are done in UTC/ISO strings (YYYY-MM-DD) to avoid
 * timezone drift issues.
 */

'use strict';

/**
 * Returns today's date as a YYYY-MM-DD string in UTC.
 * If the current time is past midnight UTC the date will already have
 * rolled over — which is correct behaviour for a GitHub-style streak.
 */
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Subtract one calendar day from a YYYY-MM-DD string and return the result.
 */
function previousDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Calculate streak statistics from an array of contribution day objects.
 *
 * GitHub's definition of "streak":
 *   - A streak is a consecutive run of calendar days with ≥ 1 contribution.
 *   - If you haven't contributed today but contributed yesterday the current
 *     streak is still alive (the day isn't over yet).
 *   - If neither today nor yesterday has contributions the streak is 0.
 *
 * @param {Array<{ date: string, contributionCount: number }>} contributionDays
 *   Sorted chronologically (oldest first).
 *
 * @returns {{
 *   currentStreak: number,
 *   longestStreak: number,
 *   totalContributions: number,
 *   streakStart: string | null,
 *   streakEnd: string | null,
 *   longestStreakStart: string | null,
 *   longestStreakEnd: string | null,
 *   lastContributionDate: string | null,
 * }}
 */
function calculateStreaks(contributionDays) {
  if (!contributionDays || contributionDays.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalContributions: 0,
      streakStart: null,
      streakEnd: null,
      longestStreakStart: null,
      longestStreakEnd: null,
      lastContributionDate: null,
    };
  }

  // Build a fast date → count lookup
  const countByDate = {};
  let totalContributions = 0;
  let lastContributionDate = null;

  for (const day of contributionDays) {
    countByDate[day.date] = day.contributionCount;
    totalContributions += day.contributionCount;
    if (day.contributionCount > 0) {
      lastContributionDate = day.date;
    }
  }

  const today = todayUTC();
  const yesterday = previousDay(today);

  // ── Current Streak ──────────────────────────────────────────────────────────
  // Start from today; if today has no contributions, allow yesterday as the
  // "open end" of the streak (the day isn't over yet in all timezones).

  let currentStreak = 0;
  let streakStart = null;
  let streakEnd = null;

  // Determine the anchor point to walk backwards from
  let cursor;
  if ((countByDate[today] || 0) > 0) {
    cursor = today;
  } else if ((countByDate[yesterday] || 0) > 0) {
    cursor = yesterday;
  } else {
    cursor = null; // streak is broken
  }

  if (cursor !== null) {
    streakEnd = cursor;
    while ((countByDate[cursor] || 0) > 0) {
      currentStreak += 1;
      streakStart = cursor;
      cursor = previousDay(cursor);
    }
  }

  // ── Longest Streak ──────────────────────────────────────────────────────────
  let longestStreak = 0;
  let longestStreakStart = null;
  let longestStreakEnd = null;

  let runLength = 0;
  let runStart = null;

  // Walk forward through all days
  for (const day of contributionDays) {
    if (day.contributionCount > 0) {
      if (runLength === 0) runStart = day.date;
      runLength += 1;
      if (runLength > longestStreak) {
        longestStreak = runLength;
        longestStreakStart = runStart;
        longestStreakEnd = day.date;
      }
    } else {
      runLength = 0;
      runStart = null;
    }
  }

  // The current streak might be longer than any historical streak
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
    longestStreakStart = streakStart;
    longestStreakEnd = streakEnd;
  }

  return {
    currentStreak,
    longestStreak,
    totalContributions,
    streakStart,
    streakEnd,
    longestStreakStart,
    longestStreakEnd,
    lastContributionDate,
  };
}

/**
 * Format a YYYY-MM-DD string as a human-readable label like "Jan 1, 2025".
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const [year, month, day] = dateStr.split('-').map(Number);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[month - 1]} ${day}, ${year}`;
}

module.exports = { calculateStreaks, formatDate, todayUTC };
