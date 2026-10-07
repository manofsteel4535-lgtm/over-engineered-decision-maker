import test from 'node:test';
import assert from 'node:assert/strict';
import { drawCityscape, drawCityscapeTelemetry } from '../dist/fighter-cityscape.js';
import { ARENA_ROUND_MAP } from '../dist/fighter-stages.js';

function record(draw) {
  const calls = [], colors = [], stops = [], stack = [];
  let styles = { globalAlpha: 1, shadowBlur: 0, strokeStyle: '#123456', lineWidth: 3 };
  const initial = { ...styles };
  const ctx = new Proxy({}, {
    get(_, key) {
      if (key in styles) return styles[key];
      if (key === 'save') return () => stack.push({ ...styles });
      if (key === 'restore') return () => { assert.ok(stack.length); styles = stack.pop(); };
      if (String(key).endsWith('Gradient')) return (...args) => {
        calls.push([key, ...args]); return { addColorStop: (position, color) => stops.push([position, color]) };
      };
      return (...args) => { for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg)); calls.push([key, ...args]); };
    },
    set(_, key, value) { styles[key] = value; if (key === 'fillStyle' || key === 'strokeStyle') colors.push(value); return true; },
  });
  draw(ctx); assert.deepEqual(styles, initial); assert.equal(stack.length, 0);
  return { calls, colors: colors.filter(c => typeof c === 'string'), stops };
}

test('metropolis styles draw layered towers, exact atmospheric bloom, neon windows and CAD dimensions without RNG or style leaks', () => {
  const original = Math.random; Math.random = () => { throw Error('Scenery must not consume random numbers'); };
  try {
    for (const mode of ['dark', 'light']) {
      const theme = ARENA_ROUND_MAP[1][mode];
      const a = record(ctx => drawCityscape(ctx, 1120, 395, theme));
      const b = record(ctx => drawCityscape(ctx, 1120, 395, theme));
      assert.deepEqual(a, b); assert.ok(a.calls.length < 6000);
      assert.ok(a.stops.some(([, color]) => color === theme.horizonColor));
      assert.ok(a.colors.includes(theme.buildingFill));
      assert.ok(a.calls.filter(([method]) => method === 'closePath').length > 50, 'depth layers have shaped roofs');
      if (mode === 'dark') { assert.ok(a.colors.includes('#ec4899')); assert.ok(a.colors.includes('#06b6d4')); }
      else {
        const text = a.calls.filter(([method]) => method === 'fillText').map(([,text]) => text).join(' ');
        assert.match(text, /METROPOLIS/); assert.match(text, /EL\./); assert.match(text, /DATUM/);
        assert.ok(a.colors.includes('#334155') && a.colors.includes('#64748b'));
      }
    }
  } finally { Math.random = original; }
});

test('city telemetry changes with time, stays bounded and freezes cleanly for reduced motion', () => {
  for (const mode of ['dark', 'light']) {
    const theme = ARENA_ROUND_MAP[1][mode];
    const render = (time, reduced) => record(ctx => drawCityscapeTelemetry(ctx, 1120, 395, theme, time, reduced));
    const a = render(2, false), b = render(3, false);
    assert.notDeepEqual(a, b); assert.ok(a.calls.length < 100);
    assert.deepEqual(render(2, true), render(300, true));
  }
});
