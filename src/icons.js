'use strict';

/**
 * src/icons.js — Custom SVG path icons (UMD module)
 *
 * WHY THIS FILE EXISTS:
 *   GitHub's image proxy strips emoji characters (🔥⚡📊) from SVG files,
 *   so they never render in README cards. Instead, we use raw SVG <path>
 *   data from Heroicons v2 (MIT License — https://heroicons.com).
 *
 * HOW TO USE:
 *   Each icon is a string containing one <path> element.
 *   The literal text "FILL" is a placeholder for the color.
 *
 *   Example:
 *     const colored = icons.flame.replace(/FILL/g, '#f78166');
 *     // Then drop `colored` inside:
 *     // <svg viewBox="0 0 24 24" width="22" height="22">{colored}</svg>
 *
 * UMD PATTERN:
 *   Works in both Node.js (require) and the browser (window.Icons).
 *   The templates import this the same way in both environments.
 */

/* global globalThis, window */
(function (root, factory) {
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    // Node.js / CommonJS
    module.exports = factory();
  } else {
    // Browser — attach to global window object
    root.Icons = factory();
  }
})(
  typeof globalThis !== 'undefined' ? globalThis
    : typeof window   !== 'undefined' ? window : this,
  function () {
    return {
      /**
       * flame — used for CURRENT STREAK column
       * Source: Heroicons "fire" (solid, 24px)
       */
      flame: '<path fill-rule="evenodd" clip-rule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177A7.547 7.547 0 0 1 6.648 6.61a.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248zm.66 11.964a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.545 3.75 3.75 0 0 1 3.255 3.717z" fill="FILL"/>',

      /**
       * bolt — used for LONGEST STREAK column
       * Source: Heroicons "bolt" (solid, 24px)
       */
      bolt: '<path fill-rule="evenodd" clip-rule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143z" fill="FILL"/>',

      /**
       * barChart — used for TOTAL CONTRIBUTIONS column
       * Source: Heroicons "chart-bar" (solid, 24px)
       */
      barChart: '<path fill-rule="evenodd" clip-rule="evenodd" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75zm6.75-4.5c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625zm6.75-4.5c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125z" fill="FILL"/>',
    };
  }
);
