import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DecisionEngine as Engine } from '../dist/engine.js';
import { CONTEXT_GROUPS, getContext } from '../dist/contexts.js';
import { validateOptions, validationMessage } from '../dist/validation.js';

function seeded(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const input = { a: 'Moza R5', b: 'Fanatec CSL DD', context: 'wheelbase', chaos: 42 };
const simulate = (params = input, random = seeded(1), progress) => Engine.run(params, progress, random, async () => {});

test('blank, whitespace-only and case-insensitive duplicate inputs are rejected', async () => {
  for (const [a, b, code] of [['', '', 'blank'], ['   ', 'X', 'blank'], ['X', '\t', 'blank'], [' Moza R5 ', 'mOZa r5', 'exact-match']]) {
    assert.equal(validateOptions(a, b).code, code);
    let progress = false;
    await assert.rejects(simulate({ ...input, a, b }, seeded(1), () => progress = true), /Invalid decision options/);
    assert.equal(progress, false);
  }
  assert.deepEqual(validateOptions('  A ', 'B  '), { valid: true, a: 'A', b: 'B' });
});
test('all five categories and fourteen context options exist in the HTML selector', async () => {
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.equal(CONTEXT_GROUPS.length, 5);
  assert.equal(CONTEXT_GROUPS.flatMap(group => group.options).length, 14);
  for (const group of CONTEXT_GROUPS) for (const [id, title] of group.options) {
    assert.equal(getContext(id).title, title);
    assert.ok(html.includes('value="' + id + '"'), id);
  }
});
test('sarcastic validation selects all four duplicate messages and all three blank messages', () => {
  const duplicate = validateOptions('Moza R5', 'moza r5');
  assert.equal(new Set([.01, .26, .51, .76].map(value => validationMessage(duplicate, () => value))).size, 4);
  assert.equal(new Set([.01, .34, .67].map(value => validationMessage(validateOptions('', ''), () => value))).size, 3);
});
test('names and context cannot confer scoring advantages', async () => {
  const original = await simulate({ ...input, a: 'Tacos', b: 'Salad' }, seeded(81));
  const renamed = await simulate({ ...input, a: 'Salad', b: 'Tacos', context: 'smartphone' }, seeded(81));
  for (const key of ['a', 'b', 'distributionA', 'distributionB', 'winner', 'probability']) assert.deepEqual(original[key], renamed[key]);
});
test('every run produces 10,000 outcomes, normalized histograms and a valid Wilson interval', async () => {
  const counts = [], result = await simulate(input, seeded(7), count => counts.push(count));
  assert.equal(result.samples, 10_000); assert.equal(counts.length, 20); assert.equal(counts.at(-1), 10_000);
  for (const values of [result.distributionA, result.distributionB]) assert.ok(Math.abs(values.reduce((sum, value) => sum + value, 0) - 100) < 1e-9);
  for (const stats of [result.a, result.b]) assert.ok(Object.values(stats).every(Number.isFinite));
  assert.ok(result.ci[0] <= result.probability && result.ci[1] >= result.probability);
  assert.equal(new Set(result.threats.map(threat => threat.name)).size, 5);
});
test('high chaos increases standard deviation, tail risk and unclipped extremes', async () => {
  const low = await simulate({ ...input, chaos: 1 }, seeded(42));
  const high = await simulate({ ...input, chaos: 100 }, seeded(42));
  assert.ok(low.a.sd < 3 && low.b.sd < 3);
  assert.ok(high.a.sd > low.a.sd * 10 && high.b.sd > low.b.sd * 10);
  assert.ok(high.a.tail > low.a.tail + 10 && high.b.tail > low.b.tail + 10);
  assert.ok(high.a.min < 0 && high.a.max > 100);
  assert.ok(high.shockProbability > low.shockProbability);
});
test('seeded repeated high-chaos runs can select either option and refresh distributions, threats and weights', async () => {
  let aWins = 0, previous;
  for (let seed = 1; seed <= 80; seed++) {
    const result = await simulate({ ...input, chaos: 95 }, seeded(seed));
    if (result.winner === 'a') aWins++;
    if (previous) {
      assert.notDeepEqual(result.distributionA, previous.distributionA);
      assert.notDeepEqual(result.threats, previous.threats);
      assert.notDeepEqual(result.nodeWeights, previous.nodeWeights);
    }
    previous = result;
  }
  assert.ok(aWins >= 25 && aWins <= 55, 'Expected symmetric winner frequency, got A wins: ' + aWins);
});
test('initial page has blank inputs and no automatic preflight run', async () => {
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  for (const id of ['option-a', 'option-b']) assert.ok(!html.match(new RegExp('<input id="' + id + '"[^>]*value=')));
  assert.ok(html.includes('id="winner">MATRIX IDLE'));
  assert.ok(!app.includes('run(params(),true)'));
});
