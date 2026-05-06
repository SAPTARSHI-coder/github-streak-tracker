'use strict';
/* global globalThis, window */
(function (root, factory) {
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = factory(require('../icons'));
  } else { root.EmberTemplate = factory(root.Icons); }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function (icons) {

  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmt(d) { if (!d) return ''; var p = d.split('-'); return MONTHS[+p[1]-1]+' '+parseInt(p[2],10)+', '+p[0]; }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // ── Layout definitions ────────────────────────────────────────────────────
  // yIcon  = bottom of icon (icon top = yIcon - iconSize)
  // yLabel = text baseline of the small ALL-CAPS label
  // yValue = text baseline of the big number
  // yDate  = text baseline of the date sub-label (null = skip)
  var LAYOUTS = {
    row: {
      W: 495, H: 170, titleY: 19, dividerY: 28,
      cols: [
        { x: 82,  yIcon: 60, yLabel: 78, yValue: 114, yDate: 132 },
        { x: 248, yIcon: 60, yLabel: 78, yValue: 114, yDate: 132 },
        { x: 413, yIcon: 60, yLabel: 78, yValue: 114, yDate: 132 },
      ],
      vDividers: [{ x:165, y1:28, y2:160 }, { x:330, y1:28, y2:160 }],
      hDividers: [],
    },
    stacked: {
      W: 495, H: 258, titleY: null, dividerY: null,
      cols: [
        { x: 248, yIcon: 46,  yLabel: 64,  yValue: 98,  yDate: 114 },
        { x: 248, yIcon: 130, yLabel: 148, yValue: 182, yDate: 198 },
        { x: 248, yIcon: 214, yLabel: 232, yValue: 250, yDate: null },
      ],
      vDividers: [],
      hDividers: [{ y:120, x1:30, x2:465 }, { y:204, x1:30, x2:465 }],
    },
    hero: {
      W: 495, H: 195, titleY: 19, dividerY: 28,
      cols: [
        { x: 82,  yIcon: 80,  yLabel: 100, yValue: 128, yDate: 144, scale: 0.8  },
        { x: 248, yIcon: 54,  yLabel: 74,  yValue: 118, yDate: 138, scale: 1.25 },
        { x: 413, yIcon: 80,  yLabel: 100, yValue: 128, yDate: 144, scale: 0.8  },
      ],
      vDividers: [{ x:165, y1:28, y2:182 }, { x:330, y1:28, y2:182 }],
      hDividers: [],
    },
  };

  function renderStat(col, opts) {
    var s = col.scale || 1;
    var iSz = Math.round(24 * s), vSz = Math.round(32 * s), lSz = Math.round(10 * s), dSz = Math.round(9 * s);
    var iX  = col.x - Math.round(iSz / 2);
    return [
      '<svg x="'+iX+'" y="'+(col.yIcon-iSz)+'" width="'+iSz+'" height="'+iSz+'" viewBox="0 0 24 24">'+opts.icon.replace(/FILL/g, opts.color)+'</svg>',
      '<text x="'+col.x+'" y="'+col.yLabel+'" text-anchor="middle" font-family="'+opts.font+'" font-size="'+lSz+'" fill="'+opts.labelColor+'" letter-spacing="1">'+esc(opts.label)+'</text>',
      '<text x="'+col.x+'" y="'+col.yValue+'" text-anchor="middle" font-family="'+opts.font+'" font-size="'+vSz+'" font-weight="700" fill="'+opts.color+'">'+esc(opts.value)+'</text>',
      col.yDate ? '<text x="'+col.x+'" y="'+col.yDate+'" text-anchor="middle" font-family="'+opts.font+'" font-size="'+dSz+'" fill="'+opts.subtextColor+'">'+esc(opts.sub||'')+'</text>' : '',
    ].join('\n');
  }

  function ember(data, options) {
    var layout = LAYOUTS[options.layout] || LAYOUTS.row;
    var C = options.colors, font = options.font || "'Inter','Helvetica Neue',Arial,sans-serif";
    var radius = options.borderRadius != null ? options.borderRadius : 12;
    var W = layout.W, H = layout.H;
    var isStacked = options.layout === 'stacked';

    var currentSub = data.currentStreak > 0
      ? fmt(data.streakStart) + ' \u2013 ' + fmt(data.streakEnd)
      : (data.lastContributionDate ? 'Last: ' + fmt(data.lastContributionDate) : 'No contributions');
    var longestSub = data.longestStreak > 0 ? fmt(data.longestStreakStart) + ' \u2013 ' + fmt(data.longestStreakEnd) : '';

    // Column order: Total | Current | Longest
    var stats = [
      { icon: icons.barChart, color: C.accentGreen, label: 'TOTAL CONTRIBUTIONS', value: Number(data.totalContributions).toLocaleString(), sub: 'Last 365 days' },
      { icon: icons.flame,    color: C.accent,      label: 'CURRENT STREAK',       value: data.currentStreak  + ' day' + (data.currentStreak  !== 1 ? 's' : ''), sub: currentSub },
      { icon: icons.bolt,     color: C.accentAlt,   label: 'LONGEST STREAK',        value: data.longestStreak + ' day' + (data.longestStreak !== 1 ? 's' : ''), sub: longestSub },
    ];

    var id = 'e' + Math.random().toString(36).slice(2, 7); // unique IDs per render
    var parts = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="GitHub Streak Stats for '+esc(data.username)+'">',
      '<title>GitHub Streak Stats \u2014 '+esc(data.username)+'</title>',
      // Gradient background definition
      '<defs>',
      '  <linearGradient id="bg-'+id+'" x1="0" y1="0" x2="1" y2="1">',
      '    <stop offset="0%" stop-color="'+C.bg+'"/>',
      '    <stop offset="100%" stop-color="'+adjustColor(C.bg, 12)+'"/>',
      '  </linearGradient>',
      '</defs>',
      // Card background
      '<rect width="'+W+'" height="'+H+'" rx="'+radius+'" ry="'+radius+'" fill="url(#bg-'+id+')" stroke="'+C.border+'" stroke-width="1"/>',
      // Accent top bar (thin colored line under title, full width minus padding)
      !isStacked ? '<rect x="0" y="0" width="'+W+'" height="3" rx="'+radius+'" ry="2" fill="'+C.accent+'" opacity="0.85"/>' : '',
    ];

    // Title (row + hero)
    if (!isStacked && layout.titleY) {
      parts.push('<text x="'+(W/2)+'" y="'+layout.titleY+'" text-anchor="middle" font-family="'+font+'" font-size="12.5" font-weight="600" fill="'+C.title+'" letter-spacing="0.5">GitHub Streak \u2014 '+esc(data.username)+'</text>');
      parts.push('<line x1="20" y1="'+layout.dividerY+'" x2="'+(W-20)+'" y2="'+layout.dividerY+'" stroke="'+C.divider+'" stroke-width="1"/>');
    }

    // Stacked: username footer
    if (isStacked) {
      parts.push('<text x="'+(W/2)+'" y="'+(H-8)+'" text-anchor="middle" font-family="'+font+'" font-size="9" fill="'+C.subtext+'">'+esc(data.username)+' \u2022 GitHub Streak</text>');
    }

    // Vertical dividers
    layout.vDividers.forEach(function(d) {
      parts.push('<line x1="'+d.x+'" y1="'+d.y1+'" x2="'+d.x+'" y2="'+d.y2+'" stroke="'+C.divider+'" stroke-width="1" opacity="0.6"/>');
    });
    // Horizontal dividers (stacked)
    layout.hDividers.forEach(function(d) {
      parts.push('<line x1="'+d.x1+'" y1="'+d.y+'" x2="'+d.x2+'" y2="'+d.y+'" stroke="'+C.divider+'" stroke-width="1" opacity="0.6"/>');
    });

    // Stat columns
    layout.cols.forEach(function(col, i) {
      var stat = stats[i];
      parts.push(renderStat(col, { icon: stat.icon, color: stat.color, label: stat.label, value: stat.value, sub: stat.sub, font: font, labelColor: C.title, subtextColor: C.subtext }));
    });

    parts.push('</svg>');
    return parts.join('\n');
  }

  // Lighten a hex color by adding `amount` to each RGB channel
  function adjustColor(hex, amount) {
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    r = Math.min(255, r+amount); g = Math.min(255, g+amount); b = Math.min(255, b+amount);
    return '#' + [r,g,b].map(function(v){ return v.toString(16).padStart(2,'0'); }).join('');
  }

  return ember;
});
