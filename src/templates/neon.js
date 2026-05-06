'use strict';
/* global globalThis, window */
(function (root, factory) {
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = factory(require('../icons'));
  } else { root.NeonTemplate = factory(root.Icons); }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function (icons) {

  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmt(d) { if (!d) return ''; var p = d.split('-'); return MONTHS[+p[1]-1]+' '+parseInt(p[2],10)+', '+p[0]; }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  var LAYOUTS = {
    row:     { W:495, H:170, titleY:19, dividerY:28, cols:[{x:82,yIcon:60,yLabel:78,yValue:114,yDate:132},{x:248,yIcon:60,yLabel:78,yValue:114,yDate:132},{x:413,yIcon:60,yLabel:78,yValue:114,yDate:132}], vDividers:[{x:165,y1:28,y2:160},{x:330,y1:28,y2:160}], hDividers:[] },
    stacked: { W:495, H:258, titleY:null, dividerY:null, cols:[{x:248,yIcon:46,yLabel:64,yValue:98,yDate:114},{x:248,yIcon:130,yLabel:148,yValue:182,yDate:198},{x:248,yIcon:214,yLabel:232,yValue:250,yDate:null}], vDividers:[], hDividers:[{y:120,x1:30,x2:465},{y:204,x1:30,x2:465}] },
    hero:    { W:495, H:195, titleY:19, dividerY:28, cols:[{x:82,yIcon:80,yLabel:100,yValue:128,yDate:144,scale:0.8},{x:248,yIcon:54,yLabel:74,yValue:118,yDate:138,scale:1.25},{x:413,yIcon:80,yLabel:100,yValue:128,yDate:144,scale:0.8}], vDividers:[{x:165,y1:28,y2:182},{x:330,y1:28,y2:182}], hDividers:[] },
  };

  function renderStat(col, opts) {
    var s = col.scale || 1;
    var iSz = Math.round(22*s), vSz = Math.round(28*s), lSz = Math.round(9*s), dSz = Math.round(8.5*s);
    var iX = col.x - Math.round(iSz/2);
    return [
      '<svg x="'+iX+'" y="'+(col.yIcon-iSz)+'" width="'+iSz+'" height="'+iSz+'" viewBox="0 0 24 24" filter="url(#ng)">'+opts.icon.replace(/FILL/g,opts.color)+'</svg>',
      '<text x="'+col.x+'" y="'+col.yLabel+'" text-anchor="middle" font-family="'+opts.font+'" font-size="'+lSz+'" fill="'+opts.labelColor+'" letter-spacing="1.5">'+esc(opts.label)+'</text>',
      '<text x="'+col.x+'" y="'+col.yValue+'" text-anchor="middle" font-family="'+opts.font+'" font-size="'+vSz+'" font-weight="700" fill="'+opts.color+'" filter="url(#ng)">'+esc(opts.value)+'</text>',
      col.yDate ? '<text x="'+col.x+'" y="'+col.yDate+'" text-anchor="middle" font-family="'+opts.font+'" font-size="'+dSz+'" fill="'+opts.subtextColor+'">'+esc(opts.sub||'')+'</text>' : '',
    ].join('\n');
  }

  function neon(data, options) {
    var layout = LAYOUTS[options.layout] || LAYOUTS.row;
    var C = options.colors, font = options.font || "'JetBrains Mono','Fira Code','Courier New',monospace";
    var radius = options.borderRadius != null ? options.borderRadius : 10;
    var W = layout.W, H = layout.H, isStacked = options.layout === 'stacked';

    var currentSub = data.currentStreak > 0
      ? fmt(data.streakStart)+' \u2013 '+fmt(data.streakEnd)
      : (data.lastContributionDate ? 'Last: '+fmt(data.lastContributionDate) : 'No contributions');
    var longestSub = data.longestStreak > 0 ? fmt(data.longestStreakStart)+' \u2013 '+fmt(data.longestStreakEnd) : '';

    var stats = [
      { icon:icons.barChart, color:C.accentGreen, label:'TOTAL',          value:Number(data.totalContributions).toLocaleString(), sub:'Last 365 days' },
      { icon:icons.flame,    color:C.accent,      label:'CURRENT STREAK', value:data.currentStreak +' day'+(data.currentStreak !==1?'s':''), sub:currentSub },
      { icon:icons.bolt,     color:C.accentAlt,   label:'LONGEST',         value:data.longestStreak+' day'+(data.longestStreak!==1?'s':''), sub:longestSub },
    ];

    var parts = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="GitHub Streak Stats for '+esc(data.username)+'">',
      '<title>GitHub Streak Stats \u2014 '+esc(data.username)+'</title>',
      // Neon glow filter
      '<defs><filter id="ng" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b1"/><feGaussianBlur stdDeviation="8" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="bg-glow" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>',
      // Background (pure black for neon contrast)
      '<rect width="'+W+'" height="'+H+'" rx="'+radius+'" ry="'+radius+'" fill="'+C.bg+'"/>',
      // Glowing border (two layers: glow + crisp)
      '<rect width="'+W+'" height="'+H+'" rx="'+radius+'" ry="'+radius+'" fill="none" stroke="'+C.border+'" stroke-width="4" opacity="0.25" filter="url(#bg-glow)"/>',
      '<rect width="'+W+'" height="'+H+'" rx="'+radius+'" ry="'+radius+'" fill="none" stroke="'+C.border+'" stroke-width="1"/>',
      // Neon accent top bar
      !isStacked ? '<rect x="0" y="0" width="'+W+'" height="3" rx="'+radius+'" ry="2" fill="'+C.accent+'" opacity="0.9" filter="url(#ng)"/>' : '',
    ];

    if (!isStacked && layout.titleY) {
      parts.push('<text x="'+(W/2)+'" y="'+layout.titleY+'" text-anchor="middle" font-family="'+font+'" font-size="11" font-weight="700" fill="'+C.title+'" letter-spacing="2">STREAK STATS \u2014 '+esc(data.username.toUpperCase())+'</text>');
      parts.push('<line x1="20" y1="'+layout.dividerY+'" x2="'+(W-20)+'" y2="'+layout.dividerY+'" stroke="'+C.divider+'" stroke-width="1"/>');
    }
    if (isStacked) parts.push('<text x="'+(W/2)+'" y="'+(H-8)+'" text-anchor="middle" font-family="'+font+'" font-size="8.5" fill="'+C.subtext+'">'+esc(data.username.toUpperCase())+' \u2022 GITHUB STREAK</text>');

    layout.vDividers.forEach(function(d){ parts.push('<line x1="'+d.x+'" y1="'+d.y1+'" x2="'+d.x+'" y2="'+d.y2+'" stroke="'+C.divider+'" stroke-width="1" opacity="0.4"/>'); });
    layout.hDividers.forEach(function(d){ parts.push('<line x1="'+d.x1+'" y1="'+d.y+'" x2="'+d.x2+'" y2="'+d.y+'" stroke="'+C.divider+'" stroke-width="1" opacity="0.4"/>'); });

    layout.cols.forEach(function(col,i){
      var st = stats[i];
      parts.push(renderStat(col,{icon:st.icon,color:st.color,label:st.label,value:st.value,sub:st.sub,font:font,labelColor:C.title,subtextColor:C.subtext}));
    });
    parts.push('</svg>');
    return parts.join('\n');
  }
  return neon;
});
