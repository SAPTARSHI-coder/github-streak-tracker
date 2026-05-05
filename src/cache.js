/**
 * cache.js — Simple in-memory TTL cache
 *
 * Avoids hitting the GitHub API on every request.
 * Default TTL: 1 hour (configurable via CACHE_TTL_SECONDS env var).
 *
 * For production deployments (Render, Railway, etc.) this is sufficient.
 * If you need a persistent cache across serverless invocations, swap this
 * module out for a Redis or KV store adapter.
 */

'use strict';

const TTL_MS = (parseInt(process.env.CACHE_TTL_SECONDS, 10) || 3600) * 1000;

/** @type {Map<string, { data: any, expiresAt: number }>} */
const store = new Map();

/**
 * Retrieve a cached value.  Returns `null` on miss or expiry.
 * @param {string} key
 */
function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Store a value in the cache.
 * @param {string} key
 * @param {any}    data
 * @param {number} [ttlMs]  — Override the default TTL (milliseconds)
 */
function set(key, data, ttlMs = TTL_MS) {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * Delete a key from the cache immediately.
 * @param {string} key
 */
function invalidate(key) {
  store.delete(key);
}

/** Return the number of active (non-expired) cache entries. */
function size() {
  const now = Date.now();
  let count = 0;
  for (const [k, v] of store) {
    if (now <= v.expiresAt) count++;
    else store.delete(k);
  }
  return count;
}

module.exports = { get, set, invalidate, size };
