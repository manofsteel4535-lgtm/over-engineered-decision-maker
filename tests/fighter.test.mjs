import test from 'node:test';
import assert from 'node:assert/strict';
import { FighterEngine, ARENA, ROUND_ARENAS, seriesClassification } from '../dist/fighter-engine.js';

const advance = (game, seconds, input = {}) => { for (let t = 0; t < seconds; t += 1 / 120) game.update(1 / 120, input); };
function duel(random = () => .5) {
  const game = new FighterEngine(random); game.start('Moza R5', 'Fanatec DD', 'player');
  game.phase = 'fighting'; game.fighters[1].aiWait = 1000; game.fighters[1].x = game.fighters[0].x + 90;
  game.drainEvents(); return game;
}
function seeded(seed) { return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }; }

test('fighter names and modes validate without starting a bad match', () => {
  const game = new FighterEngine();
  for (const values of [[' ', 'B', 'ai'], ['A', '', 'player'], ['A'.repeat(61), 'B', 'ai'], ['A', 'B', 'bad']]) {
    assert.throws(() => game.start(...values)); assert.equal(game.phase, 'idle');
  }
  game.start('  Moza  ', 'Fanatec', 'ai'); assert.equal(game.fighters[0].name, 'Moza');
  assert.throws(() => game.start('A', 'B')); assert.throws(() => game.nextRound());
});
test('intro advances through splash, beam, call and combat without spending combat time', () => {
  const game = new FighterEngine(); game.start('A', 'B');
  advance(game, 1.7); assert.equal(game.phase, 'beam'); assert.equal(game.remaining, 60);
  advance(game, 1.02); assert.equal(game.phase, 'call'); assert.equal(game.remaining, 60);
  advance(game, .82); assert.equal(game.phase, 'fighting'); assert.ok(game.remaining <= 60);
});
test('movement stays inside the ring, grounded bodies cannot overlap, and a jump lands', () => {
  const game = duel(); advance(game, 1, { move: 1 });
  assert.ok(Math.abs(game.fighters[0].x - game.fighters[1].x) >= 61.99);
  advance(game, 4, { move: -1 }); assert.equal(game.fighters[0].x, 55);
  assert.equal(game.jump(0), true); advance(game, .2); assert.ok(game.fighters[0].y < ARENA.floor - 50);
  assert.equal(game.jump(0), false); advance(game, 1); assert.equal(game.fighters[0].y, ARENA.floor);
});
test('jab uses its windup, hits once for ten, charges meters, and cannot cancel recovery', () => {
  const game = duel(); assert.equal(game.request(0, 'light'), true);
  advance(game, .05); assert.equal(game.fighters[1].hp, 100); assert.equal(game.request(0, 'heavy'), false);
  advance(game, .18); assert.equal(game.fighters[1].hp, 90); assert.equal(game.fighters[0].damage, 10);
  assert.ok(game.fighters.every(f => f.meter > 0)); advance(game, .3);
  assert.equal(game.fighters[1].hp, 90); assert.equal(game.request(0, 'light'), true);
});
test('block reduces incoming damage by 75 percent and heavy damage causes knockback', () => {
  const blocked = duel(); blocked.fighters[1].aiBlock = true; blocked.request(0, 'light'); advance(blocked, .2);
  assert.equal(blocked.fighters[1].hp, 97.5); assert.equal(blocked.fighters[1].blocks, 1); assert.equal(blocked.fighters[0].damage, 2.5);
  const heavy = duel(); const x = heavy.fighters[1].x; heavy.request(0, 'heavy'); advance(heavy, .38);
  assert.equal(heavy.fighters[1].hp, 78); assert.ok(heavy.fighters[1].x > x + 10);
});
test('out-of-range swings do not damage the opponent or increment a combo', () => {
  const game = duel(); game.fighters[1].x += 400; game.request(0, 'heavy'); advance(game, 1);
  assert.equal(game.fighters[1].hp, 100); assert.equal(game.fighters[0].maxCombo, 0); assert.equal(game.fighters[0].damage, 0);
});
test('special requires full charge, spends it once, pauses time, and its projectile deals forty', () => {
  const game = duel(); game.fighters[1].x += 200;
  assert.equal(game.request(0, 'special'), false); game.fighters[0].meter = 100;
  assert.equal(game.request(0, 'special'), true); assert.equal(game.fighters[0].meter, 0); assert.equal(game.fighters[0].specials, 1);
  advance(game, .2); assert.equal(game.remaining, 60); assert.equal(game.request(0, 'special'), false);
  advance(game, 1.2); assert.equal(game.fighters[1].hp, 60); assert.equal(game.fighters[0].damage, 40);
});
test('combo counts recent landed hits and resets after the linking window', () => {
  const game = duel();
  for (let i = 0; i < 3; i++) { game.fighters[1].x = game.fighters[0].x + 90; game.request(0, 'light'); advance(game, .5); }
  assert.equal(game.fighters[0].maxCombo, 3); advance(game, 1.5);
  game.fighters[1].x = game.fighters[0].x + 90; game.request(0, 'light'); advance(game, .2);
  assert.equal(game.fighters[0].combo, 1); assert.equal(game.fighters[0].maxCombo, 3);
});
test('KO seals the winner and damage report, then preserves a 1.5 second slow-motion phase', () => {
  const game = duel(); game.fighters[1].hp = 10; game.request(0, 'light'); advance(game, .12);
  assert.equal(game.phase, 'slowmo'); assert.equal(game.winner, 0); assert.equal(game.wins[0], 1); assert.equal(game.report.damage[0], 10);
  assert.equal(game.request(1, 'heavy'), false); advance(game, 1); assert.equal(game.phase, 'slowmo'); advance(game, .6); assert.equal(game.phase, 'result');
  assert.equal(game.fighters[1].hp, 0); assert.equal(game.report.health, 100);
});
test('finishing blows count only remaining integrity in damage telemetry', () => {
  const game = duel(); game.fighters[1].hp = 3; game.request(0, 'heavy'); advance(game, .3);
  assert.equal(game.report.damage[0], 3); assert.equal(game.fighters[1].hp, 0);
  const hit = game.drainEvents().find(event => event.type === 'hit');
  assert.equal(hit.damage, 3); assert.equal(hit.baseDamage, 22);
});

test('timeout chooses health and equal-health tiebreak can select either option', () => {
  const game = duel(); game.remaining = .01; game.fighters[0].hp = 50; game.update(.02); assert.equal(game.winner, 1); assert.equal(game.report.reason, 'timeout');
  for (const [value, expected] of [[.1, 0], [.9, 1]]) { const tie = duel(() => value); tie.remaining = .01; tie.update(.02); assert.equal(tie.winner, expected); assert.equal(tie.report.reason, 'tiebreak'); }
});
test('three-round tournament resets fighters and only restarts after completing Round 3', () => {
  const game = duel(); game.finish(0, 'ko'); advance(game, 1.6); game.nextRound();
  assert.equal(game.round, 2); assert.deepEqual(game.wins, [1, 0]); assert.ok(game.fighters.every(f => f.hp === 100 && f.meter === 0)); assert.equal(game.remaining, 60); assert.equal(game.phase, 'call');
  game.phase = 'fighting'; game.finish(1, 'ko'); advance(game, 1.6); game.nextRound(); assert.equal(game.round, 3); assert.deepEqual(game.wins, [1, 1]);
  game.phase = 'fighting'; game.finish(1, 'ko'); assert.equal(game.report.seriesComplete, true); advance(game, 1.6);
  assert.throws(() => game.nextRound()); game.start('A', 'B', 'player'); assert.equal(game.round, 1); assert.deepEqual(game.wins, [0, 0]); assert.deepEqual(game.roundHistory, []); assert.equal(game.seriesReport, null);
});

test('all eight tournament paths require three rounds, preserve history and select the majority champion', () => {
  for (let path = 0; path < 8; path++) {
    const game = new FighterEngine(() => .1); game.start('A', 'B', 'player');
    const winners = [0, 1, 2].map(index => (path >> index) & 1);
    for (let index = 0; index < 3; index++) {
      const n = index + 1; game.phase = 'fighting'; game.remaining = 60 - n * 9;
      game.fighters.forEach(f => { f.hp = 80 - n; f.damage = (f.index + 1) * n * 10; f.maxCombo = n + 2; });
      game.meterChanges = [n, -n]; game.finish(winners[index], 'timeout');
      assert.equal(game.currentRound, n); assert.equal(game.roundHistory.length, n);
      assert.equal(game.winsA + game.winsB, n); assert.equal(game.report.arena, ROUND_ARENAS[index]);
      assert.equal(game.seriesReport !== null, n === 3);
      const historyLength = game.roundHistory.length; game.finish(1, 'ko'); assert.equal(game.roundHistory.length, historyLength);
      advance(game, 1.6);
      if (n < 3) {
        assert.throws(() => game.start('Other A', 'Other B'));
        game.nextRound(); assert.ok(game.fighters.every(f => f.hp === 100 && f.meter === 0)); assert.equal(game.remaining, 60);
      }
    }
    const champion = game.winsA > game.winsB ? 0 : 1;
    assert.equal(game.seriesReport.winner, champion); assert.equal(game.seriesReport.name, champion ? 'B' : 'A');
    assert.equal(game.winner, winners[2]); assert.equal(game.seriesReport.lastRoundWinner, winners[2]);
    assert.deepEqual(game.roundHistory.map(round => round.winner), winners);
    assert.deepEqual(game.seriesReport.damage, [60, 120]); assert.equal(game.seriesReport.maxCombo, 5); assert.equal(game.seriesReport.duration, 54);
    assert.equal(game.seriesReport.health, game.roundHistory.filter(round => round.winner === champion).at(-1).health);
    assert.ok(Math.abs(game.seriesReport.volatility - Math.sqrt(14 / 3)) < 1e-9);
    assert.equal(game.roundHistory[0].wins.reduce((sum, n) => sum + n, 0), 1);
    assert.throws(() => { game.seriesReport.history[0].damage[0] = 999; });
    assert.equal(Math.max(...game.wins) === 3, game.seriesReport.status.includes('TOTAL DOMINANCE'));
  }
});

test('sweep classification can select all three headlines and majority identifies the champion', () => {
  const headlines = [.01, .5, .99].map(random => seriesClassification([3, 0], 0, () => random));
  assert.equal(new Set(headlines.map(value => value.headline)).size, 3);
  assert.ok(headlines.every(value => value.status === 'K.O. // TOTAL DOMINANCE ACHIEVED'));
  assert.ok(headlines[0].headline.includes('OPTION A'));
  const majority = seriesClassification([1, 2], 1);
  assert.equal(majority.status, 'DECISION // MAJORITY WIN'); assert.equal(majority.headline, 'MAJORITY DECISION: OPTION B SECURED VICTORY (2 OUT OF 3 ROUNDS)');
});

test('autonomous full tournaments reach a champion with real damage in every arena', () => {
  for (const seed of [3, 7, 11]) {
    const game = new FighterEngine(seeded(seed)); game.start('A', 'B', 'ai');
    for (let round = 1; round <= 3; round++) {
      for (let frame = 0; frame < 120 * 90 && game.phase !== 'result'; frame++) game.update(1 / 120);
      assert.equal(game.phase, 'result'); assert.equal(game.currentRound, round); assert.ok(game.report.damage.some(damage => damage > 0));
      if (round < 3) { assert.equal(game.seriesReport, null); game.nextRound(); }
    }
    assert.equal(game.seriesReport.history.length, 3); assert.equal(game.winsA + game.winsB, 3);
    assert.equal(game.seriesReport.winner, game.winsA > game.winsB ? 0 : 1);
  }
});
test('autonomous matches finish with real damage, bounded meters and winners on either side', () => {
  const winners = new Set();
  for (let seed = 1; seed <= 12; seed++) {
    const game = new FighterEngine(seeded(seed)); game.start('A', 'B', 'ai');
    for (let frame = 0; frame < 120 * 90 && game.phase !== 'result'; frame++) game.update(1 / 120);
    assert.equal(game.phase, 'result'); assert.ok(game.report.damage.some(damage => damage > 0)); assert.ok(Number.isFinite(game.report.volatility));
    for (const f of game.fighters) { assert.ok(f.hp >= 0 && f.hp <= 100); assert.ok(f.meter >= 0 && f.meter <= 100); }
    winners.add(game.winner);
  }
  assert.equal(winners.size, 2);
});
