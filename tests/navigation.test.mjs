import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { ModuleNavigation, MODULES } from '../dist/navigation.js';
import { MatrixOptions } from '../dist/options-state.js';

const script = await readFile(new URL('../dist/navigation-preference.js', import.meta.url), 'utf8');
const tabBoot = await readFile(new URL('../dist/navigation-boot.js', import.meta.url), 'utf8');
function boot(storage = new Map(), denied = false) {
  const classes = new Set();
  const root = { dataset: {}, classList: { add: value => classes.add(value), contains: value => classes.has(value) } }, window = {}, writes = [];
  runInNewContext(script, { window, document: { documentElement: root }, localStorage: {
    getItem(key) { if (denied) throw Error('blocked'); return storage.get(key) ?? null; },
    setItem(key, value) { if (denied) throw Error('blocked'); writes.push([key, value]); storage.set(key, value); }
  }});
  return { preference: window.DecisionNavigation, root, writes };
}
function documentStub() {
  const strip = { scrollLeft: 0, clientWidth: 400 }, views = {}, tabs = [];
  for (const [module, info] of Object.entries(MODULES)) {
    views[module.toLowerCase() + '-view'] = { hidden: module !== 'MATRIX' };
    const events = new Map(), attributes = new Map();
    tabs.push({ dataset: { module }, events, attributes, parentElement: strip,
      offsetLeft: (Number(info.index) - 1) * 150, offsetWidth: 140,
      addEventListener: (type, listener) => events.set(type, listener),
      setAttribute: (key, value) => attributes.set(key, value), focus() { this.focused = true; } });
  }
  const announcement = {};
  return { tabs, views, strip, document: {
    querySelectorAll: () => tabs,
    getElementById: id => id === 'active-module-announcement' ? announcement : views[id]
  }};
}

test('all four saved tab IDs restore before paint without loading any live choices or simulations', () => {
  for (const [module, info] of Object.entries(MODULES)) {
    const storage = new Map([['oddm_active_tab', info.index], ['optionA', 'ignored legacy text']]);
    const page = boot(storage);
    assert.equal(page.preference.activeModule, module);
    assert.equal(page.root.dataset.activeModule, module);
    assert.equal(page.root.classList.contains('preload'), true);
    assert.deepEqual(page.writes, []);
    const live = new MatrixOptions().state;
    assert.equal(live.a, ''); assert.equal(live.b, '');
    assert.equal(live.matrixState.hasRun, false); assert.equal(live.fightWinner, null);
  }
});

test('parser boot selects and scrolls the saved tab without loading the application controllers', () => {
  for (const [module, info] of Object.entries(MODULES)) {
    const page = boot(new Map([['oddm_active_tab', info.index]]));
    const dom = documentStub();
    runInNewContext(tabBoot, { window: { DecisionNavigation: page.preference, DecisionTheme: { syncToggle() {} } }, document: dom.document });
    assert.equal(dom.tabs.filter(tab => tab.attributes.get('aria-selected') === 'true').length, 1);
    for (const tab of dom.tabs) {
      assert.equal(tab.attributes.get('aria-selected'), String(tab.dataset.module === module));
      assert.equal(tab.tabIndex, tab.dataset.module === module ? 0 : -1);
      assert.equal(tab.events.size, 0); // No app lifecycle or interaction handlers yet.
    }
    const selected = dom.tabs.find(tab => tab.dataset.module === module);
    assert.ok(selected.offsetLeft + selected.offsetWidth <= dom.strip.scrollLeft + dom.strip.clientWidth);
    assert.deepEqual(page.writes, []);
  }
});

test('missing, obsolete and invalid preferences default to Matrix; unavailable storage keeps routing usable', () => {
  for (const value of [null, '', '00', '05', '06', 'TRIAL', 'toString', '__proto__']) {
    const page = boot(new Map(value === null ? [] : [['oddm_active_tab', value]]));
    assert.equal(page.preference.activeModule, 'MATRIX'); assert.equal(page.root.dataset.activeModule, 'MATRIX');
  }
  const page = boot(new Map(), true);
  page.preference.setActiveModule('TRIAL'); assert.equal(page.root.dataset.activeModule, 'TRIAL');
  assert.equal(page.preference.activeModule, 'TRIAL');
  assert.throws(() => page.preference.setActiveModule('COLLIDER'), /Unknown suite module/);
  assert.equal(page.preference.activeModule, 'TRIAL');
});

test('navigation initializes the correct panels and ARIA tabs without calling unfinished module controllers', () => {
  const original = globalThis.document;
  try {
    for (const module of Object.keys(MODULES)) {
      const dom = documentStub(); globalThis.document = dom.document;
      const page = boot(new Map([['oddm_active_tab', MODULES[module].index]]));
      let callbacks = 0;
      const navigation = new ModuleNavigation(() => callbacks++, page.preference);
      assert.equal(callbacks, 0); assert.equal(navigation.activeModule, module);
      for (const tab of dom.tabs) {
        const selected = tab.dataset.module === module;
        assert.equal(tab.attributes.get('aria-selected'), String(selected));
        assert.equal(tab.tabIndex, selected ? 0 : -1);
        assert.equal(dom.views[tab.dataset.module.toLowerCase() + '-view'].hidden, !selected);
      }
    }
  } finally { globalThis.document = original; }
});

test('click, keyboard and programmatic routing persist only the active tab and survive a fresh page', () => {
  const original = globalThis.document;
  try {
    const storage = new Map(), page = boot(storage), dom = documentStub(); globalThis.document = dom.document;
    const activated = [], navigation = new ModuleNavigation(module => activated.push(module), page.preference);
    dom.tabs[2].events.get('click')();
    assert.equal(storage.get('oddm_active_tab'), '03'); assert.equal(boot(storage).preference.activeModule, 'TRIAL');
    let prevented = false;
    dom.tabs[2].events.get('keydown')({ key: 'ArrowRight', preventDefault() { prevented = true; } });
    assert.equal(prevented, true); assert.equal(dom.tabs[3].focused, true);
    assert.equal(storage.get('oddm_active_tab'), '04'); assert.equal(boot(storage).preference.activeModule, 'ARCHIVES');
    navigation.select('MATRIX'); navigation.select('MATRIX'); navigation.select('COLLIDER');
    assert.equal(storage.get('oddm_active_tab'), '01');
    assert.deepEqual([...storage.keys()], ['oddm_active_tab']);
    assert.deepEqual(activated, ['TRIAL', 'ARCHIVES', 'MATRIX']);
    assert.equal(boot(storage).preference.activeModule, 'MATRIX');
  } finally { globalThis.document = original; }
});
