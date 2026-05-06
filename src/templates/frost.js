'use strict';
/* global globalThis, window */
(function (root, factory) {
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = factory(require('../icons'));
  } else { root.FrostTemplate = factory(root.Icons); }
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
    var iSz = Math.round(22*s), vSz = Math.round(30*s), lSz = Math.round(10*s), dSz = Math.round(9*s);
    var iX = col.x - Math.round(iSz/2);
    return [
      '<svg x="'+iX+'" y="'+(col.yIcon-iSz)+'" width="'+iSz+'" height="'+iSz+'" viewBox="0 0 24 24">'+opts.icon.replace(/FILL/g,opts.color)+'</svg>',
      '<text x="'+col.x+'" y="'+col.yLabel+'" text-anchor="middle" font-family="'+opts.font+'" font-size="'+lSz+'" fill="'+opts.labelColor+'" letter-spacing="1.2">'+esc(opts.label)+'</text>',
      '<text x="'+col.x+'" y="'+col.yValue+'" text-anchor="middle" font-family="'+opts.font+'" font-size="'+vSz+'" font-weight="600" fill="'+opts.color+'">'+esc(opts.value)+'</text>',
      col.yDate ? '<text x="'+col.x+'" y="'+col.yDate+'" text-anchor="middle" font-family="'+opts.font+'" font-size="'+dSz+'" fill="'+opts.subtextColor+'">'+esc(opts.sub||'')+'</text>' : '',
    ].join('\n');
  }

  function frost(data, options) {
    var layout = LAYOUTS[options.layout] || LAYOUTS.row;
    var C = options.colors, font = options.font || "'Inter','Helvetica Neue',Arial,sans-serif";
    var radius = options.borderRadius != null ? options.borderRadius : 14;
    var W = layout.W, H = layout.H, isStacked = options.layout === 'stacked';
    var id = 'f'+Math.random().toString(36).slice(2,7);

    var currentSub = data.currentStreak > 0
      ? fmt(data.streakStart)+' \u2013 '+fmt(data.streakEnd)
      : (data.lastContributionDate ? 'Last: '+fmt(data.lastContributionDate) : 'No contributions');
    var longestSub = data.longestStreak > 0 ? fmt(data.longestStreakStart)+' \u2013 '+fmt(data.longestStreakEnd) : '';

    var stats = [
      { icon:icons.barChart, color:C.accentGreen, label:'TOTAL CONTRIBUTIONS', value:Number(data.totalContributions).toLocaleString(), sub:'Last 365 days' },
      { icon:icons.flame,    color:C.accent,      label:'CURRENT STREAK',       value:data.currentStreak +' day'+(data.currentStreak !==1?'s':''), sub:currentSub },
      { icon:icons.bolt,     color:C.accentAlt,   label:'LONGEST STREAK',        value:data.longestStreak+' day'+(data.longestStreak!==1?'s':''), sub:longestSub },
    ];

    var parts = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="GitHub Streak Stats for '+esc(data.username)+'">',
      '<title>GitHub Streak Stats \u2014 '+esc(data.username)+'</title>',
      '<defs>',
      '<linearGradient id="ll-'+id+'" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="'+C.accentAlt+'" stop-opacity="0"/><stop offset="30%" stop-color="'+C.accentAlt+'" stop-opacity="0.9"/><stop offset="70%" stop-color="'+C.accentAlt+'" stop-opacity="0.9"/><stop offset="100%" stop-color="'+C.accentAlt+'" stop-opacity="0"/></linearGradient>',
      '</defs>',
      '<rect width="'+W+'" height="'+H+'" rx="'+radius+'" ry="'+radius+'" fill="'+C.bg+'" stroke="'+C.border+'" stroke-width="1"/>',
      !isStacked ? '<rect x="0" y="0" width="'+W+'" height="3" rx="'+radius+'" ry="2" fill="url(#ll-'+id+')"/>' : '',
    ];

    if (!isStacked && layout.titleY) {
      parts.push('<text x="'+(W/2)+'" y="'+layout.titleY+'" text-anchor="middle" font-family="'+font+'" font-size="12" font-weight="500" fill="'+C.title+'" letter-spacing="0.4">GitHub Streak \u2014 '+esc(data.username)+'</text>');
      parts.push('<line x1="20" y1="'+layout.dividerY+'" x2="'+(W-20)+'" y2="'+layout.dividerY+'" stroke="'+C.divider+'" stroke-width="1"/>');
      parts.push('<line x1="60" y1="'+(layout.dividerY+3)+'" x2="'+(W-60)+'" y2="'+(layout.dividerY+3)+'" stroke="'+C.accentAlt+'" stroke-width="1" stroke-dasharray="4 8" opacity="0.4"/>');
    }
    if (isStacked) parts.push('<text x="'+(W/2)+'" y="'+(H-8)+'" text-anchor="middle" font-family="'+font+'" font-size="9" fill="'+C.subtext+'">'+esc(data.username)+' \u2022 GitHub Streak</text>');

    layout.vDividers.forEach(function(d){ parts.push('<line x1="'+d.x+'" y1="'+d.y1+'" x2="'+d.x+'" y2="'+d.y2+'" stroke="'+C.divider+'" stroke-width="1" opacity="0.5"/>'); });
    layout.hDividers.forEach(function(d){ parts.push('<line x1="'+d.x1+'" y1="'+d.y+'" x2="'+d.x2+'" y2="'+d.y+'" stroke="'+C.divider+'" stroke-width="1" opacity="0.5"/>'); });

    layout.cols.forEach(function(col,i){
      var st = stats[i];
      parts.push(renderStat(col,{icon:st.icon,color:st.color,label:st.label,value:st.value,sub:st.sub,font:font,labelColor:C.title,subtextColor:C.subtext}));
    });
    parts.push('</svg>');
    return parts.join('\n');
  }
  return frost;
});
