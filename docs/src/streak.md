# 🔢 `src/streak.js` — Streak Calculation Algorithm

This is the **brain** of the project. Pure JavaScript — no HTTP, no external libraries, no side effects. Easy to test and reason about.

---

## Exported Functions

```js
const { calculateStreaks, formatDate, todayUTC } = require('./streak');
```

---

## `calculateStreaks(contributionDays)`

### Input

```js
[
  { date: '2025-01-01', contributionCount: 5 },
  { date: '2025-01-02', contributionCount: 0 },
  { date: '2025-01-03', contributionCount: 2 },
  // … sorted oldest → newest
]
```

### Output

```js
{
  currentStreak: 3,                    // consecutive active days ending today/yesterday
  longestStreak: 14,                   // longest ever consecutive active run
  totalContributions: 847,             // sum of all counts
  streakStart: '2025-04-28',           // start date of current streak
  streakEnd: '2025-04-30',             // end date of current streak
  longestStreakStart: '2025-01-01',    // start of longest historical streak
  longestStreakEnd: '2025-01-14',      // end of longest historical streak
  lastContributionDate: '2025-04-30', // most recent day with count > 0
}
```

If there are no contributions at all, every number is `0` and all dates are `null`.

---

## Algorithm Walkthrough

### Step 1: Build a lookup map

```js
const countByDate = {};         // { '2025-01-01': 5, '2025-01-02': 0, … }
let totalContributions = 0;
let lastContributionDate = null;

for (const day of contributionDays) {
  countByDate[day.date] = day.contributionCount;
  totalContributions += day.contributionCount;
  if (day.contributionCount > 0) lastContributionDate = day.date;
}
```

The map makes date lookups O(1) instead of O(n) for each backward step.

### Step 2: Determine the current streak anchor

```js
const today     = todayUTC();       // "2025-05-06"
const yesterday = previousDay(today); // "2025-05-05"

let cursor;
if (countByDate[today] > 0) {
  cursor = today;         // contributed today → start from today
} else if (countByDate[yesterday] > 0) {
  cursor = yesterday;     // haven't contributed yet today, but did yesterday → still alive
} else {
  cursor = null;          // streak is broken
}
```

**Why yesterday?** GitHub uses the same logic — your streak survives until the *end* of the calendar day. Since users are in different timezones, if you haven't contributed today yet (in UTC), you still get the benefit of yesterday's contribution keeping the streak alive.

### Step 3: Walk backwards counting the streak

```js
if (cursor !== null) {
  streakEnd = cursor;
  while (countByDate[cursor] > 0) {
    currentStreak++;
    streakStart = cursor;           // keep updating — last assigned is the earliest date
    cursor = previousDay(cursor);   // go back one day
  }
}
```

The loop stops as soon as it hits a day with `contributionCount === 0` or a date not in the map (before the 365-day window).

### Step 4: Find the longest streak (single forward pass)

```js
let runLength = 0;
let runStart  = null;

for (const day of contributionDays) {           // iterate oldest → newest
  if (day.contributionCount > 0) {
    if (runLength === 0) runStart = day.date;   // mark start of new run
    runLength++;
    if (runLength > longestStreak) {
      longestStreak      = runLength;
      longestStreakStart = runStart;
      longestStreakEnd   = day.date;
    }
  } else {
    runLength = 0;   // reset on any zero day
    runStart  = null;
  }
}
```

O(n) time — one pass, no nested loops.

After the loop, the current streak is compared to the historical longest (the current streak isn't in the historical data, so it must be handled separately):

```js
if (currentStreak > longestStreak) {
  longestStreak      = currentStreak;
  longestStreakStart = streakStart;
  longestStreakEnd   = streakEnd;
}
```

---

## `formatDate(dateStr)`

Converts `"2025-01-06"` → `"Jan 6, 2025"`.

```js
formatDate('2025-01-06')   // → "Jan 6, 2025"
formatDate(null)           // → "N/A"
```

Used in `src/svg.js` to display date ranges under each streak number.

---

## `todayUTC()`

Returns today's date as `"YYYY-MM-DD"` in **UTC**.

```js
todayUTC()   // → "2025-05-06"
```

Using UTC is important — GitHub's contribution calendar is also in UTC. Using local time could shift the day boundary and break streak logic for users in UTC+ timezones.

---

## Edge Cases Handled

| Situation | Behaviour |
|-----------|-----------|
| Empty array | All zeros, all nulls |
| All zeros | `currentStreak = 0`, `longestStreak = 0` |
| No contributions for 2+ days | `currentStreak = 0`, `longestStreak` reflects history |
| Current streak > longest historical | `longestStreak` is updated to current |
| Single active day (today) | `currentStreak = 1`, `longestStreak = 1` |
| Single active day (yesterday) | `currentStreak = 1`, `longestStreak = 1` |
| Single active day (2 days ago) | `currentStreak = 0`, `longestStreak = 1` |

---

## How to Run the Tests

```bash
node src/test.js
```

The test file covers all the edge cases above with simple `assert` calls — no framework needed.
