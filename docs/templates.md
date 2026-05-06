# Templates Reference

The tracker has three built-in templates. Every template supports three layouts.
You pick them with `?template=X&layout=Y` in the URL.

---

## Templates

### `ember` (default)

**Feel:** Warm, cozy, GitHub-native.
Inspired by GitHub's dark theme with coral accents.

Characteristics:
- Rounded rectangle card
- Thin 1px border
- Staggered fade-in animation on page load
- Columns: icon (SVG path) → label → big value → date sub-label

**Best paired with:** `dark`, `dracula`, `catppuccin` palettes

---

### `frost`

**Feel:** Cool, clean, minimal.
Navy/blue tones with a horizontal dashed accent line under the title.

Characteristics:
- Same rounded card as Ember
- Dashed line separates the title from the stats
- Slightly more whitespace between elements

**Best paired with:** `nord`, `catppuccin` palettes

---

### `neon`

**Feel:** Dark, electric, high-contrast.
Black background with SVG `<filter>` glow effects on the icons.

Characteristics:
- Pure black card (`#000000` base)
- SVG `feGaussianBlur` + `feComposite` glow filter applied to each icon
- Monospace font forced regardless of `?font=` param (for the aesthetic)

**Best paired with:** `dracula`, custom neon colors

---

## Layouts

### `row` (default)

Three stats side by side in a wide card.

```
┌─────────────────────────────────────────────┐
│  🔥 GitHub Streak Stats — username           │
├──────────────┬──────────────┬───────────────┤
│  📊 Total    │  🔥 Current  │  ⚡ Longest   │
│    1,247     │   42 days    │   56 days     │
│ Last 365 days│ Jan 1–Feb 11 │ Mar 1–Apr 25  │
└──────────────┴──────────────┴───────────────┘
```

Card size: **495 × 195 px**

---

### `stacked`

Three stats stacked vertically in a tall card.

```
┌─────────────────────────┐
│  GitHub Streak — user   │
├─────────────────────────┤
│  📊 TOTAL CONTRIBUTIONS │
│          1,247          │
│      Last 365 days      │
├─────────────────────────┤
│  🔥 CURRENT STREAK      │
│        42 days          │
│      Jan 1 – Feb 11     │
├─────────────────────────┤
│  ⚡ LONGEST STREAK      │
│        56 days          │
│     Mar 1 – Apr 25      │
└─────────────────────────┘
```

Card size: **300 × 280 px**

---

### `hero`

Current streak is shown large and centered. The other two stats appear smaller below.

```
┌─────────────────────────────────┐
│  GitHub Streak — username       │
│                                 │
│         🔥 CURRENT STREAK       │
│              42 days            │
│           Jan 1 – Feb 11        │
│                                 │
│  📊 Total: 1,247  ⚡ Best: 56   │
└─────────────────────────────────┘
```

Card size: **495 × 220 px**

---

## Color tokens

Every palette and custom color override uses these 9 tokens.
Templates read them from the `options.colors` object passed in.

| Token | Used for |
|-------|---------|
| `bg` | Card background fill |
| `border` | Card border stroke color |
| `title` | Title bar text ("GitHub Streak Stats — ...") |
| `value` | Generic text color (fallback) |
| `accent` | Current streak value and icon |
| `accentAlt` | Longest streak value and icon |
| `accentGreen` | Total contributions value and icon |
| `subtext` | Small date sub-labels |
| `divider` | Horizontal rule and column separator lines |

---

## How to add a new template

1. Create `src/templates/mytemplate.js`
2. Export a single function: `function mytemplate(data, options) { return '<svg>...</svg>'; }`
3. Open `src/templates/index.js` and add:
   ```js
   require('./mytemplate')   // in Node.js block
   // and
   registry.mytemplate = mytemplate;
   ```
4. Done. Call it with `?template=mytemplate`.

See `ember.js` as a copy-paste starting point.
