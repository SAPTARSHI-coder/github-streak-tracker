/**
 * customizer.js — Live SVG card customizer
 *
 * Builds and re-renders the streak SVG entirely in the browser
 * whenever any control changes. No server round-trips needed.
 */

'use strict';

// ── Theme palettes (mirrors src/svg.js) ──────────────────────────────────────
const THEMES = {
  dark: {
    bg: '#0d1117', border: '#30363d', title: '#8b949e',
    value: '#e6edf3', accent: '#f78166', accentAlt: '#58a6ff',
    accentGreen: '#3fb950', divider: '#21262d', subtext: '#6e7681',
  },
  light: {
    bg: '#ffffff', border: '#d0d7de', title: '#57606a',
    value: '#1f2328', accent: '#cf222e', accentAlt: '#0969da',
    accentGreen: '#1a7f37', divider: '#eaeef2', subtext: '#8c959f',
  },
  radical: {
    bg: '#141321', border: '#fe428e', title: '#a9fef7',
    value: '#fe428e', accent: '#fe428e', accentAlt: '#f8d847',
    accentGreen: '#a9fef7', divider: '#2a2a4a', subtext: '#f8d847',
  },
  tokyonight: {
    bg: '#1a1b27', border: '#2f3241', title: '#a9b1d6',
    value: '#c0caf5', accent: '#f7768e', accentAlt: '#7aa2f7',
    accentGreen: '#9ece6a', divider: '#292e42', subtext: '#565f89',
  },
};

// ── Font stacks ──────────────────────────────────────────────────────────────
const FONTS = {
  segoe:    "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  inter:    "'Inter', sans-serif",
  jetbrains:"'JetBrains Mono', monospace",
  fira:     "'Fira Code', monospace",
  space:    "'Space Grotesk', sans-serif",
  orbitron: "'Orbitron', sans-serif",
  syne:     "'Syne', sans-serif",
};

// ── State ────────────────────────────────────────────────────────────────────
const state = {
  username: 'SAPTARSHI-coder',
  theme: 'dark',
  font: 'segoe',
  effect: 'none',
  radius: 10,
  borderWidth: 1,
  fontSize: 28,
  animation: true,
  hideFooter: false,
  iconTotal: '📊',
  iconCurrent: '🔥',
  iconLongest: '⚡',
  total: 1247,
  current: 42,
  longest: 87,
  custom: {
    bg: '#0a0a0a', border: '#6c47ff', title: '#a0a0b0',
    value: '#ffffff', accent: '#6c47ff', accentAlt: '#00d4ff',
    accentGreen: '#00ff88', divider: '#1a1a2e', subtext: '#555577',
  },
};

// ── DOM references ────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const card      = $('preview-card');
const metaTheme = $('meta-theme');
const metaFont  = $('meta-font');
const metaEffect= $('meta-effect');
const feedback  = $('copy-feedback');

// ── Escape XML ───────────────────────────────────────────────────────────────
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── Resolve colors ────────────────────────────────────────────────────────────
function resolveColors() {
  if (state.theme === 'custom') return { ...state.custom };
  return { ...THEMES[state.theme] };
}

// ── Build defs section (filters/gradients for effects) ────────────────────────
function buildDefs(C, W, H) {
  const { effect } = state;
  let defs = '<defs>';

  if (effect === 'glow') {
    defs += `
      <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>`;
  }

  if (effect === 'neon') {
    defs += `
      <filter id="neon-filter" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="5" result="blur1"/>
        <feGaussianBlur stdDeviation="12" result="blur2"/>
        <feMerge>
          <feMergeNode in="blur2"/>
          <feMergeNode in="blur1"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>`;
  }

  if (effect === 'glass') {
    defs += `
      <filter id="glass-filter">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.5"/>
      </filter>`;
  }

  if (effect === 'gradient-bg') {
    defs += `
      <linearGradient id="grad-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${C.bg}"/>
        <stop offset="100%" stop-color="${adjustColor(C.bg, 25)}"/>
      </linearGradient>`;
  }

  if (effect === 'animated-border') {
    defs += `
      <linearGradient id="anim-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${C.accent}">
          <animateTransform attributeName="gradientTransform" type="rotate"
            from="0 0.5 0.5" to="360 0.5 0.5" dur="3s" repeatCount="indefinite"/>
        </stop>
        <stop offset="50%" stop-color="${C.accentAlt}"/>
        <stop offset="100%" stop-color="${C.accentGreen}"/>
      </linearGradient>`;
  }

  defs += '</defs>';
  return defs;
}

// ── Simple color lightening utility ───────────────────────────────────────────
function adjustColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// ── Build one stat column ────────────────────────────────────────────────────
function statColumn({ x, y, icon, color, label, value, C, sub, filterRef }) {
  const font   = FONTS[state.font];
  const fSize  = state.fontSize;
  const filter = filterRef ? ` filter="url(#${filterRef})"` : '';

  return `
    <text x="${x}" y="${y}" text-anchor="middle" font-size="26" fill="${color}"${filter}>${icon}</text>
    <text x="${x}" y="${y + 24}" text-anchor="middle"
          font-family="${font}" font-size="10.5" fill="${C.title}" letter-spacing="0.8">
      ${escapeXml(label)}
    </text>
    <text x="${x}" y="${y + 54}" text-anchor="middle"
          font-family="${font}" font-size="${fSize}" font-weight="700" fill="${color}"${filter}>
      ${escapeXml(value)}
    </text>
    ${sub ? `<text x="${x}" y="${y + 73}" text-anchor="middle"
          font-family="${font}" font-size="10" fill="${C.subtext}">
      ${escapeXml(sub)}
    </text>` : ''}`;
}

// ── Build the full SVG ────────────────────────────────────────────────────────
function buildSVG() {
  const C = resolveColors();
  const font = FONTS[state.font];
  const { effect, radius, borderWidth, animation, hideFooter, username } = state;

  const W = 495, H = 195;
  const col1X = Math.round(W * 0.165);
  const col2X = Math.round(W * 0.5);
  const col3X = Math.round(W * 0.835);
  const rowY = 50;

  // Pick background fill based on effect
  const bgFill = effect === 'gradient-bg' ? 'url(#grad-bg)' : C.bg;

  // Pick border based on effect
  const borderStroke = effect === 'animated-border'
    ? 'url(#anim-grad)'
    : C.border;

  // Pick filter ref
  const filterRef = (effect === 'glow') ? 'glow-filter'
    : (effect === 'neon') ? 'neon-filter'
    : null;

  // Fade animation helper
  const fadeAnim = (delay) => animation
    ? `<animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="${delay}s" fill="freeze"/>`
    : '';

  // Glass overlay
  const glassOverlay = effect === 'glass' ? `
    <rect width="${W}" height="${H}" rx="${radius}" ry="${radius}"
          fill="rgba(255,255,255,0.04)" filter="url(#glass-filter)"/>
    <rect width="${W}" height="${H}" rx="${radius}" ry="${radius}"
          fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>` : '';

  // Neon glow rect
  const neonRect = effect === 'neon' ? `
    <rect width="${W}" height="${H}" rx="${radius}" ry="${radius}"
          fill="none" stroke="${C.border}" stroke-width="3"
          filter="url(#neon-filter)" opacity="0.7"/>` : '';

  const now = new Date().toUTCString().replace(' GMT', ' UTC');

  return `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${W}" height="${H}"
  viewBox="0 0 ${W} ${H}"
  role="img"
  aria-label="GitHub Streak Stats for ${escapeXml(username)}"
>
  <title>GitHub Streak Stats — ${escapeXml(username)}</title>

  ${buildDefs(C, W, H)}

  <!-- Background -->
  <rect width="${W}" height="${H}" rx="${radius}" ry="${radius}"
        fill="${bgFill}" stroke="${borderStroke}" stroke-width="${borderWidth}"/>

  ${glassOverlay}
  ${neonRect}

  <!-- Title -->
  <text x="${W / 2}" y="22" text-anchor="middle"
        font-family="${font}" font-size="13" font-weight="600"
        fill="${C.title}" letter-spacing="0.8">
    ${state.iconCurrent} GitHub Streak Stats — ${escapeXml(username)}
  </text>

  <!-- Divider under title -->
  <line x1="20" y1="32" x2="${W - 20}" y2="32"
        stroke="${C.divider}" stroke-width="1"/>

  <!-- Vertical dividers -->
  <line x1="${Math.round(W / 3)}" y1="38" x2="${Math.round(W / 3)}" y2="${H - 14}"
        stroke="${C.divider}" stroke-width="1"/>
  <line x1="${Math.round((W * 2) / 3)}" y1="38" x2="${Math.round((W * 2) / 3)}" y2="${H - 14}"
        stroke="${C.divider}" stroke-width="1"/>

  <!-- Column 1: Total -->
  <g opacity="${animation ? 0 : 1}">${fadeAnim(0.1)}
    ${statColumn({
      x: col1X, y: rowY, icon: state.iconTotal,
      color: C.accentGreen, label: 'TOTAL CONTRIBUTIONS',
      value: Number(state.total).toLocaleString(),
      C, sub: 'Last 365 days', filterRef,
    })}
  </g>

  <!-- Column 2: Current Streak -->
  <g opacity="${animation ? 0 : 1}">${fadeAnim(0.25)}
    ${statColumn({
      x: col2X, y: rowY, icon: state.iconCurrent,
      color: C.accent, label: 'CURRENT STREAK',
      value: `${state.current} days`,
      C, sub: `May 1 – May ${new Date().getDate()}, 2025`, filterRef,
    })}
  </g>

  <!-- Column 3: Longest Streak -->
  <g opacity="${animation ? 0 : 1}">${fadeAnim(0.4)}
    ${statColumn({
      x: col3X, y: rowY, icon: state.iconLongest,
      color: C.accentAlt, label: 'LONGEST STREAK',
      value: `${state.longest} days`,
      C, sub: 'Feb 3 – Apr 30, 2025', filterRef,
    })}
  </g>

  ${!hideFooter ? `
  <!-- Footer -->
  <text x="${W / 2}" y="${H - 6}" text-anchor="middle"
        font-family="${font}" font-size="9.5" fill="${C.subtext}">
    Updated ${now}
  </text>` : ''}
</svg>`;
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  const svg = buildSVG();
  card.innerHTML = svg;
  metaTheme.textContent  = state.theme;
  metaFont.textContent   = state.font;
  metaEffect.textContent = state.effect;
}

// ── Show copy feedback ────────────────────────────────────────────────────────
function showFeedback(msg = '✓ Copied!') {
  feedback.textContent = msg;
  feedback.classList.add('show');
  setTimeout(() => feedback.classList.remove('show'), 2200);
}

// ── Wire up controls ──────────────────────────────────────────────────────────
function bindControls() {

  // Username
  $('ctrl-username').addEventListener('input', (e) => {
    state.username = e.target.value || 'SAPTARSHI-coder';
    render();
  });

  // Theme swatches
  document.querySelectorAll('.theme-swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-swatch').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.theme = btn.dataset.theme;
      const cc = $('custom-colors');
      state.theme === 'custom' ? cc.classList.add('visible') : cc.classList.remove('visible');
      render();
    });
  });

  // Custom color pickers — sync color ↔ hex inputs
  const colorPairs = [
    ['c-bg',     'c-bg-hex',     'bg'],
    ['c-border', 'c-border-hex', 'border'],
    ['c-title',  'c-title-hex',  'title'],
    ['c-value',  'c-value-hex',  'value'],
    ['c-accent', 'c-accent-hex', 'accent'],
    ['c-alt',    'c-alt-hex',    'accentAlt'],
    ['c-green',  'c-green-hex',  'accentGreen'],
  ];

  colorPairs.forEach(([pickerId, hexId, key]) => {
    const picker = $(pickerId);
    const hex    = $(hexId);

    picker.addEventListener('input', () => {
      hex.value = picker.value;
      state.custom[key] = picker.value;
      if (state.theme === 'custom') render();
      // update swatch preview
      $('swatch-custom').style.setProperty('--bg', state.custom.bg);
      $('swatch-custom').style.setProperty('--border', state.custom.border);
      $('swatch-custom').style.setProperty('--accent', state.custom.accent);
    });

    hex.addEventListener('input', () => {
      if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) {
        picker.value = hex.value;
        state.custom[key] = hex.value;
        if (state.theme === 'custom') render();
      }
    });
  });

  // Font buttons
  document.querySelectorAll('.font-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.font-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.font = btn.dataset.font;
      render();
    });
  });

  // Effect buttons
  document.querySelectorAll('.effect-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.effect-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.effect = btn.dataset.effect;
      render();
    });
  });

  // Sliders
  $('ctrl-radius').addEventListener('input', (e) => {
    state.radius = +e.target.value;
    $('radius-val').textContent = `${state.radius}px`;
    render();
  });

  $('ctrl-border-width').addEventListener('input', (e) => {
    state.borderWidth = +e.target.value;
    $('border-val').textContent = `${state.borderWidth}px`;
    render();
  });

  $('ctrl-font-size').addEventListener('input', (e) => {
    state.fontSize = +e.target.value;
    $('fontsize-val').textContent = `${state.fontSize}px`;
    render();
  });

  // Toggles
  $('ctrl-animation').addEventListener('change', (e) => {
    state.animation = e.target.checked;
    $('anim-label').textContent = state.animation ? 'On' : 'Off';
    render();
  });

  $('ctrl-hide-footer').addEventListener('change', (e) => {
    state.hideFooter = e.target.checked;
    $('footer-label').textContent = state.hideFooter ? 'On' : 'Off';
    render();
  });

  // Icons
  ['total', 'current', 'longest'].forEach((key) => {
    $(`icon-${key}`).addEventListener('input', (e) => {
      state[`icon${key.charAt(0).toUpperCase() + key.slice(1)}`] = e.target.value || '⬜';
      render();
    });
  });

  // Preview data
  $('ctrl-total').addEventListener('input', (e) => { state.total = +e.target.value || 0; render(); });
  $('ctrl-current').addEventListener('input', (e) => { state.current = +e.target.value || 0; render(); });
  $('ctrl-longest').addEventListener('input', (e) => { state.longest = +e.target.value || 0; render(); });

  // Copy SVG button
  $('btn-copy-svg').addEventListener('click', () => {
    navigator.clipboard.writeText(buildSVG()).then(() => showFeedback('✓ SVG copied!'));
  });

  // Copy URL button
  $('btn-copy-url').addEventListener('click', () => {
    const params = new URLSearchParams({
      username: state.username,
      theme: state.theme,
      font: state.font,
      effect: state.effect,
    });
    const url = `${location.origin}/api/streak?${params}`;
    navigator.clipboard.writeText(url).then(() => showFeedback('✓ URL copied!'));
  });

  // Reset button
  $('btn-reset').addEventListener('click', () => {
    location.reload();
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
bindControls();
render();
