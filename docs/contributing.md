# Contributing Guide

Thank you for wanting to improve this project!
Below are the most common contributions and exactly how to do each one.

---

## Adding a new template

A template is a single JavaScript function that receives data and options
and returns an SVG string.

### Step 1 — Create the file

Create `src/templates/mytemplate.js`:

```js
'use strict';

/**
 * mytemplate — description of the card style
 */

// Pull in the icon library (SVG path data for flame, bolt, bar-chart)
var Icons = (typeof require !== 'undefined') ? require('../icons') : window.Icons;

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('../icons'));
  } else {
    root.MyTemplate = factory(root.Icons);
  }
})(typeof globalThis !== 'undefined' ? globalThis : window, function (Icons) {

  /**
   * @param {object} data
   * @param {string} data.username
   * @param {number} data.totalContributions
   * @param {number} data.currentStreak
   * @param {number} data.longestStreak
   * @param {string|null} data.streakStart       — "YYYY-MM-DD"
   * @param {string|null} data.streakEnd         — "YYYY-MM-DD"
   * @param {string|null} data.longestStreakStart
   * @param {string|null} data.longestStreakEnd
   * @param {object} options
   * @param {object} options.colors   — { bg, border, title, accent, accentAlt, accentGreen, subtext, divider }
   * @param {string} options.font     — CSS font-family string
   * @param {string} options.layout   — "row" | "stacked" | "hero"
   * @returns {string} Complete SVG string
   */
  function mytemplate(data, options) {
    var c = options.colors;   // short alias for colors
    var f = options.font;     // short alias for font

    // Color the icon paths
    var flameIcon = Icons.flame.replace(/FILL/g, c.accent);

    return [
      '<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195" viewBox="0 0 495 195">',
      '  <rect width="495" height="195" rx="10" fill="' + c.bg + '" stroke="' + c.border + '" stroke-width="1"/>',
      '  <!-- add your card content here -->',
      '  <text x="248" y="100" text-anchor="middle" font-family="' + f + '" font-size="24" fill="' + c.accent + '">',
      '    ' + data.currentStreak + ' days',
      '  </text>',
      '</svg>',
    ].join('\n');
  }

  return mytemplate;
});
```

### Step 2 — Register it

Open `src/templates/index.js` and add two lines:

```js
// In the Node.js block:
module.exports = factory(
  require('./ember'),
  require('./frost'),
  require('./neon'),
  require('./mytemplate')  // ← ADD THIS
);

// In the factory function parameters:
function (ember, frost, neon, mytemplate) {

// In the registry:
var registry = { ember: ember, frost: frost, neon: neon, mytemplate: mytemplate };
```

### Step 3 — Test it

```bash
node src/generate.js YOUR_USERNAME test.svg mytemplate dark row
```

Open `test.svg` in a browser to verify it looks correct.

---

## Adding a new palette

Open `api/streak.js` and find the `PALETTES` object (around line 55).
Add your new palette:

```js
const PALETTES = {
  // ... existing palettes ...

  gruvbox: {
    bg:          '#282828', // card background
    border:      '#504945', // card border
    title:       '#ebdbb2', // title bar text
    value:       '#ebdbb2', // generic text
    accent:      '#fb4934', // current streak (fire color)
    accentAlt:   '#83a598', // longest streak (bolt color)
    accentGreen: '#b8bb26', // total contributions (chart color)
    subtext:     '#928374', // small date labels
    divider:     '#3c3836', // separator lines
  },
};
```

Also add it to `VALID_PALETTES`:
```js
const VALID_PALETTES = new Set(['dark', 'dracula', 'catppuccin', 'nord', 'light', 'custom', 'gruvbox']);
```

Then also add the same object to `src/generate.js` in the `PALETTES` block there.

Test with:
```
/streak?username=SAPTARSHI-coder&palette=gruvbox
```

---

## Reporting a bug

Open an issue using the **Bug Report** template in `.github/ISSUE_TEMPLATE/`.
Include:
- The exact URL that failed
- What you expected to see
- What you actually saw (screenshot if possible)
- Your browser and OS

---

## Submitting a pull request

1. Fork the repo
2. Create a branch: `git checkout -b feat/my-new-template`
3. Make your changes
4. Test with `node src/generate.js YOUR_USERNAME test.svg`
5. Open a PR against `main` using the PR template
