import { ARENA, MOVES } from './fighter-engine.js';
import { stageForRound, getActiveRoundStage } from './fighter-stages.js';
import { drawCityscape, drawCityscapeTelemetry } from './fighter-cityscape.js';

const { width: W, height: H, floor: FLOOR } = ARENA;
const NEURAL_NODES = [[75,150],[175,80],[235,255],[340,150],[435,70],[485,300],[565,180],[660,75],[735,265],[815,150],[910,80],[970,300],[1045,175]];
const NEURAL_EDGES = [[0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[4,6],[5,6],[6,7],[6,8],[7,9],[8,9],[9,10],[9,11],[10,12],[11,12],[4,7],[5,8]];
const circle = (ctx, x, y, radius) => { ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke(); };
const polygon = (ctx, points, fill, stroke, line = 2) => {
  ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke(); }
};

/** Static city/grid is cached; only characters, vehicles and bounded effects redraw. */
export class FighterRenderer {
  constructor(canvas, engine) {
    this.canvas = canvas; this.engine = engine; this.ctx = canvas.getContext('2d', { alpha: false });
    this.background = document.createElement('canvas'); this.background.width = W; this.background.height = H;
    this.time = 0; this.particles = []; this.shake = 0; this.flash = 0; this.trails = [];
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }
  setTheme(theme) {
    this.dark = theme === 'dark';
    // Fighter colors stay independent of map styling; switching palettes never touches the engine.
    this.colors = this.dark ? { a: '#22e8f5', b: '#ff526f', gold: '#ffd071', armor: '#0c2336' } : { a: '#007d99', b: '#c52749', gold: '#b77910', armor: '#f1faff' };
  }
  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    // Bound the pixel budget on large/high-DPI displays, keeping the arena at 720p.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5, 1280 / bounds.width);
    const width = Math.round(bounds.width * dpr), height = Math.round(bounds.height * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
  }
  cacheBackground(stage, c) {
    const round = this.engine.currentRound;
    this.backgroundRound = round; this.backgroundTheme = this.dark; this.mapColors = c;
    const ctx = this.background.getContext('2d');
    ctx.globalAlpha = 1; ctx.textAlign = 'start'; ctx.shadowBlur = 0; ctx.lineWidth = 1;
    const sky = ctx.createLinearGradient(0, 0, 0, FLOOR);
    sky.addColorStop(0, c.bgGradient[0]); sky.addColorStop(1, c.bgGradient[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // Only static scenery is cached; all geometry is deterministic and bounded.
    if (round === 1) {
      drawCityscape(ctx, W, 395, c);
    } else if (round === 2 && this.dark) {
      ctx.strokeStyle = c.skylineOrStructureColor; ctx.globalAlpha = .48;
      for (const [a, b] of NEURAL_EDGES) {
        const start = NEURAL_NODES[a], end = NEURAL_NODES[b];
        ctx.beginPath(); ctx.moveTo(...start); ctx.lineTo(...end); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      for (const [x, y] of NEURAL_NODES) {
        ctx.fillStyle = c.structureFill; ctx.strokeStyle = c.accentGlow;
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = c.particleColor;
      for (let i = 0; i < 70; i++) { ctx.globalAlpha = .2 + (i % 4) * .1; ctx.fillRect((i * 137.51) % W, (i * 71.23) % 340, 1, 1); }
      ctx.globalAlpha = 1;
    } else if (round === 2) {
      ctx.strokeStyle = c.skylineOrStructureColor;
      for (const [x, radius] of [[235, 72], [W / 2, 126], [885, 72]]) {
        circle(ctx, x, 192, radius); circle(ctx, x, 192, radius + 12);
        for (let i = 0; i < 16; i++) {
          const a = i * Math.PI / 8; ctx.beginPath();
          ctx.moveTo(x + Math.cos(a) * radius, 192 + Math.sin(a) * radius);
          ctx.lineTo(x + Math.cos(a) * (radius + 8), 192 + Math.sin(a) * (radius + 8)); ctx.stroke();
        }
        ctx.strokeStyle = c.gridColor; ctx.beginPath(); ctx.moveTo(x - radius - 20, 192); ctx.lineTo(x + radius + 20, 192); ctx.stroke();
        ctx.fillStyle = c.particleColor; ctx.fillRect(x - 2, 190, 4, 4);
        ctx.strokeStyle = c.skylineOrStructureColor;
      }
      for (const x of [85, W - 85]) polygon(ctx, [[x - 32, 105], [x + 32, 105], [x + 32, 305], [x - 32, 305]], c.structureFill, c.skylineOrStructureColor, 1);
      ctx.strokeStyle = c.gridColor; ctx.beginPath(); ctx.moveTo(85, 115); ctx.lineTo(W - 85, 115); ctx.moveTo(85, 300); ctx.lineTo(W - 85, 300); ctx.stroke();
    } else {
      ctx.strokeStyle = c.gridColor;
      for (let x = 0; x < W; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 395); ctx.stroke(); }
      if (this.dark) {
        const core = ctx.createRadialGradient(W / 2, 186, 8, W / 2, 186, 104);
        core.addColorStop(0, '#fb7185'); core.addColorStop(.24, '#be123c'); core.addColorStop(1, '#120207');
        ctx.fillStyle = core; ctx.beginPath(); ctx.arc(W / 2, 186, 90, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = c.skylineOrStructureColor; circle(ctx, W / 2, 186, 93);
        for (const ratio of [.28, .65]) { ctx.beginPath(); ctx.ellipse(W / 2, 186, 90 * ratio, 90, .25, 0, Math.PI * 2); ctx.stroke(); }
        for (let i = 0; i < 9; i++) {
          const a = i * Math.PI * 2 / 9;
          polygon(ctx, [[W / 2 + Math.cos(a) * 115,186 + Math.sin(a) * 115],[W / 2 + Math.cos(a + .12) * 144,186 + Math.sin(a + .12) * 144],[W / 2 + Math.cos(a + .25) * 111,186 + Math.sin(a + .25) * 111]], c.structureFill, c.accentGlow, 1);
        }
      } else {
        ctx.strokeStyle = c.skylineOrStructureColor; ctx.lineWidth = 3;
        circle(ctx, W / 2, 186, 110); circle(ctx, W / 2, 186, 127); ctx.lineWidth = 1;
        for (let i = 0; i < 24; i++) {
          const a = i * Math.PI / 12;
          ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * 111, 186 + Math.sin(a) * 111);
          ctx.lineTo(W / 2 + Math.cos(a) * 126, 186 + Math.sin(a) * 126); ctx.stroke();
        }
        for (const x of [W / 2 - 180, W / 2 + 180]) {
          polygon(ctx, [[x - 12, 170], [x + 12, 170], [x + 12, 205], [x - 12, 205]], '#facc15', '#0f172a', 2);
          ctx.fillStyle = '#0f172a'; ctx.font = 'bold 24px monospace'; ctx.fillText('!', x - 7, 196);
        }
      }
      ctx.fillStyle = c.accentGlow; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
      ctx.fillText('CRITICAL DECISION OVERLOAD', W / 2, 336); ctx.textAlign = 'start';
    }
    const floor = ctx.createLinearGradient(0, 360, 0, H);
    floor.addColorStop(0, round === 1 ? c.bgGradient[1] : c.horizonColor); floor.addColorStop(1, c.bgGradient[0]);
    ctx.fillStyle = floor; ctx.fillRect(0, 395, W, H - 395);
    ctx.strokeStyle = c.gridColor; ctx.lineWidth = 1;
    for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 27, 395); ctx.lineTo(W / 2 + i * 135, H); ctx.stroke(); }
    for (const y of [399, 411, 429, 456, 495, 548, 620]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = c.bgGradient[1]; ctx.fillRect(0, FLOOR, W, 10);
    ctx.shadowColor = c.accentGlow; ctx.shadowBlur = this.dark && !this.reduced ? 8 : 0;
    ctx.strokeStyle = c.floorLineColor; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(W, FLOOR); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = c.skylineOrStructureColor; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText(stage.subtitle + ' // ' + (this.dark ? stage.darkSector : stage.lightSector), W / 2, 586);
    if (c.hazardBarColor) {
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 608, W, 14);
      ctx.shadowColor = c.hazardBarColor; ctx.shadowBlur = this.dark && !this.reduced ? 5 : 0;
      for (let x = -32; x < W; x += 32) polygon(ctx, [[x, 608], [x + 14, 608], [x + 28, 622], [x + 14, 622]], c.hazardBarColor, null);
      ctx.shadowBlur = 0;
    }
    for (const x of [24, W - 48]) { ctx.fillStyle = c.structureFill; ctx.fillRect(x, 401, 24, 98); ctx.strokeStyle = c.skylineOrStructureColor; ctx.strokeRect(x, 401, 24, 98); ctx.fillStyle = x < 50 ? this.colors.a : this.colors.b; ctx.fillRect(x + 9, 421, 6, 56); }
  }
  drawEnvironment(theme) {
    const ctx = this.ctx, round = this.engine.currentRound, time = this.reduced ? 0 : this.time;
    if (round === 1) {
      drawCityscapeTelemetry(ctx, W, 395, theme, time, this.reduced);
    } else if (round === 2 && this.dark) {
      for (let i = 0; i < NEURAL_EDGES.length; i++) {
        const [a, b] = NEURAL_EDGES[i], start = NEURAL_NODES[a], end = NEURAL_NODES[b], t = (time * .48 + i * .17) % 1;
        ctx.globalAlpha = .85; ctx.fillStyle = theme.particleColor;
        ctx.beginPath(); ctx.arc(start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t, 2.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = theme.accentGlow;
      for (let i = 0; i < NEURAL_NODES.length; i++) { const [x,y] = NEURAL_NODES[i]; ctx.globalAlpha = .25 + Math.sin(time * 2 + i) * .15; circle(ctx, x, y, 13 + Math.sin(time * 2 + i) * 3); }
    } else if (round === 2) {
      ctx.strokeStyle = theme.accentGlow; ctx.lineWidth = 2; ctx.globalAlpha = .75;
      const angle = time * .65;
      for (const [x, radius] of [[235, 72], [W / 2, 126], [885, 72]]) {
        ctx.beginPath(); ctx.moveTo(x, 192); ctx.lineTo(x + Math.cos(angle) * radius, 192 + Math.sin(angle) * radius); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, 192, radius - 8, angle, angle + .6); ctx.stroke();
      }
    } else {
      ctx.strokeStyle = theme.accentGlow; ctx.lineWidth = 2;
      ctx.globalAlpha = this.dark ? .35 : .6;
      ctx.beginPath(); ctx.ellipse(W / 2, 186, 92 + Math.sin(time * 2) * 7, 92, time * .12, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < (this.reduced ? 12 : 42); i++) {
        const a = i * 2.39996, travel = (time * .32 + i * .071) % 1, radius = 110 + travel * 150;
        ctx.globalAlpha = (1 - travel) * .7; ctx.fillStyle = theme.particleColor;
        ctx.fillRect(W / 2 + Math.cos(a) * radius, 186 + Math.sin(a) * radius * .7, 2 + (i % 3), 2);
      }
      ctx.globalAlpha = .4 + Math.sin(time * 2.3) * .15; ctx.strokeStyle = theme.floorLineColor; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(W, FLOOR); ctx.stroke();
      // Bounded wave vectors escalate the final floor without changing physics/hitboxes.
      if (!this.reduced) for (let i = 0; i < 3; i++) {
        const y = 430 + i * 48; ctx.strokeStyle = theme.gridColor; ctx.beginPath();
        for (let x = 0; x <= W; x += 40) { const v = y + Math.sin(x * .013 + time * 1.7 + i) * (this.dark ? 4 : 2); if (x === 0) ctx.moveTo(x,v); else ctx.lineTo(x,v); }
        ctx.stroke();
      }
    }
    ctx.globalAlpha = this.dark ? .035 : .025; ctx.fillStyle = theme.accentGlow;
    for (let y = (time * 22) % 28; y < H; y += 28) ctx.fillRect(0, y, W, 1);
    ctx.globalAlpha = 1;
  }
  burst(x, y, color, amount = 22, force = 220) {
    const budget = this.reduced ? 8 : amount;
    for (let i = 0; i < budget; i++) {
      const angle = Math.random() * Math.PI * 2, speed = 30 + Math.random() * force;
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 50, life: .4 + Math.random() * 1.4, max: 1.8, color, size: 2 + Math.random() * 4 });
    }
    if (this.particles.length > 220) this.particles.splice(0, this.particles.length - 220);
  }
  event(event) {
    const f = this.engine.fighters[event.index ?? event.winner ?? 0], c = this.colors;
    if (event.type === 'hit') { this.burst(event.x, event.y, event.blocked ? c.gold : f.index ? c.b : c.a, event.heavy ? 32 : 16); this.shake = this.reduced ? 0 : event.heavy ? 11 : 4; }
    if (event.type === 'special') { this.shake = this.reduced ? 0 : 7; this.burst(f.x, f.y - 70, f.index ? c.gold : c.a, 45, 120); }
    if (event.type === 'beam') for (const fighter of this.engine.fighters) this.burst(fighter.x, FLOOR - 35, fighter.index ? c.b : c.a, 55, 90);
    if (event.type === 'ko') { const loser = this.engine.fighters[event.loser]; this.burst(loser.x, loser.y - 70, loser.index ? c.b : c.a, 110, 340); this.shake = this.reduced ? 0 : 24; this.flash = this.reduced ? 0 : .17; }
  }
  draw(dt, hitboxes = false) {
    if (!this.ctx) return;
    // Resolve BOTH variables each frame. Theme changes never touch simulation or RAF.
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (this.dark !== isDarkMode) this.setTheme(isDarkMode ? 'dark' : 'light');
    const engine = this.engine, stage = stageForRound(engine.currentRound);
    const theme = getActiveRoundStage(engine.currentRound, isDarkMode);
    const roundChanged = this.backgroundRound !== engine.currentRound;
    const themeChanged = this.backgroundTheme !== isDarkMode;
    if (roundChanged && this.backgroundRound && engine.phase === 'call' && !this.reduced && !themeChanged) {
      this.previousBackground ??= document.createElement('canvas');
      this.previousBackground.width = W; this.previousBackground.height = H;
      this.previousBackground.getContext('2d').drawImage(this.background, 0, 0);
      this.stageTransition = true;
    }
    // A hot-swap is immediate, even during the intro: never blend an old theme into the new one.
    if (themeChanged || engine.phase !== 'call') this.stageTransition = false;
    if (roundChanged || themeChanged) this.cacheBackground(stage, theme);
    const ctx = this.ctx, c = this.colors, slow = engine.phase === 'slowmo' ? .2 : 1;
    this.time += dt * slow; this.shake *= Math.exp(-9 * dt); this.flash = Math.max(0, this.flash - dt);
    ctx.setTransform(this.canvas.width / W, 0, 0, this.canvas.height / H, 0, 0);
    const progress = Math.min(1, engine.phaseTime / .65);
    if (this.stageTransition && progress < 1) {
      ctx.drawImage(this.previousBackground, 0, 0);
      ctx.globalAlpha = progress * progress * (3 - 2 * progress);
      ctx.drawImage(this.background, 0, 0); ctx.globalAlpha = 1;
    } else { this.stageTransition = false; ctx.drawImage(this.background, 0, 0); }
    ctx.save();
    if (this.shake > .2) ctx.translate((Math.random() - .5) * this.shake, (Math.random() - .5) * this.shake);
    this.drawEnvironment(theme);
    const displayWinner = engine.phase === 'result' && engine.seriesReport ? engine.seriesReport.winner : engine.winner;
    for (const f of engine.fighters) {
      const color = f.index ? c.b : c.a;
      const pulse = ctx.createRadialGradient(f.x, FLOOR, 0, f.x, FLOOR, f.flash ? 140 : 100);
      pulse.addColorStop(0, color + (f.flash ? '60' : '24')); pulse.addColorStop(1, color + '00');
      ctx.fillStyle = pulse; ctx.fillRect(f.x - 150, FLOOR - 28, 300, 100);
      ctx.strokeStyle = color; ctx.globalAlpha = .45; ctx.beginPath(); ctx.ellipse(f.x, FLOOR + 3, 55, 8, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      if (engine.phase === 'beam') {
        const beam = ctx.createLinearGradient(f.x - 45, 0, f.x + 45, 0); beam.addColorStop(0, color + '00'); beam.addColorStop(.5, color + '95'); beam.addColorStop(1, color + '00');
        ctx.fillStyle = beam; ctx.fillRect(f.x - 45, 0, 90, FLOOR);
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(f.x, FLOOR, 64 + Math.sin(this.time * 25) * 10, 12, 0, 0, Math.PI * 2); ctx.stroke();
      }
      const defeated = displayWinner !== null && f.index !== displayWinner && ['slowmo', 'result'].includes(engine.phase);
      if (defeated && engine.phase === 'result') continue;
      if (defeated) {
        ctx.globalAlpha = Math.max(0, 1 - engine.phaseTime / 1.5);
        ctx.save(); ctx.translate(Math.sin(this.time * 100) * engine.phaseTime * 12, 0);
      }
      if (engine.phase !== 'splash') this.character(f, engine.phase === 'result' && f.index === displayWinner, hitboxes);
      if (defeated) { ctx.restore(); ctx.globalAlpha = 1; }
    }
    for (const shot of engine.projectiles) {
      ctx.save(); ctx.translate(shot.x, shot.y); ctx.shadowColor = c.a; ctx.shadowBlur = this.reduced ? 0 : 22;
      ctx.fillStyle = c.a; ctx.beginPath(); ctx.ellipse(0, 0, 28, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = this.dark ? '#f2ffff' : '#fff'; ctx.beginPath(); ctx.ellipse(8 * shot.direction, 0, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c.a; ctx.lineWidth = 3; for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(-shot.direction * (35 + j * 14), -9 + j * 9); ctx.lineTo(-shot.direction * 84, -9 + j * 9); ctx.stroke(); } ctx.restore();
    }
    for (const p of this.particles) {
      p.life -= dt; p.x += p.vx * dt * slow; p.y += p.vy * dt * slow; p.vy += 280 * dt * slow;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / .35)); ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    if (engine.cinematic > 0) {
      ctx.fillStyle = this.dark ? '#69189c40' : '#7c3aed18'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#00000080'; ctx.fillRect(0, 0, W, 42); ctx.fillRect(0, H - 42, W, 42);
    }
    ctx.restore();
    if (this.flash > 0) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#bafff0'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }
  character(f, victory, hitboxes) {
    const ctx = this.ctx, c = this.colors, color = f.index ? c.b : c.a, accent = f.index ? c.gold : c.a;
    const attack = f.attack, move = attack ? MOVES[attack.type] : null;
    const reach = attack ? Math.sin(Math.min(1, attack.elapsed / (move.windup + move.active)) * Math.PI) : 0;
    const gait = !attack && !f.block && f.y >= FLOOR ? Math.sin(f.walk) * 15 : 0;
    const breath = Math.sin(this.time * 3.2 + f.index) * 2;
    ctx.save(); ctx.translate(f.x, f.y); ctx.scale(f.facing, f.crouch ? .74 : 1);
    ctx.shadowColor = color; ctx.shadowBlur = this.dark && !this.reduced ? 9 : 0;
    const armor = f.flash > 0 ? (this.dark ? '#fff0f3' : '#ef466f') : c.armor;
    if (victory) {
      ctx.strokeStyle = color; ctx.globalAlpha = .22 + Math.sin(this.time * 5) * .09; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, -72, 77 + Math.sin(this.time * 4) * 8, 100, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (f.index === 1) polygon(ctx, [[-23, -115], [-46, -44 + Math.sin(this.time * 5) * 7], [-16, -58], [4, -103]], color + '35', color, 1);
    // Segmented legs and visible articulated knee joints.
    const kick = attack?.type === 'heavy' ? reach : 0;
    this.limb([-15, -57], [-24 - gait, -30], [-29 + gait, -4], armor, color, 13);
    this.limb([16, -57], [24 + gait + kick * 56, -28 - kick * 27], [27 - gait + kick * 113, -4 - kick * 61], armor, color, 14);
    polygon(ctx, [[-32 + gait, -9], [-17 + gait, -9], [-12 + gait, 0], [-39 + gait, 0]], armor, color);
    if (kick < .4) polygon(ctx, [[17 - gait, -9], [32 - gait, -9], [43 - gait, 0], [16 - gait, 0]], armor, color);
    polygon(ctx, [[-24, -66], [24, -66], [18, -47], [-18, -47]], armor, accent);
    polygon(ctx, f.index ? [[-29, -112 + breath], [30, -112 + breath], [22, -65], [-22, -65]] : [[-27, -113 + breath], [25, -113 + breath], [19, -69], [-18, -69]], armor, color, 2);
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-15, -87 + i * 7); ctx.lineTo(15, -87 + i * 7); ctx.stroke(); }
    polygon(ctx, [[0, -106 + breath], [8, -96 + breath], [0, -86 + breath], [-8, -96 + breath]], accent, this.dark ? '#f0ffff' : accent, 1);
    const raised = victory ? -77 : 0;
    this.limb([-27, -105 + breath], [-40, -79 + raised], [-24, -59 + raised], armor, color, 12);
    const punch = attack?.type === 'light' || attack?.type === 'special' ? reach : 0;
    const uppercut = f.index === 1 && attack?.type === 'special';
    const hand = f.block ? [48, -105] : [43 + punch * (uppercut ? 28 : 73), -65 - punch * (uppercut ? 95 : 33) + raised];
    this.limb([26, -105 + breath], [47 + punch * 25, -91 + raised], hand, armor, color, 13);
    if (!f.index) {
      // Plasma blade gives the gladiator a thin, angular silhouette.
      ctx.lineWidth = 5; ctx.strokeStyle = color; ctx.beginPath(); ctx.moveTo(hand[0] - 5, hand[1] + 8); ctx.lineTo(hand[0] + 58, hand[1] - 47); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.strokeStyle = this.dark ? '#fff' : '#b8fbff'; ctx.beginPath(); ctx.moveTo(hand[0], hand[1] + 2); ctx.lineTo(hand[0] + 57, hand[1] - 46); ctx.stroke();
      polygon(ctx, [[-18, -144 + breath], [13, -144 + breath], [22, -129 + breath], [10, -116 + breath], [-16, -117 + breath], [-25, -130 + breath]], armor, color);
    } else {
      ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(hand[0], hand[1], 13 + punch * 4, 0, Math.PI * 2); ctx.fill();
      polygon(ctx, [[-20, -140 + breath], [17, -140 + breath], [25, -123 + breath], [10, -114 + breath], [-15, -117 + breath], [-24, -127 + breath]], armor, color);
      polygon(ctx, [[-20, -138], [-29, -160], [-4, -145], [20, -138], [30, -160], [11, -146]], armor, accent);
    }
    ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-14, -130 + breath); ctx.lineTo(14, -130 + breath); ctx.stroke();
    if (f.block) {
      ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.fillStyle = accent + '18'; ctx.beginPath(); ctx.ellipse(48, -85, 17, 47, -.13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    if (attack && reach > .2) {
      ctx.globalAlpha = .3 * reach; ctx.strokeStyle = accent; ctx.lineWidth = attack.type === 'heavy' ? 7 : 3;
      ctx.beginPath(); ctx.arc(25, -85, attack.type === 'heavy' ? 122 : 100, -.7, .55); ctx.stroke(); ctx.globalAlpha = 1;
    }
    ctx.shadowBlur = 0;
    if (hitboxes) { ctx.setLineDash([4, 4]); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1; ctx.strokeRect(-26, -125, 52, 120); if (attack) { ctx.strokeStyle = '#a855f7'; ctx.strokeRect(26, -125, move.range - 26, 110); } ctx.setLineDash([]); }
    ctx.restore();
  }
  limb(hip, knee, foot, fill, stroke, width) {
    const ctx = this.ctx; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(...hip); ctx.lineTo(...knee); ctx.lineTo(...foot); ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke();
    ctx.strokeStyle = fill; ctx.lineWidth = width - 3; ctx.stroke();
    ctx.fillStyle = stroke; ctx.beginPath(); ctx.arc(...knee, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.lineCap = 'butt';
  }
}
