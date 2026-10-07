import test from 'node:test';
import assert from 'node:assert/strict';
import { fighterInputWarning } from '../dist/fighter-validation.js';

test('all four Matrix input branches route to the appropriate warning and missing field', () => {
  const voidWarning = fighterInputWarning({ a: ' \n', b: '\t' });
  assert.equal(voidWarning.header, '[ERR 404: VOID COMBAT PROHIBITED]'); assert.equal(voidWarning.missing, 'a');
  assert.equal(voidWarning.actionLabel, 'GO TO MATRIX [01] TO INPUT BOTH OPTIONS');
  const onlyA = fighterInputWarning({ a: ' Burger ', b: '' });
  assert.equal(onlyA.header, '[ERR 409: SOLITARY SHADOWBOXING DETECTED]'); assert.equal(onlyA.missing, 'b');
  assert.equal(onlyA.actionLabel, 'GO TO MATRIX [01] TO INPUT OPTION B');
  assert.equal(onlyA.message.split("'Burger'").length - 1, 2);
  const onlyB = fighterInputWarning({ a: '', b: 'Pizza' });
  assert.equal(onlyB.header, '[ERR 409: UNOPPOSED GLADIATOR DETECTED]'); assert.equal(onlyB.missing, 'a');
  assert.equal(onlyB.actionLabel, 'GO TO MATRIX [01] TO INPUT OPTION A');
  assert.ok(onlyB.message.includes("'Pizza'")); assert.ok(onlyB.message.includes('100.0%'));
  assert.equal(fighterInputWarning({ a: 'Burger', b: 'Pizza' }), null);
});

test('warning phrasing preserves literal names and reflects live changes without retaining an old branch', () => {
  const name = "<b>Pizza</b> $& [Option A]";
  assert.ok(fighterInputWarning({ a: name, b: '' }).message.includes(name));
  assert.ok(fighterInputWarning({ a: '', b: name }).message.includes(name));
  const pair = { a: 'Burger', b: '' };
  assert.equal(fighterInputWarning(pair).missing, 'b');
  pair.b = 'Pizza'; assert.equal(fighterInputWarning(pair), null);
  pair.a = ''; assert.equal(fighterInputWarning(pair).missing, 'a');
  pair.b = ''; assert.equal(fighterInputWarning(pair).status, 'VOID COMBAT PROHIBITED');
});

test('identity conflicts precede plurals, preserve both names and route correction to Option B', () => {
  for (const [a, b] of [['pizza', 'pizza'], [' Pizza ', 'PIZZA'], ['pizza!', 'Pizza.'], ['tacos', 'TACOS']]) {
    const warning = fighterInputWarning({ a, b });
    assert.equal(warning.header, '[ERR 422: TAUTOLOGICAL COMBAT PARADOX]');
    assert.equal(warning.missing, 'b'); assert.equal(warning.actionLabel, 'GO TO MATRIX [01] TO DIFFERENTIATE OPTIONS');
    assert.ok(warning.message.includes(`'${a.trim()}'`)); assert.ok(warning.message.includes(`'${b.trim()}'`));
  }
  assert.equal(fighterInputWarning({ a: '', b: 'pizza' }).status, 'UNOPPOSED GLADIATOR DETECTED');
  assert.equal(fighterInputWarning({ a: 'pizza', b: ' ' }).status, 'SOLITARY SHADOWBOXING DETECTED');
});

test('regular plural conflicts are symmetric and disappear after providing distinct choices', () => {
  for (const [a, b] of [['pizza', 'pizzas'], ['taco', 'tacos'], ['box', 'boxes'], ['sandwich', 'sandwiches'], ['berry', 'berries'], ['taco!', 'Tacos.']]) {
    for (const [left, right] of [[a, b], [b, a]]) {
      const warning = fighterInputWarning({ a: left, b: right });
      assert.equal(warning.header, '[ERR 418: GRAMMATICAL DUPLICATION DETECTED]');
      assert.equal(warning.missing, 'b'); assert.equal(warning.actionLabel, 'GO TO MATRIX [01] TO FIX GRAMMATICAL DUPLICATE');
      assert.ok(warning.message.includes(`'${left}'`)); assert.ok(warning.message.includes(`'${right}'`));
    }
  }
  assert.equal(fighterInputWarning({ a: 'pizza', b: 'burger' }), null);
  assert.equal(fighterInputWarning({ a: 'Moza R5', b: 'Fanatec DD' }), null);
});
