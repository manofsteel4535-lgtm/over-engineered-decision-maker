import test from 'node:test';
import assert from 'node:assert/strict';
import { isSemanticDuplicate, isPluralMatch, normalizeOption, validateOptions, validationMessage, validationPresentation, capitalizeOption, EXACT_MATCH_ERROR_POOL, PLURAL_MATCH_ERROR_POOL } from '../dist/validation.js';
import { DecisionEngine } from '../dist/engine.js';

const pairs = [
  ['Burger', 'burgers'], ['taco', 'TACOS!'], ['box', 'boxes'],
  ['sandwich', 'sandwiches'], ['berry', 'berries'],
  ['  BURGER.,!  ', 'burger'], ['fresh berry', 'fresh berries'],
  ['peachs', 'peaches'] // Both suffix variants have the same stem, length > 3.
];

test('regular plural, case and trailing punctuation duplicates match in either order', () => {
  for (const [a, b] of pairs) {
    assert.equal(isSemanticDuplicate(a, b), true, a + ' / ' + b);
    assert.equal(isSemanticDuplicate(b, a), true, b + ' / ' + a);
    assert.equal(validateOptions(a, b).code, normalizeOption(a) === normalizeOption(b) ? 'exact-match' : 'plural-match');
  }
  assert.equal(normalizeOption('  TaCo ! , ...  '), 'taco');
});

test('semantic duplicates cannot consume random draws or enter Monte Carlo processing', async () => {
  for (const [a, b] of pairs) {
    let draws = 0, progress = 0;
    await assert.rejects(DecisionEngine.run(
      { a, b, context: 'workplace-lunch', chaos: 42 },
      () => progress++, () => { draws++; return .5; }, async () => {}
    ), /Invalid decision options: (exact-match|plural-match)/);
    assert.equal(draws, 0);
    assert.equal(progress, 0);
  }
});

test('punctuation-only choices are missing input and preserve the appropriate focus target', () => {
  assert.equal(isSemanticDuplicate('!!!', '...'), false);
  assert.equal(validateOptions(' .,! ', 'burger').code, 'blank');
  assert.equal(validateOptions(' .,! ', 'burger').field, 'option-a');
  assert.equal(validateOptions('burger', '!!!').field, 'option-b');
});

test('distinct brands, models and short nonmatching stems remain valid', async () => {
  for (const [a, b] of [['Moza R5', 'Fanatec DD'], ['Moza R5', 'Moza R9'], ['burger', 'salad'], ['class', 'clash'], ['bus', 'bues']]) {
    assert.equal(isSemanticDuplicate(a, b), false, a + ' / ' + b);
    assert.equal(validateOptions(a, b).valid, true);
  }
  const result = await DecisionEngine.run({ a: 'Moza R5', b: 'Fanatec DD', context: 'wheelbase', chaos: 42 }, undefined, Math.random, async () => {});
  assert.equal(result.samples, 10_000);
  assert.ok(Number.isFinite(result.probability));
});

test('all four plural warning templates are selectable and capitalize inserted choices', () => {
  const validation = validateOptions('Burger!', 'BURGERS');
  const messages = [.01, .26, .51, .76].map(value => validationMessage(validation, () => value));
  assert.equal(new Set(messages).size, 4);
  for (const message of messages.slice(0, 3)) {
    assert.ok(message.includes(capitalizeOption(validation.a)));
    assert.ok(message.includes(capitalizeOption(validation.b)));
    assert.ok(!message.includes('[Option'));
  }
  assert.ok(messages[3].startsWith('SYNTACTIC CHEAT ATTEMPT'));
});

test('identity precedes plurality and each modal has its own header, button and focus target', () => {
  for (const [a, b] of [['burger', 'burger'], [' Burger ', 'BURGER'], ['burger!', 'Burger.,']]) {
    const result = validateOptions(a, b);
    assert.equal(result.code, 'exact-match');
    assert.equal(result.field, 'option-a');
    assert.equal(isPluralMatch(a, b), false);
    assert.equal(validationPresentation(result).header, '[ERR 400: IDENTITY PARADOX DETECTED]');
    assert.equal(validationPresentation(result).buttonText, 'ACKNOWLEDGE MY HUMANITY');
  }
  const plural = validateOptions('burger', 'burgers');
  assert.equal(plural.code, 'plural-match');
  assert.equal(plural.field, 'option-b');
  assert.equal(validationPresentation(plural).header, '[WARN 409: SEMANTIC PLURALITY DETECTED]');
  assert.equal(validationPresentation(plural).buttonText, 'ACKNOWLEDGE & RE-INPUT');
});

test('alternating both immutable pools never mixes templates and replaces every capitalized token', () => {
  const exact = validateOptions('burger deluxe', 'BURGER DELUXE');
  const plural = validateOptions('burger deluxe', 'burger deluxes');
  const snapshots = [EXACT_MATCH_ERROR_POOL.slice(), PLURAL_MATCH_ERROR_POOL.slice()];
  assert.notEqual(EXACT_MATCH_ERROR_POOL, PLURAL_MATCH_ERROR_POOL);
  for (let index = 0; index < 4; index++) for (const [result, pool] of [[exact, EXACT_MATCH_ERROR_POOL], [plural, PLURAL_MATCH_ERROR_POOL], [exact, EXACT_MATCH_ERROR_POOL]]) {
    const expected = pool[index].replace(/\[Option ([AB])\]/g, (_, position) => capitalizeOption(position === 'A' ? result.a : result.b));
    const message = validationMessage(result, () => (index + .1) / 4);
    assert.equal(message, expected);
    assert.ok(!message.includes('[Option'));
  }
  assert.deepEqual(EXACT_MATCH_ERROR_POOL, snapshots[0]);
  assert.deepEqual(PLURAL_MATCH_ERROR_POOL, snapshots[1]);
  assert.equal(capitalizeOption('  bUrGeR deluxe!  '), 'Burger Deluxe!');
  const literal = validateOptions('burger $&', 'BURGER $&');
  assert.ok(validationMessage(literal, () => 0).includes('Burger $&'));
});
