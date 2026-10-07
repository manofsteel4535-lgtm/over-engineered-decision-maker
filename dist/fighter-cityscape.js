// Round 1 scenery only. Fixed coordinate clusters make every redraw deterministic.
// Coordinates use a 1120 × 395 design space; the shared combat floor remains untouched.
const TOWERS = [
  [-18, 58, 115, 'step'], [54, 41, 182, 'crown'], [108, 60, 147, 'slope'],
  [182, 50, 232, 'spire'], [246, 65, 173, 'step'], [326, 43, 118, 'crown'],
  [382, 62, 207, 'slope'], [459, 48, 266, 'spire'], [521, 62, 156, 'step'],
  [600, 42, 192, 'crown'], [655, 63, 132, 'slope'], [734, 51, 246, 'spire'],
  [799, 64, 176, 'step'], [878, 46, 215, 'crown'], [938, 62, 144, 'slope'],
  [1015, 49, 228, 'spire'], [1078, 56, 165, 'step'],
];
const BASE = 391;
const crosshair = (ctx, x, y, size = 7) => {
  ctx.beginPath(); ctx.moveTo(x - size, y); ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size); ctx.lineTo(x, y + size); ctx.stroke();
};
const outline = (ctx, points) => {
  ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath();
};
function roof(x, width, top, style) {
  if (style === 'spire') return [[x,top+28],[x+width*.22,top+28],[x+width*.22,top+8],[x+width*.5,top-18],[x+width*.78,top+8],[x+width*.78,top+28],[x+width,top+28]];
  if (style === 'step') return [[x,top+22],[x+width*.18,top+22],[x+width*.18,top],[x+width*.72,top],[x+width*.72,top+12],[x+width,top+12]];
  if (style === 'slope') return [[x,top+26],[x+width*.8,top],[x+width,top+12]];
  return [[x,top+12],[x+width*.12,top+12],[x+width*.12,top],[x+width*.88,top],[x+width*.88,top+12],[x+width,top+12]];
}

/** Cached skyline, atmospheric bloom and CAD annotations. No animation or combat RNG. */
export function drawCityscape(ctx, width, height, theme) {
  const neon = theme.buildingStyle === 'NEON_SKYLINE';
  ctx.save(); ctx.scale(width / 1120, height / 395);
  const haze = ctx.createRadialGradient(560, 382, 12, 560, 382, 550);
  haze.addColorStop(0, theme.horizonColor); haze.addColorStop(1, neon ? 'rgba(6, 182, 212, 0)' : 'rgba(100, 116, 139, 0)');
  ctx.fillStyle = haze; ctx.fillRect(0, 0, 1120, 395);

  // Far and middle silhouettes establish depth behind the hero tower cluster.
  for (let layer = 0; layer < 2; layer++) {
    ctx.globalAlpha = neon ? .45 + layer * .22 : .24 + layer * .12;
    ctx.fillStyle = neon ? (layer ? '#111d35' : '#17263b') : theme.buildingFill;
    ctx.strokeStyle = neon ? '#1c3b4c' : '#94a3b8'; ctx.lineWidth = .7;
    for (let i = 0; i < 26; i++) {
      const x = i * 46 - layer * 15, h = 46 + (Math.sin(i * 7.31 + layer) + 1) * (35 + layer * 20);
      outline(ctx, [...roof(x, 38, BASE - h, i % 2 ? 'step' : 'slope'), [x+38,BASE], [x,BASE]]);
      ctx.fill(); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  for (let index = 0; index < TOWERS.length; index++) {
    const [x,w,h,style] = TOWERS[index], top = BASE - h;
    outline(ctx, [...roof(x,w,top,style), [x+w,BASE], [x,BASE]]);
    ctx.fillStyle = theme.buildingFill; ctx.fill();
    ctx.strokeStyle = neon ? theme.buildingStroke : '#334155'; ctx.lineWidth = neon ? 1 : 1.2; ctx.stroke();
    // A shaded side face, ribs and a roof crown replace flat rectangular facades.
    ctx.fillStyle = neon ? '#050d1c' : '#b8c5d4';
    ctx.fillRect(x + w * .76, top + 30, w * .23, h - 30);
    ctx.strokeStyle = neon ? 'rgba(6, 182, 212, 0.22)' : 'rgba(100, 116, 139, 0.4)'; ctx.lineWidth = .7;
    for (const ratio of [.25, .5, .75]) { ctx.beginPath(); ctx.moveTo(x+w*ratio,top+34); ctx.lineTo(x+w*ratio,BASE); ctx.stroke(); }
    for (let row = 0; row < (h - 40) / 14; row++) {
      const y = top + 38 + row * 14;
      if (neon) {
        ctx.fillStyle = index % 3 === 0 ? '#ec4899' : '#06b6d4';
        for (let column = 0; column < Math.floor(w / 12) - 1; column++) if ((row * 3 + column + index) % 5 !== 0) {
          ctx.globalAlpha = .35 + ((row + column + index) % 3) * .25;
          ctx.fillRect(x + 8 + column * 12, y, 3, 4);
        }
        ctx.globalAlpha = 1;
      } else {
        ctx.beginPath(); ctx.moveTo(x+5,y); ctx.lineTo(x+w-5,y); ctx.stroke();
      }
    }
    const tip = style === 'spire' ? top - 18 : top;
    ctx.strokeStyle = neon ? theme.accentGlow : '#334155'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x+w*.5,tip); ctx.lineTo(x+w*.5,tip-21); ctx.stroke();
    if (neon) {
      ctx.fillStyle = index % 3 === 0 ? '#ec4899' : theme.accentGlow;
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 7;
      ctx.beginPath(); ctx.arc(x+w*.5,tip-21,2,0,Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
      if (index % 4 === 0) { ctx.strokeStyle = '#06b6d4'; ctx.globalAlpha = .6; ctx.beginPath(); ctx.moveTo(x+2,top+30); ctx.lineTo(x+2,BASE-5); ctx.stroke(); ctx.globalAlpha = 1; }
    } else {
      ctx.strokeStyle = '#64748b'; crosshair(ctx,x+w*.5,tip-21,5);
    }
  }
  if (!neon) {
    ctx.strokeStyle = '#64748b'; ctx.fillStyle = '#475569'; ctx.lineWidth = .8; ctx.font = '9px monospace';
    ctx.setLineDash([5,6]);
    for (const x of [207,483,759,1039]) { ctx.beginPath(); ctx.moveTo(x,45); ctx.lineTo(x,BASE); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(24,118); ctx.lineTo(1096,118); ctx.moveTo(24,BASE); ctx.lineTo(1096,BASE); ctx.stroke(); ctx.setLineDash([]);
    for (const [x,y,r] of [[96,111,39],[565,88,48],[939,83,29]]) {
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke(); crosshair(ctx,x,y,9);
      ctx.beginPath(); ctx.arc(x,y,r+7,-.9,.6); ctx.stroke();
    }
    // Architectural dimensions, arrowheads and elevation ticks are background notation.
    ctx.beginPath(); ctx.moveTo(319,74); ctx.lineTo(797,74); ctx.moveTo(319,68); ctx.lineTo(319,88); ctx.moveTo(797,68); ctx.lineTo(797,88); ctx.stroke();
    for (const [x,d] of [[319,1],[797,-1]]) { ctx.beginPath(); ctx.moveTo(x,74); ctx.lineTo(x+d*7,71); ctx.moveTo(x,74); ctx.lineTo(x+d*7,77); ctx.stroke(); }
    ctx.fillText('METROPOLIS // 478.00 m',482,64);
    ctx.beginPath(); ctx.moveTo(33,144); ctx.lineTo(33,BASE); ctx.stroke();
    for (let y = 144; y <= BASE; y += 18) { ctx.beginPath(); ctx.moveTo(28,y); ctx.lineTo(38,y); ctx.stroke(); }
    ctx.fillText('EL. +247.00',40,139); ctx.fillText('DATUM ±0.00',40,382);
  }
  ctx.restore();
}

/** Bounded Round 1 motion: distant upward data columns or a quiet drafting scan. */
export function drawCityscapeTelemetry(ctx, width, height, theme, time, reduced) {
  ctx.save(); ctx.scale(width / 1120, height / 395);
  if (theme.buildingStyle === 'NEON_SKYLINE') {
    for (let i = 0; i < (reduced ? 4 : 10); i++) {
      const x = 50 + i * 113, y = 335 - ((reduced ? i * 19 : time * 22 + i * 37) % 235);
      const pillar = ctx.createLinearGradient(x, y, x, y + 72);
      pillar.addColorStop(0, 'rgba(6, 182, 212, 0)'); pillar.addColorStop(.7, 'rgba(6, 182, 212, 0.11)'); pillar.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = pillar; ctx.fillRect(x,y,2,72);
      ctx.fillStyle = theme.particleColor; ctx.globalAlpha = .2;
      for (let j = 0; j < 4; j++) ctx.fillRect(x-3,y+12+j*13,1+(i+j)%3,2);
      ctx.globalAlpha = 1;
    }
    for (const index of [3,7,11,15]) {
      const [x,w,h] = TOWERS[index], y = BASE - h - 39;
      ctx.strokeStyle = index === 7 ? '#ec4899' : theme.accentGlow;
      ctx.globalAlpha = reduced ? .35 : .3 + Math.sin(time * 1.3 + index) * .15;
      ctx.beginPath(); ctx.arc(x+w*.5,y,5+(reduced ? 0 : Math.sin(time*1.2+index)*1.2),0,Math.PI*2); ctx.stroke();
    }
  } else {
    ctx.strokeStyle = theme.particleColor; ctx.globalAlpha = .4; ctx.lineWidth = .8;
    const x = reduced ? 565 : 45 + (time * 18) % 1030;
    ctx.setLineDash([2,8]); ctx.beginPath(); ctx.moveTo(x,90); ctx.lineTo(x,385); ctx.stroke(); ctx.setLineDash([]);
    crosshair(ctx,x,118,6);
  }
  ctx.restore();
}
