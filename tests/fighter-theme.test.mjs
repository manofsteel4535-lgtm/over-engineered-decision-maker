import test from 'node:test';
import assert from 'node:assert/strict';
import { ARENA_ROUND_MAP, getActiveRoundStage, stageForRound } from '../dist/fighter-stages.js';
import { FighterEngine, ROUND_ARENAS } from '../dist/fighter-engine.js';
import { FighterRenderer } from '../dist/fighter-renderer.js';
import { OptionFighter } from '../dist/fighter.js';

function canvas() {
  const paints = [], gradients = [], draws = [];
  const ctx = new Proxy({ globalAlpha: 1 }, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'drawImage') return image => draws.push({ image, alpha: target.globalAlpha });
      if (String(key).startsWith('create') && String(key).endsWith('Gradient')) return () => ({ addColorStop: (offset, color) => gradients.push([offset, color]) });
      return () => {};
    },
    set(target, key, value) { target[key] = value; if (key === 'fillStyle' || key === 'strokeStyle') paints.push(value); return true; },
  });
  return { width: 1120, height: 630, getContext: () => ctx, paints, gradients, draws };
}

test('all arenas define immutable, distinct dual palettes with canonical names', () => {
  const stages = Object.values(ARENA_ROUND_MAP);
  assert.deepEqual(ROUND_ARENAS, ['NEON CITADEL', 'NEURAL SYNAPSE MATRIX', 'SINGULARITY COURT']);
  assert.deepEqual(stages.map(stage => stage.light.bgGradient), [
    ['#f8fafc', '#e2e8f0'], ['#fdfbf7', '#f3e8ff'], ['#fff7ed', '#fed7aa'],
  ]);
  assert.deepEqual(stages.map(stage => stage.dark.bgGradient), [
    ['#020617', '#0d1b2a'], ['#0a0518', '#1e0a38'], ['#120207', '#2a0410'],
  ]);
  for (const stage of stages) for (const mode of ['dark', 'light']) {
    const theme = stage[mode];
    for (const token of ['gridColor', 'horizonColor', 'skylineOrStructureColor', 'accentGlow', 'particleColor', 'floorLineColor']) assert.equal(typeof theme[token], 'string');
    assert.ok(Object.isFrozen(stage) && Object.isFrozen(theme) && Object.isFrozen(theme.bgGradient));
    assert.notDeepEqual(stage.dark, stage.light);
  }
  assert.ok(ARENA_ROUND_MAP[3].dark.hazardBarColor && ARENA_ROUND_MAP[3].light.hazardBarColor);
});

test('round/theme resolver clamps invalid rounds and never regresses theme switches to Round 1', () => {
  for (const round of [1, 2, 3]) for (const dark of [true, false]) assert.equal(getActiveRoundStage(round, dark), ARENA_ROUND_MAP[round][dark ? 'dark' : 'light']);
  for (const round of [-100, 0, NaN, undefined]) assert.equal(stageForRound(round), ARENA_ROUND_MAP[1]);
  for (const round of [4, 100]) assert.equal(stageForRound(round), ARENA_ROUND_MAP[3]);
  assert.equal(stageForRound(2.8), ARENA_ROUND_MAP[2]);
});

test('each frame reads root theme and repaints all three arenas without changing combat or consuming its RNG', () => {
  const oldDocument = globalThis.document, oldMatchMedia = globalThis.matchMedia;
  let dark = true, randomCalls = 0;
  globalThis.document = { documentElement: { classList: { contains: () => dark } }, createElement: canvas };
  globalThis.matchMedia = () => ({ matches: false });
  try {
    const game = new FighterEngine(() => { randomCalls++; return .5; });
    game.start('Sushi', 'Pasta', 'ai');
    for (let i = 0; i < 520; i++) game.update(1 / 120);
    assert.equal(game.phase, 'fighting');
    const renderer = new FighterRenderer(canvas(), game);
    renderer.time = 9; renderer.shake = 4; renderer.flash = .1;
    renderer.particles = [{ x: 5, y: 10, vx: 4, vy: 8, life: .6, max: 1.8, size: 2, color: '#22e8f5' }];
    let rebuilds = 0;
    const cache = renderer.cacheBackground.bind(renderer);
    renderer.cacheBackground = (...args) => { rebuilds++; return cache(...args); };
    for (let round = 1; round <= 3; round++) {
      assert.equal(game.currentRound, round);
      const before = JSON.stringify(game), rngBefore = randomCalls;
      const effects = JSON.stringify([renderer.time, renderer.shake, renderer.flash, renderer.particles]);
      for (const mode of ['dark', 'light', 'dark']) {
        dark = mode === 'dark';
        // No setTheme/event is called: the frame itself must notice the global signal.
        renderer.background.paints.length = 0; renderer.background.gradients.length = 0;
        renderer.draw(0, true);
        assert.equal(renderer.mapColors, ARENA_ROUND_MAP[round][mode]);
        assert.deepEqual(renderer.background.gradients.slice(0, 2).map(stop => stop[1]), renderer.mapColors.bgGradient);
        assert.ok(renderer.background.paints.includes(renderer.mapColors.floorLineColor));
        assert.ok(renderer.background.paints.includes(renderer.mapColors.gridColor));
        if (round === 2) assert.ok(renderer.background.paints.includes(renderer.mapColors.particleColor));
        if (round === 3) assert.ok(renderer.background.paints.includes(renderer.mapColors.hazardBarColor));
        const cached = rebuilds; renderer.draw(0, true); assert.equal(rebuilds, cached);
        assert.equal(JSON.stringify(game), before, 'HP, positions, attacks/hitboxes, timer, score and queued events are untouched');
        assert.equal(randomCalls, rngBefore);
        assert.equal(JSON.stringify([renderer.time, renderer.shake, renderer.flash, renderer.particles]), effects);
      }
      if (round < 3) {
        game.finish(0, 'ko');
        for (let i = 0; i < 200; i++) game.update(1 / 120);
        game.nextRound();
        for (let i = 0; i < 110; i++) game.update(1 / 120);
        assert.equal(game.phase, 'fighting');
      }
    }
    assert.equal(rebuilds, 9);
    const remaining = game.remaining; game.update(1 / 120); renderer.draw(1 / 120);
    assert.ok(game.remaining < remaining && renderer.time > 9, 'same combat and animation clocks continue');
  } finally { globalThis.document = oldDocument; globalThis.matchMedia = oldMatchMedia; }
});

test('immediate theme sync preserves paused/active loop state, controls and hitbox visibility', () => {
  const oldDocument = globalThis.document;
  globalThis.document = { getElementById: id => { assert.equal(id, 'fighter-hitboxes'); return { checked: true }; } };
  try {
    for (const paused of [false, true]) {
      const calls = [];
      const fighter = { active: true, paused, frame: 123, accumulator: .004, lastFrame: 870,
        keys: new Set(['KeyD']), renderer: { setTheme: theme => calls.push(theme), draw: (...args) => calls.push(args) } };
      OptionFighter.prototype.setTheme.call(fighter, 'light');
      assert.deepEqual(calls, ['light', [0, true]]);
      assert.equal(fighter.frame, 123); assert.equal(fighter.paused, paused);
      assert.equal(fighter.accumulator, .004); assert.equal(fighter.lastFrame, 870);
      assert.ok(fighter.keys.has('KeyD'));
    }
  } finally { globalThis.document = oldDocument; }
});

test('round intro crossfades cached scenery, hot-swaps abandon the old theme, reduced motion skips blending', () => {
  const oldDocument = globalThis.document, oldMatchMedia = globalThis.matchMedia;
  let dark = true;
  globalThis.document = { documentElement: { classList: { contains: () => dark } }, createElement: canvas };
  try {
    for (const reduced of [false, true]) {
      dark = true; globalThis.matchMedia = () => ({ matches: reduced });
      const game = new FighterEngine(() => .5); game.start('A', 'B', 'ai');
      for (let i = 0; i < 480; i++) game.update(1 / 120);
      const display = canvas(), renderer = new FighterRenderer(display, game); renderer.draw(0);
      game.finish(0, 'ko'); for (let i = 0; i < 200; i++) game.update(1 / 120); game.nextRound();
      display.draws.length = 0; const before = JSON.stringify(game); renderer.draw(0);
      assert.equal(renderer.backgroundRound, 2); assert.equal(JSON.stringify(game), before);
      if (reduced) {
        assert.equal(display.draws.length, 1); assert.equal(renderer.previousBackground, undefined);
      } else {
        assert.ok(renderer.stageTransition); assert.equal(display.draws.length, 2);
        assert.equal(display.draws[0].image, renderer.previousBackground); assert.equal(display.draws[1].alpha, 0);
        game.phaseTime = .325; display.draws.length = 0; renderer.draw(0);
        assert.equal(display.draws[1].alpha, .5);
      }
      dark = false; display.draws.length = 0;
      const locked = JSON.stringify(game); renderer.draw(0);
      assert.equal(display.draws.length, 1); assert.equal(renderer.stageTransition, false);
      assert.equal(renderer.mapColors, ARENA_ROUND_MAP[2].light); assert.equal(JSON.stringify(game), locked);
      renderer.draw(0); assert.equal(renderer.mapColors, ARENA_ROUND_MAP[2].light);
    }
  } finally { globalThis.document = oldDocument; globalThis.matchMedia = oldMatchMedia; }
});
