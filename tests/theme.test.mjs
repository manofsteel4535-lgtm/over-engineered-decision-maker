import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { applyChartTheme } from '../dist/theme-palette.js';

const script = await readFile(new URL('../dist/theme.js', import.meta.url), 'utf8');
// Simulate a page reload with the same storage but a fresh document.
function page(storage = new Map(), prefersDark = true, denied = false) {
  const classes = new Set();
  const root = { dataset: {}, style: {}, classList: { toggle(name, on) { on ? classes.add(name) : classes.delete(name); } } };
  let systemChange;
  let headerButton = null;
  const window = {
    matchMedia: () => ({ matches: prefersDark, addEventListener(type, callback) { systemChange = callback; } }),
    dispatchEvent() {}
  };
  runInNewContext(script, {
    window, document: { documentElement: root, querySelector: () => null, getElementById: () => headerButton },
    localStorage: {
      getItem(key) { if (denied) throw Error('Storage denied'); return storage.get(key) ?? null; },
      setItem(key, value) { if (denied) throw Error('Storage denied'); storage.set(key, value); }
    },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }
  });
  return { root, classes, theme: window.DecisionTheme, systemChange: value => systemChange({ matches: value }),
    mountHeader(button) { headerButton = button; window.DecisionTheme.syncToggle(); } };
}

test('parser-time header binding uses the saved theme before app mounting and stays synchronized with user/system changes', () => {
  for (const saved of ['dark', 'light']) {
    const storage = new Map([['decision_maker_theme', saved]]);
    const current = page(storage, saved !== 'dark');
    const attributes = new Map();
    const button = { setAttribute: (key, value) => attributes.set(key, value) };
    current.mountHeader(button);
    assert.equal(attributes.get('aria-pressed'), String(saved === 'dark'));
    assert.equal(attributes.get('aria-label'), 'Optical Mode: switch to ' + (saved === 'dark' ? 'Solar Diagnostic' : 'Deep Space'));
    assert.equal(storage.get('decision_maker_theme'), saved);
    current.theme.toggle();
    assert.equal(attributes.get('aria-pressed'), String(saved !== 'dark'));
    assert.equal(current.root.dataset.theme, saved === 'dark' ? 'light' : 'dark');
  }
  const current = page(new Map(), false);
  const attributes = new Map();
  current.mountHeader({ setAttribute: (key, value) => attributes.set(key, value) });
  current.systemChange(true);
  assert.equal(attributes.get('aria-pressed'), 'true');
  assert.equal(attributes.get('aria-label'), 'Optical Mode: switch to Solar Diagnostic');
});

test('saved optical mode overrides system preference and survives page reload', () => {
  const storage = new Map([['decision_maker_theme', 'light']]);
  const first = page(storage, true);
  assert.equal(first.root.dataset.theme, 'light');
  first.theme.toggle();
  assert.equal(first.classes.has('dark'), true);
  assert.equal(storage.get('decision_maker_theme'), 'dark');
  const refreshed = page(storage, false);
  assert.equal(refreshed.theme.theme, 'dark');
  assert.equal(refreshed.root.style.colorScheme, 'dark');
});

test('missing or invalid preferences follow system changes until a user selects a mode', () => {
  for (const saved of [null, 'invalid']) for (const prefersDark of [true, false]) {
    const current = page(new Map(saved ? [['decision_maker_theme', saved]] : []), prefersDark);
    assert.equal(current.theme.theme, prefersDark ? 'dark' : 'light');
    current.systemChange(!prefersDark);
    assert.equal(current.theme.theme, prefersDark ? 'light' : 'dark');
    current.theme.setTheme('light');
    current.systemChange(true);
    assert.equal(current.theme.theme, 'light');
  }
});

test('optical toggle remains functional when browser storage is unavailable', () => {
  const current = page(new Map(), false, true);
  assert.equal(current.theme.theme, 'light');
  current.theme.toggle();
  assert.equal(current.theme.theme, 'dark');
  assert.equal(current.classes.has('dark'), true);
});

test('canvas chart recoloring preserves simulation values while updating axis and tooltip contrast', () => {
  const values = [12, 25, 17];
  const updates = [];
  const chart = {
    options: { scales: { x: { grid: {}, ticks: {}, border: {} }, y: { grid: {}, ticks: {}, border: {} } }, plugins: { legend: { labels: {} }, tooltip: {} } },
    data: { datasets: [{ label: 'A', data: values }, { label: 'B', data: [9, 30, 15] }] },
    update(mode) { updates.push(mode); }
  };
  applyChartTheme(chart, 'light');
  assert.equal(chart.options.scales.x.grid.color, '#e2e8f0');
  assert.equal(chart.options.scales.x.grid.lineWidth, .5);
  assert.equal(chart.options.scales.y.ticks.color, '#334155');
  assert.equal(chart.options.plugins.tooltip.bodyColor, '#0f172a');
  assert.equal(chart.data.datasets[0].borderColor, '#0891b2');
  assert.equal(chart.data.datasets[1].borderColor, '#7c3aed');
  applyChartTheme(chart, 'dark');
  assert.equal(chart.options.scales.y.grid.color, 'rgba(255,255,255,0.1)');
  assert.equal(chart.options.plugins.tooltip.bodyColor, '#e2e8f0');
  assert.equal(chart.data.datasets[0].borderColor, '#00f3ff');
  assert.equal(chart.data.datasets[0].data, values);
  assert.deepEqual(updates, ['none', 'none']);
});
