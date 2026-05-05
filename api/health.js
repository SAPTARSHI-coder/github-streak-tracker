/**
 * api/health.js — Vercel Serverless Function
 *
 * Endpoint:  GET /health
 * Returns JSON with server uptime and cache stats.
 * Useful for Vercel uptime monitors and deployment verification.
 */

'use strict';

const cache = require('../src/cache');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end('Method Not Allowed');
  }

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  return res.status(200).json({
    ok           : true,
    service      : 'github-streak-tracker',
    version      : '2.0.0',
    cacheEntries : cache.size(),
    tokenSet     : Boolean(process.env.GITHUB_TOKEN),
    timestamp    : new Date().toISOString(),
  });
};
