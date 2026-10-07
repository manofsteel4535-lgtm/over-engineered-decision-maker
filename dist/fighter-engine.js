import { ARENA_ROUND_MAP } from './fighter-stages.js';

/** Deterministic, renderer-independent combat. The caller supplies a fixed timestep. */
export const ARENA = Object.freeze({ width: 1120, height: 630, floor: 500, gravity: 1800, speed: 255, jump: -700 });
export const ROUND_ARENAS = Object.freeze(Object.values(ARENA_ROUND_MAP).map(stage => stage.roundName));
export function seriesClassification(wins, winner, random = Math.random) {
  const option = winner === 0 ? 'A' : 'B';
  if (wins[winner] === 3) {
    const headlines = [
      `CLEAN SWEEP: OPTION ${option} ERADICATED ALL OPPOSITION ACROSS ALL 3 ROUNDS`,
      'FLAWLESS VICTORY: ZERO ROUNDS CONCEDED TO NON-EXISTENT LOGIC',
      'PERFECT WIN: 3-0 SWEEP EXECUTION COMPLETE'
    ];
    return { status: 'K.O. // TOTAL DOMINANCE ACHIEVED', headline: headlines[Math.floor(random() * headlines.length)] };
  }
  return { status: 'DECISION // MAJORITY WIN', headline: `MAJORITY DECISION: OPTION ${option} SECURED VICTORY (2 OUT OF 3 ROUNDS)` };
}
export const MOVES = Object.freeze({
  light: Object.freeze({ damage: 10, windup: .09, active: .13, recovery: .21, range: 104, push: 95 }),
  heavy: Object.freeze({ damage: 22, windup: .22, active: .18, recovery: .38, range: 155, push: 320 }),
  special: Object.freeze({ damage: 40, windup: .3, active: .2, recovery: .55, range: 215, push: 500 })
});
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const fighter = (name, index) => ({ name, index, x: index ? 810 : 310, y: ARENA.floor, vy: 0, push: 0, facing: index ? -1 : 1, hp: 100, meter: 0, attack: null, block: false, crouch: false, stun: 0, flash: 0, walk: 0, aiWait: .12, aiMove: 0, aiBlock: false, damage: 0, hits: 0, blocks: 0, specials: 0, combo: 0, maxCombo: 0, lastHit: -10 });

export class FighterEngine {
  constructor(random = Math.random) { this.random = random; this.reset(); }
  reset() {
    this.phase = 'idle'; this.phaseTime = 0; this.time = 0; this.remaining = 60;
    this.fighters = [fighter('OPTION A', 0), fighter('OPTION B', 1)];
    this.events = []; this.projectiles = []; this.wins = [0, 0]; this.round = 1;
    this.winner = null; this.report = null; this.cinematic = 0; this.meterChanges = [];
    this.mode = 'ai'; this.stepCount = 0;
    this.roundHistory = []; this.seriesReport = null; this.seriesMeterChanges = [];
  }
  get currentRound() { return this.round; }
  get winsA() { return this.wins[0]; }
  get winsB() { return this.wins[1]; }
  start(a, b, mode = 'ai') {
    const names = [String(a || '').trim(), String(b || '').trim()];
    if (names.some(name => !name || name.length > 60)) throw new Error('Enter two fighter names, 60 characters maximum.');
    if (!['ai', 'player'].includes(mode)) throw new Error('Invalid combat mode.');
    if (!['idle', 'result'].includes(this.phase)) throw new Error('Combat already in progress.');
    if (this.phase === 'result' && !this.seriesReport) throw new Error('Continue the tournament or reset before starting a new series.');
    this.reset(); this.mode = mode;
    this.fighters = names.map(fighter); this.phase = 'splash'; this.emit('splash');
  }
  nextRound() {
    if (this.phase !== 'result') throw new Error('Finish the current round first.');
    const names = this.fighters.map(f => f.name);
    if (this.round >= 3) throw new Error('Tournament complete. Start a new series.');
    this.round++;
    this.fighters = names.map(fighter); this.phase = 'call'; this.phaseTime = 0;
    this.remaining = 60; this.time = 0; this.winner = null; this.report = null;
    this.projectiles = []; this.meterChanges = []; this.cinematic = 0; this.stepCount = 0;
    this.events = []; this.emit('round');
  }
  emit(type, data = {}) { this.events.push({ type, ...data }); }
  drainEvents() { const events = this.events; this.events = []; return events; }
  charge(f, amount) {
    const old = f.meter; f.meter = clamp(f.meter + amount, 0, 100);
    this.meterChanges.push(f.meter - old);
  }
  request(index, type) {
    const f = this.fighters[index], move = MOVES[type];
    if (this.phase !== 'fighting' || !f || !move || f.hp <= 0 || f.attack || f.stun > 0 || f.block || this.cinematic > 0) return false;
    if (type === 'special') {
      if (f.meter < 100) { this.emit('empty-meter', { index }); return false; }
      this.charge(f, -100); f.specials++; this.cinematic = .38;
      if (index === 1 && f.y >= ARENA.floor - 1) f.vy = -340;
      this.emit('special', { index, text: index === 0 ? 'HADOUKEN OF COGNITIVE DISSOLUTION' : 'IMPULSE BUY UPPERCUT' });
    }
    f.attack = { type, elapsed: 0, hit: false }; f.block = false; f.crouch = false;
    this.emit('attack', { index, move: type }); return true;
  }
  jump(index) {
    const f = this.fighters[index];
    if (this.phase !== 'fighting' || f.y < ARENA.floor - 1 || f.attack || f.stun > 0 || this.cinematic > 0) return false;
    f.vy = ARENA.jump; f.block = false; f.crouch = false; this.emit('jump', { index }); return true;
  }
  ai(f, opponent, dt) {
    f.aiWait -= dt;
    if (f.aiWait > 0) return;
    f.aiWait = .12 + this.random() * .22;
    const distance = Math.abs(f.x - opponent.x);
    f.aiBlock = Boolean(opponent.attack && distance < 210 && this.random() < .45);
    f.aiMove = distance > 112 ? Math.sign(opponent.x - f.x) : distance < 76 && this.random() < .35 ? -Math.sign(opponent.x - f.x) : 0;
    if (f.aiBlock || f.stun || f.attack) return;
    if (f.meter >= 100 && (distance < 210 || f.index === 0) && this.random() < .85) this.request(f.index, 'special');
    else if (distance < 148 && this.random() < .85) this.request(f.index, distance > 96 || this.random() < .42 ? 'heavy' : 'light');
    else if (this.random() < .045) this.jump(f.index);
  }
  hit(attacker, defender, move) {
    if (this.phase !== 'fighting' || defender.hp <= 0) return;
    const blocked = defender.block && defender.y >= ARENA.floor - 1;
    // Telemetry counts integrity actually removed, rather than overkill damage.
    const damage = Math.min(defender.hp, move.damage * (blocked ? .25 : 1));
    defender.hp = Math.max(0, defender.hp - damage); defender.flash = .18;
    defender.push += attacker.facing * move.push * (blocked ? .3 : 1);
    defender.stun = blocked ? .045 : .14;
    if (blocked) defender.blocks++;
    else defender.attack = null;
    attacker.damage += damage; attacker.hits++;
    attacker.combo = this.time - attacker.lastHit < 1.25 ? attacker.combo + 1 : 1;
    attacker.lastHit = this.time; attacker.maxCombo = Math.max(attacker.maxCombo, attacker.combo);
    this.charge(attacker, 8 + damage * .85); this.charge(defender, 12 + damage * .75);
    this.emit('hit', { index: attacker.index, target: defender.index, damage, baseDamage: move.damage, blocked, combo: attacker.combo, x: defender.x, y: defender.y - 70, heavy: move.damage > 10 });
    if (defender.hp === 0) this.finish(attacker.index, 'ko');
  }
  finish(winner, reason) {
    if (this.phase !== 'fighting') return;
    this.winner = winner; this.wins[winner]++;
    this.phase = 'slowmo'; this.phaseTime = 0; this.cinematic = 0;
    const mean = this.meterChanges.reduce((sum, value) => sum + value, 0) / Math.max(1, this.meterChanges.length);
    const variance = this.meterChanges.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, this.meterChanges.length);
    this.report = Object.freeze({ winner, name: this.fighters[winner].name, health: this.fighters[winner].hp, reason, round: this.round, arena: ROUND_ARENAS[this.round - 1], wins: Object.freeze([...this.wins]), seriesComplete: this.round === 3, maxCombo: Math.max(...this.fighters.map(f => f.maxCombo)), damage: Object.freeze(this.fighters.map(f => f.damage)), volatility: Math.min(100, Math.sqrt(variance)), duration: 60 - this.remaining });
    this.roundHistory.push(this.report);
    this.seriesMeterChanges.push(...this.meterChanges);
    if (this.round === 3) {
      const champion = this.winsA > this.winsB ? 0 : 1;
      const lastWin = this.roundHistory.filter(round => round.winner === champion).at(-1);
      const seriesMean = this.seriesMeterChanges.reduce((sum, n) => sum + n, 0) / Math.max(1, this.seriesMeterChanges.length);
      const seriesVariance = this.seriesMeterChanges.reduce((sum, n) => sum + (n - seriesMean) ** 2, 0) / Math.max(1, this.seriesMeterChanges.length);
      // Keep round winner intact for KO animation; the external handoff uses the champion.
      this.seriesReport = Object.freeze({ ...this.report, winner: champion, name: this.fighters[champion].name, health: lastWin.health, lastRoundWinner: winner,
        ...seriesClassification(this.wins, champion, this.random),
        maxCombo: Math.max(...this.roundHistory.map(round => round.maxCombo)),
        damage: Object.freeze([0, 1].map(index => this.roundHistory.reduce((sum, round) => sum + round.damage[index], 0))),
        duration: this.roundHistory.reduce((sum, round) => sum + round.duration, 0),
        volatility: Math.min(100, Math.sqrt(seriesVariance)), history: Object.freeze([...this.roundHistory]) });
    }
    this.emit('ko', { winner, loser: 1 - winner, reason });
  }
  update(dt, input = {}) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, .05); this.phaseTime += dt;
    if (['splash', 'beam', 'call'].includes(this.phase)) {
      const duration = { splash: 1.65, beam: 1, call: .8 }[this.phase];
      if (this.phaseTime >= duration) {
        this.phase = { splash: 'beam', beam: 'call', call: 'fighting' }[this.phase]; this.phaseTime = 0; this.emit(this.phase);
      }
      return;
    }
    if (this.phase === 'slowmo') {
      for (const f of this.fighters) { f.push *= Math.exp(-7 * dt * .2); f.x = clamp(f.x + f.push * dt * .2, 55, ARENA.width - 55); }
      if (this.phaseTime >= 1.5) { this.phase = 'result'; this.phaseTime = 0; this.emit('result', { report: this.report }); }
      return;
    }
    if (this.phase !== 'fighting') return;
    if (this.cinematic > 0) { this.cinematic = Math.max(0, this.cinematic - dt); return; }
    this.time += dt; this.remaining = Math.max(0, this.remaining - dt); this.stepCount++;
    for (const f of this.fighters) {
      const opponent = this.fighters[1 - f.index];
      f.facing = f.x <= opponent.x ? 1 : -1;
      f.stun = Math.max(0, f.stun - dt); f.flash = Math.max(0, f.flash - dt);
      const human = this.mode === 'player' && f.index === 0;
      if (!human) this.ai(f, opponent, dt);
      f.block = Boolean((human ? input.block : f.aiBlock) && !f.attack && !f.stun && f.y >= ARENA.floor - 1);
      f.crouch = f.block;
      const movement = human ? clamp(input.move || 0, -1, 1) : f.aiMove;
      if (!f.attack && !f.block && !f.stun) { f.x += movement * ARENA.speed * dt; f.walk += Math.abs(movement) * dt * 10; }
      f.x += f.push * dt; f.push *= Math.exp(-9 * dt);
      f.vy += ARENA.gravity * dt; f.y = Math.min(ARENA.floor, f.y + f.vy * dt);
      if (f.y >= ARENA.floor) f.vy = 0;
      f.x = clamp(f.x, 55, ARENA.width - 55);
    }
    const [a, b] = this.fighters;
    if (Math.abs(a.x - b.x) < 62 && Math.abs(a.y - b.y) < 70) {
      const direction = a.x <= b.x ? 1 : -1, overlap = (62 - Math.abs(a.x - b.x)) / 2;
      a.x = clamp(a.x - overlap * direction, 55, ARENA.width - 55); b.x = clamp(b.x + overlap * direction, 55, ARENA.width - 55);
    }
    // Alternate resolution order, rather than giving Option A permanent frame priority.
    const order = this.stepCount % 2 ? [a, b] : [b, a];
    for (const f of order) {
      if (!f.attack || this.phase !== 'fighting') continue;
      const attack = f.attack, move = MOVES[attack.type]; attack.elapsed += dt;
      if (!attack.hit && attack.elapsed >= move.windup && attack.elapsed < move.windup + move.active) {
        const target = this.fighters[1 - f.index];
        if (attack.type === 'special' && f.index === 0) {
          this.projectiles.push({ owner: f.index, x: f.x + f.facing * 48, y: f.y - 73, direction: f.facing, life: 1.7 }); attack.hit = true;
        } else if (Math.abs(f.x - target.x) <= move.range && Math.abs(f.y - target.y) < (target.crouch && attack.type === 'light' ? 35 : 115) && (target.x - f.x) * f.facing > 0) {
          attack.hit = true; this.hit(f, target, move);
        }
      }
      if (attack.elapsed >= move.windup + move.active + move.recovery && f.attack === attack) f.attack = null;
    }
    for (const shot of this.projectiles) {
      shot.life -= dt; shot.x += shot.direction * 660 * dt;
      const target = this.fighters[1 - shot.owner];
      if (shot.life > 0 && Math.abs(shot.x - target.x) < 38 && shot.y >= target.y - 125 && shot.y <= target.y - 15) {
        this.hit(this.fighters[shot.owner], target, MOVES.special); shot.life = 0;
      }
    }
    this.projectiles = this.projectiles.filter(shot => shot.life > 0 && shot.x > 0 && shot.x < ARENA.width);
    if (this.remaining === 0 && this.phase === 'fighting') {
      this.finish(a.hp === b.hp ? (this.random() < .5 ? 0 : 1) : a.hp > b.hp ? 0 : 1, a.hp === b.hp ? 'tiebreak' : 'timeout');
    }
  }
}
