'use strict';

/**
 * src/templates/index.js — Template registry (UMD)
 *
 * WHY THIS FILE EXISTS:
 *   Rather than hardcoding which template to use in api/streak.js, we keep
 *   a central registry here. Adding a new template means:
 *     1. Create src/templates/mytemplate.js
 *     2. require() it here and add it to the `registry` object below.
 *   Nothing else needs to change.
 *
 * EXPORTS:
 *   registry    — { ember: fn, frost: fn, neon: fn }
 *   getTemplate — (name) => templateFn  (falls back to "ember" if unknown)
 *
 * UMD PATTERN:
 *   Works identically in Node.js (require) and the browser (window.Templates).
 */

/* global globalThis, window */
(function (root, factory) {
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = factory(
      require('./ember'),
      require('./frost'),
      require('./neon')
    );
  } else {
    root.Templates = factory(
      root.EmberTemplate,
      root.FrostTemplate,
      root.NeonTemplate
    );
  }
})(
  typeof globalThis !== 'undefined' ? globalThis
    : typeof window !== 'undefined' ? window : this,
  function (ember, frost, neon) {
    'use strict';

    /** All available templates keyed by their URL-safe name */
    var registry = { ember: ember, frost: frost, neon: neon };

    /**
     * Look up a template by name.
     * @param {string} name  — 'ember' | 'frost' | 'neon'
     * @returns {Function}   — The template render function
     */
    function getTemplate(name) {
      return registry[name] || registry.ember; // default to ember
    }

    return { registry: registry, getTemplate: getTemplate };
  }
);
